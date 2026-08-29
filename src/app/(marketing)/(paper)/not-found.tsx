import type { Metadata } from "next";

import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

// Catches notFound() thrown inside a PAPER route (a bad careers [slug] — help
// moved to (cinema) in R6 and blog followed in the 2026-08-28 blog round, so
// careers is the last [slug] this boundary serves; it still must not be
// deleted). Group-owned twin of (cinema)/not-found.tsx: the paper layout wraps
// it, so a reading-surface 404 stays a theme-following paper page with a single
// header/footer (no chrome here or it double-stacks; a (marketing)-level
// boundary would render skinless now that the group layouts own the chrome).
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function PaperNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
      <MarketingNotFound />
    </div>
  );
}
