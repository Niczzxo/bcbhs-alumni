"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-context";
import { inputCls, labelCls } from "@/components/auth/ui";
import { DEFAULT_SITE_CONTENT } from "@/lib/types";

/** Super-admin editor for the public About page content. */
export default function AboutEditor() {
  const { siteContent, saveSiteContent } = useContent();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    aboutEyebrow: siteContent.aboutEyebrow,
    aboutTitle: siteContent.aboutTitle,
    aboutIntro: siteContent.aboutIntro,
    aboutStory: siteContent.aboutStory.join("\n\n"),
    aboutMission: siteContent.aboutMission,
  });
  const [values, setValues] = useState(siteContent.aboutValues);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };

  const setValue = (i: number, k: "title" | "text", v: string) => {
    setValues((prev) => prev.map((val, j) => (j === i ? { ...val, [k]: v } : val)));
    setSaved(false);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await saveSiteContent({
      ...siteContent,
      aboutEyebrow: f.aboutEyebrow.trim() || DEFAULT_SITE_CONTENT.aboutEyebrow,
      aboutTitle: f.aboutTitle.trim() || DEFAULT_SITE_CONTENT.aboutTitle,
      aboutIntro: f.aboutIntro.trim(),
      aboutStory: f.aboutStory.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      aboutMission: f.aboutMission.trim(),
      aboutValues: values.filter((v) => v.title.trim()),
    });
    setBusy(false);
    setSaved(true);
  }

  return (
    <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-ivory">About page</h3>
          <p className="mt-1 text-xs text-muted">Edit anytime, changes go live on the About page immediately.</p>
        </div>
        {saved && <span className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-xs font-bold text-emerald-300">✓ Saved</span>}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={labelCls}>Eyebrow</label><input className={inputCls} value={f.aboutEyebrow} onChange={set("aboutEyebrow")} /></div>
          <div><label className={labelCls}>Title</label><input className={inputCls} value={f.aboutTitle} onChange={set("aboutTitle")} /></div>
        </div>
        <div><label className={labelCls}>Intro</label><textarea className={inputCls} rows={2} value={f.aboutIntro} onChange={set("aboutIntro")} /></div>
        <div>
          <label className={labelCls}>Story (blank line = new paragraph)</label>
          <textarea className={inputCls} rows={6} value={f.aboutStory} onChange={set("aboutStory")} />
        </div>
        <div><label className={labelCls}>Mission</label><textarea className={inputCls} rows={3} value={f.aboutMission} onChange={set("aboutMission")} /></div>
        <div>
          <label className={labelCls}>Values</label>
          <div className="grid gap-4">
            {values.map((v, i) => (
              <div key={i} className="grid gap-3 rounded-2xl border border-ivory/10 bg-ink p-4 sm:grid-cols-[1fr_2fr]">
                <input className={inputCls} value={v.title} onChange={(e) => setValue(i, "title", e.target.value)} placeholder="Value title" />
                <input className={inputCls} value={v.text} onChange={(e) => setValue(i, "text", e.target.value)} placeholder="Value description" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-60">
            {busy ? "Saving…" : "Save About page"}
          </button>
        </div>
      </form>
    </div>
  );
}
