"use client";

import { useRef, useState } from "react";
import { compressImageToDataURL } from "@/lib/image";
import { useContent } from "@/lib/content-context";
import { inputCls, labelCls } from "@/components/auth/ui";
import type {
  AnnouncementItem,
  CommitteeSeat,
  GalleryPhoto,
  PortalEvent,
} from "@/lib/types";

export type ContentKind = "events" | "gallery" | "committee" | "announcements";

const KIND_META: Record<ContentKind, { title: string; blurb: string; addLabel: string }> = {
  events: {
    title: "Events",
    blurb: "Reunions, workshops, drives, upcoming and past.",
    addLabel: "Add event",
  },
  gallery: {
    title: "Gallery",
    blurb: "Photos of campus life, reunions and memories.",
    addLabel: "Add photo",
  },
  committee: {
    title: "Committee",
    blurb: "Leadership seats, who holds which position.",
    addLabel: "Add seat",
  },
  announcements: {
    title: "Announcements",
    blurb: "Notices published to all members.",
    addLabel: "Add announcement",
  },
};

const btnDanger =
  "rounded-full border border-red-400/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10";
const btnEdit =
  "rounded-full border border-ivory/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted hover:border-gold/40 hover:text-gold-2";
const btnPrimary =
  "rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-60";

function PhotoPicker({
  value,
  onChange,
  maxDim,
  quality,
}: {
  value: string;
  onChange: (v: string) => void;
  maxDim: number;
  quality: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImageToDataURL(file, maxDim, quality));
      setErr("");
    } catch {
      setErr("Could not process that image.");
    }
    setBusy(false);
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex w-full items-center gap-4 rounded-xl border border-dashed border-ivory/20 bg-ink px-4 py-3 text-left transition-colors hover:border-gold/50 disabled:opacity-60"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gold/50" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-3 text-xl text-gold-2">🖼️</span>
        )}
        <span className="text-xs text-muted">
          {busy ? "Processing…" : value ? <>Photo set ✓, <span className="text-gold-2 underline">tap to change</span></> : "Tap to upload a photo"}
        </span>
      </button>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}

/* ------------------------------- forms -------------------------------- */

/** How many pictures one event may carry (kept modest: the pictures
    live inside the event document as data URLs). */
const MAX_EVENT_IMAGES = 5;

function EventForm({ initial, onDone }: { initial?: PortalEvent; onDone: () => void }) {
  const { addEvent, updateEvent } = useContent();
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    date: initial?.date ?? "",
    venue: initial?.venue ?? "",
    description: initial?.description ?? "",
    upcoming: initial?.upcoming ?? true,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].filter((x) => x.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    setImgBusy(true);
    try {
      const room = MAX_EVENT_IMAGES - images.length;
      const added: string[] = [];
      for (const file of files.slice(0, room)) {
        added.push(await compressImageToDataURL(file, 900, 0.72));
      }
      setImages((p) => [...p, ...added]);
      setImgErr(files.length > room ? `Only ${MAX_EVENT_IMAGES} pictures per event, the rest were skipped.` : "");
    } catch {
      setImgErr("Could not process one of those images.");
    }
    setImgBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.date) return;
    setBusy(true);
    const payload = { ...f, images };
    if (initial) await updateEvent(initial.id, payload);
    else await addEvent(payload);
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className={labelCls}>Title *</label><input className={inputCls} value={f.title} onChange={set("title")} placeholder="Grand Reunion 2026" /></div>
      <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={f.date} onChange={set("date")} /></div>
      <div><label className={labelCls}>Venue</label><input className={inputCls} value={f.venue} onChange={set("venue")} placeholder="BCBHS School Field" /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea className={inputCls} rows={3} value={f.description} onChange={set("description")} /></div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Event pictures (up to {MAX_EVENT_IMAGES})</label>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {images.map((src, i) => (
              <span key={i} className="group relative block h-20 w-20 overflow-hidden rounded-xl ring-1 ring-gold/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Event picture ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  aria-label={`Remove picture ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] font-bold text-white transition-colors hover:bg-red-600"
                >
                  ×
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-gold-2">Cover</span>
                )}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={imgBusy || images.length >= MAX_EVENT_IMAGES}
          className="flex w-full items-center gap-4 rounded-xl border border-dashed border-ivory/20 bg-ink px-4 py-3 text-left transition-colors hover:border-gold/50 disabled:opacity-60"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-3 text-xl text-gold-2">🖼️</span>
          <span className="text-xs text-muted">
            {imgBusy
              ? "Processing…"
              : images.length >= MAX_EVENT_IMAGES
                ? `Maximum ${MAX_EVENT_IMAGES} pictures added`
                : images.length
                  ? <>Add more pictures, <span className="text-gold-2 underline">tap to choose</span> ({images.length}/{MAX_EVENT_IMAGES})</>
                  : "Tap to upload pictures, you can choose several at once"}
          </span>
        </button>
        {imgErr && <p className="mt-2 text-xs text-red-300">{imgErr}</p>}
      </div>
      <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
        <input type="checkbox" checked={f.upcoming} onChange={() => setF((p) => ({ ...p, upcoming: !p.upcoming }))} className="h-4 w-4 accent-[#d4a94e]" />
        <span className="text-sm text-ivory/90">Upcoming event</span>
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : initial ? "Save changes" : "Add event"}</button>
        <button type="button" onClick={onDone} className={btnEdit}>Cancel</button>
      </div>
    </form>
  );
}

function GalleryForm({ initial, onDone }: { initial?: GalleryPhoto; onDone: () => void }) {
  const { addPhoto, updatePhoto } = useContent();
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState(initial?.src ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!src || !caption.trim()) return;
    setBusy(true);
    if (initial) await updatePhoto(initial.id, { src, caption });
    else await addPhoto({ src, caption });
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div><label className={labelCls}>Photo *</label><PhotoPicker value={src} onChange={setSrc} maxDim={1024} quality={0.8} /></div>
      <div><label className={labelCls}>Caption *</label><input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Reunion 2024, grand gathering" /></div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : initial ? "Save changes" : "Add photo"}</button>
        <button type="button" onClick={onDone} className={btnEdit}>Cancel</button>
      </div>
    </form>
  );
}

function CommitteeForm({ initial, onDone }: { initial?: CommitteeSeat; onDone: () => void }) {
  const { addSeat, updateSeat } = useContent();
  const [busy, setBusy] = useState(false);
  const [photoURL, setPhotoURL] = useState(initial?.photoURL ?? "");
  const [f, setF] = useState({
    role: initial?.role ?? "",
    name: initial?.name ?? "",
    batch: initial?.batch ?? "",
    note: initial?.note ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.role.trim() || !f.name.trim()) return;
    setBusy(true);
    const data = { ...f, photoURL: photoURL || undefined };
    if (initial) await updateSeat(initial.id, data);
    else await addSeat(data);
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div><label className={labelCls}>Position *</label><input className={inputCls} value={f.role} onChange={set("role")} placeholder="President" /></div>
      <div><label className={labelCls}>Name *</label><input className={inputCls} value={f.name} onChange={set("name")} placeholder="Full name" /></div>
      <div><label className={labelCls}>Batch</label><input className={inputCls} value={f.batch} onChange={set("batch")} placeholder="2015" /></div>
      <div><label className={labelCls}>Photo</label><PhotoPicker value={photoURL} onChange={setPhotoURL} maxDim={512} quality={0.78} /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Note</label><textarea className={inputCls} rows={2} value={f.note} onChange={set("note")} placeholder="What this seat is responsible for…" /></div>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : initial ? "Save changes" : "Add seat"}</button>
        <button type="button" onClick={onDone} className={btnEdit}>Cancel</button>
      </div>
    </form>
  );
}

function AnnouncementForm({ initial, onDone }: { initial?: AnnouncementItem; onDone: () => void }) {
  const { addAnnouncement, updateAnnouncement } = useContent();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    if (initial) await updateAnnouncement(initial.id, { title, body });
    else await addAnnouncement({ title, body });
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div><label className={labelCls}>Title *</label><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" /></div>
      <div><label className={labelCls}>Body *</label><textarea className={inputCls} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the announcement…" /></div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : initial ? "Save changes" : "Publish"}</button>
        <button type="button" onClick={onDone} className={btnEdit}>Cancel</button>
      </div>
    </form>
  );
}

/* ------------------------------ manager ------------------------------- */

export default function ContentManager({ kind }: { kind: ContentKind }) {
  const meta = KIND_META[kind];
  const {
    events, gallery, committee, announcements,
    removeEvent, removePhoto, removeSeat, removeAnnouncement,
  } = useContent();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items =
    kind === "events" ? events
    : kind === "gallery" ? gallery
    : kind === "committee" ? committee
    : announcements;

  const remove =
    kind === "events" ? removeEvent
    : kind === "gallery" ? removePhoto
    : kind === "committee" ? removeSeat
    : removeAnnouncement;

  const labelOf = (it: { id: string }): string => {
    if (kind === "events") return (it as PortalEvent).title;
    if (kind === "gallery") return (it as GalleryPhoto).caption;
    if (kind === "committee") {
      const s = it as CommitteeSeat;
      return `${s.role}, ${s.name}`;
    }
    return (it as AnnouncementItem).title;
  };

  const editingItem = editingId ? items.find((it) => it.id === editingId) ?? null : null;

  return (
    <div className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-ivory">{meta.title}</h3>
          <p className="mt-1 text-xs text-muted">{meta.blurb} · {items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>
        {!adding && !editingId && (
          <button onClick={() => setAdding(true)} className={btnPrimary}>
            + {meta.addLabel}
          </button>
        )}
      </div>

      {(adding || editingItem) && (
        <div className="mt-6 rounded-2xl border border-gold/25 bg-ink p-5 sm:p-6">
          {kind === "events" && (
            <EventForm initial={editingItem as PortalEvent | undefined} onDone={() => { setAdding(false); setEditingId(null); }} />
          )}
          {kind === "gallery" && (
            <GalleryForm initial={editingItem as GalleryPhoto | undefined} onDone={() => { setAdding(false); setEditingId(null); }} />
          )}
          {kind === "committee" && (
            <CommitteeForm initial={editingItem as CommitteeSeat | undefined} onDone={() => { setAdding(false); setEditingId(null); }} />
          )}
          {kind === "announcements" && (
            <AnnouncementForm initial={editingItem as AnnouncementItem | undefined} onDone={() => { setAdding(false); setEditingId(null); }} />
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-ivory/15 p-6 text-center text-sm text-muted">
            Nothing here yet, add the first one.
          </p>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-4 rounded-2xl border border-ivory/10 bg-ink px-4 py-3">
            {kind === "gallery" && (it as GalleryPhoto).src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(it as GalleryPhoto).src} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            ) : kind === "committee" && (it as CommitteeSeat).photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(it as CommitteeSeat).photoURL} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            ) : null}
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-ivory/90">{labelOf(it)}</p>
            <button onClick={() => { setAdding(false); setEditingId(it.id); }} className={btnEdit}>Edit</button>
            <button
              onClick={() => { if (window.confirm(`Delete "${labelOf(it)}"?`)) remove(it.id); }}
              className={btnDanger}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
