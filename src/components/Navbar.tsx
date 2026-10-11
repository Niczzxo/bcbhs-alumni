"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";

/** Sticky top navigation — transparent over the hero, solid navy after scroll. */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 40)), [scrollY]);

  const dashboardHref = isSuperAdmin ? "/super-admin" : isAdmin ? "/admin" : "/id-card";

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-gold/20 bg-ink/90 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="seal-ring relative block h-12 w-12 overflow-hidden rounded-full transition-transform duration-500 group-hover:rotate-[15deg]">
            <Image
              src="/images/logo.jpg"
              alt="BCBHS Alumni logo"
              fill
              className="object-cover"
              priority
            />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold tracking-wide text-ivory">
              BCBHS <span className="text-gold-gradient">Alumni</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.28em] text-muted">
              Est. 2023 · Bogura
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="group relative text-sm font-medium tracking-wide text-ivory/80 transition-colors hover:text-gold-2"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-wider text-gold-2 transition-colors hover:bg-gold/10 sm:block"
              >
                {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "My ID Card"}
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-ivory"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("login")}
                className="hidden text-xs font-bold uppercase tracking-wider text-ivory/70 transition-colors hover:text-gold-2 sm:block"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-ink shadow-[0_0_24px_rgba(212,169,78,0.35)] transition-transform duration-300 hover:scale-105"
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
