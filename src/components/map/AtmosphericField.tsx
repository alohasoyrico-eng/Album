"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMOTION_MAP } from "@/data/ontology/emotions";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { COLOR_MAP } from "@/data/colors/colorResonance";
interface AtmosphericFieldProps {
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  width: number;
  height: number;
  focusPoint: { x: number; y: number } | null;
}
interface Mote {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseOpacity: number;
  phase: number;
  freq: number;
}
const MOTE_COUNT = 38;
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
export function AtmosphericField({ hoveredNodeId, selectedNodeId, width, height, focusPoint }: AtmosphericFieldProps) {
  const motesRef = useRef<Mote[]>([]);
  const [, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  // ─── Resolve the active emotion (hovered or selected) ─────────────────────
  const activeId = hoveredNodeId ?? selectedNodeId;
  const activeEmotion = activeId ? EMOTION_MAP.get(activeId) : null;
  const activeTribe = activeEmotion ? TRIBE_MAP.get(activeEmotion.tribe) : null;
  const activeColor = activeId ? COLOR_MAP.get(activeId) : null;
  const tint = activeTribe?.color ?? activeColor?.hex ?? "#1a1a2a";
  // Temperature / Energy / Tension drive the field's character
  const r = activeEmotion?.resonance;
  const temperatureNorm = r ? (r.temperature - 50) / 50 : 0; // -1 cold, +1 warm
  const energyNorm = r ? r.energy / 100 : 0.35;
  const tensionNorm = r ? r.tension / 100 : 0.2;
  const intimacyNorm = r ? r.intimacy / 100 : 0.4;
  // ─── Initialize motes once ────────────────────────────────────────────────
  useEffect(() => {
    if (!width || !height) return;
    const rand = seededRand(7);
    motesRef.current = Array.from({ length: MOTE_COUNT }, (_, i) => ({
      id: i,
      x: rand() * width,
      y: rand() * height,
      vx: (rand() - 0.5) * 0.04,
      vy: (rand() - 0.5) * 0.04,
      r: 0.6 + rand() * 1.4,
      baseOpacity: 0.04 + rand() * 0.1,
      phase: rand() * Math.PI * 2,
      freq: 0.0004 + rand() * 0.0008,
    }));
  }, [width, height]);
  // ─── Drift loop (low-fps for performance) ─────────────────────────────────
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    const FRAME_MS = 1000 / 24;
    const step = (t: number) => {
      const dt = t - last;
      last = t;
      acc += dt;
      if (acc>= FRAME_MS) {
        acc = 0;
        // Influence vector: gentle pull toward focusPoint when an emotion is active
        const pull = focusPoint && activeEmotion ? 0.0008 * (0.4 + energyNorm) : 0;
        const jitter = tensionNorm * 0.06;
        for (const m of motesRef.current) {
          if (focusPoint && pull) {
            m.vx += (focusPoint.x - m.x) * pull * 0.001;
            m.vy += (focusPoint.y - m.y) * pull * 0.001;
          }
          if (jitter) {
            m.vx += (Math.random() - 0.5) * jitter;
            m.vy += (Math.random() - 0.5) * jitter;
          }
          // damping
          m.vx *= 0.985;
          m.vy *= 0.985;
          // step
          m.x += m.vx;
          m.y += m.vy;
          // wrap
          if (m.x < -20) m.x = width + 20;
          else if (m.x> width + 20) m.x = -20;
          if (m.y < -20) m.y = height + 20;
          else if (m.y> height + 20) m.y = -20;
        }
        setTick((n) => (n + 1) % 1000000);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [width, height, focusPoint, activeEmotion, energyNorm, tensionNorm]);
  // ─── Radial focus field ────────────────────────────────────────────────────
  const focusGradient = useMemo(() => {
    if (!focusPoint || !activeEmotion) return null;
    const radius = 320 + energyNorm * 220 + intimacyNorm * 180;
    const intensity = 0.18 + 0.22 * (0.5 + temperatureNorm * 0.5);
    return { cx: focusPoint.x, cy: focusPoint.y, r: radius, color: tint, opacity: intensity };
  }, [focusPoint, activeEmotion, tint, energyNorm, intimacyNorm, temperatureNorm]);
  const t = performance.now();
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      width={width}
      height={height}
      aria-hidden
>
      <defs>
        {/* The atmospheric tint that emanates from the active emotion */}
        {focusGradient && (
          <radialGradient id="atmos-focus" cx={focusGradient.cx} cy={focusGradient.cy} r={focusGradient.r} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={focusGradient.color} stopOpacity={focusGradient.opacity} />
            <stop offset="55%" stopColor={focusGradient.color} stopOpacity={focusGradient.opacity * 0.35} />
            <stop offset="100%" stopColor={focusGradient.color} stopOpacity={0} />
          </radialGradient>
        )}
        {/* Mote glow */}
        <radialGradient id="mote-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Base ambient wash that slightly warms / cools with the active emotion.
          Critical: must default to TRANSPARENT — a bare <rect> without fill
          paints black in SVG, which buries the parchment in light mode and
          makes ink labels unreadable on top. */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={
          activeEmotion
            ? `rgba(${parseInt(tint.slice(1, 3), 16)},${parseInt(tint.slice(3, 5), 16)},${parseInt(tint.slice(5, 7), 16)},${0.045 + temperatureNorm * 0.025})`
            : "transparent"
        }
        style={{ transition: "fill 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      {/* Radial focus field around the active emotion */}
      {focusGradient && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#atmos-focus)"
        />
      )}
      {/* Drifting motes (semantic fog particles) */}
      <g>
        {motesRef.current.map((m) => {
          const breathe = 0.5 + 0.5 * Math.sin(t * m.freq + m.phase);
          const opacity = m.baseOpacity * (0.4 + breathe * 0.6) * (activeEmotion ? 1.15 : 1);
          return (
            <circle
              key={m.id}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="url(#mote-glow)"
              opacity={opacity}
            />
          );
        })}
      </g>
    </svg>
  );
}
