import type { Metadata } from "next";

import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

// Catches notFound() thrown inside a PAPER route. ★ It now serves NO [slug] at
// all: help left in R6, blog in the blog round, careers in the careers round, so
// (paper) holds only /contact since privacy and terms moved to (cinema) in the
// legal round. It still must not be deleted - a static page can call notFound(), and
// without this boundary that render falls through to the ROOT one, which brings
// its own chrome and double-stacks (the original live-caught gotcha). Group-owned
// twin of (cinema)/not-found.tsx: the paper layout wraps it, so a 404 here stays
// a theme-following paper page with a single header/footer. Add no chrome; a
// (marketing)-level boundary would render skinless, since the group layouts own it.

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
