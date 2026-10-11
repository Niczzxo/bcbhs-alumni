"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { UserProfile } from "@/lib/types";
import { Avatar } from "./MemberCard";
import { SITE_EMAIL } from "@/lib/site";

/**
 * Luxury alumni ID card — CR80 standard (85.6 × 53.98 mm), front + back.
 * Gold-foil frame, guilloche security pattern, holographic strip and a
 * light sweep. Click to flip; both sides print at exact real-world size.
 * Give the wrapper `id="id-card-print"` for print output.
 */

/** Fine-line guilloche security pattern. */
function Guilloche() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]" aria-hidden="true">
      <defs>
        <pattern id="id-guilloche" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="17" cy="17" r="15" fill="none" stroke="#d4a94e" strokeWidth="0.5" />
          <circle cx="17" cy="17" r="9.5" fill="none" stroke="#d4a94e" strokeWidth="0.35" />
          <circle cx="17" cy="17" r="4" fill="none" stroke="#f0cd7e" strokeWidth="0.3" />
          <path d="M0 17 H34 M17 0 V34" stroke="#d4a94e" strokeWidth="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#id-guilloche)" />
    </svg>
  );
}

/** Foil frame shell shared by both faces. */
function FoilShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="foil-gold relative aspect-[85.6/53.98] w-full rounded-2xl p-[2px] shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(212,169,78,0.12)]">
      <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-[#060a1a]">
        {/* deep navy vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_20%_0%,rgba(38,52,110,0.55),transparent_55%),radial-gradient(120%_140%_at_90%_100%,rgba(20,28,64,0.6),transparent_50%)]" />
        <Guilloche />
        {/* travelling light sweep */}
        <div className="foil-shine pointer-events-none absolute inset-y-0 left-0 w-2/3" />
        {children}
      </div>
    </div>
  );
}

const cornerTick =
  "pointer-events-none absolute h-3 w-3 border-gold-2";

function PhotoFrame({ member }: { member: UserProfile }) {
  return (
    <div className="relative h-[86px] w-[68px] shrink-0">
      <div className="foil-gold absolute inset-0 rounded-lg" />
      <div className="absolute inset-[2px] overflow-hidden rounded-[6px] bg-ink">
        {member.photoURL ? (
          <Image src={member.photoURL} alt={member.name} width={68} height={86} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar name={member.name} size="sm" />
          </div>
        )}
      </div>
      <span className={`${cornerTick} -left-1 -top-1 border-l-2 border-t-2`} />
      <span className={`${cornerTick} -right-1 -top-1 border-r-2 border-t-2`} />
      <span className={`${cornerTick} -bottom-1 -left-1 border-b-2 border-l-2`} />
      <span className={`${cornerTick} -bottom-1 -right-1 border-b-2 border-r-2`} />
    </div>
  );
}

function CardFront({ member }: { member: UserProfile }) {
  return (
    <FoilShell>
      <div className="relative flex h-full flex-col px-4 py-3">
        {/* header */}
        <div className="flex items-center gap-3">
          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-gold-2/70 shadow-[0_0_18px_rgba(212,169,78,0.45)]">
            <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[7.5px] font-bold uppercase tracking-[0.28em] text-gold-2/90">
              Bogura Cantonment Board High School
            </p>
            <p className="font-display emboss-gold text-xl font-extrabold leading-none tracking-wide">
              <span className="text-gold-gradient">BCBHS ALUMNI</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <span className="holo-strip flex h-8 w-8 items-center justify-center rounded-full text-sm text-ink shadow">✦</span>
            <span className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.2em] text-gold-2">Official</span>
          </div>
        </div>

        {/* divider */}
        <div className="my-2 flex items-center gap-2">
          <div className="gold-rule flex-1" />
          <span className="text-[9px] text-gold-2">✦</span>
          <div className="gold-rule flex-1" />
        </div>

        {/* body */}
        <div className="flex flex-1 items-center gap-4">
          <PhotoFrame member={member} />
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-gold-2/80">Alumnus</p>
            <p className="font-display emboss-gold truncate text-[19px] font-bold leading-tight text-ivory">
              {member.name}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
              <div>
                <p className="text-[6.5px] uppercase tracking-[0.25em] text-muted">Batch</p>
                <p className="font-bold text-gold-2">{member.batch}</p>
              </div>
              <div>
                <p className="text-[6.5px] uppercase tracking-[0.25em] text-muted">Member ID</p>
                <p className="font-mono font-bold text-ivory">{member.memberId ?? "—"}</p>
              </div>
              {member.profession && (
                <div className="col-span-2">
                  <p className="text-[6.5px] uppercase tracking-[0.25em] text-muted">Profession</p>
                  <p className="truncate text-ivory/90">{member.profession}</p>
                </div>
              )}
            </div>
            {/* handwritten signature */}
            <div className="mt-1">
              <p className="font-signature -rotate-2 truncate text-[22px] leading-none text-[#f5dfa0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {member.name}
              </p>
              <div className="gold-rule mt-0.5 w-4/5" />
              <p className="mt-0.5 text-[6px] uppercase tracking-[0.3em] text-muted">Signature</p>
            </div>
          </div>
        </div>

        {/* holographic footer strip */}
        <div className="holo-strip mt-2 flex h-6 items-center justify-between rounded-md px-3">
          <span className="text-[8px] font-extrabold uppercase tracking-[0.3em] text-ink/90">
            ✓ Verified Member
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-ink/70">
            Lifetime validity
          </span>
        </div>
      </div>
    </FoilShell>
  );
}

function CardBack({ member, verifyUrl }: { member: UserProfile; verifyUrl: string }) {
  return (
    <FoilShell>
      <div className="relative flex h-full flex-col px-4 py-3">
        <div className="flex flex-1 items-center gap-4">
          <div className="shrink-0">
            <div className="foil-gold rounded-xl p-[2px]">
              <div className="rounded-[10px] bg-white p-2">
                <QRCodeSVG value={verifyUrl} size={86} level="M" />
              </div>
            </div>
            <p className="mt-1 text-center text-[7px] font-bold uppercase tracking-[0.25em] text-gold-2">
              Scan to verify
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-gold-2/90">Member privileges</p>
            <ul className="mt-1.5 space-y-1 text-[9px] leading-relaxed text-ivory/85">
              <li>✦ Access to reunions, events & batch programs</li>
              <li>✦ Mentorship, referrals & career network</li>
              <li>✦ Blood donor & welfare community</li>
            </ul>
            {member.isDonor && member.bloodGroup && (
              <p className="mt-2 inline-block rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-0.5 text-[9px] font-bold text-red-300">
                🩸 {member.bloodGroup} blood donor
              </p>
            )}
            {/* signature strip */}
            <div className="mt-2.5 rounded-md bg-ivory/95 px-3 py-1.5">
              <p className="font-display text-[11px] italic text-ink/80">BCBHS Alumni Association</p>
              <p className="text-[6px] uppercase tracking-[0.25em] text-ink/50">Authorized signature</p>
            </div>
          </div>
        </div>
        <p className="mt-1 text-[8px] leading-relaxed text-muted">
          This card is the property of the BCBHS Alumni Association. If found, please
          contact <span className="text-gold-2">{SITE_EMAIL}</span> · {verifyUrl.replace(/^https?:\/\//, "")}
        </p>
      </div>
    </FoilShell>
  );
}

export default function IdCard({ member, verifyUrl }: { member: UserProfile; verifyUrl: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-md">
      {/* Screen: 3D flip */}
      <div className="print:hidden [perspective:1400px]">
        <div
          className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="[backface-visibility:hidden]">
            <CardFront member={member} />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CardBack member={member} verifyUrl={verifyUrl} />
          </div>
        </div>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-gold/40 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
        >
          ⇄ Show {flipped ? "front" : "back"}
        </button>
      </div>

      {/* Print: both sides at exact CR80 size */}
      <div className="hidden print:flex print:flex-col print:items-center print:gap-4">
        <div className="print:h-[53.98mm] print:w-[85.6mm]">
          <CardFront member={member} />
        </div>
        <div className="print:h-[53.98mm] print:w-[85.6mm]">
          <CardBack member={member} verifyUrl={verifyUrl} />
        </div>
      </div>
    </div>
  );
}
