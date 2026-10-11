"use client";

import Reveal from "./Reveal";
import { useAuthModal } from "./AuthModal";
import IdCard from "./IdCard";
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

/** Join CTA band — live ID-card teaser (real design, flippable). */
export default function IdCardCta() {
  const { openAuthModal } = useAuthModal();
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
            Get your official
            <br />
            <span className="text-gold-gradient">Alumni ID Card</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted">
            Register with your batch and roll, get verified by our admins, and
            your official digital ID card is generated automatically — complete
            with a QR code anyone can scan to confirm you are a true BCBHSian.
            Print it, carry it, show it with pride.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuthModal("register")}
              className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-9 py-4 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_36px_rgba(212,169,78,0.45)] transition-transform duration-300 hover:scale-105"
            >
              Register Now
            </button>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted">
            {[
              "Free registration for all BCBHS graduates",
              "Admin-verified — no fake members, ever",
              "QR verification works even when printed",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/60 text-[10px] text-gold">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Live ID-card teaser — the real portrait design, flippable */}
        <Reveal delay={0.15} className="flex justify-center">
          <IdCard
            member={TEASER_MEMBER}
            verifyUrl="https://bcbhs-alumni-niczzxos-projects.vercel.app/verify/BCBHS-20XX-0000"
          />
        </Reveal>
      </div>
    </section>
  );
}
