"use client";

import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/components/AuthModal";

/** Community polls, one vote per member; members may change their vote
 * while a poll is open. Results are visible to all members live. */
export default function PollsPage() {
  const { polls, pollVotes, castVote } = useContent();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const sorted = useMemo(
    () => [...polls].sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt)),
    [polls],
  );

  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Your voice matters"
          title={<>Polls &amp; <span className="text-gold-gradient">Voting</span></>}
          subtitle="Association decisions, reunion plans, community questions, vote and see the results live."
        />
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
          {!user ? (
            <Reveal className="rounded-3xl border border-gold/30 bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl font-bold text-ivory">Members only</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                Polls are voted on by registered alumni. Log in to cast your vote and see live results.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="btn-shimmer mt-6 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep px-8 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                Log In
              </button>
            </Reveal>
          ) : sorted.length === 0 ? (
            <p className="text-center text-sm text-muted">No polls yet, the association will post the first question soon.</p>
          ) : (
            <div className="space-y-8">
              {sorted.map((poll, i) => {
                const votes = pollVotes.filter((v) => v.pollId === poll.id);
                const total = votes.length;
                const mine = votes.find((v) => v.uid === user.id);
                return (
                  <Reveal key={poll.id} delay={Math.min(i, 3) * 0.06} className="card-lift rounded-3xl border border-ivory/10 bg-ink-2 p-7 transition-all duration-300 hover:border-gold/40">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-display text-xl font-bold leading-snug text-ivory sm:text-2xl">
                        {poll.question}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          poll.active ? "bg-emerald-400/15 text-emerald-300" : "bg-ivory/10 text-muted"
                        }`}
                      >
                        {poll.active ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="mt-6 space-y-3">
                      {poll.options.map((opt, idx) => {
                        const count = votes.filter((v) => v.optionIndex === idx).length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const isMine = mine?.optionIndex === idx;
                        return (
                          <button
                            key={idx}
                            disabled={!poll.active}
                            onClick={() => castVote(poll.id, user.id, idx)}
                            className={`relative block w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors ${
                              isMine
                                ? "border-gold/70 bg-gold/10"
                                : "border-ivory/12 bg-ink hover:border-gold/40"
                            } ${poll.active ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <span
                              className="absolute inset-y-0 left-0 bg-gold/15"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-ivory">
                                {opt} {isMine && <span className="text-gold-2">✓ your vote</span>}
                              </span>
                              <span className="shrink-0 text-xs text-muted">
                                {count} vote{count === 1 ? "" : "s"} · {pct}%
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-muted/70">
                      {total} vote{total === 1 ? "" : "s"} total
                      {poll.active ? " · tap an option to vote or change your vote" : " · voting has ended"}
                    </p>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
