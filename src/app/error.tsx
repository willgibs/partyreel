"use client";

import { RouteError } from "@/components/shared/route-error";

// THE ROOT RENDER-CRASH BOUNDARY, and the gap the errors wiring found (Will,
// `surround=shell` + `grammar=shared`, 2026-09-19).
//
// ★ WHAT IT CATCHES THAT NOTHING ELSE DID. An error.tsx wraps its segment's
// page, its not-found and every nested layout, but NOT the layout sitting
// beside it in the same segment. A route GROUP is a segment, so a crash inside
// (app)/layout.tsx, (guest)/layout.tsx, (marketing)/layout.tsx or admin/layout.tsx
// bubbles straight PAST that group's own error.tsx. Until this file existed the
// next boundary up was global-error.tsx, the last-resort screen with no
// stylesheet, no chrome and (until today) no way home: an auth check or an
// alerts query throwing inside a group layout dropped a host onto the barest
// screen in the product. This catches those with the branded one.
//
// ★ IT IS NOT global-error's TWIN. This one renders INSIDE app/layout.tsx, so
// it brings no <html>/<body> and the stylesheet, the fonts and the theme are
// all live. global-error still backstops the case this cannot reach: the ROOT
// layout itself crashing. Both tag `render:global`, because both mean "the
// crash escaped every group": they are told apart by the stack, and a distinct
// `render:root` area is on the ROADMAP (SentryArea is single-sourced in
// lib/observability/sentry.ts and out of this lane's paths).
//
// notFound() is NOT caught here: Next routes its HTTP-fallback throw to
// not-found.tsx past every error boundary, which surface.test.ts's sentinel and
// the local /nope pass both depend on.
export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:global" {...props} />;
}
