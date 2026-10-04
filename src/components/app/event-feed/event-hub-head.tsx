"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Eye, Users } from "lucide-react";

import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import {
  EventHead,
  type HeadStill,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { PageHeading } from "@/components/shared/page-heading";
import { GlyphCount } from "@/components/ui/glyph-count";
import {
  hubCovered,
  type HubDevelopFacts,
  waitsOf,
} from "@/lib/disposable/host-cover";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import type { Door } from "@/lib/event/door/door";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn, formatEventDate } from "@/lib/utils";

import { EventLive } from "./event-gallery-live";

import { isCoverEntry, newestCoverStills } from "./event-hub-head-stills";
import { HubFactsStrip } from "./event-hub-head-strip";
import { useHostAlbum, useHubEntries, type HubAlbum } from "./host-album";

/* ── the develop, as the hub's head and its band read it ─────────────────── */

/**
 * THE HUB'S DEVELOP FACTS, BY EVENT, FOR WHAT READS THE HEAD'S STILLS BESIDE IT (the rooms' sticky band): the head is
 * handed them by the page and publishes them here once mounted, so a sibling reading the cover's photographs (its face
 * on scroll) holds them to what her guests see too. A client store, per event, written only by the head.
 */
const developByEvent = new Map<string, HubDevelopFacts | null>();
const developListeners = new Set<() => void>();

function publishDevelop(eventId: string, develop: HubDevelopFacts | null) {
  const was = developByEvent.get(eventId);
  if (
    was?.develops_at === develop?.develops_at &&
    was?.sealed_from === develop?.sealed_from &&
    was?.joined === develop?.joined &&
    developByEvent.has(eventId)
  ) {
    return;
  }
  developByEvent.set(eventId, develop);
  for (const listener of developListeners) listener();
}

function subscribeDevelop(listener: () => void) {
  developListeners.add(listener);
  return () => {
    developListeners.delete(listener);
  };
}

/** The develop facts the head published for this event, or null (off the hub, or before the head has mounted). */
function usePublishedDevelop(eventId: string | null): HubDevelopFacts | null {
  return useSyncExternalStore(
    subscribeDevelop,
    () => (eventId ? (developByEvent.get(eventId) ?? null) : null),
    () => null,
  );
}

/**
 * THE HUB'S COVER, LIVE (`event-header` r1, `host=shared`): the stills the page picked on the server
 * (`event-hub-head-stills.ts`), kept true to the album as it moves under Maya's hands. A still she hides,
 * removes or sends back to Review leaves the cover the moment the album's store has it, as it leaves the
 * guests' cover; and a cover that has nothing left to show (the week before, then the first photograph)
 * fills from the album's newest as their links land. Off the hub (no album store), the page's stills.
 *
 * ★ WHILE HER ALBUM DEVELOPS, THE HEAD IS HER GUESTS' (the-wait r1, Will's `cover=guests`): what waits for the develop
 * never dresses her hub's head (nor its band), so her cover stands on what her guests can see, the house light where
 * they see nothing yet. The head is handed the develop facts (`develop`); a reader beside it finds them published.
 */
export function useHubCoverStills(
  served: readonly HeadStill[],
  develop?: HubDevelopFacts | null,
): HeadStill[] {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  // A link that lands re-renders the cover (the newest's stills arrive by id, a window at a time).
  const linksRevision = useLinksRevision(album);
  const published = usePublishedDevelop(album?.eventId ?? null);
  const facts = develop === undefined ? published : develop;
  const nowMs = useWaitClock(Boolean(facts?.develops_at));
  // Before the reader's clock is known (the server's render, the hydrating one), now is the render's own.
  const covered = hubCovered(facts, nowMs ?? undefined);
  const sealedFrom = facts?.sealed_from ?? null;
  // What waits is read by the seal, as her cover's count reads it (`waitsOf`): the period's rule and the held photographs
  // a switch put in the roll, which the page hands down with the develop facts (red-team 46's MEDIUM).
  const joined = facts?.joined;
  return useMemo(() => {
    const waits = covered
      ? waitsOf({ sealed_from: sealedFrom, joined })
      : undefined;
    if (!album || !entries) return covered ? [] : [...served];
    const visible = new Set<string>();
    for (const e of entries)
      if (isCoverEntry(e) && !waits?.(e)) visible.add(e[0]);
    const kept = served.filter((s) => visible.has(s.id));
    if (kept.length > 0) return kept;
    return newestCoverStills(entries, (id) => album.linkOf(id)?.tile, waits);
    // `linksRevision` stands for the links the newest read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, entries, served, linksRevision, covered, sealedFrom, joined]);
}

const noSubscription = () => () => {};
const noRevision = () => 0;

/** The album's link revision, live; nothing to follow off the hub. */
function useLinksRevision(album: HubAlbum | null): number {
  return useSyncExternalStore(
    album ? album.store.links.subscribe : noSubscription,
    album ? album.store.links.revision : noRevision,
    noRevision,
  );
}

/** The hub's cover ground: its photographs over the house light, dissolving as the guests' do. */
export function HubHeadStills({
  served,
  develop,
}: {
  served: readonly HeadStill[];
  develop?: HubDevelopFacts | null;
}) {
  const stills = useHubCoverStills(served, develop);
  return <HeadStills stills={stills} />;
}

/**
 * MAYA'S HEAD (`event-header` r1, `host=shared`): the album's own cover her guests walk into, its
 * photographs dissolving edge to edge under the name, with her tools on it. The code stands on its white mat
 * in the cover's corner, scannable from across a table, and pressing it grows it (`EventCodeDoor`).
 *
 * ★ THE ALBUM'S FACTS ARE THE STRIP ALONG THE FOOT (`event-header` r3, Will's `facts=strip`:
 * `event-hub-head-strip.tsx`): one mark a photograph, the newest lit while they land, ending in the album's
 * number, true for a morning, a weekend, an album with no date and a trickle alike. The number it ends in is
 * the one the line under the title used to carry, so the line keeps the rest: the date, the guests, the views
 * and the Live mark (the board drew none of them; they are quiet glyphs, and the views are the checklist's
 * own "Opened N times", which must read what the eye beside it reads).
 *
 * It bleeds by the wide page's own gutter to the window's edges (`app-shell.tsx`: 12px, 20px from `sm`)
 * and reaches up to the app's bar, taking back the main's 32px (`toBar`), unless something stands above
 * it in the page (Checkout's receipt). The event's name is the page's h1, on the cover's step; the code
 * beside it is a sibling BUTTON, never a child of the heading.
 */
export function HubCover({
  name,
  date,
  endDate,
  counts,
  prettyUrl,
  eventLink,
  code,
  stills,
  develop,
  arrivals,
  toBar = true,
}: {
  name: string;
  date: string | null;
  /** The last day of a range (`events.event_end_date`), or null for one day. */
  endDate?: string | null;
  /** The page's numbers: the album's (live after), the guests, the views. */
  counts: { album: number; guests: number; views: number };
  prettyUrl: string;
  eventLink: string;
  code: {
    qrStyle: string;
    door: Door;
    acceptingUploads: boolean;
    waiting: number;
  };
  /** The cover's photographs, as the page picked them (`event-hub-head-stills.ts`). */
  stills: readonly HeadStill[];
  /**
   * The album's develop facts (the event's row): while a develop time is ahead, the head wears only what her guests can
   * see (the-wait r1, `cover=guests`), and tells what reads its stills beside it. Absent, the head is the album's.
   */
  develop?: HubDevelopFacts | null;
  /**
   * The album's arrivals (`arrivalsOf`'s shape) for a head with no album store to read them off (the Library's
   * specimen): the hub never passes it, since its strip reads the page's own store live.
   */
  arrivals?: readonly number[];
  toBar?: boolean;
}) {
  return (
    <EventHead
      side="hub"
      className={cn("-mx-3 sm:-mx-5", toBar && "-mt-8")}
      ground={<HubHeadStills served={stills} develop={develop ?? null} />}
    >
      <PublishDevelop develop={develop} />
      <div className="flex flex-col gap-3.5 px-3 pb-4 sm:gap-5 sm:px-5 sm:pb-7">
        <div className="flex items-end gap-4 sm:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <PageHeading className="text-section text-balance text-white sm:text-chapter">
              {name}
            </PageHeading>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
              {date && (
                <span>
                  <RangeText text={formatEventDate(date, endDate)} />
                </span>
              )}
              <GlyphCount
                icon={<Users />}
                count={counts.guests}
                label={
                  counts.guests === 1
                    ? "1 guest"
                    : `${formatCount(counts.guests)} guests`
                }
              />
              <GlyphCount
                icon={<Eye />}
                count={counts.views}
                label={
                  counts.views === 1
                    ? "1 view"
                    : `${formatCount(counts.views)} views`
                }
              />
              {/* ★ THE LIVE MARK (`first=live`, Will 2026-09-21): nothing until the Realtime channel is
                  actually subscribed, since "Live" over a dead socket is worse than no mark. */}
              <EventLive />
            </div>
            <EventLinkRow prettyUrl={prettyUrl} permanentUrl={eventLink} />
          </div>
          <EventCodeDoor
            eventName={name}
            joinUrl={eventLink}
            qrStyle={code.qrStyle}
            door={code.door}
            acceptingUploads={code.acceptingUploads}
            waiting={code.waiting}
          />
        </div>
        {/* The album's count, live off the album's store (the page is never refreshed to move it). */}
        <HubFactsStrip served={counts.album} arrivals={arrivals} />
      </div>
    </EventHead>
  );
}

/** The head's develop facts, published for its siblings once it has mounted (`usePublishedDevelop`). */
function PublishDevelop({ develop }: { develop?: HubDevelopFacts | null }) {
  const album = useHostAlbum();
  const eventId = album?.eventId ?? null;
  const developsAt = develop?.develops_at ?? null;
  const sealedFrom = develop?.sealed_from ?? null;
  const joined = develop?.joined;
  useEffect(() => {
    if (!eventId || develop === undefined) return;
    publishDevelop(eventId, {
      develops_at: developsAt,
      sealed_from: sealedFrom,
      joined,
    });
  }, [eventId, develop, developsAt, sealedFrom, joined]);
  return null;
}
