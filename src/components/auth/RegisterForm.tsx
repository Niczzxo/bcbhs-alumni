"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { compressImageToDataURL } from "@/lib/image";
import { isDisposableEmail } from "@/lib/disposable-email-domains";
import { BLOOD_GROUPS, BD_DISTRICTS, DEPARTMENTS } from "@/lib/types";
import { useBatchYears } from "@/lib/useBatchYears";
import VerifyEmailBox from "./VerifyEmailBox";
import { inputCls, labelCls } from "./ui";

/** Shared registration form, used by the /register page and the auth modal. */
export default function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: {
  /** Called with the registrant's first name on successful submission. */
  onSuccess?: (firstName: string) => void;
  onSwitchToLogin?: () => void;
}) {
  const { register, logout, isDemo } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /* Email verification (owner, 2026-11-13): after submitting, the
     member must click the link in their inbox before the registration
     is complete. The form state is kept so the success screen still
     knows their first name. */
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only date for the dob max attribute
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const batchYears = useBatchYears();
  const [form, setForm] = useState({
    name: "",
    batch: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    bloodGroup: "",
    isDonor: false,
    district: "",
    country: "",
    department: "",
    dob: "",
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
      const dataUrl = await compressImageToDataURL(file, 1024, 0.85);
      setPhotoURL(dataUrl);
      setError("");
    } catch {
      setError("Could not process that photo, try another image.");
    }
    setPhotoBusy(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    /* Every field in the form is mandatory (owner's rule, 2026-10-23)
       EXCEPT Company / Organization, which is optional (owner,
       2026-10-28): a registration missing any mandatory field is
       incomplete by definition, so name exactly what is missing and
       refuse to submit. */
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("full name");
    if (!form.batch) missing.push("batch");
    if (!form.department) missing.push("department");
    if (!form.dob) missing.push("date of birth");
    if (!form.email.trim()) missing.push("email");
    if (!form.password) missing.push("password");
    if (!form.phone.trim()) missing.push("phone number");
    if (!form.whatsapp.trim()) missing.push("WhatsApp number");
    if (!form.bloodGroup) missing.push("blood group");
    if (!form.district) missing.push("current district");
    if (form.district === "Abroad" && !form.country.trim()) missing.push("country");
    if (!form.profession.trim()) missing.push("profession");
    if (!photoURL) missing.push("photo");
    if (missing.length) {
      setError(`Please fill in: ${missing.join(", ")}.`);
      return;
    }
    /* Disposable / temporary inboxes are refused outright (owner,
       2026-11-13): a throwaway address can never become a member. */
    if (isDisposableEmail(form.email.trim())) {
      setError("Temporary or disposable email addresses can't be used. Please register with your real email address.");
      return;
    }
    setBusy(true);
    const res = await register({ ...form, photoURL: photoURL || undefined });
    setBusy(false);
    if (res.ok && res.needsVerification) {
      setVerifyEmail(res.email ?? form.email.trim().toLowerCase());
      setStep("verify");
      /* The form is long; bring the verify screen into view. */
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (res.ok) onSuccess?.(form.name.trim().split(" ")[0] || "friend");
    else setError(res.error ?? "Registration failed.");
  }

  if (step === "verify") {
    return (
      <VerifyEmailBox
        email={verifyEmail}
        onVerified={() => onSuccess?.(form.name.trim().split(" ")[0] || "friend")}
        onCancel={async () => {
          /* Start over with a different email: sign out of the
             just-created account (it stays unverified and invisible
             to admins) and show the form again. */
          await logout();
          setStep("form");
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {isDemo && (
        <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold-2">
          Demo mode, your registration is stored locally and appears in the admin approval queue.
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
            {batchYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Department *</label>
          <select className={inputCls} value={form.department} onChange={set("department")}>
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date of birth *</label>
          <input type="date" className={inputCls} value={form.dob} onChange={set("dob")} max={today || undefined} />
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
          <label className={labelCls}>Phone *</label>
          <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className={labelCls}>WhatsApp number *</label>
          <input className={inputCls} value={form.whatsapp} onChange={set("whatsapp")} placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className={labelCls}>Blood group *</label>
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
            <label className={labelCls}>Country *</label>
            <input className={inputCls} value={form.country} onChange={set("country")} placeholder="e.g. United Kingdom" />
          </div>
        )}
        <div>
          <label className={labelCls}>Profession *</label>
          <input className={inputCls} value={form.profession} onChange={set("profession")} placeholder="e.g. Software Engineer" />
        </div>
        <div>
          <label className={labelCls}>Company / Organization (optional)</label>
          <input className={inputCls} value={form.company} onChange={set("company")} placeholder="e.g. Brain Station 23" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Photo *</label>
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
                <>Photo added ✓, <span className="text-gold-2 underline">tap to change</span></>
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
      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        By registering, you agree to our{" "}
        <Link href="/terms" className="text-gold-2 hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-gold-2 hover:underline">Privacy Policy</Link>.
      </p>
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
