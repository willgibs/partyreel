"use client";

import {
  RouteError,
  type CrashBoundaryProps,
} from "@/components/shared/route-error";

// Render-crash boundary for the admin portal. Same generic screen: admin
// errors still go through Sentry (render:admin), nothing rendered from the
// error object itself.
export default function AdminError({
  error,
  unstable_retry,
}: CrashBoundaryProps) {
  return (
    <RouteError area="render:admin" error={error} retry={unstable_retry} />
  );
}
