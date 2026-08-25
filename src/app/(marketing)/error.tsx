"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for the marketing group — the NEAREST boundary for
// every marketing route, so any page/layout crash below (marketing) replaces
// the whole group subtree INCLUDING the chrome (the theme-posture split moved
// header/footer into the (cinema)/(paper) group layouts). RouteError is
// self-sufficient for that: its own centered <main>, generic copy, a Back-home
// button — presentable with no header/footer by design. No error details leaked.
export default function MarketingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:marketing" {...props} />;
}
