"use client";

import {
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useState,
} from "react";
import {
  Clapperboard,
  ListChecks,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  guestsCardFace,
  reelCardFace,
  reviewCardFace,
  type RoomFace,
  settingsCardFace,
} from "@/components/app/event-feed/room-card";
import { CodeChip } from "@/components/ui/code-chip";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { stepsLeft } from "@/lib/events/readiness";
import { cn } from "@/lib/utils";

import type { Case } from "./fixtures";
import type { Ground, ScreenId } from "./scene";
import type { PaperId } from "./seam";

/**
 * WHAT EVERY DOOR OPTION SHARES: the rooms, their faces, and the one contract
 * a door draws itself through, so each take on the cards (`cards.tsx`, on
 * `card-kit.tsx`'s row and fold) stands on one Seam (`seam.tsx`) and the hub
 * composes whichever the board asks for.
 *
 * The row is production's order (`EVENT_ROOMS`: the reel, Guests, Review,
 * Settings) with See it as a guest last, the payoff at the row's end
 * (`AS_GUEST_DOOR`). Every press opens its room over the hub, as wired.
 *
 * ★ A COUNT THAT NEEDS HER IS ONE STATUS TOKEN (`needs.css`, round six's
 * second ask): people at the door or uploads in Review, and nothing else,
 * worn by the cards and the code's corner alike, so the two never disagree.
 *
 * ★ SETTINGS' COUNT IS PLAIN, NEVER A STATUS (the call G4): "2 left" is hers to
 * act on, nothing waits on her, so it reads in the foreground ink (`strong`);
 * and while uploads are paused its door says so in the uploads' own word,
 * Paused (`uploadsLabel`), never Closed, which is a door's word.
 */

export type RoomId = "reel" | "guests" | "review" | "settings" | "guest";

/** The rooms a door opens, in production's order, the guest's view last. */
export const ROOM_ORDER: readonly RoomId[] = [
  "reel",
  "guests",
  "review",
  "settings",
  "guest",
];

/** A room's whole name: a roomy door's title, a small one's accessible name. */
export const ROOM_LABEL: Record<RoomId, string> = {
  reel: "Highlight reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "As a guest",
};

/** The word a small door has room for. */
export const ROOM_SHORT: Record<RoomId, string> = {
  reel: "Reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "As a guest",
};

/** Production's glyphs (`event-cards-row.tsx`, `reel-card.tsx`). */
export const ROOM_ICON: Record<RoomId, LucideIcon> = {
  reel: Clapperboard,
  guests: Users,
  review: ListChecks,
  settings: Settings,
  guest: Smartphone,
};

/** A door's face: production's own (`room-card.ts`'s `RoomFace`): its line, and the count that needs her or one hers to act on. */
export type DoorFace = RoomFace;

/**
 * Every door's face, from the album's facts, IN PRODUCTION'S OWN WORDS: the
 * Guests, Review and Settings faces are `room-card.ts`'s (`guestsCardFace`,
 * `reviewCardFace`, `settingsCardFace`), as the reel's line already is
 * (`reelCardFace`), so the board can never word a door two ways.
 */
export function facesOf(c: Case): Record<RoomId, DoorFace> {
  // The day after the event's date the checklist steps aside, and Settings stops counting (`checklistOver`).
  const left = c.over ? 0 : stepsLeft(c.ready);
  const reelState = c.reel === "live" ? "live" : "counting";
  const review = reviewCardFace(true, c.review);
  return {
    reel: { value: reelCardFace(reelState, c.reelHave, REEL_MINIMUM, false) },
    guests: guestsCardFace({ waiting: c.waiting, guests: c.guests, shots: 0 }),
    review: {
      value: review.value,
      amber: review.amber || undefined,
      count: review.count,
    },
    settings: settingsCardFace({
      left,
      accepting: c.ready.acceptingUploads,
      door: c.door,
    }),
    guest: { value: "What they see" },
  };
}

/** A door's whole accessible name: its room, then its line ("Review: 8 waiting"). */
export const doorName = (room: RoomId, face: DoorFace) =>
  `${ROOM_LABEL[room]}: ${face.value}`;

export type DoorPress = (room: RoomId) => void;

/**
 * WHAT A DOOR OPTION IS HANDED, in every place it draws.
 *
 * ★ MARK EVERY DOOR `data-eh-door={room}` (the frames' captions find the
 * doors by it, and Try it presses them by it), the stuck band or dock
 * `data-eh-band` with `data-stuck` while stuck, and a dock fixed under the
 * bar `data-eh-dock` too.
 */
export type DoorDraw = {
  c: Case;
  /** The event's name (the band's lead once the cover has gone). */
  name: string;
  screen: ScreenId;
  /** The page's ground: paper, or the room. The cover is the room on both. */
  ground: Ground;
  /** The room standing open over the hub (its door reads pressed), or null. */
  selected: RoomId | null;
  /** A press opens its room over the hub (Try it); absent on a still frame. */
  onOpen?: DoorPress;
  /** How the Seam lives on paper (brand r2's take, a knob). */
  paper: PaperId;
};

/**
 * ONE DOOR OPTION, WHOLE: what it draws on the cover, what it draws between
 * the cover and the album (at rest and stuck), and how the cover meets it.
 *
 * ★ STUCK IS READ OFF `mark` (attach it to ONE element, in either place): a
 * live frame flips `stuck` once that element's top reaches `stickAt` px from
 * the frame's top (the app's bar is 56px tall). A row that sticks under the
 * bar marks its footprint (57: it sticks at 56); doors on the cover mark
 * themselves and dock as they go under the bar. A still frame scrolled into
 * the album is drawn stuck whatever its scroll.
 */
export type DoorOption = {
  /**
   * The cover's foot, under the name and the code. `fact` is the settled
   * strip; a door that stands on the photograph composes itself with it here,
   * one that stands off the cover returns the strip alone.
   */
  CoverFoot: (
    p: DoorDraw & {
      fact: ReactNode;
      mark: RefObject<HTMLDivElement | null>;
    },
  ) => ReactNode;
  /**
   * Between the cover and the album: a sticky row condensing to its band
   * once `stuck`, or for doors on the cover, the dock arriving under the bar
   * (fixed, taking no room in the page). Null where nothing stands there.
   */
  Page: (
    p: DoorDraw & {
      stuck: boolean;
      mark: RefObject<HTMLDivElement | null>;
    },
  ) => ReactNode;
  /**
   * How the cover meets the doors at its foot: `rise` is how far the doors
   * stand up into the photograph (the cover's words clear it), `fade` how far
   * the photograph dissolves into the page under it (0: it ends on its edge).
   */
  seam: Record<ScreenId, { rise: number; fade: number }>;
  /** Where `mark`'s top flips the doors stuck, in px from the frame's top. */
  stickAt: number;
};

/** Whether a CSS transition is still running anywhere in the band (production's `morphing`, `event-cards-row.tsx`). */
function morphing(band: HTMLElement): boolean {
  if (typeof band.getAnimations !== "function") return false;
  return band
    .getAnimations({ subtree: true })
    .some((a) => a.playState === "running" && "transitionProperty" in a);
}

/**
 * ★ A STICKY ROW'S FOOTPRINT HOLDS ITS RESTING HEIGHT, READ ONLY AT REST AND
 * NEVER MID-MORPH (production's `useStuckBand`), so condensing to the band
 * never moves the album: a row that shrank under a live frame's scroll would
 * lift its own footprint off the bar and unstick it, for ever, and a floor
 * read while a row transitions back out of its band would follow it down and
 * let scroll anchoring lift the row into the band again. So a read waits for
 * the band to rest and its transitions to end (`transitionend` bubbles up);
 * the footprint takes it as its `minHeight`.
 */
export function useRestHeight(
  band: RefObject<HTMLElement | null>,
  stuck: boolean,
): number {
  const [rest, setRest] = useState(0);
  useLayoutEffect(() => {
    const el = band.current;
    if (!el || stuck) return;
    const win = el.ownerDocument.defaultView ?? window;
    const hold = () => {
      if (el.hasAttribute("data-stuck") || morphing(el)) return;
      setRest(el.getBoundingClientRect().height);
    };
    hold();
    const ro = new win.ResizeObserver(hold);
    ro.observe(el);
    el.addEventListener("transitionend", hold);
    el.addEventListener("transitioncancel", hold);
    return () => {
      ro.disconnect();
      el.removeEventListener("transitionend", hold);
      el.removeEventListener("transitioncancel", hold);
    };
  }, [band, stuck]);
  return rest;
}

/**
 * THE BAND'S LEAD once the cover has gone: its first photograph and the
 * event's name (production's `data-band-lead`), so the hub still reads as the
 * album's however deep she goes. `onGlass` draws it white for a material on
 * the photograph; a phone keeps the face and drops the name. ★ AN ALBUM WITH
 * NO PHOTOGRAPH YET LEADS WITH ITS NAME ALONE (and a phone with nothing): an
 * empty plate where the face would be reads as a hole.
 */
export function BandLead({
  c,
  name,
  phone,
  onGlass = false,
  className,
}: {
  c: Case;
  name: string;
  phone: boolean;
  onGlass?: boolean;
  className?: string;
}) {
  const face = c.stills[0]?.tile;
  return (
    <span
      data-band-lead=""
      className={cn("flex min-w-0 shrink-0 items-center gap-2.5", className)}
    >
      {face ? (
        // eslint-disable-next-line @next/next/no-img-element -- the cover's first still
        <img
          src={face}
          alt=""
          className={cn(
            "size-9 shrink-0 object-cover",
            onGlass ? "rounded-full" : "rounded-lg",
          )}
        />
      ) : null}
      {phone ? null : (
        <span
          className={cn(
            "max-w-48 truncate font-heading text-card-title",
            onGlass && "text-white",
          )}
        >
          {name}
        </span>
      )}
    </span>
  );
}

/** The band's end: the code as a chip (production's `CodeChip`), always one press away. */
export function CodeEnd({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <CodeChip
      aria-label={`Show the code for ${name}`}
      title="Invite"
      className={className}
    />
  );
}
