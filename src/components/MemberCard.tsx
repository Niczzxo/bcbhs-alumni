"use client";

import Link from "next/link";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import Reveal from "./Reveal";
import WhatsAppButton from "./WhatsAppButton";

/** Photo avatar, falls back to initials when a member has no photo. */
export function Avatar({
  name,
  size = "md",
  photoURL,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  photoURL?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const dims = size === "lg" ? "h-28 w-28 text-3xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-20 w-20 text-xl";
  if (photoURL) {
    return (
      /* `block` is load-bearing: without it the span stays inline, the
       * h/w classes are ignored and the photo renders at natural size
       * (the mobile navbar avatar bug, 2026-10-23: fine inside flex
       * parents, giant inside the plain mobile avatar button). */
      <span className={`seal-ring relative block ${dims} shrink-0 overflow-hidden rounded-full`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoURL} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`seal-ring flex ${dims} items-center justify-center rounded-full bg-gradient-to-br from-ink-3 to-ink font-display font-bold text-gold-2`}
    >
      {initials}
    </span>
  );
}

/** Alumni card for directory / search grids. */
export default function MemberCard({ member, delay = 0 }: { member: UserProfile; delay?: number }) {
  /* WhatsApp contact is members-only: signed-out visitors and pending
     accounts never see the button (it would hand out the number). */
  const { user } = useAuth();
  const canContact = user?.status === "approved";
  const href = `/member/${member.memberId ?? member.id}`;
  const showDonor = member.isDonor && member.bloodGroup;
  return (
    <Reveal delay={delay} className="h-full min-w-0">
      <div className="relative h-full">
        <Link
          href={href}
          className="card-lift-sm group flex h-full flex-col rounded-3xl border border-ivory/10 bg-ink-2 p-6 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_18px_50px_rgba(212,169,78,0.12)]"
        >
        <div className="flex items-center gap-4">
          <Avatar name={member.name} photoURL={member.photoURL} />
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-bold text-ivory group-hover:text-gold-2">
              {member.name}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Batch of {member.batch}</p>
            {/* Official position, shown wherever the member holds one:
                on the Directory every card is a position holder, so
                visitors can see who holds which position. */}
            {member.position && (
              <p className="mt-1.5">
                <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-2">
                  ★ {member.position}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 space-y-1.5 text-sm text-muted">
          <p className="truncate">
            📍 {member.isAbroad ? `${member.country ?? "Abroad"} 🌍` : member.district}
          </p>
          {/* always reserve the profession row so every card is the same height */}
          <p className="truncate" aria-hidden={!member.profession}>
            {member.profession ? (
              <>
                💼 {member.profession}
                {member.company ? ` · ${member.company}` : ""}
              </>
            ) : (
              <span className="invisible">placeholder</span>
            )}
          </p>
          {/* always reserve the donor-pill row so every card is the same height */}
          <p
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              showDonor
                ? "border-red-400/30 bg-red-500/10 text-red-300"
                : "invisible border-transparent"
            }`}
          >
            🩸 {showDonor ? `${member.bloodGroup} donor` : "donor"}
          </p>
        </div>
        </Link>
        {member.whatsapp && canContact && (
          <div className="absolute right-4 top-4">
            <WhatsAppButton whatsapp={member.whatsapp} />
          </div>
        )}
      </div>
    </Reveal>
  );
}
