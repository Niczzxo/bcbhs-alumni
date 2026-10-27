"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import type { MultiFactorResolver } from "firebase/auth";
import type { AuthErrorField } from "@/lib/security";
import { inputCls, labelCls } from "./ui";

/** inputCls with the border recoloured for a field-level error. */
const errInputCls = inputCls
  .replace("border-ivory/15", "border-red-400/70")
  .replace("focus:border-gold/60", "focus:border-red-400/80");

/** Shared login form, used by the /login page and the auth modal. */
export default function LoginForm({
  onSuccess,
  onSwitchToRegister,
}: {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}) {
  const { login, completeMfaLogin, resetPassword, isDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  /* Which field the current error belongs to (owner, 2026-10-24:
     only the wrong field is marked). Null = shared banner below. */
  const [errorField, setErrorField] = useState<AuthErrorField | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  /* TOTP second step (2026-10-28): set when login answers with an MFA
     challenge instead of success or a password error. */
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  /** Editing the marked field clears its error. */
  function clearFieldError(field: AuthErrorField) {
    if (errorField === field) {
      setError("");
      setErrorField(null);
    }
  }

  async function doLogin(e: FormEvent | null, em: string, pw: string) {
    e?.preventDefault();
    setError("");
    setErrorField(null);
    setNotice("");
    setBusy(true);
    const res = await login(em, pw);
    setBusy(false);
    if (res.ok) onSuccess?.();
    else if (res.mfaResolver) {
      setMfaResolver(res.mfaResolver);
      setMfaCode("");
    } else {
      setError(res.error ?? "Login failed.");
      setErrorField(res.field ?? null);
    }
  }

  async function doMfa() {
    if (!mfaResolver) return;
    setError("");
    setBusy(true);
    const res = await completeMfaLogin(mfaResolver, mfaCode);
    setBusy(false);
    if (res.ok) onSuccess?.();
    else setError(res.error ?? "Verification failed.");
  }

  /* Forgot password: Firebase emails a link that sets a new one. */
  async function doReset() {
    setError("");
    setErrorField(null);
    setNotice("");
    if (isDemo) {
      setNotice("Demo mode: any password works here, nothing to reset.");
      return;
    }
    if (!email.trim()) {
      setError("Type your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    const res = await resetPassword(email);
    setBusy(false);
    if (res.ok) {
      setNotice(
        "If an account exists for this email, a password reset link is on its way. Check your inbox (and the spam folder), then follow the link to set a new password.",
      );
    } else {
      setError(res.error ?? "Could not send the reset email.");
    }
  }

  return (
    <div>
      {mfaResolver ? (
        <div>
          <p className="text-sm leading-relaxed text-muted">
            Two-factor is on for this account. Open your authenticator app and type the 6-digit code.
          </p>
          <div className="mt-5">
            <label className={labelCls}>Authenticator code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={inputCls}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
          </div>
          {error && (
            <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={doMfa}
            disabled={busy || mfaCode.length !== 6}
            className="btn-shimmer mt-7 w-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-3.5 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify"}
          </button>
          <p className="mt-5 text-center text-xs text-muted">
            <button
              type="button"
              onClick={() => {
                setMfaResolver(null);
                setMfaCode("");
                setError("");
              }}
              className="text-gold-2 hover:underline"
            >
              Use a different account
            </button>
          </p>
        </div>
      ) : (
      <form onSubmit={(e) => doLogin(e, email, password)}>
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              className={errorField === "email" ? errInputCls : inputCls}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder="you@example.com"
            />
            {errorField === "email" && error && (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              className={errorField === "password" ? errInputCls : inputCls}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              placeholder="••••••••"
            />
            {errorField === "password" && error && (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            )}
            <p className="mt-2 text-right">
              <button
                type="button"
                onClick={doReset}
                disabled={busy}
                className="text-xs font-semibold text-gold-2 hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </p>
          </div>
        </div>

        {error && !errorField && (
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
          type="submit"
          disabled={busy}
          className="btn-shimmer mt-7 w-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-3.5 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log In"}
        </button>
        <p className="mt-5 text-center text-xs text-muted">
          New here?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-gold-2 hover:underline"
            >
              Create an account
            </button>
          ) : (
            <Link href="/register" className="text-gold-2 hover:underline">
              Create an account
            </Link>
          )}
        </p>
      </form>
      )}

      {isDemo && (
        <div className="mt-6 rounded-2xl border border-gold/25 bg-ink p-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-gold">
            Demo quick login
          </p>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Super Admin", email: "superadmin@bcbhs-alumni.org" },
              { label: "Batch Rep", email: "admin@bcbhs-alumni.org" },
              { label: "Member", email: "tanvir.ahmed@example.com" },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => doLogin(null, r.email, "demo")}
                disabled={busy}
                className="rounded-xl border border-ivory/15 px-4 py-2.5 text-sm text-ivory/90 transition-colors hover:border-gold/50 hover:text-gold-2 disabled:opacity-60"
              >
                Continue as <span className="font-semibold">{r.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-muted/70">
            Any password works in demo mode.
          </p>
        </div>
      )}
    </div>
  );
}
