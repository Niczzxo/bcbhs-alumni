"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHero from "./PageHero";

/**
 * Route guard, redirects to /login when signed out, shows an
 * "access denied" panel when the role requirement is unmet.
 */
export default function RequireRole({
  children,
  role,
  eyebrow,
  title,
}: {
  children: ReactNode;
  role: "admin" | "editor" | "super_admin";
  eyebrow: string;
  title: ReactNode;
}) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  /* Grace period before bouncing to /login: a restored session can
     resolve a beat after the first paint, and redirecting on the
     first null would strand a signed-in member on the login page
     (owner report, 2026-10-23). Only a user who is STILL signed out
     after the grace window is redirected. */
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    if (user || loading) return;
    const t = setTimeout(() => setGraceOver(true), 1200);
    return () => clearTimeout(t);
  }, [user, loading]);

  /* Each staff role has its OWN dashboard (owner's rule, 2026-10-23):
     super admins reach everything; admins and editors each reach
     only their own panel, never each other's. */
  const allowed =
    role === "super_admin"
      ? isSuperAdmin
      : isSuperAdmin || user?.role === role;

  const roleLabel =
    role === "super_admin" ? "the super admin" : role === "editor" ? "editors" : "batch representatives";

  useEffect(() => {
    if (graceOver && !user) router.replace("/login");
  }, [graceOver, user, router]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink">
        <PageHero eyebrow={eyebrow} title={title} banner />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !user ? (
            <p className="text-center text-muted">Redirecting to login…</p>
          ) : !allowed ? (
            <div className="mx-auto max-w-md rounded-3xl border border-red-400/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Access denied</p>
              <p className="mt-3 text-sm text-muted">
                This area is restricted to {roleLabel}.
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
