"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Application, Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import * as d3 from "d3";
import { useMapStore } from "@/lib/store";
import { TRIBES, TRIBE_MAP } from "@/data/ontology/tribes";
import { CLAN_MAP } from "@/data/ontology/clans";
import { trackEvent } from "@/lib/analytics";
import { NodeFullPreview } from "./NodeFullPreview";
import { personalityOffset, linkInstability } from "./personality";
import { emotionMotion } from "@/lib/emotionMotion";
import { ICON } from "@/lib/icons";
import type { MapLayoutPayload } from "@/lib/server/mapLayout";
import type { MapNode, MapLink } from "@/types";

const _radiusCache = new Map<string, number>();
function nodeRadius(node: MapNode): number {
  const cached = _radiusCache.get(node.id);
  if (cached !== undefined) return cached;
  const base = node.type === "emotion" ? 12 : 4.5;
  const raw = base * (node.weight ?? 1);
  const r = node.type === "emotion" ? Math.max(10, raw)
    : node.type === "color" ? Math.max(5, raw)
    : Math.max(3, raw);
  _radiusCache.set(node.id, r);
  return r;
}

const GLYPH: Partial<Record<string, string>> = {
  artwork: ICON.artwork, music: ICON.music, film: ICON.film,
  poem: ICON.poem, sculpture: ICON.sculpture, dance: ICON.dance,
  architecture: ICON.architecture, photography: ICON.photography,
  literature: ICON.literature, ritual: ICON.ritual, theater: ICON.theater,
};

function hexToNum(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

interface Props {
  layout: MapLayoutPayload;
}

export function SemanticMap({ layout }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const nodesRef = useRef<MapNode[]>(layout.nodes);
  const { hoveredNode, selectedNode, activeFilter, activeTribe, setHoveredNode, setSelectedNode } = useMapStore();
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [linkMode, setLinkMode] = useState<"curated" | "emergent" | "both">("both");
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setSelectedNode(null);
    setHoveredNode(null);
    return () => { setSelectedNode(null); setHoveredNode(null); };
  }, [setSelectedNode, setHoveredNode]);

  useEffect(() => {
    const update = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const nodes = nodesRef.current;
  const curatedLinks = layout.curatedLinks;
  const emergentLinks = layout.emergentLinks;
  const viewBox = layout.viewBox;

  const nodeQuadtree = useMemo(() => {
    return d3.quadtree<MapNode>()
      .x((d) => d.x ?? 0)
      .y((d) => d.y ?? 0)
      .addAll(nodes.filter((n) => n.x !== undefined && n.y !== undefined));
  }, [nodes]);

  const pivot = hoveredNode ?? selectedNode;

  const connectedIds = useMemo(() => {
    if (!pivot) return new Set<string>();
    const s = new Set<string>([pivot]);
    const eat = (sid: string, tid: string) => {
      if (sid === pivot) s.add(tid);
      else if (tid === pivot) s.add(sid);
    };
    for (const l of curatedLinks) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      eat(sId, tId);
    }
    for (const l of emergentLinks) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      eat(sId, tId);
    }
    return s;
  }, [pivot, curatedLinks, emergentLinks]);

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

  const echoIds = useMemo(() => {
    if (!pivot) return new Set<string>();
    const e = new Set<string>();
    for (const l of curatedLinks) {
      const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
      if (connectedIds.has(sId) && !connectedIds.has(tId)) e.add(tId);
      else if (connectedIds.has(tId) && !connectedIds.has(sId)) e.add(sId);
    }
    return e;
  }, [connectedIds, curatedLinks, pivot]);

  const isNodeFiltered = useCallback((node: MapNode) => {
    if (activeFilter && node.type !== activeFilter) return false;
    if (activeTribe && node.type === "emotion" && node.tribe !== activeTribe) return false;
    return true;
  }, [activeFilter, activeTribe]);

  const handleNodeClick = useCallback((node: MapNode) => {
    trackEvent("node_clicked", { nodeId: node.id, type: node.type });
    setSelectedNode(selectedNode === node.id ? null : node.id);
  }, [selectedNode, setSelectedNode]);

  // ─── PixiJS Application ────────────────────────────────────────────
  // Created ONCE on mount. Reads Zustand state directly in the ticker
  // instead of depending on React state, so it never re-creates on hover.
  useEffect(() => {
    if (!containerRef.current || !dimensions.w) return;

    const app = new Application();
    let destroyed = false;

    (async () => {
      await app.init({
        width: dimensions.w,
        height: dimensions.h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) { app.destroy(); return; }

      containerRef.current!.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const scaleX = dimensions.w / viewBox.w;
      const scaleY = dimensions.h / viewBox.h;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (dimensions.w - viewBox.w * scale) / 2;
      const offsetY = (dimensions.h - viewBox.h * scale) / 2;

      worldContainer.scale.set(scale);
      worldContainer.position.set(offsetX, offsetY);

      const linksLayer = new Container();
      const ambientLayer = new Container();
      const attentionLayer = new Container();
      const labelsLayer = new Container();
      worldContainer.addChild(linksLayer, ambientLayer, attentionLayer, labelsLayer);

      // ── Helper: compute connected IDs for a pivot ────────────
      function computeConnected(pivotId: string): Set<string> {
        const s = new Set<string>([pivotId]);
        for (const l of curatedLinks) {
          const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
          if (sId === pivotId) s.add(tId);
          else if (tId === pivotId) s.add(sId);
        }
        for (const l of emergentLinks) {
          const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
          if (sId === pivotId) s.add(tId);
          else if (tId === pivotId) s.add(sId);
        }
        return s;
      }

      // ── Entry animation ─────────────────────────────────────────
      const entryStart = performance.now();
      const ENTRY_DURATION = 1400;
      let entryDone = false;

      function entryProgress(node: MapNode, t: number): number {
        if (entryDone) return 1;
        const elapsed = t - entryStart;
        const delay = node.type === "emotion" ? 0 : 400;
        const raw = (elapsed - delay) / 800;
        if (raw >= 1) return 1;
        if (raw <= 0) return 0;
        return raw * raw * (3 - 2 * raw);
      }

      // ── Ambient nodes (drawn once, redrawn on state change) ───
      const ambientGfx = new Graphics();
      ambientLayer.addChild(ambientGfx);
      let lastPivot: string | null = "__init__";

      function drawAmbientNodes(t: number, piv: string | null, conn: Set<string>) {
        ambientGfx.clear();
        const store = useMapStore.getState();

        for (const node of nodes) {
          if (node.x === undefined || node.y === undefined) continue;
          const ep = entryProgress(node, t);
          if (ep <= 0) continue;

          const r = nodeRadius(node) * ep;
          if (piv && (node.id === piv || conn.has(node.id))) continue;

          const af = store.activeFilter;
          const at = store.activeTribe;
          let filtered = true;
          if (af && node.type !== af) filtered = false;
          if (at && node.type === "emotion" && node.tribe !== at) filtered = false;

          let opacity = !filtered ? 0.06 : !piv ? 1 : 0.12;
          opacity *= ep;

          const color = hexToNum(node.color ?? "#888");
          if (node.type !== "color") {
            ambientGfx.circle(node.x, node.y, r);
            ambientGfx.fill({ color, alpha: node.type === "emotion" ? opacity : opacity * 0.65 });
          }
          ambientGfx.circle(node.x, node.y, r);
          ambientGfx.stroke({ color, width: node.type === "emotion" ? 1.2 : 0.6, alpha: opacity * 0.7 });
        }
      }

      // ── Attention nodes ─────────────────────────────────────────
      function drawAttentionNodes(t: number, piv: string | null, conn: Set<string>) {
        attentionLayer.removeChildren();
        if (!piv) return;

        for (const node of nodes) {
          if (node.x === undefined || node.y === undefined) continue;
          if (node.id !== piv && !conn.has(node.id)) continue;
          const ep = entryProgress(node, t);
          if (ep <= 0) continue;

          const off = personalityOffset(node, t);
          const x = node.x + off.dx;
          const y = node.y + off.dy;
          const r = nodeRadius(node) * off.scale * ep;
          const color = hexToNum(node.color ?? "#888");
          const isHovered = node.id === useMapStore.getState().hoveredNode;

          const gfx = new Graphics();
          if (node.type === "emotion") {
            gfx.circle(0, 0, r + 22 + off.glow * 10);
            gfx.fill({ color, alpha: isHovered ? 0.22 : 0.10 + off.glow * 0.08 });
            gfx.circle(0, 0, r);
            gfx.fill({ color, alpha: 1 });
            gfx.stroke({ color, width: 1.2, alpha: 0.95 });
          } else if (node.type === "color") {
            gfx.circle(0, 0, r + 1.5);
            gfx.fill({ color, alpha: isHovered ? 0.9 : 0.55 });
            gfx.circle(0, 0, r);
            gfx.stroke({ color, width: 0.6, alpha: 0.8 });
          } else {
            gfx.circle(0, 0, r);
            gfx.fill({ color, alpha: 0.65 });
            gfx.stroke({ color, width: 0.6, alpha: 0.55 });
          }
          gfx.position.set(x, y);
          attentionLayer.addChild(gfx);
        }
      }

      // ── Links ───────────────────────────────────────────────────
      const linksGfx = new Graphics();
      linksLayer.addChild(linksGfx);

      function drawLinks(t: number, piv: string | null) {
        linksGfx.clear();
        const globalEntry = entryDone ? 1 : Math.max(0, (t - entryStart - 600) / 600);
        if (globalEntry <= 0) return;

        const store = useMapStore.getState();
        // Read linkMode from a closure-safe ref (updated via Zustand subscribe)
        const mode = currentLinkMode;

        if (mode !== "emergent") {
          for (const l of curatedLinks) {
            const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
            const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
            const s = typeof l.source === "object" ? (l.source as MapNode) : nodes.find((n) => n.id === sId);
            const tNode = typeof l.target === "object" ? (l.target as MapNode) : nodes.find((n) => n.id === tId);
            if (!s?.x || !s?.y || !tNode?.x || !tNode?.y) continue;

            const isDirect = piv && (sId === piv || tId === piv);
            const baseOpacity = piv ? (isDirect ? 0.55 : 0.03) : 0.11;
            const instability = linkInstability(l.ambiguity ?? 0, sId, tId, t);
            const finalOpacity = baseOpacity * instability * Math.min(1, globalEntry);
            if (finalOpacity < 0.01) continue;

            const color = l.resonanceType === "emotional" ? 0xC8935A
              : l.resonanceType === "sensory" ? 0x5A9AB0 : 0x6A6A8A;
            linksGfx.moveTo(s.x, s.y);
            linksGfx.lineTo(tNode.x, tNode.y);
            linksGfx.stroke({ color, width: l.strength * (isDirect ? 1.8 : 1.4), alpha: finalOpacity });
          }
        }

        if ((mode === "emergent" || mode === "both") && piv) {
          for (const l of emergentLinks) {
            const sId = typeof l.source === "string" ? l.source : (l.source as MapNode).id;
            const tId = typeof l.target === "string" ? l.target : (l.target as MapNode).id;
            if (sId !== piv && tId !== piv) continue;
            const s = typeof l.source === "object" ? (l.source as MapNode) : nodes.find((n) => n.id === sId);
            const tNode = typeof l.target === "object" ? (l.target as MapNode) : nodes.find((n) => n.id === tId);
            if (!s?.x || !s?.y || !tNode?.x || !tNode?.y) continue;

            linksGfx.moveTo(s.x, s.y);
            linksGfx.lineTo(tNode.x, tNode.y);
            linksGfx.stroke({ color: 0x4A9AA0, width: Math.max(0.8, (l.strength - 0.7) * 6), alpha: 0.7 * Math.min(1, globalEntry) });
          }
        }
      }

      // ── Labels ──────────────────────────────────────────────────
      const labelStyle = new TextStyle({
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 9, fill: "#cccccc", letterSpacing: 0.4,
      });
      const labelMap = new Map<string, Text>();
      for (const node of nodes) {
        if (node.type !== "emotion" || !node.x || !node.y) continue;
        const label = new Text({ text: node.label, style: labelStyle });
        label.anchor.set(0.5, 0);
        label.position.set(node.x, node.y + nodeRadius(node) + 14);
        label.alpha = 0;
        labelsLayer.addChild(label);
        labelMap.set(node.id, label);
      }

      // ── linkMode — read via closure-safe variable ──────────────
      let currentLinkMode: "curated" | "emergent" | "both" = "both";

      // ── Render loop (throttled: ambient redraws only on change) ─
      let cachedConn = new Set<string>();

      app.ticker.maxFPS = 30; // 30fps is enough, saves GPU

      app.ticker.add(() => {
        const t = performance.now();
        if (!entryDone && t - entryStart > ENTRY_DURATION) entryDone = true;

        const store = useMapStore.getState();
        const piv = store.hoveredNode ?? store.selectedNode;

        // Recompute connected IDs only when pivot changes
        if (piv !== lastPivot) {
          cachedConn = piv ? computeConnected(piv) : new Set();
          lastPivot = piv;
          drawAmbientNodes(t, piv, cachedConn);
        }

        // During entry animation, redraw ambient every frame
        if (!entryDone) drawAmbientNodes(t, piv, cachedConn);

        drawLinks(t, piv);
        drawAttentionNodes(t, piv, cachedConn);

        for (const [id, label] of labelMap) {
          const node = nodes.find((n) => n.id === id);
          const ep = node ? entryProgress(node, t) : 1;
          if (!piv) { label.alpha = 0.7 * ep; continue; }
          if (cachedConn.has(id) || id === piv) label.alpha = 0.9 * ep;
          else label.alpha = 0.15 * ep;
        }
      });

      // ── Zoom & Pan ─────────────────────────────────────────────
      let zoomK = scale;
      let panX = offsetX;
      let panY = offsetY;
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragStartPanX = 0;
      let dragStartPanY = 0;

      const canvas = app.canvas as HTMLCanvasElement;

      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = -e.deltaY * 0.001;
        const newK = Math.max(0.3 * scale, Math.min(3 * scale, zoomK * (1 + delta)));
        const ratio = newK / zoomK;
        panX = mouseX - (mouseX - panX) * ratio;
        panY = mouseY - (mouseY - panY) * ratio;
        zoomK = newK;
        worldContainer.scale.set(zoomK);
        worldContainer.position.set(panX, panY);
        setTransform({ x: panX, y: panY, k: zoomK });
      }, { passive: false });

      canvas.addEventListener("pointerdown", (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartPanX = panX;
        dragStartPanY = panY;
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = "grabbing";
      });

      canvas.addEventListener("pointermove", (e) => {
        if (isDragging) {
          panX = dragStartPanX + (e.clientX - dragStartX);
          panY = dragStartPanY + (e.clientY - dragStartY);
          worldContainer.position.set(panX, panY);
          setTransform({ x: panX, y: panY, k: zoomK });
        }
        const rect = canvas.getBoundingClientRect();
        const wx = (e.clientX - rect.left - panX) / zoomK;
        const wy = (e.clientY - rect.top - panY) / zoomK;
        const found = nodeQuadtree.find(wx, wy, 40 / zoomK);
        const store = useMapStore.getState();
        if (found) {
          if (store.hoveredNode !== found.id) {
            store.setHoveredNode(found.id);
            trackEvent("node_hovered", { nodeId: found.id, type: found.type });
          }
          if (!isDragging) canvas.style.cursor = "pointer";
        } else {
          if (store.hoveredNode) store.setHoveredNode(null);
          if (!isDragging) canvas.style.cursor = "grab";
        }
      });

      canvas.addEventListener("pointerup", (e) => {
        isDragging = false;
        const down = pointerDownRef.current;
        pointerDownRef.current = null;
        if (!down) return;
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (dx * dx + dy * dy > 25) return;

        const rect = canvas.getBoundingClientRect();
        const wx = (e.clientX - rect.left - panX) / zoomK;
        const wy = (e.clientY - rect.top - panY) / zoomK;
        const found = nodeQuadtree.find(wx, wy, 40 / zoomK);
        const store = useMapStore.getState();
        if (found) {
          trackEvent("node_clicked", { nodeId: found.id, type: found.type });
          store.setSelectedNode(store.selectedNode === found.id ? null : found.id);
        } else {
          store.setSelectedNode(null);
        }
        canvas.style.cursor = store.hoveredNode ? "pointer" : "grab";
      });

      canvas.addEventListener("pointerleave", () => {
        isDragging = false;
        const store = useMapStore.getState();
        if (store.hoveredNode) store.setHoveredNode(null);
      });

      canvas.style.cursor = "grab";

      // ── Expose linkMode setter for the React UI ────────────────
      (containerRef.current as any).__setLinkMode = (m: typeof currentLinkMode) => {
        currentLinkMode = m;
      };
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        const canvas = appRef.current.canvas as HTMLCanvasElement;
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  const focusPoint = useMemo(() => {
    if (!pivot) return null;
    const n = nodes.find((x) => x.id === pivot);
    if (!n || !n.x || !n.y) return null;
    return { x: n.x * transform.k + transform.x, y: n.y * transform.k + transform.y };
  }, [pivot, nodes, transform]);

  if (!dimensions.w) return null;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" style={{ touchAction: "none" }} />

      {selectedNode && (
        <NodeFullPreview nodeId={selectedNode} nodes={nodes} onClose={() => setSelectedNode(null)} />
      )}

      {/* Link-mode toggle */}
      <div className="absolute top-20 right-6 z-10">
        <p className="text-[0.55rem] text-ink-faint mb-2 text-right"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}>ENLACES</p>
        <div className="flex flex-col gap-1 items-end">
          {([
            { id: "curated" as const, label: "CURADO" },
            { id: "emergent" as const, label: "EMERGENTE" },
            { id: "both" as const, label: "AMBOS" },
          ]).map((m) => (
            <button key={m.id} onClick={() => setLinkMode(m.id)}
              className="text-[0.55rem] px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/5"
              style={{
                fontFamily: "var(--font-technical)", letterSpacing: "0.15em",
                color: linkMode === m.id ? "#4A9AA0" : "var(--album-ink-faint)",
                border: `1px solid ${linkMode === m.id ? "#4A9AA0" : "transparent"}`,
              }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Tribe filters */}
      <div className="absolute top-20 left-4 z-10 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-4">
        <p className="text-[0.55rem] text-ink-faint mb-2 pl-1"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}>22 TRIBUS</p>
        <div className="flex flex-col gap-[3px]">
          {TRIBES.map((tribe) => {
            const isActive = activeTribe === tribe.id;
            const isDimmed = activeTribe !== null && !isActive;
            return (
              <div key={tribe.id} className="group flex items-stretch gap-1 transition-all duration-200">
                <button className="flex items-center gap-2 py-[3px] px-1.5 rounded-md transition-all duration-200 hover:bg-white/5 flex-1"
                  onClick={() => useMapStore.getState().setActiveTribe(isActive ? null : tribe.id)}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                    style={{
                      backgroundColor: tribe.color,
                      opacity: isDimmed ? 0.22 : 0.9,
                      boxShadow: isActive ? `0 0 10px ${tribe.color}A0` : "none",
                    }} />
                  <span className="text-[0.6rem] whitespace-nowrap transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-technical)",
                      color: isActive ? tribe.color : "var(--album-ink-faint)",
                      letterSpacing: "0.04em",
                    }}>{tribe.name}</span>
                </button>
                <a href={`/tribe/${tribe.id}`}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[0.55rem] text-ink-faint hover:text-ink transition-all duration-200 px-1 self-center"
                  style={{ fontFamily: "var(--font-technical)" }}
                  onClick={(e) => e.stopPropagation()}>↗</a>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-5 py-2.5 flex items-center gap-4">
        <span className="text-xs text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>
          72 emociones · 22 tribus
        </span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-xs text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>
          Haz clic para explorar
        </span>
      </div>
    </div>
  );
}
