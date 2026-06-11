"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for guest token routes. Generic by design: a guest
// page is the host's event, so the screen stays quiet and unbranded beyond
// the shared dead-end pattern. No error details leaked.
export default function GuestError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:guest" {...props} />;
}
