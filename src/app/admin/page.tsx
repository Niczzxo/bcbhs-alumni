"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import DashboardShell, { type DashSection } from "@/components/DashboardShell";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import { ROLE_META, POSITIONS } from "@/lib/types";
import { usePrivatePhone } from "@/lib/data";
import ContentManager from "@/components/content/ContentManager";
import V2Manager from "@/components/content/V2Manager";
import type { ContentKind } from "@/components/content/ContentManager";

/** Phone suffix for a member row, fetched from the private store. */
function MemberPhone({ userId }: { userId: string }) {
  const phone = usePrivatePhone(userId);
  if (!phone) return null;
  return <span> · {phone}</span>;
}

/**
 * Admin panel. Every sector lives in the sidebar (owner's rule,
 * 2026-10-23): approvals, members, each content kind and the
 * community features each open their own work area on click.
 */
export default function AdminPage() {
  const { user, members, approveMember, rejectMember, banMember, unbanMember, setPosition, setGuestVisible, hasPermission } = useAuth();
  const canApprove = hasPermission("approve_members");
  /* Ban rides on the approval permission (owner's rule, 2026-10-23):
     whoever may approve members may also ban and unban them. */
  const canBan = canApprove;
  const canSeeData = hasPermission("view_member_data");

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");
  const banned = members.filter((m) => m.status === "banned");

  const contentSections: { kind: ContentKind; perm: string; label: string }[] = (
    [
      { kind: "events", perm: "manage_events", label: "Events" },
      { kind: "announcements", perm: "post_announcements", label: "Announcements" },
      { kind: "gallery", perm: "manage_gallery", label: "Gallery" },
      { kind: "committee", perm: "manage_committee", label: "Committee" },
    ] as { kind: ContentKind; perm: string; label: string }[]
  ).filter((s) => hasPermission(s.perm));

  const sections: DashSection[] = [
    {
      key: "approvals",
      label: "Approvals",
      badge: pending.length,
      content: (
        <section>
          <h2 className="font-display text-xl font-bold text-ivory">
            Pending approvals <span className="text-gold-2">({pending.length})</span>
          </h2>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted md:col-span-2">
                All caught up, no pending registrations. 🎉
              </p>
            )}
            {pending.map((m, i) => (
              <Reveal key={m.id} delay={Math.min(i, 4) * 0.05} className="rounded-2xl border border-ivory/10 bg-ink-2 p-5">
                <div className="flex items-center gap-4">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ivory">{m.name}</p>
                    <p className="text-xs text-muted">
                      Batch {m.batch} · {m.district} · {m.email}
                      {canSeeData && <MemberPhone userId={m.id} />}
                    </p>
                    {m.profession && <p className="text-xs text-muted">{m.profession}{m.company ? ` @ ${m.company}` : ""}</p>}
                  </div>
                </div>
                {canApprove ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => approveMember(m.id)}
                      className="flex-1 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-2.5 text-xs font-bold uppercase tracking-widest text-ink"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => rejectMember(m.id)}
                      className="flex-1 rounded-full border border-red-400/40 py-2.5 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted">You don&apos;t have the <span className="text-gold-2">approve_members</span> permission.</p>
                )}
              </Reveal>
            ))}
          </div>
        </section>
      ),
    },
    {
      key: "members",
      label: "Members",
      badge: approved.length,
      content: (
        <section>
          <h2 className="font-display text-xl font-bold text-ivory">
            Approved members <span className="text-gold-2">({approved.length})</span>
          </h2>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-6 space-y-3">
            {approved.map((m) => (
              <div key={m.id} className="rounded-2xl border border-ivory/10 bg-ink-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ivory">{m.name}</p>
                    <p className="text-xs text-muted">
                      {m.memberId} · Batch {m.batch}
                      {canSeeData && <MemberPhone userId={m.id} />}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${ROLE_META[m.role].badge}`}>
                    {ROLE_META[m.role].label}
                  </span>
                </div>
                {(canApprove || canBan) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-ivory/10 pt-2.5">
                    {canApprove && (
                    <>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Position
                    </label>
                    <select
                      value={m.position ?? ""}
                      aria-label={`Official position for ${m.name}`}
                      onChange={(e) => setPosition(m.id, e.target.value)}
                      className="w-48 cursor-pointer rounded-full border border-gold/40 bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-2 outline-none transition-colors hover:bg-gold/10"
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
                      <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-2">
                        ★ {m.position}
                      </span>
                    )}
                    <label className="ml-auto flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-gold-2">
                      <input
                        type="checkbox"
                        checked={!!m.guestVisible}
                        onChange={(e) => setGuestVisible(m.id, e.target.checked)}
                        aria-label={`Show ${m.name} in the public guest directory`}
                        className="h-4 w-4 accent-[#d4a94e]"
                      />
                      Guest view
                    </label>
                    </>
                    )}
                    {canBan && m.role !== "super_admin" && m.id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => banMember(m.id)}
                        className="rounded-full border border-red-400/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {canApprove && approved.length > 0 && (
              <p className="mt-3 text-[11px] text-muted/70">
                Official positions are manually verified, allow up to 7 days.
              </p>
            )}
          </div>
          {banned.length > 0 && (
            <>
              <h3 className="font-display mt-10 text-lg font-bold text-ivory">
                Banned members <span className="text-red-300">({banned.length})</span>
              </h3>
              <div className="gold-rule mt-3 w-28" />
              <div className="mt-6 space-y-3">
                {banned.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-ink-2 px-4 py-3">
                    <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ivory">{m.name}</p>
                      <p className="text-xs text-muted">
                        {m.memberId} · Batch {m.batch}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                      Banned
                    </span>
                    {canBan && (
                      <button
                        type="button"
                        onClick={() => unbanMember(m.id)}
                        className="rounded-full border border-gold/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                      >
                        Unban
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ),
    },
    ...contentSections.map((s) => ({
      key: s.kind,
      label: s.label,
      content: <ContentManager kind={s.kind} />,
    })),
    {
      key: "community",
      label: "Community",
      content: (
        <div>
          <h2 className="font-display text-2xl font-bold text-ivory">Community features</h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8">
            <V2Manager />
          </div>
        </div>
      ),
    },
  ];

  return (
    <RequireRole role="admin" eyebrow="Batch Representatives" title={<>Batch Rep <span className="text-gold-gradient">Panel</span></>}>
      <DashboardShell sections={sections} />
    </RequireRole>
  );
}
