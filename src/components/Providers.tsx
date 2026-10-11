"use client";

import { AuthProvider } from "@/lib/auth-context";

/** Client-side providers wrapper (auth context) for the root layout. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
