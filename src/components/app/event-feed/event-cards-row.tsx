"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ListChecks,
  QrCode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useEventShare } from "@/components/app/share/event-share-provider";
import { EVENT_ROOMS, type EventRoomId } from "@/lib/event/sections";
import { trackAttrs } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

import {
  useHostAlbum,
  useHubCounts,
} from "@/components/app/event-feed/host-album";

import { EdgeFadeScroller } from "./edge-fade-scroller";
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
};

/**
 * THE CARDS ROW (Will, `event=hub`: "The additional controls (review, reel,
 * guests, etc) feel much more beautiful, actionable, and intuitive to hosts
 * than the album-heavy page"), going sticky as the album scrolls (his `nav`
 * note: "Could pick up sticky-style from the cards below").
 *
 * ★ LINKS IN A GROUP, NEVER TABS. Two are rooms you GO to, one opens a sheet,
 * and the Highlight reel opens the view the guests watch (or, before it plays,
 * the guidance that says what is left); none of them switch a panel in place,
 * which is the one thing `role="tablist"` promises. This is a row of doors.
 *
 * ★ SETTINGS STAYS AN `<a href="?room=settings">` EVEN THOUGH IT OPENS A SHEET.
 * The URL is real (a reload lands with the sheet open, server-rendered), so
 * middle-click and "open in new tab" do the honest thing; the click handler
 * only intercepts the ordinary left-click to keep the album behind it.
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
 */
export function EventCardsRow({
  eventId,
  cards: served,
  reel: servedReel,
  moderationOn = false,
}: {
  eventId: string;
  cards: RoomCard[];
  /** The Highlight reel's card, in its slot in the row. */
  reel: ReelCardData;
  /** Whether uploads wait in Review: the Review card's words follow the album's live count. */
  moderationOn?: boolean;
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
  const { openSheet, headerCodeHidden, openCode, morphNameFor } =
    useEventShare();
  const { stuck, footRef, bandRef } = useStuckBand();

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
              const href = room.segment
                ? `/dashboard/${eventId}/${room.segment}`
                : `/dashboard/${eventId}?room=settings`;
              return (
                <Link
                  key={card.id}
                  href={href}
                  onClick={
                    room.segment
                      ? undefined
                      : (e) => {
                          // Let a modified click be a real navigation.
                          if (
                            e.metaKey ||
                            e.ctrlKey ||
                            e.shiftKey ||
                            e.button !== 0
                          )
                            return;
                          e.preventDefault();
                          openSheet("settings");
                        }
                  }
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

            {/* SHARE'S PLACE IN THE STICKY ROW (his `nav` note asked for "a
              creative way to get share in there if it doesn't have a card"):
              a QR pill that exists ONLY while the header's code is off screen,
              so at rest nothing is duplicated and the row is four doors. It
              carries the morph's name while it is the code on screen. */}
            {headerCodeHidden && (
              <button
                type="button"
                onClick={openCode}
                aria-label="Show the code for this event"
                style={{ viewTransitionName: morphNameFor("pill") }}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border border-border font-medium transition-all duration-200 ease-emphasis outline-none",
                  "hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:active:scale-100",
                  // A phone's resting grid holds exactly the four doors; the
                  // pill joins the row from `sm`, and on a phone once it is stuck.
                  stuck
                    ? "h-9 px-3 text-xs"
                    : "hidden h-24 w-36 flex-col justify-center p-3 text-sm sm:flex md:w-40",
                )}
                {...trackAttrs("cta_click", {
                  cta: "event-code",
                  location: "hub-cards",
                })}
              >
                <QrCode className="size-4 shrink-0" aria-hidden />
                Invite
              </button>
            )}
          </div>
        </EdgeFadeScroller>
      </div>
    </div>
  );
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
    const io = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: "-57px 0px 0px 0px" },
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
