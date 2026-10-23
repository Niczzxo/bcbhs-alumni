"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";

/**
 * "My profile" landing: /profile never existed as a page, so the
 * navbar dropdown's Profile link 404'd (owner's report, 2026-10-23).
 * This route sends a signed-in member to their own member page and
 * everyone else to login.
 */
export default function MyProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(`/member/${user.id}`);
    else router.replace("/login?next=/profile");
  }, [loading, user, router]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm text-muted">Loading your profile…</p>
      </main>
      <Footer />
    </>
  );
}
