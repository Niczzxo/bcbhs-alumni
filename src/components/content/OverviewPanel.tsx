"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
const BarChartIcon = () => (
  <svg {...iconProps}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /><path d="M4 20h-2M22 20H2" opacity="0" /></svg>
);
const CalendarIcon = () => (
  <svg {...iconProps}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
const MegaphoneIcon = () => (
  <svg {...iconProps}><path d="M4 10v4l3 .5V9.5L4 10zM7 9.5L19 5v13l-12-3.5" /><path d="M9 15l1.2 5" /></svg>
);
const ChatIcon = () => (
  <svg {...iconProps}><path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 4V6z" /></svg>
);
const GearIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8l1.2 2.7 2.9-.7 1 2.8 2.9.7-.6 2.9 2 2.1-2 2.1.6 2.9-2.9.7-1 2.8-2.9-.7L12 21.2l-1.2-2.7-2.9.7-1-2.8-2.9-.7.6-2.9-2-2.1 2-2.1-.6-2.9 2.9-.7 1-2.8 2.9.7L12 2.8z" strokeWidth="1.3" /></svg>
);
const ZapIcon = () => (
  <svg {...iconProps}><path d="M13 2.5L4.5 13.5H11L9.8 21.5 18.5 10H12l1-7.5z" /></svg>
);
const CheckCircleIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.4 2.4L15.7 9.5" /></svg>
);
const EyeMini = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>
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

/* ------------------------- visits chart ------------------------- */

interface DayPoint {
  label: string;
  weekday: string;
  dateLabel: string;
  count: number;
}

/** Round a max value up to a tidy axis ceiling (1/2/5 × 10^n). */
function niceCeil(v: number): number {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const f = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return f * pow;
}

/**
 * Professional 7-day traffic chart (owner, 2026-10-24): axes,
 * gridlines, a smooth gold curve over a gradient area, a dashed
 * daily-average line, and a hover/tap tooltip per day. Pure SVG —
 * no chart library, drawn from the real visit counts.
 */
function VisitsChart({ days, avg }: { days: DayPoint[]; avg: number }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 520;
  const H = 300;
  const L = 44;
  const R = 20;
  const T = 36;
  const B = 32;
  const iw = W - L - R;
  const ih = H - T - B;
  const yMax = niceCeil(Math.max(...days.map((d) => d.count), Math.ceil(avg)));
  const x = (i: number) => L + (i / (days.length - 1)) * iw;
  const y = (v: number) => T + ih - (v / yMax) * ih;
  const pts = days.map((d, i) => ({ x: x(i), y: y(d.count) }));

  // Catmull-Rom → cubic Bezier smoothing through the day points.
  const line = pts
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const p0 = pts[Math.max(0, i - 2)];
      const p1 = pts[i - 1];
      const p2 = pt;
      const p3 = pts[Math.min(pts.length - 1, i + 1)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      return `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    })
    .join(" ");
  const area = `${line} L ${pts[pts.length - 1].x} ${T + ih} L ${pts[0].x} ${T + ih} Z`;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const dense = days.length > 10;
  const a = active !== null ? days[active] : null;
  const ax = active !== null ? pts[active].x : 0;
  const ay = active !== null ? pts[active].y : 0;
  const tipX = Math.min(Math.max(ax - 56, L - 26), W - 118);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Visits over the last 7 days"
      onMouseLeave={() => setActive(null)}
    >
      <defs>
        <linearGradient id="visitsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9c766" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e9c766" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="visitsLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b98a2f" />
          <stop offset="55%" stopColor="#e9c766" />
          <stop offset="100%" stopColor="#b98a2f" />
        </linearGradient>
      </defs>

      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(244,234,214,0.08)" strokeDasharray={v === 0 ? "" : "3 5"} />
          <text x={L - 8} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="rgba(163,163,180,0.9)">
            {v}
          </text>
        </g>
      ))}

      {avg > 0 && (
        <g>
          <line x1={L} x2={W - R} y1={y(avg)} y2={y(avg)} stroke="rgba(233,199,102,0.45)" strokeDasharray="6 5" />
          <text x={W - R} y={y(avg) - 5} textAnchor="end" fontSize="9" fill="rgba(233,199,102,0.75)">
            avg {avg.toFixed(1)}/day
          </text>
        </g>
      )}

      <path d={area} fill="url(#visitsArea)" />
      <path d={line} fill="none" stroke="url(#visitsLine)" strokeWidth="2.6" strokeLinecap="round" />

      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={active === i ? (dense ? 5 : 6) : dense ? 3 : 4} fill="#0a1430" stroke="#e9c766" strokeWidth="2.4" />
          <circle
            cx={pt.x}
            cy={pt.y}
            r={dense ? "9" : "16"}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            style={{ cursor: "pointer" }}
          />
          {!dense && (
          <g pointerEvents="none">
            <rect x={pt.x - 12} y={pt.y - 27} width="24" height="15" rx="4.5" fill="#101c42" stroke="rgba(233,199,102,0.35)" />
            <text x={pt.x} y={pt.y - 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#f4ead6">
              {days[i].count}
            </text>
          </g>
          )}
          {(!dense || i % 5 === 0 || i === days.length - 1) && (
            <text x={pt.x} y={T + ih + 16} textAnchor="middle" fontSize="9.5" fill="rgba(163,163,180,0.9)">
              {days[i].dateLabel}
            </text>
          )}
        </g>
      ))}

      {a && (
        <g pointerEvents="none">
          <line x1={ax} x2={ax} y1={ay} y2={T + ih} stroke="rgba(233,199,102,0.35)" strokeDasharray="3 4" />
          <rect x={tipX} y={Math.max(2, ay - 52)} width="112" height="40" rx="9" fill="#101c42" stroke="rgba(233,199,102,0.4)" />
          <text x={tipX + 56} y={Math.max(2, ay - 52) + 17} textAnchor="middle" fontSize="10" fontWeight="700" fill="#f4ead6">
            {a.weekday}, {a.dateLabel}
          </text>
          <text x={tipX + 56} y={Math.max(2, ay - 52) + 31} textAnchor="middle" fontSize="10" fill="#e9c766">
            {a.count} visit{a.count === 1 ? "" : "s"}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ------------------------ all-visitors modal ------------------------ */

function fmtWhen(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

/**
 * Guest trails fold identical (page, device) visits into one row
 * with a count — a wall of '/' rows helps nobody (owner, 2026-10-24).
 */
function aggregateGuestTrail(visits: Visit[]): (Visit & { times: number })[] {
  const map = new Map<string, Visit & { times: number }>();
  for (const v of visits) {
    const key = v.path + "|" + v.device;
    const cur = map.get(key);
    if (cur) {
      cur.times += 1;
      cur.ts = Math.max(cur.ts, v.ts);
    } else {
      map.set(key, { ...v, times: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.ts - a.ts);
}

interface VisitorGroup {
  key: string;
  name: string;
  profile?: UserProfile;
  guest: boolean;
  visits: Visit[];
}

/**
 * Every recorded visit, grouped by person (owner, 2026-10-24):
 * who came, when, and which pages they opened — the detail view
 * behind the Who Visited wall's "View all visitors" button.
 */
function VisitorsModal({
  visits,
  members,
  onClose,
}: {
  visits: Visit[];
  members: UserProfile[];
  onClose: () => void;
}) {
  const groups = useMemo<VisitorGroup[]>(() => {
    const map = new Map<string, VisitorGroup>();
    for (const v of visits) {
      const key = v.uid && v.name ? v.uid : "__guest";
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          name: v.name ?? "Guest visitors",
          profile: v.uid ? members.find((m) => m.id === v.uid) : undefined,
          guest: key === "__guest",
          visits: [],
        };
        map.set(key, g);
      }
      g.visits.push(v);
    }
    const list = [...map.values()];
    for (const g of list) g.visits.sort((a, b) => b.ts - a.ts);
    // Members first (most recent first); the anonymous guest group
    // always sits last (owner, 2026-10-24).
    list.sort((a, b) => {
      if (a.guest !== b.guest) return a.guest ? 1 : -1;
      return (b.visits[0]?.ts ?? 0) - (a.visits[0]?.ts ?? 0);
    });
    return list;
  }, [visits, members]);

  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="All visitors">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-ink/80 backdrop-blur-sm" />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gold/25 bg-ink-2 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-ivory/10 px-6 py-5">
          <div>
            <h3 className="font-display text-2xl font-bold text-ivory">All visitors</h3>
            <p className="mt-1 text-xs text-muted">
              The last {visits.length} recorded visits — who came, when, and which pages they opened.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/15 text-muted transition-colors hover:border-gold/40 hover:text-gold-2"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {groups.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted">No visits recorded yet.</p>
          ) : (
            <div className="grid gap-2.5">
              {groups.map((g) => {
                const expanded = open === g.key;
                return (
                  <div key={g.key} className="overflow-hidden rounded-2xl border border-ivory/[0.08] bg-ink">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : g.key)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                      aria-expanded={expanded}
                    >
                      {g.guest ? (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/15 bg-ink-3 text-muted">
                          <PersonIcon />
                        </span>
                      ) : (
                        <Avatar name={g.name} photoURL={g.profile?.photoURL} size="ml" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ivory">{g.name}</span>
                        <span className="block truncate text-[11px] text-muted">
                          {g.guest ? "Anonymous guests" : g.profile ? `Batch ${g.profile.batch}` : "Member"} ·{" "}
                          {g.visits.length} visit{g.visits.length === 1 ? "" : "s"} · latest {relTime(g.visits[0].ts)}
                        </span>
                      </span>
                      <span className={`shrink-0 text-gold-2 transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}>›</span>
                    </button>
                    {expanded && (
                      <div className="border-t border-ivory/[0.07] px-4 py-2">
                        {(g.guest ? aggregateGuestTrail(g.visits) : g.visits.map((v) => ({ ...v, times: 1 }))).map((v) => (
                          <div key={v.path + v.device + v.ts} className="flex items-center gap-3 border-b border-ivory/[0.05] py-2.5 last:border-0">
                            <span className="min-w-0 flex-1 truncate rounded-lg bg-ivory/[0.04] px-2.5 py-1 font-mono text-[11px] text-gold-2">
                              {v.path}
                            </span>
                            {v.times > 1 && (
                              <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-extrabold text-gold-2">
                                ×{v.times}
                              </span>
                            )}
                            <span className="shrink-0 text-[11px] text-muted">{v.device}</span>
                            <span className="shrink-0 text-[11px] font-medium text-ivory/75">{fmtWhen(v.ts)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

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
  const [showAll, setShowAll] = useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);
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
    const buildSeries = (n: number): DayPoint[] => {
      const out: DayPoint[] = [];
      for (let i = n - 1; i >= 0; i--) {
        const dayStart = todayStart - i * 86_400_000;
        const dayDate = new Date(dayStart);
        out.push({
          label: dayDate.toLocaleDateString("en-US", { weekday: "narrow" }),
          weekday: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
          dateLabel: dayDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          count: visits.filter((v) => v.ts >= dayStart && v.ts < dayStart + 86_400_000).length,
        });
      }
      return out;
    };
    const days = buildSeries(7);
    const days30 = buildSeries(30);
    return {
      today: visits.filter((v) => inRange(v, todayStart)).length,
      last7: last7.length,
      last30: visits.filter((v) => inRange(v, d30)).length,
      membersSeen: new Set(last7.map((v) => v.uid).filter(Boolean)).size,
      days,
      days30,
      maxDay: Math.max(1, ...days.map((d) => d.count)),
      avg: last7.length / 7,
      avg30: visits.filter((v) => inRange(v, d30)).length / 30,
    };
  }, [visits]);

  /* Who visited, grouped by person (owner, 2026-10-24): the wall
     shows people, not page trails — each member once with their
     latest visit + how often they came; guests fold into a single
     anonymous tile. Profile photos come from the members list. */
  const people = useMemo(() => {
    const byUid = new Map<
      string,
      { name: string; latest: number; count: number; profile?: UserProfile }
    >();
    let guestCount = 0;
    let guestLatest = 0;
    for (const v of visits) {
      if (v.uid && v.name) {
        const cur = byUid.get(v.uid);
        if (cur) {
          cur.count += 1;
          cur.latest = Math.max(cur.latest, v.ts);
        } else {
          byUid.set(v.uid, {
            name: v.name,
            latest: v.ts,
            count: 1,
            profile: members.find((m) => m.id === v.uid),
          });
        }
      } else {
        guestCount += 1;
        guestLatest = Math.max(guestLatest, v.ts);
      }
    }
    return {
      list: [...byUid.values()].sort((a, b) => b.latest - a.latest),
      guestCount,
      guestLatest,
    };
  }, [visits, members]);

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

  const quickActions: { label: string; key: string; icon: ReactNode }[] = [
    { label: "Approvals", key: "approvals", icon: <CheckCircleIcon /> },
    { label: "All Members", key: "all-members", icon: <UsersIcon /> },
    { label: "Events", key: "events", icon: <CalendarIcon /> },
    { label: "Announcements", key: "announcements", icon: <MegaphoneIcon /> },
    { label: "Batch Groups", key: "batches", icon: <ChatIcon /> },
    { label: "Site Settings", key: "settings", icon: <GearIcon /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-60 flex-1">
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
            {pending > 0 && (
              <button
                type="button"
                onClick={() => onJump("approvals")}
                className="mt-4 rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a1430] shadow-[0_0_24px_rgba(212,169,78,0.3)] transition hover:brightness-110"
              >
                Review {pending} pending
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <button
              type="button"
              onClick={() => onJump(s.jump)}
              className={`card-lift relative w-full overflow-hidden rounded-3xl border p-5 pb-9 text-left sm:p-6 sm:pb-8 ${
                s.accent
                  ? "border-gold/50 bg-gold/[0.07] shadow-[0_0_28px_rgba(212,169,78,0.15)]"
                  : "border-ivory/10 bg-ink-2"
              }`}
            >
              <span className="flex items-start justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                    s.accent ? "border-gold/60 text-gold-2" : "border-gold/30 text-gold-2"
                  } bg-gold/10`}
                >
                  {s.icon}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ivory/15 text-sm leading-none text-muted">
                  ›
                </span>
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
              <svg viewBox="0 0 96 28" aria-hidden="true" className="pointer-events-none absolute bottom-1 right-3 h-6 w-20 opacity-40 sm:h-7 sm:w-24" fill="none" stroke="#e9c766" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,20 16,13 30,16 46,7 62,11 78,5 94,9" />
              </svg>
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
              { icon: <BarChartIcon />, label: "Visits today", value: traffic.today },
              { icon: <CalendarIcon />, label: "Last 7 days", value: traffic.last7 },
              { icon: <ClockIcon />, label: "Last 30 days", value: traffic.last30 },
              { icon: <UsersIcon />, label: "Members seen · 7 days", value: traffic.membersSeen },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3.5 rounded-2xl border border-ivory/[0.07] bg-ink px-4 py-4">
                <span className="shrink-0 text-gold-2">{m.icon}</span>
                <span className="min-w-0">
                  <span className="font-display block text-[26px] font-extrabold leading-none text-ivory">{m.value}</span>
                  <span className="mt-1.5 block text-[9px] font-bold uppercase leading-relaxed tracking-[0.18em] text-muted">{m.label}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
            {/* chart panel */}
            <div className="rounded-2xl border border-ivory/[0.07] bg-ink p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold-2">
                    <EyeIcon />
                  </span>
                  <span className="font-display text-base font-bold text-ivory">Visits – Last {period} Days</span>
                </p>
                <label className="relative shrink-0">
                  <span className="sr-only">Chart period</span>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30)}
                    className="cursor-pointer appearance-none rounded-full border border-ivory/15 bg-ink-2 py-1.5 pl-3.5 pr-8 text-[10px] font-bold uppercase tracking-widest text-muted outline-none transition-colors hover:border-gold/40 hover:text-gold-2 focus:border-gold/50"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted">▾</span>
                </label>
              </div>
              <div className="mt-2">
                <VisitsChart days={period === 7 ? traffic.days : traffic.days30} avg={period === 7 ? traffic.avg : traffic.avg30} />
              </div>
              <p className="text-[11px] leading-relaxed text-muted/70">
                One visit is counted per person per page in a browsing session. Portal content so far:{" "}
                {content.events.length} events · {content.announcements.length} announcements ·{" "}
                {content.stories.length} stories · {content.businesses.length} businesses.
              </p>
            </div>

            {/* who visited panel */}
            <div className="min-w-0 rounded-2xl border border-ivory/[0.07] bg-ink p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2.5">
                  <span className="text-gold-2">
                    <PersonIcon />
                  </span>
                  <span className="font-display text-base font-bold text-ivory">Who Visited</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold-2 transition-colors hover:text-gold"
                >
                  View more →
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-0.5">
                {!loaded ? (
                  <p className="py-4 text-sm text-muted">Loading visitors…</p>
                ) : visits.length === 0 ? (
                  <p className="rounded-2xl border border-ivory/[0.07] bg-ink-2 px-4 py-5 text-sm leading-relaxed text-muted">
                    No visits recorded yet. Counting starts as soon as people browse the site.
                  </p>
                ) : (
                  <>
                    {people.list.slice(0, 5).map((person) => (
                      <div key={person.name} className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-ivory/[0.03]">
                        <Avatar name={person.name} photoURL={person.profile?.photoURL} size="ml" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ivory">{person.name}</p>
                          <p className="truncate text-[11px] text-muted">
                            {person.profile ? `Batch ${person.profile.batch}` : "Member"} · {relTime(person.latest)}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ivory/[0.05] px-2.5 py-1 text-[11px] font-bold text-gold-2">
                          <EyeMini /> {person.count}
                        </span>
                      </div>
                    ))}
                    {people.guestCount > 0 && (
                      <div className="flex items-center gap-3 rounded-xl px-1.5 py-2">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/15 bg-ink-3 text-muted">
                          <PersonIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ivory/85">Guest visitor</p>
                          <p className="truncate text-[11px] text-muted">New visitor · {relTime(people.guestLatest)}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ivory/[0.05] px-2.5 py-1 text-[11px] font-bold text-gold-2">
                          <EyeMini /> {people.guestCount}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </section>
      </Reveal>

      {showAll && (
        <VisitorsModal visits={visits} members={members} onClose={() => setShowAll(false)} />
      )}

      {/* batches + latest + actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <section className={`${cardCls} h-full`}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2.5">
                <span className="text-gold-2">
                  <UsersIcon />
                </span>
                <span className="font-display text-lg font-bold text-ivory">Members by Batch</span>
              </p>
              <button
                type="button"
                onClick={() => onJump("all-members")}
                className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold-2 transition-colors hover:text-gold"
              >
                View Details →
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4">
              {batches.map((b) => (
                <div key={b.batch}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ivory">Batch {b.batch}</span>
                    <span className="text-xs text-muted">{b.count} member{b.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ivory/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-2 transition-all duration-700"
                      style={{ width: `${(b.count / maxBatch) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] font-semibold text-muted/80">
                    {approved > 0 ? Math.round((b.count / approved) * 100) : 0}% of members
                  </p>
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

        <div className="grid grid-cols-1 gap-6">
          <Reveal>
            <section className={cardCls}>
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2.5">
                  <span className="text-gold-2">
                    <UsersIcon />
                  </span>
                  <span className="font-display text-lg font-bold text-ivory">Latest Members</span>
                </p>
                <button
                  type="button"
                  onClick={() => onJump("all-members")}
                  className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold-2 transition-colors hover:text-gold"
                >
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

        </div>
      </div>

      <Reveal>
        <section className={cardCls}>
          <p className="flex items-center gap-2.5">
            <span className="text-gold-2">
              <ZapIcon />
            </span>
            <span className="font-display text-lg font-bold text-ivory">Quick Actions</span>
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => onJump(a.key)}
                className="flex items-center gap-3 rounded-2xl border border-ivory/10 bg-ink px-4 py-3.5 text-left transition-colors hover:border-gold/45"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold-2">
                  {a.icon}
                </span>
                <span className="flex-1 text-xs font-bold uppercase tracking-widest text-ivory/85">
                  {a.label}
                  {a.key === "approvals" && pending > 0 && (
                    <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-ink">{pending}</span>
                  )}
                </span>
                <span className="text-sm text-muted">›</span>
              </button>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
