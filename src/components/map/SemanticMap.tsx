"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { useMapStore } from "@/lib/store";
import { EMOTIONS, EMOTION_MAP } from "@/data/ontology/emotions";
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
import { TRIBES, TRIBE_MAP } from "@/data/ontology/tribes";
import { RESONANCE_RELATIONSHIPS } from "@/data/ontology/relationships";
import { CLAN_MAP } from "@/data/ontology/clans";
import { trackEvent } from "@/lib/analytics";
import { NodeFullPreview } from "./NodeFullPreview";
import { AtmosphericField } from "./AtmosphericField";
import { personalityOffset, linkInstability } from "./personality";
import { COLORS } from "@/data/colors/colorResonance";
import { emotionColor } from "@/lib/chromatics";
import { buildVector, cosineSimilarity } from "@/lib/resonance-vector";
import { emotionMotion, deriveMotion } from "@/lib/emotionMotion";
import { entityColor } from "@/lib/entityColor";
// Universal colour resolver: every cultural node (and every future
// non-emotion entity) goes through entityColor() — cosine top-K against
// the 224-colour catalogue + id-fingerprint pick. Guarantees catalogue
// diversity instead of the recipe-averaging that previously collapsed
// everything to grey. See lib/entityColor.ts for the full design.
function culturalColor(resonance: import("@/types").ResonanceAxes, id: string): string {
  return entityColor(resonance, id);
}
import type { MapNode, MapLink, ResonanceAxes } from "@/types";
// ─── Build graph data ─────────────────────────────────────────────────────────
function buildMapData() {
  const nodes: MapNode[] = [
    ...EMOTIONS.map((e) => {
      const tribalHex = TRIBE_MAP.get(e.tribe)?.color ?? "#888";
      // SAME colour as the EmotionDetail / ChromaticBreakdown: the recipe's
      // finalHex. Map and detail surface the identical hex so the breakdown
      // you see in /emotion/[id] is the same dot you saw in the constellation.
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
    // Colour nodes — kept in the graph but pulled gravitationally tight
    // onto their nearest-resonant emotion (see culturalAnchors below).
    // The intention is integration: each emotion ends up surrounded by a
    // small cluster of its catalogue petals, reading as one constellation
    // rather than a separate outer ring of swatches.
    ...COLORS.map((c) => ({
      id: c.id,
      type: "color" as const,
      label: c.nameEs,
      color: c.hex,
      resonance: c.resonance,
      weight: 0.55,
    })),
    // All cultural entities — labels only on emotions and colors;
    // the rest render as glyphs so the map doesn't crowd
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
  const nodeIds = new Set(nodes.map((n) => n.id));
  const curatedLinks: MapLink[] = RESONANCE_RELATIONSHIPS.filter(
    (r) => r.strength> 0.65 && nodeIds.has(r.source) && nodeIds.has(r.target)
  ).map((r) => ({
    source: r.source,
    target: r.target,
    strength: r.strength,
    ambiguity: r.ambiguity,
    resonanceType: r.resonanceType,
  }));
  // ─── Emergent links — inferred by cosine similarity ─────────────────────
  // For each pair of visible nodes (where both have a resonance), compute
  // cosine similarity in the unified vector space. Keep only the top K
  // strongest connections PER node so the map doesn't drown in links.
  const emergentLinks: MapLink[] = computeEmergentLinks(nodes, 4, 0.86);
  return { nodes, curatedLinks, emergentLinks };
}
/**
 * Compute emergent links: cosine-similarity neighborhoods among visible nodes.
 *
 * @param nodes    The full set of map nodes (with resonance on each)
 * @param topK     Maximum number of links to keep per node
 * @param minSim   Minimum cosine similarity to consider a link valid
 */
function computeEmergentLinks(
  nodes: Array<MapNode & { resonance?: ResonanceAxes }>,
  topK: number,
  minSim: number,
): MapLink[] {
  const withVectors = nodes
    .filter((n): n is MapNode & { resonance: ResonanceAxes } => Boolean(n.resonance))
    .map((n) => ({ node: n, vector: buildVector(n.resonance) }));
  type Edge = { source: string; target: string; sim: number };
  const edges: Edge[] = [];
  // Compute all pairs (218^2 ≈ 47000 ops; fast for a single pass)
  for (let i = 0; i < withVectors.length; i++) {
    for (let j = i + 1; j < withVectors.length; j++) {
      const sim = cosineSimilarity(withVectors[i].vector, withVectors[j].vector);
      if (sim>= minSim) {
        edges.push({
          source: withVectors[i].node.id,
          target: withVectors[j].node.id,
          sim,
        });
      }
    }
  }
  // Sort overall by similarity, then enforce top-K per node
  edges.sort((a, b) => b.sim - a.sim);
  const perNodeCount: Record<string, number> = {};
  const kept: MapLink[] = [];
  for (const e of edges) {
    const sCount = perNodeCount[e.source] ?? 0;
    const tCount = perNodeCount[e.target] ?? 0;
    if (sCount>= topK || tCount>= topK) continue;
    perNodeCount[e.source] = sCount + 1;
    perNodeCount[e.target] = tCount + 1;
    kept.push({
      source: e.source,
      target: e.target,
      strength: e.sim,
      ambiguity: 1 - e.sim,
      // Custom resonance type marker so the render layer can style differently
      resonanceType: "emergent" as MapLink["resonanceType"],
    });
  }
  return kept;
}
// Per-node radius is recomputed every animation tick on ~1300 nodes; with
// deriveMotion()/emotionMotion() inside, that's the hottest path on the
// page. Cache by node id (stable for the session).
const _radiusCache = new Map<string, number>();
function nodeRadius(node: MapNode): number {
  const cached = _radiusCache.get(node.id);
  if (cached !== undefined) return cached;
  const base = node.type === "emotion" ? 12 : 4.5;
  let bias = 1;
  if (node.type === "emotion") {
    const m = emotionMotion(node.id);
    if (m) bias = m.sizeBias;
  } else if (node.resonance) {
    bias = deriveMotion(node.resonance).sizeBias;
  }
  const raw = base * bias * (node.weight ?? 1);
  const r = node.type === "emotion" ? Math.max(10, raw)
    : node.type === "color" ? Math.max(5, raw)
    : Math.max(3, raw);
  _radiusCache.set(node.id, r);
  return r;
}
// Glyph per non-emotion / non-color type. Each discipline gets its own
// Material Symbols Outlined icon, rendered via OpenType ligatures inside
// the SVG <text> elements. Emotions and colors stay as bare circles.
import { ICON, ICON_SVG_FONT } from "@/lib/icons";
const GLYPH: Partial<Record<string, string>> = {
  artwork:      ICON.artwork,
  music:        ICON.music,
  film:         ICON.film,
  poem:         ICON.poem,
  sculpture:    ICON.sculpture,
  dance:        ICON.dance,
  architecture: ICON.architecture,
  photography:  ICON.photography,
  literature:   ICON.literature,
  ritual:       ICON.ritual,
  theater:      ICON.theater,
};
// ─── Component ────────────────────────────────────────────────────────────────
export function SemanticMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<MapNode, MapLink> | null>(null);
  const router = useRouter();
  const { hoveredNode, selectedNode, activeFilter, activeTribe, setHoveredNode, setSelectedNode } = useMapStore();
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [links, setLinks] = useState<MapLink[]>([]);
  const [emergentLinks, setEmergentLinks] = useState<MapLink[]>([]);
  /** Which link layer(s) to render: curated (Marina), emergent (vector), or both. */
  const [linkMode, setLinkMode] = useState<"curated" | "emergent" | "both">("both");
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hoverStart, setHoverStart] = useState<number>(0);
  const [animTick, setAnimTick] = useState(0); // drives personality re-render
  // ─── Measure container ────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // ─── D3 force simulation (structural layer) ───────────────────────────────
  // The simulation uses CURATED links for structural pull (these are the
  // canonical Marina-era relationships). EMERGENT links are rendered on top
  // as the resonance-engine's inferred neighborhood.
  useEffect(() => {
    if (!dimensions.w) return;
    const { nodes: rawNodes, curatedLinks: rawCurated, emergentLinks: rawEmergent } = buildMapData();
    const sim = d3
      .forceSimulation<MapNode, MapLink>(rawNodes)
      .force("link", d3.forceLink<MapNode, MapLink>(rawCurated)
        .id((d) => d.id)
        .distance((d) => 120 - d.strength * 60)
        .strength((d) => d.strength * 0.4))
      .force("charge", d3.forceManyBody().strength(-280).distanceMax(400))
      .force("collision", d3.forceCollide<MapNode>((d) => nodeRadius(d) + 18))
      .force("center", d3.forceCenter(dimensions.w / 2, dimensions.h / 2).strength(0.05))
      .force("cluster", clusterForce(rawNodes, dimensions.w, dimensions.h))
      .force("clan", clanForce(rawNodes))
      // ─── Cultural entities orbit the emotions they actually resonate with
      .force("resonance-gravity", resonanceGravityForce(rawNodes))
      .alphaDecay(0.015)
      .velocityDecay(0.35);
    sim.on("tick", () => {
      setNodes([...rawNodes]);
      setLinks([...rawCurated]);
    });
    simulationRef.current = sim;
    setNodes(rawNodes);
    setLinks(rawCurated as MapLink[]);
    setEmergentLinks(rawEmergent as MapLink[]);
    return () => { sim.stop(); };
  }, [dimensions]);
  // ─── Personality animation loop (visual layer) ────────────────────────────
  // Only ticks when there is a pivot (hovered/selected). Without a pivot,
  // all offsets are STATIC_OFFSET = {0,0,1,0} — ticking produces identical
  // output and wastes the main thread. The map is fully idle at rest.
  useEffect(() => {
    if (!hoveredNode && !selectedNode) return;
    let raf: number;
    let last = performance.now();
    let acc = 0;
    const FRAME_MS = 1000 / 6;
    const step = (t: number) => {
      acc += t - last;
      last = t;
      if (acc >= FRAME_MS) {
        acc = 0;
        setAnimTick(Math.floor(t));
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hoveredNode, selectedNode]);
  // ─── Zoom & pan ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    d3.select(svgRef.current).call(zoom);
  }, [dimensions]);
  // ─── Hover tracking (for progressive reveal) ──────────────────────────────
  useEffect(() => {
    if (hoveredNode) setHoverStart(performance.now());
  }, [hoveredNode]);
  // ─── Esc closes the pinned preview ────────────────────────────────────────
  useEffect(() => {
    if (!selectedNode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNode, setSelectedNode]);
  // Auto-zoom on hover was removed: it competed with the user's own
  // wheel/drag zoom and felt erratic. Pan + zoom remain available via
  // mouse wheel and drag, owned entirely by the user.
  // ─── Derived: who is connected to the hovered/selected node ───────────────
  const pivot = hoveredNode ?? selectedNode;
  const connectedIds = useMemo(() => {
    if (!pivot) return new Set<string>();
    const s = new Set<string>([pivot]);
    const eat = (sid: string, tid: string) => {
      if (sid === pivot) s.add(tid);
      else if (tid === pivot) s.add(sid);
    };
    // CURATED links (Marina-encoded relationships)
    for (const l of links) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      eat(sId, tId);
    }
    // EMERGENT links (vector cosine, top-K per pivot). Without including
    // these, the endpoints of dashed teal lines drawn FROM the pivot
    // stayed at the background opacity (0.06) and visually disappeared
    // beneath the atmospheric texture — only the line was visible.
    for (const l of emergentLinks) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      eat(sId, tId);
    }
    return s;
  }, [pivot, links, emergentLinks]);
  // Clan centroids — used to render floating clan labels and a subtle aura
  // around each clan's region. Computed only over emotion nodes so that
  // color/artwork/music nodes don't shift the geometry of a clan.
  const clanCentroids = useMemo(() => {
    type Centroid = { id: string; clanId: string; tribalColor: string; x: number; y: number; size: number };
    const groups: Record<string, MapNode[]> = {};
    for (const n of nodes) {
      if (n.type === "emotion" && n.clan && n.x !== undefined && n.y !== undefined) {
        (groups[n.clan] ??= []).push(n);
      }
    }
    const centroids: Centroid[] = [];
    for (const [clanId, group] of Object.entries(groups)) {
      if (group.length < 2) continue;
      let cx = 0, cy = 0;
      for (const n of group) { cx += n.x!; cy += n.y!; }
      cx /= group.length; cy /= group.length;
      // Approximate radius: distance to farthest member
      let maxDist = 0;
      for (const n of group) {
        const d = Math.hypot(n.x! - cx, n.y! - cy);
        if (d> maxDist) maxDist = d;
      }
      centroids.push({
        id: `centroid-${clanId}`,
        clanId,
        tribalColor: group[0].tribalColor ?? group[0].color ?? "#888",
        x: cx,
        y: cy,
        size: Math.max(28, maxDist + 22),
      });
    }
    return centroids;
  }, [nodes]);
  // Clan-mates: emotions in the same clan as the pivot
  const clanMateIds = useMemo(() => {
    if (!pivot) return new Set<string>();
    const pivotNode = nodes.find((n) => n.id === pivot);
    if (!pivotNode?.clan) return new Set<string>();
    const mates = new Set<string>();
    for (const n of nodes) {
      if (n.clan === pivotNode.clan && n.id !== pivot) mates.add(n.id);
    }
    return mates;
  }, [pivot, nodes]);
  // Echo (second-degree neighbors): latent semantic field
  const echoIds = useMemo(() => {
    if (!pivot) return new Set<string>();
    const e = new Set<string>();
    for (const l of links) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      if (connectedIds.has(sId) && !connectedIds.has(tId)) e.add(tId);
      else if (connectedIds.has(tId) && !connectedIds.has(sId)) e.add(sId);
    }
    return e;
  }, [connectedIds, links, pivot]);
  const isNodeFiltered = useCallback((node: MapNode) => {
    if (activeFilter && node.type !== activeFilter) return false;
    if (activeTribe && node.type === "emotion" && node.tribe !== activeTribe) return false;
    return true;
  }, [activeFilter, activeTribe]);
  const handleNodeClick = useCallback((node: MapNode) => {
    trackEvent("node_clicked", { nodeId: node.id, type: node.type });
    // Click-to-pin: the preview panel stays open until the user clicks
    // outside the map or another node. Navigation to the detail page
    // happens via the explicit CTA inside the panel — eliminates the
    // "card disappears before I can reach the link" UX bug.
    setSelectedNode(selectedNode === node.id ? null : node.id);
  }, [selectedNode, setSelectedNode]);
  // Suppress unused-import warning — kept for future deep links.
  void router;
  // ─── Personality offsets — only computed for ATTENTION nodes ──────────
  // Earlier we ran personalityOffset for every one of ~1300 nodes on every
  // animation tick. That's the single biggest cause of map jank.
  // Now: only pivot-related + hovered/selected nodes get the time-varying
  // jitter; the other 1200+ nodes share a single static "zero" offset.
  // Visual cost: the ambient drift only happens around what you're looking
  // at — which is exactly where it reads anyway.
  const STATIC_OFFSET: ReturnType<typeof personalityOffset> = useMemo(
    () => ({ dx: 0, dy: 0, scale: 1, glow: 0 }),
    [],
  );
  const nodeOffsets = useMemo(() => {
    const m = new Map<string, ReturnType<typeof personalityOffset>>();
    for (const n of nodes) {
      const attention =
        pivot === n.id ||
        connectedIds.has(n.id) ||
        selectedNode === n.id;
      m.set(n.id, attention ? personalityOffset(n, animTick) : STATIC_OFFSET);
    }
    return m;
  }, [nodes, animTick, pivot, connectedIds, selectedNode, STATIC_OFFSET]);
  // ─── Focus point for atmospheric field ────────────────────────────────────
  const focusPoint = useMemo(() => {
    if (!pivot) return null;
    const n = nodes.find((x) => x.id === pivot);
    if (!n || !n.x || !n.y) return null;
    const off = nodeOffsets.get(n.id);
    const x = (n.x + (off?.dx ?? 0)) * transform.k + transform.x;
    const y = (n.y + (off?.dy ?? 0)) * transform.k + transform.y;
    return { x, y };
  }, [pivot, nodes, nodeOffsets, transform]);
  if (!dimensions.w) return null;
  // Helper: resolve a link's endpoints + apply personality offsets
  const resolveLink = (l: MapLink, idx: number) => {
    const sId = typeof l.source === "object" ? (l.source as MapNode).id : (l.source as string);
    const tId = typeof l.target === "object" ? (l.target as MapNode).id : (l.target as string);
    const s = typeof l.source === "object" ? (l.source as MapNode) : nodes.find((n) => n.id === sId);
    const t = typeof l.target === "object" ? (l.target as MapNode) : nodes.find((n) => n.id === tId);
    const sOff = sId ? nodeOffsets.get(sId) : undefined;
    const tOff = tId ? nodeOffsets.get(tId) : undefined;
    return {
      ...l,
      sId,
      tId,
      sx: (s?.x ?? 0) + (sOff?.dx ?? 0),
      sy: (s?.y ?? 0) + (sOff?.dy ?? 0),
      tx: (t?.x ?? 0) + (tOff?.dx ?? 0),
      ty: (t?.y ?? 0) + (tOff?.dy ?? 0),
      idx,
    };
  };
  // Resolve link endpoints with personality offsets applied
  const linkData = links.map((l, idx) => resolveLink(l, idx));
  const emergentLinkData = emergentLinks.map((l, idx) => resolveLink(l, idx));
  // Sort links so direct ones reveal first, then echoes
  const linksByReveal = [...linkData].sort((a, b) => {
    const aDirect = a.sId === pivot || a.tId === pivot ? 1 : 0;
    const bDirect = b.sId === pivot || b.tId === pivot ? 1 : 0;
    if (aDirect !== bDirect) return bDirect - aDirect;
    return b.strength - a.strength;
  });
  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Atmospheric field — sits behind the map, reacts to active emotion */}
      <AtmosphericField
        hoveredNodeId={hoveredNode}
        selectedNodeId={selectedNode}
        width={dimensions.w}
        height={dimensions.h}
        focusPoint={focusPoint}
      />
      <svg
        ref={svgRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onClick={(e) => {
          // Click on empty canvas (not a node <g>) deselects.
          if ((e.target as SVGElement).tagName === "svg") setSelectedNode(null);
        }}
>
        <defs>
          {/* Glow filters per tribe */}
          {TRIBES.map((tribe) => (
            <filter key={tribe.id} id={`glow-${tribe.id}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" type="matrix" values={`0 0 0 0 ${hexToRgbNorm(tribe.color).join(" 0 0 0 0 ")} 0 0 0 18 -8`} result="colorBlur" />
              <feMerge>
                <feMergeNode in="colorBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {/* Soft halo for color nodes */}
          <filter id="halo-color" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="glow-default" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Clan labels — float at each clan's centroid, faint by default,
              emphasized when a member is hovered. Sits behind links/nodes. */}
          <g className="clan-labels">
            {clanCentroids.map((c) => {
              const pivotNode = pivot ? nodes.find((n) => n.id === pivot) : null;
              const isActive = pivotNode?.clan === c.clanId;
              const clan = CLAN_MAP.get(c.clanId);
              if (!clan) return null;
              return (
                <g key={c.id} transform={`translate(${c.x},${c.y})`} style={{ pointerEvents: "none" }}>
                  {/* soft aura behind the clan */}
                  <circle
                    r={c.size}
                    fill={c.tribalColor}
                    fillOpacity={isActive ? 0.06 : 0.018}
                    style={{ transition: "fill-opacity 0.5s ease" }}
                  />
                  <text
                    y={-c.size - 6}
                    textAnchor="middle"
                    fontSize={isActive ? 10 : 8.5}
                    fill={c.tribalColor}
                    fillOpacity={isActive ? 0.88 : pivot ? 0.18 : 0.38}
                    style={{
                      fontFamily: "var(--font-technical)",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      transition: "fill-opacity 0.4s ease, font-size 0.4s ease",
                    }}
>
                    {clan.name}
                  </text>
                </g>
              );
            })}
          </g>
          {/* Emergent links — selective render: only shown when a node is
              the pivot, and only the pivot's links are drawn (cleanly
              highlighting WHAT resonates with WHAT). Without a pivot, the
              field stays silent — the gravity force has already done the
              spatial work. */}
          {(linkMode === "emergent" || linkMode === "both") && pivot && (
            <g className="links-emergent" pointerEvents="none">
              {emergentLinkData
                .filter((link) => link.sId === pivot || link.tId === pivot)
                .map((link) => (
                  <line
                    key={`em-${link.sId}-${link.tId}-${link.idx}`}
                    x1={link.sx}
                    y1={link.sy}
                    x2={link.tx}
                    y2={link.ty}
                    stroke="#4A9AA0"
                    strokeWidth={Math.max(0.8, (link.strength - 0.7) * 6)}
                    strokeOpacity={0.7}
                    strokeDasharray="3 4"
                  />
                ))}
            </g>
          )}
          {/* Links — progressive reveal & ambiguity flicker. Non-interactive
              so we mark the entire group pointer-events:none, matching the
              architecture: only Layer 4 (map-hits) is clickable. */}
          <g className="links" pointerEvents="none"
             style={{ display: linkMode === "emergent" ? "none" : undefined }}>
            {linksByReveal.map((link, sortIdx) => {
              const isDirect = pivot && (link.sId === pivot || link.tId === pivot);
              const isEcho = pivot && !isDirect && (connectedIds.has(link.sId) && connectedIds.has(link.tId));
              // Progressive reveal: each direct link emerges in order
              let revealedOpacity = 1;
              if (pivot) {
                const elapsed = animTick - hoverStart;
                const delay = isDirect ? sortIdx * 55 : 600 + sortIdx * 30;
                revealedOpacity = Math.max(0, Math.min(1, (elapsed - delay) / 400));
              }
              const baseOpacity = pivot
                ? isDirect ? 0.55 : isEcho ? 0.18 : 0.03
                : 0.11;
              const instability = linkInstability(link.ambiguity ?? 0, link.sId, link.tId, animTick);
              const finalOpacity = baseOpacity * revealedOpacity * instability;
              return (
                <line
                  key={`${link.sId}-${link.tId}-${link.idx}`}
                  x1={link.sx}
                  y1={link.sy}
                  x2={link.tx}
                  y2={link.ty}
                  stroke={
                    link.resonanceType === "emotional" ? "#C8935A"
                    : link.resonanceType === "sensory" ? "#5A9AB0"
                    : "#6A6A8A"
                  }
                  strokeWidth={link.strength * (isDirect ? 1.8 : 1.4)}
                  strokeOpacity={finalOpacity}
                  strokeDasharray={(link.ambiguity ?? 0)> 0.3 ? "4 6" : undefined}
                />
              );
            })}
          </g>
          {/*
            ═══════════════════════════════════════════════════════════════
            LAYERED RENDER ARCHITECTURE
            ═══════════════════════════════════════════════════════════════
            The map is composed as a strict stack of layers with EXPLICIT
            pointer-events ownership. Adding a new visual flourish goes in
            the DECO layer (no clicks). Adding a new interactive shape goes
            in the HIT layer. Adding a label goes in the LABEL layer. This
            eliminates the recurring z-index foot-gun where a decorative
            halo silently absorbed clicks meant for distant nodes.
              ┌───────────────────────────┐
              │  Layer 5: LABELS          │  pointer-events: none
              │  ─ text under each node   │
              ├───────────────────────────┤
              │  Layer 4: HIT TARGETS     │  pointer-events: all
              │  ─ invisible click rects  │  ← THE ONLY clickable layer
              ├───────────────────────────┤
              │  Layer 3: DECORATIONS     │  pointer-events: none
              │  ─ halos, rings, glyphs   │
              ├───────────────────────────┤
              │  Layer 2: LINKS           │  already exists
              │  Layer 1: ATMOSPHERE      │  already exists
              └───────────────────────────┘
            We sort the nodes ONCE and reuse the order across all 3 node
            layers, so visual + interactive z-order stay consistent. The
            pivot's gigantic halo can never block clicks: the entire deco
            <g> is pointer-events:none. Renoir's hit target sits in the
            hit layer above; its label sits in the label layer above that.
          */}
          {(() => {
            const sortedNodes = [...nodes].sort((a, b) => {
              const pri = (id: string) => {
                if (connectedIds.has(id) && id !== pivot) return 3;
                if (id === pivot) return 2;
                return 0;
              };
              return pri(a.id) - pri(b.id);
            });
            type NodeRender = {
              node: MapNode;
              x: number;
              y: number;
              r: number;
              opacity: number;
              isHovered: boolean;
              isSelected: boolean;
              isPivotConn: boolean;
              isClanMate: boolean;
              off: ReturnType<typeof personalityOffset>;
              tribeGlow: string;
              hitR: number;
            };
            const rendered: NodeRender[] = sortedNodes
              .map((node) => {
                if (!node.x || !node.y) return null;
                const off = nodeOffsets.get(node.id) ?? { dx: 0, dy: 0, scale: 1, glow: 0 };
                const x = node.x + off.dx;
                const y = node.y + off.dy;
                const r = nodeRadius(node) * off.scale;
                const filtered = isNodeFiltered(node);
                const isHovered = node.id === hoveredNode;
                const isSelected = node.id === selectedNode;
                const isPivotConn = pivot ? connectedIds.has(node.id) : true;
                const isClanMate = pivot ? clanMateIds.has(node.id) : false;
                const isEchoConn = pivot ? echoIds.has(node.id) : false;
                const opacity = !filtered ? 0.06
                  : !pivot ? 1
                  : isPivotConn ? 1
                  : isClanMate ? 0.7
                  : isEchoConn ? 0.45
                  : 0.12;
                const tribe = node.tribe ? TRIBE_MAP.get(node.tribe) : null;
                const tribeGlow = tribe ? `url(#glow-${tribe.id})` : `url(#glow-default)`;
                // Hit-target radius — generous so tiny cultural dots
                // (r ≈ 4) are easy to grab without being so big that
                // adjacent nodes' hit areas overlap. Min 16 px for any
                // node; otherwise r + 18 (body + comfortable margin
                // including the label area below).
                const hitR = Math.max(16, r + 18);
                return { node, x, y, r, opacity, isHovered, isSelected,
                         isPivotConn, isClanMate, off, tribeGlow, hitR };
              })
              .filter((x): x is NodeRender => x !== null);
            return (
              <>
                {/* ─── Layer 3: Decorations (visual, never clickable) ─── */}
                <g className="map-deco" pointerEvents="none">
                  {rendered.map(({ node, x, y, r, opacity, isHovered, isSelected, isPivotConn, isClanMate, off, tribeGlow }) => (
                    <g key={node.id} transform={`translate(${x},${y})`}
                       style={{ opacity, transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                      {node.type === "color" && (
                        <circle r={r + 1.5} fill={node.color} fillOpacity={isHovered ? 0.9 : 0.55} />
                      )}
                      {node.type === "emotion" && (() => {
                        const pat = emotionMotion(node.id);
                        const pulseMs = pat?.pace ?? 4000;
                        const phaseMs = -(((node.x ?? 0) * 0.8 + (node.y ?? 0) * 0.4) % pulseMs);
                        return (
                          <>
                            <circle
                              r={r + 22 + off.glow * 10}
                              fill={node.color}
                              fillOpacity={isHovered ? 0.22 : 0.10 + off.glow * 0.08}
                              style={pivot && (isPivotConn || isClanMate) ? {
                                filter: tribeGlow,
                                transition: "fill-opacity 0.4s ease",
                                animation: `em-pulse-wave ${pulseMs}ms ease-in-out infinite`,
                                animationDelay: `${phaseMs}ms`,
                                transformBox: "fill-box",
                                transformOrigin: "center",
                              } : { filter: tribeGlow, transition: "fill-opacity 0.4s ease" }}
                            />
                            {(isHovered || isSelected) && (
                              <circle r={r + 18} fill="none" stroke={node.color}
                                strokeWidth={0.8} strokeOpacity={0.55}
                                style={{ animation: "bloom 2.4s ease-in-out infinite" }} />
                            )}
                          </>
                        );
                      })()}
                      <circle
                        r={r}
                        fill={node.type === "color" ? "transparent" : node.color}
                        fillOpacity={
                          node.type === "emotion" ? 1
                          : node.type === "color" ? 0
                          : 0.65
                        }
                        stroke={node.color}
                        strokeWidth={node.type === "emotion" ? 1.2 : 0.6}
                        strokeOpacity={isHovered ? 1 : node.type === "emotion" ? 0.95 : 0.55}
                        style={{
                          filter: node.type === "emotion" ? tribeGlow
                            : (isHovered || isSelected) ? tribeGlow : undefined,
                        }}
                      />
                      {node.type === "music" && (
                        <circle r={r + 3 + off.glow * 3} fill="none" stroke={node.color}
                          strokeWidth={0.4} strokeOpacity={0.3 + off.glow * 0.4} />
                      )}
                      {GLYPH[node.type] && (
                        <text
                          fontFamily={ICON_SVG_FONT}
                          fontSize={r * 1.1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={node.color}
                          fillOpacity={0.85}
                          style={{ fontFeatureSettings: '"liga"', userSelect: "none" }}
>
                          {GLYPH[node.type]}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
                {/* ─── Layer 4: Hit targets (THE ONLY clickable layer) ─── */}
                <g className="map-hits">
                  {rendered.map(({ node, x, y, hitR, opacity }) => (
                    // Transparent circle sized to the perceived body. Decoupled
                    // from visual halos, so nothing else in the SVG can shadow it.
                    <circle
                      key={node.id}
                      cx={x} cy={y} r={hitR}
                      fill="transparent"
                      style={{ cursor: opacity> 0.3 ? "pointer" : "default" }}
                      onMouseEnter={() => {
                        setHoveredNode(node.id);
                        trackEvent("node_hovered", { nodeId: node.id, type: node.type });
                      }}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleNodeClick(node)}
                    />
                  ))}
                </g>
                {/* ─── Layer 5: Labels (above everything, never clickable) ─── */}
                <g className="map-labels" pointerEvents="none">
                  {rendered.map(({ node, x, y, r, opacity, isHovered, isSelected, isPivotConn }) => (
                    <text
                      key={node.id}
                      x={x}
                      y={y + r + 14}
                      textAnchor="middle"
                      fontSize={node.type === "emotion" ? 9 : (isHovered ? 9 : 7.5)}
                      fill={node.type === "emotion" ? "var(--album-ink)" : "var(--album-ink-muted)"}
                      fillOpacity={
                        // Labels always show when the node itself is the
                        // direct hover target — regardless of pivot state.
                        // This makes "I found Renoir, let me grab his label"
                        // a reliable interaction.
                        isHovered || isSelected ? 1
                        : opacity < 0.3 ? 0
                        : isPivotConn && pivot ? 0.9
                        : node.type === "emotion" ? 0.7
                        : 0
                      }
                      style={{
                        fontFamily: "var(--font-technical)",
                        letterSpacing: "0.04em",
                        transition: "fill-opacity 0.4s ease",
                        userSelect: "none",
                      }}
>
                      {node.label}
                    </text>
                  ))}
                </g>
              </>
            );
          })()}
        </g>
      </svg>
      {/* Full-screen card painted with the node's colour. Replaces the
          small floating panel — much more breathing room, the entity gets
          to dominate the surface. Hover still drives highlights; click
          opens this preview. */}
      {selectedNode && (
        <NodeFullPreview nodeId={selectedNode} nodes={nodes} onClose={() => setSelectedNode(null)} />
      )}
      {/* ─── Link-mode toggle (Marina curado vs. vectores emergentes) ───── */}
      <div className="absolute top-20 right-6 z-10">
        <p
          className="text-[0.55rem] text-ink-faint mb-2 text-right"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          ENLACES
        </p>
        <div className="flex flex-col gap-1 items-end">
          {([
            { id: "curated"  as const, label: "CURADO",    hint: "Relaciones de la ontología Marina" },
            { id: "emergent" as const, label: "EMERGENTE", hint: "Inferidos por similitud vectorial" },
            { id: "both"     as const, label: "AMBOS",     hint: "Las dos capas superpuestas" },
          ]).map((m) => {
            const active = linkMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setLinkMode(m.id)}
                className="text-[0.55rem] px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/5"
                style={{
                  fontFamily: "var(--font-technical)",
                  letterSpacing: "0.15em",
                  color: active ? "#4A9AA0" : "var(--album-ink-faint)",
                  borderColor: active ? "#4A9AA0" : "transparent",
                  border: "1px solid",
                }}
                title={m.hint}
>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Tribe filters — 22 tribes, compact column with hover-expand labels */}
      <div className="absolute top-20 left-4 z-10 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-4">
        <p
          className="text-[0.55rem] text-ink-faint mb-2 pl-1"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          22 TRIBUS
        </p>
        <div className="flex flex-col gap-[3px]">
          {TRIBES.map((tribe) => {
            const isActive = activeTribe === tribe.id;
            const isDimmed = activeTribe !== null && !isActive;
            return (
              <div key={tribe.id} className="group flex items-stretch gap-1 transition-all duration-200">
                <button
                  className="flex items-center gap-2 py-[3px] px-1.5 rounded-md transition-all duration-200 hover:bg-white/5 flex-1"
                  onClick={() => useMapStore.getState().setActiveTribe(isActive ? null : tribe.id)}
                  title={`Filtrar por ${tribe.name}`}
>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                    style={{
                      backgroundColor: tribe.color,
                      opacity: isDimmed ? 0.22 : 0.9,
                      boxShadow: isActive ? `0 0 10px ${tribe.color}A0` : "none",
                    }}
                  />
                  <span
                    className="text-[0.6rem] whitespace-nowrap transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-technical)",
                      color: isActive ? tribe.color : isDimmed ? "var(--album-ink-faint)" : "var(--album-ink-faint)",
                      letterSpacing: "0.04em",
                    }}
>
                    {tribe.name}
                  </span>
                </button>
                <a
                  href={`/tribe/${tribe.id}`}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[0.55rem] text-ink-faint hover:text-ink transition-all duration-200 px-1 self-center"
                  title={`Abrir tribu ${tribe.name}`}
                  style={{ fontFamily: "var(--font-technical)" }}
                  onClick={(e) => { e.stopPropagation(); }}
>
                  ↗
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ─── Cluster Force ────────────────────────────────────────────────────────────
//
// 22 tribes distributed on a circle in their canonical Marina order (I → XXII).
// The order spans an arc that mirrors the phenomenological flow:
//   - Top:    III–VIII (vitality & its loss)
//   - Right:  IX–XV    (negative outward)
//   - Bottom: XVI      (loss / grief — the center of gravity for melancholy)
//   - Left:   XVII–II  (wonder, fulfillment, love, drive)
//
// Computing positions once per dimension change.
function radialPositions(w: number, h: number): Record<string, { x: number; y: number }> {
  // Canonical I–XXII order
  const order = [
    "impulso", "aversion-fisica", "vitalidad", "falta-vitalidad",
    "cambio-negativo", "inseguridad", "alivio", "ausencia",
    "obstaculo", "aversion-duradera", "bien-ajeno", "peligro",
    "desmentido", "futuro-positivo", "futuro-negativo", "perdida",
    "no-habitual", "realizacion", "bien-recibido", "bien-deseado",
    "evaluacion-positiva", "evaluacion-negativa",
  ];
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.34;
  const positions: Record<string, { x: number; y: number }> = {};
  const N = order.length;
  for (let i = 0; i < N; i++) {
    // Start at -π/2 (top) and walk clockwise
    const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
    positions[order[i]] = { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  }
  return positions;
}
function clusterForce(nodes: MapNode[], w: number, h: number) {
  const TRIBE_POSITIONS = radialPositions(w, h);
  return (alpha: number) => {
    for (const node of nodes) {
      if (node.tribe && TRIBE_POSITIONS[node.tribe]) {
        const target = TRIBE_POSITIONS[node.tribe];
        // Per-emotion gravitational weight from resonance
        const r = node.resonance;
        const grav = r ? 0.05 + (r.density / 100) * 0.06 + ((100 - r.energy) / 100) * 0.03 : 0.06;
        if (node.x !== undefined) node.vx = (node.vx ?? 0) + (target.x - node.x) * alpha * grav;
        if (node.y !== undefined) node.vy = (node.vy ?? 0) + (target.y - node.y) * alpha * grav;
      }
    }
  };
}
// ─── Clan Force ──────────────────────────────────────────────────────────────
//
// Inside each tribe, emotions of the same clan should attract each other
// slightly so that clan-level sub-structure becomes visible (e.g. within the
// Pérdida tribe, melancolía and tristeza form a cluster distinct from
// nostalgia/añoranza). The force is weak (~10% of the tribal pull) so it
// refines structure without overpowering the tribal layout.
function clanForce(nodes: MapNode[]) {
  // Group emotion nodes by clan
  const clanGroups: Record<string, MapNode[]> = {};
  for (const n of nodes) {
    if (n.type === "emotion" && n.clan) {
      (clanGroups[n.clan] ??= []).push(n);
    }
  }
  return (alpha: number) => {
    for (const clanId of Object.keys(clanGroups)) {
      const group = clanGroups[clanId];
      if (group.length < 2) continue; // nothing to cluster
      // Compute centroid of clan
      let cx = 0, cy = 0, k = 0;
      for (const n of group) {
        if (n.x !== undefined && n.y !== undefined) {
          cx += n.x; cy += n.y; k++;
        }
      }
      if (!k) continue;
      cx /= k; cy /= k;
      // Pull each member toward the centroid
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
// ─── Resonance gravity ───────────────────────────────────────────────────────
//
// The most important geometric force in the new system: each cultural entity
// (artwork, music, film, sculpture, dance, architecture, photography,
// literature, ritual, poem) IS PULLED toward its 2 most-resonant emotions.
//
// This replaces "cultural entities float freely under D3 charge" with
// "cultural entities orbit the emotions they actually resonate with".
//
// The pull is computed ONCE per node (its top-K emotion neighbours are stable
// because vectors don't change at runtime), then applied each tick toward the
// weighted centroid of those emotions' CURRENT positions.
function resonanceGravityForce(
  nodes: Array<MapNode & { resonance?: ResonanceAxes }>,
): (alpha: number) => void {
  // Precompute the top emotion neighbours for each cultural node
  const emotionNodes = nodes.filter((n) => n.type === "emotion" && n.resonance);
  const emotionVectors = emotionNodes.map((n) => ({
    node: n,
    vector: buildVector(n.resonance!),
  }));
  type Anchor = { emotionNode: MapNode; weight: number };
  const culturalAnchors = new Map<string, Anchor[]>();
  // Per-node pull strength. Colour nodes are pulled hard so they collapse
  // INTO their parent emotion's halo as petals; cultural nodes get the
  // softer attraction so they read as a loose orbit.
  const pullByType = new Map<string, number>();
  for (const n of nodes) {
    if (n.type === "emotion") continue;
    if (!n.resonance) continue;
    const myVector = buildVector(n.resonance);
    // Every non-emotion (colour + every art form) anchors to its top-3
    // most-resonant emotions. The same anchoring logic for everything is
    // what produces the organic field: a colour can land next to an
    // artwork that shares its emotional gravity, not in a separate ring.
    const scored = emotionVectors
      .map((e) => ({ node: e.node, sim: cosineSimilarity(myVector, e.vector) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
    if (scored.length === 0) continue;
    const total = scored.reduce((s, x) => s + x.sim, 0) || 1;
    culturalAnchors.set(n.id, scored.map((s) => ({ emotionNode: s.node, weight: s.sim / total })));
    // Uniform moderate pull for both colours and art: enough to cluster
    // them around resonant emotions, loose enough that they intermingle
    // rather than collapse into distinct rings.
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
// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgbNorm(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
// Suppress unused-import warning during transition
void EMOTION_MAP;
