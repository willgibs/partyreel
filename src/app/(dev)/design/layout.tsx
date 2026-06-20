import type { Metadata } from "next";
import { Suspense } from "react";
import { Urbanist } from "next/font/google";

import { LabNav } from "./lab-nav";
import "./design.css";

// THE LAB HEADING FACE: Urbanist, matching the shipped app (it swapped off
// Instrument Serif 2026-06-19 - the serif read too thin). Loaded as the VARIABLE
// font (full weight axis) so font-opt-urbanist's bold (700) applies through the
// one swappable token, exactly like globals.css. next/font self-hosts it. The
// lab keeps its OWN copy here so the reference is honest; the full
// design.css -> globals.css token dedup stays the Phase 8 follow-up.
const urbanist = Urbanist({
  variable: "--font-display-urbanist",
  subsets: ["latin"],
});

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
    <div
      className={`${urbanist.variable} min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]`}
    >
      {/* useSearchParams (the key) needs a Suspense boundary; every lab route
          is already dynamic via requireDesignKey, so this never suspends long. */}
      <Suspense>
        <LabNav />
      </Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
