"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { UserProfile } from "@/lib/types";
import { Avatar } from "./MemberCard";

/**
 * Official digital alumni ID card — navy & gold, logo seal, member
 * details, and a QR code encoding the public verification URL.
 * Give the wrapper `id="id-card-print"` for print-only output.
 */
export default function IdCard({ member, verifyUrl }: { member: UserProfile; verifyUrl: string }) {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-ink-2 via-[#0d1430] to-ink shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      {/* sunburst watermark */}
      <div className="sunburst pointer-events-none absolute inset-0 opacity-80" />
      {/* gold top ribbon */}
      <div className="h-1.5 bg-gradient-to-r from-gold-deep via-gold-2 to-gold-deep" />

      <div className="relative p-7">
        {/* header */}
        <div className="flex items-center gap-4">
          <span className="seal-ring relative block h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
              Bogura Cantonment Board High School
            </p>
            <p className="font-display text-2xl font-extrabold text-ivory">
              Alumni <span className="text-gold-gradient">ID Card</span>
            </p>
          </div>
        </div>

        <div className="gold-rule my-5" />

        {/* body */}
        <div className="flex items-start gap-5">
          <div className="shrink-0 overflow-hidden rounded-2xl border border-gold/30">
            {member.photoURL ? (
              <Image src={member.photoURL} alt={member.name} width={104} height={128} className="h-32 w-26 object-cover" />
            ) : (
              <Avatar name={member.name} size="md" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-xl font-bold text-ivory">{member.name}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 uppercase tracking-wider text-muted text-[11px] pt-0.5">Batch</dt>
                <dd className="font-semibold text-gold-2">{member.batch}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 uppercase tracking-wider text-muted text-[11px] pt-0.5">Member ID</dt>
                <dd className="font-mono font-semibold text-ivory">{member.memberId ?? "—"}</dd>
              </div>
              {member.profession && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 uppercase tracking-wider text-muted text-[11px] pt-0.5">Works as</dt>
                  <dd className="truncate text-ivory/90">{member.profession}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* footer: QR + verified */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-ivory/10 bg-ink/60 p-4">
          <div className="rounded-xl bg-white p-2">
            <QRCodeSVG value={verifyUrl} size={84} level="M" />
          </div>
          <div className="text-right">
            <p className="inline-block rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-2">
              ✓ Verified
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Scan to verify
              <br />
              alumni membership
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
