import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

import "./design.css";

// THE LOCKED FACE (round-4 verdict, Will 2026-06-10): base Instrument Serif,
// single weight, calibrated + stroke-weighted in design.css. next/font
// SELF-HOSTS it (build-time download, served from our domain). The vendored
// multi-weight fork in fonts-local/ is retained UNUSED as a future option;
// see its README. Loaded only on /design until Phase 2 promotes it app-wide.
const instrument = Instrument_Serif({
  variable: "--font-display-instrument",
  subsets: ["latin"],
  weight: "400",
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
  return <div className={`${instrument.variable} min-h-dvh`}>{children}</div>;
}
