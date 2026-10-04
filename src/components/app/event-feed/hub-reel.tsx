"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";

import type {
  ReelStandIn,
  ReelViewProps,
} from "@/components/guest/reel/live-reel-view";
import { createClipResolver } from "@/lib/album/resolver";
import { playableCount, REEL_MINIMUM } from "@/lib/event/reel-progress";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import { createReelItems } from "@/lib/guest/reconcile-album-items";
import { useReelParam } from "@/lib/guest/reel-url";
import { setReelDefaults } from "@/lib/reel/defaults-action";
import type { LiveMediaItem } from "@/lib/reel/live/items";

import { useHostAlbum, useHubEntries } from "./host-album";
import { loadHubReelView } from "./hub-reel-view";

/**
 * HER REEL ON HER OWN PAGE (Will's Q5, 2026-10-04: "the live reel is the host's to play from her own event page as soon
 * as she opens it, even while the album develops; guests don't have it until the develop"). The view she plays is the
 * guests' own (`live-reel-view.tsx`: the chrome, the dock, the looks, Set for everyone), mounted over the hub on `?reel`
 * of the HUB'S address and fed her own scope: the hub's manifest, sealed shots included, as her hub already reads it.
 *
 * ★ WHY NOT THE GUEST PAGE. `/e/<token>?reel` is the guests' view, her own included: no guest-path read takes the
 * owner's exemption (`disposable-mode.md`), so two viewers of one page never hold two albums under one validator, and
 * an owner opening it before the develop meets what her guests meet (no reel), which is what teaches her the
 * difference. So before the develop the Reel card plays her reel here (`reel-card.tsx`), and after it the card goes on
 * opening the guests' view as it always did. A `?reel` on this address plays at any time, develop or none: it is her
 * own scope either way.
 *
 * ★ NO SCREEN LINK (the view's `screenLink`): Play on a screen opens this address as a screen, and a screen that is not
 * hers cannot open her hub, so a wall plays the reel cast from her own device. Nor Make your own or Add yours here
 * (`creator` and `onAddYours` are not handed in): a clip is made from the guests' view.
 *
 * ★ WHICH LIST PLAYS. The reel's items are the hub's manifest entries that are not hidden and not held (`createReelItems`,
 * the guest provider's own builder: no url, `drawable` said by the flags), so the minimum, the take and the opening are
 * the guest reel's rules over her album; the links come by id through the hub store's own link store
 * (`createClipResolver`), the host's links route, which mints for her scope. It is `isPlayableEntry` that says whether
 * there is a reel at all, the card's own rule, so the card flips to live on the very photograph that lets this open.
 *
 * ★ A `?reel` THAT CANNOT PLAY IS DROPPED QUIETLY, as the guest page drops one: the switch off, the platform lever off,
 * or fewer than two photographs that can play (a host who hides photographs under a playing reel returns to her hub).
 */

const HubReelViewLazy = lazy(() =>
  loadHubReelView().then((m) => ({ default: m.LiveReelView })),
);

/** What the page hands the hub's reel: what the view needs of the event, and what the host's switches say. */
export type HubReelProps = {
  eventId: string;
  eventName: string;
  /** The permanent link the code on the plate encodes. */
  joinUrl: string;
  /** What a person reads off the screen: the custom link's when the event has one, else the permanent one's. */
  displayAddress: string;
  qrStyle: string;
  /** The event's key for this device's own picks of look and hold, as the guest page keys them. */
  qrToken: string;
  /** Whether there is a reel at all: the host's switch and the platform lever (the page's face of them). */
  reelOn: boolean;
  /** The host's defaults the view starts on (`events.reel_style_id`, `reel_hold_sec`; null is the product's own). */
  look: { styleId: string | null; holdSec: number | null };
};

const NO_ITEMS: readonly LiveMediaItem[] = [];

/** An entry the reel may be built from: in the album her guests would see, never hidden and never held. */
const isShown = (e: ManifestEntry) =>
  (e[3] & (ENTRY_HIDDEN | ENTRY_PENDING)) === 0;

export function HubReel({
  eventId,
  eventName,
  joinUrl,
  displayAddress,
  qrStyle,
  qrToken,
  reelOn,
  look,
}: HubReelProps) {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const { mode, close } = useReelParam();
  const [buildItems] = useState(createReelItems);

  const available =
    reelOn &&
    entries !== null &&
    playableCount(entries, REEL_MINIMUM) >= REEL_MINIMUM;
  const playable = useMemo(
    () => (entries ? buildItems(entries.filter(isShown)) : NO_ITEMS),
    [entries, buildItems],
  );

  // A `?reel` that cannot play is dropped, so a refresh does not ask again (and a hub that loses its reel under a viewer
  // returns to the page). Once the album's entries are known: off the hub there is none, and nothing here mounts.
  useEffect(() => {
    if (mode !== null && entries !== null && !available) close();
  }, [mode, entries, available, close]);

  const standIn = useMemo<ReelStandIn | null>(() => {
    if (!album) return null;
    const links = album.store.links;
    return {
      qrToken,
      // The host's own switch and lever are read as on (the view is mounted only when the reel plays); no clip's plan is
      // read, so no creator is offered.
      reel: {
        showReel: true,
        liveReelEnabled: true,
        styleId: look.styleId,
        holdSec: look.holdSec,
        clip: null,
      },
      clips: createClipResolver(links),
      // A still that failed to draw is asked for again by id, the guest album's watchdog: the link goes and is minted afresh.
      reportPossibleExpiry: (ids) => {
        links.forget(ids);
        void links.ensure(ids);
      },
    };
  }, [album, qrToken, look.styleId, look.holdSec]);

  const setForEveryone = useCallback(
    async (picked: { styleId: string; holdSec: number }) => {
      const result = await setReelDefaults({
        eventId,
        styleId: picked.styleId,
        holdSec: picked.holdSec,
      });
      return result.ok;
    },
    [eventId],
  );
  const closeView = useCallback(() => close(), [close]);

  if (mode === null || !available || !standIn) return null;
  const viewProps: ReelViewProps = {
    mode: "hand",
    idle: false,
    eventId,
    eventName,
    joinUrl,
    displayAddress,
    qrStyle,
    isDemo: false,
    playable,
    creator: null,
    addClipToAlbum: null,
    isOwner: true,
    standIn,
    screenLink: false,
    onSetForEveryone: setForEveryone,
    onClose: closeView,
  };
  return (
    <Suspense fallback={<ViewCurtain onClose={closeView} />}>
      <HubReelViewLazy {...viewProps} />
    </Suspense>
  );
}

/**
 * ★ THE PRESS ANSWERS AT ONCE, AND CAN BE TAKEN BACK. The view is a lazy chunk, unwarmed on a touch screen until the
 * press itself, so until it lands the reel's own black stands over the hub (the view's ground is the same black, so the
 * hand-over is not seen) with a way out: a chunk that is slow, or never comes, is never a hub she cannot get back to.
 */
function ViewCurtain({ onClose }: { onClose: () => void }) {
  return (
    <div data-hub-reel-curtain="" className="fixed inset-0 z-50 bg-black">
      <button
        type="button"
        aria-label="Close the reel"
        onClick={onClose}
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
