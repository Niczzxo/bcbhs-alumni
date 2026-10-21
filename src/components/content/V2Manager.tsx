"use client";

/* ------------------------------------------------------------------ */
/*  v2.0 community-feature management for the staff dashboards:        */
/*  blood requests, polls, hall of fame, businesses, memory wall,      */
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

export default function V2Manager() {
  const { user, members, hasPermission, isSuperAdmin } = useAuth();
  const {
    bloodRequests, updateBloodRequest, removeBloodRequest,
    polls, addPoll, updatePoll, removePoll, pollVotes,
    stories, addStory, removeStory,
    businesses, removeBusiness,
    wallPhotos, addWallPhoto, removeWallPhoto,
    mentors, removeMentor,
    fundInfo, saveFundInfo, fundDonors, addFundDonor, removeFundDonor,
    batchLinks, setBatchLink,
  } = useContent();

  const canContent = hasPermission("post_announcements");
  const [pollForm, setPollForm] = useState({ question: "", options: "" });
  const [storyForm, setStoryForm] = useState({ name: "", batch: "2015", title: "", story: "", photoURL: "" });
  const [wallForm, setWallForm] = useState({ url: "", caption: "", year: "" });
  const [fundForm, setFundForm] = useState<null | typeof fundInfo>(null);
  const [donorForm, setDonorForm] = useState({ name: "", batch: "", amount: "", note: "" });
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});

  if (!user) return null;
  const batchesWithMembers = [...new Set(members.filter((m) => m.status === "approved").map((m) => m.batch))].sort().reverse();
  const fund = fundForm ?? fundInfo;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* ------------------------- blood requests ------------------------- */}
      <div className={card}>
        <SectionTitle blurb="Urgent requests posted by members. Mark resolved once the blood is managed.">
          🩸 Blood Requests ({bloodRequests.filter((r) => !r.resolved).length} active)
        </SectionTitle>
        <div className="mt-4 space-y-3">
          {bloodRequests.length === 0 && <p className="text-sm text-muted">No requests posted yet.</p>}
          {[...bloodRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
            <div key={r.id} className="rounded-2xl border border-ivory/10 bg-ink p-4">
              <p className="text-sm font-semibold text-ivory">
                {r.patientName} — <span className="text-red-300">{r.bloodGroup}</span>
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

      {/* ------------------------------ polls ------------------------------ */}
      {canContent && (
        <div className={card}>
          <SectionTitle blurb="Create a poll — members vote on the Polls page, one vote each.">
            🗳️ Polls & Voting
          </SectionTitle>
          <div className="mt-4 space-y-3">
            <div>
              <label className={labelCls}>Question</label>
              <input className={inputCls} value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} placeholder="e.g. Where should the reunion be held?" />
            </div>
            <div>
              <label className={labelCls}>Options (one per line)</label>
              <textarea className={inputCls} rows={3} value={pollForm.options} onChange={(e) => setPollForm({ ...pollForm, options: e.target.value })} placeholder={"School Field\nConvention Centre\nMomo Inn Park"} />
            </div>
            <button
              className={btnPrimary}
              disabled={!pollForm.question.trim() || pollForm.options.split("\n").filter((o) => o.trim()).length < 2}
              onClick={async () => {
                await addPoll({
                  question: pollForm.question.trim(),
                  options: pollForm.options.split("\n").map((o) => o.trim()).filter(Boolean),
                  active: true,
                });
                setPollForm({ question: "", options: "" });
              }}
            >
              Publish poll
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {polls.map((p) => (
              <div key={p.id} className="rounded-2xl border border-ivory/10 bg-ink p-4">
                <p className="text-sm font-semibold text-ivory">{p.question}</p>
                <p className="mt-1 text-xs text-muted">
                  {pollVotes.filter((v) => v.pollId === p.id).length} votes · {p.active ? "Open" : "Closed"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button className={btnGhost} onClick={() => updatePoll(p.id, { active: !p.active })}>
                    {p.active ? "Close voting" : "Reopen"}
                  </button>
                  <button className={btnDanger} onClick={() => removePoll(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------- hall of fame --------------------------- */}
      {canContent && (
        <div className={card}>
          <SectionTitle blurb="Celebrate notable alumni on the Success Stories page.">
            🏆 Hall of Fame
          </SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Name" value={storyForm.name} onChange={(e) => setStoryForm({ ...storyForm, name: e.target.value })} />
            <input className={inputCls} placeholder="Achievement — e.g. BCS Cadre · Dhaka University" value={storyForm.title} onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })} />
            <select className={inputCls} value={storyForm.batch} onChange={(e) => setStoryForm({ ...storyForm, batch: e.target.value })}>
              {BATCH_YEARS.map((y) => <option key={y} value={y}>Batch {y}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <ImagePick label={storyForm.photoURL ? "✓ Photo chosen — change" : "📷 Photo (optional)"} onPick={(url) => setStoryForm({ ...storyForm, photoURL: url })} />
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

      {/* ------------------------- businesses / mentors ------------------------- */}
      <div className={card}>
        <SectionTitle blurb="Moderate member-submitted listings.">
          🏪 Businesses & 🎓 Mentors
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
              <p className="text-sm text-ivory">🎓 {m.name} <span className="text-xs text-muted">· {m.expertise}</span></p>
              <button className={btnDanger} onClick={() => removeMentor(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------- memory wall ---------------------------- */}
      {isSuperAdmin && (
        <div className={card}>
          <SectionTitle blurb="Super-admin only. Old school photos for the Memory Wall.">
            🖼️ Memory Wall
          </SectionTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <ImagePick label={wallForm.url ? "✓ Photo chosen — change" : "📷 Choose old photo"} onPick={(url) => setWallForm({ ...wallForm, url })} />
              {wallForm.url && <span className="text-xs text-emerald-300">Ready</span>}
            </div>
            <input className={inputCls} placeholder="Caption — e.g. Class VIII, Section A, annual sports day" value={wallForm.caption} onChange={(e) => setWallForm({ ...wallForm, caption: e.target.value })} />
            <input className={inputCls} placeholder="Year (optional) — e.g. 2009" value={wallForm.year} onChange={(e) => setWallForm({ ...wallForm, year: e.target.value })} />
            <button
              className={btnPrimary}
              disabled={!wallForm.url || !wallForm.caption.trim()}
              onClick={async () => {
                await addWallPhoto({ url: wallForm.url, caption: wallForm.caption.trim(), year: wallForm.year.trim() || undefined });
                setWallForm({ url: "", caption: "", year: "" });
              }}
            >
              Add to Memory Wall
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {wallPhotos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption} className="h-20 w-full object-cover" />
                <button
                  onClick={() => removeWallPhoto(p.id)}
                  className="absolute inset-x-0 bottom-0 bg-red-900/85 py-1 text-[10px] font-bold uppercase tracking-widest text-red-100 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------ fund ------------------------------ */}
      {(isSuperAdmin || canContent) && (
        <div className={card}>
          <SectionTitle blurb="Scholarship & Donation Fund — totals, bKash number and the honour roll.">
            🤲 Scholarship Fund
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
                <input className={inputCls} placeholder="Amount — e.g. ৳5,000" value={donorForm.amount} onChange={(e) => setDonorForm({ ...donorForm, amount: e.target.value })} />
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

      {/* --------------------------- batch links --------------------------- */}
      {isSuperAdmin && (
        <div className={card}>
          <SectionTitle blurb="WhatsApp group invite link per batch — shown on the Batch Groups page.">
            👥 Batch WhatsApp Links
          </SectionTitle>
          <div className="mt-4 space-y-3">
            {batchesWithMembers.length === 0 && <p className="text-sm text-muted">No approved members yet.</p>}
            {batchesWithMembers.map((batch) => {
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
      )}
    </div>
  );
}
