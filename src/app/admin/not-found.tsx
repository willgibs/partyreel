import type { Metadata } from "next";

import { AdminNotFoundPageLazy } from "@/app/not-found.lazy";

import { adminNotFoundMetadata } from "./not-found.metadata";

// Operations-portal 404. ★ The two record pages (admin/accounts/[id], admin/albums/[eventId]) never throw for a
// missing record any more: they draw the screen themselves, headed by the same metadata (crumbs-28; a thrown
// `notFound()` is served as Next's error shell, an empty body until the script has run). This stays the segment's
// boundary for any `notFound()` thrown under it. It renders INSIDE AdminShell (`not-found.screen.tsx` says how).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a group's not-found into EVERY page under it, whether or not the page 404s, so a screen drawn
// here is paid for by every admin page (about 2.2 KB of HTML). The screen is reached through
// `app/not-found.lazy.tsx`, the one client boundary every 404 shares; `not-found.test.ts` walks this file's eager imports and
// refuses a component, a client island or a stylesheet among them. What only a Server Component can hold
// stays here: the metadata, whose words live in `not-found.metadata.ts` so the pages can read them too.
// ★ NO ROBOTS OF ITS OWN (crumbs-86, as the root's and the cinema's): a thrown `notFound()` is a 404, or a stream Next
// marks itself, and Next writes the one `<meta name="robots" content="noindex">` into both; a second beside it said the
// same twice. The page that draws this screen itself at 200 keeps the robots in `not-found.metadata.ts`, since no status
// of its own marks it; the boundary takes only its words.
export const metadata: Metadata = {
  title: adminNotFoundMetadata.title,
};

export default function AdminNotFound() {
  return <AdminNotFoundPageLazy />;
}
