import type { Metadata } from "next";

/**
 * THE OPERATIONS PORTAL'S 404 HEAD, one home for its readers: the segment's `not-found.tsx`, and the two record pages
 * (an album, an account), which draw the not-found themselves for a record that is gone and title themselves with
 * this (crumbs-28). A plain module, so a page can read it without importing the not-found's client boundary.
 */
export const adminNotFoundMetadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};
