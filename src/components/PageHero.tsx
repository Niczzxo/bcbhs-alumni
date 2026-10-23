"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  /** Campus-photo banner treatment (dashboards, owner 2026-10-24). */
  banner?: boolean;
}

/** Inner-page hero, navy field, sunburst motif, gold eyebrow. */
export default function PageHero({ eyebrow, title, subtitle, banner }: PageHeroProps) {
  return (
    <section className="grain relative overflow-hidden border-b border-gold/20 bg-ink-2 pb-16 pt-36">
      {banner ? (
        <>
          <Image
            src="/images/school.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center brightness-[0.9]"
          />
          <div className="absolute inset-0 bg-ink/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/25 to-ink/80" />
          <div className="absolute bottom-4 right-5 text-right sm:right-10 lg:right-[3vw]">
            <p className="font-display text-base font-black leading-none tracking-wide text-ivory sm:text-lg">
              BCBHS <span className="text-gold-gradient">ALUMNI</span>
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.32em] text-gold-2">
              Est. 2023 · Bogura
            </p>
          </div>
        </>
      ) : (
        <div className="sunburst pointer-events-none absolute left-1/2 top-0 h-full w-[1000px] -translate-x-1/2 opacity-70" />
      )}
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
