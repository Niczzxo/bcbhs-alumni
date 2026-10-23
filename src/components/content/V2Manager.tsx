"use client";

/* ------------------------------------------------------------------ */
/*  v2.0 community-feature management for the staff dashboards:        */
/*  blood requests, hall of fame, businesses,      */
/*  mentors, scholarship fund, batch WhatsApp links. Each section      */
/*  gates itself on the signed-in staff member's role/permissions.     */
/* ------------------------------------------------------------------ */

import { useRef, useState } from "react";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { compressImageToDataURL } from "@/lib/image";
import { inputCls, labelCls } from "@/components/auth/ui";
import { BATCH_YEARS } from "@/lib/types";

const card = "rounded-3xl border border-ivory/10 bg-ink-2 p-6";
const btnDanger =
  "rounded-full border border-red-400/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10";
const btnGhost =
  "rounded-full border border-ivory/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted hover:border-gold/40 hover:text-gold-2";
const btnPrimary =
  "rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-60";

function SectionTitle({ children, blurb }: { children: React.ReactNode; blurb: string }) {
  return (
    <>
      <h3 className="font-display text-lg font-bold text-ivory">{children}</h3>
      <p className="mt-1 text-xs text-muted">{blurb}</p>
    </>
  );
}

function ImagePick({ onPick, label }: { onPick: (dataUrl: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onPick(await compressImageToDataURL(f, 1000, 0.72));
          } catch {
            /* ignore bad files */
          }
          setBusy(false);
        }}
      />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={btnGhost}>
        {busy ? "Processing…" : label}
      </button>
    </>
  );
}

/** The community work areas, one per dashboard sidebar entry
 *  (owner, 2026-10-24: no single "Community" page anymore, each
 *  area is its own sidebar section in every dashboard). */
export type V2SectionKey = "blood" | "stories" | "listings" | "fund" | "batches";
export const V2_SECTIONS: { key: V2SectionKey; label: string; blurb: string; needsContentPerm?: boolean }[] = [
  { key: "blood", label: "Blood Requests", blurb: "Urgent requests posted by members. Mark resolved once the blood is managed." },
  { key: "stories", label: "Hall of Fame", blurb: "Celebrate notable alumni on the Success Stories page.", needsContentPerm: true },
  { key: "listings", label: "Businesses & Mentors", blurb: "Moderate member-submitted listings." },
  { key: "fund", label: "Scholarship Fund", blurb: "Scholarship & Donation Fund, totals, bKash number and the honour roll.", needsContentPerm: true },
  { key: "batches", label: "Batch Groups", blurb: "WhatsApp group invite link per batch, shown on the Batch Groups page." },
];

export default function V2Manager({ section }: { section: V2SectionKey }) {
  const { user, members, hasPermission, isSuperAdmin } = useAuth();
  const {
    bloodRequests, updateBloodRequest, removeBloodRequest,
    stories, addStory, removeStory,
    businesses, removeBusiness,
    mentors, removeMentor,
    fundInfo, saveFundInfo, fundDonors, addFundDonor, removeFundDonor,
    batchLinks, setBatchLink,
  } = useContent();

  const canContent = hasPermission("post_announcements");
  const [storyForm, setStoryForm] = useState({ name: "", batch: "2015", title: "", story: "", photoURL: "" });
  const [fundForm, setFundForm] = useState<null | typeof fundInfo>(null);
  const [donorForm, setDonorForm] = useState({ name: "", batch: "", amount: "", note: "" });
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});

  if (!user) return null;
  const batchesWithMembers = [...new Set(members.filter((m) => m.status === "approved").map((m) => m.batch))].sort().reverse();
  /* Batch link self-service (owner's rule, 2026-10-23): the super
     admin sees every batch; a Batch Rep sees only their OWN batch,
     so they can post their batch's WhatsApp link without waiting
     for the super admin. Enforced in firestore.rules too. */
  const isBatchRep = user?.role === "admin";
  const visibleBatches = isSuperAdmin
    ? batchesWithMembers
    : isBatchRep && user?.batch
      ? [user.batch]
      : [];
  const fund = fundForm ?? fundInfo;

  return (
    <div className="grid gap-6">
{section === "blood" && (
        <>
      {/* ------------------------- blood requests ------------------------- */}
      <div className={card}>
        <SectionTitle blurb="Urgent requests posted by members. Mark resolved once the blood is managed.">
          Blood Requests ({bloodRequests.filter((r) => !r.resolved).length} active)
        </SectionTitle>
        <div className="mt-4 space-y-3">
          {bloodRequests.length === 0 && <p className="text-sm text-muted">No requests posted yet.</p>}
          {[...bloodRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
            <div key={r.id} className="rounded-2xl border border-ivory/10 bg-ink p-4">
              <p className="text-sm font-semibold text-ivory">
                {r.patientName}, <span className="text-red-300">{r.bloodGroup}</span>
                {r.resolved && <span className="ml-2 text-xs text-emerald-300">✓ resolved</span>}
              </p>
              <p className="mt-1 text-xs text-muted">
                {r.hospital} · {r.district} · ☎ {r.contact} · by {r.posterName}
              </p>
              {isSuperAdmin && (
                <div className="mt-3 flex gap-2">
                  <button className={btnGhost} onClick={() => updateBloodRequest(r.id, { resolved: !r.resolved })}>
                    {r.resolved ? "Reopen" : "Mark resolved"}
                  </button>
                  <button className={btnDanger} onClick={() => removeBloodRequest(r.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

        </>
      )}
{section === "stories" && (
        <>
      {/* --------------------------- hall of fame --------------------------- */}
      {canContent && (
        <div className={card}>
          <SectionTitle blurb="Celebrate notable alumni on the Success Stories page.">
            Hall of Fame
          </SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Name" value={storyForm.name} onChange={(e) => setStoryForm({ ...storyForm, name: e.target.value })} />
            <input className={inputCls} placeholder="Achievement, e.g. BCS Cadre · Dhaka University" value={storyForm.title} onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })} />
            <select className={inputCls} value={storyForm.batch} onChange={(e) => setStoryForm({ ...storyForm, batch: e.target.value })}>
              {BATCH_YEARS.map((y) => <option key={y} value={y}>Batch {y}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <ImagePick label={storyForm.photoURL ? "✓ Photo chosen, change" : "📷 Photo (optional)"} onPick={(url) => setStoryForm({ ...storyForm, photoURL: url })} />
            </div>
            <textarea className={`${inputCls} sm:col-span-2`} rows={3} placeholder="Their story…" value={storyForm.story} onChange={(e) => setStoryForm({ ...storyForm, story: e.target.value })} />
            <button
              className={`${btnPrimary} sm:col-span-2`}
              disabled={!storyForm.name.trim() || !storyForm.title.trim() || !storyForm.story.trim()}
              onClick={async () => {
                await addStory({
                  name: storyForm.name.trim(),
                  batch: storyForm.batch,
                  title: storyForm.title.trim(),
                  story: storyForm.story.trim(),
                  photoURL: storyForm.photoURL || undefined,
                });
                setStoryForm({ name: "", batch: "2015", title: "", story: "", photoURL: "" });
              }}
            >
              Add to Hall of Fame
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {stories.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ivory/10 bg-ink px-4 py-3">
                <p className="text-sm text-ivory">{s.name} <span className="text-xs text-muted">· Batch {s.batch} · {s.title}</span></p>
                <button className={btnDanger} onClick={() => removeStory(s.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

        </>
      )}
{section === "listings" && (
        <>
      {/* ------------------------- businesses / mentors ------------------------- */}
      <div className={card}>
        <SectionTitle blurb="Moderate member-submitted listings.">
          Businesses & Mentors
        </SectionTitle>
        <div className="mt-4 space-y-2">
          {businesses.length === 0 && mentors.length === 0 && (
            <p className="text-sm text-muted">No listings yet.</p>
          )}
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ivory/10 bg-ink px-4 py-3">
              <p className="text-sm text-ivory">{b.name} <span className="text-xs text-muted">· {b.ownerName} ({b.ownerBatch})</span></p>
              <button className={btnDanger} onClick={() => removeBusiness(b.id)}>Remove</button>
            </div>
          ))}
          {mentors.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ivory/10 bg-ink px-4 py-3">
              <p className="text-sm text-ivory">{m.name} <span className="text-xs text-muted">· {m.expertise}</span></p>
              <button className={btnDanger} onClick={() => removeMentor(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

        </>
      )}
{section === "fund" && (
        <>
      {/* ------------------------------ fund ------------------------------ */}
      {(isSuperAdmin || canContent) && (
        <div className={card}>
          <SectionTitle blurb="Scholarship & Donation Fund, totals, bKash number and the honour roll.">
            Scholarship Fund
          </SectionTitle>
          {isSuperAdmin && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>bKash number (donations)</label>
                <input className={inputCls} value={fund.bkash} onChange={(e) => setFundForm({ ...fund, bkash: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className={labelCls}>Students helped</label>
                <input className={inputCls} value={fund.studentsHelped} onChange={(e) => setFundForm({ ...fund, studentsHelped: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Total raised (৳)</label>
                <input className={inputCls} value={fund.totalRaised} onChange={(e) => setFundForm({ ...fund, totalRaised: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Total awarded (৳)</label>
                <input className={inputCls} value={fund.totalAwarded} onChange={(e) => setFundForm({ ...fund, totalAwarded: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>About the fund</label>
                <textarea className={inputCls} rows={2} value={fund.aboutText} onChange={(e) => setFundForm({ ...fund, aboutText: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>How to apply</label>
                <textarea className={inputCls} rows={2} value={fund.applyText} onChange={(e) => setFundForm({ ...fund, applyText: e.target.value })} />
              </div>
              <button className={`${btnPrimary} sm:col-span-2`} onClick={async () => { await saveFundInfo(fund); setFundForm(null); }}>
                Save fund settings
              </button>
            </div>
          )}
          {canContent && (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Donor name" value={donorForm.name} onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })} />
                <input className={inputCls} placeholder="Amount, e.g. ৳5,000" value={donorForm.amount} onChange={(e) => setDonorForm({ ...donorForm, amount: e.target.value })} />
                <input className={inputCls} placeholder="Batch (optional)" value={donorForm.batch} onChange={(e) => setDonorForm({ ...donorForm, batch: e.target.value })} />
                <input className={inputCls} placeholder="Note (optional)" value={donorForm.note} onChange={(e) => setDonorForm({ ...donorForm, note: e.target.value })} />
                <button
                  className={`${btnPrimary} sm:col-span-2`}
                  disabled={!donorForm.name.trim()}
                  onClick={async () => {
                    await addFundDonor({
                      name: donorForm.name.trim(),
                      batch: donorForm.batch.trim() || undefined,
                      amount: donorForm.amount.trim() || undefined,
                      note: donorForm.note.trim() || undefined,
                    });
                    setDonorForm({ name: "", batch: "", amount: "", note: "" });
                  }}
                >
                  Add to honour roll
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {fundDonors.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ivory/10 bg-ink px-4 py-2.5">
                    <p className="text-sm text-ivory">{d.name} <span className="text-xs text-muted">{d.amount ?? ""}</span></p>
                    <button className={btnDanger} onClick={() => removeFundDonor(d.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

        </>
      )}
{section === "batches" && (
        <>
      {/* --------------------------- batch links --------------------------- */}
      {(isSuperAdmin || isBatchRep) && (
        <div className={card}>
          <SectionTitle blurb="WhatsApp group invite link per batch, shown on the Batch Groups page.">
            Batch WhatsApp Links
          </SectionTitle>
          {!isSuperAdmin && (
            <p className="mt-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-2.5 text-xs text-gold-2">
              As a Batch Rep you manage your own batch only: Batch {user?.batch}. Other batches stay with the super admin.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {visibleBatches.length === 0 && <p className="text-sm text-muted">No approved members yet.</p>}
            {visibleBatches.map((batch) => {
              const current = batchLinks.find((b) => b.id === batch)?.link ?? "";
              const draft = linkDrafts[batch] ?? current;
              return (
                <div key={batch} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-sm font-bold text-gold-2">{batch}</span>
                  <input
                    className={inputCls}
                    placeholder="https://chat.whatsapp.com/…"
                    value={draft}
                    onChange={(e) => setLinkDrafts({ ...linkDrafts, [batch]: e.target.value })}
                  />
                  <button className={btnGhost} onClick={() => setBatchLink(batch, draft.trim())}>Save</button>
                </div>
              );
            })}
          </div>
        </div>
      )}        </>
      )}

    </div>
  );
}
