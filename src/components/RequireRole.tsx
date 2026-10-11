"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHero from "./PageHero";

/**
 * Route guard — redirects to /login when signed out, shows an
 * "access denied" panel when the role requirement is unmet.
 */
export default function RequireRole({
  children,
  role,
  eyebrow,
  title,
}: {
  children: ReactNode;
  role: "admin" | "super_admin";
  eyebrow: string;
  title: ReactNode;
}) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const allowed = role === "super_admin" ? isSuperAdmin : isAdmin;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink">
        <PageHero eyebrow={eyebrow} title={title} />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !user ? (
            <p className="text-center text-muted">Redirecting to login…</p>
          ) : !allowed ? (
            <div className="mx-auto max-w-md rounded-3xl border border-red-400/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Access denied</p>
              <p className="mt-3 text-sm text-muted">
                This area is restricted to {role === "super_admin" ? "the super admin" : "administrators"}.
                You are signed in as {user.name}.
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
