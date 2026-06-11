"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for the host app group. Renders INSIDE the (app)
// layout (AppShell chrome survives); notFound() is handled by not-found.tsx,
// never here. Generic screen, no error details leaked (the slice-4 invariant).
export default function AppError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:app" {...props} />;
}
