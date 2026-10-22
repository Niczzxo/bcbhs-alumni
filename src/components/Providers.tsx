"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AuthModalProvider } from "@/components/AuthModal";
import { ContentProvider } from "@/lib/content-context";
import StatsSync from "@/components/StatsSync";
import VerifySync from "@/components/VerifySync";

/** Client-side providers wrapper for the root layout. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ContentProvider>
        <StatsSync />
        <VerifySync />
        <AuthModalProvider>{children}</AuthModalProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
