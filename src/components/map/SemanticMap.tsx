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
  // Floor: emotions must be at least 10px radius so they're always
  // visible and clickable. Cultural nodes at least 3px.
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
interface SemanticMapProps {
  /** Layout precomputed at build time by lib/server/mapLayout.ts.
   *  When provided the client skips its own d3-force simulation. */
  layout?: import("@/lib/server/mapLayout").MapLayoutPayload;
}

export function SemanticMap({ layout }: SemanticMapProps = {}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<MapNode, MapLink> | null>(null);
  const router = useRouter();
  const { hoveredNode, selectedNode, activeFilter, activeTribe, setHoveredNode, setSelectedNode } = useMapStore();
  // When `layout` is provided, dimensions just feed d3-zoom + responsive
  // overlays. The simulation is skipped entirely.
  const [dimensions, setDimensions] = useState({
    w: layout?.viewBox.w ?? 0,
    h: layout?.viewBox.h ?? 0,
  });
  const [nodes, setNodes] = useState<MapNode[]>(layout?.nodes ?? []);
  const [links, setLinks] = useState<MapLink[]>(layout?.curatedLinks ?? []);
  const [emergentLinks, setEmergentLinks] = useState<MapLink[]>(layout?.emergentLinks ?? []);
  /** Which link layer(s) to render: curated (Marina), emergent (vector), or both. */
  const [linkMode, setLinkMode] = useState<"curated" | "emergent" | "both">("both");
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hoverStart, setHoverStart] = useState<number>(0);
  const [animTick, setAnimTick] = useState(0); // drives personality re-render
  // ─── Entry animation: organic dispersal from center ───────────────────────
  // Replaces the lost d3-force simulation settling. Nodes start at the
  // viewport centre and fly to their precomputed positions with elastic
  // easing and per-node stagger (nodes further from centre arrive later).
  // Runs for ENTRY_DURATION_MS then stops — zero ongoing cost.
  //
  // `entryProgress` goes from 0 (all at centre) to 1 (all at final pos).
  // While < 1, the canvas paint and SVG render use interpolated positions.
  const ENTRY_DURATION_MS = 2400;
  const [entryProgress, setEntryProgress] = useState(layout ? 0 : 1);
  const entryStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (!layout || entryProgress >= 1) return;
    let raf: number;
    const step = (t: number) => {
      if (entryStartRef.current === null) entryStartRef.current = t;
      const elapsed = t - entryStartRef.current;
      const raw = Math.min(elapsed / ENTRY_DURATION_MS, 1);
      setEntryProgress(raw);
      if (raw < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [layout, entryProgress >= 1]); // eslint-disable-line react-hooks/exhaustive-deps
  // ─── Measure container ────────────────────────────────────────────────────
  // `dimensions` starts at the canonical world size (layout.viewBox) so SSR
  // and first hydration render with consistent values. After mount this
  // effect overrides with the real viewport size. `viewportMeasured` is
  useEffect(() => {
    const update = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // ─── D3 force simulation (structural layer) ───────────────────────────────
  // Skipped when `layout` is supplied (the build-time precompute path).
  // Kept as a fallback so existing callers without a layout still render —
  // they take the old hit on first paint but at least don't crash.
  useEffect(() => {
    if (layout) return; // precomputed layout already in state; nothing to do.
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
  // Only ticks when there is a pivot (hovered/selected). The drift offsets
  // are STATIC_OFFSET = {0,0,1,0} for every non-attention node, so ticking
  // when there's nothing to focus just re-renders identical SVG 6× per
  // second. With this guard, the map is fully idle at rest — the browser
  // gets all its compositor time back for scroll, hover, search palette.
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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialZoomApplied = useRef(false);
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    zoomRef.current = zoom;
    const sel = d3.select(svgRef.current);
    sel.call(zoom);
    // Start zoomed in at 1.35× centred on the viewport so the user lands
    // inside the constellation rather than seeing the full circular outline.
    // Only on first mount — not on resize.
    if (!initialZoomApplied.current && dimensions.w && dimensions.h) {
      const k0 = 1.25;
      const tx = (dimensions.w - dimensions.w * k0) / 2;
      const ty = (dimensions.h - dimensions.h * k0) / 2;
      sel.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k0));
      initialZoomApplied.current = true;
    }
  }, [dimensions]);
  // ─── World-to-viewport mapping (adaptive layout) ──────────────────────────
  // The d3-force simulation centred nodes around (960, 540) in a 1920×1080
  // canonical world, but the actual bounding box of node positions is
  // smaller — nodes cluster in a region that doesn't fill the canvas. The
  // naive sx = viewportW/worldW only stretched the coordinate space; the
  // nodes still occupied their original fraction of it, leaving large
  // empty regions.
  //
  // Fix: compute the ACTUAL bounding box of node positions, add margin,
  // then map that box to fill the viewport. This guarantees nodes spread
  // edge-to-edge regardless of how the simulation distributed them.
  //
  // Semantic zoom: when the user zooms (transform.k), we modulate inter-
  // node distances around the viewport centre. Zoom in → nodes spread
  // apart, zoom out → they compact. This makes the constellation feel
  // infinite rather than a bounded rectangle.
  const PADDING = 60; // px margin from viewport edges
  const bbox = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const n of nodes) {
      if (n.x === undefined || n.y === undefined) continue;
      if (n.x < xMin) xMin = n.x;
      if (n.x > xMax) xMax = n.x;
      if (n.y < yMin) yMin = n.y;
      if (n.y > yMax) yMax = n.y;
    }
    if (!isFinite(xMin)) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    return { xMin, xMax, yMin, yMax };
  }, [nodes]);
  // Map node world-position → viewport position. Normalise to [0,1] within
  // the bounding box, then scale to [PADDING, viewportDim - PADDING].
  const sx = dimensions.w > 0 && bbox.xMax > bbox.xMin
    ? (dimensions.w - PADDING * 2) / (bbox.xMax - bbox.xMin) : 1;
  const sy = dimensions.h > 0 && bbox.yMax > bbox.yMin
    ? (dimensions.h - PADDING * 2) / (bbox.yMax - bbox.yMin) : 1;
  // Uniform scale preserves aspect ratio of the layout (no stretch).
  // Use the smaller factor so everything fits, then centre in the
  // dimension that has leftover space.
  const sUniform = Math.min(sx, sy);
  const mappedW = (bbox.xMax - bbox.xMin) * sUniform;
  const mappedH = (bbox.yMax - bbox.yMin) * sUniform;
  const offsetX = (dimensions.w - mappedW) / 2;
  const offsetY = (dimensions.h - mappedH) / 2;
  // ─── Unified coordinate functions ──────────────────────────────────────────
  // TWO functions replace the old toVP + entryPos + manual transform:
  //
  // toBase(wx, wy) — bbox-norm + semantic spread. Used for the quadtree
  //   (positions that don't change with geometric zoom or entry animation).
  //   Hit-testing inverts the geometric transform on the pointer, then queries.
  //
  // toScreen(wx, wy) — toBase + entry animation + geometric transform.
  //   Final pixel coordinates for ALL rendering (canvas, SVG, labels).
  //   No wrapping <g transform> needed.
  const vcx = dimensions.w / 2;
  const vcy = dimensions.h / 2;
  const spreadK = Math.pow(transform.k, 0.4);
  const toBase = useCallback((wx: number, wy: number): { x: number; y: number } => {
    const bx = (wx - bbox.xMin) * sUniform + offsetX;
    const by = (wy - bbox.yMin) * sUniform + offsetY;
    return {
      x: vcx + (bx - vcx) * spreadK,
      y: vcy + (by - vcy) * spreadK,
    };
  }, [bbox.xMin, bbox.yMin, sUniform, offsetX, offsetY, vcx, vcy, spreadK]);
  // ─── Entry position interpolator ─────────────────────────────────────────
  // Elastic ease-out: overshoots then settles — feels organic/living.
  const elasticOut = (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  };
  // Centre of the viewport in viewport-scaled coordinates.
  const cx = dimensions.w / 2;
  const cy = dimensions.h / 2;
  // Max distance from centre (for normalising stagger).
  const maxDist = useMemo(() => {
    if (!layout) return 1;
    let m = 0;
    for (const n of nodes) {
      if (n.x === undefined || n.y === undefined) continue;
      const vp = toBase(n.x, n.y);
      const d = Math.hypot(vp.x - cx, vp.y - cy);
      if (d > m) m = d;
    }
    return m || 1;
  }, [nodes, toBase, cx, cy, layout]);
  // Given a node's final base-space position, return the interpolated
  // position based on entryProgress. During the entry animation, nodes
  // start at viewport centre and fly outward with elastic easing +
  // per-node stagger (nodes further from centre arrive later).
  const entryDone = entryProgress >= 1;
  const entryInterp = useCallback((finalX: number, finalY: number): { x: number; y: number } => {
    if (entryDone) return { x: finalX, y: finalY };
    const dist = Math.hypot(finalX - cx, finalY - cy);
    const normDist = dist / maxDist; // 0 = centre, 1 = edge
    // Stagger: centre nodes start immediately, edge nodes delayed by ~30%.
    const staggerDelay = normDist * 0.3;
    const localT = Math.max(0, Math.min(1, (entryProgress - staggerDelay) / (1 - staggerDelay)));
    const eased = elasticOut(localT);
    return {
      x: cx + (finalX - cx) * eased,
      y: cy + (finalY - cy) * eased,
    };
  }, [entryDone, entryProgress, cx, cy, maxDist]);
  // ─── toScreen: the ONE function all renderers call ────────────────────────
  // Combines: bbox-norm + semantic spread + entry animation + geometric zoom.
  // Returns final pixel coordinates — no wrapping transform needed.
  const toScreen = useCallback((wx: number, wy: number): { x: number; y: number } => {
    const base = toBase(wx, wy);
    const ep = entryInterp(base.x, base.y);
    return {
      x: ep.x * transform.k + transform.x,
      y: ep.y * transform.k + transform.y,
    };
  }, [toBase, entryInterp, transform.k, transform.x, transform.y]);
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
      // Apply toScreen so centroids land where nodes do (screen-space).
      for (const n of group) {
        const sp = toScreen(n.x!, n.y!);
        cx += sp.x; cy += sp.y;
      }
      cx /= group.length; cy /= group.length;
      // Approximate radius: distance to farthest member
      let maxDist = 0;
      for (const n of group) {
        const sp = toScreen(n.x!, n.y!);
        const d = Math.hypot(sp.x - cx, sp.y - cy);
        if (d > maxDist) maxDist = d;
      }
      centroids.push({
        id: `centroid-${clanId}`,
        clanId,
        tribalColor: group[0].tribalColor ?? group[0].color ?? "#888",
        x: cx,
        y: cy,
        size: Math.max(28 * transform.k, maxDist + 22),
      });
    }
    return centroids;
  }, [nodes, toScreen, transform.k]);
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
  // ─── Attention set (drives Canvas/SVG split) ──────────────────────────────
  // SVG renders only this set — pivot, hovered, selected, plus everything
  // directly connected to the pivot. Canvas paints everyone else.
  const attentionSet = useMemo(() => {
    const s = new Set<string>();
    if (pivot) s.add(pivot);
    if (hoveredNode) s.add(hoveredNode);
    if (selectedNode) s.add(selectedNode);
    for (const id of connectedIds) s.add(id);
    return s;
  }, [pivot, hoveredNode, selectedNode, connectedIds]);
  // ─── Quadtree over precomputed positions (Capa B) ─────────────────────────
  // Built once from the build-time layout, the quadtree lets us cull nodes
  // outside the visible viewport before paying for ~3 SVG layers × 1300
  // nodes (deco + hit + label). Typical zoom shows 100-300 nodes — about a
  // 5-10× cut on render work without changing any visuals.
  //
  // d3.quadtree's visit() walks the tree, pruning whole subtrees whose
  // bounding box doesn't intersect our query AABB. O((output_size + log n))
  // versus O(n) per render.
  // Quadtree accessors apply the viewport scale so all queries (visible AABB,
  // pointer hit-tests) work in viewport coordinates — same space that pointer
  // events and the d3-zoom transform operate in.
  // Quadtree stores positions in "base" space (bbox-norm + semantic spread,
  // but NO geometric transform and NO entry animation). The hit-test handler
  // inverts the geometric transform on the pointer, then queries.
  const nodeQuadtree = useMemo(() => {
    return d3
      .quadtree<MapNode>()
      .x((d) => toBase(d.x ?? 0, d.y ?? 0).x)
      .y((d) => toBase(d.x ?? 0, d.y ?? 0).y)
      .addAll(nodes.filter((n) => n.x !== undefined && n.y !== undefined));
  }, [nodes, toBase]);
  // Visible node ids: query the quadtree for the world-space AABB that
  // maps to the current viewport (inverse of the d3-zoom transform), with
  // a generous margin so labels/halos near the edge don't clip in.
  const visibleNodeIds = useMemo(() => {
    if (!nodes.length) return null; // null = "render all" (e.g. layout not ready)
    const margin = 120; // px in world space — accommodates halos + labels
    const k = transform.k || 1;
    const x0 = (0 - transform.x) / k - margin;
    const y0 = (0 - transform.y) / k - margin;
    const x3 = (dimensions.w - transform.x) / k + margin;
    const y3 = (dimensions.h - transform.y) / k + margin;
    const ids = new Set<string>();
    nodeQuadtree.visit((node, qx0, qy0, qx3, qy3) => {
      // Prune subtrees outside the AABB.
      if (qx0 > x3 || qy0 > y3 || qx3 < x0 || qy3 < y0) return true;
      // Leaf: walk the linked list of points.
      if (!node.length) {
        let leaf: { data: MapNode; next?: { data: MapNode; next?: unknown } } | undefined =
          node as unknown as { data: MapNode; next?: { data: MapNode; next?: unknown } };
        do {
          const d = leaf.data;
          const { x: dx, y: dy } = toBase(d.x ?? 0, d.y ?? 0);
          if (dx >= x0 && dx <= x3 && dy >= y0 && dy <= y3) ids.add(d.id);
          leaf = leaf.next as typeof leaf;
        } while (leaf);
      }
      return false;
    });
    // Always keep pivot + connected + hovered/selected on stage, even if
    // they happen to be outside the viewport after a pan — preserves the
    // "I'm focused on this node" guarantee.
    if (pivot) ids.add(pivot);
    if (hoveredNode) ids.add(hoveredNode);
    if (selectedNode) ids.add(selectedNode);
    for (const id of connectedIds) ids.add(id);
    return ids;
  }, [nodeQuadtree, toBase, transform, dimensions, nodes.length, pivot, hoveredNode, selectedNode, connectedIds]);
  // ─── Focus point for atmospheric field ────────────────────────────────────
  const focusPoint = useMemo(() => {
    if (!pivot) return null;
    const n = nodes.find((x) => x.id === pivot);
    if (!n || !n.x || !n.y) return null;
    const off = nodeOffsets.get(n.id);
    const sp = toScreen(n.x, n.y);
    const x = sp.x + (off?.dx ?? 0) * transform.k;
    const y = sp.y + (off?.dy ?? 0) * transform.k;
    return { x, y };
  }, [pivot, nodes, nodeOffsets, transform, toScreen]);
  // ─── Canvas paint: all AMBIENT nodes in one pass ──────────────────────────
  // Replaces 3 SVG layers (deco/hit/labels) × ~1300 nodes ≈ 4000 elements
  // with a single canvas paint of a few thousand 2D ops. Repaints only when
  // node data, filter, or attention set changes — never per animation tick.
  // Runs in world-space coordinates; CSS transform on the wrapper handles
  // zoom/pan for free (no repaint on drag/wheel).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length || !layout || !dimensions.w || !dimensions.h) return;
    // Canvas matches viewport, not canonical world. Node positions are
    // stretched by sx/sy into this space — the map fills the user's window
    // edge-to-edge regardless of aspect ratio.
    const W = dimensions.w;
    const H = dimensions.h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 for perf
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Resolve theme-dependent colours (canvas doesn't read CSS vars).
    const styles = getComputedStyle(document.documentElement);
    const inkColor = styles.getPropertyValue("--album-ink").trim() || "#F0EDE8";
    const inkMuted = styles.getPropertyValue("--album-ink-muted").trim() || "#8A8799";
    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) continue;
      // Attention set is rendered by SVG — skip here.
      if (attentionSet.has(node.id)) continue;
      const r = nodeRadius(node);
      const filtered = isNodeFiltered(node);
      const isEmotion = node.type === "emotion";
      const isColor = node.type === "color";
      const isClanMate = pivot ? clanMateIds.has(node.id) : false;
      const isEchoConn = pivot ? echoIds.has(node.id) : false;
      // Same opacity ladder as the SVG path used.
      const opacity = !filtered ? 0.06
        : !pivot ? 1
        : isClanMate ? 0.7
        : isEchoConn ? 0.45
        : 0.12;
      if (opacity < 0.04) continue; // imperceptible — skip the paint
      const fillColor = node.color ?? "#888";
      // Final screen position via toScreen (bbox-norm + spread + entry + zoom).
      const { x: px, y: py } = toScreen(node.x, node.y);
      const sr = r * transform.k; // scale radius with zoom
      // Skip if entirely off-screen (GPU would clip anyway, but saves draw calls)
      if (px + sr < 0 || px - sr > W || py + sr < 0 || py - sr > H) continue;
      // Body fill (cultural & emotion, not color)
      if (!isColor) {
        ctx.beginPath();
        ctx.arc(px, py, sr, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.globalAlpha = opacity * (isEmotion ? 1 : 0.65);
        ctx.fill();
      }
      // Body stroke
      ctx.beginPath();
      ctx.arc(px, py, sr, 0, Math.PI * 2);
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = (isEmotion ? 1.2 : 0.6) * transform.k;
      ctx.globalAlpha = opacity * (isEmotion ? 0.95 : 0.55);
      ctx.stroke();
      // Labels removed from canvas — canvas text is rasterised at a fixed
      // DPR and then CSS-scaled by transform.k, which produces visible
      // blur at any zoom above 1×. Emotion labels for ambient nodes are
      // rendered in the SVG label layer below (vector, always crisp).
      void inkColor; void inkMuted;
    }
    ctx.globalAlpha = 1;
  }, [nodes, layout, attentionSet, activeFilter, activeTribe, pivot, clanMateIds, echoIds, isNodeFiltered, toScreen, dimensions.w, dimensions.h, transform]);
  if (!dimensions.w) return null;
  // Helper: resolve a link's endpoints + apply personality offsets
  const resolveLink = (l: MapLink, idx: number) => {
    const sId = typeof l.source === "object" ? (l.source as MapNode).id : (l.source as string);
    const tId = typeof l.target === "object" ? (l.target as MapNode).id : (l.target as string);
    const s = typeof l.source === "object" ? (l.source as MapNode) : nodes.find((n) => n.id === sId);
    const t = typeof l.target === "object" ? (l.target as MapNode) : nodes.find((n) => n.id === tId);
    const sOff = sId ? nodeOffsets.get(sId) : undefined;
    const tOff = tId ? nodeOffsets.get(tId) : undefined;
    // Endpoints in final screen-space via toScreen.
    const sSp = toScreen(s?.x ?? 0, s?.y ?? 0);
    const tSp = toScreen(t?.x ?? 0, t?.y ?? 0);
    return {
      ...l,
      sId,
      tId,
      sx: sSp.x + (sOff?.dx ?? 0) * transform.k,
      sy: sSp.y + (sOff?.dy ?? 0) * transform.k,
      tx: tSp.x + (tOff?.dx ?? 0) * transform.k,
      ty: tSp.y + (tOff?.dy ?? 0) * transform.k,
      idx,
    };
  };
  // Resolve link endpoints with personality offsets applied.
  // Capa B: cull links whose endpoints are both off-screen — keeps the
  // links layer proportional to the visible nodes layer.
  // visibleNodeIds culling disabled — with semantic zoom the spread
  // pushes edge nodes outside the AABB calculation, causing them to
  // vanish. Canvas paints ~1300 arcs in one pass (GPU clips off-screen
  // ones for free), so the culling wasn't buying much anyway.
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
      {/* Canvas: paints all AMBIENT nodes in final screen coordinates.
          No CSS transform — the geometric zoom + semantic spread are
          applied per-node in the paint loop. This avoids clipping nodes
          pushed outside the canvas bounds by semantic zoom, and keeps
          circles crisp at any zoom level (no CSS magnification). */}
      {layout && dimensions.w > 0 && (
        <div
          aria-hidden
          className="absolute top-0 left-0 pointer-events-none"
        >
          <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>
      )}
      <svg
        ref={svgRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerMove={(e) => {
          // Single quadtree-based hover handler. Replaces ~1300 per-node
          // onMouseEnter listeners. World-space lookup: invert the d3-zoom
          // transform on the pointer position, then quadtree.find(...) for
          // the nearest node within a radius. ~O(log n) per move event.
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const wx = (e.clientX - rect.left - transform.x) / transform.k;
          const wy = (e.clientY - rect.top - transform.y) / transform.k;
          const HIT_RADIUS = 24 / transform.k; // visual ~24px regardless of zoom
          const found = nodeQuadtree.find(wx, wy, HIT_RADIUS);
          if (found) {
            if (hoveredNode !== found.id) {
              setHoveredNode(found.id);
              trackEvent("node_hovered", { nodeId: found.id, type: found.type });
            }
          } else if (hoveredNode) {
            setHoveredNode(null);
          }
        }}
        onPointerLeave={() => { if (hoveredNode) setHoveredNode(null); }}
        onClick={(e) => {
          // Quadtree-based click. If pointer is over a node, toggle pin;
          // otherwise deselect.
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const wx = (e.clientX - rect.left - transform.x) / transform.k;
          const wy = (e.clientY - rect.top - transform.y) / transform.k;
          const HIT_RADIUS = 24 / transform.k;
          const found = nodeQuadtree.find(wx, wy, HIT_RADIUS);
          if (found) handleNodeClick(found);
          else setSelectedNode(null);
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
        <g>
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
                    y={-c.size - 6 * transform.k}
                    textAnchor="middle"
                    fontSize={(isActive ? 10 : 8.5) * transform.k}
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
                    strokeWidth={Math.max(0.8, (link.strength - 0.7) * 6) * transform.k}
                    strokeOpacity={0.7}
                    strokeDasharray={`${3 * transform.k} ${4 * transform.k}`}
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
                  strokeWidth={link.strength * (isDirect ? 1.8 : 1.4) * transform.k}
                  strokeOpacity={finalOpacity}
                  strokeDasharray={(link.ambiguity ?? 0)> 0.3 ? `${4 * transform.k} ${6 * transform.k}` : undefined}
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
            // Canvas mode: SVG renders ONLY the attention set (pivot,
            // connected, hovered, selected). Everything else is on the
            // canvas underneath. Falls back to "render all" if the canvas
            // isn't available (no layout — legacy callers).
            const attentionOnly = layout
              ? nodes.filter((n) => attentionSet.has(n.id))
              : nodes;
            const sortedNodes = [...attentionOnly].sort((a, b) => {
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
                // Position in final screen-space via toScreen. Personality
                // offsets and radii scale with zoom since we're no longer
                // inside a <g scale(k)>.
                const sp = toScreen(node.x, node.y);
                const x = sp.x + off.dx * transform.k;
                const y = sp.y + off.dy * transform.k;
                const r = nodeRadius(node) * off.scale * transform.k;
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
                        <circle r={r + 1.5 * transform.k} fill={node.color} fillOpacity={isHovered ? 0.9 : 0.55} />
                      )}
                      {node.type === "emotion" && (() => {
                        const pat = emotionMotion(node.id);
                        const pulseMs = pat?.pace ?? 4000;
                        const phaseMs = -(((node.x ?? 0) * 0.8 + (node.y ?? 0) * 0.4) % pulseMs);
                        return (
                          <>
                            <circle
                              r={r + (22 + off.glow * 10) * transform.k}
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
                              <circle r={r + 18 * transform.k} fill="none" stroke={node.color}
                                strokeWidth={0.8 * transform.k} strokeOpacity={0.55}
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
                        strokeWidth={(node.type === "emotion" ? 1.2 : 0.6) * transform.k}
                        strokeOpacity={isHovered ? 1 : node.type === "emotion" ? 0.95 : 0.55}
                        style={{
                          filter: node.type === "emotion" ? tribeGlow
                            : (isHovered || isSelected) ? tribeGlow : undefined,
                        }}
                      />
                      {node.type === "music" && (
                        <circle r={r + (3 + off.glow * 3) * transform.k} fill="none" stroke={node.color}
                          strokeWidth={0.4 * transform.k} strokeOpacity={0.3 + off.glow * 0.4} />
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
                {/* Hit-target layer removed — quadtree-based onPointerMove on
                    the <svg> handles ALL hover/click (attention + ambient)
                    in one pass via d3-quadtree.find(). See the handlers on
                    the parent <svg>. */}
                {/* ─── Layer 5: Labels (above everything, never clickable) ─── */}
                <g className="map-labels" pointerEvents="none">
                  {rendered.map(({ node, x, y, r, opacity, isHovered, isSelected, isPivotConn }) => (
                    <text
                      key={node.id}
                      x={x}
                      y={y + r + 14 * transform.k}
                      textAnchor="middle"
                      fontSize={(node.type === "emotion" ? 9 : (isHovered ? 9 : 7.5)) * transform.k}
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
          {/* ─── Layer 6: Ambient emotion labels (in main SVG, screen-space) ── */}
          <g className="ambient-labels" pointerEvents="none">
            {nodes.map((node) => {
              if (node.type !== "emotion") return null;
              if (!node.x || !node.y) return null;
              if (attentionSet.has(node.id)) return null;
              const filtered = isNodeFiltered(node);
              const isClanMate = pivot ? clanMateIds.has(node.id) : false;
              const isEchoConn = pivot ? echoIds.has(node.id) : false;
              const opacity = !filtered ? 0.06
                : !pivot ? 1
                : isClanMate ? 0.7
                : isEchoConn ? 0.45
                : 0.12;
              if (opacity < 0.3) return null;
              const sp = toScreen(node.x, node.y);
              const r = nodeRadius(node) * transform.k;
              return (
                <text
                  key={node.id}
                  x={sp.x}
                  y={sp.y + r + 14 * transform.k}
                  textAnchor="middle"
                  fontSize={9 * transform.k}
                  fill="var(--album-ink)"
                  fillOpacity={0.7 * opacity}
                  style={{
                    fontFamily: "var(--font-technical)",
                    letterSpacing: "0.04em",
                    userSelect: "none",
                  }}
                >
                  {node.label}
                </text>
              );
            })}
          </g>
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
      {/* ─── Zoom controls (for trackpad/touch users without scroll wheel) ─── */}
      <div className="absolute bottom-16 right-6 z-10 flex flex-col gap-1">
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            const sel = d3.select(svgRef.current);
            sel.transition().duration(300).call(zoomRef.current.scaleBy, 1.4);
          }}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ borderColor: "var(--album-border-strong)", fontFamily: "var(--font-technical)" }}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <span className="icon" style={{ fontSize: "18px" }}>add</span>
        </button>
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            const sel = d3.select(svgRef.current);
            sel.transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.4);
          }}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ borderColor: "var(--album-border-strong)", fontFamily: "var(--font-technical)" }}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <span className="icon" style={{ fontSize: "18px" }}>remove</span>
        </button>
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            const sel = d3.select(svgRef.current);
            sel.transition().duration(500).call(
              zoomRef.current.transform,
              d3.zoomIdentity.translate(
                (dimensions.w - dimensions.w * 1.25) / 2,
                (dimensions.h - dimensions.h * 1.25) / 2,
              ).scale(1.25),
            );
          }}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ borderColor: "var(--album-border-strong)", fontFamily: "var(--font-technical)" }}
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          <span className="icon" style={{ fontSize: "16px" }}>my_location</span>
        </button>
      </div>
      {/* Tribe filters — 22 tribes, compact column with hover-expand labels.
          Glass background so the canvas nodes painted underneath don't bleed
          through the text. */}
      <div className="glass absolute top-20 left-4 z-10 max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl py-3 pl-3 pr-2 pb-4">
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
