"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { POSITIONS } from "@/lib/types";

/** How many picked members a logged-out guest may preview. */
const GUEST_PREVIEW_COUNT = 6;

/**
 * The Alumni Directory lists POSITION HOLDERS only (owner's rule,
 * 2026-10-23): alumni who hold an official position in the association.
 * Plain members are NOT listed here; the full member list lives on
 * /members and is visible to approved members only. Guests see the
 * admin-picked (guestVisible) position holders as a preview.
 */
export default function DirectoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const approvedMembers = useDirectory();
  const isGuest = !user;
  const [guestMembers, setGuestMembers] = useState<UserProfile[] | null>(null);

  /* Guests: show only the admin-picked preview members.
     Live mode fetches them from Firestore; demo mode filters the local list. */
  useEffect(() => {
    /* Signed-in visitors never read this state (the members memo below
       only uses it for guests), so there is nothing to reset here. */
    if (!isGuest || !isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        /* Both rule-checked fields must be constrained, Firestore
           denies a query whose results it cannot prove readable. */
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("guestVisible", "==", true),
            where("status", "==", "approved"),
            limit(GUEST_PREVIEW_COUNT * 2),
          )
        );
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, "id">) }))
          .filter((m) => m.status === "approved" && m.guestVisible)
          .slice(0, GUEST_PREVIEW_COUNT);
        if (!cancelled) setGuestMembers(list);
      } catch {
        if (!cancelled) setGuestMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  const members = useMemo(() => {
    if (!isGuest) return approvedMembers;
    if (isFirebaseConfigured) return guestMembers ?? [];
    return approvedMembers.filter((m) => m.guestVisible).slice(0, GUEST_PREVIEW_COUNT);
  }, [isGuest, approvedMembers, guestMembers]);

  /* Position holders only: an official position assigned by the super
     admin is what puts an alumnus in this directory. Holders are
     ordered by position rank (owner's rule, 2026-10-23): President
     first, then Vice President, General Secretary and so on down the
     POSITIONS list; same-position holders are ordered by name. */
  const holders = useMemo(() => {
    const rank = (p?: string) => {
      const i = POSITIONS.indexOf(p ?? "");
      return i === -1 ? POSITIONS.length : i;
    };
    return members
      .filter((m) => !!m.position && m.position.trim() !== "")
      .sort((a, b) => rank(a.position) - rank(b.position) || a.name.localeCompare(b.name));
  }, [members]);

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Find your people"
          title={<>Alumni <span className="text-gold-gradient">Directory</span></>}
          subtitle={
            isGuest
              ? "The alumni who hold official positions in the association. Log in as a member to browse every registered alumnus."
              : `${holders.length} alumni hold official positions in the association. Every registered member is on the Members page.`
          }
        />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          {/* No filters here by the owner's rule (2026-10-23): this page
              is a simple showcase of position holders; searching and
              filtering live on the members-only /members page. */}
          {holders.length === 0 ? (
            <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-14 text-center">
              <p className="font-display text-xl font-bold text-ivory">No position holders yet</p>
              <p className="mt-2 text-sm text-muted">
                Alumni appear here once the super admin assigns them an official position.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {holders.map((m, i) => <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />)}
            </div>
          )}
          {isGuest && (
            <Reveal className="mt-12 text-center">
              <button
                onClick={() => router.push("/login?next=/members")}
                className="rounded-full border border-gold/40 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 transition-all duration-300 hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_30px_rgba(212,169,78,0.25)]"
              >
                Browse all members
              </button>
              <p className="mt-4 text-xs text-muted">
                The full member list is visible to logged-in members only.
              </p>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
