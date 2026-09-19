import type { Metadata, Viewport } from "next";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { MarketingNotFound } from "@/components/marketing/marketing-not-found";
import { Trail } from "@/components/shared/trail/trail";

// Root catch-all 404 for UNMATCHED URLs (and any notFound() with no nearer boundary).
// Unmatched URLs resolve in app/layout.tsx with NO route-group chrome, so this file brings
// its own MarketingHeader + MarketingFooter to stay navigable. A notFound() thrown INSIDE a
// route group is instead caught by that group's own not-found.tsx — (marketing) / (guest) /
// (app) — so the group layout's header/footer is never doubled here (the (marketing) one
// exists precisely to stop the root chrome from stacking on top of the marketing layout's,
// which was live-caught). Next returns a 404 status and injects noindex.
// NOTE (Track B): this renders OUTSIDE (marketing), so marketing.css never loads here —
// the chrome's --mkt-header-h fallback covers it; the marketing-side 404s live in
// (marketing)/(cinema|paper)/not-found.tsx. FORCED LIGHT via `surface-paper` (globals.css,
// so it works without marketing.css) per the 2026-08-26 ruling: marketing surfaces have
// authored themes, and this boundary is paper. No data-mkt: the [data-mkt] token rules
// live in marketing.css, absent here — the attribute would be inert.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Forced-light boundary → pin the light themeColor (verified rendered in the
// 404 <head>; if a future Next stops honoring viewport on not-found files this
// harmlessly falls back to the root media pair).
export const viewport: Viewport = {
  themeColor: "#fdfdff",
};

export default function NotFound() {
  return (
    <div className="surface-paper flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <MarketingHeader />
      {/* ★ THE TRAIL'S HOME (Will, `home=notfound`, 2026-09-19). A page nobody
          plans to see is the classic place for a rare delight (bible 22), and
          this is the marketing surface that stands on paper, so the photographs
          run over light ground with dark hairlines. The Trail IS the main's
          area: the words stand inside it and the photographs run behind them,
          which is also what makes the whole screen the surface a reader draws
          on. It yields inside the words' own box rather than wearing a scrim
          (bible 1), it walks its own figure until a hand arrives, and below
          640 px it walks and never waits for a finger (`phone=walks`). The two
          GROUP 404s stay as they ship: they are a notFound() inside a marketing
          route, boxed at 60vh under their own chapter's skin, and the ruling
          was for the 404 a lost visitor actually lands on. */}
      <main className="flex flex-1 flex-col">
        <Trail className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
          <MarketingNotFound strip={false} />
        </Trail>
      </main>
      {/* Renders outside (marketing), so marketing.css and [data-mkt] are both
          absent: the seam glow and the photo-stack fan simply do not fire here.
          The footer needs no prop for that any more, because nothing in it is
          collapsed by default. */}
      <MarketingFooter />
    </div>
  );
}
