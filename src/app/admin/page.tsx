"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import { ROLE_META } from "@/lib/types";

/** Admin panel — approval queue + approved members. */
export default function AdminPage() {
  const { members, approveMember, rejectMember, hasPermission } = useAuth();
  const canApprove = hasPermission("approve_members");
  const canSeeData = hasPermission("view_member_data");

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

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
                      {canSeeData && m.phone ? ` · ${m.phone}` : ""}
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
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-ivory/10 bg-ink-2 px-4 py-3">
                <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ivory">{m.name}</p>
                  <p className="text-xs text-muted">
                    {m.memberId} · Batch {m.batch}
                    {canSeeData && m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${ROLE_META[m.role].badge}`}>
                  {ROLE_META[m.role].label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </RequireRole>
  );
}
