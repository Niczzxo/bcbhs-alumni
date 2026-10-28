"use client";

import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useEffect, useRef, useState, type ReactNode } from "react";

/* Section icons for the sidebar + mobile sheet (owner's reference
   layout, 2026-10-24). Unknown keys fall back to a plain dot. */
const ic = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-[18px] w-[18px]",
} as const;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  overview: (<svg {...ic}><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /></svg>),
  approvals: (<svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.4 2.4 4.8-5.4" /></svg>),
  roles: (<svg {...ic}><circle cx="8" cy="14" r="4" /><path d="M11 11l9-9M17 4l2.5 2.5M14.5 6.5L17 9" /></svg>),
  "all-members": (<svg {...ic}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18.5 15.6c1.6.7 2.7 2 3.1 4.4" /></svg>),
  members: (<svg {...ic}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18.5 15.6c1.6.7 2.7 2 3.1 4.4" /></svg>),
  banned: (<svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M6 6l12 12" /></svg>),
  events: (<svg {...ic}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>),
  announcements: (<svg {...ic}><path d="M4 10v4l3 .5V9.5L4 10zM7 9.5L19 5v13l-12-3.5" /><path d="M9 15l1.2 5" /></svg>),
  gallery: (<svg {...ic}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M4 18l5-5 3.5 3.5L16 13l4 4" /></svg>),
  committee: (<svg {...ic}><path d="M4 20h16M5 20v-9M9.5 20v-9M14.5 20v-9M19 20v-9M3 11l9-6 9 6H3z" /></svg>),
  blood: (<svg {...ic}><path d="M12 20.5s-7.5-4.6-9.3-9C1.3 8 3.2 4.9 6.5 4.9c2 0 3.6 1.1 5.5 3.4 1.9-2.3 3.5-3.4 5.5-3.4 3.3 0 5.2 3.1 3.8 6.6-1.8 4.4-9.3 9-9.3 9z" /></svg>),
  mentors: (<svg {...ic}><rect x="3" y="7.5" width="18" height="12.5" rx="2.5" /><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5M3 13h18" /></svg>),
  fund: (<svg {...ic}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v10M15 9.2c-.6-1-1.7-1.5-3-1.5-1.8 0-3 .9-3 2.2 0 3 6 1.6 6 4.3 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.2-1.6" /></svg>),
  batches: (<svg {...ic}><path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 4V6z" /></svg>),
  about: (<svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.4" /></svg>),
  settings: (<svg {...ic}><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9L18 18M18 6l-2.1 2.1M8.1 15.9L6 18" /></svg>),
};

function sectionIcon(key: string): React.ReactNode {
  return (
    SECTION_ICONS[key.replace(/^v2-/, "")] ?? (
      <svg {...ic}><circle cx="12" cy="12" r="4" /></svg>
    )
  );
}

export interface DashSection {
  key: string;
  label: string;
  /** Optional count pill, e.g. pending approvals. */
  badge?: number;
  content: ReactNode;
}

/**
 * Layout for the staff dashboards (owner's rule, 2026-10-23): each
 * sector gets its own entry; clicking it opens ONLY that sector's
 * work area. Desktop uses a sticky sidebar. Mobile uses a DROPDOWN
 * SELECTOR (owner's pick over sliding tabs): one bar showing the
 * current section, tapping it raises a bottom sheet with the full
 * section list. Visited sections stay mounted (hidden) so switching
 * back is instant.
 */
export default function DashboardShell({
  sections,
  defaultKey,
  activeKey,
  onActiveChange,
}: {
  sections: DashSection[];
  defaultKey?: string;
  /** Controlled mode (optional): the page owns the active section,
      e.g. so the Overview's quick actions can jump to a section.
      Omit both props and the shell manages it internally as before. */
  activeKey?: string;
  onActiveChange?: (key: string) => void;
}) {
  const [internalActive, setInternalActive] = useState(defaultKey ?? sections[0]?.key);
  const active = activeKey ?? internalActive;
  const setActive = (key: string) => {
    if (onActiveChange) onActiveChange(key);
    else setInternalActive(key);
  };
  const [visited, setVisited] = useState<ReadonlySet<string>>(
    () => new Set([defaultKey ?? sections[0]?.key].filter(Boolean) as string[]),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const current = sections.find((s) => s.key === active) ?? sections[0];

  /* Reload persistence (owner, 2026-10-28): a reload used to drop
     the user back to the first section. The active section now lives
     in ?section= : on load it restores the section, on every switch
     it rewrites the param (replace, so Back still leaves the
     dashboard). The default section leaves no param, and an unknown
     key falls back to the default. Works in both modes: controlled
     pages get the key through onActiveChange, uncontrolled pages
     through internal state. */
  const defaultSectionKey = defaultKey ?? sections[0]?.key;
  const syncStartedRef = useRef(false);
  useEffect(() => {
    try {
      const key = new URLSearchParams(window.location.search).get("section");
      if (key && sections.some((s) => s.key === key)) setActive(key);
      else if (key) {
        /* Unknown key: fall back to the default and drop the stale param. */
        const url = new URL(window.location.href);
        url.searchParams.delete("section");
        window.history.replaceState(null, "", url.toString());
      }
    } catch {
      /* Malformed URL: stay on the default section. */
    }
    /* Mount-only restore; the first render's sections carry the
       full key list. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    /* The first run belongs to the restore above, not to a tap. */
    if (!syncStartedRef.current) {
      syncStartedRef.current = true;
      return;
    }
    try {
      const url = new URL(window.location.href);
      if (active && active !== defaultSectionKey) url.searchParams.set("section", active);
      else url.searchParams.delete("section");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* Ignore: persistence must never break section switching. */
    }
  }, [active, defaultSectionKey]);

  /* Warm-mount every section in the background (owner's complaint,
     2026-10-23: switching sections "took a load" first). Sections
     mount one by one on a short stagger shortly after the dashboard
     opens, so by the time a section is tapped it is already mounted
     with its data, and switching is instant from the first tap. */
  const keysSig = sections.map((s) => s.key).join(",");
  const warmedRef = useRef(false);
  const lastInteractRef = useRef(0);
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    const keys = keysSig.split(",").filter(Boolean);
    let i = 0;
    let cancelled = false;
    let timer: number | undefined;
    let idle: number | undefined;
    const ric = window.requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    const cic = window.cancelIdleCallback as ((id: number) => void) | undefined;
    /* Warm-mount ONLY in idle slices and never right after a tap
       (owner's complaint, 2026-10-24: switching felt unresponsive -
       the old fixed 450ms stampede mounted heavy sections back to
       back and every tap queued behind a mount). Mounts also run as
       transitions so the UI stays responsive throughout. */
    const step = () => {
      if (cancelled || i >= keys.length) return;
      if (Date.now() - lastInteractRef.current < 2500) {
        timer = window.setTimeout(step, 600);
        return;
      }
      const key = keys[i++];
      startTransition(() => {
        setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
      });
      if (i < keys.length) {
        if (ric) idle = ric(step, { timeout: 3000 });
        else timer = window.setTimeout(step, 500);
      }
    };
    timer = window.setTimeout(step, 1600);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (idle !== undefined && cic) cic(idle);
    };
  }, [keysSig]);

  const open = (key: string) => {
    setActive(key);
    setSheetOpen(false);
    // Mounting a heavy section synchronously inside the tap froze
    // the whole UI until it rendered. The active state lands now;
    // the mount runs as a transition (a placeholder shows meanwhile).
    startTransition(() => {
      setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    });
  };

  /* Controlled jumps (quick actions) must also mark the target
     visited so it renders instead of staying unmounted. */
  useEffect(() => {
    if (active) {
      lastInteractRef.current = Date.now();
      startTransition(() => {
        setVisited((prev) => (prev.has(active) ? prev : new Set(prev).add(active)));
      });
    }
  }, [active]);

  /* While the section sheet is open, lock the page behind it and
     let Escape close it (same behaviour as the nav drawer). */
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const badgePill = (s: DashSection, isActive: boolean) =>
    typeof s.badge === "number" && s.badge > 0 ? (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
          isActive ? "bg-ink/20 text-ink" : "bg-gold/15 text-gold-2"
        }`}
      >
        {s.badge}
      </span>
    ) : null;

  return (
    <div className="lg:flex lg:items-start lg:gap-10">
      <aside className="sticky top-16 z-30 -mx-5 mb-8 shrink-0 px-5 py-2.5 sm:-mx-10 sm:px-10 lg:top-24 lg:mx-0 lg:mb-0 lg:w-60 lg:px-0 lg:py-0">
        {/* Mobile: dropdown selector bar (sticks under the navbar) */}
        <div className="border-b border-gold/15 bg-ink/90 pb-2.5 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="flex w-full items-center gap-3 rounded-2xl border border-gold/35 bg-ink-2 px-5 py-3.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-colors active:border-gold/60"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-muted">
                Section
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold uppercase tracking-widest text-gold-2">
                {current?.label}
              </span>
            </span>
            {current && badgePill(current, false)}
            <span className="text-xs text-gold-2">▾</span>
          </button>
        </div>

        {/* Desktop: sticky sidebar */}
        <nav aria-label="Dashboard sections" className="hidden lg:flex lg:flex-col lg:gap-2">
          {sections.map((s) => {
            const isActive = s.key === current?.key;
            return (
              <button
                key={s.key}
                onClick={() => open(s.key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-2xl px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-gold-deep via-gold to-gold-deep text-ink shadow-[0_0_24px_rgba(212,169,78,0.35)]"
                    : "border border-ivory/10 bg-ink-2 text-muted hover:border-gold/40 hover:text-gold-2"
                }`}
              >
                <span className={isActive ? "text-ink" : "text-gold-2/75"}>{sectionIcon(s.key)}</span>
                <span className="flex-1">{s.label}</span>
                {badgePill(s, isActive)}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {current && !visited.has(current.key) && (
          <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-7" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
              <p className="text-sm font-semibold text-ivory/85">Loading {current.label}…</p>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-ivory/[0.05]" />
              <div className="h-24 animate-pulse rounded-2xl bg-ivory/[0.04]" />
              <div className="h-24 animate-pulse rounded-2xl bg-ivory/[0.03]" />
            </div>
          </div>
        )}
        {sections
          .filter((s) => visited.has(s.key))
          .map((s) => (
            <div key={s.key} hidden={s.key !== current?.key}>
              {s.content}
            </div>
          ))}
      </div>

      {/* Mobile: section picker bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Choose a section">
            <motion.button
              type="button"
              aria-label="Close section list"
              onClick={() => setSheetOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 h-full w-full cursor-default bg-ink/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 flex max-h-[78vh] flex-col rounded-t-3xl border-t border-gold/30 bg-ink-2 shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center justify-between px-5 pb-1 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">
                  Go to section
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close section list"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/15 text-muted transition-colors hover:border-gold/40 hover:text-gold-2"
                >
                  ✕
                </button>
              </div>
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ivory/15" />
              <nav aria-label="Dashboard sections" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-1">
                <ul className="space-y-0.5">
                  {sections.map((s, i) => {
                    const isActive = s.key === current?.key;
                    return (
                      <motion.li
                        key={s.key}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.03, duration: 0.25 }}
                      >
                        <button
                          type="button"
                          onClick={() => open(s.key)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium tracking-wide transition-colors ${
                            isActive
                              ? "bg-gold/10 font-bold text-gold-2"
                              : "text-ivory/85 hover:bg-ivory/5 hover:text-gold-2"
                          }`}
                        >
                          <span className="text-gold-2/75">{sectionIcon(s.key)}</span>
                          <span className="flex-1">{s.label}</span>
                          {badgePill(s, false)}
                          {isActive && <span className="text-gold-2">✓</span>}
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
