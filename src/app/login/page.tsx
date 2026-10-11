"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import LoginForm from "@/components/auth/LoginForm";

/** Login form honoring an optional ?next= redirect (e.g. /login?next=/gallery). */
function LoginBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
      <LoginForm onSuccess={() => router.push(next || "/")} />
    </Reveal>
  );
}

/** Email/password login page — also available as a popup via the navbar. */
export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Welcome back"
          title={<>Log in to <span className="text-gold-gradient">your alumni</span> home</>}
        />
        <div className="mx-auto max-w-md px-5 py-14 sm:px-8">
          <Suspense>
            <LoginBox />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
