import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

/**
 * THE CINEMA GROUP'S 404 SCREEN, reached only through `app/not-found.lazy.tsx` (crumbs-25; `not-found.tsx` says
 * why: the group's 404 rides every cinema page unless its screen loads behind one client boundary).
 *
 * Only the centred content, no chrome: the cinema layout already draws the header and footer around it, and
 * adding any here would double-stack them. The box is `min-h` (not `flex-1`) because the layout's <main> is
 * flex-grow, not a flex container. The words are `marketing-not-found.tsx`'s, shared with the root 404.
 *
 * No "use client" of its own: it is client code because the boundary's `import()` reaches it. Imported from a
 * Server Component it would render into every cinema page's payload again, which `not-found.test.ts` refuses.
 */
export function CinemaNotFoundScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
      <MarketingNotFound />
    </div>
  );
}
