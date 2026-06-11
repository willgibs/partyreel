"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for the auth group (login / callback). A crash here
// must never strand a signing-in host without a path back.
export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:auth" {...props} />;
}
