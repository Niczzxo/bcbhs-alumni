"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { useAuthModal } from "./AuthModal";
import IdCard from "./IdCard";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";

/** Demo member for the homepage teaser — shows the REAL card design. */
const TEASER_MEMBER: UserProfile = {
  id: "teaser",
  name: "Your Name",
  batch: "20XX",
  email: "you@example.com",
  bloodGroup: "O+",
  district: "Dhaka",
  isAbroad: false,
  department: "Science",
  dob: "2000-01-01",
  whatsapp: "01XXXXXXXXX",
  profession: "Member",
  status: "approved",
  role: "member",
  permissions: [],
  memberId: "BCBHS-20XX-0000",
  createdAt: "2023-01-01T00:00:00.000Z",
};

const GOLD_BUTTON =
  "btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-9 py-4 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_36px_rgba(212,169,78,0.45)] transition-transform duration-300 hover:scale-105";
const GHOST_BUTTON =
  "rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:border-gold hover:bg-gold/10";

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/60 text-[10px] text-gold">
        ✓
      </span>
      {children}
    </li>
  );
}

/**
 * Membership band. Guests see the join pitch with a sample card;
 * signed-in members see THEIR OWN card and details instead —
 * a "Register Now" button makes no sense once you have an account.
 */
export default function IdCardCta() {
  const { openAuthModal } = useAuthModal();
  const { user } = useAuth();
  const [verifyUrl, setVerifyUrl] = useState("");

  useEffect(() => {
    if (user?.memberId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only origin read, mirrors /id-card
      setVerifyUrl(`${window.location.origin}/verify/${user.memberId}`);
    }
  }, [user?.memberId]);

  const approved = user?.status === "approved";
  const pending = user?.status === "pending";

  return (
    <section id="join" className="relative overflow-hidden py-24 sm:py-32">
      {/* giant watermark emblem */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
        <span className="font-display text-[26vw] font-extrabold leading-none text-ivory/[0.025]">
          2023
        </span>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Membership
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-tight text-ivory sm:text-5xl">
            {user ? (
              <>
                Your official
                <br />
                <span className="text-gold-gradient">Alumni ID Card</span>
              </>
            ) : (
              <>
                Get your official
                <br />
                <span className="text-gold-gradient">Alumni ID Card</span>
              </>
            )}
          </h2>

          {approved && user ? (
            <>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                Welcome back, {user.name.split(" ")[0]} — your verified digital
                ID card is ready. Anyone can scan its QR code to confirm you
                are a true BCBHSian. Print it, carry it, show it with pride.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/id-card" className={GOLD_BUTTON}>
                  View My ID Card
                </Link>
                <Link href="/profile/edit" className={GHOST_BUTTON}>
                  Edit Profile
                </Link>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <Tick>Member ID — {user.memberId ?? "—"}</Tick>
                <Tick>Batch {user.batch} · {user.department ?? "Alumni"}</Tick>
                <Tick>QR verification works even when printed</Tick>
              </ul>
            </>
          ) : pending && user ? (
            <>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                Thanks for registering, {user.name.split(" ")[0]}. Your
                application is with our admins for verification — this can
                take up to 7 days. The moment you are approved, your official
                ID card with its QR code appears right here.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/profile/edit" className={GOLD_BUTTON}>
                  View My Application
                </Link>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <Tick>Registration received — Batch {user.batch}</Tick>
                <Tick>Admin verification in progress</Tick>
                <Tick>Your card activates automatically on approval</Tick>
              </ul>
            </>
          ) : (
            <>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                Register with your batch and roll, get verified by our admins, and
                your official digital ID card is generated automatically — complete
                with a QR code anyone can scan to confirm you are a true BCBHSian.
                Print it, carry it, show it with pride.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button onClick={() => openAuthModal("register")} className={GOLD_BUTTON}>
                  Register Now
                </button>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <Tick>Free registration for all BCBHS graduates</Tick>
                <Tick>Admin-verified — no fake members, ever</Tick>
                <Tick>QR verification works even when printed</Tick>
              </ul>
            </>
          )}
        </Reveal>

        {/* Right side: the member's real card, a pending panel, or the guest teaser */}
        <Reveal delay={0.15} className="flex justify-center">
          {approved && user ? (
            <IdCard member={user} verifyUrl={verifyUrl} />
          ) : pending ? (
            <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-gold/25 bg-ink-2/80 px-8 py-14 text-center">
              <span className="seal-ring flex h-20 w-20 items-center justify-center rounded-full bg-ink text-3xl">
                ⏳
              </span>
              <p className="font-display mt-6 text-2xl font-bold text-ivory">
                Verification pending
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Our admins are reviewing your registration. Your official ID
                card will be generated here as soon as you are approved.
              </p>
            </div>
          ) : (
            <IdCard
              member={TEASER_MEMBER}
              verifyUrl="https://bcbhs-alumni-niczzxos-projects.vercel.app/verify/BCBHS-20XX-0000"
            />
          )}
        </Reveal>
      </div>
    </section>
  );
}
