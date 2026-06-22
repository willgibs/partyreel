import type { Metadata } from "next";

import { requireDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { EventFeedLab } from "./event-feed-lab";

export const metadata: Metadata = {
  title: "Event feed · design lab",
  robots: { index: false, follow: false },
};

// The event-feed prototype (gated): feel + ratify the pill behavior (A), the
// filter-swap transition (B), and the urgency-reorder magic (C) - plus the `motion`
// trial (C3) - before any of it touches the hydration-sensitive real host page.
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
