"use client";

import RequireRole from "@/components/RequireRole";
import Reveal from "@/components/Reveal";
import { Avatar } from "@/components/MemberCard";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/types";
import type { UserProfile } from "@/lib/types";

/** Super admin — full control: roles, granular permissions, stats. */
export default function SuperAdminPage() {
  const { members, setPermissions, setRole, approveMember, rejectMember } = useAuth();

  const approved = members.filter((m) => m.status === "approved");
  const pending = members.filter((m) => m.status === "pending");
  const abroad = approved.filter((m) => m.isAbroad);
  const admins = members.filter((m) => m.role === "admin" || m.role === "super_admin");

  const togglePerm = (m: UserProfile, key: string) => {
    const next = m.permissions.includes(key)
      ? m.permissions.filter((p) => p !== key)
      : [...m.permissions, key];
    setPermissions(m.id, next);
  };

  const cycleRole = (m: UserProfile) => {
    if (m.role === "member") setRole(m.id, "admin");
    else if (m.role === "admin") setRole(m.id, "member");
    /* super_admin is never demoted from the UI */
  };

  return (
    <RequireRole role="super_admin" eyebrow="Full access" title={<>Super Admin <span className="text-gold-gradient">Dashboard</span></>}>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          ["Approved members", approved.length],
          ["Pending approvals", pending.length],
          ["Living abroad", abroad.length],
          ["Admins", admins.length],
        ].map(([label, value], i) => (
          <Reveal key={label as string} delay={i * 0.07} className="rounded-3xl border border-ivory/10 bg-ink-2 p-6 text-center">
            <p className="font-display text-gold-gradient text-4xl font-extrabold">{value}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
          </Reveal>
        ))}
      </div>

      {/* Admin access management */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold text-ivory">Admin access control</h2>
        <p className="mt-2 text-sm text-muted">
          Promote members to admin, then toggle exactly what each admin may do. Super admin always has full access.
        </p>
        <div className="gold-rule mt-4 w-32" />
        <div className="mt-8 space-y-5">
          {members
            .filter((m) => m.status === "approved")
            .map((m) => (
              <Reveal key={m.id} className="rounded-3xl border border-ivory/10 bg-ink-2 p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ivory">
                      {m.name} <span className="text-xs text-muted">· Batch {m.batch} · {m.email}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${m.role === "super_admin" ? "bg-gold/20 text-gold-2" : m.role === "admin" ? "bg-ivory/10 text-ivory" : "bg-emerald-500/15 text-emerald-300"}`}>
                    {m.role.replace("_", " ")}
                  </span>
                  {m.role !== "super_admin" && (
                    <button
                      onClick={() => cycleRole(m)}
                      className="rounded-full border border-gold/40 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold-2 hover:bg-gold/10"
                    >
                      {m.role === "admin" ? "Demote to member" : "Make admin"}
                    </button>
                  )}
                </div>
                {m.role === "admin" && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {PERMISSIONS.map((p) => {
                      const on = m.permissions.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          onClick={() => togglePerm(m, p.key)}
                          className={`rounded-2xl border p-4 text-left transition-all ${on ? "border-gold/60 bg-gold/10" : "border-ivory/10 bg-ink hover:border-gold/30"}`}
                        >
                          <p className="flex items-center justify-between text-sm font-semibold text-ivory">
                            {p.label}
                            <span className={`ml-2 inline-block h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-gold" : "bg-ivory/20"}`}>
                              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted">{p.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Reveal>
            ))}
        </div>
      </section>

      {/* Quick approvals */}
      {pending.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-ivory">
            Pending approvals <span className="text-gold-2">({pending.length})</span>
          </h2>
          <div className="gold-rule mt-4 w-32" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-ivory/10 bg-ink-2 p-5">
                <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ivory">{m.name}</p>
                  <p className="text-xs text-muted">Batch {m.batch} · {m.district} · {m.email}</p>
                </div>
                <button onClick={() => approveMember(m.id)} className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink">
                  Approve
                </button>
                <button onClick={() => rejectMember(m.id)} className="rounded-full border border-red-400/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-300">
                  Reject
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </RequireRole>
  );
}
