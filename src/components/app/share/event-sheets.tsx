"use client";

import { EventSettingsSheet } from "@/components/app/event-settings/event-settings-sheet";
import type { Tier } from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";

import { EventCodeModal } from "./event-code-modal";
import { EventShareSheet } from "./event-share-sheet";
import { useEventShare } from "./event-share-provider";

/**
 * THE HUB'S THREE FLOATING SURFACES, MOUNTED ONCE. Share and Settings are the
 * two sheets the URL can open; the code's mini-modal is the one that cannot.
 * They sit here, as siblings of the album rather than inside any of its
 * sections, for one reason: radix PORTALS them, so the album stays mounted and
 * scrolled behind whichever is open — which is the whole of his ruling ("the
 * album stays behind it") and the thing a route change could not have given.
 *
 * Mounted unconditionally, opened by state: the sheets animate out as well as
 * in, and a surface that unmounts on close has no exit.
 */
export function EventSheets({
  event,
  tier,
  pendingCount,
  social,
  joinUrl,
  prettyUrl,
  siteUrl,
  slugLocked,
}: {
  event: HostEvent;
  tier: Tier;
  pendingCount: number;
  social: {
    displayInProfile: boolean;
    showGuestList: boolean;
    hostHasSlug: boolean;
  } | null;
  joinUrl: string;
  prettyUrl: string;
  siteUrl: string;
  slugLocked: boolean;
}) {
  const { sheet, closeSheet, openSheet } = useEventShare();

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
        event={event}
        tier={tier}
        pendingCount={pendingCount}
        social={social}
      />
    </>
  );
}
