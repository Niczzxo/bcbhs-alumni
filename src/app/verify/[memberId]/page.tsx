import { Suspense } from "react";
import VerifyView from "./VerifyView";

/** Params promise is consumed via `use()` inside Suspense, prerender-safe. */
export default function VerifyPage({ params }: { params: Promise<{ memberId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <VerifyView params={params} />
    </Suspense>
  );
}
