"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

/** Mentorship, senior alumni guiding juniors: studies, admissions, careers. */
export default function MentorshipPage() {
  const { mentors, addMentor, removeMentor } = useContent();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ expertise: "", bio: "", whatsapp: "" });
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const myListing = useMemo(
    () => (user ? mentors.find((m) => m.memberId === user.id) : undefined),
    [mentors, user],
  );

  const list = useMemo(
    () =>
      [...mentors]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter(
          (m) =>
            !query ||
            `${m.name} ${m.expertise} ${m.bio}`.toLowerCase().includes(query.toLowerCase()),
        ),
    [mentors, query],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.expertise.trim() || !form.bio.trim() || !form.whatsapp.trim()) {
      setFormError("Expertise, a short bio and your WhatsApp number are required.");
      return;
    }
    setFormError("");
    await addMentor({
      memberId: user.id,
      name: user.name,
      batch: user.batch,
      expertise: form.expertise.trim(),
      bio: form.bio.trim(),
      whatsapp: form.whatsapp.trim(),
    });
    setDone(true);
  };

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Seniors guide juniors"
          title={<>Mentorship <span className="text-gold-gradient">Program</span></>}
          subtitle="Stuck on studies, admissions or your first job? A BCBHS senior has walked that road, reach out, they are happy to help."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {!user ? (
            <Reveal className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Members only</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                The mentor list is shared inside the alumni family. Log in to meet your mentors.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="btn-shimmer mt-6 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                Log In
              </button>
            </Reveal>
          ) : (
            <>
              <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
                <input
                  className={inputCls}
                  placeholder="Search mentors, try “BCS”, “BUET”, “software”, “medicine”…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Reveal>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m, i) => (
                  <Reveal key={m.id} delay={Math.min(i % 6, 5) * 0.06} className="flex flex-col rounded-3xl border border-ivory/10 bg-ink-2 p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-lg font-extrabold text-gold-2">
                        {m.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display truncate font-bold text-ivory">{m.name}</p>
                        <p className="text-xs text-muted">Batch {m.batch} · Mentor</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gold-2">{m.expertise}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{m.bio}</p>
                    {user?.status === "approved" && (
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(m.whatsapp)}?text=${encodeURIComponent(`Assalamu Alaikum! Ami ${user.name}, Batch ${user.batch}, BCBHS Mentorship program theke apnar guidance chachhi.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 rounded-full border border-gold/40 px-5 py-2 text-center text-xs font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                      >
                        Ask on WhatsApp
                      </a>
                    )}
                  </Reveal>
                ))}
              </div>
              {list.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted">No mentors match your search yet.</p>
              )}

              {/* become a mentor */}
              <Reveal className="mt-12 rounded-3xl border border-gold/30 bg-ink-2 p-8">
                <h2 className="font-display text-2xl font-bold text-ivory">Become a mentor 🤝</h2>
                {myListing ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-emerald-200">
                      ✅ You are listed as a mentor, juniors can already reach you. Thank you for giving back!
                    </p>
                    <button
                      onClick={() => removeMentor(myListing.id)}
                      className="rounded-full border border-red-400/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-400/10"
                    >
                      Remove my listing
                    </button>
                  </div>
                ) : done ? (
                  <p className="mt-4 text-sm text-emerald-200">✅ You are now listed as a mentor above. Jazakumullah!</p>
                ) : user.status !== "approved" ? (
                  <p className="mt-3 text-sm text-muted">
                    Mentor listings open once your membership is approved by the admins.
                  </p>
                ) : (
                  <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Your expertise, e.g. “BCS · BUET admission · Software jobs” *" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
                    <input className={inputCls} placeholder="WhatsApp number *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                    <textarea className={`${inputCls} sm:col-span-2`} rows={3} placeholder="Short bio, who are you, and how can you help juniors? *" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    {formError && <p className="text-sm text-red-300 sm:col-span-2">{formError}</p>}
                    <button type="submit" className="btn-shimmer rounded-xl bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink sm:col-span-2">
                      Join as Mentor
                    </button>
                  </form>
                )}
              </Reveal>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
