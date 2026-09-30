"use client";

/**
 * THE ROOT 404'S ONE CLIENT BOUNDARY (perf-404): each surface's 404 screen, loaded when a 404 is drawn and not
 * before.
 *
 * Next serialises the root `not-found.tsx`'s rendered tree into EVERY route's payload (it is the root
 * layout's not-found fallback, rendered eagerly), and the client fetches the chunks of every client reference
 * in it as the payload decodes. So whatever the 404 draws, every page paid for: the whole marketing chrome,
 * the words and the admin host's screen. What not-found.tsx renders now is one of these two references and
 * nothing else; each `import()` is a real split because it is made from a client module (Next does not split
 * a dynamic import made from a Server Component, its lazy-loading guide says so), so a page that is not a 404
 * carries one row and this small module.
 *
 * When a 404 IS drawn, nothing changes for the reader: `next/dynamic` renders on the server (`ssr` is on by
 * default, and with no `loading` there is no fallback to flash), so the 404's HTML holds the whole screen and
 * its stylesheet, and the chunk is preloaded from that HTML. `not-found.test.ts` holds the split.
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
