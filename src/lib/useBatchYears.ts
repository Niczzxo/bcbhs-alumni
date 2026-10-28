"use client";

import { useEffect, useState } from "react";
import { BATCH_YEARS, batchYearsUpTo } from "./types";

/* Batch years up to the CURRENT year (owner, 2026-10-28): a new SSC
   batch must be registrable the year it passes out, without a code
   push, and never a future year. The static list is the first-render
   fallback; the effect extends it on mount when the calendar year
   has moved past it (same client-only-date pattern as the
   registration form's dob max). */
export function useBatchYears(): string[] {
  const [years, setYears] = useState(BATCH_YEARS);
  useEffect(() => {
    const y = new Date().getFullYear();
    if (y > Number(BATCH_YEARS[0])) setYears(batchYearsUpTo(y));
  }, []);
  return years;
}
