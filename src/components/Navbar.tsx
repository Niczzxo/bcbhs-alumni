"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PUBLIC_NAV_LINKS, MEMBER_NAV_LINKS, MEMBER_MORE_LINKS, MEMBER_PROFILE_LINK } from "@/lib/site";
import { ROLE_META } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { Avatar } from "@/components/MemberCard";

/**
 * Sticky top navigation, transparent over the hero, solid navy after
 * scroll. Bar layout (owner's rules, 2026-10-23): the staff dashboard
 * button sits LAST in the bar where Logout used to be; Logout lives
 * at the very end of the mobile drawer. The mobile menu is a pro
 * slide-in drawer whose link list scrolls inside the drawer (the
 * page behind it never moves).
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { user, logout, isAdmin, isSuperAdmin, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 40)), [scrollY]);

  /* Close menus whenever the route changes. */
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  /* Close the profile dropdown on outside click / Escape. */
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  /* While the drawer is open, lock the page behind it (the drawer
     list scrolls on its own) and let Escape close it. */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  /* Every staff role lands on its OWN dashboard. */
  const dashboardHref = isSuperAdmin
    ? "/super-admin"
    : user?.role === "admin"
      ? "/admin"
      : user?.role === "editor"
        ? "/editor"
        : "/id-card";
  const dashboardLabel = isSuperAdmin ? "Super Admin" : user?.role === "editor" ? "Editor" : "Batch Rep";

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

  const drawerLinkCls = (href: string) =>
    `group relative flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium tracking-wide transition-colors ${
      pathname === href
        ? "bg-gold/10 text-gold-2"
        : "text-ivory/85 hover:bg-ivory/5 hover:text-gold-2"
    }`;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? /* Lighter blur on phones: a full-strength backdrop blur
                 over scrolling content is a classic mobile scroll-lag
                 source (owner's report, 2026-10-23). */
              "border-b border-gold/20 bg-ink/95 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md lg:backdrop-blur-xl"
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
            {/* No standalone Profile link here: Profile lives in the
                profile chip's dropdown only (owner's fix, 2026-10-23,
                it was showing twice). */}
          </ul>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {loading ? (
              /* Auth still resolving, hold the space so a reload never
               * flashes the logged-out buttons at a signed-in member. */
              <div className="h-9 w-10 sm:w-44" aria-hidden="true" />
            ) : user ? (
              <>
                {/* Profile chip (owner's pick, 2026-10-23): photo +
                    name + batch in the bar, like the big pro sites.
                    On phones only the photo shows and it opens the
                    drawer (which carries the full identity card); on
                    desktop the chip opens a dropdown with Profile,
                    ID Card, Dashboard and Logout at the end. The
                    dashboard button stays LAST in the bar. */}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  className="shrink-0 rounded-full ring-gold/40 transition-shadow hover:ring-2 lg:hidden"
                >
                  <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
                </button>
                <div className="relative hidden lg:block" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    className="flex items-center gap-3 rounded-full border border-ivory/10 bg-ink-2/70 py-1.5 pl-1.5 pr-4 transition-colors hover:border-gold/40"
                  >
                    <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
                    <span className="max-w-44 text-left leading-tight">
                      <span className="block truncate text-sm font-semibold text-ivory">{user.name}</span>
                      <span className="block text-[11px] text-muted">Batch {user.batch}</span>
                    </span>
                    <span className={`text-[10px] text-muted transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {profileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-gold/25 bg-ink-2/95 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3 border-b border-ivory/10 px-5 py-4">
                        <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ivory">{user.name}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                          <p className="mt-0.5 text-[11px] tracking-wide text-gold-2/90">
                            {ROLE_META[user.role].label} · Batch {user.batch}
                            {user.memberId ? ` · ${user.memberId}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/profile"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-ivory/85 transition-colors hover:bg-gold/10 hover:text-gold-2"
                        >
                          Profile <span className="text-muted/60">›</span>
                        </Link>
                        <Link
                          href="/id-card"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-ivory/85 transition-colors hover:bg-gold/10 hover:text-gold-2"
                        >
                          My ID Card <span className="text-muted/60">›</span>
                        </Link>
                        {/* About sits here instead of a second Dashboard
                            entry: the dashboard already has its own bar
                            button, last in the bar (owner's fix). */}
                        <Link
                          href="/about"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-ivory/85 transition-colors hover:bg-gold/10 hover:text-gold-2"
                        >
                          About <span className="text-muted/60">›</span>
                        </Link>
                      </div>
                      <div className="border-t border-ivory/10 p-2">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Link
                    href={dashboardHref}
                    className="rounded-full border border-gold/40 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-gold-2 transition-colors hover:bg-gold/10 sm:px-5 sm:text-xs"
                  >
                    {dashboardLabel}
                  </Link>
                )}
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
      </motion.header>

      {/* ---------------- Mobile drawer ---------------- */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 h-full w-full cursor-default bg-ink/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 flex h-full w-[330px] max-w-[88vw] flex-col border-l border-gold/25 bg-ink-2 shadow-[-24px_0_60px_rgba(0,0,0,0.55)]"
            >
              {/* drawer header */}
              <div className="flex items-center gap-3 border-b border-ivory/10 px-5 py-4">
                <span className="seal-ring relative block h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <Image src="/images/logo.jpg" alt="BCBHS Alumni logo" fill className="object-cover" />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="font-display truncate text-base font-bold text-ivory">
                    BCBHS <span className="text-gold-gradient">Alumni</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Est. 2023 · Bogura</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/15 text-lg text-muted transition-colors hover:border-gold/40 hover:text-gold-2"
                >
                  ✕
                </button>
              </div>

              {/* signed-in identity card */}
              {user && (
                <div className="border-b border-ivory/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ivory">{user.name}</p>
                      <p className="text-xs text-muted">
                        Batch {user.batch} · {ROLE_META[user.role].label}
                      </p>
                      {user.memberId && <p className="text-[11px] tracking-wide text-gold-2/80">{user.memberId}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* scrollable link list: the drawer scrolls, not the page */}
              <nav aria-label="Mobile" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } }}
                  className="space-y-0.5"
                >
                  {navLinks.map((link) => (
                    <motion.li
                      key={link.label}
                      variants={{ hidden: { opacity: 0, x: 26 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                    >
                      <Link href={link.href} onClick={() => setMenuOpen(false)} className={drawerLinkCls(link.href)}>
                        {link.label}
                        <span className="text-muted/60 transition-transform duration-300 group-hover:translate-x-0.5">›</span>
                      </Link>
                    </motion.li>
                  ))}
                  {isVerifiedMember && (
                    <>
                      <motion.li
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }}
                        className="px-4 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-muted"
                      >
                        More
                      </motion.li>
                      {MEMBER_MORE_LINKS.map((link) => (
                        <motion.li
                          key={link.label}
                          variants={{ hidden: { opacity: 0, x: 26 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                        >
                          <Link href={link.href} onClick={() => setMenuOpen(false)} className={drawerLinkCls(link.href)}>
                            {link.label}
                            <span className="text-muted/60">›</span>
                          </Link>
                        </motion.li>
                      ))}
                      <motion.li
                        variants={{ hidden: { opacity: 0, x: 26 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                      >
                        <Link
                          href={MEMBER_PROFILE_LINK.href}
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkCls(MEMBER_PROFILE_LINK.href)}
                        >
                          {MEMBER_PROFILE_LINK.label}
                          <span className="text-muted/60">›</span>
                        </Link>
                      </motion.li>
                    </>
                  )}
                  {user && isAdmin && (
                    <motion.li
                      variants={{ hidden: { opacity: 0, x: 26 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                      className="pt-3"
                    >
                      <Link
                        href={dashboardHref}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl border border-gold/35 bg-gold/10 px-4 py-3 text-[15px] font-bold tracking-wide text-gold-2"
                      >
                        {dashboardLabel} Dashboard
                        <span>›</span>
                      </Link>
                    </motion.li>
                  )}
                </motion.ul>
              </nav>

              {/* drawer footer: account actions, Logout LAST (owner's rule) */}
              <div className="shrink-0 border-t border-ivory/10 px-5 py-4">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full rounded-full border border-red-400/35 py-3 text-xs font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openAuthModal("login");
                      }}
                      className="flex-1 rounded-full border border-ivory/20 py-3 text-xs font-bold uppercase tracking-widest text-ivory transition-colors hover:border-gold/50 hover:text-gold-2"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openAuthModal("register");
                      }}
                      className="btn-shimmer flex-1 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-3 text-xs font-bold uppercase tracking-widest text-ink"
                    >
                      Register
                    </button>
                  </div>
                )}
                <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-muted/70">
                  Once a BCBHSian, always a family
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
