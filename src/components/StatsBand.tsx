"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSiteStats } from "@/lib/data";
import Reveal from "./Reveal";

/** Animated number that counts up when scrolled into view. */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out cubic
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to]);

  return (
    <span ref={ref} className="font-display text-gold-gradient text-5xl font-extrabold sm:text-6xl">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Gold-on-navy stats band, live Firestore counts when configured. */
export default function StatsBand() {
  const stats = useSiteStats();
  const items = [
    { label: "Registered Members", value: stats.totalMembers, suffix: "+" },
    { label: "Living Abroad", value: stats.membersAbroad, suffix: "+" },
    { label: "Batches Connected", value: stats.batches, suffix: "" },
    { label: "Events & Reunions", value: stats.eventsHeld, suffix: "" },
  ];
  return (
    <section className="grain relative overflow-hidden border-y border-gold/20 bg-ink-2 py-16">
      <div className="sunburst pointer-events-none absolute left-1/2 top-0 h-full w-[900px] -translate-x-1/2 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Our community in numbers
          </p>
          <div className="gold-rule mx-auto mt-4 w-48" />
        </Reveal>
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {items.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.12} className="text-center">
              <Counter to={s.value} suffix={s.suffix} />
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-muted">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted/70">
          {stats.live
            ? "Live counters, synced with the member database."
            : "* Live counters, connected to the member database at launch."}
        </p>
      </div>
    </section>
  );
}
