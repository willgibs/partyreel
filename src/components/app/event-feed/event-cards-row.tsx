"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { ReelCard, type ReelCardData } from "./reel-card";
import {
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
 * one `data-stuck` on the wrapper, everything else a transition — because a
 * remount would drop the QR pill's `view-transition-name` mid-morph and restart
 * the ticking count. This is why the compact state is styling and not a second
 * component, exactly as the retired pill row learned to do it.
 *
 * ★ THE GRADIENTS ARE CONDITIONAL, which is his `phone=same` note ("with a
 * conditional gradient over either side"): each edge fades only while there is
 * actually something past it, so a row of four that fits at 1440 shows none.
 */
export function EventCardsRow({
  eventId,
  cards,
  reel,
}: {
  eventId: string;
  cards: RoomCard[];
  /** The Highlight reel's card, in its slot in the row. */
  reel: ReelCardData;
}) {
  const { openSheet, headerCodeHidden, openCode, morphNameFor } =
    useEventShare();
  const [stuck, setStuck] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Stuck is "the row has reached the bar", measured against the bar's own
  // height rather than a sentinel above it, so the row condenses at the moment
  // it touches the chrome instead of a scroll-length earlier.
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: "-57px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={stickyRef}
      data-stuck={stuck || undefined}
      // The band bleeds by the wide page's own gutter (12px, then 20px from
      // `sm`: app-shell.tsx), so its stuck backdrop meets both window edges.
      className="sticky top-14 z-30 -mx-3 px-3 py-2 transition-[box-shadow,border-color,background-color] duration-200 data-[stuck]:border-b data-[stuck]:border-border data-[stuck]:bg-background/85 data-[stuck]:backdrop-blur sm:-mx-5 sm:px-5"
    >
      <Scroller>
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
                    step for one; stuck, the card is a compact control and the
                    label is a control label, which is a different ROLE and so
                    is allowed a stock size. Writing both in one className would
                    leave `font-heading` sitting beside `text-xs` on the same
                    element, which is a heading off the ladder whichever branch
                    is live — and type-ladder-policy is right to refuse it. */}
                {stuck ? (
                  <span className="text-xs font-medium">{room.label}</span>
                ) : (
                  <span className="font-heading text-card-title font-medium">
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
              Share
            </button>
          )}
        </div>
      </Scroller>
    </div>
  );
}

/**
 * A sideways scroller whose edge fades appear only when there IS an edge. Both
 * observers are cheap and passive: one scroll listener and one ResizeObserver,
 * writing two data attributes rather than re-rendering on every frame.
 */
function Scroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px of slack: a fractional scrollWidth is normal at fractional zooms and
    // would otherwise leave a permanent right-hand fade on a row that fits.
    el.dataset.overflowLeft = el.scrollLeft > 1 ? "" : undefined;
    el.dataset.overflowRight = el.scrollLeft < max - 1 ? "" : undefined;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  return (
    <div
      ref={ref}
      className={cn(
        "-mx-1 [scrollbar-width:none] overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden",
        // The fades are masks rather than overlaid gradients so they work on
        // any background the row is stuck over, light or dark.
        "[mask-image:none] data-[overflow-left]:[mask-image:linear-gradient(to_right,transparent,black_2rem)]",
        "data-[overflow-right]:[mask-image:linear-gradient(to_left,transparent,black_2rem)]",
        "data-[overflow-left]:data-[overflow-right]:[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]",
      )}
    >
      {children}
    </div>
  );
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
