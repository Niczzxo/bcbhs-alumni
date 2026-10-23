"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}

/** Inner-page hero, navy field, sunburst motif, gold eyebrow. */
export default function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="grain relative overflow-hidden border-b border-gold/20 bg-ink-2 pb-16 pt-36">
      <div className="sunburst pointer-events-none absolute left-1/2 top-0 h-full w-[1000px] -translate-x-1/2 opacity-70" />
      <div className="relative mx-auto w-full px-5 text-center sm:px-10 lg:px-[3vw]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-ivory sm:text-5xl">{title}</h1>
          <motion.div
            className="gold-rule mx-auto mt-6 w-48 origin-center"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          {subtitle && <p className="mx-auto mt-6 max-w-2xl text-muted">{subtitle}</p>}
        </motion.div>
      </div>
    </section>
  );
}
