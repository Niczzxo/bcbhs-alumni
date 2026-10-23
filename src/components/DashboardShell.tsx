"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  /* Keep-alive (owner's speed rule, 2026-10-23): a section mounts the
     first time it is opened and then STAYS mounted, only hidden, so
     switching back is instant, images are not re-decoded and lists
     are not rebuilt on every click. */
  const [visited, setVisited] = useState<ReadonlySet<string>>(
    () => new Set([defaultKey ?? sections[0]?.key].filter(Boolean) as string[]),
  );
  const current = sections.find((s) => s.key === active) ?? sections[0];

  const open = (key: string) => {
    setActive(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  /* Mobile chip rail (pro pass, owner's request, 2026-10-23): keep
     the active chip centered in the rail whenever the section
     changes, so the selected sector is always in view. */
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  return (
    <div className="lg:flex lg:items-start lg:gap-10">
      <aside className="sticky top-16 z-30 -mx-5 mb-8 shrink-0 border-b border-gold/15 bg-ink/90 px-5 py-2.5 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:top-24 lg:mx-0 lg:mb-0 lg:w-60 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <nav
          ref={navRef}
          aria-label="Dashboard sections"
          className="no-scrollbar flex scroll-smooth gap-2 overflow-x-auto max-lg:[mask-image:linear-gradient(to_right,black_88%,transparent)] lg:flex-col lg:overflow-visible"
        >
          {sections.map((s) => {
            const isActive = s.key === current?.key;
            return (
              <button
                key={s.key}
                onClick={() => open(s.key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.97] lg:w-full lg:rounded-2xl lg:px-5 lg:py-3.5 ${
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
      <div className="min-w-0 flex-1">
        {sections
          .filter((s) => visited.has(s.key))
          .map((s) => (
            <div key={s.key} hidden={s.key !== current?.key}>
              {s.content}
            </div>
          ))}
      </div>
    </div>
  );
}
