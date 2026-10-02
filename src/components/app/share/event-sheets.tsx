"use client";

import { EventSettingsSheet } from "@/components/app/event-settings/event-settings-sheet";
import type { Tier } from "@/lib/constants/tiers";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import type { ReadyFacts } from "@/lib/events/readiness";

import { EventCodeModal } from "./event-code-modal";
import { EventShareSheet } from "./event-share-sheet";
import { useEventShare } from "./event-share-provider";

/**
 * THE HUB'S THREE FLOATING SURFACES, MOUNTED ONCE. Share and Settings are the
 * two sheets the URL can open; the code's mini-modal is the one that cannot.
 * They sit here, as siblings of the album rather than inside any of its
 * sections, for one reason: radix PORTALS them, so the album stays mounted and
 * scrolled behind whichever is open — which is the whole of the requirement ("the
 * album stays behind it") and the thing a route change could not have given.
 *
 * Mounted unconditionally, opened by state: the sheets animate out as well as
 * in, and a surface that unmounts on close has no exit.
 */
export function EventSheets({
  event,
  tier,
  counts,
  pendingCount,
  social,
  joinUrl,
  prettyUrl,
  siteUrl,
  slugLocked,
  reelSample,
  ready,
}: {
  event: HostEvent;
  tier: Tier;
  /** The door's own numbers, for Settings' door page and its lines. */
  counts: DoorCounts;
  pendingCount: number;
  social: {
    displayInProfile: boolean;
    hostHasSlug: boolean;
  } | null;
  joinUrl: string;
  prettyUrl: string;
  siteUrl: string;
  slugLocked: boolean;
  /** One of the event's photographs for Settings to show the reel's looks on, or null. */
  reelSample: string | null;
  /** The event's readiness facts: Settings' rail ticks its steps from them (`lib/events/readiness.ts`). */
  ready: ReadyFacts;
}) {
  const {
    sheet,
    closeSheet,
    openSheet,
    settingsPage,
    openSettingsPage,
    closeSettingsPage,
    openCode,
  } = useEventShare();

  return (
    <>
      <EventCodeModal
        eventName={event.name}
        joinUrl={joinUrl}
        prettyUrl={prettyUrl}
        qrStyle={event.qr_style}
      />
      <EventShareSheet
        open={sheet === "share"}
        onOpenChange={(next) => (next ? openSheet("share") : closeSheet())}
        eventId={event.id}
        eventName={event.name}
        joinUrl={joinUrl}
        qrStyle={event.qr_style}
        siteUrl={siteUrl}
        slug={event.custom_slug}
        slugLocked={slugLocked}
      />
      <EventSettingsSheet
        open={sheet === "settings"}
        onOpenChange={(next) => (next ? openSheet("settings") : closeSheet())}
        page={settingsPage}
        onOpenPage={openSettingsPage}
        onClosePage={closeSettingsPage}
        event={event}
        tier={tier}
        counts={counts}
        pendingCount={pendingCount}
        social={social}
        reelSample={reelSample}
        ready={ready}
        // Settings' fifth step is the code: it closes Settings and opens the code card, the hub's own.
        onOpenCode={() => {
          closeSheet();
          openCode();
        }}
      />
    </>
  );
}
