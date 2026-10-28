"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useAuth, type ProfileUpdateInput } from "@/lib/auth-context";
import { compressImageToDataURL } from "@/lib/image";
import PhotoCropper from "@/components/PhotoCropper";
import { inputCls, labelCls } from "@/components/auth/ui";
import { BD_DISTRICTS, BLOOD_GROUPS, DEPARTMENTS } from "@/lib/types";
import { useBatchYears } from "@/lib/useBatchYears";

/** Members edit their own profile, safe fields only. */
export default function EditProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  // Object URL of the photo being cropped (null = cropper closed).
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only date for the dob max attribute
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const batchYears = useBatchYears();
  const [f, setF] = useState<ProfileUpdateInput>({
    name: "",
    batch: "",
    district: "",
    country: "",
    department: "",
    dob: "",
    profession: "",
    company: "",
    institution: "",
    eduSession: "",
    eduDepartment: "",
    eduRunning: false,
    phone: "",
    whatsapp: "",
    bloodGroup: "",
    isDonor: false,
    photoURL: "",
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time form hydration from the loaded profile
      setF({
        name: user.name,
        batch: user.batch,
        district: user.district,
        country: user.country ?? "",
        department: user.department ?? "",
        dob: user.dob ?? "",
        profession: user.profession ?? "",
        company: user.company ?? "",
        institution: user.institution ?? "",
        eduSession: user.eduSession ?? "",
        eduDepartment: user.eduDepartment ?? "",
        eduRunning: !!user.eduRunning,
        phone: user.phone ?? "",
        whatsapp: user.whatsapp ?? "",
        bloodGroup: user.bloodGroup ?? "",
        isDonor: !!user.isDonor,
        photoURL: user.photoURL ?? "",
      });
    }
  }, [user]);

  const set = (k: keyof ProfileUpdateInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };

  // Picking a photo now opens the cropper instead of using the whole
  // image: the member selects the exact square area to keep, and only
  // that area goes through the usual compression into the preview.
  // (Owner's call, 2026-10-25: "ami ei tuku area select korbo, sei tukui hbe".)
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
    setError("");
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function onCropNewFile(file: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
  }

  async function onCropDone(file: File) {
    closeCropper();
    setPhotoBusy(true);
    try {
      const url = await compressImageToDataURL(file, 256, 0.72);
      setF((p) => ({ ...p, photoURL: url }));
      setSaved(false);
      setError("");
    } catch {
      setError("Could not process that image.");
    }
    setPhotoBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await updateProfile(f);
    setBusy(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Could not save.");
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-ink">
          <PageHero eyebrow="My profile" title={<>Edit <span className="text-gold-gradient">Profile</span></>} />
          <p className="py-16 text-center text-muted">Loading…</p>
        </main>
        <Footer />
      </>
    );
  }
  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink">
        <PageHero
          eyebrow="My profile"
          title={<>Edit <span className="text-gold-gradient">Profile</span></>}
          subtitle="Keep your information up to date, your batchmates find you by it."
        />
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-10">
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              {/* Photo */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Profile photo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  className="flex w-full items-center gap-4 rounded-xl border border-dashed border-ivory/20 bg-ink px-4 py-3 text-left hover:border-gold/50 disabled:opacity-60"
                >
                  {f.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photoURL} alt="preview" className="h-14 w-14 rounded-full object-cover ring-1 ring-gold/50" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-3 text-xl text-gold-2">📷</span>
                  )}
                  <span className="text-xs text-muted">
                    {photoBusy ? "Processing…" : f.photoURL ? "Photo set ✓, tap to change" : "Tap to upload a photo"}
                  </span>
                </button>
              </div>

              <div><label className={labelCls}>Full name *</label><input className={inputCls} value={f.name} onChange={set("name")} /></div>
              <div>
                <label className={labelCls}>Batch (SSC year) *</label>
                <select className={inputCls} value={f.batch} onChange={set("batch")}>
                  <option value="">Select…</option>
                  {batchYears.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Department *</label>
                <select className={inputCls} value={f.department} onChange={set("department")}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date of birth *</label>
                <input type="date" className={inputCls} value={f.dob} onChange={set("dob")} max={today || undefined} />
              </div>
              <div>
                <label className={labelCls}>Current district *</label>
                <select className={inputCls} value={f.district} onChange={set("district")}>
                  <option value="">Select…</option>
                  {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {f.district === "Abroad" && (
                <div className="sm:col-span-2"><label className={labelCls}>Country</label><input className={inputCls} value={f.country} onChange={set("country")} placeholder="e.g. United Kingdom" /></div>
              )}
              <div><label className={labelCls}>Profession</label><input className={inputCls} value={f.profession} onChange={set("profession")} /></div>
              <div><label className={labelCls}>Company / Organization</label><input className={inputCls} value={f.company} onChange={set("company")} /></div>

              <div className="sm:col-span-2 rounded-2xl border border-gold/25 bg-ink p-5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Education</p>
                <p className="mt-1.5 text-[11px] text-muted/70">Your current college / university - juniors search by university to find running seniors, so keep this updated.</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className={labelCls}>College / University</label><input className={inputCls} value={f.institution} onChange={set("institution")} placeholder="e.g. BUET, University of Dhaka" /></div>
                  <div><label className={labelCls}>Session</label><input className={inputCls} value={f.eduSession} onChange={set("eduSession")} placeholder="e.g. 2022-23" /></div>
                  <div><label className={labelCls}>Department (at this institution)</label><input className={inputCls} value={f.eduDepartment} onChange={set("eduDepartment")} placeholder="e.g. CSE, EEE, Mathematics" /></div>
                  <label className="flex cursor-pointer items-center gap-3 self-end pb-3 sm:col-span-2">
                    <input type="checkbox" checked={f.eduRunning} onChange={() => { setF((p) => ({ ...p, eduRunning: !p.eduRunning })); setSaved(false); }} className="h-4 w-4 accent-[#d4a94e]" />
                    <span className="text-sm text-ivory/90">Currently studying here (Running) - leave unticked if you have completed it</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-gold/25 bg-ink p-5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Contact</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Phone (private)</label>
                    <input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" />
                    <p className="mt-1.5 text-[11px] text-muted/70">Only you and staff can see this.</p>
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp number (public)</label>
                    <input className={inputCls} value={f.whatsapp} onChange={set("whatsapp")} placeholder="01XXXXXXXXX" />
                    <p className="mt-1.5 text-[11px] text-muted/70">Shown as a chat button on your profile, anyone can message you.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Blood group</label>
                <select className={inputCls} value={f.bloodGroup} onChange={set("bloodGroup")}>
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 self-end pb-3">
                <input type="checkbox" checked={f.isDonor} onChange={() => { setF((p) => ({ ...p, isDonor: !p.isDonor })); setSaved(false); }} className="h-4 w-4 accent-[#d4a94e]" />
                <span className="text-sm text-ivory/90">List me as a blood donor 🩸</span>
              </label>

              {error && (
                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:col-span-2">{error}</p>
              )}
              {saved && (
                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 sm:col-span-2">
                  ✓ Profile saved.
                </p>
              )}
              <div className="flex gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </main>
      <Footer />
      {cropSrc && (
        <PhotoCropper
          src={cropSrc}
          onCrop={onCropDone}
          onCancel={closeCropper}
          onNewFile={onCropNewFile}
        />
      )}
    </>
  );
}
