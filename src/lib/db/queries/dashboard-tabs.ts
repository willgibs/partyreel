/**
 * Dashboard tab loaders (Phase 5 S1 redo): each returns one SERIALIZABLE
 * payload for a client tab section to `use()`. The promises are created in
 * the PAGE BODY (so cookies()/auth run in the request scope) and resolve
 * through the Suspense stream - the guest page's proven shape (LiveGallery).
 *
 * The first S1 attempt rendered async SERVER components as children of the
 * client TabsContent; in production the stream closed with every boundary
 * unresolved (stranded skeletons + a dead tabs subtree, zero errors). See
 * /design/stream-probe + architecture.md. Plain-object payloads only here:
 * promises that cross to client components must resolve to serializable
 * values (Maps become Records).
 */
import "server-only";

import {
  getEventCoverUrls,
  listEvents,
  listRecentlyDeletedEvents,
  type DeletedHostEvent,
  type HostEvent,
} from "@/lib/db/queries/events";
import { getSavedEventCards } from "@/lib/db/queries/saved-events";
import type { SavedEventCardData } from "@/lib/saved-events/card";

export type MergedEventItem =
  | { kind: "hosted"; sortDate: string; event: HostEvent }
  | { kind: "saved"; sortDate: string; card: SavedEventCardData };

export type EventsTabData = {
  merged: MergedEventItem[];
  /** event id -> presigned cover URL (absent = placeholder). */
  covers: Record<string, string>;
};

export async function loadEventsTabData(): Promise<EventsTabData> {
  const [events, savedCards] = await Promise.all([
    listEvents(),
    getSavedEventCards(),
  ]);
  const coverUrls = await getEventCoverUrls(events.map((e) => e.id));

  // The merged "Events" tab (Phase 4): hosted + saved interleaved by recency.
  // Hosted sort by created_at, saved by saved_at, so a just-created OR
  // just-saved event lands at the top. ISO timestamps compare lexically =
  // chronologically.
  const merged: MergedEventItem[] = [
    ...events.map((event) => ({
      kind: "hosted" as const,
      sortDate: event.created_at,
      event,
    })),
    ...savedCards.map((card) => ({
      kind: "saved" as const,
      sortDate: card.savedAt,
      card,
    })),
  ].sort((a, b) =>
    a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0,
  );

  return { merged, covers: Object.fromEntries(coverUrls) };
}

export type TrashTabData = {
  events: DeletedHostEvent[];
  covers: Record<string, string>;
};

export async function loadTrashTabData(): Promise<TrashTabData> {
  const deletedEvents = await listRecentlyDeletedEvents();
  const coverUrls = await getEventCoverUrls(deletedEvents.map((e) => e.id));
  return { events: deletedEvents, covers: Object.fromEntries(coverUrls) };
}
