"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { Clapperboard, ImagePlus } from "lucide-react";

import { useHostAdd } from "@/components/app/host-add-provider";
import { LivingStills, useLivingClock } from "@/components/app/living-stills";
import { useEventShare } from "@/components/app/share/event-share-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trackAttrs } from "@/lib/analytics/events";
import { refreshHubReelAction } from "@/app/(app)/dashboard/[eventId]/actions";
import {
  useHostAlbum,
  useHubCounts,
  useHubEntries,
} from "@/components/app/event-feed/host-album";
import { developState } from "@/lib/disposable/reveal";
import {
  isPlayableEntry,
  photosToGo,
  playableCount,
  REEL_MINIMUM,
  type ReelState,
} from "@/lib/event/reel-progress";
import { roomHref } from "@/lib/event/sections";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  roomCardSize,
} from "./room-card";

/** What the page hands the Reel card: the reel's state and what it has to show. */
export type ReelCardData = {
  state: ReelState;
  /** Items that can play, capped at the minimum: the pips. */
  have: number;
  /** The minimum the reel plays from. */
  of: number;
  /** One still behind a card one photo short; the reel's opening stills once live. */
  stills: string[];
  /** Whose stills they are: one that leaves the album sends the card for new ones. */
  stillIds?: string[];
  /** The view the guests watch, which the owner opens with every gate passed: `/e/<token>?reel`. */
  viewHref: string;
  /** A moderated event: guests' photos count once the host approves them. */
  moderated: boolean;
  /** What waits in Review now, so the guidance can point at it. */
  pending: number;
  /**
   * The album's develop time (ISO) when one is set. Until it every guest's album, and so their reel, is empty (what
   * they add waits sealed), so the live card says it goes live at the develop rather than that it is live for guests
   * (red-team 43). Absent where there is none.
   */
  developsAt?: string | null;
};

const LABEL = "Highlight reel";

/**
 * THE CARD FOLLOWS THE ALBUM (the album-host-wiring lane: the hub is never refreshed to show an
 * arrival). Its state and pips are the album's playable count against the minimum, read live off the
 * page's store (`isPlayableEntry`, the guest's own rule on the manifest's flags), so the card flips
 * to live on the very photograph that makes the guest's reel appear. Its stills are the reel's own
 * take, which only the server can plan (who uploaded, how liked) and presign, so when the state moves
 * or a still it shows leaves the album, it asks once for that album version
 * (`refreshHubReelAction`), drawing the new state plainly meanwhile. Off the hub, the page's face.
 *
 * ★ THE PAGE'S FACE WINS WHEN IT CHANGES. The switch and the platform's lever live in Settings,
 * whose save re-renders the page and hands this a new face: a card that went live here and was then
 * switched off must say Off, and a card switched back on wears the take the page just read. So a new
 * face from the page replaces whatever this card worked out, and "off" is always the page's word.
 */
export function useLiveReel(eventId: string, reel: ReelCardData): ReelCardData {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const counts = useHubCounts(album);
  const [face, setFace] = useState(() => servedFace(reel));
  // A new face from the page (its object is new only when the page rendered again), adopted during
  // render: React's own pattern for state that follows a prop.
  const [served, setServed] = useState(reel);
  if (served !== reel) {
    setServed(reel);
    setFace(servedFace(reel));
  }
  const playable = useMemo(
    () => (entries ? playableCount(entries, REEL_MINIMUM) : null),
    [entries],
  );
  const gone = useMemo(() => {
    if (!entries || face.stillIds.length === 0) return false;
    const still = new Set(face.stillIds);
    let found = 0;
    for (const e of entries)
      if (still.has(e[0]) && isPlayableEntry(e)) found += 1;
    return found < still.size;
  }, [entries, face.stillIds]);

  const want: ReelState =
    reel.state === "off"
      ? "off"
      : playable === null
        ? face.state
        : playable >= REEL_MINIMUM
          ? "live"
          : "counting";
  const stale = reel.state !== "off" && (want !== face.state || gone);

  // One ask per album the card saw go stale: a late answer that still disagrees waits for the next
  // change, never loops.
  const asked = useRef<readonly unknown[] | null>(null);
  useEffect(() => {
    if (!stale || !entries || asked.current === entries) return;
    asked.current = entries;
    let live = true;
    void refreshHubReelAction(eventId).then((res) => {
      if (live && res.ok) setFace(res.reel);
    });
    return () => {
      live = false;
    };
  }, [stale, entries, eventId]);

  return {
    ...reel,
    state: want,
    have: playable === null ? face.have : Math.min(playable, REEL_MINIMUM),
    // Until the new take lands, a card whose state moved is drawn plain rather than on stills
    // that belong to the state it left.
    stills: want === face.state && !gone ? face.stills : [],
    stillIds: face.stillIds,
    pending: counts?.pending ?? reel.pending,
  };
}

/** The part of the page's reel face the card can later work out, or ask for, on its own. */
function servedFace(reel: ReelCardData) {
  return {
    state: reel.state,
    have: reel.have,
    stills: reel.stills,
    stillIds: reel.stillIds ?? [],
  };
}

/**
 * THE HIGHLIGHT REEL'S CARD (`reel-host`, Will 2026-09-25: `progress=card`, `home=view`).
 *
 * The live reel makes itself from the second photo, so the card is its door and its progress at
 * once, and it COUNTS TO TWO:
 *   - none yet: a dashed card, "Starts at 2 photos";
 *   - one: that photo sits under an overlay, "1 more photo";
 *   - two or more: the living card, the reel's own stills dissolving behind it, and a press opens
 *     the view the guests watch (the owner passes every gate there, and the owner's extras ride
 *     inside it);
 *   - switched off: a plain card that opens Settings, where the switch lives.
 *
 * ★ BEFORE TWO, A PRESS OPENS GUIDANCE, NEVER AN EMPTY REEL (his note: "If clicked, it should also
 * offer clear guidance on the upload progress still needed"): what is left, Add photos (the
 * album's own upload panel, the fastest way to the second photo), and on a moderated event the
 * one fact a host would otherwise trip on, that a guest's photo counts once it is approved.
 *
 * ★ NOTHING HERE MENTIONS THE QUEUE ON A SCREEN. The Review count lives on the hub, in the bell and
 * in Review (his `review` note: a reel playing to a room stays clean while the host moderates from
 * a phone); the guidance names it only to the host, on the host's own page.
 */
export function ReelCard({
  eventId,
  reel,
  stuck,
}: {
  eventId: string;
  reel: ReelCardData;
  stuck: boolean;
}) {
  // ★ THE CARD RESPECTS THE COVER (crumbs-59, red-team 47's NIT). The reel's take is planned on the host's own scope, which
  // sees every photograph she has (she is exempt from the seal), so on an album whose develop time is ahead its stills are
  // exactly what her guests cannot see yet: the live card dissolved through them, and the counting card's one photograph sat
  // under its overlay, "the one picture of what waits that needs no Look". Her hub wears her guests' view meanwhile (the
  // head, its band and the album's cover), so the card draws no photograph until the develop, and the stills come in the
  // moment the time is reached. It follows the develop, as the head and the band do, not Look: Look lifts the album's cover
  // for a visit, and the head stays her guests' while she looks.
  const developing = useDevelopWait(reel.developsAt ?? null);
  const shown =
    developing && reel.stills.length > 0 ? { ...reel, stills: [] } : reel;
  if (shown.state === "live")
    return <LiveCard reel={shown} developing={developing} stuck={stuck} />;
  if (shown.state === "off") return <OffCard eventId={eventId} stuck={stuck} />;
  return <CountingCard eventId={eventId} reel={shown} stuck={stuck} />;
}

/** The label: a card title at rest, a control label stuck (two roles, two elements, one ladder). */
function Label({ stuck }: { stuck: boolean }) {
  return stuck ? (
    <span className="text-xs font-medium">{LABEL}</span>
  ) : (
    <span className="relative font-heading text-card-title">{LABEL}</span>
  );
}

/** The overlay: heavier at the foot where the words sit, so they read over the brightest still. */
function Overlay() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30"
    />
  );
}

/**
 * ★ THE VIEW'S CHUNK STARTS WITH THE PRESS (crumbs-52). The card is a soft navigation to the album's `?reel`, and the
 * view is a lazy chunk that asks for itself only once the album has mounted, so the reel's black (the guest page's
 * curtain) stood over nothing until it landed: on a slow phone (4x CPU, 1.6 Mbps, 150 ms) 1.0 s unwarmed against 0.3 s
 * warmed, measured on a production build. The album's server render is the longer wait, so the chunk is asked for now
 * and lands inside it. A modified click opens a new tab, which loads its own; a failed warm-up is the view's own ask's to
 * retry. (The cover's round warms the same chunk on hover, `live-reel.tsx`.)
 */
function warmReelView(e: ReactMouseEvent) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
    return;
  }
  void import("@/components/guest/reel/live-reel-view").catch(() => {});
}

/** setTimeout holds a delay of 2^31 - 1 ms at most; a develop time farther off re-reads at the ceiling. */
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * Whether the album's develop time is still ahead, read again the moment it comes: a hub left open across the develop
 * must stop saying the reel waits (the one lie this card exists to not tell, turned round).
 */
function useDevelopWait(developsAt: string | null): boolean {
  const [now, setNow] = useState(() => Date.now());
  const waiting = developState(developsAt, now).kind === "waiting";
  useEffect(() => {
    if (!developsAt || !waiting) return;
    const left = Date.parse(developsAt) - Date.now();
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(left, 0) + 50, MAX_TIMER_MS),
    );
    return () => window.clearTimeout(timer);
  }, [developsAt, waiting, now]);
  return waiting;
}

function LiveCard({
  reel,
  developing,
  stuck,
}: {
  reel: ReelCardData;
  /** The album's develop time is still ahead (`useDevelopWait`): the card says so, and draws no still (`ReelCard`). */
  developing: boolean;
  stuck: boolean;
}) {
  const { ref, at } = useLivingClock<HTMLAnchorElement>(reel.stills.length);
  const living = !stuck && reel.stills.length > 0;
  return (
    <Link
      ref={ref}
      href={reel.viewHref}
      onClick={warmReelView}
      data-reel-card="live"
      className={cn(
        ROOM_CARD_BASE,
        roomCardSize(stuck),
        living
          ? "relative overflow-hidden border-transparent text-white"
          : ROOM_CARD_QUIET,
      )}
      {...trackAttrs("cta_click", { cta: "room-reel", location: "hub-cards" })}
    >
      {living && (
        <>
          <LivingStills stills={reel.stills} at={at} />
          <Overlay />
        </>
      )}
      <Clapperboard
        className={cn(
          "relative size-4 shrink-0",
          living ? "text-white/85" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <Label stuck={stuck} />
      <span
        className={cn(
          "relative truncate text-xs",
          ROOM_CARD_VALUE,
          stuck && "hidden",
          living ? "text-white/85" : "text-muted-foreground",
        )}
      >
        {developing ? "Live at the develop" : "Live for guests"}
      </span>
    </Link>
  );
}

function OffCard({ eventId, stuck }: { eventId: string; stuck: boolean }) {
  const { openSheet } = useEventShare();
  return (
    <Link
      href={`/dashboard/${eventId}?room=settings`}
      data-reel-card="off"
      onClick={(e) => {
        // A modified click stays a real navigation; a plain one keeps the album behind the sheet.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        openSheet("settings");
      }}
      className={cn(ROOM_CARD_BASE, roomCardSize(stuck), ROOM_CARD_QUIET)}
      {...trackAttrs("cta_click", {
        cta: "room-reel-off",
        location: "hub-cards",
      })}
    >
      <Clapperboard
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <Label stuck={stuck} />
      <span
        className={cn(
          "truncate text-xs text-muted-foreground",
          ROOM_CARD_VALUE,
          stuck && "hidden",
        )}
      >
        Off
      </span>
    </Link>
  );
}

function CountingCard({
  eventId,
  reel,
  stuck,
}: {
  eventId: string;
  reel: ReelCardData;
  stuck: boolean;
}) {
  const [open, setOpen] = useState(false);
  const add = useHostAdd();
  const { openSheet } = useEventShare();
  const trigger = useRef<HTMLButtonElement>(null);
  // Add photos closed the guidance: its focus goes home without moving the page (the content's note).
  const adding = useRef(false);
  const still = reel.stills[0];
  const onPhoto = Boolean(still) && !stuck;
  const toGo = photosToGo(reel.have);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) adding.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          type="button"
          data-reel-card="counting"
          data-have={reel.have}
          className={cn(
            ROOM_CARD_BASE,
            roomCardSize(stuck),
            "relative text-left",
            stuck
              ? ROOM_CARD_QUIET
              : onPhoto
                ? "overflow-hidden border-transparent text-white"
                : "border-dashed border-foreground/25 hover:border-foreground/40",
          )}
          {...trackAttrs("cta_click", {
            cta: "reel-guidance",
            location: "hub-cards",
          })}
        >
          {onPhoto && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- a presigned R2 preview */}
              <img
                src={still}
                alt=""
                decoding="async"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-black/60" />
            </>
          )}
          <Clapperboard
            className={cn(
              "relative size-4 shrink-0",
              onPhoto ? "text-white/85" : "text-muted-foreground",
            )}
            aria-hidden
          />
          {/* The pips ride the value's line on a phone's two-line card (the
              first line is full with the label) and the icon's row on a tile.
              At none, a phone leaves them to the words: "Starts at 2 photos"
              already says it, and a 320px card has no room for both. */}
          {!stuck && (
            <span
              className={cn(
                "absolute right-2.5 bottom-4 sm:top-4 sm:right-3 sm:bottom-auto",
                reel.have === 0 && "max-sm:hidden",
              )}
            >
              <ReelPips have={reel.have} of={reel.of} light={onPhoto} />
            </span>
          )}
          <Label stuck={stuck} />
          <span
            className={cn(
              "relative truncate text-xs",
              ROOM_CARD_VALUE,
              stuck && "hidden",
              onPhoto ? "text-white/85" : "text-muted-foreground",
            )}
          >
            {reel.have === 0
              ? `Starts at ${reel.of} photos`
              : `${toGo} more ${toGo === 1 ? "photo" : "photos"}`}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 space-y-3"
        data-reel-guidance=""
        // ★ ADD PHOTOS TAKES FOCUS HOME WITHOUT MOVING THE PAGE (crumbs-45; build 36's red-team). Its press
        // starts the smooth scroll to the upload panel (`openAdd`), and the guidance hands focus back to this
        // card at the end of its 150 ms exit. Radix's own return is a plain `focus()`, which scrolls the card
        // into view and so cancels the smooth scroll mid-way (the dropzone stopped 9 to 21 px under a 375x667
        // fold; a probe in Chrome: a plain `focus()` 150 ms into such a scroll left the page at 81 px of its
        // 981, `preventScroll` let it land). So that one close takes focus home itself, unscrolled; every
        // other close keeps Radix's return.
        onCloseAutoFocus={(event) => {
          if (!adding.current) return;
          adding.current = false;
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {reel.have === 0
              ? `Your highlight reel starts at ${reel.of} photos`
              : `${toGo} more ${toGo === 1 ? "photo starts" : "photos start"} your highlight reel`}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            It builds itself from the album and plays for everyone with the
            link.
          </p>
        </div>
        {reel.moderated && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Guests&rsquo; photos count once you approve them.
            {reel.pending > 0 && (
              <>
                {" "}
                {/* ★ REVIEW OPENS OVER THE HUB (event-header r2, `rooms=over`), the guidance folding away as it
                    does: the room's own address, so a modified click is a tab of its own. */}
                <Link
                  href={roomHref(eventId, "review")}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
                      return;
                    e.preventDefault();
                    setOpen(false);
                    openSheet("review");
                  }}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {formatCount(reel.pending)} waiting in Review
                </Link>
              </>
            )}
          </p>
        )}
        {add && (
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={() => {
              adding.current = true;
              setOpen(false);
              add.openAdd();
            }}
            {...trackAttrs("cta_click", {
              cta: "add-photos",
              location: "reel-guidance",
            })}
          >
            <ImagePlus /> Add photos
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The count toward the minimum as pips, filled for each photo there is: a number read in half a
 * glance, never a progress bar pretending a two-step path is long.
 */
function ReelPips({
  have,
  of,
  light,
}: {
  have: number;
  of: number;
  light: boolean;
}) {
  return (
    <span
      data-reel-pips={`${have}/${of}`}
      className="flex items-center gap-1"
      aria-hidden
    >
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full",
            light
              ? i < have
                ? "bg-white"
                : "bg-white/30"
              : i < have
                ? "bg-foreground"
                : "bg-foreground/20",
          )}
        />
      ))}
    </span>
  );
}
