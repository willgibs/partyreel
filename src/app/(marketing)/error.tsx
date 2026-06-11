"use client";

import { RouteError } from "@/components/shared/route-error";

// Render-crash boundary for the marketing group. The marketing layout still
// renders around it (header/footer survive). No error details leaked.
export default function MarketingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError area="render:marketing" {...props} />;
}
