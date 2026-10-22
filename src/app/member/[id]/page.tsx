import { Suspense } from "react";
import MemberView from "./MemberView";

/** Params promise is consumed via `use()` inside Suspense, prerender-safe. */
export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <MemberView params={params} />
    </Suspense>
  );
}
