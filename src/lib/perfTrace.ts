"use client";

/**
 * Lightweight performance instrumentation for diagnosing slow emotion
 * page loads. Logs to console with a `[perf]` prefix so it's easy to
 * filter. Designed to answer:
 *
 *   1. Is the font fetching (the per-emotion typeset) actually the
 *      dominant cost, or is the JS bundle / adapter materialization
 *      the real bottleneck?
 *   2. How long does a node click → emotion page transition take end
 *      to end?
 *   3. Which third-party requests block the main thread or LCP?
 *
 * Usage:
 *   - `markPerf("emotion-nav-start")` before navigating
 *   - `<PerfBeacon page="emotion-overview" />` inside the destination page
 *   - Open DevTools console, navigate, read the tables that print after ~2.5s.
 *
 * Safe to leave in production builds — the cost is one mark + one effect
 * per page. We can strip it after we have the data we need.
 */

interface PerfEntry {
  label: string;
  durationMs: number;
  detail?: string;
}

declare global {
  interface Window {
    __albumPerf?: {
      marks: Map<string, number>;
      entries: PerfEntry[];
    };
  }
}

function getStore() {
  if (typeof window === "undefined") return null;
  if (!window.__albumPerf) {
    window.__albumPerf = { marks: new Map(), entries: [] };
  }
  return window.__albumPerf;
}

/** Mark a point in time. Survives across navigations in the same tab. */
export function markPerf(label: string): void {
  const store = getStore();
  if (!store) return;
  const t = performance.now();
  store.marks.set(label, t);
  try { performance.mark(label); } catch {}
  // eslint-disable-next-line no-console
  console.log(`[perf] mark "${label}" @ ${t.toFixed(0)}ms`);
}

/** Measure ms from a previous mark to now. Returns null if mark missing. */
export function measureSince(label: string, fromLabel: string): number | null {
  const store = getStore();
  if (!store) return null;
  const from = store.marks.get(fromLabel);
  if (from === undefined) return null;
  const dur = performance.now() - from;
  store.entries.push({ label, durationMs: dur, detail: `since ${fromLabel}` });
  // eslint-disable-next-line no-console
  console.log(`[perf] ${label}: ${dur.toFixed(0)}ms (since ${fromLabel})`);
  return dur;
}

/**
 * Dump every Resource Timing entry that matches a pattern. Default:
 * everything font-related (Google Fonts CSS endpoint + woff2 from
 * gstatic + any self-hosted fonts).
 */
export function logResources(filterPattern: RegExp = /fonts|woff|gstatic/): void {
  if (typeof window === "undefined") return;
  const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const matched = res.filter((r) => filterPattern.test(r.name));
  if (matched.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[perf] no resources matched ${filterPattern}`);
    return;
  }
  const rows = matched.map((r) => ({
    url: r.name.replace(/^https?:\/\//, "").slice(0, 70),
    initiator: r.initiatorType,
    "duration_ms": Math.round(r.duration),
    "waiting_ms": Math.round(r.responseStart - r.requestStart),
    "download_ms": Math.round(r.responseEnd - r.responseStart),
    "transfer_KB": r.transferSize ? Math.round(r.transferSize / 1024) : 0,
  }));
  // eslint-disable-next-line no-console
  console.table(rows);
}

/** Dump all script/css resources so we can see the JS bundle cost. */
export function logBundleResources(): void {
  if (typeof window === "undefined") return;
  const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const matched = res.filter((r) => /\.js(\?|$)|\.css(\?|$)/.test(r.name));
  if (matched.length === 0) return;
  const rows = matched
    .map((r) => ({
      url: r.name.replace(/^https?:\/\/[^/]+/, "").slice(0, 70),
      "duration_ms": Math.round(r.duration),
      "transfer_KB": r.transferSize ? Math.round(r.transferSize / 1024) : 0,
    }))
    .sort((a, b) => b.transfer_KB - a.transfer_KB);
  // eslint-disable-next-line no-console
  console.table(rows);
}

/** Dump the standard Navigation Timing breakdown. */
export function logNavTiming(): void {
  if (typeof window === "undefined") return;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) {
    // eslint-disable-next-line no-console
    console.log("[perf] no navigation timing entry (soft nav)");
    return;
  }
  // eslint-disable-next-line no-console
  console.table({
    "type": nav.type,
    "ttfb_ms": Math.round(nav.responseStart - nav.requestStart),
    "html_download_ms": Math.round(nav.responseEnd - nav.responseStart),
    "dom_interactive_ms": Math.round(nav.domInteractive),
    "dom_content_loaded_ms": Math.round(nav.domContentLoadedEventEnd),
    "load_event_ms": Math.round(nav.loadEventEnd),
  });
}
