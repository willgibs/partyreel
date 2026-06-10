import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Space_Grotesk } from "next/font/google";

import "./design.css";

// The three direction display faces load ONLY on /design (nested layouts scope
// next/font payloads to their subtree), so the production bundle is untouched.
// Each exposes a --font-display-* var consumed by design.css's [data-dir-display]
// hooks and --font-heading overrides.
const fraunces = Fraunces({
  variable: "--font-display-a",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display-b",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-c",
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
      className={`${fraunces.variable} ${bricolage.variable} ${spaceGrotesk.variable} min-h-dvh`}
    >
      {children}
    </div>
  );
}
