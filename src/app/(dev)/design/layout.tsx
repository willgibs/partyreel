import type { Metadata } from "next";
import { Suspense } from "react";

import { LabNav } from "./lab-nav";
import "./design.css";
// The production marketing sheet loads in the lab on purpose (the library round,
// 2026-09-02): the sandbox's marketing boards and the marketing library render
// on the real [data-mkt-*] grammar instead of a lab copy. Its containment
// contract (no :root, no bare elements, mkt- keyframes, tokens on [data-mkt])
// is what makes loading it here harmless to every other lab page.
import "@/app/(marketing)/marketing.css";

// The lab's heading face is the SAME Urbanist the app loads (root layout's
// --font-display): the live Reference inherits it natively, and the Sandbox's
// .font-opt-urbanist now points at it too (design.css), so there is no second
// font load. The design.css -> globals.css token dedup stays the Phase 8
// follow-up.

// Never indexed, never linked: the lab exists only behind the gate
// (see src/lib/design-gate; production 404s without the key).
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
