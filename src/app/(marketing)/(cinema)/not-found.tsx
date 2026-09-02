import type { Metadata } from "next";

import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

// Catches notFound() thrown inside a CINEMA route. As of the careers round it
// serves EVERY dynamic marketing route: a bad /events/[slug], /help/[slug],
// /blog/[slug] or /careers/[slug] (help arrived in R6, blog and careers in the
// 2026-08-28 rounds that moved both groups' pages onto the cinema rhythm; the
// static /privacy and /terms joined in the legal round). Lives
// at the GROUP level because the slimmed (marketing) layout renders no chrome:
// a boundary there would paint a bare, skinless 404. Here the cinema layout
// still wraps it, so the 404 renders dark with a single header/footer (adding
// chrome here would double-stack it — the original live-caught gotcha). min-h
// (not flex-1) because the layout's <main> is flex-grow, not a flex container.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function CinemaNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
      <MarketingNotFound />
    </div>
  );
}
