"use client";

/**
 * EVERY 404'S ONE CLIENT BOUNDARY (perf-404 for the root; crumbs-25 for every route group's own): each
 * screen, loaded when a 404 is drawn and not before.
 *
 * Next serialises a not-found's rendered tree into EVERY page under it (the root's into every route's, a
 * group's into each page of the group: it is the segment's not-found fallback, rendered eagerly), and the
 * client fetches the chunks of every client reference in it as the payload decodes. So whatever a 404 draws,
 * every page under it paid for: the whole marketing chrome, the guest bar's wordmark, the words. What each
 * `not-found.tsx` renders now is one of these references and nothing else; each `import()` is a real split
 * because it is made from a client module (Next does not split a dynamic import made from a Server Component,
 * its lazy-loading guide says so), so a page that is not a 404 carries one row and this small module.
 *
 * ★ ONE FILE FOR ALL OF THEM, AND THAT IS MEASURED. A boundary per group was built first, and every one
 * carried its own copy of `next/dynamic`'s runtime (Turbopack puts it in each boundary's chunk instead of
 * sharing one): 1.3 KB gzipped of JS on every page of the group, which is more than the 1 KB gzipped of HTML a
 * small screen (the cinema group's, the host app's, the portal's) had cost, so for those the boundary was a
 * net loss on the wire. This chunk is loaded by every page already (the root's 404 is in every payload), so a loader
 * added here costs a few dozen bytes and no request, and the screens it names stay lazy. `not-found.test.ts`
 * holds the split and names every entry.
 *
 * When a 404 IS drawn, nothing changes for the reader: `next/dynamic` renders on the server (`ssr` is on by
 * default, and with no `loading` there is no fallback to flash), so an unmatched URL's HTML holds the whole
 * screen and its stylesheet, and the chunk is preloaded from that HTML. (A `notFound()` thrown inside a group's
 * page is served as Next's error shell whatever it draws, and the browser draws the screen once its script
 * has run; the screen's chunk is one request after the boundary's own.)
 */
import dynamic from "next/dynamic";

/** The site's 404: the marketing chrome, the trail and the words. */
export const SiteNotFoundLazy = dynamic(() =>
  import("./not-found.site").then((m) => m.SiteNotFound),
);

/** The admin host's refused path: the portal's own session-less screen. */
export const AdminNotFoundScreenLazy = dynamic(() =>
  import("@/components/admin/admin-not-found-screen").then(
    (m) => m.AdminNotFoundScreen,
  ),
);

/** The guest link's 404 (`/e/<token>` that resolves to nothing), under the session-less bar. */
export const GuestNotFoundLazy = dynamic(() =>
  import("./(guest)/e/[token]/not-found.screen").then(
    (m) => m.GuestNotFoundScreen,
  ),
);

/** The guest profile's 404 (`/u/<handle>` that resolves to nothing), under the same bar. */
export const ProfileNotFoundLazy = dynamic(() =>
  import("./(guest)/u/[slug]/not-found.screen").then(
    (m) => m.ProfileNotFoundScreen,
  ),
);

/** The cinema group's 404 (a bad `/help/<slug>`, `/blog/<slug>` and the like): the words, in the layout's chrome. */
export const CinemaNotFoundLazy = dynamic(() =>
  import("./(marketing)/(cinema)/not-found.screen").then(
    (m) => m.CinemaNotFoundScreen,
  ),
);

/** The host app's 404 (a missing or not-yours event), inside AppShell. */
export const AppNotFoundLazy = dynamic(() =>
  import("./(app)/not-found.screen").then((m) => m.AppNotFoundScreen),
);

/** The operations portal's 404 (a missing account or album record), inside AdminShell. */
export const AdminNotFoundPageLazy = dynamic(() =>
  import("./admin/not-found.screen").then((m) => m.AdminNotFoundPageScreen),
);
