import type { Metadata, Viewport } from "next";

import { surface } from "@/lib/surface";

import { AdminNotFoundScreenLazy, SiteNotFoundLazy } from "./not-found.lazy";

// Root catch-all 404 for UNMATCHED URLs (and any notFound() with no nearer boundary: the lab's pages and the
// print sheet have none). A notFound() thrown INSIDE a route group is caught by that group's own not-found.tsx
// — (marketing)/(cinema), (guest)/e and /u, (app), admin — so this file's chrome never doubles a group
// layout's. Next returns a 404 status and injects noindex.
//
// ★ THIS FILE DRAWS NOTHING ITSELF, AND MUST STAY THAT WAY (perf-404). Next renders a root not-found into
// EVERY route's payload, whether or not the route 404s, so anything drawn here is paid for by every page:
// the marketing chrome drawn inline cost `/login`, `/pricing`, `/about`, `/help`, the home and the guest
// album about 110 KB of HTML and 43 to 56 KB of gzipped JS each. It keeps what only a Server Component can
// hold (the metadata, the viewport, the surface) and renders one reference into `not-found.lazy.tsx`, the
// one client boundary each surface's screen loads through (`not-found.test.ts` walks this file's eager
// imports and refuses a component, a client island or a stylesheet among them).
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Forced-light boundary → pin the light themeColor (verified rendered in the
// 404 <head>; if a future Next stops honoring viewport on not-found files this
// harmlessly falls back to the root media pair). ★ Only on the APP surface: the
// admin branch below is the portal, which follows the operator's theme, so it
// inherits the root layout's light/dark pair rather than being pinned to paper.
export const viewport: Viewport =
  surface() === "admin" ? {} : { themeColor: "#f5f5f7" };

// ★ ONE FILE, TWO SURFACES (Will, `admin-404=portal`, 2026-09-19). The admin
// deployment's proxy REWRITES every path outside its allow-list to a sentinel
// no route serves, so a refused request lands here, on the marketing 404, whose
// three footnote links all 404 again on that host. The fix is answering the
// surface the proxy actually rewrote to, NOT a new route: `surface()` reads
// NEXT_PUBLIC_SURFACE, which Next inlines at build, so each of the two Vercel
// projects renders exactly one of these branches and the other screen's chunk
// is never fetched. A new route would have to be added to the allow-list, which
// is the one thing SURFACE_404_PATH exists to avoid (surface.test.ts pins that
// the sentinel matches no route and that this file reads @/lib/surface).
export default function NotFound() {
  if (surface() === "admin") return <AdminNotFoundScreenLazy />;
  return <SiteNotFoundLazy />;
}
