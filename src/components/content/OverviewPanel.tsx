"use client";

import { useEffect, useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useContent } from "@/lib/content-context";
import { useVisits, type Visit } from "@/lib/use-visits";
import type { UserProfile } from "@/lib/types";

/* ------------------------------ icons ------------------------------ */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-6 w-6",
} as const;

const UsersIcon = () => (
  <svg {...iconProps}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18.5 15.6c1.6.7 2.7 2 3.1 4.4" /></svg>
);
const ClockIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
const ShieldIcon = () => (
  <svg {...iconProps}><path d="M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6l7-3z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>
);
const PenIcon = () => (
  <svg {...iconProps}><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" /><path d="M14.5 6.5l3 3" /></svg>
);
const EyeIcon = () => (
  <svg {...iconProps}><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" /></svg>
);

/* ----------------------------- helpers ----------------------------- */

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function relTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const cardCls = "rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-7";
const eyebrowCls = "text-[10px] font-bold uppercase tracking-[0.28em] text-muted";

/* ------------------------------ panel ------------------------------ */

export default function OverviewPanel({
  approved,
  pending,
  banned,
  batchReps,
  editors,
  members,
  onJump,
}: {
  approved: number;
  pending: number;
  banned: number;
  batchReps: number;
  editors: number;
  members: UserProfile[];
  onJump: (key: string) => void;
}) {
  const { visits, loaded } = useVisits();
  const content = useContent();
  const [dateLine, setDateLine] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client clock read, mirrors Footer/StatsBand
    setDateLine(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const traffic = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const d7 = todayStart - 6 * 86_400_000;
    const d30 = todayStart - 29 * 86_400_000;
    const inRange = (v: Visit, from: number) => v.ts >= from;
    const last7 = visits.filter((v) => inRange(v, d7));
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * 86_400_000;
      const dayEnd = dayStart + 86_400_000;
      days.push({
        label: new Date(dayStart).toLocaleDateString("en-US", { weekday: "narrow" }),
        count: visits.filter((v) => v.ts >= dayStart && v.ts < dayEnd).length,
      });
    }
    return {
      today: visits.filter((v) => inRange(v, todayStart)).length,
      last7: last7.length,
      last30: visits.filter((v) => inRange(v, d30)).length,
      membersSeen: new Set(last7.map((v) => v.uid).filter(Boolean)).size,
      days,
      maxDay: Math.max(1, ...days.map((d) => d.count)),
    };
  }, [visits]);

  const batches = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      if (m.status === "approved") counts.set(m.batch, (counts.get(m.batch) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([batch, count]) => ({ batch, count }))
      .sort((a, b) => b.count - a.count || b.batch.localeCompare(a.batch))
      .slice(0, 6);
  }, [members]);
  const maxBatch = Math.max(1, ...batches.map((b) => b.count));

  const latest = useMemo(
    () =>
      [...members]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [members],
  );

  const stats = [
    {
      icon: <UsersIcon />,
      value: approved,
      label: "Approved members",
      sub: `${members.length} accounts in total`,
      jump: "all-members",
      accent: false,
    },
    {
      icon: <ClockIcon />,
      value: pending,
      label: "Pending approvals",
      sub: pending > 0 ? "Waiting for your review" : "All caught up",
      jump: "approvals",
      accent: pending > 0,
    },
    {
      icon: <ShieldIcon />,
      value: batchReps,
      label: "Batch Reps",
      sub: "Including super admins",
      jump: "roles",
      accent: false,
    },
    {
      icon: <PenIcon />,
      value: editors,
      label: "Editors",
      sub: "Content team",
      jump: "roles",
      accent: false,
    },
  ];

  const quickActions: [string, string][] = [
    ["Approvals", "approvals"],
    ["All Members", "all-members"],
    ["Events", "events"],
    ["Announcements", "announcements"],
    ["Batch Groups", "batches"],
    ["Site Settings", "settings"],
  ];

  return (
    <div className="grid gap-6">
      {/* header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={eyebrowCls}>{dateLine || "Dashboard"}</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-ivory sm:text-4xl">
              Overview
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {approved} approved members across {batches.length}+ batches
              {pending > 0 ? (
                <>
                  , with <span className="font-semibold text-gold-2">{pending} registration{pending === 1 ? "" : "s"} waiting</span> for review
                </>
              ) : (
                ", and no registrations waiting"
              )}
              . {traffic.today} site visit{traffic.today === 1 ? "" : "s"} so far today.
            </p>
          </div>
          {pending > 0 && (
            <button
              type="button"
              onClick={() => onJump("approvals")}
              className="rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a1430] shadow-[0_0_24px_rgba(212,169,78,0.3)] transition hover:brightness-110"
            >
              Review {pending} pending
            </button>
          )}
        </div>
      </Reveal>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <button
              type="button"
              onClick={() => onJump(s.jump)}
              className={`card-lift w-full rounded-3xl border p-5 text-left sm:p-6 ${
                s.accent
                  ? "border-gold/50 bg-gold/[0.07] shadow-[0_0_28px_rgba(212,169,78,0.15)]"
                  : "border-ivory/10 bg-ink-2"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                  s.accent ? "border-gold/60 text-gold-2" : "border-gold/30 text-gold-2"
                } bg-gold/10`}
              >
                {s.icon}
              </span>
              <span className="font-display text-gold-gradient mt-4 block text-4xl font-extrabold sm:text-5xl">
                {s.value}
              </span>
              <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ivory/85">
                {s.label}
              </span>
              <span className={`mt-1 block text-[11px] ${s.accent ? "font-semibold text-gold-2" : "text-muted/80"}`}>
                {s.sub}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {/* visitors */}
      <Reveal>
        <section className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold-2">
                <EyeIcon />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-ivory">Site visitors</h3>
                <p className="text-[11px] text-muted">Who is coming to the portal, updated live as people browse.</p>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Live
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Visits today", traffic.today],
              ["Last 7 days", traffic.last7],
              ["Last 30 days", traffic.last30],
              ["Members seen · 7 days", traffic.membersSeen],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-ivory/[0.07] bg-ink px-4 py-4 text-center">
                <p className="font-display text-3xl font-extrabold text-ivory">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_1.2fr]">
            {/* last 7 days bars */}
            <div>
              <p className={eyebrowCls}>Visits · last 7 days</p>
              <div className="mt-4 flex h-28 items-end gap-2.5">
                {traffic.days.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-ivory/80">{d.count}</span>
                    <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-ivory/[0.04]">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-gold-deep via-gold to-gold-2 transition-all duration-700"
                        style={{ height: `${Math.max(6, (d.count / traffic.maxDay) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
                One visit is counted per person per page in a browsing session. Portal content so far:{" "}
                {content.events.length} events · {content.announcements.length} announcements ·{" "}
                {content.stories.length} stories · {content.businesses.length} businesses.
              </p>
            </div>

            {/* recent visitors */}
            <div>
              <p className={eyebrowCls}>Recent visitors</p>
              <div className="mt-3 grid gap-1">
                {!loaded ? (
                  <p className="py-4 text-sm text-muted">Loading visitors…</p>
                ) : visits.length === 0 ? (
                  <p className="rounded-2xl border border-ivory/[0.07] bg-ink px-4 py-5 text-sm leading-relaxed text-muted">
                    No visits recorded yet. Counting starts as soon as people browse the site.
                  </p>
                ) : (
                  visits.slice(0, 7).map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ivory/[0.03]">
                      {v.name ? (
                        <Avatar name={v.name} size="sm" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/15 bg-ink-3 text-muted">
                          <PersonIcon />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ivory">
                          {v.name ?? "Guest visitor"}
                          {v.role === "super_admin" && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gold-2">Super admin</span>}
                          {v.role === "admin" && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gold-2">Batch Rep</span>}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {v.path} · {v.device}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-muted/80">{relTime(v.ts)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* batches + latest + actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <section className={`${cardCls} h-full`}>
            <p className={eyebrowCls}>Members by batch</p>
            <div className="mt-5 grid gap-4">
              {batches.map((b) => (
                <div key={b.batch}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ivory">Batch {b.batch}</span>
                    <span className="text-xs text-muted">{b.count} member{b.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ivory/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-2 transition-all duration-700"
                      style={{ width: `${(b.count / maxBatch) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {batches.length === 0 && <p className="text-sm text-muted">No approved members yet.</p>}
            </div>
            {banned > 0 && (
              <button type="button" onClick={() => onJump("banned")} className="mt-6 text-xs font-bold uppercase tracking-widest text-red-300 hover:underline">
                {banned} banned account{banned === 1 ? "" : "s"} →
              </button>
            )}
          </section>
        </Reveal>

        <div className="grid gap-6">
          <Reveal>
            <section className={cardCls}>
              <div className="flex items-center justify-between">
                <p className={eyebrowCls}>Latest members</p>
                <button type="button" onClick={() => onJump("all-members")} className="text-[11px] font-bold uppercase tracking-widest text-gold-2 hover:underline">
                  View all →
                </button>
              </div>
              <div className="mt-4 grid gap-1">
                {latest.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ivory/[0.03]">
                    <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ivory">{m.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        Batch {m.batch} · {m.district}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        m.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : m.status === "banned"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-gold/15 text-gold-2"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
                {latest.length === 0 && <p className="text-sm text-muted">No members yet.</p>}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className={cardCls}>
              <p className={eyebrowCls}>Quick actions</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {quickActions.map(([label, key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onJump(key)}
                    className="rounded-2xl border border-ivory/10 bg-ink px-3 py-3.5 text-xs font-bold uppercase tracking-widest text-ivory/85 transition-colors hover:border-gold/45 hover:text-gold-2"
                  >
                    {label}
                    {key === "approvals" && pending > 0 && (
                      <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-ink">{pending}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
