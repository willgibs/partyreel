"use client";

import "./windows.css";

import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Check, Pause, Play, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  BandLead,
  CodeEnd,
  type DoorDraw,
  type DoorFace,
  type DoorOption,
  type DoorPress,
  doorName,
  facesOf,
  ROOM_LABEL,
  ROOM_ORDER,
  ROOM_SHORT,
  type RoomId,
} from "./door-kit";
import { AT_THE_DOOR, type Case, GUESTS, REVIEW } from "./fixtures";

/**
 * QUIET WINDOWS, ROUND FOUR: each door is a small window onto its room, the
 * room itself in miniature (the reel's still under its bar, the faces at the
 * door, the photographs waiting, Settings' rail of steps, her album in a
 * guest's phone), standing on the page with no card around it, so the cover
 * and the album stay the page's pictures and the windows its calm middle.
 *
 * ★ A WINDOW IS LIT ONLY WHERE SOMETHING WAITS ON HER: its photographs and
 * faces take their own colour and its count wears the waiting light; every
 * other window keeps its picture in the page's greys. A pointer or a keyboard
 * looking in lights one too, and the room standing open stays lit, so a phone
 * (no hover) still shows colour exactly where she is needed, and none at all
 * when nothing is. Settings never lights (the call G4: nothing waits on her).
 *
 * ★ ONE ROW, TWO SIZES, NEVER A SWAP: stuck, the same windows shrink where
 * they stand into the band (production's rule: the row never remounts), the
 * cover's face growing in at its left and the code at its right, so every
 * door stays within a few steps of the column her hand already knows
 * (`windows.css`).
 *
 * ★ LIT IS `data-eh-lit`, NEVER `data-lit`: that one is production's bright
 * edge (`globals.css`), and on a door it draws a hairline round the cell.
 */

/** The size every picture is drawn at; the window scales it to its own (52px at rest, smaller stuck). */
const ART = 52;

/* ── the pictures ─────────────────────────────────────────────────────────── */

/** A photograph inside a window: the page's greys until the window is lit (`windows.css`). */
function Photo({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a still the hub already draws, drawn small (no new request)
    <img
      src={src}
      alt=""
      draggable={false}
      className={cn("eh-windows-photo block size-full object-cover", className)}
    />
  );
}

/**
 * THE REEL'S WINDOW IS ITS ROOM, SMALL (his note, twice: the reel in line
 * with the rest, its own design within it): a still of the reel under its
 * view's slim bar, a play mark and a line two fifths in, and nothing moving;
 * before it can play, the room's own two pips. ★ ITS SECOND STILL, NEVER ITS
 * FIRST: the first is the cover's face, which leads the band stuck, and two
 * of one photograph side by side read as one thing twice.
 */
function ReelArt({ c }: { c: Case }) {
  const still = (c.stills[1] ?? c.stills[0])?.tile;
  if (c.reel === "live" && still)
    return (
      <>
        <Photo src={still} />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/65 to-transparent"
        />
        <span className="absolute inset-0 flex items-center justify-center pb-1">
          <Play className="size-[15px] fill-white text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]" />
        </span>
        <span className="absolute inset-x-[7px] bottom-[7px] h-[2px] overflow-hidden rounded-full bg-white/35">
          <span className="eh-windows-play block h-full rounded-full bg-white" />
        </span>
      </>
    );
  return (
    <span className="eh-windows-ink flex size-full flex-col items-center justify-center gap-[7px]">
      <Play className="size-3.5 fill-current" />
      <span className="flex gap-[3px]">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] w-3.5 rounded-full",
              i < c.reelHave ? "bg-current" : "bg-current/30",
            )}
          />
        ))}
      </span>
    </span>
  );
}

/**
 * Guests: the two faces at the door while they wait, the first two guests in
 * once they are in, an empty door before. Always two, at one size: a third
 * face at a window this small cuts every initial in half.
 */
function GuestsArt({ c }: { c: Case }) {
  const faces = (
    c.waiting > 0 ? AT_THE_DOOR : c.guests > 0 ? GUESTS : []
  ).slice(0, 2);
  if (faces.length === 0)
    return (
      <span className="eh-windows-ink flex size-full items-center justify-center">
        <Users className="size-5" />
      </span>
    );
  return (
    <span className="flex size-full items-center justify-center">
      {faces.map((p, i) => (
        <Avatar
          key={p.seed}
          seed={p.seed}
          className={cn(
            "eh-windows-photo size-[25px] ring-2 ring-card",
            i > 0 && "-ms-[7px]",
          )}
        >
          <AvatarFallback className="text-[11px]">
            {p.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ))}
    </span>
  );
}

/** Review: the photographs waiting, edge to edge (the window is the queue), or a tick once it is clear. */
function ReviewArt({ c }: { c: Case }) {
  if (c.review === 0)
    return (
      <span className="eh-windows-ink flex size-full items-center justify-center">
        <Check className="size-5" strokeWidth={2.25} />
      </span>
    );
  return (
    <span className="grid size-full grid-cols-2 grid-rows-2 gap-[2px]">
      {REVIEW.slice(0, 4).map((r) => (
        <Photo
          key={r.id}
          src={r.src}
          className="min-h-0 rounded-[var(--radius-tile)]"
        />
      ))}
    </span>
  );
}

/**
 * SETTINGS: ITS RAIL OF STEPS, SMALL (the room opens on it): a point a step
 * on one line, ticked in ink, a ring for each still left, so "2 left" shows
 * as two open rings. Never a ring of segments: a ring short of whole reads as
 * a spinner, and nothing on the hub may look like it loads.
 */
function SettingsArt({ face }: { face: DoorFace }) {
  const open = Math.min(face.left ?? 0, 4);
  const bars = [20, 14, 17, 11];
  return (
    <span className="eh-windows-ink flex size-full items-center justify-center">
      <span className="relative flex w-[31px] flex-col gap-[6px]">
        <span
          aria-hidden
          className="absolute top-[3px] bottom-[3px] left-[2.25px] w-[1.5px] bg-current opacity-35"
        />
        {bars.map((w, i) => (
          <span
            key={i}
            className="relative flex h-[6px] items-center gap-[5px]"
          >
            <span
              className={cn(
                "size-[6px] shrink-0 rounded-full",
                i < bars.length - open
                  ? "bg-current"
                  : "bg-card ring-[1.5px] ring-current ring-inset",
              )}
            />
            <span
              className="h-[2px] rounded-full bg-current opacity-45"
              style={{ width: w }}
            />
          </span>
        ))}
      </span>
    </span>
  );
}

/** See it as a guest: her album standing in a guest's phone, the cover with its white Add, the rows under it. */
function GuestArt({ c }: { c: Case }) {
  const still = c.photos > 0 ? c.stills[0]?.tile : undefined;
  return (
    <span className="flex size-full items-center justify-center">
      <span className="eh-windows-ink relative h-[40px] w-[24px] overflow-hidden rounded-[6px] border-[1.5px] border-current">
        <span className="absolute inset-x-0 top-0 h-[56%] overflow-hidden">
          {still ? (
            <Photo src={still} />
          ) : (
            <span className="block size-full bg-current opacity-15" />
          )}
        </span>
        <span className="absolute top-[38%] left-1/2 h-[3px] w-[11px] -translate-x-1/2 rounded-full bg-white" />
        <span className="absolute inset-x-[3px] bottom-[4px] grid grid-cols-2 gap-[1.5px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-[4px] bg-current opacity-35" />
          ))}
        </span>
      </span>
    </span>
  );
}

function Art({ room, c, face }: { room: RoomId; c: Case; face: DoorFace }) {
  if (room === "reel") return <ReelArt c={c} />;
  if (room === "guests") return <GuestsArt c={c} />;
  if (room === "review") return <ReviewArt c={c} />;
  if (room === "settings") return <SettingsArt face={face} />;
  return <GuestArt c={c} />;
}

/* ── the window and its count ─────────────────────────────────────────────── */

/**
 * A COUNT AS A LIGHT, NEVER A FILL: the waiting light's point beside the
 * number where something waits on her; an unlit ring for Settings' steps
 * left (plain ink, the call G4); the pause mark while uploads are paused.
 */
function Count({ face, className }: { face: DoorFace; className?: string }) {
  if (face.paused)
    return (
      <Pause
        className={cn("size-3 fill-current text-muted-foreground", className)}
        aria-hidden
      />
    );
  const n = face.count ?? face.left;
  if (!n) return null;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 font-semibold tabular-nums",
        className,
      )}
    >
      <span className={face.count ? "eh-amber" : "eh-unlit"} aria-hidden />
      {formatCount(n)}
    </span>
  );
}

/**
 * THE WINDOW: a tile a step off the page holding its room, the picture drawn
 * once at `ART` and scaled to the window (so it shrinks with it into the
 * band), and in a hand its count on the corner, a small plate over the
 * window's edge (the lift: one object overlapping another).
 */
function Window({
  room,
  c,
  face,
  hand,
}: {
  room: RoomId;
  c: Case;
  face: DoorFace;
  hand: boolean;
}) {
  return (
    <span className="eh-windows-frame" aria-hidden>
      <span className="eh-windows-pane bg-card">
        <span className="eh-windows-art" style={{ width: ART, height: ART }}>
          <span className="eh-windows-lean">
            <Art room={room} c={c} face={face} />
          </span>
        </span>
      </span>
      {hand && (face.count || face.left || face.paused) ? (
        <span className="eh-windows-badge absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-popover px-[5px] text-[10px] text-foreground shadow-lift">
          <Count face={face} />
        </span>
      ) : null}
    </span>
  );
}

/** The value line under a desk's title: the light leads a waiting room's words; a count hers to act on is the foreground; the rest quiet. */
function Value({ face }: { face: DoorFace }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-xs tabular-nums",
        face.amber || face.strong
          ? "font-medium text-foreground"
          : "text-muted-foreground",
      )}
    >
      {face.amber ? <span className="eh-amber" aria-hidden /> : null}
      <span className="truncate">{face.value}</span>
    </span>
  );
}

/**
 * A DESK'S WORDS, BOTH SIZES AT ONCE: the title and its line at rest, the
 * short word and the count stuck. ★ TWO ELEMENTS, NEVER ONE RESTYLED: a card
 * title and a control label are two roles on the ladder (production's rule,
 * `event-cards-row.tsx`), so the fold crossfades them in place.
 */
function Words({ room, face }: { room: RoomId; face: DoorFace }) {
  return (
    <span className="eh-windows-words" aria-hidden>
      <span className="eh-windows-said">
        <span className="truncate font-heading text-card-title">
          {ROOM_LABEL[room]}
        </span>
        <Value face={face} />
      </span>
      <span className="eh-windows-short">
        <span className="text-xs font-medium">{ROOM_SHORT[room]}</span>
        <Count face={face} className="text-label" />
      </span>
    </span>
  );
}

function Door({
  room,
  face,
  c,
  hand,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  c: Case;
  hand: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  return (
    <span className="eh-windows-cell">
      <button
        type="button"
        data-eh-door={room}
        data-eh-lit={face.amber || undefined}
        aria-pressed={selected || undefined}
        aria-label={doorName(room, face)}
        onClick={() => onOpen?.(room)}
        // No card at rest: the plate is the pointer's and the open room's. In the room it takes the
        // secondary step, since the muted one sits too close to the near-black page to be seen.
        className="eh-windows-door text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] aria-pressed:bg-secondary motion-reduce:active:scale-100 dark:hover:bg-secondary/70 dark:focus-visible:bg-secondary/70"
      >
        <Window room={room} c={c} face={face} hand={hand} />
        {hand ? (
          <span
            aria-hidden
            className={cn(
              "eh-windows-label text-xs font-medium",
              face.amber || selected
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {ROOM_SHORT[room]}
          </span>
        ) : (
          <Words room={room} face={face} />
        )}
      </button>
    </span>
  );
}

/* ── the row and its band ─────────────────────────────────────────────────── */

/** Whether a transition is still running anywhere in the band (production's `morphing`, `event-cards-row.tsx`). */
function folding(band: HTMLElement): boolean {
  if (typeof band.getAnimations !== "function") return false;
  return band
    .getAnimations({ subtree: true })
    .some((a) => a.playState === "running" && "transitionProperty" in a);
}

/**
 * ★ THE FOOTPRINT HOLDS THE RESTING ROW'S HEIGHT, READ ONLY AT REST AND
 * NEVER MID-FOLD (production's `useStuckBand`). This row folds by
 * transitions, so as it opens back out of the band its height passes through
 * every size between: a floor read on the way would follow the fold, move the
 * album, and let scroll anchoring lift the row back into the band, the loop
 * production's row header describes. So a read waits for the band to rest
 * and its transitions to end (`transitionend` bubbles up from the windows).
 */
function useHeldRest(
  band: RefObject<HTMLElement | null>,
  stuck: boolean,
): number {
  const [rest, setRest] = useState(0);
  useLayoutEffect(() => {
    const el = band.current;
    if (!el || stuck) return;
    const win = el.ownerDocument.defaultView ?? window;
    const hold = () => {
      if (el.hasAttribute("data-stuck") || folding(el)) return;
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
 * THE ROW UNDER THE COVER, sticky, folding into its band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`). Every piece
 * of both states is mounted in both (the cover's face, the windows, their
 * words, the code), and `data-stuck` on the band moves each between its two
 * sizes (`windows.css`), so the fold is one continuous slide.
 */
function Row({
  c,
  name,
  screen,
  selected,
  onOpen,
  stuck,
  mark,
}: DoorDraw & {
  stuck: boolean;
  mark: RefObject<HTMLDivElement | null>;
}) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const rest = useHeldRest(bandRef, stuck);
  const hand = screen === "375";
  const faces = facesOf(c);
  return (
    <div
      ref={mark}
      data-eh-row="windows"
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      // The row is the cover's own doors, so it stands 12px under the cover, nearer it than the
      // album below. ★ A NEGATIVE MARGIN, INLINE: `space-y-6` hangs 24px off the cover's foot and
      // the two margins collapse, so only -12 takes 12 off it (a lab utility never outranks it).
      style={{ minHeight: rest || undefined, marginTop: -12 }}
    >
      <div
        ref={bandRef}
        data-eh-band=""
        data-stuck={stuck || undefined}
        data-hand={hand || undefined}
        className={cn(
          "eh-windows-band pointer-events-auto border-b py-2",
          hand ? "px-3" : "px-5",
          stuck
            ? "border-border bg-background/85 backdrop-blur"
            : "border-transparent",
        )}
      >
        <div
          data-eh-doors="windows"
          role="group"
          aria-label="This event"
          className="eh-windows-row"
        >
          {/* The cover's face once the cover has gone, decorative (the h1 named it). Its face alone at
              a desk too: the bar's crumbs name the event just above it, so the name said twice, and it
              would push every door a name's width from the column it rests in. An album with no
              photograph yet has no face to lead with, and an empty plate there reads as a hole. */}
          {c.stills.length > 0 ? (
            <span className="eh-windows-lead" aria-hidden>
              <BandLead c={c} name={name} phone />
            </span>
          ) : null}
          {ROOM_ORDER.map((room) => (
            <Door
              key={room}
              room={room}
              face={faces[room]}
              c={c}
              hand={hand}
              selected={selected === room}
              onOpen={onOpen}
            />
          ))}
          {/* The code at the band's right end, under where the cover's code stood; nothing to reach at rest. */}
          <span className="eh-windows-code" inert={!stuck}>
            <CodeEnd name={name} />
          </span>
        </div>
      </div>
    </div>
  );
}

export const WINDOWS: DoorOption = {
  // The cover's foot is the strip alone: the windows stand under the cover.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => <Row {...p} />,
  seam: { "375": { rise: 0, fade: 0 }, "1440": { rise: 0, fade: 0 } },
  stickAt: 57,
};
