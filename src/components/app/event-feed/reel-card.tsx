"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";

import { useHostAdd } from "@/components/app/host-add-provider";
import { useEventShare } from "@/components/app/share/event-share-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trackAttrs } from "@/lib/analytics/events";
import {
  useHostAlbum,
  useHubCounts,
  useHubEntries,
} from "@/components/app/event-feed/host-album";
import { developState } from "@/lib/disposable/reveal";
import {
  photosToGo,
  playableCount,
  REEL_MINIMUM,
  type ReelState,
} from "@/lib/event/reel-progress";
import { roomHref } from "@/lib/event/sections";
import { formatCount } from "@/lib/format/count";
import { useReelParam } from "@/lib/guest/reel-url";

import { warmHubReelView } from "./hub-reel-view";
import { reelCardFace } from "./room-card";
import { DoorParts, doorAttrs } from "./room-card-door";

/** What the page hands the Reel card: the reel's state and what it has to show. */
export type ReelCardData = {
  state: ReelState;
  /** Items that can play, capped at the minimum. */
  have: number;
  /** The minimum the reel plays from. */
  of: number;
  /**
   * The reel's opening stills, once the card's picture. ★ NOTHING READS THEM ANY MORE: the card is a plain card among the
   * doors (event-header r4's cards, after Will's round-two note "I don't love filling the highlight reel anymore. we have
   * images in event head and gallery below, this crowds it too much"), so the page no longer hands them and a fixture that
   * still does is read by nobody.
   */
  stills?: string[];
  /** The stills' ids, once what asked for new ones when one left the album (retired with them). */
  stillIds?: string[];
  /** The view the guests watch, which the owner opens with every gate passed: `/e/<token>?reel`. */
  viewHref: string;
  /** A moderated event: guests' photos count once the host approves them. */
  moderated: boolean;
  /** What waits in Review now, so the guidance can point at it. */
  pending: number;
  /**
   * The album's develop time (ISO) when one is set. Until it every guest's album, and so their reel, is empty (what
   * they add waits sealed), so the live card says guests get it later rather than that it is live for them
   * (red-team 43), and its press plays her own reel over her hub (`hub-reel.tsx`, Will's Q5) rather than opening the
   * guests' view, which has none yet. Absent where there is none.
   */
  developsAt?: string | null;
};

/**
 * THE CARD FOLLOWS THE ALBUM (the album-host-wiring lane: the hub is never refreshed to show an arrival). Its state and
 * count are the album's playable count against the minimum, read live off the page's store (`playableCount`, the guest's own
 * rule on the manifest's flags), so the card flips to live on the very photograph that makes the guest's reel appear. Off the
 * hub, the page's face.
 *
 * ★ THE PAGE'S FACE WINS WHEN IT CHANGES, BY HOLDING NO FACE OF ITS OWN. The switch and the platform's lever live in Settings,
 * whose save re-renders the page and hands this a new face: a card that went live here and was then switched off must say Off,
 * and a card switched back on says what the album says. So nothing is kept between renders: `off` is always the page's word,
 * and every other word is read off the page's state and the album's count as they stand. (The card once kept the reel's own
 * take, its stills, and asked the server for new ones as the album moved; with no picture on the card there is nothing to ask
 * for.)
 */
export function useLiveReel(reel: ReelCardData): ReelCardData {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const counts = useHubCounts(album);
  const playable = useMemo(
    () => (entries ? playableCount(entries, REEL_MINIMUM) : null),
    [entries],
  );
  const want: ReelState =
    reel.state === "off"
      ? "off"
      : playable === null
        ? reel.state
        : playable >= REEL_MINIMUM
          ? "live"
          : "counting";
  return {
    ...reel,
    state: want,
    have: playable === null ? reel.have : Math.min(playable, REEL_MINIMUM),
    pending: counts?.pending ?? reel.pending,
  };
}

/**
 * THE HIGHLIGHT REEL'S CARD (`reel-host`, Will 2026-09-25: `progress=card`, `home=view`), a plain card among the doors
 * (event-header r4's cards: the reel's own violet on its glyph, and nothing else of its own).
 *
 * The live reel makes itself from the second photo, so the card is its door and its progress at once, and it COUNTS TO TWO:
 *   - none yet: "Starts at 2 photos"; one: "1 more photo", and a press opens guidance;
 *   - two or more: "Live for guests", and a press opens the view the guests watch (the owner passes every gate there, and
 *     the owner's extras ride inside it), or, while the album's develop time is ahead and the guests' view has no reel,
 *     plays her own over her hub (`hub-reel.tsx`);
 *   - switched off: "Off", and a press opens Settings, where the switch lives.
 *
 * ★ BEFORE TWO, A PRESS OPENS GUIDANCE, NEVER AN EMPTY REEL (his note: "If clicked, it should also offer clear guidance on the
 * upload progress still needed"): what is left, Add photos (the album's own upload panel, the fastest way to the second
 * photo), and on a moderated event the one fact a host would otherwise trip on, that a guest's photo counts once it is
 * approved.
 *
 * ★ NOTHING HERE MENTIONS THE QUEUE ON A SCREEN. The Review count lives on the hub, in the bell and in Review (his `review`
 * note: a reel playing to a room stays clean while the host moderates from a phone); the guidance names it only to the host,
 * on the host's own page.
 *
 * ★ HER REEL IS HERS FROM THE FIRST PHOTOGRAPH, DEVELOP OR NONE (Will's Q5, 2026-10-04: "the live reel is the host's to play
 * from her own event page as soon as she opens it, even while the album develops; guests don't have it until the develop").
 * The card's state is read on her own scope, which sees every photograph she has (she is exempt from the seal). What changes
 * while the develop is ahead is what it SAYS (guests get it later) and where a press goes (`LiveCard`): the guests' view has
 * no reel to open yet, so her own reel plays over her hub. (The card used to draw her photographs; it draws none now, so
 * nothing on it can show what waits sealed.)
 */
export function ReelCard({
  eventId,
  reel,
}: {
  eventId: string;
  reel: ReelCardData;
}) {
  const developing = useDevelopWait(reel.developsAt ?? null);
  if (reel.state === "live")
    return <LiveCard eventId={eventId} reel={reel} developing={developing} />;
  if (reel.state === "off") return <OffCard eventId={eventId} />;
  return <CountingCard eventId={eventId} reel={reel} />;
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
  eventId,
  reel,
  developing,
}: {
  eventId: string;
  reel: ReelCardData;
  /** The album's develop time is still ahead (`useDevelopWait`): the card says guests get it later, and plays her own. */
  developing: boolean;
}) {
  const { open } = useReelParam();
  const value = reelCardFace("live", reel.have, reel.of, developing);
  return (
    <Link
      // ★ BEFORE THE DEVELOP SHE PLAYS HER OWN REEL, ON THIS PAGE (`hub-reel.tsx`). The guests' view is a page of
      // everything guests can see, her own included, so until the develop it has no reel to open; her hub plays hers
      // from her own scope, over itself, and Back returns to it. The address is real (`?reel` on the hub), so a
      // modified click is a tab of its own that opens on the reel. After the develop the card opens the guests' view
      // as it always did, where she passes every gate and the owner's extras ride.
      href={developing ? `/dashboard/${eventId}?reel` : reel.viewHref}
      prefetch={developing ? false : undefined}
      onClick={developing ? (e) => playHere(e, open) : warmReelView}
      onPointerEnter={developing ? warmHubReelView : undefined}
      onFocus={developing ? warmHubReelView : undefined}
      title={
        developing
          ? "Plays your reel now. Guests get it at the develop."
          : undefined
      }
      data-reel-card="live"
      data-reel-plays={developing ? "hub" : "guests"}
      {...doorAttrs("reel", value)}
      {...trackAttrs("cta_click", { cta: "room-reel", location: "hub-cards" })}
    >
      <DoorParts room="reel" face={{ value }} />
    </Link>
  );
}

/** A plain press plays her reel over her hub; a modified one stays the honest navigation, a tab opening on the reel. */
function playHere(e: ReactMouseEvent, open: (mode: "hand") => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
    return;
  e.preventDefault();
  warmHubReelView();
  open("hand");
}

function OffCard({ eventId }: { eventId: string }) {
  const { openSheet } = useEventShare();
  const value = reelCardFace("off", 0, REEL_MINIMUM, false);
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
      {...doorAttrs("reel", value)}
      {...trackAttrs("cta_click", {
        cta: "room-reel-off",
        location: "hub-cards",
      })}
    >
      <DoorParts room="reel" face={{ value }} />
    </Link>
  );
}

function CountingCard({
  eventId,
  reel,
}: {
  eventId: string;
  reel: ReelCardData;
}) {
  const [open, setOpen] = useState(false);
  const add = useHostAdd();
  const { openSheet } = useEventShare();
  const trigger = useRef<HTMLButtonElement>(null);
  // Add photos closed the guidance: its focus goes home without moving the page (the content's note).
  const adding = useRef(false);
  const toGo = photosToGo(reel.have);
  const value = reelCardFace("counting", reel.have, reel.of, false);
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
          {...doorAttrs("reel", value)}
          {...trackAttrs("cta_click", {
            cta: "reel-guidance",
            location: "hub-cards",
          })}
        >
          <DoorParts room="reel" face={{ value }} />
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
