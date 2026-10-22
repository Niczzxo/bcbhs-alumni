"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import DottedQr from "./DottedQr";
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
 * BACK ("Association Crest" — the approved print design): flat deep
 * navy with a single-line gold frame, graduation cap + BCBHS wordmark,
 * the dotted QR (logo-palette dots, original logo badge at centre) on
 * a slim gold-rimmed white plate, SCAN ME pill, authorized signature
 * panel, contact rows, and the family motto.
 *
 * Fully scalable via cqw units. Click to flip; both sides print at
 * exact real-world size. Give the wrapper `id="id-card-print"` for print.
 */

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
        {/* hairline gold frame — same as the back side */}
        <div className="pointer-events-none absolute inset-[8px] rounded-[12px] border border-[#d4a94e]/40" />

        {/* everything centered — inside the gold frame */}
        <div className="absolute inset-[8px] flex flex-col items-center overflow-hidden rounded-[12px] px-[4.5cqw] pb-[4cqw] pt-[4.5cqw] text-center">
          {/* logo — centered */}
          <span className="relative block h-[12cqw] w-[12cqw] overflow-hidden rounded-full ring-2 ring-[#d4a94e]">
            <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
          </span>
          {/* association name — centered */}
          <p className="font-display mt-[2cqw] text-[5.4cqw] font-extrabold tracking-[0.16em] text-white">
            BCBHS <span className="text-gold-gradient">ALUMNI</span>
          </p>
          <p className="mt-[0.8cqw] text-[1.9cqw] uppercase tracking-[0.32em] text-white/55">
            Official ID · Est. 2023
          </p>

          {/* member photo — small, gold framed */}
          <div className="foil-frame mt-[3cqw] rounded-xl p-[1.5cqw] shadow-[0_12px_36px_rgba(0,0,0,0.55)]">
            <div className="relative h-[30cqw] w-[25cqw] overflow-hidden rounded-[8px] border-2 border-[#0a0f24] bg-[#0a0f24]">
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
          <h2 className="font-display mt-[2.4cqw] text-[7.4cqw] font-bold leading-none text-white">
            {member.name}
          </h2>

          {/* standing — big, right below the name: the member's official
              position when one is assigned, otherwise plain MEMBER, so the
              card always states what the holder is in the association */}
          <p className="font-display mt-[1.8cqw] text-[4.4cqw] font-extrabold uppercase leading-none tracking-[0.18em] text-[#f0cd7e]">
            {member.position?.trim() ? member.position : "Member"}
          </p>

          {/* details register */}
          <div className="mt-[3.4cqw] w-full rounded-2xl border border-white/12 bg-white/[0.05] p-[5cqw] backdrop-blur-md">
            <div className="grid grid-cols-2 gap-x-[4cqw] gap-y-[3cqw]">
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
                  {member.profession ?? "—"}
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

/* ================= BACK — "Association Crest" (approved design) ====== */

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[6.5cqw] w-[13.5cqw]" fill="none" aria-hidden>
      <polygon points="12,3.5 22.5,8.5 12,13.5 1.5,8.5" fill="#e3b155" />
      <path
        d="M5.8,11.2 L5.8,15.6 C5.8,17.2 8.6,18.4 12,18.4 C15.4,18.4 18.2,17.2 18.2,15.6 L18.2,11.2 L12,14.2 Z"
        fill="#cf9c3f"
      />
      <line x1="22.5" y1="8.5" x2="22.5" y2="14.5" stroke="#dfae54" strokeWidth="1.1" />
      <circle cx="22.5" cy="15.8" r="1.3" fill="#f2cf7e" />
    </svg>
  );
}

function StarDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[2.5cqw] ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a227]/80" />
      <svg viewBox="0 0 24 24" className="h-[2.6cqw] w-[2.6cqw] shrink-0" aria-hidden>
        <polygon
          points="12,1.8 14.9,8.6 22.2,9.3 16.7,14.2 18.4,21.4 12,17.6 5.6,21.4 7.3,14.2 1.8,9.3 9.1,8.6"
          fill="#d9a83f"
        />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a227]/80" />
    </div>
  );
}

const contactIconProps = {
  viewBox: "0 0 24 24",
  className: "h-[3.8cqw] w-[3.8cqw]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PinIcon() {
  return (
    <svg {...contactIconProps} aria-hidden>
      <path d="M12 21.2S5.4 15.6 5.4 10.3a6.6 6.6 0 1 1 13.2 0c0 5.3-6.6 10.9-6.6 10.9Z" />
      <circle cx="12" cy="10.2" r="2.4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...contactIconProps} aria-hidden>
      <rect x="3" y="5.2" width="18" height="13.6" rx="2" />
      <path d="M3.5 7 L12 13.2 L20.5 7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...contactIconProps} aria-hidden>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M3.2 12h17.6" />
      <path d="M12 3.2c2.4 2.4 3.6 5.4 3.6 8.8s-1.2 6.4-3.6 8.8c-2.4-2.4-3.6-5.4-3.6-8.8s1.2-6.4 3.6-8.8Z" />
    </svg>
  );
}

function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-[3cqw] border-t border-white/12 px-[1cqw] py-[0.95cqw]">
      <span className="shrink-0 text-[#e9c766]">{icon}</span>
      <span className="w-px self-stretch bg-white/15" />
      <p className="text-left text-[2.85cqw] font-medium text-white/90">{text}</p>
    </div>
  );
}

function CardBack({ verifyUrl }: { verifyUrl: string }) {
  return (
    <CardShell>
      <div className="relative h-full w-full">
        {/* flat deep navy + a soft glow behind the QR plate */}
        <div className="absolute inset-0 bg-[#07142f]" />
        <div className="absolute inset-0 bg-[radial-gradient(62%_46%_at_50%_44%,rgba(46,84,168,0.4)_0%,rgba(46,84,168,0)_70%)]" />
        {/* single-line gold frame — same as the front side */}
        <div className="pointer-events-none absolute inset-[8px] rounded-[12px] border border-[#d4a94e]/50" />

        <div className="absolute inset-[8px] flex flex-col items-center overflow-hidden rounded-[12px] px-[6cqw] pb-[3.2cqw] pt-[3.4cqw] text-center [&>*]:shrink-0">
          <CapIcon />
          <h3 className="font-display text-gold-gradient mt-[1cqw] text-[10cqw] font-black leading-none">
            BCBHS
          </h3>
          <p className="mt-[1.1cqw] text-[3.1cqw] font-semibold uppercase tracking-[0.42em] text-white">
            Alumni Association
          </p>
          <StarDivider className="mt-[1.5cqw] w-[60cqw]" />
          <p className="mt-[1.3cqw] text-[2.3cqw] uppercase tracking-[0.3em] text-white/85">
            Bogura Cantonment Board High School
          </p>

          {/* QR plate — slim gold rim around a white plate */}
          <div className="mt-[1.9cqw] w-[46cqw] rounded-[3.2cqw] bg-gradient-to-br from-[#f6d98a] via-[#d4a94e] to-[#8a6420] p-[0.7cqw] shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
            <div className="overflow-hidden rounded-[2.6cqw] bg-white">
              <DottedQr url={verifyUrl} />
            </div>
          </div>

          <div className="mt-[2.3cqw] rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-[8cqw] py-[1.6cqw]">
            <p className="text-[3.4cqw] font-extrabold uppercase tracking-[0.3em] text-[#0a1430]">
              Scan Me
            </p>
          </div>
          <p className="mt-[1.4cqw] text-[2.45cqw] uppercase tracking-[0.52em] text-white/90">
            Verify Membership
          </p>

          {/* authorized signature — the association's, same on every card */}
          <div className="mt-[2.3cqw] w-full rounded-[2.6cqw] border border-[#d4a94e]/45 bg-[#0d1d40]/70 px-[4cqw] pb-[1.6cqw] pt-[0.8cqw]">
            <p className="font-signature text-[7.2cqw] leading-tight text-white">Riyazul Islam</p>
            <div className="mx-auto mt-[0.4cqw] h-px w-[45%] bg-gradient-to-r from-transparent via-[#d4a94e] to-transparent" />
            <p className="mt-[1.1cqw] text-[2cqw] uppercase tracking-[0.42em] text-[#d4a94e]">
              Authorized Signature
            </p>
          </div>

          {/* contact rows */}
          <div className="mt-[2.1cqw] w-full">
            <ContactRow icon={<PinIcon />} text="Bogura Cantonment, Bogura, Bangladesh" />
            <ContactRow icon={<MailIcon />} text={SITE_EMAIL} />
            <ContactRow icon={<GlobeIcon />} text="bcbhsalumni.vercel.app" />
          </div>

          <div className="flex-1" />
          <StarDivider className="w-[44cqw]" />
          <p className="mt-[1.6cqw] text-[2.7cqw] font-semibold uppercase leading-[1.5] tracking-[0.34em] text-[#e9c766]">
            Once a BCBHSian
            <br />
            Always a Family
          </p>
        </div>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
    setMounted(true);
  }, []);

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
            <CardBack verifyUrl={verifyUrl} />
          </div>
        </div>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-gold/40 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
        >
          ⇄ Show {flipped ? "front" : "back"}
        </button>
      </div>

      {/* Print output: portalled to <body> so print CSS can hide the
       * whole app and print ONLY this — front + back stacked on a
       * single page at exact CR80 size, colours preserved. */}
      {mounted &&
        createPortal(
          <div className="print-portal hidden flex-col items-center gap-[6mm]">
            <div className="h-[85.6mm] w-[53.98mm]">
              <CardFront member={member} />
            </div>
            <div className="h-[85.6mm] w-[53.98mm]">
              <CardBack verifyUrl={verifyUrl} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
