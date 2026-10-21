"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AuthModalProvider } from "@/components/AuthModal";
import { ContentProvider } from "@/lib/content-context";
import StatsSync from "@/components/StatsSync";

/** Client-side providers wrapper for the root layout. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ContentProvider>
        <StatsSync />
        <AuthModalProvider>{children}</AuthModalProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
