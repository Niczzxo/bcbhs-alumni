"use client";

import { useEffect } from "react";

/**
 * Owner (2026-10-24): refreshing the home page must land on the
 * hero section, not on whatever scroll position the browser
 * restores. Only a genuine reload resets; normal navigation and
 * back/forward keep their natural behaviour.
 */
export default function HomeReloadTop() {
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type === "reload") {
      history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);
  return null;
}
