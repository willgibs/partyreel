import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

// Root catch-all 404 for UNMATCHED URLs (and any notFound() with no nearer boundary).
// Unmatched URLs resolve in app/layout.tsx with NO route-group chrome, so this file brings
// its own MarketingHeader + MarketingFooter to stay navigable. A notFound() thrown INSIDE a
// route group is instead caught by that group's own not-found.tsx — (marketing) / (guest) /
// (app) — so the group layout's header/footer is never doubled here (the (marketing) one
// exists precisely to stop the root chrome from stacking on top of the marketing layout's,
// which was live-caught). Next returns a 404 status and injects noindex.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <MarketingHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
        <MarketingNotFound />
      </main>
      <MarketingFooter />
    </>
  );
}
