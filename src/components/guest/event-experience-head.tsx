"use client";

import "./event-experience-head.css";

import {
  memo,
  Suspense,
  use,
  useEffect,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
  type Ref,
  useSyncExternalStore,
} from "react";
import { Images, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlyphCount } from "@/components/ui/glyph-count";
import { liveReelAvailable } from "@/lib/events/gallery-reel";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import { albumCountWords } from "@/lib/export/take-home";
import { createReelItems } from "@/lib/guest/reconcile-album-items";
import { tileStills } from "@/lib/guest/reel-tile";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import type { LiveMediaItem } from "@/lib/reel/live/items";
import { cn, formatEventDate } from "@/lib/utils";

/**
 * THE EVENT'S HEAD, ONE ON BOTH SIDES OF THE CODE (`event-header` r1: `guest=cover`, `host=shared`).
 *
 * The album a guest walks into opens on its COVER: the reel's own photographs dissolving edge to edge
 * under the event's name, the words and the actions standing white on them. Maya's hub wears the same
 * head with her tools on it (her counts and link, the code on its white mat), so she sees her party as
 * her guests do, and one design is built and polished once. This file is that head's frame and its
 * ground; each side composes its own words in it (`event-experience.tsx`, the hub's page).
 *
 * ★ THE GROUND IS ALWAYS LIT. Under every cover stands the house light (`HouseLight`): an album with
 * nothing to show yet, one still sealed until it develops (disposable mode: its photographs never reach
 * a guest's payload before then, so the cover has none to draw), and the beat before the first
 * photograph's link lands all stand on the same lit room, and the photographs dissolve in over it when
 * there are any. So no state needs predicting: a cover is the light, plus whatever stills are in hand.
 *
 * ★ A PHOTOGRAPH IS THE GROUND, SO THE HEAD IS THE ROOM (`dark`), in both themes, and marked
 * `data-surface="photo"` (the atom contract): every token its words read is the room's, and the controls
 * on it are the photograph's own (`Button`'s `on-photo` and `glass`).
 *
 * ★ THE LANDING IS NAMED (door-reveal's, next): the head is `[data-event-head]`, its photographs
 * `[data-head-stills]`, each still `[data-head-still="<slot>"]` (slot 0 the one a reduced-motion reader
 * sees), so the door's walk-through can settle the album's photographs into exactly these places.
 */

/** One photograph the cover dissolves through: its id, and its small preview's link. */
export type HeadStill = { id: string; tile: string };

/** How many photographs a cover dissolves through: six, the head of the reel's own take (`TILE_SLOTS`). */
export const COVER_SLOTS = 6;

/** A still holds this long, in seconds, before the next dissolves in (`living-stills.tsx`'s calm). */
const HOLD_SEC = 4.6;

/** The house's first hue (the coral): the room's light where the album has none of its own yet. */
const HOUSE_HUE = 25;

/* ── the ground ──────────────────────────────────────────────────────────────────────────────── */

/** THE HOUSE LIGHT: the house's own warmth, the room before anyone's photograph is in it. */
export function HouseLight({ hue = HOUSE_HUE }: { hue?: number }) {
  return (
    <div
      aria-hidden
      data-head-light=""
      className="head-light"
      style={{ "--head-h1": hue } as CSSProperties}
    />
  );
}

/**
 * THE COVER'S PHOTOGRAPHS, dissolving (`event-experience-head.css`): six slots of one CSS keyframe, so
 * the dissolve runs from the first byte of HTML and off the main thread; one photograph simply stands.
 * The scrim comes with them, since only a photograph needs one. Nothing at all without a still, so the
 * house light under it shows.
 */
export function HeadStills({
  stills,
  onStillError,
  className,
}: {
  stills: readonly HeadStill[];
  /** A still's picture failed the way an expired link does: the album's watchdog re-mints it by id. */
  onStillError?: (id: string) => void;
  className?: string;
}) {
  const unique = uniqueStills(stills);
  if (unique.length === 0) return null;
  const cycle = unique.length > 1;
  const slots = cycle
    ? Array.from({ length: COVER_SLOTS }, (_, i) => unique[i % unique.length])
    : unique;
  const total = HOLD_SEC * COVER_SLOTS;
  return (
    <div
      aria-hidden
      data-head-stills={unique.length}
      className={cn("head-stills absolute inset-0", className)}
    >
      {slots.map((still, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a link that expires)
        <img
          key={`${i}-${still.id}`}
          src={still.tile}
          alt=""
          draggable={false}
          decoding="async"
          // The first is the cover itself: it is the page's largest picture at landing.
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "auto"}
          data-head-still={i}
          data-rest={i === 0 ? "" : undefined}
          data-cycle={cycle ? "" : undefined}
          onError={onStillError ? () => onStillError(still.id) : undefined}
          className="head-still"
          style={
            {
              "--head-hold": HOLD_SEC,
              "--head-delay": i * HOLD_SEC - total,
            } as CSSProperties
          }
        />
      ))}
      <div className="head-scrim" />
    </div>
  );
}

/**
 * ★ THE PHOTOGRAPH THE REEL OPENS ON (guest-moments r1, Will's `opening=still`): the cover's first still, slot 0, the
 * one the cover loads first and a reduced-motion reader sees, which while the album has a reel is the reel's own
 * opening (`pickCoverIds`). One rule for the page's curtain, before the view has arrived, and for the view, which
 * stands it until its first frame and leads its take with it; null where the cover has none (the house light).
 */
export function openingStillOf(stills: readonly HeadStill[]): HeadStill | null {
  return uniqueStills(stills)[0] ?? null;
}

function uniqueStills(stills: readonly HeadStill[]): HeadStill[] {
  const seen = new Set<string>();
  const out: HeadStill[] = [];
  for (const still of stills) {
    if (!still.tile || seen.has(still.id)) continue;
    seen.add(still.id);
    out.push(still);
  }
  return out;
}

/* ── the frame ───────────────────────────────────────────────────────────────────────────────── */

/**
 * THE HEAD'S FRAME: the room, its light, the photographs (`ground`) and the words at its foot. The two
 * sides are two heights of one object: the album's cover takes most of a phone's first screen (the
 * party is the first thing a guest sees), and the hub's is a band under the app's bar (a host's page
 * is a working page first).
 */
export function EventHead({
  side,
  ground,
  children,
  className,
  ...props
}: ComponentProps<"section"> & {
  side: "album" | "hub";
  /** The photographs over the light: `HeadStills`, or a reader that draws them when they arrive. */
  ground?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      data-event-head={side}
      data-surface="photo"
      className={cn(
        "dark relative isolate flex flex-col justify-end overflow-hidden bg-background text-foreground",
        // The album's cover is `--cover-h` tall (`event-experience-head.css`), the one height the door's
        // view of it is drawn at (`CoverPicture`, set small in the doorway).
        side === "album" ? "h-(--cover-h)" : "h-[20.5rem] sm:h-[25rem]",
        className,
      )}
      {...props}
    >
      <HouseLight />
      {ground}
      {/* The words stand over the ground's stacking: `relative` alone, so the ground's
          absolutely placed layers paint under them. */}
      <div className="relative">{children}</div>
    </section>
  );
}

/* ── the album's cover: the guest's head ──────────────────────────────────────────────────────── */

/** Who hosts the album, as its byline draws her: the name she set, and her face where she has one. */
export type CoverHost = {
  name: string;
  /** Her photograph's presigned link, or null (her seeded initial stands in). */
  avatarUrl: string | null;
  /** `seedFor(host_id)`, the one-way hash that colours her initial. */
  seed: string | null;
};

/**
 * THE ALBUM'S COVER (`event-header` r1, `guest=cover`): the event's name over the reel's photographs,
 * one line of who and when, the host's note, and the actions standing on them. Its words keep the
 * page's left line (20px in, the header's logo and the album's first column). At a desk the words take
 * the left and the actions the right, Add nearest the edge where a cursor already is (the tab order
 * keeps Add first); at a phone the actions are the cover's last line, Add taking the width.
 *
 * ★ THE FEWEST WORDS (the round's bar: "far less text"). "Hosted by" goes: her face and name say it.
 * The counts are glyphs, their words on hover and a tap (`GlyphCount`, the carried call `glyphs`), and
 * only at a desk: at a phone the album's own label under the cover says the count, and a cover is not
 * the place to say it twice. The note keeps two lines at a phone, three at a desk.
 *
 * ★ THE COUNT'S WORDS NAME WHAT THE ALBUM HOLDS FROM THE FIRST BYTE (crumbs-74): the live album's own words
 * (`mediaWords`) once it has told, and until then the server's own count of the kinds (`mediaKinds`, the page's
 * `stats.kinds`), through the one function both say it with (`albumCountWords`), so "12 photos" is never "12
 * photos & videos" for the beat before the live album arrives. Neither: both nouns, as a cover with no word of
 * its kinds always said.
 *
 * Every word arrives on the page's reveal (`data-arrive`, `data-reveal`), so a door's success beat
 * holds them with the album's tiles and they rise as the door leaves (globals.css's reveal curtain).
 */
export function AlbumCover({
  ref,
  ground,
  eyebrow,
  name,
  host,
  date,
  endDate,
  description,
  mediaCount,
  mediaWords,
  mediaKinds,
  guestCount,
  actions,
  actionsRef,
  className,
}: {
  /** The cover's own box (the demo's pinned header watches it). */
  ref?: Ref<HTMLElement>;
  ground?: ReactNode;
  /**
   * A word over the event's name: the preset named where a guest meets it, with when it develops (the-wait r1's name
   * ask: "Disposable · develops 9 am", `coverEyebrow`). Nothing for an album that never develops.
   */
  eyebrow?: ReactNode;
  name: string;
  /** The byline's host: null where she set no name (no byline name, no face). */
  host: CoverHost | null;
  date: string | null;
  /** The last day of a range (`events.event_end_date`), or null for one day. */
  endDate?: string | null;
  description: string | null;
  mediaCount: number;
  /**
   * What the count holds, said as the album's live source names it ("12 photos": `albumCountWords`), once it has told;
   * until then `mediaKinds` says it, and with neither, both nouns.
   */
  mediaWords?: string;
  /**
   * What the album holds by kind, as the server counted it for the first paint (`getGalleryStats`'s `kinds`): the
   * count's words before the live album has told, in the words the live album says them in. Null where the live
   * album names none either (a teaser's nine cannot see in) or the server could not say.
   */
  mediaKinds?: { photos: number; videos: number } | null;
  guestCount: number;
  /** The cover's actions (Add photos white on it, the glass rounds beside). */
  actions: ReactNode;
  /** The actions' row: the sentinel the shutter waits on (it takes over once the row has gone). */
  actionsRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <EventHead ref={ref} side="album" ground={ground} className={className}>
      <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div className="min-w-0 md:max-w-2xl">
          {eyebrow ? (
            <p
              data-arrive
              data-cover-eyebrow=""
              style={{ "--arrive-i": 0 } as CSSProperties}
              className="mb-2 text-label font-medium text-white/80 uppercase"
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            data-arrive
            style={{ "--arrive-i": 0 } as CSSProperties}
            className="font-heading text-title text-balance"
          >
            {name}
          </h1>
          {(host || date) && (
            <p
              data-reveal
              style={{ "--reveal-i": 0 } as CSSProperties}
              className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/85"
            >
              {host && (
                <span className="flex items-center gap-2">
                  <Avatar seed={host.seed ?? undefined} size="sm">
                    <AvatarImage src={host.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {host.name.trim().charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-white">{host.name}</span>
                </span>
              )}
              {host && date && (
                <span aria-hidden className="text-white/45">
                  ·
                </span>
              )}
              {date && (
                <span>
                  <RangeText text={formatEventDate(date, endDate)} />
                </span>
              )}
              {mediaCount > 0 && (
                <span className="hidden items-center gap-x-2.5 md:flex">
                  {(host || date) && (
                    <span aria-hidden className="text-white/45">
                      ·
                    </span>
                  )}
                  <GlyphCount
                    icon={<Images />}
                    count={mediaCount}
                    label={
                      mediaWords ??
                      albumCountWords({
                        count: mediaCount,
                        kinds: mediaKinds ?? null,
                      })
                    }
                  />
                  {guestCount > 0 && (
                    <GlyphCount
                      icon={<Users />}
                      count={guestCount}
                      label={`${formatCount(guestCount)} ${guestCount === 1 ? "guest" : "guests"}`}
                    />
                  )}
                </span>
              )}
            </p>
          )}
          {description && (
            <p
              data-reveal
              style={{ "--reveal-i": 1 } as CSSProperties}
              className="mt-3 line-clamp-2 max-w-xl text-working text-pretty text-white/80 md:line-clamp-3"
            >
              {description}
            </p>
          )}
        </div>
        <div
          ref={actionsRef}
          data-reveal
          data-cover-actions=""
          style={{ "--reveal-i": 2 } as CSSProperties}
          className="mt-5 flex flex-wrap items-center gap-2 md:mt-0 md:shrink-0 md:flex-row-reverse md:flex-nowrap"
        >
          {actions}
        </div>
      </div>
    </EventHead>
  );
}

/* ── where a cover's photographs come from ───────────────────────────────────────────────────── */

/**
 * WHICH PHOTOGRAPHS A COVER SHOWS, by id (one rule for the page's first paint and the live album, so
 * the two never disagree): the reel's own opening while the album has a reel (its take's first pass,
 * `tileStills`, so the cover opens on what the reel plays, never the album's newest, which sit right
 * under the cover), and otherwise the album's newest photographs (a reel switched off, or one photograph
 * short of starting). Only what the reel itself may draw: a clip someone added is never a cover.
 */
export function pickCoverIds(
  items: readonly LiveMediaItem[],
  opts: {
    eventId: string;
    ownIds?: ReadonlySet<string> | null;
    /** The album has a reel right now (`liveReelAvailable`). */
    reelOn: boolean;
  },
): string[] {
  if (opts.reelOn) {
    return [
      ...new Set(
        tileStills(items, { eventId: opts.eventId, ownIds: opts.ownIds }).map(
          (s) => s.id,
        ),
      ),
    ];
  }
  const out: string[] = [];
  for (const item of items) {
    if (item.reelEligible === false || item.drawable === false) continue;
    out.push(item.id);
    if (out.length === COVER_SLOTS) break;
  }
  return out;
}

/**
 * THE COVER FROM THE PAGE'S OWN SEED, for the first paint: the photographs the cover rule picks, with
 * the links the seed already carries (the server mints the reel's opening stills with the first paint,
 * `loadGallerySeed`, and the newest are the first paint's own). A still whose link is not in the seed is
 * left for the live album to bring. A teaser draws its own nine's newest; a locked page has none.
 */
export function stillsFromSeed(
  seed: GallerySeed,
  eventId: string,
): HeadStill[] {
  if (seed.kind === "full") {
    const items = createReelItems()(seed.sync.entries);
    const ids = pickCoverIds(items, {
      eventId,
      ownIds: null,
      reelOn: liveReelAvailable(seed.sync.reel, items),
    });
    const tiles = new Map(seed.links.links.map(([id, tile]) => [id, tile]));
    return ids.flatMap((id) => {
      const tile = tiles.get(id);
      return tile ? [{ id, tile }] : [];
    });
  }
  if (seed.kind === "teaser") {
    const out: HeadStill[] = [];
    for (const item of seed.sync.items) {
      const tile = item.previewUrl ?? (item.type === "photo" ? item.url : null);
      if (!tile) continue;
      out.push({ id: item.id, tile });
      if (out.length === COVER_SLOTS) break;
    }
    return out;
  }
  return [];
}

/* ── the bridge: the live album, which streams in under the page's Suspense, to the head above it ─ */

/**
 * WHAT THE LIVE ALBUM TELLS THE HEAD. The album's live source mounts behind the page's <Suspense>
 * (the presign-heavy seed streams in after the shell), and the head is the shell: it paints first and
 * stands through the album's own failure (`album-boundary.tsx`). So the head cannot sit inside the
 * source; the source publishes what the head needs into this store instead, the shape the tracker's
 * button already reads its facts through (`createUploadTrackerStore`): the cover's photographs as the
 * album moves (an upload of hers leads the reel on her own device), and the reel's door for the head's
 * round and the shutter's twin.
 */
export type HeadReel = {
  /** The album has a reel this viewer may open right now. */
  available: boolean;
  /** Open the reel's view. */
  open: () => void;
  /** Warm the view's chunk on intent (a pointer over the door), so the first press opens at once. */
  preload: () => void;
  /**
   * The address asks for the reel and the view stands (or is about to): the page's curtain for an
   * owner arriving from her hub reads it (`event-experience.tsx`).
   */
  viewAsked: boolean;
  /** Close the reel as the view's own Close does (the owner back where she came from): the curtain's Close. */
  close: () => void;
};

export type HeadBridgeState = {
  stills: readonly HeadStill[];
  /** The album's watchdog, for a still whose link died. */
  reportExpiry: (ids: readonly string[]) => void;
  reel: HeadReel;
};

export type HeadBridge = {
  get: () => HeadBridgeState | null;
  subscribe: (listener: () => void) => () => void;
  set: (next: HeadBridgeState | null) => void;
};

export function createHeadBridge(): HeadBridge {
  let state: HeadBridgeState | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener();
    },
  };
}

const NO_BRIDGE_STATE = () => null;

/**
 * ★ THE REEL'S OPENING PHOTOGRAPH, CHOSEN ONCE (guest-moments r1, `opening=still`). The page's curtain stands a
 * photograph from its first byte, the seed's slot 0, which the server can only pick with nothing of hers leading (it
 * cannot see a guest's own uploads); the live cover leads with her own newest once the album knows them, and the
 * owner's own uploads lead hers. Read twice, the curtain would stand one photograph and the view open on another, a
 * swap in the very second the curtain exists to make calm (measured: the view's still changed photograph 60 ms after it
 * stood). So the curtain pins the photograph it stands, and the reel's controller opens the view on the pin: one
 * photograph from the press to the reel's first frame. The page clears it when the curtain goes, so a reel opened later
 * from the cover opens on the cover's own first still.
 */
export type OpeningPin = {
  get: () => HeadStill | null;
  set: (still: HeadStill | null) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createOpeningPin(): OpeningPin {
  let still: HeadStill | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => still,
    set(next) {
      if (next === still) return;
      still = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const NO_PIN = () => null;
const noPinSubscription = () => () => {};

/** The pinned opening photograph, or null (no pin, or none chosen yet). */
export function useOpeningPin(
  pin: OpeningPin | null | undefined,
): HeadStill | null {
  return useSyncExternalStore(
    pin?.subscribe ?? noPinSubscription,
    pin?.get ?? NO_PIN,
    NO_PIN,
  );
}

/** The live album's word to the head, or null until the album has mounted (the server's and the hydration's answer). */
export function useHeadBridge(bridge: HeadBridge): HeadBridgeState | null {
  return useSyncExternalStore(bridge.subscribe, bridge.get, NO_BRIDGE_STATE);
}

/* ── the guest's ground: the seed first, then the live album ──────────────────────────────────── */

type SeedRead = GallerySeed | null;
/** One read per seed, never thrown: a seed that failed leaves the cover on its light. */
const seedReads = new WeakMap<Promise<GallerySeed>, Promise<SeedRead>>();

/**
 * The page's seed, read and never thrown (the album's own source reads it the same way,
 * `gallery-live.tsx`'s `readSeed`): a failure is the album's to say, and the cover keeps its light.
 * ★ `Promise.resolve` FIRST: the page's promise is React Flight's decoded thenable, whose `then`
 * returns nothing, so a chain straight off it would hand `use()` an `undefined`.
 */
function readSeed(page: Promise<GallerySeed>): Promise<SeedRead> {
  let read = seedReads.get(page);
  if (!read) {
    read = Promise.resolve(page).then(
      (seed) => seed,
      () => null,
    );
    // ★ A SEED THAT HAS ALREADY ARRIVED IS READ AT ONCE (album-moments-wiring, measured on `?reel`: the curtain's
    // photograph and the cover's both vanished for 120 ms at hydration, whenever the seed had streamed in before the
    // page hydrated). The chain above is a fresh promise, pending for a tick even over a seed in hand, and `use()` on a
    // pending promise suspends: the boundary the server drew was put back to its fallback (nothing) until the tick
    // passed. React Flight's thenable takes its value as `then` is called (`initializeModelChunk`) and says so on
    // `status` and `value`, which `use()` reads before it ever suspends; so the read is told the same, and the
    // hydration draws exactly what the server drew.
    const arrived = page as Promise<GallerySeed> & {
      status?: string;
      value?: GallerySeed;
    };
    if (typeof arrived.then === "function")
      arrived.then(
        () => {},
        () => {},
      );
    if (arrived.status === "fulfilled")
      Object.assign(read, { status: "fulfilled", value: arrived.value });
    else if (arrived.status === "rejected")
      Object.assign(read, { status: "fulfilled", value: null });
    seedReads.set(page, read);
  }
  return read;
}

function CoverStills({
  seed,
  bridge,
  eventId,
}: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
}) {
  const live = useHeadBridge(bridge);
  // The live album's word once it has one (it moves with the album); until then the page's own seed,
  // which is what the server drew, so the first paint and the hydration agree.
  const read = live ? null : use(readSeed(seed));
  const stills = live ? live.stills : read ? stillsFromSeed(read, eventId) : [];
  return (
    <HeadStills
      stills={stills}
      onStillError={live ? (id) => live.reportExpiry([id]) : undefined}
    />
  );
}

/**
 * THE REEL'S FIRST PHOTOGRAPH, ON THE PAGE'S CURTAIN (`event-experience-curtain.tsx`): the cover's own slot 0, from the
 * page's seed in the very HTML the server streams (as `CoverStills` draws it, the same link, so the browser fetches it
 * once for both), then from the live album's word. Nothing until either is in hand: the curtain's dark stands.
 */
function CurtainStill({
  seed,
  bridge,
  eventId,
  pin,
  className,
}: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
  pin: OpeningPin;
  className?: string;
}) {
  const live = useHeadBridge(bridge);
  const pinned = useOpeningPin(pin);
  // The seed's own pick first (what the server drew, so the first paint and the hydration agree), the live album's
  // where the seed carried no link for it; once one stands, the pin holds it.
  const read = pinned ? null : use(readSeed(seed));
  const still =
    pinned ??
    openingStillOf(read ? stillsFromSeed(read, eventId) : []) ??
    openingStillOf(live?.stills ?? []);
  useEffect(() => {
    if (still && !pin.get()) pin.set(still);
  }, [still, pin]);
  if (!still) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a link that expires)
    <img
      src={still.tile}
      alt=""
      aria-hidden
      draggable={false}
      fetchPriority="high"
      data-reel-curtain-still={still.id}
      className={className}
    />
  );
}

/**
 * ★ A SEED'S BOUNDARY IS MEMOIZED, SO NO RENDER OF THE PAGE REACHES IT BEFORE IT HYDRATES (album-moments-wiring,
 * measured on a slow line: the curtain's photograph and the cover's vanished for 100 to 450 ms as the page hydrated).
 * The server streams the boundary's photographs long before the page's script runs, and the page renders again the
 * moment it hydrates (its stored session, the door's first word); a render that reaches a boundary still waiting to
 * hydrate, whose seed the client has not decoded yet, makes React draw it afresh from its fallback, which is nothing.
 * Its props never change (the page's seed and stores, held for its life), so a memo stops every such render at the
 * boundary's door and the photographs the server drew stand until it hydrates in its own time.
 */
function OpeningStillBoundary(props: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
  /** Where the photograph it stands is pinned, for the view to open on (`OpeningPin`). */
  pin: OpeningPin;
  className?: string;
}) {
  return (
    <Suspense fallback={null}>
      <CurtainStill {...props} />
    </Suspense>
  );
}

/** The curtain's photograph in a boundary of its own, so the curtain's dark streams with the page's first byte. */
export const OpeningStill = memo(OpeningStillBoundary);

/**
 * THE ALBUM'S COVER GROUND: its photographs from the page's seed in the very HTML the server streams
 * (the seed resolves inside this small boundary, so the cover's pictures arrive with the album's first
 * rows, before any script runs), then from the live album as it moves. Until the seed lands, the light.
 */
function CoverGroundBoundary({
  seed,
  bridge,
  eventId,
}: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
}) {
  return (
    <Suspense fallback={null}>
      <CoverStills seed={seed} bridge={bridge} eventId={eventId} />
    </Suspense>
  );
}

/** Memoized for the reason `OpeningStill` is: a page render never reaches the boundary before it hydrates. */
export const CoverGround = memo(CoverGroundBoundary);

/**
 * THE COVER, SEEN THROUGH THE DOOR (door-reveal, locked-door r3's `reveal=through`: "The album's own
 * photographs, small and lit, through the door; walking through, the doorway grows past the screen and
 * they settle into place"). The album's cover drawn a second time without its words: its room, its house
 * light and its photographs from the same seed and the same live album as the cover itself, filling the
 * box the doorway sets at the cover's own size and small in its opening (`door/doorway.tsx`'s `view`). So
 * the photographs dissolving in the doorway are the cover's, in step with it, and the walk
 * (`door/stage-walk.ts`) carries this very picture onto the cover, where the cover's words then rise.
 */
export function CoverPicture({
  seed,
  bridge,
  eventId,
}: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
}) {
  return (
    <div
      data-cover-picture=""
      data-surface="photo"
      className="dark relative isolate size-full overflow-hidden bg-background"
    >
      <HouseLight />
      <CoverGround seed={seed} bridge={bridge} eventId={eventId} />
    </div>
  );
}
