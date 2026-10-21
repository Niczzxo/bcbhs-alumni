"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PUBLIC_NAV_LINKS, MEMBER_NAV_LINKS, MEMBER_MORE_LINKS, MEMBER_PROFILE_LINK } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";

/** Sticky top navigation — transparent over the hero, solid navy after scroll. */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const { scrollY } = useScroll();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 40)), [scrollY]);

  /* Close menus whenever the route changes. */
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  /* Close the More dropdown on outside click. */
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const dashboardHref = isSuperAdmin ? "/super-admin" : isAdmin ? "/admin" : "/id-card";

  /** Verified (approved) members get the members menu; everyone else the public menu. */
  const isVerifiedMember =
    user != null && (user.status === "approved" || isAdmin || isSuperAdmin);
  const navLinks = isVerifiedMember ? MEMBER_NAV_LINKS : PUBLIC_NAV_LINKS;

  /** On the home page, clicking the logo smooth-scrolls back to the top. */
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <Link href="/" onClick={handleLogoClick} className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="seal-ring relative block h-10 w-10 shrink-0 overflow-hidden rounded-full transition-transform duration-500 group-hover:rotate-[15deg] sm:h-12 sm:w-12">
            <Image
              src="/images/logo.jpg"
              alt="BCBHS Alumni logo"
              fill
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-base font-bold tracking-wide text-ivory sm:text-lg">
              BCBHS <span className="text-gold-gradient">Alumni</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.28em] text-muted min-[400px]:block">
              Est. 2023 · Bogura
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={`group relative text-sm font-medium tracking-wide transition-colors hover:text-gold-2 ${
                  pathname === link.href ? "text-gold-2" : "text-ivory/80"
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
          {isVerifiedMember && (
            <li
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors hover:text-gold-2 ${
                  moreOpen ? "text-gold-2" : "text-ivory/80"
                }`}
              >
                More
                <span className={`text-[10px] transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              <div
                className={`absolute right-0 top-full pt-3 transition-all duration-200 ${
                  moreOpen ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                <ul className="w-48 overflow-hidden rounded-2xl border border-gold/25 bg-ink-2/95 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                  {MEMBER_MORE_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className={`block px-5 py-2.5 text-sm tracking-wide transition-colors hover:bg-gold/10 hover:text-gold-2 ${
                          pathname === link.href ? "text-gold-2" : "text-ivory/80"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )}
          {isVerifiedMember && (
            <li>
              <Link
                href={MEMBER_PROFILE_LINK.href}
                className={`group relative text-sm font-medium tracking-wide transition-colors hover:text-gold-2 ${
                  pathname === MEMBER_PROFILE_LINK.href ? "text-gold-2" : "text-ivory/80"
                }`}
              >
                {MEMBER_PROFILE_LINK.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          )}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Staff-only: the dashboard button appears solely for
                  members a super admin has given an admin/editor role. */}
              {isAdmin && (
                <Link
                  href={dashboardHref}
                  className="hidden rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-wider text-gold-2 transition-colors hover:bg-gold/10 sm:block"
                >
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </Link>
              )}
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
                className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink shadow-[0_0_24px_rgba(212,169,78,0.35)] transition-transform duration-300 hover:scale-105 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                Register
              </button>
            </>
          )}
          {/* mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-gold/30 text-gold-2 lg:hidden"
          >
            <span
              className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${menuOpen ? "translate-y-[4px] rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-[4px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* mobile menu panel */}
      <motion.div
        initial={false}
        animate={{ height: menuOpen ? "auto" : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden border-gold/20 bg-ink/95 backdrop-blur-xl lg:hidden"
        style={{ borderBottomWidth: menuOpen ? 1 : 0 }}
      >
        <ul className="space-y-1 px-6 py-4">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-colors ${
                  pathname === link.href
                    ? "bg-gold/10 text-gold-2"
                    : "text-ivory/80 hover:bg-ivory/5 hover:text-gold-2"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isVerifiedMember &&
            MEMBER_MORE_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 pl-8 text-sm font-medium tracking-wide transition-colors ${
                    pathname === link.href
                      ? "bg-gold/10 text-gold-2"
                      : "text-ivory/60 hover:bg-ivory/5 hover:text-gold-2"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          {isVerifiedMember && (
            <li>
              <Link
                href={MEMBER_PROFILE_LINK.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-colors ${
                  pathname === MEMBER_PROFILE_LINK.href
                    ? "bg-gold/10 text-gold-2"
                    : "text-ivory/80 hover:bg-ivory/5 hover:text-gold-2"
                }`}
              >
                {MEMBER_PROFILE_LINK.label}
              </Link>
            </li>
          )}
          {user && isAdmin && (
            <li>
              <Link
                href={dashboardHref}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-gold-2"
              >
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </Link>
            </li>
          )}
        </ul>
      </motion.div>
    </motion.header>
  );
}
