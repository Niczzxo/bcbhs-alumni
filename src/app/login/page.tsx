"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import LoginForm from "@/components/auth/LoginForm";

/** Email/password login page — also available as a popup via the navbar. */
export default function LoginPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Welcome back"
          title={<>Log in to <span className="text-gold-gradient">your alumni</span> home</>}
        />
        <div className="mx-auto max-w-md px-5 py-14 sm:px-8">
          <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-8">
            <LoginForm onSuccess={() => router.push("/")} />
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
