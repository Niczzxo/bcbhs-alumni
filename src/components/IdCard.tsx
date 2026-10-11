"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { UserProfile } from "@/lib/types";
import { Avatar } from "./MemberCard";
import { SITE_EMAIL } from "@/lib/site";

/**
 * Luxury alumni ID card — portrait CR80 (53.98 × 85.6 mm).
 * Navy + gold to match the website theme. Front carries the member
 * details, back carries the QR + handwritten signature.
 * Fully scalable via cqw units. Click to flip; both sides print at
 * exact real-world size. Give the wrapper `id="id-card-print"` for print.
 */

export type CardThemeId = "midnight" | "noir" | "ivory" | "emerald";

export const CARD_THEMES: Record<CardThemeId, { label: string; vars: CSSProperties }> = {
  midnight: {
    label: "Midnight Gold",
    vars: {
      "--card-bg1": "#0d1430", "--card-bg2": "#060a1a",
      "--glow-1": "rgba(38,52,110,0.55)", "--glow-2": "rgba(20,28,64,0.6)",
      "--card-ink": "#f5f1e3", "--card-accent": "#f0cd7e", "--card-muted": "rgba(245,241,227,0.55)",
      "--foil-1": "#8a6a1f", "--foil-2": "#d4a94e", "--foil-3": "#fbf5b7", "--foil-4": "#caa64b",
      "--sig-ink": "#f5dfa0", "--seal-glow": "rgba(212,169,78,0.45)",
      "--strip-bg": "rgba(245,241,227,0.95)", "--strip-ink": "rgba(6,10,26,0.8)",
    } as CSSProperties,
  },
  noir: {
    label: "Royal Black",
    vars: {
      "--card-bg1": "#121214", "--card-bg2": "#050506",
      "--glow-1": "rgba(212,169,78,0.12)", "--glow-2": "rgba(0,0,0,0.55)",
      "--card-ink": "#f7f3e8", "--card-accent": "#e9c979", "--card-muted": "rgba(247,243,232,0.5)",
      "--foil-1": "#7a5c22", "--foil-2": "#e3b85c", "--foil-3": "#fff3c4", "--foil-4": "#b98f3e",
      "--sig-ink": "#ffe9a8", "--seal-glow": "rgba(227,184,92,0.5)",
      "--strip-bg": "rgba(247,243,232,0.95)", "--strip-ink": "rgba(5,5,6,0.8)",
    } as CSSProperties,
  },
  ivory: {
    label: "Ivory Luxe",
    vars: {
      "--card-bg1": "#fbf7ec", "--card-bg2": "#eee1c2",
      "--glow-1": "rgba(212,169,78,0.28)", "--glow-2": "rgba(160,120,50,0.16)",
      "--card-ink": "#1b2340", "--card-accent": "#8a6a1f", "--card-muted": "rgba(27,35,64,0.6)",
      "--foil-1": "#8a6a1f", "--foil-2": "#d4a94e", "--foil-3": "#fff8dc", "--foil-4": "#a8822f",
      "--sig-ink": "#1e3a8a", "--seal-glow": "rgba(138,106,31,0.4)",
      "--strip-bg": "rgba(255,255,255,0.95)", "--strip-ink": "rgba(27,35,64,0.8)",
    } as CSSProperties,
  },
  emerald: {
    label: "Emerald Royale",
    vars: {
      "--card-bg1": "#07382a", "--card-bg2": "#041f18",
      "--glow-1": "rgba(46,125,90,0.5)", "--glow-2": "rgba(4,31,24,0.7)",
      "--card-ink": "#f2f5e9", "--card-accent": "#eec96f", "--card-muted": "rgba(242,245,233,0.55)",
      "--foil-1": "#8a6a1f", "--foil-2": "#d4a94e", "--foil-3": "#fbf5b7", "--foil-4": "#caa64b",
      "--sig-ink": "#f5dfa0", "--seal-glow": "rgba(238,201,111,0.45)",
      "--strip-bg": "rgba(242,245,233,0.95)", "--strip-ink": "rgba(4,31,24,0.8)",
    } as CSSProperties,
  },
};

/** Fine-line guilloche security pattern (takes accent color). */
function Guilloche() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-[var(--card-accent)] opacity-[0.13]"
      aria-hidden="true"
    >
      <defs>
        <pattern id="id-guilloche" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="17" cy="17" r="9.5" fill="none" stroke="currentColor" strokeWidth="0.35" />
          <circle cx="17" cy="17" r="4" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <path d="M0 17 H34 M17 0 V34" stroke="currentColor" strokeWidth="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#id-guilloche)" />
    </svg>
  );
}

/** Foil frame shell shared by both faces (portrait). Container for cqw scaling. */
function FoilShell({ theme, children }: { theme: CardThemeId; children: ReactNode }) {
  return (
    <div
      className="foil-frame relative aspect-[53.98/85.6] w-full rounded-2xl p-[2px] shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(212,169,78,0.12)] [container-type:inline-size]"
      style={CARD_THEMES[theme].vars}
    >
      <div className="card-bg relative h-full w-full overflow-hidden rounded-[14px]">
        <Guilloche />
        <div className="foil-shine pointer-events-none absolute inset-y-0 left-0 w-2/3" />
        {children}
      </div>
    </div>
  );
}

function CornerTicks() {
  const base = "pointer-events-none absolute h-[4cqw] w-[4cqw] border-[var(--card-accent)]";
  return (
    <>
      <span className={`${base} -left-[0.8cqw] -top-[0.8cqw] border-l-2 border-t-2`} />
      <span className={`${base} -right-[0.8cqw] -top-[0.8cqw] border-r-2 border-t-2`} />
      <span className={`${base} -bottom-[0.8cqw] -left-[0.8cqw] border-b-2 border-l-2`} />
      <span className={`${base} -bottom-[0.8cqw] -right-[0.8cqw] border-b-2 border-r-2`} />
    </>
  );
}

function CardFront({ member, theme }: { member: UserProfile; theme: CardThemeId }) {
  return (
    <FoilShell theme={theme}>
      <div className="relative flex h-full flex-col items-center p-[5cqw] text-center">
        {/* header */}
        <span
          className="relative block h-[13cqw] w-[13cqw] shrink-0 overflow-hidden rounded-full ring-1 shadow-[0_0_22px_var(--seal-glow)]"
          style={{ ["--tw-ring-color" as string]: "var(--card-accent)" }}
        >
          <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
        </span>
        <p className="mt-[2cqw] text-[2.1cqw] font-bold uppercase tracking-[0.3em] text-[var(--card-accent)] opacity-90">
          Bogura Cantonment Board High School
        </p>
        <p className="font-display emboss-gold text-[6.5cqw] font-extrabold leading-none tracking-wide text-[var(--card-accent)]">
          BCBHS ALUMNI
        </p>

        <div className="my-[2.5cqw] flex w-full items-center gap-[2cqw]">
          <div className="gold-rule flex-1" />
          <span className="text-[2.6cqw] text-[var(--card-accent)]">✦</span>
          <div className="gold-rule flex-1" />
        </div>

        {/* photo */}
        <div className="relative w-[38cqw] shrink-0">
          <div className="foil-frame absolute inset-0 rounded-xl" />
          <div className="absolute inset-[2px] aspect-[3/4] overflow-hidden rounded-[10px] bg-black/40">
            {member.photoURL ? (
              <Image src={member.photoURL} alt={member.name} width={120} height={160} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Avatar name={member.name} size="lg" />
              </div>
            )}
          </div>
          <div className="aspect-[3/4] w-full" />
          <CornerTicks />
        </div>

        {/* name + details */}
        <p className="mt-[3cqw] text-[2cqw] font-bold uppercase tracking-[0.35em] text-[var(--card-accent)] opacity-80">
          Alumnus · Batch {member.batch}
        </p>
        <p className="font-display emboss-gold mt-[1cqw] text-[6cqw] font-bold leading-tight text-[var(--card-ink)]">
          {member.name}
        </p>

        <div className="mt-[2.5cqw] w-full space-y-[1.8cqw] text-[2.6cqw]">
          <div className="border-b border-[var(--card-accent)]/20 pb-[1.8cqw]">
            <p className="text-[1.8cqw] uppercase tracking-[0.3em] text-[var(--card-muted)]">Member ID</p>
            <p className="mt-[0.6cqw] font-mono font-bold tracking-wider text-[var(--card-ink)]">
              {member.memberId ?? "—"}
            </p>
          </div>
          {member.profession && (
            <div className="border-b border-[var(--card-accent)]/20 pb-[1.8cqw]">
              <p className="text-[1.8cqw] uppercase tracking-[0.3em] text-[var(--card-muted)]">Profession</p>
              <p className="mt-[0.6cqw] font-semibold text-[var(--card-ink)]">{member.profession}</p>
            </div>
          )}
          {member.isDonor && member.bloodGroup && (
            <p className="inline-block rounded-full border border-red-400/40 bg-red-500/10 px-[3cqw] py-[1cqw] text-[2.4cqw] font-bold text-red-300">
              🩸 {member.bloodGroup} blood donor
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* holographic footer strip */}
        <div className="holo-strip flex h-[7cqw] w-full items-center justify-between rounded-md px-[3cqw]">
          <span className="text-[2.2cqw] font-extrabold uppercase tracking-[0.28em] text-ink/90">
            ✓ Verified Member
          </span>
          <span className="text-[2.2cqw] font-bold uppercase tracking-[0.2em] text-ink/70">Lifetime</span>
        </div>
      </div>
    </FoilShell>
  );
}

function CardBack({ member, verifyUrl, theme }: { member: UserProfile; verifyUrl: string; theme: CardThemeId }) {
  return (
    <FoilShell theme={theme}>
      <div className="relative flex h-full flex-col items-center p-[5cqw] text-center">
        <p className="text-[2.1cqw] font-bold uppercase tracking-[0.35em] text-[var(--card-accent)]">
          BCBHS Alumni
        </p>
        <div className="my-[2.5cqw] flex w-full items-center gap-[2cqw]">
          <div className="gold-rule flex-1" />
          <span className="text-[2.6cqw] text-[var(--card-accent)]">✦</span>
          <div className="gold-rule flex-1" />
        </div>

        {/* QR */}
        <div className="foil-frame rounded-2xl p-[2px]">
          <div className="rounded-[14px] bg-white p-[3cqw]">
            <QRCodeSVG value={verifyUrl} size={160} level="M" className="h-[36cqw] w-[36cqw]" />
          </div>
        </div>
        <p className="mt-[2cqw] text-[2.2cqw] font-bold uppercase tracking-[0.3em] text-[var(--card-accent)]">
          Scan to verify
        </p>
        <p className="mt-[1cqw] font-mono text-[2.2cqw] text-[var(--card-muted)]">
          {verifyUrl.replace(/^https?:\/\//, "")}
        </p>

        {/* handwritten signature */}
        <div className="mt-[3cqw] w-full">
          <p className="font-signature -rotate-2 text-[8cqw] leading-none text-[var(--sig-ink)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {member.name}
          </p>
          <div className="gold-rule mx-auto mt-[1cqw] w-4/5" />
          <p className="mt-[1cqw] text-[1.8cqw] uppercase tracking-[0.35em] text-[var(--card-muted)]">
            Signature
          </p>
        </div>

        <div className="flex-1" />

        <ul className="space-y-[1.2cqw] text-[2.2cqw] leading-relaxed text-[var(--card-ink)] opacity-80">
          <li>✦ Reunions, events & batch programs</li>
          <li>✦ Mentorship, referrals & career network</li>
        </ul>
        <p className="mt-[2.5cqw] text-[2cqw] leading-relaxed text-[var(--card-muted)]">
          Property of the BCBHS Alumni Association. If found, please contact{" "}
          <span className="text-[var(--card-accent)]">{SITE_EMAIL}</span>
        </p>
      </div>
    </FoilShell>
  );
}

export default function IdCard({
  member,
  verifyUrl,
  theme = "midnight",
}: {
  member: UserProfile;
  verifyUrl: string;
  theme?: CardThemeId;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-[320px]">
      <div className="print:hidden [perspective:1400px]">
        <div
          className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="[backface-visibility:hidden]">
            <CardFront member={member} theme={theme} />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CardBack member={member} verifyUrl={verifyUrl} theme={theme} />
          </div>
        </div>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-gold/40 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
        >
          ⇄ Show {flipped ? "front" : "back"}
        </button>
      </div>

      <div className="hidden print:flex print:flex-col print:items-center print:gap-4">
        <div className="print:h-[85.6mm] print:w-[53.98mm]">
          <CardFront member={member} theme={theme} />
        </div>
        <div className="print:h-[85.6mm] print:w-[53.98mm]">
          <CardBack member={member} verifyUrl={verifyUrl} theme={theme} />
        </div>
      </div>
    </div>
  );
}
