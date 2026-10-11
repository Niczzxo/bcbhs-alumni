"use client";

import Link from "next/link";
import type { UserProfile } from "@/lib/types";
import Reveal from "./Reveal";
import WhatsAppButton from "./WhatsAppButton";

/** Photo avatar — falls back to initials when a member has no photo. */
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
      <span className={`seal-ring ${dims} shrink-0 overflow-hidden rounded-full`}>
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
  const href = `/member/${member.memberId ?? member.id}`;
  return (
    <Reveal delay={delay}>
      <div className="relative">
        <Link
          href={href}
          className="group block rounded-3xl border border-ivory/10 bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_18px_50px_rgba(212,169,78,0.12)]"
        >
        <div className="flex items-center gap-4">
          <Avatar name={member.name} photoURL={member.photoURL} />
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-bold text-ivory group-hover:text-gold-2">
              {member.name}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Batch of {member.batch}</p>
          </div>
        </div>
        <div className="mt-5 space-y-1.5 text-sm text-muted">
          <p className="truncate">
            📍 {member.isAbroad ? `${member.country ?? "Abroad"} 🌍` : member.district}
          </p>
          {member.profession && (
            <p className="truncate">
              💼 {member.profession}
              {member.company ? ` · ${member.company}` : ""}
            </p>
          )}
          {member.isDonor && member.bloodGroup && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              🩸 {member.bloodGroup} donor
            </p>
          )}
        </div>
        </Link>
        {member.whatsapp && (
          <div className="absolute right-4 top-4">
            <WhatsAppButton whatsapp={member.whatsapp} />
          </div>
        )}
      </div>
    </Reveal>
  );
}
