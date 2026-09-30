import type { Metadata } from "next";

/**
 * THE PROFILE'S 404 HEAD, one home for its two readers: the segment's `not-found.tsx`, and the profile page, which
 * draws the not-found itself for a handle nobody holds (stale-link) and titles itself with this in the head and after
 * hydration alike. A plain module, so the page can read it without importing the not-found's client boundary.
 */
export const notFoundMetadata: Metadata = {
  title: "Profile not found",
  robots: { index: false, follow: false },
};
