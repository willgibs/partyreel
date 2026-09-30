import type { Metadata } from "next";

import { AppNotFoundLazy } from "@/app/not-found.lazy";

import { appNotFoundMetadata } from "./not-found.metadata";

// Host-facing 404 for the (app) group. ★ An event's own pages never throw for a missing or not-yours event any more:
// they draw the screen themselves, headed by the same metadata (crumbs-28; a thrown `notFound()` is served as Next's
// error shell, and under the hub's loading.tsx as the skeleton until the client has run, and the page's own title won:
// `dashboard/[eventId]/page.tsx` says why). This stays the group's boundary for any `notFound()` thrown under it. It
// renders INSIDE AppShell (`not-found.screen.tsx` says how).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a group's not-found into EVERY page under it, whether or not the page 404s, so a screen drawn
// here is paid for by every dashboard page (about 3.5 KB of HTML). The screen is reached through
// `app/not-found.lazy.tsx`, the one client boundary every 404 shares; `not-found.test.ts` walks this file's eager imports and
// refuses a component, a client island or a stylesheet among them. What only a Server Component can hold
// stays here: the metadata, whose words live in `not-found.metadata.ts` so the pages can read them too.
export const metadata: Metadata = appNotFoundMetadata;

export default function AppNotFound() {
  return <AppNotFoundLazy />;
}
