"use client";

import { lazy, Suspense, useState } from "react";

import type { GuestsRoomData } from "@/app/(app)/dashboard/[eventId]/guests/room.server";
import { HostCreditLookProvider } from "@/components/app/event-blocks/credit-look";
import { EventSettingsSheet } from "@/components/app/event-settings/event-settings-sheet";
import type { Tier } from "@/lib/constants/tiers";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import type { ReadyFacts } from "@/lib/events/readiness";

import { EventCodeModal } from "./event-code-modal";
import { EventShareSheet } from "./event-share-sheet";
import { useEventShare } from "./event-share-provider";
import { GuestsPanel } from "./guests-panel";
import { RoomPanel, RoomShimmer } from "./room-panel";
import { loadAsGuestStage, loadReviewRoom } from "./room-chunks";

/** Review's room, its own chunk (`room-chunks.ts`): warmed on the card's intent, asked for here as it opens. */
const ReviewRoomFromHub = lazy(() =>
  loadReviewRoom().then((m) => ({ default: m.ReviewRoomFromHub })),
);
/** The guests' view's stage, its own chunk, the same way. */
const AsGuestStage = lazy(() =>
  loadAsGuestStage().then((m) => ({ default: m.AsGuestStage })),
);

/**
 * THE HUB'S FLOATING SURFACES, MOUNTED ONCE: every place `?room=` can open, and the code's mini-modal, which it
 * cannot. They sit here, as siblings of the album rather than inside any of its sections, for one reason: radix
 * PORTALS them, so the album stays mounted and scrolled behind whichever is open — which is the whole of the
 * requirement ("the album stays behind it") and the thing a route change could not have given.
 *
 * ★ EVERY ROOM OVER THE HUB (Will, event-header r2 `rooms=over`): Review, Guests and Settings in one panel at a desk
 * and a screen in a hand (`RoomPanel`, Settings' own kind and head), the share kit where it always was, and See it as
 * a guest in a phone over the dimmed hub (`as-guest-stage.tsx`). The reel is no place here: its door is the guests'
 * own view, full screen from the first frame (`reel-card.tsx`).
 *
 * Mounted unconditionally, opened by state: the sheets animate out as well as in, and a surface that unmounts on close
 * has no exit. What is inside a room is its own chunk, mounted as the room opens (a panel's content unmounts as it
 * closes), so the hub's first load carries the doors and never the rooms; the guests' stage mounts the first time it
 * opens and stays, so it has an exit too.
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
  guestsRoom = null,
  doorLine,
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
  /** The hub's own read of the Guests room, when its render's address named the room. */
  guestsRoom?: GuestsRoomData | null;
  /** Who meets the album as it stands, the door's own words: the guests' view says it beside the phone. */
  doorLine: string;
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
  const toggle = (room: "review" | "guests" | "as-guest") => (next: boolean) =>
    next ? openSheet(room) : closeSheet();
  // The stage's chunk is asked for the first time it opens, and it stays mounted after (adjusted during render, the
  // sanctioned "state from a changed prop" shape).
  const [stageMounted, setStageMounted] = useState(sheet === "as-guest");
  if (sheet === "as-guest" && !stageMounted) setStageMounted(true);

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
      <RoomPanel
        room="review"
        open={sheet === "review"}
        onOpenChange={toggle("review")}
        title="Review"
        eventName={event.name}
      >
        {/* The uploader's name on the peek opens their look, with its quiet Block (event-safety `entry=all`), as
            it did on the room's own page. */}
        <HostCreditLookProvider>
          <Suspense fallback={<RoomShimmer shape="grid" />}>
            <ReviewRoomFromHub
              eventId={event.id}
              moderationOn={event.moderation_mode === "hold_for_approval"}
            />
          </Suspense>
        </HostCreditLookProvider>
      </RoomPanel>
      <GuestsPanel
        open={sheet === "guests"}
        onOpenChange={toggle("guests")}
        eventId={event.id}
        eventName={event.name}
        joinUrl={joinUrl}
        qrStyle={event.qr_style}
        door={event.door}
        served={guestsRoom}
      />
      {stageMounted ? (
        <Suspense fallback={null}>
          <AsGuestStage
            open={sheet === "as-guest"}
            onOpenChange={toggle("as-guest")}
            eventId={event.id}
            eventName={event.name}
            doorLine={doorLine}
          />
        </Suspense>
      ) : null}
    </>
  );
}
