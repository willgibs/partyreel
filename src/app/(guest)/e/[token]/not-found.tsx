import type { Metadata } from "next";

import { GuestNotFoundLazy } from "@/app/not-found.lazy";

// Tailored 404 for a link that resolves to nothing (notFound() in e/[token]/page).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a segment's not-found into EVERY page under it, whether or not the page 404s, so a screen
// drawn here is paid for by every album load (about 17.5 KB of HTML, 6 KB gzipped). The screen is
// `not-found.screen.tsx` (its copy and the words the help center quotes live there), reached through
// `app/not-found.lazy.tsx`, the one client boundary every 404 shares; `not-found.test.ts` walks this file's eager imports and
// refuses a component, a client island or a stylesheet among them. What only a Server Component can hold
// stays here: the metadata.
export const metadata: Metadata = {
  title: "Event not found",
  robots: { index: false, follow: false },
};

export default function GuestNotFound() {
  return <GuestNotFoundLazy />;
}
