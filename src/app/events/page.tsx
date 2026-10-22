"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import type { PortalEvent } from "@/lib/types";

/** One event card; its pictures form a small gallery, first is the cover. */
function EventCard({ e, i }: { e: PortalEvent; i: number }) {
  const images = e.images ?? [];
  const [active, setActive] = useState(0);
  const shown = images[Math.min(active, images.length - 1)];
  return (
    <Reveal delay={Math.min(i, 5) * 0.07}>
      <article className="group h-full rounded-3xl border border-ivory/10 bg-ink-2 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
        {images.length > 0 && (
          <div className="mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt={e.title} className="h-44 w-full rounded-2xl object-cover" />
            {images.length > 1 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {images.map((src, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setActive(j)}
                    aria-label={`Show picture ${j + 1} of ${e.title}`}
                    className={`h-12 w-16 overflow-hidden rounded-lg ring-2 transition-all ${j === active ? "ring-gold" : "opacity-60 ring-transparent hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${e.upcoming ? "bg-gold/15 text-gold-2" : "bg-ivory/10 text-muted"}`}>
            {e.upcoming ? "Upcoming" : "Past"}
          </span>
          <span className="font-mono text-xs text-muted">{e.date}</span>
        </div>
        <h3 className="font-display mt-4 text-2xl font-bold text-ivory group-hover:text-gold-2">{e.title}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold">📍 {e.venue}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{e.description}</p>
      </article>
    </Reveal>
  );
}

/** Events & reunions, upcoming and past. */
export default function EventsPage() {
  const { events } = useContent();
  const upcoming = events.filter((e) => e.upcoming);
  const past = events.filter((e) => !e.upcoming);

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Gather & celebrate"
          title={<>Events & <span className="text-gold-gradient">Reunions</span></>}
          subtitle="From grand reunions to blood drives, never miss a moment with your batchmates."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <h2 className="font-display text-2xl font-bold text-ivory">Upcoming</h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e, i) => <EventCard key={e.id} e={e} i={i} />)}
          </div>

          <h2 className="font-display mt-16 text-2xl font-bold text-ivory">Past highlights</h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {past.map((e, i) => <EventCard key={e.id} e={e} i={i} />)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
