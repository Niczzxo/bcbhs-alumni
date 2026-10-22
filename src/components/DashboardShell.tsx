"use client";

import { useState, type ReactNode } from "react";

export interface DashSection {
  key: string;
  label: string;
  /** Optional count pill, e.g. pending approvals. */
  badge?: number;
  content: ReactNode;
}

/**
 * Sidebar layout for the staff dashboards (owner's rule, 2026-10-23):
 * instead of one endless page stacking every sector, each sector gets
 * its own sidebar entry; clicking it opens ONLY that sector's work
 * area. On mobile the sidebar becomes a horizontal chip rail on top.
 */
export default function DashboardShell({
  sections,
  defaultKey,
}: {
  sections: DashSection[];
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? sections[0]?.key);
  const current = sections.find((s) => s.key === active) ?? sections[0];

  return (
    <div className="lg:flex lg:items-start lg:gap-10">
      <aside className="mb-8 shrink-0 lg:sticky lg:top-24 lg:mb-0 lg:w-60">
        <nav
          aria-label="Dashboard sections"
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {sections.map((s) => {
            const isActive = s.key === current?.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest transition-all lg:w-full lg:rounded-2xl lg:px-5 lg:py-3.5 ${
                  isActive
                    ? "bg-gradient-to-r from-gold-deep via-gold to-gold-deep text-ink shadow-[0_0_24px_rgba(212,169,78,0.35)]"
                    : "border border-ivory/10 bg-ink-2 text-muted hover:border-gold/40 hover:text-gold-2"
                }`}
              >
                <span className="flex-1">{s.label}</span>
                {typeof s.badge === "number" && s.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? "bg-ink/20 text-ink" : "bg-gold/15 text-gold-2"
                    }`}
                  >
                    {s.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{current?.content}</div>
    </div>
  );
}
