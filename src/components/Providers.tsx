"use client";

import { Suspense } from "react";
import { MotionConfig } from "framer-motion";
import RouteProgress from "@/components/RouteProgress";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModalProvider } from "@/components/AuthModal";
import { ContentProvider } from "@/lib/content-context";
import StatsSync from "@/components/StatsSync";
import VerifySync from "@/components/VerifySync";
import BannedGate from "@/components/BannedGate";

/** Client-side providers wrapper for the root layout. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {/* usePathname inside RouteProgress must stream under PPR,
          otherwise it blocks prerendering of dynamic routes. */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <AuthProvider>
      <ContentProvider>
        <StatsSync />
        <VerifySync />
        <BannedGate />
        <AuthModalProvider>{children}</AuthModalProvider>
      </ContentProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
