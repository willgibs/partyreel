import { QuietChromePrefetch } from "@/components/marketing/chrome/chrome-link";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { MarketingNotFound } from "@/components/marketing/marketing-not-found";
import { Trail } from "@/components/shared/trail/trail";

/**
 * THE SITE'S 404 (every surface but the admin host's): the marketing header, the image trail with the words
 * standing in it, and the footer. Unmatched URLs resolve in app/layout.tsx with NO route-group chrome, so this
 * brings its own header and footer to stay navigable. A notFound() thrown INSIDE a route group is caught by
 * that group's own not-found.tsx instead, so the group layout's chrome is never doubled here.
 *
 * ★ REACHED ONLY THROUGH `not-found.lazy.tsx`, and that is the whole point of this file (perf-404). Next puts
 * the root 404's rendered tree in EVERY route's payload, so when this was drawn inline in not-found.tsx every
 * page carried the chrome twice over: about 110 KB of HTML and 43 to 56 KB of gzipped JS (measured on
 * `next start` against a 404 that drew nothing). Behind the boundary a page carries one client reference, and
 * this module, its chrome, the trail and `trail.css` load in the 404's own chunk, on a 404 and nowhere else.
 * No "use client" of its own: it is client code because the boundary's `import()` reaches it, and the header
 * and footer stay Server Components on every page that mounts them directly. Imported from a Server Component
 * it would render into every payload again, which `not-found.test.ts` refuses.
 *
 * Renders outside (marketing), so marketing.css never loads and [data-mkt] is absent: the chrome's
 * --mkt-header-h fallback covers the bar, and FORCED LIGHT is `surface-paper` (globals.css, so it holds
 * without marketing.css). No data-mkt: its token rules live in marketing.css and would be inert here.
 *
 * ★ AND ITS LINKS PREFETCH NOTHING ON SIGHT (`QuietChromePrefetch`, mkt-polish): every route they point
 * at needs a sheet this page never loads, so each prefetch preloaded marketing.css and the home's sheets
 * for nothing, four console warnings a load. A press still navigates in place; it fetches then.
 */
export function SiteNotFound() {
  return (
    <QuietChromePrefetch>
      <SiteNotFoundScreen />
    </QuietChromePrefetch>
  );
}

function SiteNotFoundScreen() {
  return (
    <div className="surface-paper flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <MarketingHeader />
      {/* ★ THE TRAIL'S HOME (`home=notfound`). A page nobody plans to see is the classic place for a rare
          delight, and this is the marketing surface that stands on paper, so the photographs run over light
          ground with dark hairlines. The Trail IS the main's area: the words stand inside it and the
          photographs run behind them, which is also what makes the whole screen the surface a reader draws
          on. It yields inside the words' own box rather than wearing a scrim, it walks its own figure until
          a hand arrives, and below 640 px it walks and never waits for a finger (`phone=walks`). The two
          GROUP 404s stay as they ship: a notFound() inside a marketing route, boxed at 60vh under their own
          chapter's skin; the choice was for the 404 a lost visitor actually lands on. The trail is imported
          directly: this whole screen is the lazy chunk, so the trail's code and sheet arrive with it. */}
      <main className="flex flex-1 flex-col">
        <Trail className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
          <MarketingNotFound strip={false} />
        </Trail>
      </main>
      {/* The demo pile stands at rest with no hover fan (its box and rest pose ride the component, since
          marketing.css is absent), and the seam glow, which is globals.css's, lights as on every page. */}
      <MarketingFooter />
    </div>
  );
}
