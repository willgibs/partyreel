"use client";

import { MarketingRouteError } from "@/components/marketing/marketing-route-error";

// Render-crash boundary for the marketing group — the NEAREST boundary for
// every marketing route, so any page/layout crash below (marketing) replaces
// the whole group subtree INCLUDING the chrome AND the skin wrappers (the
// theme-posture split moved header/footer into the (cinema)/(paper) group
// layouts). Since R5 this mounts the BRANDED marketing screen (the 404's
// sibling: forced paper skin, logo row, tilted 500-strip, Try again); app
// areas keep the shared RouteError. No error details leaked.
export default function MarketingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <MarketingRouteError {...props} />;
}
