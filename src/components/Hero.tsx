"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth-context";

const PRIMARY_CTA =
  "btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-9 py-4 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_36px_rgba(212,169,78,0.45)] transition-transform duration-300 hover:scale-105";

/** Full-viewport hero, campus photo with parallax, seal-ring emblem, gold CTAs. */
export default function Hero() {
  const { openAuthModal } = useAuthModal();
  const { user, loading } = useAuth();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax: background drifts slower, headline lifts and fades.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  /* Scroll-linked parallax is DESKTOP ONLY (owner's screen recording,
   * 2026-10-23): on phones the giant text layer cannot keep up with
   * the scroll, it sticks, jumps and ghosts over the next section.
   * Below lg the hero is fully static and scrolls natively. */
  const [fx, setFx] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setFx(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <section ref={ref} id="top" className="relative flex min-h-svh items-center overflow-hidden">
      {/* Parallax campus backdrop (desktop only, see fx above). */}
      <motion.div style={fx ? { y: bgY } : undefined} className={`absolute inset-0 -bottom-24 ${fx ? "will-change-transform" : ""}`}>
        <Image
          src="/images/school.jpg"
          alt="Bogura Cantonment Board High School campus"
          fill
          className="object-cover"
          quality={90}
          priority
        />
      </motion.div>
      {/* Navy cinematic grade over the photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/40" />

      {/* Decorative logo sunburst, drifting */}
      <div className="sunburst animate-drift pointer-events-none absolute -right-40 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 lg:block" />

      <motion.div
        style={fx ? { y: contentY, opacity: contentOpacity } : undefined}
        className={`relative z-10 mx-auto w-full px-5 pb-24 pt-36 text-center sm:px-10 lg:px-[3vw] lg:text-left ${fx ? "will-change-transform" : ""}`}
      >
        {/* Seal emblem */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="seal-ring mx-auto mb-8 h-28 w-28 overflow-hidden rounded-full shadow-[0_0_60px_rgba(212,169,78,0.35)] sm:h-32 sm:w-32 lg:mx-0"
        >
          <Image src="/images/logo.jpg" alt="BCBHS Alumni emblem" width={128} height={128} className="object-cover" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-gold-2"
        >
          Bogura Cantonment Board High School
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-display mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] text-ivory sm:text-6xl lg:text-7xl lg:mx-0"
        >
          Once a <span className="text-gold-gradient">BCBHSian</span>,
          <br />
          Always a BCBHSian.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ivory/80 lg:mx-0"
        >
          The official home of every BCBHS graduate, reconnect with batchmates,
          find seniors across the globe, and carry the spirit of our school
          wherever life takes you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
        >
          {/* Members already joined, send them to their card/application, not registration.
              While auth is still resolving, hold an invisible placeholder so a reload
              never flashes "Join the Alumni" at a signed-in member. */}
          {loading ? (
            <span className={`${PRIMARY_CTA} invisible`} aria-hidden="true">
              Join the Alumni
            </span>
          ) : user?.status === "approved" ? (
            <Link href="/id-card" className={PRIMARY_CTA}>
              My ID Card
            </Link>
          ) : user?.status === "pending" ? (
            <Link href="/profile/edit" className={PRIMARY_CTA}>
              My Application
            </Link>
          ) : (
            <button onClick={() => openAuthModal("register")} className={PRIMARY_CTA}>
              Join the Alumni
            </button>
          )}
          <Link
            href="/directory"
            className="rounded-full border border-gold/50 px-9 py-4 text-sm font-bold uppercase tracking-widest text-gold-2 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold/10"
          >
            Explore Directory
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll cue, desktop only; on short mobile viewports it would overlap the CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 text-center sm:block"
      >
        <div className="animate-cue mx-auto flex h-12 w-7 items-start justify-center rounded-full border border-gold/50 p-1.5">
          <div className="h-2 w-2 rounded-full bg-gold" />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted">Scroll</p>
      </motion.div>
    </section>
  );
}
