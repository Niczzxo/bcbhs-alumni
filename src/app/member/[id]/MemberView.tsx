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

/** Public alumni profile, consumes the route-params promise via `use()`. */
export default function MemberView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = useMember(decodeURIComponent(id));
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const isOwn = !!user && !!member && user.id === member.id;
  /* The official ID card carries the member's full details (photo,
     contact, email, DOB), so it is rendered for approved members
     only. Guests and pending accounts get the locked face instead. */
  const canViewCard = user?.status === "approved";

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
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <Avatar name={member.name} photoURL={member.photoURL} size="lg" />
                  <div>
                    <h2 className="font-display text-3xl font-extrabold text-ivory">{member.name}</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-gold">
                      Batch of {member.batch} · {member.memberId}
                    </p>
                  </div>
                </div>
                <div className="gold-rule my-8" />
                <dl className="grid gap-5 sm:grid-cols-2">
                  {[
                    ["Location", member.isAbroad ? `${member.country ?? "Abroad"} 🌍` : member.district],
                    ["Profession", member.profession ?? "-"],
                    ["Organization", member.company ?? "-"],
                    ["Blood group", member.isDonor ? `${member.bloodGroup ?? "-"} · donor 🩸` : (member.bloodGroup ?? "-")],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted">{k}</dt>
                      <dd className="mt-1 text-ivory/90">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/directory" className="rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10">
                    Back to Directory
                  </Link>
                  {member.whatsapp && canViewCard && <WhatsAppButton whatsapp={member.whatsapp} labeled />}
                  {isOwn && (
                    <Link href="/profile/edit" className="rounded-full border border-ivory/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-ivory">
                      Edit profile
                    </Link>
                  )}
                  {member.memberId && (
                    <Link href={`/verify/${member.memberId}`} className="rounded-full border border-ivory/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-ivory">
                      Verify membership
                    </Link>
                  )}
                </div>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-2">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-gold">Official ID card</p>
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
                        : "The official ID card holds the member's full details, so it is visible to approved members only."}
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
