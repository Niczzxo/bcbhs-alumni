"use client";

import { useAuth } from "@/lib/auth-context";
import { SITE_EMAIL } from "@/lib/site";

/**
 * Suspension gate (owner's ban feature, 2026-10-23): a banned member
 * can still sign in at the Firebase level, but the app shows them
 * this panel instead of any member content until staff unban them.
 */
export default function BannedGate() {
  const { user, logout } = useAuth();
  if (!user || user.status !== "banned") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/[0.98] p-5">
      <div className="w-full max-w-md rounded-3xl border border-red-400/30 bg-ink-2 p-10 text-center">
        <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-3xl font-bold text-red-300">
          ✕
        </p>
        <h2 className="font-display mt-6 text-2xl font-bold text-ivory">Account suspended</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Your BCBHS alumni account has been suspended by the administration, so member
          areas are closed to you for now. If you believe this is a mistake, write to{" "}
          <a href={`mailto:${SITE_EMAIL}`} className="text-gold-2 hover:underline">
            {SITE_EMAIL}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={logout}
          className="btn-shimmer mt-8 w-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-3.5 text-sm font-bold uppercase tracking-widest text-ink"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
