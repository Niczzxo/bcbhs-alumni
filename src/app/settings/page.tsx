"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { inputCls, labelCls } from "@/components/auth/ui";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import DottedQr from "@/components/DottedQr";
import type { TotpSecret } from "firebase/auth";

const cardCls = "rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-8";
const saveBtnCls =
  "rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-7 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a1430] transition hover:brightness-110 disabled:opacity-60";

function Feedback({ error, done }: { error?: string; done?: string }) {
  if (error) return <p className="text-sm font-medium text-red-300">{error}</p>;
  if (done) return <p className="text-sm font-medium text-emerald-300">✓ {done}</p>;
  return null;
}

/* ---------------- WhatsApp number ---------------- */

function PhoneCard() {
  const { user, updatePhone } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  /* The number lives in users_private (never the public profile);
     prefill from there in live mode when we can read it back. */
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return;
    let alive = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users_private", user.id));
        const saved = snap.exists() ? (snap.data().phone as string | undefined) : undefined;
        if (alive && saved) setPhone(saved);
      } catch {
        /* not readable here; the member can still overwrite it */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    const r = await updatePhone(phone);
    setBusy(false);
    if (r.ok) setDone("WhatsApp number saved.");
    else setError(r.error ?? "Could not save.");
  }

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ivory">WhatsApp number</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The number you registered with. Admins use it to verify you, and members reach you on
        WhatsApp from your profile. It stays private, never shown publicly.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div>
          <label className={labelCls}>Phone / WhatsApp number</label>
          <input
            className={inputCls}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
          />
        </div>
        <Feedback error={error} done={done} />
        <div>
          <button type="submit" disabled={busy} className={saveBtnCls}>
            {busy ? "Saving…" : "Save number"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- Email ---------------- */

function EmailCard() {
  const { user, changeEmail } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    const r = await changeEmail(currentPassword, newEmail);
    setBusy(false);
    if (r.ok) {
      setCurrentPassword("");
      setDone(
        isFirebaseConfigured
          ? `Verification link sent to ${newEmail.trim()}. Open it to finish the change, after that, sign in with the new email and your profile updates automatically.`
          : "Email updated.",
      );
      setNewEmail("");
    } else {
      setError(r.error ?? "Could not change the email.");
    }
  }

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ivory">Email address</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Your sign-in email. Current: <span className="text-ivory/85">{user?.email}</span>
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div>
          <label className={labelCls}>New email</label>
          <input
            className={inputCls}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className={labelCls}>Current password</label>
          <input
            className={inputCls}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Confirm it is really you"
            autoComplete="current-password"
          />
        </div>
        <Feedback error={error} done={done} />
        <div>
          <button type="submit" disabled={busy} className={saveBtnCls}>
            {busy ? "Sending…" : "Change email"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- Password ---------------- */

function PasswordCard() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    const r = await changePassword(currentPassword, newPassword);
    setBusy(false);
    if (r.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setDone("Password changed. Use the new one the next time you sign in.");
    } else {
      setError(r.error ?? "Could not change the password.");
    }
  }

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ivory">Password</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Pick something you do not reuse elsewhere. Minimum 6 characters.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div>
          <label className={labelCls}>Current password</label>
          <input
            className={inputCls}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>New password</label>
            <input
              className={inputCls}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input
              className={inputCls}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <Feedback error={error} done={done} />
        <div>
          <button type="submit" disabled={busy} className={saveBtnCls}>
            {busy ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- Page ---------------- */

/**
 * Account settings (owner, 2026-10-24): every signed-in member can
 * manage the credentials they registered with, WhatsApp number,
 * email and password, from the profile menu's Settings entry.
 */
/* ---------------- Two-factor authentication (super admins, opt-in) ---------------- */

function SecurityCard() {
  const { isSuperAdmin, isDemo, getTotpEnrolled, beginTotpEnrollment, confirmTotpEnrollment, disableTotp } = useAuth();
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    void getTotpEnrolled().then(setEnrolled);
  }, [isSuperAdmin, getTotpEnrolled]);

  if (!isSuperAdmin) return null;

  async function startSetup() {
    setError("");
    setDone("");
    setBusy(true);
    const res = await beginTotpEnrollment();
    setBusy(false);
    if (res.ok && res.secret && res.qrUrl && res.secretKey) {
      setSecret(res.secret);
      setQrUrl(res.qrUrl);
      setSecretKey(res.secretKey);
      setCode("");
      setSettingUp(true);
    } else {
      setError(res.error ?? "Could not start two-factor setup.");
    }
  }

  async function confirm() {
    if (!secret) return;
    setError("");
    setDone("");
    setBusy(true);
    const res = await confirmTotpEnrollment(secret, code);
    setBusy(false);
    if (res.ok) {
      setEnrolled(true);
      setSettingUp(false);
      setSecret(null);
      setCode("");
      setDone("Two-factor is on for your account.");
    } else {
      setError(res.error ?? "Could not enable two-factor.");
    }
  }

  async function disable() {
    setError("");
    setDone("");
    setBusy(true);
    const res = await disableTotp();
    setBusy(false);
    if (res.ok) {
      setEnrolled(false);
      setDone("Two-factor is off.");
    } else {
      setError(res.error ?? "Could not disable two-factor.");
    }
  }

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ivory">Two-factor authentication</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        An extra lock for super admins, opt-in only: after your password, login asks for a
        6-digit code from your authenticator app. Disable it any time while signed in.
      </p>
      {isDemo ? (
        <p className="mt-5 text-sm text-muted">Demo mode: two-factor needs a live account.</p>
      ) : enrolled === null ? (
        <p className="mt-5 text-sm text-muted">Checking…</p>
      ) : enrolled ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-emerald-300">✓ Two-factor is ON for your account.</p>
          <button type="button" onClick={disable} disabled={busy} className={`${saveBtnCls} mt-4`}>
            {busy ? "Working…" : "Disable two-factor"}
          </button>
        </div>
      ) : settingUp && secret ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            Scan this QR in your authenticator app (Google Authenticator, Authy, …), or enter
            the key below manually. Then type the 6-digit code to finish.
          </p>
          <div className="w-56 [&_canvas]:h-auto [&_canvas]:w-full">
            <DottedQr url={qrUrl} />
          </div>
          <p className="break-all text-xs text-muted">
            Key: <span className="font-mono text-ivory">{secretKey}</span>
          </p>
          <div>
            <label className={labelCls}>Authenticator code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={confirm} disabled={busy || code.length !== 6} className={saveBtnCls}>
              {busy ? "Verifying…" : "Verify & enable"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingUp(false);
                setSecret(null);
                setCode("");
              }}
              className="rounded-full border border-ivory/15 px-7 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-muted hover:text-ivory"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startSetup} disabled={busy} className={`${saveBtnCls} mt-5`}>
          {busy ? "Working…" : "Enable two-factor"}
        </button>
      )}
      <div className="mt-4">
        <Feedback error={error} done={done} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted/70">
        Keep your authenticator app safe. If you lose it, your login will stop here — save
        the key above somewhere safe when you enroll.
      </p>
    </section>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="My account"
          title={
            <>
              Account <span className="text-gold-gradient">Settings</span>
            </>
          }
          subtitle="Your number, email and password, the details you signed up with, kept in your own hands."
        />
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !user ? (
            <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Please log in</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Account settings are personal, log in with your own account to manage your
                number, email and password.
              </p>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="mt-6 rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-8 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a1430] transition hover:brightness-110"
              >
                Log in
              </button>
            </Reveal>
          ) : (
            <div className="grid gap-6">
              <PhoneCard />
              <EmailCard />
              <PasswordCard />
              <SecurityCard />
              <section className={cardCls}>
                <h2 className="font-display text-xl font-bold text-ivory">Public profile</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Name, batch, photo, profession, district, blood group and the rest of what
                  other members see about you, live on your profile page.
                </p>
                <div className="mt-5">
                  <Link
                    href="/profile"
                    className="inline-block rounded-full border border-gold/40 px-7 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-gold-2 transition hover:bg-gold/10"
                  >
                    Edit public profile
                  </Link>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
