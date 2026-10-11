"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import { BLOOD_GROUPS, BD_DISTRICTS, BATCH_YEARS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted/50 outline-none transition-colors focus:border-gold/60";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-muted";

/** Registration — creates a *pending* member profile for admin approval. */
export default function RegisterPage() {
  const { register, isDemo } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    batch: "",
    roll: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    isDonor: false,
    district: "",
    country: "",
    profession: "",
    company: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleDonor = () => setForm((f) => ({ ...f, isDonor: !f.isDonor }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.batch || !form.email.trim() || !form.password || !form.district) {
      setError("Please fill in name, batch, email, password and district.");
      return;
    }
    setBusy(true);
    const res = await register({ ...form });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Registration failed.");
  }

  if (done) {
    return (
      <>
        <Navbar />
        <main className="bg-ink">
          <PageHero eyebrow="Registration received" title={<>Welcome aboard, <span className="text-gold-gradient">{form.name.split(" ")[0]}</span>!</>} />
          <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
            <Reveal className="rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">✓</p>
              <h2 className="font-display mt-6 text-2xl font-bold text-ivory">Awaiting admin approval</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Your profile has been submitted as <span className="text-gold-2">pending</span>. An
                administrator will verify your BCBHS credentials — once approved, your official
                digital ID card with QR verification will be generated automatically.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link href="/directory" className="rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10">
                  Browse Directory
                </Link>
                <Link href="/" className="rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-ivory">
                  Home
                </Link>
              </div>
            </Reveal>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Join the community"
          title={<>Become a <span className="text-gold-gradient">BCBHSian</span> for life</>}
          subtitle="Fill in your details below. Every registration is verified by an admin before approval — no fake members, ever."
        />
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <Reveal>
            <form onSubmit={onSubmit} className="rounded-3xl border border-ivory/10 bg-ink-2 p-8 sm:p-10">
              {isDemo && (
                <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold-2">
                  Demo mode — your registration is stored locally and appears in the admin approval queue.
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full name *</label>
                  <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Tanvir Ahmed" />
                </div>
                <div>
                  <label className={labelCls}>Batch (SSC year) *</label>
                  <select className={inputCls} value={form.batch} onChange={set("batch")}>
                    <option value="">Select batch…</option>
                    {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Roll no.</label>
                  <input className={inputCls} value={form.roll} onChange={set("roll")} placeholder="e.g. 22" />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </div>
                <div>
                  <label className={labelCls}>Password *</label>
                  <input type="password" className={inputCls} value={form.password} onChange={set("password")} placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className={labelCls}>Blood group</label>
                  <select className={inputCls} value={form.bloodGroup} onChange={set("bloodGroup")}>
                    <option value="">Select…</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Current district *</label>
                  <select className={inputCls} value={form.district} onChange={set("district")}>
                    <option value="">Select district…</option>
                    {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    <option value="Abroad">Abroad 🌍</option>
                  </select>
                </div>
                {form.district === "Abroad" && (
                  <div>
                    <label className={labelCls}>Country</label>
                    <input className={inputCls} value={form.country} onChange={set("country")} placeholder="e.g. United Kingdom" />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Profession</label>
                  <input className={inputCls} value={form.profession} onChange={set("profession")} placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className={labelCls}>Company / Organization</label>
                  <input className={inputCls} value={form.company} onChange={set("company")} placeholder="e.g. Brain Station 23" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Photo</label>
                  <div className="rounded-xl border border-dashed border-ivory/20 bg-ink px-4 py-6 text-center text-xs text-muted">
                    Photo upload connects to Firebase Storage at launch — for now your initials avatar will be used.
                    {/* TODO: wire to Firebase Storage upload */}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
                  <input type="checkbox" checked={form.isDonor} onChange={toggleDonor} className="h-4 w-4 accent-[#d4a94e]" />
                  <span className="text-sm text-ivory/90">List me as a <span className="font-semibold text-red-300">blood donor</span> 🩸</span>
                </label>
              </div>

              {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="btn-shimmer mt-8 w-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep py-4 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_36px_rgba(212,169,78,0.45)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {busy ? "Submitting…" : "Submit for Approval"}
              </button>
              <p className="mt-5 text-center text-xs text-muted">
                Already registered? <Link href="/login" className="text-gold-2 hover:underline">Log in</Link>
              </p>
            </form>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
