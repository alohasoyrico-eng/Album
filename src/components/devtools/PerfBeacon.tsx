"use client";

import { useEffect } from "react";
import {
  markPerf,
  measureSince,
  logResources,
  logBundleResources,
  logNavTiming,
} from "@/lib/perfTrace";

interface Props {
  /** Page label used as prefix for all marks/measures (e.g. "emotion-overview"). */
  page: string;
  /**
   * Optional mark to measure "nav → mount" from. Defaults to
   * "emotion-nav-start" — set this mark in your click handler before
   * router.push() to capture the full transition cost.
   */
  sinceMark?: string;
}

/**
 * Drop into any page to instrument its mount lifecycle. After ~2.5s
 * it prints a console.group summary with:
 *   - Mount timing (nav-to-mount, fonts-ready)
 *   - Navigation timing (TTFB, DOMContentLoaded, etc.)
 *   - LCP
 *   - Long tasks ( > 50ms blocking the main thread)
 *   - All font requests (Google Fonts CSS + woff2)
 *   - JS/CSS bundle sizes
 *
 * Open the console, navigate, read the tables. That's it.
 */
export function PerfBeacon({ page, sinceMark = "emotion-nav-start" }: Props) {
  useEffect(() => {
    const mountMark = `${page}-mount`;
    markPerf(mountMark);

    // Measure click → mount duration if the nav-start mark exists.
    measureSince(`${page}-nav-to-mount`, sinceMark);

    let lcpObserver: PerformanceObserver | null = null;
    let longTaskObserver: PerformanceObserver | null = null;
    let lastLcp = 0;
    const longTasks: Array<{ start: number; duration: number }> = [];

    try {
      lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lastLcp = entry.startTime;
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // not supported in this browser
    }

    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push({ start: entry.startTime, duration: entry.duration });
        }
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
    } catch {
      // not supported
    }

    // document.fonts.ready resolves when EVERY font referenced by CSS is
    // either loaded or has timed out (per display strategy). This is the
    // honest "fonts are ready" signal — distinct from any individual fetch.
    let fontsReadyAt: number | null = null;
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsReadyAt = performance.now();
        // eslint-disable-next-line no-console
        console.log(`[perf] document.fonts.ready @ ${fontsReadyAt.toFixed(0)}ms`);
        measureSince(`${page}-fonts-ready`, mountMark);
      });
    }

    // Print the summary after 2.5s — enough time for LCP and font loads
    // to settle on a typical page.
    const tid = setTimeout(() => {
      /* eslint-disable no-console */
      console.group(`%c[perf] ${page} summary`, "color:#C8935A;font-weight:bold");

      console.log(`LCP: ${lastLcp.toFixed(0)}ms`);
      console.log(`fonts.ready: ${fontsReadyAt !== null ? fontsReadyAt.toFixed(0) + "ms" : "not yet resolved"}`);

      if (longTasks.length > 0) {
        console.log(`%clongtasks (${longTasks.length})`, "color:#E08070");
        console.table(longTasks.map((t) => ({
          start_ms: Math.round(t.start),
          duration_ms: Math.round(t.duration),
        })));
      } else {
        console.log("longtasks: none");
      }

      console.log("%cnavigation timing", "color:#90B8E0");
      logNavTiming();

      console.log("%cfont resources", "color:#90B8E0");
      logResources(/fonts|woff|gstatic/);

      console.log("%cJS/CSS bundle", "color:#90B8E0");
      logBundleResources();

      console.groupEnd();
      /* eslint-enable no-console */
    }, 2500);

    return () => {
      clearTimeout(tid);
      lcpObserver?.disconnect();
      longTaskObserver?.disconnect();
    };
  }, [page, sinceMark]);

  return null;
}
