import type { Metadata } from "next";
import { Suspense } from "react";

import { LabNav } from "./lab-nav";
import "./design.css";

// The lab's heading face is the SAME Urbanist the app loads (root layout's
// --font-display): the live Reference inherits it natively, and the Sandbox's
// .font-opt-urbanist now points at it too (design.css), so there is no second
// font load. The design.css -> globals.css token dedup stays the Phase 8
// follow-up.

// Never indexed, never linked: the lab exists only behind the gate
// (see gate.ts; production 404s without the key).
export const metadata: Metadata = {
  title: "V1 design lab",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      {/* useSearchParams (the key) needs a Suspense boundary; every lab route
          is already dynamic via requireDesignKey, so this never suspends long. */}
      <Suspense>
        <LabNav />
      </Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
