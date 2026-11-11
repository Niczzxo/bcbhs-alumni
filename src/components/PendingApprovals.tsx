"use client";

import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { usePrivatePhone } from "@/lib/data";
import type { UserProfile } from "@/lib/types";

/** Phone suffix for a member row, fetched from the private store. */
function MemberPhone({ userId }: { userId: string }) {
  const phone = usePrivatePhone(userId);
  if (!phone) return null;
  return <span> · {phone}</span>;
}

/**
 * Pending registration approvals (shared by the Admin and Editor
 * dashboards): approve or reject each pending registration. Shown
 * only where the viewer holds the approve_members permission; the
 * buttons call the auth context's approveMember / rejectMember,
 * which the Firestore rules allow for anyone with that grant.
 */
export default function PendingApprovals({
  pending,
  loading,
  canApprove,
  canSeeData,
  onApprove,
  onReject,
}: {
  pending: UserProfile[];
  loading: boolean;
  canApprove: boolean;
  canSeeData: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ivory">
        Pending approvals <span className="text-gold-2">({pending.length})</span>
      </h2>
      <div className="gold-rule mt-3 w-28" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {pending.length === 0 && (
          <p className="rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted md:col-span-2">
            {loading ? "Loading registrations…" : "All caught up, no pending registrations. 🎉"}
          </p>
        )}
        {pending.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i, 4) * 0.05} className="rounded-2xl border border-ivory/10 bg-ink-2 p-5">
            <div className="flex items-center gap-4">
              <Avatar name={m.name} photoURL={m.photoURL} size="sm" zoomable />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-ivory">{m.name}</p>
                <p className="break-all text-xs text-muted">
                  Batch {m.batch} · {m.district} · {m.email}
                  {canSeeData && <MemberPhone userId={m.id} />}
                </p>
                {m.profession && <p className="text-xs text-muted">{m.profession}{m.company ? ` @ ${m.company}` : ""}</p>}
              </div>
            </div>
            {canApprove ? (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => onApprove(m.id)}
                  className="flex-1 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-2.5 text-xs font-bold uppercase tracking-widest text-ink"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => onReject(m.id)}
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
  );
}
