import type { Metadata } from "next";

/**
 * THE HOST APP'S 404 HEAD, one home for its readers: the group's `not-found.tsx`, and each of an event's pages (the
 * hub, Review, Guests and the reel's old room), which draw the not-found themselves for an event that is gone or never
 * this host's and title themselves with this, in the head and after hydration alike (crumbs-28: the hub's own title,
 * "Event", won over the boundary's on the alias). A plain module, so a page can read it without importing the
 * not-found's client boundary.
 */
export const appNotFoundMetadata: Metadata = {
  title: "Event not found",
  robots: { index: false, follow: false },
};
