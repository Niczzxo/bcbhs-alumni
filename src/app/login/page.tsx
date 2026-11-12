"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import LoginForm from "@/components/auth/LoginForm";
import VerifyEmailBox from "@/components/auth/VerifyEmailBox";
import { useAuth } from "@/lib/auth-context";

/** Login form honoring an optional ?next= redirect (e.g. /login?next=/gallery). */
function LoginBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const verifiedParam = searchParams.get("verified");
  const { user, loading, pendingVerification } = useAuth();
  const [verifyDismissed, setVerifyDismissed] = useState(false);

  /* Already signed in? Never sit on the login form (owner report,
     2026-10-23): a session that restores a moment after a guard
     redirect lands here must be handed onward immediately, not be
     shown a login form while the navbar already says LOGOUT. */
  useEffect(() => {
    if (!loading && user) router.replace(next || "/");
  }, [loading, user, next, router]);

  if (user) {
    return (
      <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
        <p className="text-center text-sm leading-relaxed text-muted">
          You are already logged in as <span className="font-semibold text-gold-2">{user.name}</span>.
          <br />
          Taking you onward…
        </p>
      </Reveal>
    );
  }

  /* Returning unverified member (owner, 2026-11-13): the inbox link
     was not clicked yet, so the verify screen comes before the form. */
  if (pendingVerification && !verifyDismissed) {
    return (
      <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
        <VerifyEmailBox
          email={pendingVerification}
          onVerified={() => router.replace(next || "/")}
          onCancel={() => setVerifyDismissed(true)}
        />
      </Reveal>
    );
  }

  return (
    <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
      {verifiedParam === "1" && (
        <p className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Your email is verified. Log in to continue your registration.
        </p>
      )}
      <LoginForm onSuccess={() => router.push(next || "/")} />
    </Reveal>
  );
}

/** Email/password login page, also available as a popup via the navbar. */
export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Welcome back"
          title={<>Log in to <span className="text-gold-gradient">your alumni</span> home</>}
        />
        <div className="mx-auto max-w-md px-5 py-14 sm:px-8">
          <Suspense>
            <LoginBox />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
