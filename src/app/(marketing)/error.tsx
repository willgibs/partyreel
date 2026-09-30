"use client";

import { MarketingRouteError } from "@/components/marketing/marketing-route-error";
import type { CrashBoundaryProps } from "@/components/shared/route-error";

// Render-crash boundary for the marketing group — the NEAREST boundary for
// every marketing route, so any page/layout crash below (marketing) replaces
// the whole group subtree INCLUDING the chrome AND the skin wrappers (the
// theme-posture split moved header/footer into the (cinema) group layout).
// Since R5 this mounts the BRANDED marketing screen (the 404's
// sibling: forced paper skin, logo row, tilted 500-strip, Try again); app
// areas keep the shared RouteError. No error details leaked.
export default function MarketingError({
  error,
  unstable_retry,
}: CrashBoundaryProps) {
  return <MarketingRouteError error={error} retry={unstable_retry} />;
}
