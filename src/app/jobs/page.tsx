"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";
import { useContent } from "@/lib/content-context";
import { JOB_TYPES, type JobPost } from "@/lib/types";
import { jobWhatsappLink, normalizeWhatsAppNumber } from "@/lib/whatsapp";

/**
 * Job Board, only registered (signed-in) members may view or post.
 * Any member can post a circular; every card carries a WhatsApp button
 * that opens a chat with the poster, pre-filled with a job inquiry.
 */

interface JobFormState {
  title: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  deadline: string;
  description: string;
  requirements: string;
  whatsapp: string;
}

const EMPTY_FORM: JobFormState = {
  title: "",
  company: "",
  location: "",
  jobType: JOB_TYPES[0],
  salary: "",
  deadline: "",
  description: "",
  requirements: "",
  whatsapp: "",
};

function validateJobInput(f: JobFormState): string | null {
  if (!f.title.trim()) return "Job title is required.";
  if (!f.company.trim()) return "Company name is required.";
  if (!f.location.trim()) return "Location is required.";
  if (!f.description.trim()) return "Please write a short job description.";
  if (normalizeWhatsAppNumber(f.whatsapp).length < 8)
    return "Enter a valid WhatsApp contact number.";
  return null;
}

/** Days remaining until the deadline (null when no deadline set). */
function daysLeft(deadline?: string): number | null {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59`).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86400000);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function JobCard({
  job,
  index,
  canModerate,
  onEdit,
  onDelete,
}: {
  job: JobPost;
  index: number;
  canModerate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const left = daysLeft(job.deadline);
  const expired = left !== null && left < 0;

  return (
    <Reveal delay={Math.min(index, 5) * 0.06}>
      <article className="group flex h-full flex-col rounded-3xl border border-ivory/10 bg-ink-2 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-2">
            {job.jobType}
          </span>
          <span className="text-xs text-muted">{formatDate(job.createdAt)}</span>
        </div>

        <h3 className="font-display mt-4 text-2xl font-bold text-ivory transition-colors group-hover:text-gold-2">
          {job.title}
        </h3>
        <p className="mt-1 text-sm font-semibold text-gold">{job.company}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
          📍 {job.location}
          {job.salary ? <span className="text-gold-2"> · {job.salary}</span> : null}
        </p>

        <p
          className={`mt-4 text-sm leading-relaxed text-muted ${expanded ? "" : "line-clamp-3"}`}
        >
          {job.description}
        </p>
        {job.description.length > 140 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 self-start text-xs font-bold uppercase tracking-widest text-gold-2 hover:text-gold"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {expanded && job.requirements && (
          <div className="mt-3 whitespace-pre-line rounded-2xl border border-ivory/10 bg-ink p-4 text-sm leading-relaxed text-ivory/80">
            {job.requirements}
          </div>
        )}

        {job.deadline && (
          <p
            className={`mt-4 text-xs font-bold uppercase tracking-[0.2em] ${
              expired ? "text-red-400" : left !== null && left <= 7 ? "text-gold-2" : "text-muted"
            }`}
          >
            🗓 {expired ? "Application closed" : `Apply by ${formatDate(job.deadline)}${left === 0 ? ", today!" : left !== null && left > 0 ? ` (${left}d left)` : ""}`}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-ivory/10 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-lg font-bold text-gold-2">
            {job.posterName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/member/${job.postedBy}`}
              className="truncate text-sm font-bold text-ivory hover:text-gold-2"
            >
              {job.posterName}
            </Link>
            <p className="text-xs text-muted">Batch {job.posterBatch}</p>
          </div>
          <a
            href={jobWhatsappLink(job.whatsapp, job.title, job.company, user?.name, user?.batch)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-ink shadow-[0_0_20px_rgba(37,211,102,0.35)] transition-transform hover:scale-105"
          >
            <span aria-hidden="true">💬</span> WhatsApp
          </a>
        </div>

        {canModerate && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 rounded-full border border-gold/40 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
            >
              ✎ Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 rounded-full border border-red-400/40 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-400/10"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </article>
    </Reveal>
  );
}

export default function JobsPage() {
  const { user, loading, isAdmin } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { jobs, loading: contentLoading, addJob, updateJob, removeJob } = useContent();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [mineOnly, setMineOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobPost | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((j) => {
      if (mineOnly && user && j.postedBy !== user.id) return false;
      if (typeFilter !== "All" && j.jobType !== typeFilter) return false;
      if (!q) return true;
      return [j.title, j.company, j.location, j.description]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sorted, query, typeFilter, mineOnly, user]);

  const openPostModal = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, whatsapp: user?.whatsapp ?? "" });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (job: JobPost) => {
    setEditing(job);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salary: job.salary ?? "",
      deadline: job.deadline ?? "",
      description: job.description,
      requirements: job.requirements ?? "",
      whatsapp: job.whatsapp,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const set = (k: keyof JobFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    const err = validateJobInput(form);
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        jobType: form.jobType,
        salary: form.salary.trim() || undefined,
        deadline: form.deadline || undefined,
        description: form.description.trim(),
        requirements: form.requirements.trim() || undefined,
        whatsapp: form.whatsapp.trim(),
      };
      if (editing) {
        await updateJob(editing.id, payload);
      } else {
        await addJob({
          ...payload,
          postedBy: user.id,
          posterName: user.name,
          posterBatch: user.batch,
        });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      setFormError("Could not save the job post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (job: JobPost) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    setDeletingId(job.id);
    try {
      await removeJob(job.id);
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-ivory/15 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted/60 outline-none transition-colors focus:border-gold/60";

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Careers & referrals"
          title={<>Job <span className="text-gold-gradient">Board</span></>}
          subtitle="Circulars posted by fellow alumni, juniors find seniors, seniors refer juniors. One tap opens a WhatsApp chat with the poster."
        />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {loading ? (
            <p className="text-center text-muted">Loading…</p>
          ) : !user ? (
            <Reveal className="mx-auto max-w-xl rounded-3xl border border-ivory/10 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Members only</p>
              <p className="mt-2 text-sm text-muted">
                The Job Board is visible only to registered alumni. Please log in to browse
                circulars or post one.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="btn-shimmer mt-6 inline-block rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                Log In
              </button>
            </Reveal>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ivory">
                    Open circulars{" "}
                    <span className="text-sm font-normal text-muted">({filtered.length})</span>
                  </h2>
                  <div className="gold-rule mt-3 w-32" />
                </div>
                <button
                  onClick={openPostModal}
                  className="btn-shimmer rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-7 py-3 text-sm font-bold uppercase tracking-widest text-ink shadow-[0_0_24px_rgba(212,169,78,0.35)] transition-transform hover:scale-105"
                >
                  ＋ Post a Job
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, company, location…"
                  className="w-full max-w-md rounded-full border border-ivory/15 bg-ink-2 px-5 py-3 text-sm text-ivory placeholder:text-muted/60 outline-none focus:border-gold/60"
                />
                <div className="flex flex-wrap gap-2">
                  {["All", ...JOB_TYPES].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                        typeFilter === t
                          ? "bg-gold text-ink"
                          : "border border-ivory/15 text-muted hover:border-gold/50 hover:text-gold-2"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
                  <input
                    type="checkbox"
                    checked={mineOnly}
                    onChange={(e) => setMineOnly(e.target.checked)}
                    className="h-4 w-4 accent-[#d4a94e]"
                  />
                  My posts
                </label>
              </div>

              {contentLoading ? (
                <p className="mt-12 text-center text-muted">Loading circulars…</p>
              ) : filtered.length === 0 ? (
                <div className="mt-12 rounded-3xl border border-dashed border-ivory/15 p-12 text-center">
                  <p className="font-display text-xl font-bold text-ivory">No circulars yet</p>
                  <p className="mt-2 text-sm text-muted">
                    {query || typeFilter !== "All" || mineOnly
                      ? "Nothing matches your filters, try clearing them."
                      : "Be the first to share an opportunity with your juniors."}
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((job, i) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={i}
                      canModerate={!!user && (user.id === job.postedBy || isAdmin)}
                      onEdit={() => openEditModal(job)}
                      onDelete={() => handleDelete(job)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Post / edit modal */}
      <AnimatePresence>
        {modalOpen && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold/25 bg-ink-2 p-7 sm:p-9"
            >
              <h3 className="font-display text-2xl font-bold text-ivory">
                {editing ? "Edit circular" : "Post a job circular"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                Any member who sees it can reach you on WhatsApp with one tap.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Job title *
                    </label>
                    <input value={form.title} onChange={set("title")} placeholder="e.g. Junior Software Engineer" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Company *
                    </label>
                    <input value={form.company} onChange={set("company")} placeholder="e.g. Brain Station 23" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Location *
                    </label>
                    <input value={form.location} onChange={set("location")} placeholder="e.g. Dhaka / Remote" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Job type *
                    </label>
                    <select value={form.jobType} onChange={set("jobType")} className={inputCls}>
                      {JOB_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Salary <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <input value={form.salary} onChange={set("salary")} placeholder="e.g. ৳50,000+" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      Deadline <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <input type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                      WhatsApp number *
                    </label>
                    <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="01XXXXXXXXX" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                    Job description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={4}
                    placeholder="Role, responsibilities, what makes a good fit…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted">
                    Requirements <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={form.requirements}
                    onChange={set("requirements")}
                    rows={3}
                    placeholder="Skills, experience, education…"
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {formError && (
                  <p className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                    {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-full border border-ivory/20 px-6 py-3 text-sm font-bold uppercase tracking-widest text-muted transition-colors hover:text-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || deletingId !== null}
                    className="btn-shimmer flex-1 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-60"
                  >
                    {saving ? "Saving…" : editing ? "Save changes" : "Post circular"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
