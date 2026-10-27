"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import type { PortalEvent } from "@/lib/types";

/**
 * One event card: PICTURES ONLY (owner's rule, 2026-10-23). Long
 * descriptions used to stretch the card down the whole page; now the
 * card is just the photo gallery, and clicking the cover photo opens
 * the full details (title, venue, full description) in a modal.
 */
function EventCard({ e, i, onSelect }: { e: PortalEvent; i: number; onSelect: (e: PortalEvent) => void }) {
  const images = e.images ?? [];
  const [active, setActive] = useState(0);
  const shown = images[Math.min(active, images.length - 1)];
  return (
    <Reveal delay={Math.min(i, 5) * 0.07}>
      <article className="group h-full overflow-hidden rounded-3xl border border-ivory/10 bg-ink-2 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
        {images.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => onSelect(e)}
              aria-label={`View details of ${e.title}`}
              className="relative block w-full cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown} alt={e.title} className="h-52 w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-3 pt-10 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-gold-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Tap to view details
              </span>
            </button>
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2 p-3">
                {images.map((src, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setActive(j)}
                    aria-label={`Show picture ${j + 1} of ${e.title}`}
                    className={`h-12 w-16 overflow-hidden rounded-lg ring-2 transition-all ${j === active ? "ring-gold" : "opacity-60 ring-transparent hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* An event without pictures still opens its details on tap. */
          <button type="button" onClick={() => onSelect(e)} className="block w-full p-7 text-left">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${e.upcoming ? "bg-gold/15 text-gold-2" : "bg-ivory/10 text-muted"}`}>
              {e.upcoming ? "Upcoming" : "Past"}
            </span>
            <span className="font-display mt-4 block text-2xl font-bold text-ivory">{e.title}</span>
            <span className="mt-2 block text-xs font-bold uppercase tracking-[0.2em] text-gold-2">Tap to view details</span>
          </button>
        )}
      </article>
    </Reveal>
  );
}

interface Attendee {
  id: string;
  name: string;
  batch: string;
}

/** Event RSVP ("আমি আসছি", owner, 2026-10-28): who is coming, and a
 *  one-tap toggle for approved members. Attendees live in the
 *  events/{id}/attendees subcollection (doc id == member uid), so the
 *  event doc itself never grows. Past events show no RSVP. In demo
 *  mode (no Firebase) the toggle works on a local-only list. */
function RsvpSection({ eventId, upcoming }: { eventId: string; upcoming: boolean }) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const canRsvp = !!user && (user.status === "approved" || isAdmin || isSuperAdmin);
  const mine = !!user && attendees.some((a) => a.id === user.id);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const firestore = db;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void import("firebase/firestore").then(({ collection, onSnapshot }) => {
      if (cancelled) return;
      unsub = onSnapshot(collection(firestore, "events", eventId, "attendees"), (snap) => {
        setAttendees(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as { name: string; batch: string }) })),
        );
      });
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [eventId]);

  async function toggle() {
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (!canRsvp) {
      setNote("RSVP opens once an admin approves your account.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      if (!isFirebaseConfigured || !db) {
        setAttendees((p) =>
          mine
            ? p.filter((a) => a.id !== user.id)
            : [...p, { id: user.id, name: user.name, batch: user.batch }],
        );
      } else {
        const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
        if (mine) {
          await deleteDoc(doc(db, "events", eventId, "attendees", user.id));
        } else {
          await setDoc(doc(db, "events", eventId, "attendees", user.id), {
            name: user.name,
            batch: user.batch,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      setNote("Could not save your RSVP. Please try again.");
    }
    setBusy(false);
  }

  if (!upcoming) return null;
  return (
    <div className="mt-8 border-t border-ivory/10 pt-6">
      <p className="text-sm font-bold text-ivory">
        {attendees.length} জন আসছে
      </p>
      {attendees.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {attendees.map((a) => (
            <span key={a.id} className="rounded-full border border-ivory/15 px-3 py-1 text-xs text-ivory/90">
              {a.name} <span className="text-muted">· Batch {a.batch}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">No one has RSVPed yet. Be the first.</p>
      )}
      <div className="mt-4">
        {!user ? (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="rounded-full border border-gold/40 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10"
          >
            Log in to RSVP
          </button>
        ) : !canRsvp ? (
          <p className="text-xs text-muted">RSVP opens once an admin approves your account.</p>
        ) : (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-60"
          >
            {busy ? "Saving…" : mine ? "আসছি না" : "আমি আসছি"}
          </button>
        )}
      </div>
      {note && <p className="mt-3 text-xs text-red-300">{note}</p>}
    </div>
  );
}

/** Full event details: big picture gallery + the complete description. */
function EventDetailModal({ e, onClose }: { e: PortalEvent; onClose: () => void }) {
  const images = e.images ?? [];
  const [active, setActive] = useState(0);
  const shown = images[Math.min(active, images.length - 1)];

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={e.title}>
      <button type="button" aria-label="Close details" onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="animate-pop-in relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-ivory/10 bg-ink-2 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white transition-colors hover:bg-red-600"
        >
          ×
        </button>
        {images.length > 0 && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt={e.title} className="h-64 w-full object-cover sm:h-80" />
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2 px-7 pt-4">
                {images.map((src, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setActive(j)}
                    aria-label={`Show picture ${j + 1}`}
                    className={`h-12 w-16 overflow-hidden rounded-lg ring-2 transition-all ${j === active ? "ring-gold" : "opacity-60 ring-transparent hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-7">
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${e.upcoming ? "bg-gold/15 text-gold-2" : "bg-ivory/10 text-muted"}`}>
              {e.upcoming ? "Upcoming" : "Past"}
            </span>
            <span className="font-mono text-xs text-muted">{e.date}</span>
          </div>
          <h3 className="font-display mt-4 text-3xl font-bold leading-snug text-ivory">{e.title}</h3>
          {e.venue && <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gold">📍 {e.venue}</p>}
          {e.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted">{e.description}</p>
          )}
          <RsvpSection eventId={e.id} upcoming={e.upcoming} />
        </div>
      </div>
    </div>
  );
}

/** Events & reunions, upcoming and past. */
export default function EventsPage() {
  const { events } = useContent();
  const [selected, setSelected] = useState<PortalEvent | null>(null);
  const upcoming = events.filter((e) => e.upcoming);
  const past = events.filter((e) => !e.upcoming);

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Gather & celebrate"
          title={<>Events & <span className="text-gold-gradient">Reunions</span></>}
          subtitle="From grand reunions to blood drives, never miss a moment with your batchmates. Tap any photo to read the full story."
        />
        <div className="mx-auto w-full px-5 py-12 sm:px-10 lg:px-[3vw]">
          <h2 className="font-display text-2xl font-bold text-ivory">Upcoming</h2>
          <div className="gold-rule mt-4 w-32" />
          {upcoming.length === 0 ? (
            <p className="mt-8 text-sm text-muted">No upcoming events right now. Stay tuned.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => <EventCard key={e.id} e={e} i={i} onSelect={setSelected} />)}
            </div>
          )}

          <h2 className="font-display mt-16 text-2xl font-bold text-ivory">Past highlights</h2>
          <div className="gold-rule mt-4 w-32" />
          {past.length === 0 ? (
            <p className="mt-8 text-sm text-muted">No past events yet.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((e, i) => <EventCard key={e.id} e={e} i={i} onSelect={setSelected} />)}
            </div>
          )}
        </div>
        {selected && <EventDetailModal e={selected} onClose={() => setSelected(null)} />}
      </main>
      <Footer />
    </>
  );
}
