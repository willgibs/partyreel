import type { Metadata } from "next";

import { CandidateStyle } from "@/components/dev/candidate-style";

import "./design.css";
// The production marketing sheet loads in the lab on purpose (the library round,
// 2026-09-02): the sandbox's marketing boards and the marketing library render
// on the real [data-mkt-*] grammar instead of a lab copy. Its containment
// contract (no :root, no bare elements, mkt- keyframes, tokens on [data-mkt])
// is what makes loading it here harmless to every other lab page.
import "@/app/(marketing)/marketing.css";

// THE THIN ROOT (the Library x Lab round, 2026-09-15): the sheets, the metadata
// and the candidate block, and nothing a person sees. The chrome lives in
// (shell)/layout.tsx so an iframe scene route (sandbox/*/page.tsx) renders bare.

// Never indexed, never linked: the lab exists only behind the gate
// (see src/lib/design-gate; production 404s without the key).
export const metadata: Metadata = {
  title: "Partyreel Design",
  robots: { index: false, follow: false },
};

export default function DesignRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      {/* A board's "Apply to the site" block, worn by every lab page too, so a
          candidate palette or shadow family is judged on the other boards. */}
      <CandidateStyle />
    </>
  );
}
