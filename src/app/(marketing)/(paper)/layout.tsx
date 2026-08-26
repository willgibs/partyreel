import type { Viewport } from "next";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";

// THE PAPER SKIN — FORCED LIGHT (Will's 2026-08-26 ruling, superseding the
// T2.5 Call-3 theme-following posture): marketing themes are AUTHORED; the app
// is the only theme-following surface. `surface-paper` flips the token subtree
// light regardless of session (globals.css), and bg/text must be EXPLICIT here
// for the same reason the cinema wrapper carries text-foreground: body sits
// outside this wrapper, so inherited paint is the SESSION theme's. data-mkt
// scopes the marketing motion tokens; data-mkt-skin="paper" lets chrome + the
// body:has edge rule address the skin explicitly.
export default function PaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="surface-paper flex min-h-0 flex-1 flex-col bg-background text-foreground"
      data-mkt
      data-mkt-skin="paper"
    >
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

// Paper is always light, so the browser chrome pins to the light themeColor
// (viewport merges shallowly root→leaf; this replaces the root's media pair
// for the whole (paper) group — the cinema layout is the dark mirror).
export const viewport: Viewport = {
  themeColor: "#fcfcfc",
};
