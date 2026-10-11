"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { UserProfile } from "@/lib/types";
import { Avatar } from "./MemberCard";
import { SITE_EMAIL } from "@/lib/site";

/**
 * Official digital alumni ID card — CR80 standard (85.6 × 53.98 mm),
 * front + back. Click to flip between sides on screen; both sides
 * print at exact real-world size.
 * Give the wrapper `id="id-card-print"` for print output.
 */

const cardShell =
  "relative aspect-[85.6/53.98] w-full overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-ink-2 via-[#0d1430] to-ink shadow-[0_24px_70px_rgba(0,0,0,0.55)]";

function CardFront({ member }: { member: UserProfile }) {
  return (
    <div className={cardShell}>
      <div className="sunburst pointer-events-none absolute inset-0 opacity-80" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-deep via-gold-2 to-gold-deep" />
      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="seal-ring relative block h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[8px] font-bold uppercase tracking-[0.25em] text-gold">
              Bogura Cantonment Board High School
            </p>
            <p className="font-display text-lg font-extrabold leading-tight text-ivory">
              Alumni <span className="text-gold-gradient">ID Card</span>
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-gold/50 bg-gold/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-gold-2">
            ✓ Verified
          </span>
        </div>

        <div className="mt-3 flex flex-1 items-center gap-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-gold/30">
            {member.photoURL ? (
              <Image src={member.photoURL} alt={member.name} width={64} height={80} className="h-full w-full object-cover" />
            ) : (
              <Avatar name={member.name} size="sm" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-base font-bold text-ivory sm:text-lg">{member.name}</p>
            <dl className="mt-1.5 space-y-1 text-[11px]">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 uppercase tracking-wider text-muted text-[8px] pt-0.5">Batch</dt>
                <dd className="font-semibold text-gold-2">{member.batch}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 uppercase tracking-wider text-muted text-[8px] pt-0.5">Member ID</dt>
                <dd className="font-mono font-semibold text-ivory">{member.memberId ?? "—"}</dd>
              </div>
              {member.profession && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 uppercase tracking-wider text-muted text-[8px] pt-0.5">Works as</dt>
                  <dd className="truncate text-ivory/90">{member.profession}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardBack({ member, verifyUrl }: { member: UserProfile; verifyUrl: string }) {
  return (
    <div className={cardShell}>
      <div className="sunburst pointer-events-none absolute inset-0 opacity-60" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-deep via-gold-2 to-gold-deep" />
      <div className="relative flex h-full items-center gap-4 p-4 sm:p-5">
        <div className="shrink-0 rounded-xl bg-white p-2">
          <QRCodeSVG value={verifyUrl} size={92} level="M" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">Scan to verify</p>
          <p className="mt-1 truncate font-mono text-[10px] text-ivory/80">{verifyUrl.replace(/^https?:\/\//, "")}</p>
          {member.isDonor && member.bloodGroup && (
            <p className="mt-2 inline-block rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-300">
              🩸 {member.bloodGroup} donor
            </p>
          )}
          <p className="mt-2 text-[9px] leading-relaxed text-muted">
            This card is the property of the BCBHS Alumni Association. If found,
            please contact {SITE_EMAIL}.
          </p>
        </div>
      </div>
      <p className="absolute bottom-2 right-4 text-[8px] uppercase tracking-[0.3em] text-gold/60">
        Est. 2023 · Bogura
      </p>
    </div>
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
          <span className="inline-block transition-transform duration-500" style={{ transform: flipped ? "rotateY(180deg)" : undefined }}>⇄</span>
          Show {flipped ? "front" : "back"}
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
