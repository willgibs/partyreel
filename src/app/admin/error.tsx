"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for the admin portal. Same generic screen: admin
// errors still go through Sentry (render:admin), nothing rendered from the
// error object itself.
export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:admin" {...props} />;
}
