"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { Avatar } from "./MemberCard";
import { useLeadership } from "@/lib/leadership";
import { useContent } from "@/lib/content-context";

/* Shown only until real seats are added from the dashboard. */
const PLACEHOLDER_SEATS = [
  { role: "President", name: "To be announced", note: "সভাপতি" },
  { role: "Vice President", name: "To be announced", note: "সহ-সভাপতি" },
  { role: "General Secretary", name: "To be announced", note: "সাধারণ সম্পাদক" },
  { role: "Director", name: "To be announced", note: "পরিচালক" },
];

/**
 * Homepage Leadership strip. Shows THE leadership list (owner's
 * merge rule, 2026-10-23): profile position holders automatically,
 * plus any hand-added committee seats; the placeholder cards appear
 * only while the list is completely empty. (This section used to be
 * hardcoded placeholders that never showed the real seats.)
 */
export default function Committee() {
  const leaders = useLeadership();
  const { loading } = useContent();
  const hasSeats = leaders.length > 0;

  return (
    <section id="committee" className="grain relative overflow-hidden border-y border-gold/20 bg-ink-2 py-24">
      <div className="sunburst pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px]" />
      <div className="relative mx-auto w-full px-5 sm:px-10 lg:px-[3vw]">
        <Reveal className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Leadership
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-ivory sm:text-5xl">
            Guided by <span className="text-gold-gradient">our own</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            The alumni committee, elected from the community, keeps the spirit
            alive: events, welfare, and the bond between batches.
          </p>
          <div className="gold-rule mx-auto mt-6 w-56" />
        </Reveal>

        {hasSeats ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((seat, i) => (
              <Reveal key={seat.id} delay={Math.min(i, 5) * 0.12}>
                <article className="card-lift group h-full rounded-3xl border border-gold/15 bg-ink p-8 text-center transition-all duration-500 hover:border-gold/50 hover:shadow-[0_20px_60px_rgba(212,169,78,0.15)]">
                  <div className="flex justify-center">
                    <Avatar name={seat.name} photoURL={seat.photoURL} size="md" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
                    {seat.role}
                  </p>
                  <p className="font-display mt-2 text-xl font-semibold text-ivory">{seat.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {seat.batch ? `Batch of ${seat.batch}` : seat.note}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading the committee">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl border border-gold/15 bg-ink" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLACEHOLDER_SEATS.map((s, i) => (
              <Reveal key={s.role} delay={i * 0.12}>
                <article className="card-lift group rounded-3xl border border-gold/15 bg-ink p-8 text-center transition-all duration-500 hover:border-gold/50 hover:shadow-[0_20px_60px_rgba(212,169,78,0.15)]">
                  {/* avatar placeholder inside a seal ring */}
                  <div className="seal-ring mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-ink-3">
                    <span className="font-display text-3xl font-bold text-gold/70">
                      {s.role.charAt(0)}
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
                    {s.role}
                  </p>
                  <p className="font-display mt-2 text-xl font-semibold text-ivory">{s.name}</p>
                  <p className="mt-1 text-sm text-muted">{s.note}</p>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted/70">
          Committee seats are filled from verified alumni, managed in the admin panel.{" "}
          <Link href="/committee" className="font-semibold text-gold-2 hover:underline">
            Meet the committee →
          </Link>
        </p>
      </div>
    </section>
  );
}
