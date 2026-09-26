"use client";

import { GuestBar } from "@/components/guest/guest-bar";
import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for guest token routes. Generic by design: a guest
// page is the host's event, so the screen stays quiet and unbranded beyond
// the shared dead-end pattern. No error details leaked.
//
// ★ IT WEARS A BAR. The (guest) layout draws no chrome, and the real header
// lives inside the page that just crashed, so without one a guest would meet a
// centered block floating on nothing. GuestBar is the session-less row the
// bad-link 404 wears too. The column declares its own height because
// RouteError's <main> is `flex-1` and needs a flex parent that fills the
// viewport; the layout's `min-h-full` only resolves against an ancestor that
// already has one.
export default function GuestError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <GuestBar />
      <RouteError area="render:guest" {...props} />
    </div>
  );
}
