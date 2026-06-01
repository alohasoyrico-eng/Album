/**
 * mapLayout — server-only precomputation of the SemanticMap layout.
 *
 * Why this exists
 * ────────────────
 * The map runs a d3-force simulation over ~1300 nodes. Doing that in
 * the browser cost ~5 seconds of continuous setState + SVG
 * reconciliation on every home-page visit — the single most expensive
 * thing in the project. The simulation is deterministic given the
 * input data, so there's no reason to recompute it per visitor.
 *
 * This module imports d3-force + the seed catalogues, runs the
 * simulation to completion at a canonical viewport (1920 × 1080),
 * and exports the final node positions + the curated / emergent
 * link sets. Next.js evaluates this module at build time as a side
 * effect of `page.tsx` importing it — the result is bundled into
 * the static HTML payload that Cloudflare serves from the edge.
 *
 * The client `SemanticMap` then receives these as props, skips its
 * own simulation entirely, and ships zero d3-force runtime cost.
 *
 * Canonical viewport
 * ───────────────────
 * 1920 × 1080 is the assumed reference. The SVG `viewBox` lets the
 * browser scale the layout to whatever the actual viewport is — the
 * layout's relative shape (which clan sits next to which tribe) is
 * preserved regardless of screen size. d3-zoom on the client adds
 * pan + zoom on top.
 */

import * as d3 from "d3";
import { EMOTIONS } from "@/data/ontology/emotions";
import { TRIBE_MAP, TRIBES } from "@/data/ontology/tribes";
import { ARTWORKS } from "@/data/seed/artworks";
import { TRACKS } from "@/data/seed/music";
import { FILMS } from "@/data/seed/films";
import { POEMS } from "@/data/seed/poetry";
import { SCULPTURES } from "@/data/seed/sculpture";
import { DANCES } from "@/data/seed/dance";
import { ARCHITECTURES } from "@/data/seed/architecture";
import { PHOTOGRAPHS } from "@/data/seed/photography";
import { LITERATURES } from "@/data/seed/literature";
import { RITUALS } from "@/data/seed/ritual";
import { THEATERS } from "@/data/seed/theater";
import { COLORS } from "@/data/colors/colorResonance";
import { RESONANCE_RELATIONSHIPS } from "@/data/ontology/relationships";
import { emotionColor } from "@/lib/chromatics";
import { buildVector, cosineSimilarity } from "@/lib/resonance-vector";
import { entityColor } from "@/lib/entityColor";
import type { MapNode, MapLink, ResonanceAxes } from "@/types";

// ─── Canonical viewport ────────────────────────────────────────────
const CANVAS_W = 1920;
const CANVAS_H = 1080;

// ─── Build graph data (mirrors buildMapData in SemanticMap) ────────
function culturalColor(resonance: ResonanceAxes, id: string): string {
  return entityColor(resonance, id);
}

function buildNodes(): MapNode[] {
  const nodes: MapNode[] = [
    ...EMOTIONS.map((e) => {
      const tribalHex = TRIBE_MAP.get(e.tribe)?.color ?? "#888";
      const { hex } = emotionColor(e, tribalHex);
      return {
        id: e.id,
        type: "emotion" as const,
        label: e.name,
        tribe: e.tribe,
        clan: e.clan,
        resonance: e.resonance,
        color: hex,
        tribalColor: tribalHex,
        weight: 1.5 + (e.neighbors.length + e.transitions.length) * 0.15,
      };
    }),
    ...COLORS.map((c) => ({
      id: c.id, type: "color" as const, label: c.nameEs,
      color: c.hex, resonance: c.resonance, weight: 0.55,
    })),
    ...ARTWORKS.map((a) => ({
      id: a.id, type: "artwork" as const,
      label: a.artist.split(" ").pop() ?? a.artist,
      color: culturalColor(a.resonance, a.id), resonance: a.resonance, weight: 0.85,
    })),
    ...TRACKS.map((t) => ({
      id: t.id, type: "music" as const,
      label: t.artist.split(" ").pop() ?? t.artist,
      color: culturalColor(t.resonance, t.id), resonance: t.resonance, weight: 0.85,
    })),
    ...FILMS.map((f) => ({
      id: f.id, type: "film" as const,
      label: f.director.split(" ").pop() ?? f.director,
      color: culturalColor(f.resonance, f.id), resonance: f.resonance, weight: 0.85,
    })),
    ...POEMS.map((p) => ({
      id: p.id, type: "poem" as const,
      label: p.author.split(" ").pop() ?? p.author,
      color: culturalColor(p.resonance, p.id), resonance: p.resonance, weight: 0.8,
    })),
    ...SCULPTURES.map((s) => ({
      id: s.id, type: "sculpture" as const,
      label: s.artist.split(" ").pop() ?? s.artist,
      color: culturalColor(s.resonance, s.id), resonance: s.resonance, weight: 0.8,
    })),
    ...DANCES.map((d) => ({
      id: d.id, type: "dance" as const,
      label: d.choreographer.split(" ").pop() ?? d.choreographer,
      color: culturalColor(d.resonance, d.id), resonance: d.resonance, weight: 0.8,
    })),
    ...ARCHITECTURES.map((a) => ({
      id: a.id, type: "architecture" as const,
      label: a.architect.split(" ").pop() ?? a.architect,
      color: culturalColor(a.resonance, a.id), resonance: a.resonance, weight: 0.8,
    })),
    ...PHOTOGRAPHS.map((p) => ({
      id: p.id, type: "photography" as const,
      label: p.photographer.split(" ").pop() ?? p.photographer,
      color: culturalColor(p.resonance, p.id), resonance: p.resonance, weight: 0.8,
    })),
    ...LITERATURES.map((l) => ({
      id: l.id, type: "literature" as const,
      label: l.author.split(" ").pop() ?? l.author,
      color: culturalColor(l.resonance, l.id), resonance: l.resonance, weight: 0.8,
    })),
    ...RITUALS.map((r) => ({
      id: r.id, type: "ritual" as const,
      label: r.title.split(/[—-]/)[0].trim().split(" ").slice(0, 2).join(" "),
      color: culturalColor(r.resonance, r.id), resonance: r.resonance, weight: 0.8,
    })),
    ...THEATERS.map((t) => ({
      id: t.id, type: "theater" as const,
      label: t.author.split(" ").pop() ?? t.author,
      color: culturalColor(t.resonance, t.id), resonance: t.resonance, weight: 0.8,
    })),
  ];
  return nodes;
}

function buildCuratedLinks(nodes: MapNode[]): MapLink[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  return RESONANCE_RELATIONSHIPS.filter(
    (r) => r.strength > 0.65 && nodeIds.has(r.source) && nodeIds.has(r.target),
  ).map((r) => ({
    source: r.source, target: r.target,
    strength: r.strength, ambiguity: r.ambiguity,
    resonanceType: r.resonanceType,
  }));
}

function buildEmergentLinks(nodes: MapNode[], topK = 4, minSim = 0.86): MapLink[] {
  const withVectors = nodes
    .filter((n): n is MapNode & { resonance: ResonanceAxes } => Boolean(n.resonance))
    .map((n) => ({ node: n, vector: buildVector(n.resonance) }));
  type Edge = { source: string; target: string; sim: number };
  const edges: Edge[] = [];
  for (let i = 0; i < withVectors.length; i++) {
    for (let j = i + 1; j < withVectors.length; j++) {
      const sim = cosineSimilarity(withVectors[i].vector, withVectors[j].vector);
      if (sim >= minSim) {
        edges.push({ source: withVectors[i].node.id, target: withVectors[j].node.id, sim });
      }
    }
  }
  // top-K per node
  const perNode: Record<string, Edge[]> = {};
  for (const e of edges) {
    (perNode[e.source] ??= []).push(e);
    (perNode[e.target] ??= []).push(e);
  }
  const kept = new Set<string>();
  for (const id of Object.keys(perNode)) {
    perNode[id].sort((a, b) => b.sim - a.sim);
    for (const e of perNode[id].slice(0, topK)) {
      kept.add(`${e.source}|${e.target}`);
    }
  }
  return edges
    .filter((e) => kept.has(`${e.source}|${e.target}`))
    .map((e) => ({
      source: e.source, target: e.target,
      strength: e.sim, ambiguity: 1 - e.sim,
      resonanceType: "emergent",
    }));
}

// ─── Node radius (used by collision force) ─────────────────────────
function nodeRadius(node: MapNode): number {
  const base = node.type === "emotion" ? 12 : 4.5;
  return base * (node.weight ?? 1);
}

// ─── Radial tribe positions ────────────────────────────────────────
function radialPositions(w: number, h: number): Record<string, { x: number; y: number }> {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.34;
  const out: Record<string, { x: number; y: number }> = {};
  const tribeIds = TRIBES.map((t) => t.id);
  tribeIds.forEach((id, i) => {
    const angle = (i / tribeIds.length) * Math.PI * 2 - Math.PI / 2;
    out[id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  return out;
}

// ─── Custom forces (mirror of SemanticMap.tsx) ─────────────────────
function clusterForce(nodes: MapNode[], w: number, h: number) {
  const tribePositions = radialPositions(w, h);
  return (alpha: number) => {
    for (const node of nodes) {
      if (node.tribe && tribePositions[node.tribe]) {
        const target = tribePositions[node.tribe];
        const r = node.resonance;
        const grav = r ? 0.05 + (r.density / 100) * 0.06 + ((100 - r.energy) / 100) * 0.03 : 0.06;
        if (node.x !== undefined) node.vx = (node.vx ?? 0) + (target.x - node.x) * alpha * grav;
        if (node.y !== undefined) node.vy = (node.vy ?? 0) + (target.y - node.y) * alpha * grav;
      }
    }
  };
}

function clanForce(nodes: MapNode[]) {
  const clanGroups: Record<string, MapNode[]> = {};
  for (const n of nodes) {
    if (n.type === "emotion" && n.clan) (clanGroups[n.clan] ??= []).push(n);
  }
  return (alpha: number) => {
    for (const clanId of Object.keys(clanGroups)) {
      const group = clanGroups[clanId];
      if (group.length < 2) continue;
      let cx = 0, cy = 0, k = 0;
      for (const n of group) {
        if (n.x !== undefined && n.y !== undefined) { cx += n.x; cy += n.y; k++; }
      }
      if (!k) continue;
      cx /= k; cy /= k;
      const pull = 0.04;
      for (const n of group) {
        if (n.x !== undefined && n.y !== undefined) {
          n.vx = (n.vx ?? 0) + (cx - n.x) * alpha * pull;
          n.vy = (n.vy ?? 0) + (cy - n.y) * alpha * pull;
        }
      }
    }
  };
}

function resonanceGravityForce(
  nodes: Array<MapNode & { resonance?: ResonanceAxes }>,
): (alpha: number) => void {
  const emotionNodes = nodes.filter((n) => n.type === "emotion" && n.resonance);
  const emotionVectors = emotionNodes.map((n) => ({ node: n, vector: buildVector(n.resonance!) }));
  type Anchor = { emotionNode: MapNode; weight: number };
  const culturalAnchors = new Map<string, Anchor[]>();
  const pullByType = new Map<string, number>();
  for (const n of nodes) {
    if (n.type === "emotion") continue;
    if (!n.resonance) continue;
    const myVector = buildVector(n.resonance);
    const scored = emotionVectors
      .map((e) => ({ node: e.node, sim: cosineSimilarity(myVector, e.vector) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
    if (scored.length === 0) continue;
    const total = scored.reduce((s, x) => s + x.sim, 0) || 1;
    culturalAnchors.set(n.id, scored.map((s) => ({ emotionNode: s.node, weight: s.sim / total })));
    pullByType.set(n.id, n.type === "color" ? 0.18 : 0.16);
  }
  return (alpha: number) => {
    for (const node of nodes) {
      const anchors = culturalAnchors.get(node.id);
      if (!anchors || node.x === undefined || node.y === undefined) continue;
      let tx = 0, ty = 0;
      for (const a of anchors) {
        if (a.emotionNode.x === undefined || a.emotionNode.y === undefined) continue;
        tx += a.emotionNode.x * a.weight;
        ty += a.emotionNode.y * a.weight;
      }
      const pull = pullByType.get(node.id) ?? 0.08;
      node.vx = (node.vx ?? 0) + (tx - node.x) * alpha * pull;
      node.vy = (node.vy ?? 0) + (ty - node.y) * alpha * pull;
    }
  };
}

// ─── The actual precompute ─────────────────────────────────────────
//
// Module-level IIFE: runs ONCE when this module first loads. Inside
// Next.js's build, that's at SSG time per route that imports it.
// Subsequent requests reuse the cached export. The simulation takes
// ~200-500 ms on build hardware; users never see it.

export interface MapLayoutPayload {
  nodes: MapNode[];
  curatedLinks: MapLink[];
  emergentLinks: MapLink[];
  /** Canonical viewport the positions are computed against. The client
   *  SVG uses this in its viewBox so all viewports see the same shape. */
  viewBox: { w: number; h: number };
}

function computeLayout(): MapLayoutPayload {
  const nodes = buildNodes();
  const curatedLinks = buildCuratedLinks(nodes);
  const emergentLinks = buildEmergentLinks(nodes);

  const sim = d3
    .forceSimulation<MapNode, MapLink>(nodes)
    .force("link", d3.forceLink<MapNode, MapLink>(curatedLinks)
      .id((d) => d.id)
      .distance((d) => 120 - d.strength * 60)
      .strength((d) => d.strength * 0.4))
    .force("charge", d3.forceManyBody().strength(-280).distanceMax(400))
    .force("collision", d3.forceCollide<MapNode>((d) => nodeRadius(d) + 18))
    .force("center", d3.forceCenter(CANVAS_W / 2, CANVAS_H / 2).strength(0.05))
    .force("cluster", clusterForce(nodes, CANVAS_W, CANVAS_H))
    .force("clan", clanForce(nodes))
    .force("resonance-gravity", resonanceGravityForce(nodes))
    .alphaDecay(0.015)
    .velocityDecay(0.35)
    .stop();

  // Tick until alpha decays below the default threshold (~0.001).
  // 300 iterations is comfortably above what's needed.
  for (let i = 0; i < 300; i++) sim.tick();

  return {
    nodes,
    curatedLinks,
    emergentLinks,
    viewBox: { w: CANVAS_W, h: CANVAS_H },
  };
}

// Module-level cache. Build sees this once; subsequent imports reuse.
export const MAP_LAYOUT: MapLayoutPayload = computeLayout();
