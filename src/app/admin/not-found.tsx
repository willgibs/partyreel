import type { Metadata } from "next";

import { AdminNotFoundPageLazy } from "@/app/not-found.lazy";

// Operations-portal 404: primarily a missing account/album record (notFound() in admin/accounts/[id] +
// admin/albums/[eventId]). It renders INSIDE AdminShell (`not-found.screen.tsx` says how).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a group's not-found into EVERY page under it, whether or not the page 404s, so a screen drawn
// here is paid for by every admin page (about 2.2 KB of HTML). The screen is reached through
// `app/not-found.lazy.tsx`, the one client boundary every 404 shares; `not-found.test.ts` walks this file's eager imports and
// refuses a component, a client island or a stylesheet among them. What only a Server Component can hold
// stays here: the metadata.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return <AdminNotFoundPageLazy />;
}
