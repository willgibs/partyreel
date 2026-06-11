import type { Metadata } from "next";
import { Instrument_Serif, Noto_Serif_Display, Oswald } from "next/font/google";
import localFont from "next/font/local";

import "./design.css";

// The candidate display faces load ONLY on /design (nested layouts scope
// next/font payloads to their subtree), so the production bundle is untouched.
// NOTE next/font SELF-HOSTS even the Google faces: files are downloaded at
// build time and served from our own domain, zero runtime Google requests -
// which is why vendoring the GitHub fork below is the same hosting story.
// Inter (the control) needs no load: it is the app's root --font-sans.
const instrument = Instrument_Serif({
  variable: "--font-display-instrument",
  subsets: ["latin"],
  weight: "400", // single-weight face; option A synthesizes weight via stroke
});

// Eli Heuer's multi-weight fork of Instrument Serif (OFL), built from UFO
// sources and vendored in fonts-local/ (see its README for provenance).
const instrumentsFork = localFont({
  src: "./fonts-local/InstrumentsSerifVF.woff2",
  variable: "--font-display-instruments",
  weight: "400 900",
});

// The all-caps condensed exploration (the MasterClass register).
const oswald = Oswald({
  variable: "--font-display-oswald",
  subsets: ["latin"],
});

// The display cut of Google's Noto family (the right Noto for headings).
const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-display-noto",
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
      className={`${instrument.variable} ${instrumentsFork.variable} ${oswald.variable} ${notoSerifDisplay.variable} min-h-dvh`}
    >
      {children}
    </div>
  );
}
