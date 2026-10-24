"use client";

import { use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useVerifiedMember } from "@/lib/data";

/** PUBLIC membership verification, consumes the route-params promise via `use()`. */
export default function VerifyView({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params);
  const member = useVerifiedMember(decodeURIComponent(memberId));

  const genuine = member !== null && member !== undefined && member.status === "approved" && !!member.memberId;

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero eyebrow="Membership verification" title={<>Verify <span className="text-gold-gradient">Alumnus</span></>} />
        <div className="mx-auto max-w-xl px-5 py-14 sm:px-8">
          {member === undefined ? (
            <p className="text-center text-muted">Checking…</p>
          ) : (
            <Reveal
              className={`rounded-3xl border p-10 text-center ${
                genuine ? "border-gold/40 bg-ink-2" : "border-red-400/40 bg-ink-2"
              }`}
            >
              <p
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                  genuine ? "bg-gold/15 text-gold-2" : "bg-red-500/15 text-red-300"
                }`}
              >
                {genuine ? "✓" : "✕"}
              </p>
              <h2 className={`font-display mt-6 text-3xl font-extrabold ${genuine ? "text-gold-gradient" : "text-red-300"}`}>
                {genuine ? "Verified Member" : "Not Verified"}
              </h2>
              {genuine && member ? (
                <>
                  <div className="mt-6 flex justify-center">
                    <Avatar name={member.name} photoURL={member.photoURL} size="md" />
                  </div>
                  <p className="font-display mt-4 text-xl font-bold text-ivory">{member.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gold">
                    Batch of {member.batch}
                  </p>
                  <p className="mt-3 font-mono text-sm text-muted">{member.memberId}</p>
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    This ID card was issued by the BCBHS Alumni Portal. This person is a verified
                    alumnus of Bogura Cantonment Board High School.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  No approved member found for ID <span className="font-mono text-ivory">{memberId}</span>.
                  This card may be forged or the membership may have been revoked.
                </p>
              )}
              <div className="gold-rule mx-auto my-8 w-40" />
              <div className="flex justify-center gap-4">
                <Link href="/directory" className="rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10">
                  Directory
                </Link>
                <Link href="/" className="rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-ivory">
                  Home
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
