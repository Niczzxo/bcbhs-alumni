"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { UserProfile } from "@/lib/types";
import { SITE_EMAIL } from "@/lib/site";

/**
 * Official BCBHS Alumni ID card — portrait CR80 (53.98 × 85.6 mm).
 *
 * FRONT ("Noir Centered"): deep navy + gold, everything centered —
 * logo seal + association name on top, small gold-framed member photo,
 * serif member name, admin-assigned position badge, and a glass details
 * register: Member ID, Passing Year, Blood Group, Department,
 * Date of Birth, Contact, Email, Profession.
 * BACK ("Scan Me"): same navy sunburst background — outlined gold
 * "SCAN ME" pill, large QR on a white plate, member signature below
 * the QR, association name + contact details.
 *
 * Fully scalable via cqw units. Click to flip; both sides print at
 * exact real-world size. Give the wrapper `id="id-card-print"` for print.
 */

const LIVE_SITE = "https://bcbhs-alumni-niczzxos-projects.vercel.app";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[340px] [container-type:inline-size]">
      <div className="relative aspect-[53.98/85.6] w-full overflow-hidden rounded-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
        {children}
      </div>
    </div>
  );
}

/* Shared card background — deep navy with center-emanating gold rays and a
 * thin gold horizon line, exactly like the approved reference. */
function CardBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(130%_115%_at_50%_50%,#1b2152_0%,#0a0e28_55%,#04071a_100%)]" />
      <div className="sunburst absolute inset-0 opacity-80" />
      <div className="absolute inset-x-0 top-[55%] h-px bg-gradient-to-r from-transparent via-[#d4a94e]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-white/10" />
    </>
  );
}

/** "1998-05-12" -> "12 May 1998" for the ID card. */
function formatDob(iso?: string): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || m < 1 || m > 12 || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

function CardFront({ member }: { member: UserProfile }) {
  return (
    <CardShell>
      <div className="relative h-full w-full">
        <CardBackground />

        {/* everything centered */}
        <div className="relative flex h-full flex-col items-center px-[6cqw] pb-[4cqw] pt-[5cqw] text-center">
          {/* logo — centered */}
          <span className="relative block h-[11cqw] w-[11cqw] overflow-hidden rounded-full ring-2 ring-[#d4a94e]">
            <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
          </span>
          {/* association name — centered */}
          <p className="font-display mt-[1.8cqw] text-[5.4cqw] font-extrabold tracking-[0.16em] text-white">
            BCBHS <span className="text-gold-gradient">ALUMNI</span>
          </p>
          <p className="mt-[0.6cqw] text-[1.9cqw] uppercase tracking-[0.32em] text-white/55">
            Official ID · Est. 2023
          </p>

          {/* member photo — small, gold framed */}
          <div className="foil-frame mt-[2.6cqw] rounded-xl p-[1.5cqw] shadow-[0_12px_36px_rgba(0,0,0,0.55)]">
            <div className="relative h-[24cqw] w-[20cqw] overflow-hidden rounded-[8px] border-2 border-[#0a0f24] bg-[#0a0f24]">
              {member.photoURL ? (
                <Image src={member.photoURL} alt={member.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-[12cqw] font-extrabold text-[#d4a94e]/30">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* member name */}
          <h2 className="font-display mt-[2cqw] text-[7.4cqw] font-bold leading-none text-white">
            {member.name}
          </h2>

          {/* official position — admin-assigned only */}
          {member.position && (
            <span className="mt-[1.6cqw] rounded-full bg-[#d4a94e] px-[4.5cqw] py-[1cqw] text-[2.3cqw] font-extrabold uppercase tracking-[0.24em] text-[#0a0f24]">
              ★ {member.position}
            </span>
          )}

          {/* details register */}
          <div className="mt-[2.8cqw] w-full rounded-2xl border border-white/12 bg-white/[0.05] p-[4cqw] backdrop-blur-md">
            <div className="grid grid-cols-2 gap-x-[4cqw] gap-y-[2.2cqw]">
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Member ID</p>
                <p className="mt-[0.5cqw] font-mono text-[2.6cqw] font-bold tracking-wide text-white">
                  {member.memberId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Passing Year</p>
                <p className="mt-[0.5cqw] text-[2.6cqw] font-bold text-white">{member.batch}</p>
              </div>
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Blood Group</p>
                <p className="mt-[0.5cqw] text-[2.6cqw] font-bold text-white">{member.bloodGroup ?? "—"}</p>
              </div>
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Department</p>
                <p className="mt-[0.5cqw] text-[2.6cqw] font-bold text-white">{member.department ?? "—"}</p>
              </div>
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Date of Birth</p>
                <p className="mt-[0.5cqw] text-[2.6cqw] font-bold text-white">{formatDob(member.dob)}</p>
              </div>
              <div>
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Contact</p>
                <p className="mt-[0.5cqw] font-mono text-[2.6cqw] font-bold text-white">
                  {member.whatsapp ?? "—"}
                </p>
              </div>
              <div className="col-span-2 border-t border-white/10 pt-[2cqw]">
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Email</p>
                <p className="mt-[0.5cqw] truncate text-[2.4cqw] font-semibold text-white/90">
                  {member.email}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[1.8cqw] uppercase tracking-[0.24em] text-white/45">Profession</p>
                <p className="mt-[0.5cqw] truncate text-[2.6cqw] font-semibold text-[#f0cd7e]">
                  {member.profession ?? "—"}{member.company ? ` · ${member.company}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1" />
          <p className="mt-[1.5cqw] text-[2.1cqw] font-bold uppercase tracking-[0.3em] text-[#f0cd7e]/80">
            ✓ Verified Member
          </p>
        </div>
      </div>
    </CardShell>
  );
}




function CardBack({ member, verifyUrl }: { member: UserProfile; verifyUrl: string }) {
  return (
    <CardShell>
      <div className="relative flex h-full w-full flex-col items-center px-[8cqw] pb-[5cqw] pt-[8cqw] text-center">
        <CardBackground />
        {/* hairline gold frame */}
        <div className="pointer-events-none absolute inset-[8px] rounded-[12px] border border-[#d4a94e]/40" />

        {/* SCAN ME pill */}
        <div className="relative rounded-full border-[2.5px] border-[#d4a94e] px-[9cqw] py-[1.4cqw]">
          <p className="text-[5.2cqw] font-extrabold uppercase tracking-[0.22em] text-[#f0cd7e]">
            Scan Me
          </p>
        </div>

        {/* large QR on a white plate so it stays scannable on navy */}
        <div className="relative mt-[3.5cqw] rounded-2xl bg-white p-[2cqw] shadow-[0_10px_36px_rgba(0,0,0,0.45)] ring-2 ring-[#d4a94e]">
          <QRCodeSVG value={verifyUrl} size={220} level="M" className="h-[42cqw] w-[42cqw]" />
        </div>

        {/* member signature right below the QR — centered */}
        <div className="relative mt-[3cqw] w-full rounded-xl border border-white/15 bg-white/[0.06] px-[4cqw] py-[1.8cqw]">
          <p className="font-signature -rotate-2 text-center text-[6.4cqw] leading-none text-white">
            {member.name}
          </p>
        </div>
        <p className="relative mt-[1cqw] text-[1.7cqw] uppercase tracking-[0.3em] text-[#d4a94e]/80">
          Authorized signature
        </p>

        {/* association + contact */}
        <p className="relative mt-[3cqw] text-[4.2cqw] font-extrabold uppercase tracking-[0.08em] text-white">
          BCBHS Alumni Association
        </p>

        <div className="relative mt-[2cqw] space-y-[1.2cqw] text-[2.8cqw] font-medium leading-snug text-white/65">
          <p>Bogura Cantonment, Bogura, Bangladesh</p>
          <p>
            Email: <span className="font-semibold text-[#f0cd7e]">{SITE_EMAIL}</span>
          </p>
          <p>
            Website:{" "}
            <span className="font-semibold text-[#f0cd7e]">
              {LIVE_SITE.replace(/^https?:\/\//, "")}
            </span>
          </p>
        </div>

        <div className="flex-1" />

        <div className="relative h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4a94e] to-transparent" />
        <p className="relative mt-[1.8cqw] text-[1.9cqw] uppercase tracking-[0.3em] text-white/45">
          Official identification · Lifetime
        </p>
      </div>
    </CardShell>
  );
}

export default function IdCard({
  member,
  verifyUrl,
}: {
  member: UserProfile;
  verifyUrl: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-[340px]">
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

      <div className="hidden print:flex print:flex-col print:items-center print:gap-4">
        <div className="print:h-[85.6mm] print:w-[53.98mm]">
          <CardFront member={member} />
        </div>
        <div className="print:h-[85.6mm] print:w-[53.98mm]">
          <CardBack member={member} verifyUrl={verifyUrl} />
        </div>
      </div>
    </div>
  );
}
