"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";

/**
 * Member moderation (owner, 2026-10-30): batch reps can ban, unban and
 * permanently delete members of their OWN batch only; editors moderate
 * EVERY member as the super admin's alternative.
 *
 * The server enforces the scope on every call; this UI additionally
 * lists only plain members - never the staffer themselves, never
 * privileged roles (admin / editor / super_admin).
 */
export default function BatchModeration() {
  const { user, members, banMember, unbanMember, deleteMember, hasPermission } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const isEditor = user?.role === "editor";
  /* Moderation is grant-gated for staff (owner, 2026-10-30): batch
     reps get 'moderate_members' auto-on at promotion, editors only
     by explicit grant - the super admin may switch it off after. */
  const canModerate =
    (user?.role === "admin" || isEditor) && hasPermission("moderate_members");

  const moderatable = useMemo(() => {
    if (!user) return [] as UserProfile[];
    return members.filter(
      (m) =>
        m.id !== user.id &&
        m.role === "member" &&
        (isEditor || m.batch === user.batch),
    );
  }, [members, user, isEditor]);
  const approved = useMemo(() => moderatable.filter((m) => m.status === "approved"), [moderatable]);
  const banned = useMemo(() => moderatable.filter((m) => m.status === "banned"), [moderatable]);

  if (!user || !canModerate) {
    if (user?.role === "admin" || isEditor) {
      return (
        <section>
          <p className="rounded-2xl border border-dashed border-ivory/15 p-6 text-center text-sm text-muted">
            The super admin has not granted you member moderation yet. Ask them
            to enable the “Moderate Members” permission for your account.
          </p>
        </section>
      );
    }
    return null;
  }

  async function onDelete(m: UserProfile) {
    setDeleteError("");
    const sure = window.confirm(
      `Delete ${m.name} permanently?\n\nTheir login, profile and ID-card record will be removed. They can register again anytime with the same email.`,
    );
    if (!sure) return;
    setDeletingId(m.id);
    const res = await deleteMember(m.id);
    setDeletingId(null);
    if (!res.ok) setDeleteError(res.error ?? "Delete failed. Please try again.");
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ivory">
        {isEditor ? "Member moderation" : "Batch moderation"}{" "}
        <span className="text-gold-2">
          · {isEditor ? "All batches" : `Batch ${user.batch}`}
        </span>
      </h2>
      <div className="gold-rule mt-3 w-28" />
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
        {isEditor
          ? "You moderate every member as the super admin's alternative: ban, unban and delete any member of any batch."
          : "You can ban, unban and delete members of your own batch only."}{" "}
        Banned members lose their ID-card verification; deleting removes their login
        and profile permanently, but they may register again anytime.
      </p>
      {deleteError && (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {deleteError}
        </p>
      )}

      <h3 className="font-display mt-8 text-lg font-bold text-ivory">
        Members <span className="text-gold-2">({approved.length})</span>
      </h3>
      <div className="mt-4 space-y-3">
        {approved.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ivory/15 p-6 text-center text-sm text-muted">
            No members in your batch right now.
          </p>
        )}
        {approved.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-ivory/10 bg-ink-2 px-4 py-3"
          >
            <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-sm font-semibold leading-snug text-ivory">{m.name}</p>
              <p className="text-xs text-muted">
                <span className="whitespace-nowrap">{m.memberId}</span> ·{" "}
                <span className="whitespace-nowrap">Batch {m.batch}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => banMember(m.id)}
              className="rounded-full border border-red-400/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10"
            >
              Ban
            </button>
          </div>
        ))}
      </div>

      {banned.length > 0 && (
        <>
          <h3 className="font-display mt-10 text-lg font-bold text-ivory">
            Banned <span className="text-red-300">({banned.length})</span>
          </h3>
          <div className="mt-4 space-y-3">
            {banned.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-400/20 bg-ink-2 px-4 py-3"
              >
                <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-sm font-semibold leading-snug text-ivory">{m.name}</p>
                  <p className="text-xs text-muted">
                    <span className="whitespace-nowrap">{m.memberId}</span> ·{" "}
                    <span className="whitespace-nowrap">Batch {m.batch}</span>
                  </p>
                </div>
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
                <button
                  type="button"
                  onClick={() => onDelete(m)}
                  disabled={deletingId === m.id}
                  className="rounded-full border border-red-400/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deletingId === m.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
