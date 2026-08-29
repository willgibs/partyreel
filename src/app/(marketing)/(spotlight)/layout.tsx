import type { Viewport } from "next";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { CINEMA_TOKENS } from "@/components/marketing/system/cinema-chapter";

/**
 * THE SPOTLIGHT SKIN: a paper reading body under a CINEMA HERO.
 *
 * Same forced-light ground as (paper) and for the same reason (marketing themes
 * are AUTHORED; the app is the only theme-following surface), but the page opens
 * on a dark hero and therefore needs a dark nav over it. Will's call on /about,
 * 2026-08-28: "with the cinema hero, we need to go back to the dark nav to
 * match", flagged as a treatment the other resource pages may adopt. It is a
 * route GROUP, so the URL is untouched: /about stays /about, and moving a page
 * in or out of this treatment is a directory move with no redirect.
 *
 * Why a whole group rather than a prop: the header is rendered by the layout,
 * and a nested layout cannot un-render its parent's chrome. A client component
 * switching on usePathname() would work, but it puts routing logic in the chrome
 * and ships both header trees; a group states the intent in the file system.
 *
 * ── HOW THE NAV GOES DARK ──
 *
 * The (cinema) group gets a dark header for free by sitting inside `.dark`. That
 * is unavailable here: `.dark` must never nest inside `.surface-paper` (it would
 * silently neuter every `dark:` utility in the subtree, since the variant is
 * `:is(.dark *):not(.surface-paper *)`). So the bar wears CINEMA_TOKENS, the
 * same always-dark --gallery* redeclaration CinemaChapter uses.
 *
 * ★ The tokens go on the <header> ITSELF, never a wrapper: `position: sticky` is
 * bounded by the parent's box, so a header-height wrapper would stop the bar
 * sticking the instant you scrolled.
 *
 * `overlay` starts the bar transparent over the hero and crossfades its glass in
 * on scroll; `skin="cinema"` is for THE PORTAL RULE (the mobile menu portals to
 * body and cannot inherit the ground).
 */
export default function SpotlightLayout({
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
      <MarketingHeader
        skin="cinema"
        overlay
        className={`${CINEMA_TOKENS} text-foreground`}
      />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

// The body is paper, so browser chrome pins light exactly as (paper) does. The
// hero being dark does not change what the page mostly IS.
export const viewport: Viewport = {
  themeColor: "#fcfcfc",
};
