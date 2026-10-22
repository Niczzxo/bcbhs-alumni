"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MemberCard from "@/components/MemberCard";
import Reveal from "@/components/Reveal";
import { useDirectory } from "@/lib/data";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { BLOOD_GROUPS, BD_DISTRICTS } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ivory/15 bg-ink px-4 py-2.5 text-sm text-ivory outline-none transition-colors focus:border-gold/60";

/** Blood donor directory, filter by group + district, plus the live
 * urgent-request board: members post a need, donors respond directly. */
export default function BloodDonorsPage() {
  const members = useDirectory();
  const { bloodRequests, addBloodRequest } = useContent();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");

  const donors = useMemo(
    () =>
      members.filter((m) => {
        if (!m.isDonor) return false;
        if (group && m.bloodGroup !== group) return false;
        if (district && (district === "Abroad" ? !m.isAbroad : m.district !== district)) return false;
        return true;
      }),
    [members, group, district],
  );

  const activeRequests = useMemo(
    () =>
      bloodRequests
        .filter((r) => !r.resolved)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bloodRequests],
  );

  /* urgent-request form */
  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "B+",
    bagsNeeded: "",
    hospital: "",
    district: "Bogura",
    contact: "",
    neededBy: "",
    note: "",
  });
  const [posted, setPosted] = useState(false);
  const [formError, setFormError] = useState("");

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.patientName.trim() || !form.hospital.trim() || !form.contact.trim()) {
      setFormError("Patient name, hospital and contact number are required.");
      return;
    }
    setFormError("");
    await addBloodRequest({
      patientName: form.patientName.trim(),
      bloodGroup: form.bloodGroup,
      bagsNeeded: form.bagsNeeded.trim() || undefined,
      hospital: form.hospital.trim(),
      district: form.district,
      contact: form.contact.trim(),
      neededBy: form.neededBy || undefined,
      note: form.note.trim() || undefined,
      postedBy: user.id,
      posterName: user.name,
    });
    setPosted(true);
    setForm({
      patientName: "",
      bloodGroup: "B+",
      bagsNeeded: "",
      hospital: "",
      district: "Bogura",
      contact: "",
      neededBy: "",
      note: "",
    });
  };

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Donate blood, save life"
          title={<>Blood <span className="text-gold-gradient">Donor Network</span> 🩸</>}
          subtitle="In an emergency, every minute counts. Find a verified alumni donor near you."
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <Reveal className="rounded-3xl border border-red-400/25 bg-ink-2 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <select className={inputCls} value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">All blood groups</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">All districts</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="Abroad">Abroad 🌍</option>
              </select>
              <a
                href="#urgent"
                className="btn-shimmer rounded-xl bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-widest text-white"
              >
                Urgent request
              </a>
            </div>
          </Reveal>

          <p className="mt-8 text-sm text-muted">
            <span className="font-semibold text-gold-2">{donors.length}</span> registered donors
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((m, i) => (
              <MemberCard key={m.id} member={m} delay={Math.min(i % 6, 5) * 0.06} />
            ))}
          </div>
          {donors.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted">No donors match, try widening the filters.</p>
          )}

          {/* ------------------------- urgent requests ------------------------ */}
          <div id="urgent" className="mt-16">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-ivory">
                Urgent <span className="text-gold-gradient">Blood Requests</span>
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Live requests from our alumni family. If your group matches, please call or
                WhatsApp the attendant right away, minutes matter.
              </p>
            </Reveal>

            {activeRequests.length > 0 ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {activeRequests.map((r, i) => (
                  <Reveal key={r.id} delay={Math.min(i, 4) * 0.06} className="rounded-3xl border border-red-400/30 bg-ink-2 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-xl font-bold text-ivory">{r.patientName}</p>
                        <p className="mt-1 text-sm text-muted">
                          {r.hospital} · {r.district}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-2xl bg-red-500/15 px-4 py-2 text-center">
                        <span className="block text-xl font-extrabold text-red-300">{r.bloodGroup}</span>
                        {r.bagsNeeded && <span className="block text-[10px] uppercase tracking-wider text-red-200/70">{r.bagsNeeded}</span>}
                      </span>
                    </div>
                    {r.note && <p className="mt-3 text-sm leading-relaxed text-muted">{r.note}</p>}
                    <p className="mt-3 text-xs text-muted/70">
                      Posted by {r.posterName}
                      {r.neededBy ? ` · Needed by ${r.neededBy}` : ""}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {user?.status === "approved" ? (
                        <>
                          <a
                            href={`tel:${r.contact}`}
                            className="rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white"
                          >
                            📞 Call {r.contact}
                          </a>
                          <a
                            href={`https://wa.me/${normalizeWhatsAppNumber(r.contact)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10"
                          >
                            WhatsApp
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={() => openAuthModal("login")}
                          className="rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10"
                        >
                          Log In to Contact
                        </button>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-3xl border border-ivory/10 bg-ink-2 p-6 text-center text-sm text-muted">
                No urgent requests right now, Alhamdulillah. May it stay that way.
              </p>
            )}

            {/* post a request */}
            <Reveal className="mt-10 rounded-3xl border border-gold/30 bg-ink-2 p-8">
              <h3 className="font-display text-2xl font-bold text-ivory">Need blood urgently?</h3>
              {!user ? (
                <>
                  <p className="mt-3 max-w-xl text-sm text-muted">
                    Log in with your alumni account to post an urgent request, it appears here
                    instantly for every donor to see.
                  </p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="btn-shimmer mt-6 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
                  >
                    Log In to Post
                  </button>
                </>
              ) : posted ? (
                <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                  ✅ Your request is live above. Donors can now call you directly. May Allah grant
                  the patient a quick recovery.
                </p>
              ) : (
                <form onSubmit={submitRequest} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Patient name *" value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <select className={inputCls} value={form.bloodGroup}
                      onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                      {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input className={inputCls} placeholder="Bags needed" value={form.bagsNeeded}
                      onChange={(e) => setForm({ ...form, bagsNeeded: e.target.value })} />
                  </div>
                  <input className={inputCls} placeholder="Hospital / clinic *" value={form.hospital}
                    onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
                  <select className={inputCls} value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}>
                    {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Contact number (patient attendant) *" value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                  <input className={inputCls} type="date" value={form.neededBy}
                    onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
                  <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Short note (optional)" value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  {formError && <p className="text-sm text-red-300 sm:col-span-2">{formError}</p>}
                  <button type="submit"
                    className="btn-shimmer rounded-xl bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white sm:col-span-2">
                    Post Urgent Request
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
