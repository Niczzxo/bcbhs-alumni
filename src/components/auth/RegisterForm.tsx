"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { compressImageToDataURL } from "@/lib/image";
import { BLOOD_GROUPS, BD_DISTRICTS, BATCH_YEARS } from "@/lib/types";
import { inputCls, labelCls } from "./ui";

/** Shared registration form — used by the /register page and the auth modal. */
export default function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: {
  /** Called with the registrant's first name on successful submission. */
  onSuccess?: (firstName: string) => void;
  onSwitchToLogin?: () => void;
}) {
  const { register, isDemo } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG/PNG).");
      return;
    }
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImageToDataURL(file);
      setPhotoURL(dataUrl);
      setError("");
    } catch {
      setError("Could not process that photo — try another image.");
    }
    setPhotoBusy(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.batch || !form.email.trim() || !form.password || !form.district) {
      setError("Please fill in name, batch, email, password and district.");
      return;
    }
    setBusy(true);
    const res = await register({ ...form, photoURL: photoURL || undefined });
    setBusy(false);
    if (res.ok) onSuccess?.(form.name.trim().split(" ")[0] || "friend");
    else setError(res.error ?? "Registration failed.");
  }

  return (
    <form onSubmit={onSubmit}>
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photoBusy}
            className="flex w-full items-center gap-4 rounded-xl border border-dashed border-ivory/20 bg-ink px-4 py-4 text-left transition-colors hover:border-gold/50 disabled:opacity-60"
          >
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt="Your photo" className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-gold/60" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink-3 text-2xl text-gold-2">
                📷
              </span>
            )}
            <span className="text-xs leading-relaxed text-muted">
              {photoBusy ? (
                "Processing photo…"
              ) : photoURL ? (
                <>Photo added ✓ — <span className="text-gold-2 underline">tap to change</span></>
              ) : (
                <>Tap to upload your photo (JPG/PNG). It appears on your profile, directory card and ID card.</>
              )}
            </span>
          </button>
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
        Already registered?{" "}
        {onSwitchToLogin ? (
          <button type="button" onClick={onSwitchToLogin} className="text-gold-2 hover:underline">
            Log in
          </button>
        ) : (
          <Link href="/login" className="text-gold-2 hover:underline">Log in</Link>
        )}
      </p>
    </form>
  );
}
