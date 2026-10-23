"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-context";
import { inputCls, labelCls } from "@/components/auth/ui";
import {
  SCHOOL_FOUNDED_YEAR,
  SITE_EMAIL,
  SITE_FACEBOOK,
  SITE_INSTAGRAM,
  SITE_SCHOOL,
  SITE_WHATSAPP,
} from "@/lib/site";

/**
 * Site settings (owner, 2026-10-24): the super-admin dashboard's
 * Settings section. Edits the settings fields of the shared
 * site/content doc; every consumer falls back to the site.ts
 * constants when a field is blank, and saves preserve the About
 * fields (and vice versa in AboutEditor).
 */
export default function SettingsManager() {
  const { siteContent, saveSiteContent } = useContent();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    contactEmail: siteContent.contactEmail ?? SITE_EMAIL,
    facebookUrl: siteContent.facebookUrl ?? SITE_FACEBOOK,
    instagramUrl: siteContent.instagramUrl ?? SITE_INSTAGRAM,
    whatsappUrl: siteContent.whatsappUrl ?? SITE_WHATSAPP,
    schoolUrl: siteContent.schoolUrl ?? SITE_SCHOOL,
    foundedYear: String(siteContent.foundedYear ?? SCHOOL_FOUNDED_YEAR),
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const year = Number.parseInt(f.foundedYear, 10);
    await saveSiteContent({
      ...siteContent,
      contactEmail: f.contactEmail.trim(),
      facebookUrl: f.facebookUrl.trim(),
      instagramUrl: f.instagramUrl.trim(),
      whatsappUrl: f.whatsappUrl.trim(),
      schoolUrl: f.schoolUrl.trim(),
      foundedYear:
        Number.isFinite(year) && year >= 1800 && year <= new Date().getFullYear()
          ? year
          : SCHOOL_FOUNDED_YEAR,
    });
    setBusy(false);
    setSaved(true);
  }

  return (
    <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-ivory">Site settings</h3>
          <p className="mt-1 text-xs text-muted">
            Official contact links, socials and the school founding year, used across the site
            (footer, contact page, ID card, stats). Changes go live immediately.
          </p>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-xs font-bold text-emerald-300">
            ✓ Saved
          </span>
        )}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Official email</label>
            <input className={inputCls} type="email" value={f.contactEmail} onChange={set("contactEmail")} />
          </div>
          <div>
            <label className={labelCls}>School founded year</label>
            <input className={inputCls} type="number" min={1800} max={2100} value={f.foundedYear} onChange={set("foundedYear")} />
            <p className="mt-1 text-[11px] text-muted/70">Drives the “Years of Legacy” count on the home page.</p>
          </div>
        </div>
        <div>
          <label className={labelCls}>Facebook page URL</label>
          <input className={inputCls} type="url" value={f.facebookUrl} onChange={set("facebookUrl")} />
        </div>
        <div>
          <label className={labelCls}>Instagram URL</label>
          <input className={inputCls} type="url" value={f.instagramUrl} onChange={set("instagramUrl")} />
        </div>
        <div>
          <label className={labelCls}>Community WhatsApp group URL</label>
          <input className={inputCls} type="url" value={f.whatsappUrl} onChange={set("whatsappUrl")} />
        </div>
        <div>
          <label className={labelCls}>School website URL</label>
          <input className={inputCls} type="url" value={f.schoolUrl} onChange={set("schoolUrl")} />
        </div>
        <div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-[#b98a2f] via-[#e9c766] to-[#b98a2f] px-8 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#0a1430] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
