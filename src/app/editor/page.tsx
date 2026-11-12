"use client";

import { useCallback, useMemo, useState } from "react";
import RequireRole from "@/components/RequireRole";
import DashboardShell, { type DashSection } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import ContentManager from "@/components/content/ContentManager";
import V2Manager, { V2_SECTIONS } from "@/components/content/V2Manager";
import BatchModeration from "@/components/BatchModeration";
import PendingApprovals from "@/components/PendingApprovals";
import OverviewPanel from "@/components/content/OverviewPanel";
import type { ContentKind } from "@/components/content/ContentManager";

/**
 * The EDITOR dashboard (owner's rules, 2026-10-23): every staff role
 * has its own separate panel, and inside it every sector sits in a
 * sidebar, one click opens one sector's work area. Editors manage
 * content only; member approvals and roles live in the admin panels.
 */
export default function EditorPage() {
  const { members, loading, approveMember, rejectMember, hasPermission } = useAuth();

  /* Pending registrations for the Approvals sector (editors with the
     approve_members grant see them — the auth context fetches the
     full member list for grant-holding editors). */
  /* Unverified registrations stay out of the queue (owner, 2026-11-13):
     the member has not clicked the inbox link yet, so there is nothing
     to approve. Members from before verification have no flag and
     still show. */
  const pending = useMemo(
    () => members.filter((m) => m.status === "pending" && m.emailVerified !== false),
    [members],
  );
  const approved = useMemo(() => members.filter((m) => m.status === "approved"), [members]);
  const banned = useMemo(() => members.filter((m) => m.status === "banned"), [members]);
  const batchReps = useMemo(() => members.filter((m) => m.status === "approved" && m.role === "admin"), [members]);
  const editors = useMemo(() => members.filter((m) => m.role === "editor"), [members]);
  const canApprove = hasPermission("approve_members");
  const canSeeData = hasPermission("view_member_data");
  const canModerate = hasPermission("moderate_members");

  /* Controlled dashboard key so the Overview's cards and Quick
     Actions can jump into sectors, like the super admin's overview. */
  const [dashKey, setDashKey] = useState("overview");
  const handleJump = useCallback((key: string) => setDashKey(key), []);

  const kinds: { kind: ContentKind; perm: string; label: string }[] = (
    [
      { kind: "events", perm: "manage_events", label: "Events" },
      { kind: "announcements", perm: "post_announcements", label: "Announcements" },
      { kind: "gallery", perm: "manage_gallery", label: "Gallery" },
      { kind: "committee", perm: "manage_committee", label: "Committee" },
    ] as { kind: ContentKind; perm: string; label: string }[]
  ).filter((s) => hasPermission(s.perm));
  const kindsMemo = useMemo(() => kinds, [kinds]);

  /* Quick Actions for the editor overview (owner, 2026-11-11): only
     the sectors this editor actually has, in sidebar order. */
  const editorActions = useMemo(
    () => [
      ...(canApprove ? [{ label: "Approvals", key: "approvals" }] : []),
      ...(canModerate ? [{ label: "Moderation", key: "moderation" }] : []),
      ...kindsMemo.map((s) => ({ label: s.label, key: s.kind })),
      ...V2_SECTIONS.filter((v) => !v.needsContentPerm || hasPermission("post_announcements")).map((v) => ({
        label: v.label,
        key: `v2-${v.key}`,
      })),
    ],
    [canApprove, canModerate, kindsMemo, hasPermission],
  );

  const sections: DashSection[] = useMemo<DashSection[]>(() => [
    {
      key: "overview",
      label: "Overview",
      content: (
        <OverviewPanel
          variant="editor"
          approved={approved.length}
          pending={pending.length}
          banned={banned.length}
          batchReps={batchReps.length}
          editors={editors.length}
          members={members}
          onJump={handleJump}
          canApprove={canApprove}
          canModerate={canModerate}
          actions={editorActions}
        />
      ),
    },
    ...(hasPermission("approve_members")
      ? [
          {
            key: "approvals",
            label: "Approvals",
            badge: pending.length,
            content: (
              <PendingApprovals
                pending={pending}
                loading={loading}
                canApprove={canApprove}
                canSeeData={canSeeData}
                onApprove={approveMember}
                onReject={rejectMember}
              />
            ),
          } as DashSection,
        ]
      : []),
    ...(hasPermission("moderate_members")
      ? [
          {
            key: "moderation",
            label: "Moderation",
            content: <BatchModeration />,
          } as DashSection,
        ]
      : []),
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
  ], [kindsMemo, hasPermission, pending, approved, banned, batchReps, editors, members, loading, canApprove, canSeeData, canModerate, approveMember, rejectMember, handleJump, editorActions]);

  return (
    <RequireRole role="editor" eyebrow="Content team" title={<>Editor <span className="text-gold-gradient">Dashboard</span></>}>
      <DashboardShell sections={sections} activeKey={dashKey} onActiveChange={setDashKey} />
    </RequireRole>
  );
}
