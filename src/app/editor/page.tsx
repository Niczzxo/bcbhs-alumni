"use client";

import { useMemo } from "react";
import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import DashboardShell, { type DashSection } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import ContentManager from "@/components/content/ContentManager";
import V2Manager, { V2_SECTIONS } from "@/components/content/V2Manager";
import BatchModeration from "@/components/BatchModeration";
import type { ContentKind } from "@/components/content/ContentManager";

/**
 * The EDITOR dashboard (owner's rules, 2026-10-23): every staff role
 * has its own separate panel, and inside it every sector sits in a
 * sidebar, one click opens one sector's work area. Editors manage
 * content only; member approvals and roles live in the admin panels.
 */
export default function EditorPage() {
  const { user, hasPermission } = useAuth();

  const kinds: { kind: ContentKind; perm: string; label: string }[] = (
    [
      { kind: "events", perm: "manage_events", label: "Events" },
      { kind: "announcements", perm: "post_announcements", label: "Announcements" },
      { kind: "gallery", perm: "manage_gallery", label: "Gallery" },
      { kind: "committee", perm: "manage_committee", label: "Committee" },
    ] as { kind: ContentKind; perm: string; label: string }[]
  ).filter((s) => hasPermission(s.perm));
  const kindsMemo = useMemo(() => kinds, [kinds]);

  const sections: DashSection[] = useMemo<DashSection[]>(() => [
    {
      key: "overview",
      label: "Overview",
      content: (
        <Reveal className="rounded-3xl border border-ivory/10 bg-ink-2 p-7">
          <p className="font-display text-xl font-bold text-ivory">
            Welcome, {user?.name} <span className="ml-1 rounded-full bg-gold/15 px-3 py-1 align-middle text-[10px] font-bold uppercase tracking-widest text-gold-2">Editor</span>
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            This is your own workspace. Use the sidebar to jump between sectors, each one opens
            its own work area where you can add, edit or remove content, and everything updates
            on the public site right away. Member approvals, official positions and roles are
            handled from the Batch Rep and Super Admin panels. From the Moderation sector you
            can ban, unban and delete any member, as the super admin's alternative.
          </p>
          {kindsMemo.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {kindsMemo.map((s) => (
                <span key={s.kind} className="rounded-full border border-gold/30 bg-gold/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-2">
                  {s.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">
              No content sections are assigned to your account yet. Ask the super admin to check your editor access.
            </p>
          )}
        </Reveal>
      ),
    },
    {
      key: "moderation",
      label: "Moderation",
      content: <BatchModeration />,
    },
    ...kindsMemo.map((s) => ({
      key: s.kind,
      label: s.label,
      content: <ContentManager kind={s.kind} />,
    })),
    ...V2_SECTIONS.filter((v) => !v.needsContentPerm || hasPermission("post_announcements")).map((v) => ({
      key: `v2-${v.key}`,
      label: v.label,
      content: (
        <div>
          <h2 className="font-display text-2xl font-bold text-ivory">{v.label}</h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8">
            <V2Manager section={v.key} />
          </div>
        </div>
      ),
    })),
  ], [user, kindsMemo, hasPermission]);

  return (
    <RequireRole role="editor" eyebrow="Content team" title={<>Editor <span className="text-gold-gradient">Dashboard</span></>}>
      <DashboardShell sections={sections} />
    </RequireRole>
  );
}
