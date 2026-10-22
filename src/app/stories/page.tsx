"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";

/** Hall of Fame, success stories of notable BCBHS alumni. */
export default function StoriesPage() {
  const { stories } = useContent();
  const sorted = [...stories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Hall of Fame"
          title={<>Success <span className="text-gold-gradient">Stories</span></>}
          subtitle="BCBHSians who make us proud, in service, business, academia and beyond. Their journeys light the way for every junior."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {sorted.length === 0 ? (
            <p className="text-center text-sm text-muted">The first stories are being written, check back soon.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((s, i) => (
                <Reveal key={s.id} delay={Math.min(i % 6, 5) * 0.06} className="flex flex-col rounded-3xl border border-gold/20 bg-ink-2 p-7">
                  <div className="flex items-center gap-4">
                    <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gold/40 bg-ink">
                      {s.photoURL ? (
                        <Image src={s.photoURL} alt={s.name} fill className="object-cover" />
                      ) : (
                        <span className="font-display flex h-full w-full items-center justify-center text-2xl font-extrabold text-gold/60">
                          {s.name.charAt(0)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display truncate text-lg font-bold text-ivory">{s.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gold-2">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted">Batch {s.batch}</p>
                    </div>
                  </div>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-muted">{s.story}</p>
                  <div className="gold-rule mt-6 w-24" />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
