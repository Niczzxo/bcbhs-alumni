"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import ContentManager from "@/components/content/ContentManager";
import V2Manager from "@/components/content/V2Manager";
import type { ContentKind } from "@/components/content/ContentManager";

/**
 * The EDITOR dashboard (owner's rule, 2026-10-23): every staff role
 * has its own separate panel. Editors manage content only, events,
 * announcements, gallery and committee, plus the community sections
 * their bundle covers. Member approvals, positions and roles are NOT
 * here; those belong to the admin and super admin panels.
 */
export default function EditorPage() {
  const { user, hasPermission } = useAuth();

  const contentSections: { kind: ContentKind; perm: string; label: string }[] = (
    [
      { kind: "events", perm: "manage_events", label: "Events" },
      { kind: "announcements", perm: "post_announcements", label: "Announcements" },
      { kind: "gallery", perm: "manage_gallery", label: "Gallery" },
      { kind: "committee", perm: "manage_committee", label: "Committee" },
    ] as { kind: ContentKind; perm: string; label: string }[]
  ).filter((s) => hasPermission(s.perm));

  return (
    <RequireRole role="editor" eyebrow="Content team" title={<>Editor <span className="text-gold-gradient">Dashboard</span></>}>
      <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-7">
        <p className="font-display text-xl font-bold text-ivory">
          Welcome, {user?.name} <span className="ml-1 rounded-full bg-gold/15 px-3 py-1 align-middle text-[10px] font-bold uppercase tracking-widest text-gold-2">Editor</span>
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This is your own workspace. Pick a section below and click to add, edit or remove its
          content, everything updates on the public site right away. Member approvals, official
          positions and roles are handled from the admin panels, so they do not appear here.
        </p>
        {contentSections.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {contentSections.map((s) => (
              <span key={s.kind} className="rounded-full border border-gold/30 bg-gold/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-2">
                {s.label}
              </span>
            ))}
          </div>
        )}
      </Reveal>

      {contentSections.length > 0 ? (
        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          {contentSections.map((s) => (
            <ContentManager key={s.kind} kind={s.kind} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-ivory/10 bg-ink-2 p-6 text-sm text-muted">
          No content sections are assigned to your account yet. Ask the super admin to check your editor access.
        </p>
      )}

      {/* Community features (v2.0), sections self-gate by permission */}
      <div className="mt-14">
        <h2 className="font-display text-2xl font-bold text-ivory">Community features</h2>
        <div className="gold-rule mt-4 w-32" />
        <div className="mt-8">
          <V2Manager />
        </div>
      </div>
    </RequireRole>
  );
}
