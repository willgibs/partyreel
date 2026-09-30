import type { Metadata } from "next";

import { ProfileNotFoundLazy } from "@/app/not-found.lazy";

// Tailored 404 for a handle that resolves to nothing (notFound() in u/[slug]/page). ★ It says nothing about
// why, the handle-existence rule its screen keeps (`not-found.screen.tsx`).
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after `perf-404` did it for the root).
// Next renders a segment's not-found into EVERY page under it, whether or not the page 404s, so a screen
// drawn here is paid for by every profile (about 14.7 KB of HTML, the guest link's own cost: `GuestBar`'s
// wordmark path). The screen is reached through `app/not-found.lazy.tsx`, the one client boundary every 404 shares;
// `not-found.test.ts` walks this file's eager imports and refuses a component, a client island or a
// stylesheet among them. What only a Server Component can hold stays here: the metadata.
export const metadata: Metadata = {
  title: "Profile not found",
  robots: { index: false, follow: false },
};

export default function ProfileNotFound() {
  return <ProfileNotFoundLazy />;
}
