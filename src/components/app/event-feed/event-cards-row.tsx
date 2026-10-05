"use client";

import "./event-cards-row.css";
import "./event-hub-head-seam.css";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

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

import {
  useHostAlbum,
  useHubCounts,
  type HubAlbum,
} from "@/components/app/event-feed/host-album";

import { useDoorFold } from "./event-cards-row-fold";
import { useHubCoverStills } from "./event-hub-head";
import { ReelCard, useLiveReel, type ReelCardData } from "./reel-card";
import { DoorParts, doorAttrs } from "./room-card-door";
import { reviewCardFace, type RoomFace } from "./room-card";

/** The cards the row draws itself; the Highlight reel draws its own (`reel-card.tsx`). */
type PlainRoomId = Exclude<EventRoomId, "reel">;

/** A plain door's face (`room-card.ts`'s words) and the room it opens. */
export type RoomCard = RoomFace & { id: PlainRoomId };

/**
 * THE CARDS ROW (Will, `event=hub`: "The additional controls (review, reel, guests, etc) feel much more beautiful,
 * actionable, and intuitive to hosts than the album-heavy page"), going sticky as the album scrolls (his `nav` note: "Could
 * pick up sticky-style from the cards below"), and, since event-header r4, CARDS OVER THE SEAM (his pick: "a bit more
 * pronounced than the glass capsule, without shouting like the quiet windows"): the cover's photograph dissolves into the
 * page at its foot and five cards stand across that seam, every one in sight on a phone; stuck, the same five fold into pills
 * under the bar (`event-cards-row-fold.ts`) and unfold the same way back.
 *
 * ★ LINKS IN A GROUP, NEVER TABS. Every room opens OVER the hub (Will, event-header r2 `rooms=over`: "This feels phenomenally
 * more fluid, natural, and intuitive"): Guests, Review and Settings in one panel, See it as a guest in a phone over the dimmed
 * hub, and the Highlight reel opens the view the guests watch (or, before it plays, the guidance that says what is left);
 * none of them switch a panel in place, which is the one thing `role="tablist"` promises. This is a row of doors.
 *
 * ★ EVERY DOOR STAYS AN `<a href="?room=…">` EVEN THOUGH IT OPENS IN PLACE. The URL is real (a reload lands with the room
 * open, server-rendered), so middle-click and "open in new tab" do the honest thing; the click handler only intercepts the
 * ordinary left-click to keep the album behind it. ★ AND A ROOM'S CODE IS ASKED FOR ON INTENT (the pointer coming over the
 * door, a keyboard's focus on it: `room-chunks.ts`), and what it shows as the press begins (Review's queue's links, the Guests
 * room's read), so the panel opens on the room, not on a wait.
 *
 * ★ THE STUCK CONDENSATION MUST NOT REMOUNT THE ROW. The same DOM shrinks, one `data-stuck` on the band (written by the fold,
 * `useDoorFold`) and everything else CSS, because a remount would drop the code chip's `view-transition-name` mid-morph and
 * restart the ticking count. The compact state is styling, never a second component.
 *
 * ★ AND IT CONDENSES INSIDE A FOOTPRINT THAT STAYS THE RESTING ROW'S SIZE (`useStuckBand`, below), so what the row is and
 * where it sits can never feed each other. They did: a jump into the band where the row meets the bar (the viewer's close runs
 * one, `masonry.tsx`'s `returnTo()`) condensed it by 99px at 375, the browser's scroll anchoring pulled the page up by the same
 * 99px to keep the album still, which lifted the row off the bar, which expanded it, which anchoring pushed back: 250 to 151
 * and back for ever, and every jump past the band landing short by what the row lost. Anchoring is right to keep the album
 * still, so it stays on; the row simply stops moving the album.
 *
 * ★ OVER THE SEAM, THE ROW RISES INTO THE COVER by `--hub-rise` (`event-hub-head-seam.css`, the one stylesheet the cover and
 * the row both read, so the cover's foot clears exactly what the row covers): the footprint's own negative margin, which the
 * hub's `space-y-6` (a production utility in a layer, which an unlayered rule outranks) cannot touch. The footprint holds the
 * resting row's height, rise included, so folding never moves the album.
 *
 * ★ EVERY DOOR IS IN SIGHT, AT EVERY WIDTH, SO THE ROW NEVER SCROLLS SIDEWAYS: a hand's grid, a tablet's tiles, a desk's
 * cards, and the pills under the bar sized to fit a 320px phone (`room-card.css`). The sideways scroller and its edge fades
 * that the row's old tiles needed went with it.
 *
 * ★ STUCK, IT CARRIES THE HEAD IT CAME FROM (`event-header` r1, `host=shared`; his note: "Love how they're captured into a
 * sticky menu on scroll for page-wide access"). Once the cover has scrolled away the band leads with the cover's face, its
 * first photograph (and, from a desk's width, the event's name), so the hub still reads as the album's however deep Maya goes,
 * and closes on the code as a chip (`ui/code-chip.tsx`): the code is always one press away, on the white it always stands on.
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
  // ★ THE REVIEW CARD AND THE REEL CARD FOLLOW THE ALBUM (the album-host-wiring lane). The page is never refreshed to show an
  // arrival, so what these two say is read off the page's album store: the held count the host's poll brings (a guest's
  // upload to a moderated event rings no doorbell, so the poll is how it arrives), and the reel's playable count
  // (`useLiveReel`).
  const counts = useHubCounts(useHostAlbum());
  const cards = counts
    ? served.map((c) =>
        c.id === "review"
          ? { ...c, ...reviewCardFace(moderationOn, counts.pending) }
          : c,
      )
    : served;
  const reel = useLiveReel(servedReel);
  const album = useHostAlbum();
  const { openSheet, headerCodeHidden, openCode, morphNameFor } =
    useEventShare();
  const { stuck, instantRef, footRef, bandRef } = useStuckBand();
  useDoorFold(bandRef, stuck, instantRef);
  // The cover's first photograph, live as the cover's own (`event-hub-head.tsx`).
  const coverStills = useHubCoverStills(head?.stills ?? NO_STILLS);
  const face = coverStills[0]?.tile ?? null;

  return (
    // THE FOOTPRINT: what sticks and what the bar is measured against, holding the resting row's height while the band inside
    // it condenses. Its empty lower part lets every press through to the album scrolling under it. It bleeds by the wide
    // page's own gutter (12px, then 20px from `sm`: app-shell.tsx), so its stuck backdrop meets both window edges.
    <div
      ref={footRef}
      data-hub-row=""
      className="hub-seam hub-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
    >
      <div ref={bandRef} className="hub-band pointer-events-auto">
        {/* Stuck, the band's ground fades into the album rather than ending on a line: a layer of its own, so the fold can
            bring it up under the pills. */}
        <span aria-hidden data-fold="veil" className="hub-band-veil" />
        <div role="group" aria-label="This event" className="hub-doors">
          {/* THE HEAD'S FACE, once the head has gone (the head note): the cover's first photograph, and from a desk's width
              the name, the page's own title in the bar it rides. Decorative to a reader of the page (the h1 above already
              named it), so it is words and a picture, never a control. An album with no photograph yet leads with its name
              alone (and a phone with nothing): an empty plate where the face would be reads as a hole. */}
          {stuck && head && (
            <span data-fold="lead" className="hub-lead">
              <span
                data-band-lead=""
                className="flex min-w-0 shrink-0 items-center gap-2.5"
              >
                {face ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a link that expires)
                  <img
                    src={face}
                    alt=""
                    className="size-9 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
                <span className="hub-lead-name max-w-48 truncate font-heading text-card-title">
                  {head.name}
                </span>
              </span>
            </span>
          )}
          {EVENT_ROOMS.map((room) => {
            if (room.id === "reel") {
              return <ReelCard key="reel" eventId={eventId} reel={reel} />;
            }
            const card = cards.find((c) => c.id === room.id);
            if (!card) return null;
            return (
              <Link
                key={card.id}
                {...roomDoor(eventId, card.id, openSheet, album)}
                {...doorAttrs(card.id, card.value)}
                {...trackAttrs("cta_click", {
                  cta: `room-${card.id}`,
                  location: "hub-cards",
                })}
              >
                <DoorParts room={card.id} face={card} />
              </Link>
            );
          })}

          {/* ★ SEE IT AS A GUEST, THE PAYOFF AT THE ROW'S END (the carried call `guest-door`): her album as her guests meet
              it, in a phone over the dimmed hub. A fifth door like the rest; on a phone's grid it takes the third row, the
              width, as the board drew it. */}
          <Link
            {...roomDoor(eventId, AS_GUEST_DOOR.id, openSheet, album)}
            {...doorAttrs(AS_GUEST_DOOR.id, "What they see")}
            {...trackAttrs("cta_click", {
              cta: "room-as-guest",
              location: "hub-cards",
            })}
          >
            <DoorParts
              room={AS_GUEST_DOOR.id}
              face={{ value: "What they see" }}
            />
          </Link>

          {/* SHARE'S PLACE IN THE STICKY ROW (his `nav` note asked for "a creative way to get share in there if it doesn't
              have a card"): the code as a chip, which exists ONLY while the head's code is off screen and the band has
              stuck, so at rest nothing is duplicated and the row is five doors. It carries the morph's name while it is the
              code on screen. */}
          {stuck && headerCodeHidden && (
            <span data-fold="code" className="hub-code">
              <CodeChip
                onClick={openCode}
                aria-label="Show the code for this event"
                title="Invite"
                style={{ viewTransitionName: morphNameFor("pill") }}
                {...trackAttrs("cta_click", {
                  cta: "event-code",
                  location: "hub-cards",
                })}
              />
            </span>
          )}
        </div>
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
 * STUCK, AND THE FOOTPRINT THAT KEEPS IT HONEST. Stuck is "the row has reached the bar", measured against the bar's own
 * height rather than a sentinel above it, so the row condenses at the moment it touches the chrome instead of a
 * scroll-length earlier. What the observer watches is the FOOTPRINT, and the footprint holds the resting band's height as
 * its floor, so condensing changes neither the box the observer reads nor anything laid out below it: no scroll anchoring
 * adjustment, so no way back across the threshold (the loop the row header describes).
 *
 * ★ THE FLOOR IS READ ONLY WHILE THE BAND RESTS AND NOTHING IN IT IS MOVING. Stuck, the resting layout is not on screen to
 * read. Mid-morph it is not either: a hover's own transitions run in the band (a card's lift, its surface), and a floor read
 * while one runs would follow it, so a read waits for the band to rest and its transitions to end (`transitionend` bubbles
 * up from the doors), and a real change of the resting size, a turned phone or a font, lands the moment it settles. (The
 * fold itself is a transform and an opacity: it never changes the band's box.)
 *
 * ★ A FIRST REPORT THAT FINDS THE ROW STUCK IS INSTANT (`instantRef`): a reload restored below the bar, or a deep link to the
 * album, is a page that was never at rest to fold from.
 */
function useStuckBand() {
  const [stuck, setStuck] = useState(false);
  const footRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const instantRef = useRef(false);

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
    let reported = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        const next = entry.intersectionRatio < 1;
        instantRef.current = !reported && next;
        reported = true;
        setStuck(next);
      },
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

  return { stuck, instantRef, footRef, bandRef };
}

/**
 * Whether a CSS transition is still running anywhere in the band (a hover's colour counts too, which only defers a read to
 * its own end). A browser without `getAnimations` reads at once, as the row always did.
 */
function morphing(band: HTMLElement): boolean {
  if (typeof band.getAnimations !== "function") return false;
  return band
    .getAnimations({ subtree: true })
    .some((a) => a.playState === "running" && "transitionProperty" in a);
}
