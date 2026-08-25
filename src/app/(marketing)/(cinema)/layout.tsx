import type { Viewport } from "next";

import { MarketingMotionTuner } from "@/components/dev/marketing-motion-tuner";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";

// THE CINEMA SKIN (Track B theme posture, T2.5 Call 3: product is cinema, docs
// are paper). The wrapper's `dark` class is the descendant-scoped token flip
// (globals.css @custom-variant dark) — it never touches next-themes, the <html>
// class, or the session; data-mkt-skin="cinema" lets marketing.css chapter 3
// deepen the night to the ruled cinema room (oklch 0.11) and fix native form
// controls, and the body:has rule there stops paper-light overscroll bleed.
// flex-1 spans the root flex body so short pages stay dark to the fold.
export default function CinemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      // text-foreground is load-bearing, not styling drift: body sits OUTSIDE
      // this wrapper, so inherited text color is the SESSION theme's ink — on a
      // light session the hero h1 rendered near-black on the cinema room (the
      // body-edge finding's sibling gap; caught in the c5 verification pass).
      // Resolving color AT the wrapper picks up the .dark tokens instead.
      className="dark flex min-h-0 flex-1 flex-col text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      {/* skin="cinema" -> THE PORTAL RULE: portaled nav content re-darkens. */}
      <MarketingHeader skin="cinema" />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      {/* Key-gated (server-validated ?key=) and inert for everyone else; layouts
          get no searchParams in Next 16 and the page-level await would cost the
          home its static render — see marketing-motion-tuner.tsx. */}
      <MarketingMotionTuner />
    </div>
  );
}

// The browser-UI tint for the always-dark cinema routes. Exported ONCE here and
// never per page: viewport merges shallowly root -> leaf, so a per-page export
// that missed a route would silently fall back to the root's light/dark pair.
// #040404 is oklch(0.11 0 0) (the chapter-3 cinema room) in sRGB hex.
export const viewport: Viewport = {
  themeColor: "#040404",
};
