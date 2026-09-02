import type { Metadata } from "next";

import { requireDesignKey } from "@/lib/design-gate/server";
import { ModeShell } from "../mode-shell";
import { EventFeedLab } from "./event-feed-lab";

export const metadata: Metadata = {
  title: "Event feed · design lab",
  robots: { index: false, follow: false },
};

// The event-feed prototype (gated): where the pill behavior (A=Condense), the filter-swap
// transition (B=Fade), and the urgency-reorder magic (C=FLIP) were felt + ratified before they
// touched the hydration-sensitive real host page. The framer-motion reorder was trialed here and
// REJECTED in favor of the CSS FLIP; this lab stays as the reference for that comparison's outcome.
export default async function EventFeedLabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  return (
    <ModeShell fontClass="font-opt-urbanist">
      <EventFeedLab />
    </ModeShell>
  );
}
