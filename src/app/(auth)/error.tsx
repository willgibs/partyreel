"use client";

import {
  RouteError,
  type CrashBoundaryProps,
} from "@/components/shared/route-error";

// Render-crash boundary for the auth group (login / callback). A crash here
// must never strand a signing-in host without a path back.
export default function AuthError({
  error,
  unstable_retry,
}: CrashBoundaryProps) {
  return <RouteError area="render:auth" error={error} retry={unstable_retry} />;
}
