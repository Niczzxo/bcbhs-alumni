"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
}: {
  sections: DashSection[];
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? sections[0]?.key);
  const [visited, setVisited] = useState<ReadonlySet<string>>(
    () => new Set([defaultKey ?? sections[0]?.key].filter(Boolean) as string[]),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const current = sections.find((s) => s.key === active) ?? sections[0];

  /* Warm-mount every section in the background (owner's complaint,
     2026-10-23: switching sections "took a load" first). Sections
     mount one by one on a short stagger shortly after the dashboard
     opens, so by the time a section is tapped it is already mounted
     with its data, and switching is instant from the first tap. */
  const keysSig = sections.map((s) => s.key).join(",");
  const warmedRef = useRef(false);
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    const keys = keysSig.split(",").filter(Boolean);
    let i = 0;
    let timer: number | undefined;
    const step = () => {
      if (i >= keys.length) return;
      const key = keys[i++];
      setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
      timer = window.setTimeout(step, 450);
    };
    timer = window.setTimeout(step, 800);
    return () => window.clearTimeout(timer);
  }, [keysSig]);

  const open = (key: string) => {
    setActive(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    setSheetOpen(false);
  };

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
                <span className="flex-1">{s.label}</span>
                {badgePill(s, isActive)}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
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
