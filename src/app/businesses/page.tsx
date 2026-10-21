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
import { BD_DISTRICTS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

const CATEGORIES = [
  "IT & Electronics",
  "Clothing & Fashion",
  "Food & Restaurant",
  "Education & Coaching",
  "Health & Pharmacy",
  "Construction & Hardware",
  "Transport & Automobile",
  "Agriculture",
  "Services",
  "Other",
];

/** Business Directory — businesses owned by BCBHS alumni. Support our own. */
export default function BusinessesPage() {
  const { businesses, addBusiness } = useContent();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], district: "Bogura", description: "", whatsapp: "" });
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const list = useMemo(
    () =>
      [...businesses]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((b) => {
          if (category && b.category !== category) return false;
          if (district && b.district !== district) return false;
          if (query && !`${b.name} ${b.description} ${b.ownerName}`.toLowerCase().includes(query.toLowerCase())) return false;
          return true;
        }),
    [businesses, category, district, query],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.description.trim() || !form.whatsapp.trim()) {
      setFormError("Business name, description and WhatsApp number are required.");
      return;
    }
    setFormError("");
    await addBusiness({
      name: form.name.trim(),
      ownerId: user.id,
      ownerName: user.name,
      ownerBatch: user.batch,
      category: form.category,
      district: form.district,
      description: form.description.trim(),
      whatsapp: form.whatsapp.trim(),
    });
    setDone(true);
    setShowForm(false);
  };

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Support our own"
          title={<>Business <span className="text-gold-gradient">Directory</span> 🏪</>}
          subtitle="Shops, services and startups run by BCBHS alumni. When you buy from a brother, the whole family grows."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <input className={inputCls} placeholder="Search businesses…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">All districts</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <button
                onClick={() => (user ? setShowForm((v) => !v) : openAuthModal("login"))}
                className="btn-shimmer rounded-xl bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-ink"
              >
                + List My Business
              </button>
            </div>
          </Reveal>

          {done && (
            <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center text-sm text-emerald-200">
              ✅ Your business is now listed in the directory.
            </p>
          )}

          {showForm && user && (
            <Reveal className="mt-6 rounded-3xl border border-gold/30 bg-ink-2 p-7">
              <h2 className="font-display text-xl font-bold text-ivory">List your business</h2>
              <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <input className={inputCls} placeholder="Business name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className={inputCls} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                    {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <input className={inputCls} placeholder="WhatsApp number *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                <input className={inputCls} placeholder="Your name (auto)" value={`${user.name} · Batch ${user.batch}`} disabled />
                <textarea className={`${inputCls} sm:col-span-2`} rows={3} placeholder="What do you sell / offer? Any alumni discount? *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                {formError && <p className="text-sm text-red-300 sm:col-span-2">{formError}</p>}
                <button type="submit" className="btn-shimmer rounded-xl bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink sm:col-span-2">
                  Publish Listing
                </button>
              </form>
            </Reveal>
          )}

          <p className="mt-8 text-sm text-muted">
            <span className="font-semibold text-gold-2">{list.length}</span> alumni businesses
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b, i) => (
              <Reveal key={b.id} delay={Math.min(i % 6, 5) * 0.06} className="flex flex-col rounded-3xl border border-ivory/10 bg-ink-2 p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg font-bold leading-snug text-ivory">{b.name}</p>
                  <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-2">
                    {b.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">📍 {b.district} · by {b.ownerName} (Batch {b.ownerBatch})</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{b.description}</p>
                <a
                  href={`https://wa.me/${normalizeWhatsAppNumber(b.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 rounded-full border border-gold/40 px-5 py-2 text-center text-xs font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                >
                  WhatsApp the Owner
                </a>
              </Reveal>
            ))}
          </div>
          {list.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted">No businesses match — be the first from your area to list one.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
