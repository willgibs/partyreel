import type { Metadata } from "next";

import { AppNotFoundLazy } from "@/app/not-found.lazy";

// Host-facing 404 for the (app) group: primarily the missing/not-yours dashboard event (notFound() in
// dashboard/[eventId]/page). It renders INSIDE AppShell (`not-found.screen.tsx` says how).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a group's not-found into EVERY page under it, whether or not the page 404s, so a screen drawn
// here is paid for by every dashboard page (about 3.5 KB of HTML). The screen is reached through
// `app/not-found.lazy.tsx`, the one client boundary every 404 shares; `not-found.test.ts` walks this file's eager imports and
// refuses a component, a client island or a stylesheet among them. What only a Server Component can hold
// stays here: the metadata.
export const metadata: Metadata = {
  title: "Event not found",
};

export default function AppNotFound() {
  return <AppNotFoundLazy />;
}
