import type { Metadata } from "next";
import {
  DM_Serif_Display,
  Gloock,
  Instrument_Serif,
  Playfair_Display,
  Prata,
} from "next/font/google";

import "./design.css";

// The candidate display faces load ONLY on /design (nested layouts scope
// next/font payloads to their subtree), so the production bundle is untouched.
// Each exposes a --font-display-* var consumed by design.css's .font-opt-*
// tuning blocks. Round 3 slate: Instrument Serif is the working favorite; the
// rest are high-contrast display serifs in its neighborhood (the round-2
// grotesks + softer serifs didn't land). Inter (option F, the control) needs
// no load: it is the app's root --font-sans.
const instrument = Instrument_Serif({
  variable: "--font-display-instrument",
  subsets: ["latin"],
  weight: "400", // single-weight face; the lightness IS the look
});

const gloock = Gloock({
  variable: "--font-display-gloock",
  subsets: ["latin"],
  weight: "400",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display-dmserif",
  subsets: ["latin"],
  weight: "400",
});

const prata = Prata({
  variable: "--font-display-prata",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-display-playfair",
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
      className={`${instrument.variable} ${gloock.variable} ${dmSerif.variable} ${prata.variable} ${playfair.variable} min-h-dvh`}
    >
      {children}
    </div>
  );
}
