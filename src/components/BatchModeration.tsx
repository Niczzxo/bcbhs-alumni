"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";

/**
 * Batch moderation (owner, 2026-10-30): batch reps and editors can
 * ban, unban and permanently delete members of their OWN batch only.
 *
 * The server enforces the scope on every call; this UI additionally
 * lists only own-batch plain members - never the staffer themselves,
 * never privileged roles (admin / editor / super_admin).
 */
export default function BatchModeration() {
  const { user, members, banMember, unbanMember, deleteMember } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const ownBatch = useMemo(() => {
    if (!user?.batch) return [] as UserProfile[];
    return members.filter(
      (m) => m.batch === user.batch && m.id !== user.id && m.role === "member",
    );
  }, [members, user]);
  const approved = useMemo(() => ownBatch.filter((m) => m.status === "approved"), [ownBatch]);
  const banned = useMemo(() => ownBatch.filter((m) => m.status === "banned"), [ownBatch]);

  if (!user || (user.role !== "admin" && user.role !== "editor")) return null;

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
        Batch moderation{" "}
        <span className="text-gold-2">· Batch {user.batch}</span>
      </h2>
      <div className="gold-rule mt-3 w-28" />
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
        You can ban, unban and delete members of your own batch only. Banned
        members lose their ID-card verification; deleting removes their login
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
