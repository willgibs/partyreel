import type { Metadata } from "next";
import {
  Fraunces,
  Geist,
  Instrument_Serif,
  Newsreader,
  Space_Grotesk,
} from "next/font/google";

import "./design.css";

// The candidate display faces load ONLY on /design (nested layouts scope
// next/font payloads to their subtree), so the production bundle is untouched.
// Each exposes a --font-display-* var consumed by design.css's .font-opt-*
// tuning blocks. Inter (option F, the control) needs no load: it is the app's
// root --font-sans.
const fraunces = Fraunces({
  variable: "--font-display-fraunces",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-display-instrument",
  subsets: ["latin"],
  weight: "400", // single-weight face; the lightness IS the look
});

const newsreader = Newsreader({
  variable: "--font-display-newsreader",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-space",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-display-geist",
  subsets: ["latin"],
});

// Never indexed, never linked: the playground exists only behind the gate
// (see gate.ts; production 404s without the key).
export const metadata: Metadata = {
  title: "V1 design exploration",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${fraunces.variable} ${instrument.variable} ${newsreader.variable} ${spaceGrotesk.variable} ${geist.variable} min-h-dvh`}
    >
      {children}
    </div>
  );
}
