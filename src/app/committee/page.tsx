"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useContent } from "@/lib/content-context";

/** Alumni committee / leadership page — managed by staff. */
export default function CommitteePage() {
  const { committee } = useContent();
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Leadership"
          title={<>Guided by <span className="text-gold-gradient">our own</span></>}
          subtitle="The elected alumni committee — keeping the spirit alive: events, welfare, and the bond between batches."
        />
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          {committee.length === 0 ? (
            <p className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center text-sm text-muted">
              Committee seats will be announced soon.
            </p>
          ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {committee.map((seat, i) => (
              <Reveal key={seat.id} delay={i * 0.08}>
                <article className="h-full rounded-3xl border border-ivory/10 bg-ink-2 p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_18px_50px_rgba(212,169,78,0.12)]">
                  <div className="flex justify-center">
                    <Avatar name={seat.name} photoURL={seat.photoURL} size="md" />
                  </div>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{seat.role}</p>
                  <h3 className="font-display mt-2 text-xl font-bold text-ivory">{seat.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">Batch of {seat.batch}</p>
                  <div className="gold-rule mx-auto my-5 w-20" />
                  <p className="text-sm leading-relaxed text-muted">{seat.note}</p>
                </article>
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
