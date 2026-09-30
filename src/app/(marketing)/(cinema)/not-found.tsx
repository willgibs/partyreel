import type { Metadata } from "next";

import { CinemaNotFoundLazy } from "@/app/not-found.lazy";

// Catches notFound() thrown inside a CINEMA route. As of the careers round it
// serves EVERY dynamic marketing route: a bad /events/[slug], /help/[slug],
// /blog/[slug] or /careers/[slug] (help arrived in R6, blog and careers in the
// 2026-08-28 rounds that moved both groups' pages onto the cinema rhythm; the
// static /privacy and /terms joined in the legal round). Lives
// at the GROUP level because the slimmed (marketing) layout renders no chrome:
// a boundary there would paint a bare, skinless 404. Here the cinema layout
// still wraps it, so the 404 renders dark with a single header/footer (adding
// chrome here would double-stack it — the original live-caught gotcha). The
// screen's min-h (not flex-1) is because the layout's <main> is flex-grow, not
// a flex container.
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (crumbs-25, after
// `perf-404` did it for the root). Next renders a segment's not-found into
// EVERY page under it, whether or not the page 404s, so a screen drawn here is
// paid for by every cinema page (about 5 KB of HTML, 1 KB gzipped). The screen
// is `not-found.screen.tsx`, reached through `app/not-found.lazy.tsx`, the one
// client boundary every 404 shares; `not-found.test.ts` walks this file's eager
// imports and refuses a component, a client island or a stylesheet among them. What only a
// Server Component can hold stays here: the metadata.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function CinemaNotFoundPage() {
  return <CinemaNotFoundLazy />;
}
