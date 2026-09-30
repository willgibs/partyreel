"use client";

import {
  RouteError,
  type CrashBoundaryProps,
} from "@/components/shared/route-error";

// Render-crash boundary for the host app group. Renders INSIDE the (app)
// layout (AppShell chrome survives); notFound() is handled by not-found.tsx,
// never here. Generic screen, no error details leaked (the slice-4 invariant).
export default function AppError({
  error,
  unstable_retry,
}: CrashBoundaryProps) {
  return <RouteError area="render:app" error={error} retry={unstable_retry} />;
}
