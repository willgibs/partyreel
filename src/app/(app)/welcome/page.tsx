import type { Metadata } from "next";

import { WelcomeFlow } from "@/components/app/welcome-flow";

export const metadata: Metadata = { title: "Welcome" };

// First-time host welcome (Phase 6). The /dashboard page redirects brand-new hosts here
// (profiles.welcomed_at IS NULL). This route deliberately does NOT gate on welcomed_at itself
// — only the dashboard redirects, and the flow sets the marker before navigating away, so
// there's no redirect loop. Gated to signed-in hosts by the (app) layout.
export default function WelcomePage() {
  return <WelcomeFlow />;
}
