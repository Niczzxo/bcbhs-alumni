"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import DashboardShell, { type DashSection } from "@/components/DashboardShell";
import { Avatar } from "@/components/MemberCard";
import ContentManager from "@/components/content/ContentManager";
import V2Manager from "@/components/content/V2Manager";
import AboutEditor from "@/components/content/AboutEditor";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS, EDITOR_PERMISSIONS, ROLE_META, POSITIONS } from "@/lib/types";
import type { MemberRole, UserProfile } from "@/lib/types";

/**
 * Super admin, full control: roles, granular permissions, stats.
 * Every sector sits in the sidebar (owner's rule, 2026-10-23); one
 * click opens one sector's work area instead of one endless page.
 */
export default function SuperAdminPage() {
  const { user, members, setPermissions, setRole, setPosition, setGuestVisible, approveMember, rejectMember } = useAuth();

  const approved = members.filter((m) => m.status === "approved");
  const pending = members.filter((m) => m.status === "pending");
  const admins = members.filter((m) => m.role === "admin" || m.role === "super_admin");
  const editors = members.filter((m) => m.role === "editor");

  const togglePerm = (m: UserProfile, key: string) => {
    const next = m.permissions.includes(key)
      ? m.permissions.filter((p) => p !== key)
      : [...m.permissions, key];
    setPermissions(m.id, next);
  };

  const changeRole = (m: UserProfile, role: MemberRole) => {
    if (m.id === user?.id) return; /* never change your own role from here */
    setRole(m.id, role);
  };

  const sections: DashSection[] = [
    {
      key: "overview",
      label: "Overview",
      content: (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[
            ["Approved members", approved.length],
            ["Pending approvals", pending.length],
            ["Admins", admins.length],
            ["Editors", editors.length],
          ].map(([label, value], i) => (
            <Reveal key={label as string} delay={i * 0.07} className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 text-center">
              <p className="font-display text-gold-gradient text-4xl font-extrabold">{value}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
            </Reveal>
          ))}
        </div>
      ),
    },
    {
      key: "approvals",
      label: "Approvals",
      badge: pending.length,
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">
            Pending approvals <span className="text-gold-2">({pending.length})</span>
          </h2>
          <div className="gold-rule mt-4 w-32" />
          {pending.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
              All caught up, no pending registrations. 🎉
            </p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {pending.map((m) => (
                <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-ivory/10 bg-ink-2 p-5">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ivory">{m.name}</p>
                    <p className="text-xs text-muted">Batch {m.batch} · {m.district} · {m.email}</p>
                  </div>
                  <button onClick={() => approveMember(m.id)} className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink">
                    Approve
                  </button>
                  <button onClick={() => rejectMember(m.id)} className="rounded-full border border-red-400/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-300">
                    Reject
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ),
    },
    {
      key: "roles",
      label: "Roles & Access",
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">Role & access control</h2>
          <p className="mt-2 text-sm text-muted">
            Give anyone any role, member, editor, admin or super admin. Editors always carry the
            content permissions below; admins get exactly what you toggle. Super admin always has full access.
          </p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 space-y-5">
            {members
              .filter((m) => m.status === "approved")
              .map((m) => (
                <Reveal key={m.id} className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ivory">
                        {m.name} <span className="text-xs text-muted">· Batch {m.batch} · {m.email}</span>
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${ROLE_META[m.role].badge}`}>
                      {ROLE_META[m.role].label}
                    </span>
                    {m.id === user?.id ? (
                      <span className="rounded-full border border-ivory/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted">
                        You
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m, e.target.value as MemberRole)}
                        aria-label={`Change role for ${m.name}`}
                        className="cursor-pointer rounded-full border border-gold/40 bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold-2 outline-none transition-colors hover:bg-gold/10"
                      >
                        {(Object.keys(ROLE_META) as MemberRole[]).map((r) => (
                          <option key={r} value={r} className="bg-ink text-ivory">
                            {ROLE_META[r].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted">{ROLE_META[m.role].blurb}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted">
                      Position
                    </label>
                    <select
                      value={m.position ?? ""}
                      aria-label={`Official position for ${m.name}`}
                      onChange={(e) => setPosition(m.id, e.target.value)}
                      className="w-56 cursor-pointer rounded-full border border-gold/40 bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold-2 outline-none transition-colors hover:bg-gold/10"
                    >
                      <option value="" className="bg-ink text-ivory">
                       , No position
                      </option>
                      {m.position && !POSITIONS.includes(m.position) && (
                        <option value={m.position} className="bg-ink text-ivory">
                          {m.position}
                        </option>
                      )}
                      {POSITIONS.map((p) => (
                        <option key={p} value={p} className="bg-ink text-ivory">
                          {p}
                        </option>
                      ))}
                    </select>
                    {m.position && (
                      <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-2">
                        ★ {m.position}
                      </span>
                    )}
                    <label className="ml-auto flex cursor-pointer items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted hover:text-gold-2">
                      <input
                        type="checkbox"
                        checked={!!m.guestVisible}
                        onChange={(e) => setGuestVisible(m.id, e.target.checked)}
                        aria-label={`Show ${m.name} in the public guest directory`}
                        className="h-4 w-4 accent-[#d4a94e]"
                      />
                      Guest view
                    </label>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted/70">
                    Official positions are manually verified, allow up to 7 days.
                  </p>
                  {m.role === "editor" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {PERMISSIONS.filter((p) =>
                        (EDITOR_PERMISSIONS as readonly string[]).includes(p.key),
                      ).map((p) => (
                        <span
                          key={p.key}
                          title={p.hint}
                          className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold text-sky-300"
                        >
                          ✓ {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === "admin" && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {PERMISSIONS.map((p) => {
                        const on = m.permissions.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            onClick={() => togglePerm(m, p.key)}
                            className={`rounded-2xl border p-4 text-left transition-all ${on ? "border-gold/60 bg-gold/10" : "border-ivory/10 bg-ink hover:border-gold/30"}`}
                          >
                            <p className="flex items-center justify-between text-sm font-semibold text-ivory">
                              {p.label}
                              <span className={`ml-2 inline-block h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-gold" : "bg-ivory/20"}`}>
                                <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-muted">{p.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Reveal>
              ))}
          </div>
        </section>
      ),
    },
    { key: "events", label: "Events", content: <ContentManager kind="events" /> },
    { key: "announcements", label: "Announcements", content: <ContentManager kind="announcements" /> },
    { key: "gallery", label: "Gallery", content: <ContentManager kind="gallery" /> },
    { key: "committee", label: "Committee", content: <ContentManager kind="committee" /> },
    {
      key: "community",
      label: "Community",
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">Community features</h2>
          <p className="mt-2 text-sm text-muted">
            Blood requests, polls, hall of fame, memory wall, fund and batch groups, managed here, live instantly.
          </p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8">
            <V2Manager />
          </div>
        </section>
      ),
    },
    { key: "about", label: "About Page", content: <AboutEditor /> },
  ];

  return (
    <RequireRole role="super_admin" eyebrow="Full access" title={<>Super Admin <span className="text-gold-gradient">Dashboard</span></>}>
      <DashboardShell sections={sections} />
    </RequireRole>
  );
}
