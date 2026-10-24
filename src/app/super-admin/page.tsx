"use client";

import { useCallback, useMemo, useState } from "react";
import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import DashboardShell, { type DashSection } from "@/components/DashboardShell";
import { Avatar } from "@/components/MemberCard";
import ContentManager from "@/components/content/ContentManager";
import V2Manager, { V2_SECTIONS } from "@/components/content/V2Manager";
import AboutEditor from "@/components/content/AboutEditor";
import SettingsManager from "@/components/content/SettingsManager";
import OverviewPanel from "@/components/content/OverviewPanel";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS, ROLE_META, POSITIONS } from "@/lib/types";
import type { MemberRole, UserProfile } from "@/lib/types";

/**
 * Super admin, full control. Every sector sits in the sidebar
 * (owner's rule, 2026-10-23); one click opens one sector's work area.
 * People management is split three ways (owner's layout, 2026-10-23):
 * Roles & Access holds only the people who HAVE a role, All Members
 * holds every approved member (give roles and ban from there), and
 * Banned holds the suspended members until they are unbanned.
 */
export default function SuperAdminPage() {
  const { user, members, loading, setPermissions, setRole, setPosition, approveMember, rejectMember, banMember, unbanMember } = useAuth();

  const approved = useMemo(() => members.filter((m) => m.status === "approved"), [members]);
  /* All Members search (owner's request, 2026-10-23): a name field
     (quietly also matches email / member ID when pasted) plus a
     batch picker; both filters combine. */
  const [dashKey, setDashKey] = useState("overview");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberBatch, setMemberBatch] = useState("");
  const memberBatches = useMemo(
    () => [...new Set(approved.map((m) => m.batch))].sort().reverse(),
    [approved],
  );
  const shownMembers = useMemo(() => approved.filter((m) => {
    const q = memberQuery.trim().toLowerCase();
    const nameOk =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.memberId ?? "").toLowerCase().includes(q);
    const batchOk = !memberBatch || m.batch === memberBatch;
    return nameOk && batchOk;
  }), [approved, memberQuery, memberBatch]);
  const pending = useMemo(() => members.filter((m) => m.status === "pending"), [members]);
  const banned = useMemo(() => members.filter((m) => m.status === "banned"), [members]);
  const staff = useMemo(
    () => members.filter((m) => (m.status === "approved" || m.status === "banned") && m.role !== "member"),
    [members],
  );
  /* Batch Reps = approved members actually holding the Batch Rep role
     (owner's rule, 2026-10-25): super admins are NOT counted here, even
     though they can do everything a Batch Rep can. */
  const batchReps = useMemo(() => members.filter((m) => m.status === "approved" && m.role === "admin"), [members]);
  const editors = useMemo(() => members.filter((m) => m.role === "editor"), [members]);

  /* The permissions a person holds are exactly their toggled list,
     for Batch Reps and editors alike. Editors start EMPTY: the super
     admin grants each section explicitly (owner's rule, 2026-10-23). */
  const effectivePerms = useCallback((m: UserProfile): string[] => m.permissions, []);

  const togglePerm = useCallback(
    (m: UserProfile, key: string) => {
      const base = effectivePerms(m);
      const next = base.includes(key)
        ? base.filter((p) => p !== key)
        : [...base, key];
      setPermissions(m.id, next);
    },
    [effectivePerms, setPermissions],
  );

  const changeRole = useCallback(
    (m: UserProfile, role: MemberRole) => {
      if (m.id === user?.id) return; /* never change your own role from here */
      setRole(m.id, role);
    },
    [user, setRole],
  );

  /* The one member card: role select, position, guest view, ban and
     the permission grid. Used by Roles & Access (staff only) and by
     All Members (every approved member). */
  const renderCard = useCallback((m: UserProfile) => (
    <Reveal key={m.id} className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
      {/* Identity: one left-aligned stack — name, then Batch, then email. */}
      <div className="flex items-start gap-4">
        <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-ivory">{m.name}</p>
          <p className="mt-0.5 text-xs text-muted">Batch {m.batch}</p>
          <p className="break-all text-xs text-muted">{m.email}</p>
        </div>
      </div>
      {/* Role controls, left-aligned under the identity. */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${ROLE_META[m.role].badge}`}>
          {ROLE_META[m.role].label}
        </span>
        {m.id === user?.id ? (
          <span className="rounded-full border border-ivory/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
            You
          </span>
        ) : (
          <select
            value={m.role}
            onChange={(e) => changeRole(m, e.target.value as MemberRole)}
            aria-label={`Change role for ${m.name}`}
            className="cursor-pointer rounded-full border border-gold/40 bg-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-2 outline-none transition-colors hover:bg-gold/10"
          >
            {(Object.keys(ROLE_META) as MemberRole[]).map((r) => (
              <option key={r} value={r} className="bg-ink text-ivory">
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">{ROLE_META[m.role].blurb}</p>
      {/* Position block: label, full-width select, then pill + guest view
          on the same left-aligned row. */}
      <div className="mt-4">
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted">
          Position
        </label>
        <select
          value={m.position ?? ""}
          aria-label={`Official position for ${m.name}`}
          onChange={(e) => setPosition(m.id, e.target.value)}
          className="mt-2 w-full cursor-pointer rounded-full border border-gold/40 bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold-2 outline-none transition-colors hover:bg-gold/10"
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
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-2">
              ★ {m.position}
            </span>
          </div>
        )}
        <p className="mt-2.5 text-[11px] text-muted/70">
          Official positions are manually verified, allow up to 7 days.
        </p>
      </div>
      {m.role !== "super_admin" && m.id !== user?.id && (m.status === "approved" || m.status === "banned") && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {m.status === "banned" ? (
            <>
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                Banned
              </span>
              <button
                type="button"
                onClick={() => unbanMember(m.id)}
                className="rounded-full border border-gold/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
              >
                Unban
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => banMember(m.id)}
              className="rounded-full border border-red-400/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10"
            >
              Ban member
            </button>
          )}
        </div>
      )}
      {(m.role === "admin" || m.role === "editor") && (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PERMISSIONS.map((p) => {
              const on = effectivePerms(m).includes(p.key);
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
          {m.role === "editor" && m.permissions.length === 0 && (
            <p className="mt-3 text-[11px] text-gold-2/80">
              This editor has no access yet. Switch on exactly what they may work on; they can do nothing else.
            </p>
          )}
        </div>
      )}
    </Reveal>
  ), [user, effectivePerms, changeRole, togglePerm, setPosition, banMember, unbanMember]);

  /* Memoized on the data the sections actually read (owner's
     complaint, 2026-10-24: section switches felt unresponsive).
     dashKey is deliberately NOT a dependency: switching sections
     re-renders this page, and with stable section elements React
     skips re-rendering every already-mounted section — only the
     shell's highlight and the hidden flags change. */
  const sections: DashSection[] = useMemo<DashSection[]>(() => [
    {
      key: "overview",
      label: "Overview",
      content: (
        <OverviewPanel
          approved={approved.length}
          pending={pending.length}
          banned={banned.length}
          batchReps={batchReps.length}
          editors={editors.length}
          members={members}
          onJump={setDashKey}
        />
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
              {loading ? "Loading registrations…" : "All caught up, no pending registrations. 🎉"}
            </p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {pending.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-ivory/10 bg-ink-2 p-5">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="font-semibold leading-snug text-ivory">{m.name}</p>
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
            Only the people who hold a role live here. Give someone a role from the
            All Members section and they appear here automatically. Batch reps and editors
            each get exactly the permissions you toggle, nothing more; a new editor starts
            with no access at all until you switch sections on for them. Super admin always has full access.
          </p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 space-y-5">
            {staff.length === 0 ? (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
                No one holds a role yet. Open All Members and give someone a role.
              </p>
            ) : (
              staff.map(renderCard)
            )}
          </div>
        </section>
      ),
    },
    {
      key: "all-members",
      label: "All Members",
      badge: approved.length,
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">
            All approved members <span className="text-gold-2">({approved.length})</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Everyone approved lives here. Give anyone role access from their card and they
            also appear under Roles & Access. Ban from here too; banned members move to the
            Banned section until they are unbanned.
          </p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1 sm:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                🔍
              </span>
              <input
                type="search"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search members by name…"
                aria-label="Search members by name"
                className="w-full rounded-full border border-ivory/15 bg-ink py-3 pl-11 pr-4 text-sm text-ivory outline-none transition-colors placeholder:text-muted focus:border-gold/60"
              />
            </div>
            <select
              value={memberBatch}
              onChange={(e) => setMemberBatch(e.target.value)}
              aria-label="Search members by batch"
              className="cursor-pointer rounded-full border border-ivory/15 bg-ink px-4 py-3 text-sm text-ivory outline-none transition-colors focus:border-gold/60"
            >
              <option value="" className="bg-ink text-ivory">
                All batches
              </option>
              {memberBatches.map((b) => (
                <option key={b} value={b} className="bg-ink text-ivory">
                  Batch {b}
                </option>
              ))}
            </select>
          </div>
          {(memberQuery.trim() || memberBatch) && (
            <p className="mt-3 text-xs text-muted">
              Showing {shownMembers.length} of {approved.length} members
            </p>
          )}
          <div className="mt-6 space-y-5">
            {approved.length === 0 ? (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
                {loading ? "Loading members…" : "No approved members yet."}
              </p>
            ) : shownMembers.length === 0 ? (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
                {memberQuery.trim()
                  ? `No member matches “${memberQuery.trim()}”${memberBatch ? ` in Batch ${memberBatch}` : ""}.`
                  : `No members in Batch ${memberBatch} yet.`}
              </p>
            ) : (
              shownMembers.map(renderCard)
            )}
          </div>
        </section>
      ),
    },
    {
      key: "banned",
      label: "Banned",
      badge: banned.length,
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">
            Banned members <span className="text-red-300">({banned.length})</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Suspended members wait here. They cannot use the portal while banned;
            unban restores their full access, ID card included.
          </p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 space-y-3">
            {banned.length === 0 ? (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
                No banned members. When you ban someone, they will appear here.
              </p>
            ) : (
              banned.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-400/20 bg-ink-2 px-4 py-3">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-sm font-semibold leading-snug text-ivory">{m.name}</p>
                    <p className="text-xs leading-relaxed text-muted">
                      <span className="whitespace-nowrap">{m.memberId}</span> ·{" "}
                      <span className="whitespace-nowrap">Batch {m.batch}</span> ·{" "}
                      <span className="break-all">{m.email}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${ROLE_META[m.role].badge}`}>
                    {ROLE_META[m.role].label}
                  </span>
                  <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                    Banned
                  </span>
                  <button
                    type="button"
                    onClick={() => unbanMember(m.id)}
                    className="rounded-full border border-gold/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                  >
                    Unban
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ),
    },
    { key: "events", label: "Events", content: <ContentManager kind="events" /> },
    { key: "announcements", label: "Announcements", content: <ContentManager kind="announcements" /> },
    { key: "gallery", label: "Gallery", content: <ContentManager kind="gallery" /> },
    { key: "committee", label: "Committee", content: <ContentManager kind="committee" /> },
    ...V2_SECTIONS.map((v) => ({
      key: `v2-${v.key}`,
      label: v.label,
      content: (
        <section>
          <h2 className="font-display text-2xl font-bold text-ivory">{v.label}</h2>
          <p className="mt-2 text-sm text-muted">{v.blurb}</p>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8">
            <V2Manager section={v.key} />
          </div>
        </section>
      ),
    })),
    { key: "about", label: "About Page", content: <AboutEditor /> },
    { key: "settings", label: "Settings", content: <SettingsManager /> },
  ], [approved, pending, banned, staff, batchReps, editors, members, loading, approveMember, rejectMember, unbanMember, renderCard, shownMembers, memberBatches, memberQuery, memberBatch]);

  return (
    <RequireRole role="super_admin" eyebrow="Full access" title={<>Super Admin <span className="text-gold-gradient">Dashboard</span></>}>
      <DashboardShell sections={sections} activeKey={dashKey} onActiveChange={setDashKey} />
    </RequireRole>
  );
}
