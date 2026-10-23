"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Premium route-change flourish: a thin gold line sweeps across the
 * top of the viewport on every navigation (and once on first load).
 * Transform-only and pointer-events-none, so it can never jank or
 * block the page underneath.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px] origin-left bg-gradient-to-r from-gold-deep via-gold-2 to-gold-deep"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: [0, 0.72, 1], opacity: [1, 1, 0] }}
      transition={{ duration: 0.7, times: [0, 0.55, 1], ease: "easeOut" }}
    />
  );
}
