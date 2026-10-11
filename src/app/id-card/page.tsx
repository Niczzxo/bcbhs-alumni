"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import IdCard from "@/components/IdCard";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";

/** Official digital ID card for the logged-in approved member. */
export default function IdCardPage() {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [verifyUrl, setVerifyUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client hydration
    setVerifyUrl(`${window.location.origin}/verify/${user?.memberId ?? ""}`);
  }, [user]);

  const approved = user?.status === "approved" && user.memberId;

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Official identification"
          title={<>My Alumni <span className="text-gold-gradient">ID Card</span></>}
          subtitle="Auto-generated on approval. Print it, carry it — the QR proves genuine membership."
        />
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !user ? (
            <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Please log in</p>
              <p className="mt-2 text-sm text-muted">Your ID card appears after login.</p>
              <button onClick={() => openAuthModal("login")} className="btn-shimmer mt-6 inline-block rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink">
                Log In
              </button>
            </Reveal>
          ) : !approved ? (
            <Reveal className="rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Approval pending</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Hi {user.name.split(" ")[0]} — your registration is still awaiting admin approval.
                Your official ID card will be generated automatically once approved.
              </p>
            </Reveal>
          ) : (
            <Reveal className="flex flex-col items-center">
              <div id="id-card-print">
                <IdCard member={user} verifyUrl={verifyUrl} />
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
                >
                  🖨 Print card
                </button>
                <Link
                  href={`/verify/${user.memberId}`}
                  className="rounded-full border border-gold/40 px-8 py-3 text-sm font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10"
                >
                  Preview verification
                </Link>
              </div>
              <p className="mt-6 max-w-md text-center text-xs text-muted print:hidden">
                Anyone who scans the QR lands on your public verification page — proof you are a
                genuine BCBHS alumnus.
              </p>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
