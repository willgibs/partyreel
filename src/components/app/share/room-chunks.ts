import type { EventSheet } from "@/lib/event/sections";

/**
 * EACH ROOM'S CODE IS A CHUNK OF ITS OWN, ASKED FOR ON INTENT (the brief: "Prefetch a room's chunk on intent, so a
 * panel opens at once"). The hub's first load carries the rooms' panels and doors, never what is inside them: the
 * Review room's grid, peek and keys, the Guests room's lists and their confirms, and the guests' view's stage. A
 * pointer coming over a door (or a keyboard's focus on it) asks for the room's chunk, so by the press it is in hand
 * and the panel opens on the room, not on a shimmer waiting for code. ONE promise per chunk serves the warm-up and the
 * lazy boundary alike (`live-reel.tsx`'s precedent), so a press after a hover never asks twice; a failed warm-up is
 * the boundary's own ask's to retry.
 */
let review: Promise<
  typeof import("@/components/app/event-feed/review-room")
> | null = null;
let guests: Promise<
  typeof import("@/app/(app)/dashboard/[eventId]/guests/guests-room")
> | null = null;
let asGuest: Promise<typeof import("./as-guest-stage")> | null = null;

export const loadReviewRoom = () =>
  (review ??= import("@/components/app/event-feed/review-room"));
export const loadGuestsRoom = () =>
  (guests ??= import("@/app/(app)/dashboard/[eventId]/guests/guests-room"));
export const loadAsGuestStage = () => (asGuest ??= import("./as-guest-stage"));

/** Warm a room's chunk on intent. Settings and the share kit are the hub's own code already. */
export function warmRoom(room: EventSheet): void {
  const chunk =
    room === "review"
      ? loadReviewRoom()
      : room === "guests"
        ? loadGuestsRoom()
        : room === "as-guest"
          ? loadAsGuestStage()
          : null;
  // A failed warm-up is not a failure: the lazy boundary asks again when the room opens.
  chunk?.catch(() => {
    if (room === "review") review = null;
    if (room === "guests") guests = null;
    if (room === "as-guest") asGuest = null;
  });
}
