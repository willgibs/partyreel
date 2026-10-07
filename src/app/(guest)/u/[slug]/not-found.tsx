import type { Metadata } from "next";

import { ProfileNotFoundLazy } from "@/app/not-found.lazy";

import { notFoundMetadata } from "./not-found.metadata";

// Tailored 404 for a handle that resolves to nothing. ★ It says nothing about why, the handle-existence rule its
// screen keeps (`not-found.screen.tsx`). ★ The profile page never throws for one any more: it draws the screen
// itself, headed by the same metadata (stale-link; a thrown `notFound()` is served as Next's error shell, a white
// page until the script has run, and `page.tsx` says why). This stays the segment's boundary for a `notFound()`
// thrown under it.
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a segment's not-found into EVERY page under it, whether or not the page 404s, so a screen
// drawn here is paid for by every profile (about 14.7 KB of HTML, the guest link's own cost: `GuestBar`'s
// wordmark path). The screen is reached through `app/not-found.lazy.tsx`, the one client boundary every 404 shares;
// `not-found.test.ts` walks this file's eager imports and refuses a component, a client island or a
// stylesheet among them. What only a Server Component can hold stays here: the metadata, whose words live in
// `not-found.metadata.ts` so the page can read them too.
// ★ NO ROBOTS OF ITS OWN (crumbs-86, as the root's and the cinema's): a thrown `notFound()` is a 404, or a stream Next
// marks itself, and Next writes the one `<meta name="robots" content="noindex">` into both; a second beside it said the
// same twice. The page that draws this screen itself at 200 keeps the robots in `not-found.metadata.ts`, since no status
// of its own marks it; the boundary takes only its words.
export const metadata: Metadata = { title: notFoundMetadata.title };

export default function ProfileNotFound() {
  return <ProfileNotFoundLazy />;
}
