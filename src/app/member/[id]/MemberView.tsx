"use client";

import { use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import IdCardView, { LockedBack } from "@/components/IdCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuthModal } from "@/components/AuthModal";
import { useMember } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { ROLE_META } from "@/lib/types";

/** Public alumni profile, consumes the route-params promise via `use()`. */
export default function MemberView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = useMember(decodeURIComponent(id));
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const isOwn = !!user && !!member && user.id === member.id;
  /* The official ID card belongs to its owner alone (owner's rule,
     2026-10-23): only the member themselves may view their card, so
     nobody else can copy or misuse it. Everyone else, guests,
     pending accounts and even other approved members, gets the
     locked face instead. */
  const canViewCard = isOwn && user?.status === "approved";
  /* WhatsApp contact follows its own rule: approved members may
     contact each other; it is NOT tied to card ownership. */
  const canContact = user?.status === "approved";

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${member?.memberId ?? id}`
      : `/verify/${id}`;

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero eyebrow="Member profile" title={<>BCBHS <span className="text-gold-gradient">Alumnus</span></>} />
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          {member === undefined ? (
            <p className="text-center text-muted">Loading…</p>
          ) : member === null ? (
            <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-14 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Member not found</p>
              <p className="mt-2 text-sm text-muted">This profile may not exist or is not yet approved.</p>
              <Link href="/directory" className="mt-6 inline-block rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10">
                Back to Directory
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-5">
              <Reveal className="lg:col-span-3 rounded-3xl border border-ivory/10 bg-ink-2 p-8 sm:p-10">
                {/* Identity stack (owner's spec, 2026-10-23, same on
                    desktop and mobile): big avatar on top, then in
                    order the name, the Batch line, the member ID in
                    gold, and the position/role as a highlighted gold
                    pill with a soft glow, all in one centered column. */}
                <div className="flex flex-col items-center gap-5 text-center">
                  <Avatar name={member.name} photoURL={member.photoURL} size="lg" />
                  <div>
                    <h2 className="font-display text-3xl font-extrabold text-ivory">{member.name}</h2>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold sm:text-xs sm:tracking-[0.25em]">
                      Batch of {member.batch}
                    </p>
                    {member.memberId && (
                      <p className="mt-1.5 text-[13px] font-semibold tracking-[0.14em] text-gold-2">{member.memberId}</p>
                    )}
                    <p className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-2 shadow-[0_0_16px_rgba(212,169,78,0.25)]">
                        ★ {member.position ?? ROLE_META[member.role].label}
                      </span>
                    </p>
                  </div>
                </div>
                {/* Centered ornament divider */}
                <div className="mx-auto my-8 flex max-w-[210px] items-center gap-3" aria-hidden="true">
                  <span className="gold-rule flex-1" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                  <span className="gold-rule flex-1" />
                </div>
                {/* Details as a hairline stat panel: four cells,
                    label over value, everything centered. */}
                <div className="overflow-hidden rounded-2xl border border-ivory/10">
                  <dl className="grid grid-cols-2 gap-px bg-ivory/10">
                    {[
                      ["Location", member.isAbroad ? `${member.country ?? "Abroad"} 🌍` : member.district],
                      ["Profession", member.profession ?? "-"],
                      ["Organization", member.company ?? "-"],
                      ["Blood group", member.isDonor ? `${member.bloodGroup ?? "-"} · donor 🩸` : (member.bloodGroup ?? "-")],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-ink px-3 py-4 text-center">
                        <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">{k}</dt>
                        <dd className="mt-1.5 text-[15px] font-medium leading-snug text-ivory/90">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {/* Actions as one aligned button grid (owner's fix,
                    2026-10-23): phones stack Chat and Back full-width
                    with Edit/Verify sharing a row; desktop gets a tidy
                    2x2 of equal buttons. Every label sits on ONE line
                    at one shared height. */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {member.whatsapp && canContact && (
                    <div className="col-span-2 sm:col-span-1 [&>a]:flex [&>a]:h-11 [&>a]:w-full [&>a]:justify-center [&>a]:whitespace-nowrap [&>a]:px-4 [&>a]:text-[11px] [&>a]:tracking-[0.14em] sm:[&>a]:text-xs sm:[&>a]:tracking-widest">
                      <WhatsAppButton whatsapp={member.whatsapp} labeled />
                    </div>
                  )}
                  <Link
                    href="/directory"
                    className="col-span-2 flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-gold/40 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-2 hover:bg-gold/10 sm:col-span-1 sm:text-xs sm:tracking-widest"
                  >
                    Back to Directory
                  </Link>
                  {isOwn && (
                    <Link
                      href="/profile/edit"
                      className="flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-ivory/15 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted hover:text-ivory sm:px-4 sm:text-xs sm:tracking-widest"
                    >
                      Edit profile
                    </Link>
                  )}
                  {member.memberId && (
                    <Link
                      href={`/verify/${member.memberId}`}
                      className="flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-ivory/15 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted hover:text-ivory sm:px-4 sm:text-xs sm:tracking-widest"
                    >
                      Verify membership
                    </Link>
                  )}
                </div>
              </Reveal>
              <Reveal delay={0.1} className="flex flex-col items-center lg:col-span-2 lg:items-start">
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.25em] text-gold lg:text-left">Official ID card</p>
                {loading ? (
                  <div className="aspect-[53.98/85.6] w-full max-w-[340px] animate-pulse rounded-[18px] bg-ivory/[0.06]" />
                ) : canViewCard ? (
                  <IdCardView member={member} verifyUrl={verifyUrl} />
                ) : (
                  <div className="w-full max-w-[340px]">
                    <LockedBack />
                    <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                      {isOwn
                        ? "Your official ID card appears here once your registration is approved."
                        : "Only the card owner can view their official ID card, so it stays protected from misuse."}
                    </p>
                    {!user && (
                      <button
                        onClick={() => openAuthModal("login")}
                        className="mx-auto mt-4 block rounded-full border border-gold/40 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                      >
                        Log In to View
                      </button>
                    )}
                  </div>
                )}
              </Reveal>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
