"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const RESEND_COOLDOWN_S = 60;

/** Shared "check your inbox" step for email verification (owner,
 *  2026-11-13). Shown right after registration and to any signed-in
 *  account whose inbox is not verified yet. The member taps
 *  "I've verified" after clicking the link; the server confirms the
 *  verification before the registration can continue. */
export default function VerifyEmailBox({
  email,
  onVerified,
  onCancel,
}: {
  email: string;
  /** Called once the server confirms the inbox is verified. */
  onVerified: () => void;
  /** "Use a different email" - the parent decides what that means
      (back to the form, back to login). */
  onCancel?: () => void;
}) {
  const { resendVerificationEmail, checkEmailVerification, isDemo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function doResend() {
    setError("");
    setNotice("");
    setBusy(true);
    const res = await resendVerificationEmail();
    setBusy(false);
    if (res.ok) {
      setNotice("Verification email sent. Check your inbox (and the spam folder).");
      setCooldown(RESEND_COOLDOWN_S);
    } else setError(res.error ?? "Could not send the verification email.");
  }

  async function doCheck() {
    setError("");
    setNotice("");
    setBusy(true);
    const res = await checkEmailVerification();
    setBusy(false);
    if (res.ok && res.verified) onVerified();
    else if (res.ok)
      setError("Not verified yet. Click the link in your email first, then try again.");
    else setError(res.error ?? "Could not check right now. Please try again.");
  }

  return (
    <div className="text-center">
      <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">
        ✉️
      </p>
      <h2 className="font-display mt-6 text-2xl font-bold text-ivory">Check your inbox</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        We sent a verification link to{" "}
        <span className="font-semibold text-gold-2">{email}</span>. Click the link to prove
        this inbox is yours, then tap below to continue. No link yet? Check the spam folder.
      </p>
      {isDemo && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold-2">
          Demo mode: no real email is sent, tap &ldquo;I&rsquo;ve verified&rdquo; to continue.
        </p>
      )}
      {error && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      <button
        type="button"
        onClick={doCheck}
        disabled={busy}
        className="btn-shimmer mt-7 w-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-4 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-60"
      >
        {busy ? "Checking…" : "I've verified, continue"}
      </button>
      <button
        type="button"
        onClick={doResend}
        disabled={busy || cooldown > 0}
        className="mt-4 w-full rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10 disabled:opacity-60"
      >
        {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend email"}
      </button>
      {onCancel && (
        <p className="mt-5 text-center text-xs text-muted">
          <button type="button" onClick={onCancel} className="text-gold-2 hover:underline">
            Use a different email
          </button>
        </p>
      )}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted/70">
        Wrong email? Just register again with the correct one. An unverified registration
        never reaches the admin.
      </p>
    </div>
  );
}
