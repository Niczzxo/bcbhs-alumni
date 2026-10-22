"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/lib/auth-context";

/** Registration page, also available as a popup via the navbar. */
export default function RegisterPage() {
  const [doneName, setDoneName] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  /* A signed-in member has no business on the register form; send
     them home instead of letting them create a duplicate account. */
  useEffect(() => {
    if (!loading && user && !doneName) router.replace("/");
  }, [loading, user, doneName, router]);

  if (doneName) {
    return (
      <>
        <Navbar />
        <main className="bg-ink">
          <PageHero eyebrow="Registration received" title={<>Welcome aboard, <span className="text-gold-gradient">{doneName}</span>!</>} />
          <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
            <Reveal className="rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">✓</p>
              <h2 className="font-display mt-6 text-2xl font-bold text-ivory">Awaiting admin approval</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Your profile has been submitted as <span className="text-gold-2">pending</span>. An
                administrator will verify your BCBHS credentials, once approved, your official
                digital ID card with QR verification will be generated automatically.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link href="/directory" className="rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10">
                  Browse Directory
                </Link>
                <Link href="/" className="rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-ivory">
                  Home
                </Link>
              </div>
            </Reveal>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Join the community"
          title={<>Become a <span className="text-gold-gradient">BCBHSian</span> for life</>}
          subtitle="Fill in your details below. Every registration is verified by an admin before approval, no fake members, ever."
        />
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8 sm:p-10">
            <RegisterForm onSuccess={(first) => setDoneName(first)} />
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
