"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ListChecks,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useEventShare } from "@/components/app/share/event-share-provider";
import { prefetchGuestsRoom } from "@/components/app/share/guests-panel";
import { warmRoom } from "@/components/app/share/room-chunks";
import type { HeadStill } from "@/components/guest/event-experience-head";
import { CodeChip } from "@/components/ui/code-chip";
import { ENTRY_PENDING, entryId } from "@/lib/events/album-wire";
import {
  AS_GUEST_DOOR,
  EVENT_ROOMS,
  roomHref,
  type EventRoomId,
  type EventSheet,
} from "@/lib/event/sections";
import { trackAttrs } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

import {
  useHostAlbum,
  useHubCounts,
  type HubAlbum,
} from "@/components/app/event-feed/host-album";

import { EdgeFadeScroller } from "./edge-fade-scroller";
import { useHubCoverStills } from "./event-hub-head";
import { ReelCard, useLiveReel, type ReelCardData } from "./reel-card";
import {
  reviewCardFace,
  ROOM_CARD_BASE,
  ROOM_CARD_VALUE,
  roomCardSize,
  roomRowLayout,
} from "./room-card";

/** The cards the row draws itself; the Highlight reel draws its own (`reel-card.tsx`). */
type PlainRoomId = Exclude<EventRoomId, "reel">;

const ICONS: Record<PlainRoomId, LucideIcon> = {
  review: ListChecks,
  guests: Users,
  settings: Settings,
};

export type RoomCard = {
  id: PlainRoomId;
  /** The line under the label: "12 waiting", "12 guests", "Public". */
  value: string;
  /** Review only, and only while a queue waits: the needs-action colour. */
  amber?: boolean;
  /** Review only: the live count, so a return from the room ticks it down. */
  count?: number;
  /**
   * Settings only, while a guest still needs something its steps hold ("2 left", event-ready): the line
   * reads in the foreground, a count to act on, never the needs-action amber, since nothing waits on the
   * host right now.
   */
  strong?: boolean;
};

/**
 * THE CARDS ROW (Will, `event=hub`: "The additional controls (review, reel,
 * guests, etc) feel much more beautiful, actionable, and intuitive to hosts
 * than the album-heavy page"), going sticky as the album scrolls (his `nav`
 * note: "Could pick up sticky-style from the cards below").
 *
 * ★ LINKS IN A GROUP, NEVER TABS. Every room opens OVER the hub (Will, event-header r2 `rooms=over`: "This feels
 * phenomenally more fluid, natural, and intuitive"): Guests, Review and Settings in one panel, See it as a guest in a
 * phone over the dimmed hub, and the Highlight reel opens the view the guests watch (or, before it plays, the
 * guidance that says what is left); none of them switch a panel in place, which is the one thing `role="tablist"`
 * promises. This is a row of doors.
 *
 * ★ EVERY DOOR STAYS AN `<a href="?room=…">` EVEN THOUGH IT OPENS IN PLACE. The URL is real (a reload lands with the
 * room open, server-rendered), so middle-click and "open in new tab" do the honest thing; the click handler only
 * intercepts the ordinary left-click to keep the album behind it. ★ AND A ROOM'S CODE IS ASKED FOR ON INTENT (the
 * pointer coming over the door, a keyboard's focus on it: `room-chunks.ts`), and what it shows as the press begins
 * (Review's queue's links, the Guests room's read), so the panel opens on the room, not on a wait.
 *
 * ★ THE STUCK CONDENSATION MUST NOT REMOUNT THE ROW. The same DOM shrinks —
 * one `data-stuck` on the band, everything else a transition — because a
 * remount would drop the QR pill's `view-transition-name` mid-morph and restart
 * the ticking count. This is why the compact state is styling and not a second
 * component, exactly as the retired pill row learned to do it.
 *
 * ★ AND IT CONDENSES INSIDE A FOOTPRINT THAT STAYS THE RESTING ROW'S SIZE
 * (`useStuckBand`, below), so what the row is and where it sits can never feed
 * each other. They did: a jump into the band where the row meets the bar (the
 * viewer's close runs one, `masonry.tsx`'s `returnTo()`) condensed it by 99px at
 * 375, the browser's scroll anchoring pulled the page up by the same 99px to
 * keep the album still, which lifted the row off the bar, which expanded it,
 * which anchoring pushed back: 250 to 151 and back for ever, the fades stale
 * both ways, and every jump past the band landing short by what the row lost.
 * Anchoring is right to keep the album still, so it stays on; the row simply
 * stops moving the album.
 *
 * ★ THE GRADIENTS ARE CONDITIONAL, which is his `phone=same` note ("with a
 * conditional gradient over either side"): each edge fades only while there is
 * actually something past it, so a row of four that fits at 1440 shows none
 * (`edge-fade-scroller.tsx`, where the flags are written and why they once
 * showed at every width).
 *
 * ★ STUCK, IT CARRIES THE HEAD IT CAME FROM (`event-header` r1, `host=shared`; his note: "Love how
 * they're captured into a sticky menu on scroll for page-wide access"). Once the cover has scrolled
 * away the band leads with the cover's face, its first photograph and the event's name, so the hub
 * still reads as the album's however deep Maya goes, and closes on the code as a chip
 * (`ui/code-chip.tsx`): the code is always one press away, on the white it always stands on.
 */
export function EventCardsRow({
  eventId,
  cards: served,
  reel: servedReel,
  moderationOn = false,
  head,
}: {
  eventId: string;
  cards: RoomCard[];
  /** The Highlight reel's card, in its slot in the row. */
  reel: ReelCardData;
  /** Whether uploads wait in Review: the Review card's words follow the album's live count. */
  moderationOn?: boolean;
  /** The head the band came from: its name and its cover's photographs, for the stuck band's lead. */
  head?: { name: string; stills: readonly HeadStill[] };
}) {
  // ★ THE REVIEW CARD AND THE REEL CARD FOLLOW THE ALBUM (the album-host-wiring lane). The page is
  // never refreshed to show an arrival, so what these two say is read off the page's album store:
  // the held count the host's poll brings (a guest's upload to a moderated event rings no doorbell,
  // so the poll is how it arrives), and the reel's playable count (`useLiveReel`).
  const counts = useHubCounts(useHostAlbum());
  const cards = counts
    ? served.map((c) =>
        c.id === "review"
          ? { ...c, ...reviewCardFace(moderationOn, counts.pending) }
          : c,
      )
    : served;
  const reel = useLiveReel(eventId, servedReel);
  const album = useHostAlbum();
  const { openSheet, headerCodeHidden, openCode, morphNameFor } =
    useEventShare();
  const { stuck, footRef, bandRef } = useStuckBand();
  // The cover's first photograph, live as the cover's own (`event-hub-head.tsx`).
  const coverStills = useHubCoverStills(head?.stills ?? NO_STILLS);
  const face = coverStills[0]?.tile ?? null;

  return (
    // THE FOOTPRINT: what sticks and what the bar is measured against, holding
    // the resting row's height while the band inside it condenses. Its empty
    // lower part lets every press through to the album scrolling under it.
    <div
      ref={footRef}
      // The band bleeds by the wide page's own gutter (12px, then 20px from
      // `sm`: app-shell.tsx), so its stuck backdrop meets both window edges.
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
    >
      {/* The hairline is there at rest too, only clear, so taking its colour
          when the band sticks adds no pixel the footprint would have to hold. */}
      <div
        ref={bandRef}
        data-stuck={stuck || undefined}
        className="pointer-events-auto border-b border-transparent px-3 py-2 transition-[box-shadow,border-color,background-color] duration-200 data-[stuck]:border-border data-[stuck]:bg-background/85 data-[stuck]:backdrop-blur sm:px-5"
      >
        <EdgeFadeScroller>
          <div
            role="group"
            aria-label="This event"
            className={roomRowLayout(stuck)}
          >
            {/* THE HEAD'S FACE, once the head has gone (the head note): the cover's first photograph
                and the name, the page's own title in the bar it rides. Decorative to a reader of the
                page (the h1 above already named it), so it is words, never a control. */}
            {stuck && head && (
              <span
                data-band-lead=""
                className="flex min-w-0 shrink-0 items-center gap-2.5 pr-1"
              >
                {face ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a link that expires)
                  <img
                    src={face}
                    alt=""
                    className="size-9 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
                <span className="max-w-48 truncate font-heading text-card-title">
                  {head.name}
                </span>
              </span>
            )}
            {EVENT_ROOMS.map((room) => {
              if (room.id === "reel") {
                return (
                  <ReelCard
                    key="reel"
                    eventId={eventId}
                    reel={reel}
                    stuck={stuck}
                  />
                );
              }
              const card = cards.find((c) => c.id === room.id);
              if (!card) return null;
              const Icon = ICONS[card.id];
              return (
                <Link
                  key={card.id}
                  {...roomDoor(eventId, card.id, openSheet, album)}
                  className={cn(
                    ROOM_CARD_BASE,
                    roomCardSize(stuck),
                    card.amber
                      ? "border-warning/40 bg-warning/5 hover:border-warning/60"
                      : "border-border hover:border-foreground/25",
                  )}
                  {...trackAttrs("cta_click", {
                    cta: `room-${card.id}`,
                    location: "hub-cards",
                  })}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      card.amber ? "text-warning" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  {/* ★ TWO ELEMENTS, NOT ONE WITH A TERNARY, AND THE REASON IS
                    THE LADDER. At rest the label is a CARD TITLE and wears the
                    step for one, at the heading face's own weight; stuck, the
                    card is a compact control and the label is a control label
                    (Inter 500 at a stock size), which is a different ROLE.
                    Writing both in one className would leave `font-heading`
                    beside `text-xs` and `font-medium`, a heading off the ladder
                    at a lighter weight whichever branch is live, and
                    type-ladder-policy refuses a weight beside the face. */}
                  {stuck ? (
                    <span className="text-xs font-medium">{room.label}</span>
                  ) : (
                    <span className="font-heading text-card-title">
                      {room.label}
                    </span>
                  )}
                  <span
                    className={cn(
                      "truncate text-xs tabular-nums",
                      ROOM_CARD_VALUE,
                      stuck && "hidden",
                      card.amber
                        ? "font-medium text-warning"
                        : card.strong
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {card.count != null ? (
                      <TickingCount value={card.count} suffix=" waiting" />
                    ) : (
                      card.value
                    )}
                  </span>
                  {/* Stuck, the amber count is the only thing worth keeping: it
                    is the reason to look at the row at all. */}
                  {stuck && card.amber && card.count ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
                      {card.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* ★ SEE IT AS A GUEST, THE PAYOFF AT THE ROW'S END (the carried call `guest-door`): her album as her
                guests meet it, in a phone over the dimmed hub. A fifth door in today's card, stuck a pill like the
                rest; on a phone's 2x2 grid it takes the third row's first place, as the board drew it. */}
            <Link
              {...roomDoor(eventId, AS_GUEST_DOOR.id, openSheet, album)}
              className={cn(
                ROOM_CARD_BASE,
                roomCardSize(stuck),
                "border-border hover:border-foreground/25",
              )}
              {...trackAttrs("cta_click", {
                cta: "room-as-guest",
                location: "hub-cards",
              })}
            >
              <Smartphone
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {stuck ? (
                <span className="text-xs font-medium">
                  {AS_GUEST_DOOR.label}
                </span>
              ) : (
                <span className="font-heading text-card-title">
                  {AS_GUEST_DOOR.label}
                </span>
              )}
              <span
                className={cn(
                  "truncate text-xs text-muted-foreground",
                  ROOM_CARD_VALUE,
                  stuck && "hidden",
                )}
              >
                What they see
              </span>
            </Link>

            {/* SHARE'S PLACE IN THE STICKY ROW (his `nav` note asked for "a creative way to get share
              in there if it doesn't have a card"): the code as a chip, which exists ONLY while the
              head's code is off screen and the band has stuck, so at rest nothing is duplicated and the
              row is four doors. It carries the morph's name while it is the code on screen. */}
            {stuck && headerCodeHidden && (
              <CodeChip
                onClick={openCode}
                aria-label="Show the code for this event"
                title="Invite"
                style={{ viewTransitionName: morphNameFor("pill") }}
                className="ml-0.5"
                {...trackAttrs("cta_click", {
                  cta: "event-code",
                  location: "hub-cards",
                })}
              />
            )}
          </div>
        </EdgeFadeScroller>
      </div>
    </div>
  );
}

const NO_STILLS: readonly HeadStill[] = [];

/**
 * A DOOR INTO A ROOM OVER THE HUB: its real address (`roomHref`, so a modified click opens the hub with the room in a
 * tab of its own), the ordinary press opening the room in place, and the room's intent: its chunk as a pointer comes
 * over the door or a keyboard lands on it, and what it will show as the press begins.
 */
function roomDoor(
  eventId: string,
  room: EventSheet,
  openSheet: (room: EventSheet) => void,
  album: HubAlbum | null,
): {
  href: string;
  onClick: (e: ReactMouseEvent) => void;
  onPointerEnter: () => void;
  onFocus: () => void;
  onPointerDown: (e: ReactPointerEvent) => void;
} {
  return {
    href: roomHref(eventId, room),
    onClick: (e) => {
      // Let a modified click be a real navigation.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      openSheet(room);
    },
    onPointerEnter: () => warmRoom(room),
    onFocus: () => warmRoom(room),
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      if (room === "guests") prefetchGuestsRoom(eventId);
      if (room === "review") warmReviewQueue(album);
    },
  };
}

/**
 * REVIEW'S QUEUE, ASKED FOR AS THE PRESS BEGINS: the links of every upload waiting, from the hub's own album (the
 * room seeds its queue from them), so the room opens on its tiles rather than on their shimmer.
 */
function warmReviewQueue(album: HubAlbum | null) {
  if (!album) return;
  const snap = album.store.getSnapshot();
  const entries =
    snap.status === "ready" ? snap.entries : album.seedSnapshot.entries;
  const waiting = entries.filter((e) => e[3] & ENTRY_PENDING).map(entryId);
  if (waiting.length > 0) void album.store.links.ensure(waiting);
}

/**
 * STUCK, AND THE FOOTPRINT THAT KEEPS IT HONEST. Stuck is "the row has reached
 * the bar", measured against the bar's own height rather than a sentinel above
 * it, so the row condenses at the moment it touches the chrome instead of a
 * scroll-length earlier. What the observer watches is the FOOTPRINT, and the
 * footprint holds the resting band's height as its floor, so condensing
 * changes neither the box the observer reads nor anything laid out below it:
 * no scroll anchoring adjustment, so no way back across the threshold (the
 * loop the row header describes).
 *
 * ★ THE FLOOR IS READ ONLY WHILE THE BAND RESTS AND NOTHING IN IT IS MOVING.
 * Stuck, the resting layout is not on screen to read. Mid-morph it is not
 * either: from `sm` the cards' own `transition-all` carries their height
 * between the tile and the pill over 200ms, and a floor read on the way back
 * up would follow that animation down and let the album move after all. So a
 * read waits for the band to rest and its transitions to end (`transitionend`
 * bubbles up from the cards), and a real change of the resting size, a turned
 * phone or a font, lands the moment it settles.
 */
function useStuckBand() {
  const [stuck, setStuck] = useState(false);
  const footRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foot = footRef.current;
    const band = bandRef.current;
    if (!foot || !band) return;
    const holdRestingHeight = () => {
      if (band.hasAttribute("data-stuck") || morphing(band)) return;
      foot.style.minHeight = `${band.getBoundingClientRect().height}px`;
    };
    // Before the observer can report anything, so the first condense already
    // has its floor (a reload restored past the bar condenses on arrival).
    holdRestingHeight();
    const ro = new ResizeObserver(holdRestingHeight);
    ro.observe(band);
    band.addEventListener("transitionend", holdRestingHeight);
    band.addEventListener("transitioncancel", holdRestingHeight);
    // ★ STUCK IS THE FOOTPRINT'S TOP AT THE BAR, never how much of it shows.
    // The root is the window under the bar (the margin cuts the bar's 57px off
    // its top) grown by a screen below the fold, so the only part of the
    // footprint it can miss is what has passed above the bar. Cut at the fold,
    // a phone on its side read the resting row as stuck at the top of the page
    // (its foot below the fold), and stuck and resting never crossed a
    // threshold between them.
    const io = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: "-57px 0px 100% 0px" },
    );
    io.observe(foot);
    return () => {
      io.disconnect();
      ro.disconnect();
      band.removeEventListener("transitionend", holdRestingHeight);
      band.removeEventListener("transitioncancel", holdRestingHeight);
    };
  }, []);

  return { stuck, footRef, bandRef };
}

/**
 * Whether a CSS transition is still running anywhere in the band (a hover's
 * colour counts too, which only defers a read to its own end). A browser
 * without `getAnimations` reads at once, as the row always did.
 */
function morphing(band: HTMLElement): boolean {
  if (typeof band.getAnimations !== "function") return false;
  return band
    .getAnimations({ subtree: true })
    .some((a) => a.playState === "running" && "transitionProperty" in a);
}

/**
 * THE REVIEW COUNT TICKS DOWN ON RETURN. A host clears nine photographs in the
 * Review room and comes back; the card sliding 12 → 3 over 200ms says what they
 * just did, where a number that is simply different says nothing at all.
 *
 * First paint never animates (there is no previous value to travel from), and
 * reduced motion snaps — the number is the content, the travel is the garnish.
 */
function TickingCount({ value, suffix }: { value: number; suffix: string }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    // ★ REDUCED MOTION SHORTENS THE TRAVEL, IT DOES NOT SKIP THE FRAME. Setting
    // the value straight from the effect body would be a synchronous setState
    // in an effect (the cascading-render lint, and it is right): a zero-length
    // run through the same rAF lands on the same number one frame later, from
    // a callback, which is where a setState belongs.
    const ms =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 200;
    const startedAt = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - startedAt) / ms);
      setShown(Math.round(from + (value - from) * t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      {shown}
      {suffix}
    </>
  );
}
