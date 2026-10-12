"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import { ROLE_META } from "@/lib/types";
import { usePrivatePhone } from "@/lib/data";
import ContentManager from "@/components/content/ContentManager";
import type { ContentKind } from "@/components/content/ContentManager";

/** Phone suffix for a member row — fetched from the private store. */
function MemberPhone({ userId }: { userId: string }) {
  const phone = usePrivatePhone(userId);
  if (!phone) return null;
  return <span> · {phone}</span>;
}

/** Admin panel — approval queue + approved members. */
export default function AdminPage() {
  const { members, approveMember, rejectMember, setPosition, setGuestVisible, hasPermission } = useAuth();
  const canApprove = hasPermission("approve_members");
  const canSeeData = hasPermission("view_member_data");

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  const contentSections: { kind: ContentKind; perm: string }[] = (
    [
      { kind: "events", perm: "manage_events" },
      { kind: "announcements", perm: "post_announcements" },
      { kind: "gallery", perm: "manage_gallery" },
      { kind: "committee", perm: "manage_committee" },
    ] as { kind: ContentKind; perm: string }[]
  ).filter((s) => hasPermission(s.perm));

  return (
    <RequireRole role="admin" eyebrow="Administration" title={<>Admin <span className="text-gold-gradient">Panel</span></>}>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Approval queue */}
        <section>
          <h2 className="font-display text-xl font-bold text-ivory">
            Pending approvals <span className="text-gold-2">({pending.length})</span>
          </h2>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-6 space-y-4">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
                All caught up — no pending registrations. 🎉
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

        {/* Approved members */}
        <section>
          <h2 className="font-display text-xl font-bold text-ivory">
            Approved members <span className="text-gold-2">({approved.length})</span>
          </h2>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-6 max-h-[560px] space-y-3 overflow-y-auto pr-1">
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
                {canApprove && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-ivory/10 pt-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Position
                    </label>
                    <input
                      key={`${m.id}-${m.position ?? "none"}`}
                      defaultValue={m.position ?? ""}
                      placeholder="e.g. President"
                      aria-label={`Official position for ${m.name}`}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== (m.position ?? "")) setPosition(m.id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="w-44 rounded-full border border-ivory/15 bg-ink px-3 py-1.5 text-xs text-ivory placeholder:text-muted/50 outline-none focus:border-gold/60"
                    />
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
                  </div>
                )}
              </div>
            ))}
            {canApprove && approved.length > 0 && (
              <p className="mt-3 text-[11px] text-muted/70">
                Official positions are manually verified — allow up to 7 days.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Content sections the staff member is permitted to manage */}
      {contentSections.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold text-ivory">Content management</h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {contentSections.map((s) => (
              <ContentManager key={s.kind} kind={s.kind} />
            ))}
          </div>
        </div>
      )}
    </RequireRole>
  );
}
