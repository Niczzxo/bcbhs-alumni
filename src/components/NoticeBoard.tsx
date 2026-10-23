"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { useContent } from "@/lib/content-context";
import type { AnnouncementItem } from "@/lib/types";

/** "12 Oct 2026" style date, matching the Jobs board format. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** True when the notice was posted within the last 7 days of `now`. */
function isFresh(iso: string, now: number | null): boolean {
  if (now === null) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && now - t < 7 * 24 * 60 * 60 * 1000;
}

function NoticeCard({
  item,
  index,
  now,
}: {
  item: AnnouncementItem;
  index: number;
  now: number | null;
}) {
  const d = new Date(item.createdAt);
  const valid = !Number.isNaN(d.getTime());
  const day = valid ? d.getDate().toString().padStart(2, "0") : "-";
  const month = valid
    ? d.toLocaleDateString("en-GB", { month: "short" })
    : "";
  const year = valid ? d.getFullYear().toString() : "";

  return (
    <Reveal delay={(index % 3) * 0.12} className="h-full">
      <article className="card-lift group relative flex h-full gap-5 overflow-hidden rounded-3xl border border-gold/15 bg-ink-2/80 p-6 transition-all duration-500 hover:border-gold/50 hover:shadow-[0_20px_60px_rgba(212,169,78,0.18)] sm:p-7">
        {/* gold pin dot, the notice-board touch */}
        <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_10px_rgba(212,169,78,0.8)]" />

        {/* date badge */}
        <div className="flex h-fit shrink-0 flex-col items-center rounded-2xl border border-gold/30 bg-ink px-3 py-2.5 text-center">
          <span className="font-display text-2xl font-bold leading-none text-gold">
            {day}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {month} {year}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <h3 className="font-display text-lg font-bold leading-snug text-ivory transition-colors group-hover:text-gold-2 sm:text-xl">
              {item.title}
            </h3>
            {isFresh(item.createdAt, now) && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                New
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {item.body}
          </p>
          <p className="mt-3 text-xs text-muted/70">{formatDate(item.createdAt)}</p>
        </div>
      </article>
    </Reveal>
  );
}

/**
 * Notice Board, public display for announcements posted from the
 * admin / super-admin dashboard. Newest first; renders nothing at all
 * when there are no announcements, so the homepage never shows an
 * empty board.
 */
export default function NoticeBoard() {
  const { announcements } = useContent();
  /* "Now" is read on the client after mount only, Cache Components
     forbids Date.now() during prerender. Null until mounted, so the
     NEW badge simply appears once the page hydrates. */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client clock read for the NEW badge
    setNow(Date.now());
  }, []);

  const sorted = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sorted.length === 0) return null;

  return (
    <section id="notices" className="relative py-20 sm:py-24">
      <div className="mx-auto w-full px-5 sm:px-10 lg:px-[3vw]">
        <Reveal className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Announcements
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-ivory sm:text-5xl">
            Notice <span className="text-gold-gradient">Board</span>
          </h2>
          <div className="gold-rule mx-auto mt-6 w-56" />
        </Reveal>

        <div
          className={
            sorted.length === 1
              ? "mx-auto max-w-3xl"
              : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {sorted.slice(0, 6).map((a, i) => (
            <NoticeCard key={a.id} item={a} index={i} now={now} />
          ))}
        </div>
      </div>
    </section>
  );
}
