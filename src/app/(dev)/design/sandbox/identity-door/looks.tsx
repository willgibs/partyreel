"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
} from "react";
import { Check, ImagePlus, Images, Lock, LockOpen } from "lucide-react";

import { GLASS_MARK } from "@/lib/glass";
import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn } from "@/lib/utils";

import type { ScrimSpec } from "./door";
import { DESCRIPTION, EVENT, HOST, NEWEST, PRIYA } from "./fixtures";
import { HostAvatar } from "./ground";
import { type DoorStep, InBeat, type Slots } from "./steps";

/**
 * THE FOUR DIRECTIONS, each graded against something he already picked.
 *
 * `look` asks one thing: which of these makes the door feel alive enough that
 * Priya wants to keep going, from the welcome to her menu. Each borrows an
 * approved pattern, named in its option, so "alive" is judged against a thing
 * he already likes rather than argued:
 *
 *   lit     the screen lamp: the album's own sampled colour thrown onto the
 *           sheet's free edge (the film strip's underlight, bible 6's "colour
 *           comes from the photographs and from light"), the event's name large
 *           with the host's face, and the album's count ticking as photos land.
 *   peek    the trips page's sleeve (`hero-theme=object`, "one bespoke object,
 *           lit"): three of the album's newest stills stand in the sheet's top
 *           edge, feet tucked in, and answer each step.
 *   ticket  the Highlight reel's own card (`reel-front.tile=crossfade`, and his
 *           `hub=labelled` note: "a calm living thumbnail behind this card as a
 *           full background with overlay to make the Reel card feel more
 *           alive"): the welcome is that card, and Continue tears it to a stub
 *           that rides every later step and heads her menu card.
 *   host    the profile page's identity line (`identity=line`, the face aligned
 *           to its name group): the host's face leads, and her own description,
 *           when she wrote one, is the greeting. The door never writes words
 *           for a host; with none, the welcome's own rows stand alone.
 *
 * ★ EVERY DIRECTION KEEPS THE SAME RULES: the panel opaque (the blur is the
 * scrim's), motion only in the sheet (the reel tile behind stays still), and
 * reduced motion showing the still frame each animation settles on
 * (`identity-door.css` holds every keyframe behind `no-preference`).
 */

export type Look = "lit" | "peek" | "ticket" | "host";
export const LOOK_IDS: readonly Look[] = ["lit", "peek", "ticket", "host"];

/** Where a direction is being drawn: which step, which screen, keyboard up. */
export type Where = {
  step: DoorStep | "menu" | "menu-email";
  size: "phone" | "desk";
  keyboard: boolean;
  greeting: boolean;
};

export type LookDef = {
  scrim: ScrimSpec;
  slots: (w: Where) => Slots;
  behind?: (w: Where) => ReactNode;
  glow?: (w: Where) => ReactNode;
  head?: (w: Where) => ReactNode;
};

/* ── the album's still, in the tile's own material ─────────────────────── */

function Still({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      data-lit=""
      className={cn(
        "block overflow-hidden rounded-[var(--radius-tile)] bg-black/10 shadow-lift",
        className,
      )}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}

/* ── the reading pane a name is written on (stack-tile's measured tint) ── */

const READING_PANE = { "--glass-tint": "0.34" } as CSSProperties;

/* ══ PEEK: the sleeve ═══════════════════════════════════════════════════ */

type FanMode = "open" | "hers" | "held" | "bright" | "landed";

function fanMode(step: Where["step"]): FanMode {
  switch (step) {
    case "name":
    case "name-email":
    case "create":
    case "change":
      return "hers";
    case "gate":
      return "held";
    case "code":
      return "bright";
    case "in":
      return "landed";
    default:
      return "open";
  }
}

/**
 * HER PLACE IN THE ALBUM: the tile her first photograph will be, credited to
 * the name she is typing. Never her name on somebody else's photograph (that
 * would claim a picture she did not take): an empty frame in the tile's own
 * material, her credit on it, which is what "your name goes on the photos you
 * add" looks like.
 */
function HerSlot({ small, typing }: { small?: boolean; typing?: boolean }) {
  return (
    <span
      data-door-her-slot
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[var(--radius-tile)] bg-muted shadow-lift ring-1 ring-foreground/10 ring-inset"
    >
      <ImagePlus
        aria-hidden
        className={cn(
          "text-muted-foreground/60",
          small ? "size-4 -translate-y-1.5" : "size-7 -translate-y-2",
        )}
      />
      <span
        data-door-credit
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute flex items-center rounded-full font-medium text-white",
          small
            ? "bottom-1 left-1 gap-0.5 py-px pr-1 pl-px text-[8px]"
            : "bottom-1.5 left-1.5 gap-1 py-0.5 pr-2 pl-0.5 text-[11px]",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-white/25",
            small ? "size-2.5 text-[6px]" : "size-4 text-[8px]",
          )}
        >
          {PRIYA.name.slice(0, 1)}
        </span>
        <span data-door-credit-name>{PRIYA.name}</span>
        {typing && <span aria-hidden className="door-caret door-caret-light" />}
      </span>
    </span>
  );
}

type Pose = { x: number; y: number; r: number };

const POSES: Record<"rest" | "landed", readonly [Pose, Pose, Pose]> = {
  // Whole tile widths apart, never a nudge (the sleeve's own finding: a fan
  // that moves by eight percent of a print is three prints on top of each other).
  rest: [
    { x: -90, y: 12, r: -10 },
    { x: 88, y: 16, r: 9 },
    { x: 0, y: 0, r: -1.5 },
  ],
  landed: [
    { x: -114, y: 4, r: -15 },
    { x: 112, y: 8, r: 14 },
    { x: 0, y: -12, r: 0 },
  ],
};

function poseStyle(p: Pose, i: number): CSSProperties {
  return {
    "--fx": `${p.x}px`,
    "--fy": `${p.y}px`,
    "--fr": `${p.r}deg`,
    "--fi": i,
  } as CSSProperties;
}

/** The three tiles, back left, back right, front; the front is hers once she types. */
function FanTiles({
  mode,
  small = false,
  typing = false,
  scale = 1,
}: {
  mode: FanMode;
  small?: boolean;
  typing?: boolean;
  scale?: number;
}) {
  const poses = mode === "landed" ? POSES.landed : POSES.rest;
  const hers = mode !== "open";
  const w = small ? 44 : 104;
  const tiles = [
    <Still key="a" src={NEWEST[1]} className="size-full" />,
    <Still key="b" src={NEWEST[2]} className="size-full" />,
    hers ? (
      <HerSlot key="c" small={small} typing={typing} />
    ) : (
      <Still key="c" src={NEWEST[0]} className="size-full" />
    ),
  ];
  return (
    <>
      {tiles.map((tile, i) => (
        <span
          key={i}
          data-door-fan-tile={i === 2 ? "front" : "back"}
          className={cn(
            "door-fan-tile absolute bottom-0 aspect-[4/5]",
            mode === "held" && i < 2 && "door-fan-held",
          )}
          style={{
            ...poseStyle(
              {
                x: poses[i].x * (small ? 0.36 : 1) * scale,
                y: poses[i].y * (small ? 0.36 : 1) * scale,
                r: poses[i].r,
              },
              i,
            ),
            width: w * scale,
            left: (-w * scale) / 2,
            zIndex: i === 2 ? 3 : i + 1,
          }}
        >
          {tile}
          {/* The album's own arrival light, now and then, on the front still
              (a sibling layer, never the tile's ::after, which is its bright
              edge). */}
          {mode === "open" && i === 2 && (
            <span aria-hidden className="door-arrive-glow" />
          )}
        </span>
      ))}
    </>
  );
}

/** Out of the phone sheet's top edge, feet tucked 26 px under the paper. */
function PeekFanEdge({ w }: { w: Where }) {
  const mode = fanMode(w.step);
  return (
    <div
      data-door-fan="edge"
      data-door-fan-mode={mode}
      aria-hidden
      className="pointer-events-none absolute bottom-[calc(100%-26px)] left-1/2 z-0 h-[150px] w-0"
    >
      {(mode === "bright" || mode === "landed") && (
        <span className="door-fan-glow absolute -bottom-6 left-1/2 h-40 w-80 -translate-x-1/2" />
      )}
      <FanTiles mode={mode} typing={w.step === "name"} />
    </div>
  );
}

/**
 * At a desk the panel's free edge is its left one (its top is the window's),
 * so the stills come out of that edge instead, over the blurred album they
 * came from: landscape, upright, fanned from a pivot under the paper the way a
 * hand of prints comes out of a pocket on its side, feet tucked 30 px under.
 */
const DESK_POSES: readonly Pose[] = [
  { x: 0, y: -118, r: 7 },
  { x: 0, y: 116, r: -6 },
  { x: -14, y: 0, r: -1 },
];

function PeekFanDesk({ w }: { w: Where }) {
  const mode = fanMode(w.step);
  const poses =
    mode === "landed"
      ? DESK_POSES.map((p) => ({ ...p, x: p.x - 18, r: p.r * 1.5 }))
      : DESK_POSES;
  const hers = mode !== "open";
  const tiles = [
    <Still key="a" src={NEWEST[1]} className="size-full" />,
    <Still key="b" src={NEWEST[2]} className="size-full" />,
    hers ? (
      <HerSlot key="c" />
    ) : (
      <Still key="c" src={NEWEST[0]} className="size-full" />
    ),
  ];
  return (
    <div
      data-door-fan="desk"
      data-door-fan-mode={mode}
      aria-hidden
      className="pointer-events-none absolute top-[196px] left-[30px] z-0 h-0 w-0"
    >
      {(mode === "bright" || mode === "landed") && (
        <span className="door-fan-glow absolute top-1/2 right-0 h-80 w-56 -translate-y-1/2" />
      )}
      {tiles.map((tile, i) => (
        <span
          key={i}
          data-door-fan-tile={i === 2 ? "front" : "back"}
          className={cn(
            "door-fan-tile door-fan-side absolute top-[-72px] right-0 h-[144px] w-[180px]",
            mode === "held" && i < 2 && "door-fan-held",
          )}
          style={{ ...poseStyle(poses[i], i), zIndex: i === 2 ? 3 : i + 1 }}
        >
          {tile}
        </span>
      ))}
    </div>
  );
}

/** With the keyboard up the sheet is nearly the whole visible area, so the fan
 *  rides inside it, small, at its head. */
function PeekFanCompact({ w }: { w: Where }) {
  const mode = fanMode(w.step);
  return (
    <div
      data-door-fan="compact"
      data-door-fan-mode={mode}
      aria-hidden
      className="relative mx-auto h-[62px] w-[132px]"
    >
      <div className="absolute bottom-0 left-1/2 h-full w-0">
        {(mode === "bright" || mode === "landed") && (
          <span className="door-fan-glow absolute -bottom-2 left-1/2 h-16 w-36 -translate-x-1/2" />
        )}
        <FanTiles mode={mode} small typing={w.step === "name"} />
      </div>
    </div>
  );
}

function MiniFan() {
  return (
    <span
      data-door-fan="card"
      aria-hidden
      className="relative block h-10 w-14 shrink-0"
    >
      {[NEWEST[1], NEWEST[2], NEWEST[0]].map((src, i) => (
        <Still
          key={src}
          src={src}
          className="absolute bottom-0 left-1/2 aspect-[4/5] w-7"
          style={{
            transform: `translateX(calc(-50% + ${[-11, 11, 0][i]}px)) rotate(${[-10, 9, -1][i]}deg)`,
            transformOrigin: "50% 100%",
            zIndex: i === 2 ? 3 : i + 1,
          }}
        />
      ))}
    </span>
  );
}

const PEEK: LookDef = {
  // Sharp stills over a soft, dimmed album: the contrast is the whole idea.
  scrim: { blur: 20, dim: 0.22 },
  slots: (w) =>
    w.step === "menu" || w.step === "menu-email"
      ? { cardDecor: <MiniFan /> }
      : {},
  behind: (w) =>
    w.keyboard ? null : w.size === "desk" ? (
      <PeekFanDesk w={w} />
    ) : (
      <PeekFanEdge w={w} />
    ),
  head: (w) => (w.keyboard ? <PeekFanCompact w={w} /> : null),
};

/* ══ LIT: the screen lamp ═══════════════════════════════════════════════ */

/** The house five, law 3's no-media branch, until the sample lands. */
const HOUSE_HUES = [25, 85, 155, 255, 305];

const HueContext = createContext<readonly number[] | null>(null);

const hueOf = (color: string): number => {
  const m = /oklch\([^)]*\s([\d.]+)\)$/.exec(color.trim());
  return m ? Number(m[1]) : 0;
};

/**
 * THE SAMPLE, ONCE PER PREVIEW: the album's newest three read into one strip
 * (`useSampledPalette`, the same sampler the site's lamps use), kept as hues
 * so the register (paper in light, dark in dark) is the stylesheet's to pick.
 */
export function LitProvider({ children }: { children: ReactNode }) {
  const colors = useSampledPalette(NEWEST, "dark");
  const hues = colors ? colors.map(hueOf) : null;
  return <HueContext.Provider value={hues}>{children}</HueContext.Provider>;
}

function useHues(): { hues: readonly number[]; sampled: boolean } {
  const hues = useContext(HueContext);
  return { hues: hues ?? HOUSE_HUES, sampled: hues !== null };
}

type Strength = "base" | "bright" | "bloom";

function strengthOf(step: Where["step"]): Strength {
  return step === "code" ? "bright" : step === "in" ? "bloom" : "base";
}

/**
 * THE LIGHT ON THE SHEET'S FREE EDGE: three of the sampled hues as soft blobs,
 * a bright line where the edge catches them, and a mask that spends the light
 * before it reaches the words. It drifts on the lamps' own clock
 * (`--spill-cadence`) and rests still under reduced motion.
 */
function Lamp({
  edge,
  strength = "base",
}: {
  edge: "top" | "left" | "card";
  strength?: Strength;
}) {
  const { hues, sampled } = useHues();
  return (
    <div
      data-door-lamp={strength}
      data-door-hues={hues.slice(0, 3).map(Math.round).join(",")}
      data-door-sampled={sampled ? "" : undefined}
      aria-hidden
      className={cn("door-lamp", `door-lamp-${edge}`, `door-lamp-${strength}`)}
      style={
        {
          "--lit-h1": hues[0],
          "--lit-h2": hues[1],
          "--lit-h3": hues[2],
        } as CSSProperties
      }
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

/**
 * THE COUNT, LIVE: the welcome's own number (its words untouched) ticks from
 * the 48 the page loaded with to the 50 now inside, one per photograph that
 * landed behind the door (the two glowing through the blur). Still, it reads
 * the settled 50.
 */
function Ticker() {
  const from = EVENT.approvedTotal;
  return (
    <span data-door-ticker className="door-ticker tabular-nums">
      <span className="door-tick door-tick-0">{from}</span>
      <span className="door-tick door-tick-1">{from + 1}</span>
      <span className="door-tick door-tick-2" data-door-tick-settled>
        {from + 2}
      </span>
    </span>
  );
}

function LitHero({ desk }: { desk: boolean }) {
  return (
    <div className="flex flex-col">
      <p className="text-label font-medium text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p
        data-door-lit-name
        className={cn(
          "mt-1.5 font-heading text-balance",
          desk ? "text-section" : "text-hero",
        )}
      >
        {EVENT.name}
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <HostAvatar size="lg" />
        <p className="text-working leading-snug text-muted-foreground">
          Hosted by{" "}
          <span className="font-medium text-foreground">{HOST.name}</span>
          <br />
          {EVENT.date}
        </p>
      </div>
    </div>
  );
}

const LIT: LookDef = {
  // The lightbox's own ground (`glass-behind`, his `behind=album`) at a gentler
  // dim: its blur and its saturation, the room darkened enough for a lamp to
  // be seen and no further (at its full half brightness the album vanished
  // in dark mode, and the album is the reward).
  scrim: { blur: 28, dim: 0.3, brightness: 0.72, saturate: 1.2 },
  slots: (w) => {
    if (w.step === "menu" || w.step === "menu-email")
      return {
        cardHeader: <Lamp edge="card" />,
      };
    return {
      welcomeHero: <LitHero desk={w.size === "desk"} />,
      count: <Ticker />,
    };
  },
  glow: (w) => (
    <Lamp
      edge={w.size === "desk" ? "left" : "top"}
      strength={strengthOf(w.step)}
    />
  ),
};

/* ══ TICKET: the reel tile's own card ═══════════════════════════════════ */

/** The reel tile's crossfade, the album's newest three, its own 3.2 s hold. */
function Crossfade({ className }: { className?: string }) {
  return (
    <span className={cn("absolute inset-0 block", className)}>
      {NEWEST.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
        <img
          key={src}
          src={src}
          alt=""
          data-door-xfade-first={i === 0 ? "" : undefined}
          className="door-xfade"
          style={{ "--xi": i } as CSSProperties}
        />
      ))}
    </span>
  );
}

function Notches({ at }: { at: string }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute -left-2.5 z-20 size-5 -translate-y-1/2 rounded-full bg-popover"
        style={{ top: at }}
      />
      <span
        aria-hidden
        className="absolute -right-2.5 z-20 size-5 -translate-y-1/2 rounded-full bg-popover"
        style={{ top: at }}
      />
    </>
  );
}

/** The welcome, as a ticket: the photograph, the name on it, a perforation,
 *  and the stub she keeps under it (the album's own count, the date). */
function TicketCard({ desk }: { desk: boolean }) {
  return (
    <div data-door-ticket="card" className="relative">
      <div className="relative overflow-hidden rounded-xl bg-black text-white shadow-lift">
        <div
          className={cn("relative", desk ? "aspect-[4/3]" : "aspect-[16/11]")}
        >
          <Crossfade />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/0"
          />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-label font-medium text-white/75 uppercase">
              You&rsquo;re invited to
            </p>
            <p className="mt-1 font-heading text-page text-balance text-white">
              {EVENT.name}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-working text-white/80">
              <HostAvatar />
              <span>
                Hosted by{" "}
                <span className="font-medium text-white">{HOST.name}</span>
              </span>
            </p>
          </div>
        </div>
        <div
          data-door-ticket-stub
          className="relative flex items-center justify-between border-t border-dashed border-white/25 px-4 py-2.5 text-xs text-white/80"
        >
          <span className="flex items-center gap-1.5 tabular-nums">
            <Images className="size-3.5" aria-hidden />
            {`${EVENT.approvedTotal} photos & videos inside`}
          </span>
          <span>{EVENT.date}</span>
        </div>
      </div>
      <Notches at="calc(100% - 38px)" />
    </div>
  );
}

type StubState = "count" | "held" | "open" | "stamped";

function stubState(step: Where["step"]): StubState {
  return step === "gate"
    ? "held"
    : step === "code"
      ? "open"
      : step === "in"
        ? "stamped"
        : "count";
}

/** What the ticket leaves once Continue tears it: the stub, riding the sheet. */
function TicketStub({
  state = "count",
  compact = false,
}: {
  state?: StubState;
  compact?: boolean;
}) {
  return (
    <div
      data-door-ticket="stub"
      data-door-stub-state={state}
      className={cn(
        "door-stub relative isolate flex items-center gap-3 overflow-hidden rounded-xl bg-black text-white shadow-lift ring-1 ring-white/10",
        compact ? "p-1.5 pr-3" : "p-2 pr-3",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
      <img
        src={NEWEST[0]}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-45 blur-xl"
      />
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md",
          compact ? "size-8" : "size-9",
        )}
      >
        <Crossfade />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{EVENT.name}</span>
        <span className="block truncate text-xs text-white/70">
          {/* The date only where the stub has the room for it: inside her
              menu's card it would truncate the host's name instead. */}
          {compact
            ? `Hosted by ${HOST.name}`
            : `Hosted by ${HOST.name} · ${EVENT.date}`}
        </span>
      </span>
      <span
        aria-hidden
        className="h-7 border-l border-dashed border-white/30"
      />
      <span className="flex w-10 shrink-0 items-center justify-center text-xs text-white/80 tabular-nums">
        {state === "count" && (
          <span className="flex items-center gap-1">
            <Images className="size-3.5" aria-hidden />
            {EVENT.approvedTotal}
          </span>
        )}
        {state === "held" && <Lock className="size-4" aria-label="Held" />}
        {state === "open" && (
          <LockOpen className="size-4" aria-label="Opening" />
        )}
        {state === "stamped" && (
          <span
            data-door-stamp
            className="door-stamp flex size-9 rotate-[-14deg] items-center justify-center rounded-full border-2 border-success text-success"
          >
            <Check className="size-4.5" strokeWidth={3} />
          </span>
        )}
      </span>
    </div>
  );
}

const TICKET: LookDef = {
  scrim: { blur: 16, dim: 0.25 },
  slots: (w) => {
    if (w.step === "menu" || w.step === "menu-email")
      return {
        cardHeader: (
          <div className="relative z-10 mb-3">
            <TicketStub compact />
          </div>
        ),
      };
    return {
      welcomeHero: <TicketCard desk={w.size === "desk"} />,
      inBeat: (
        <InBeat
          mark={
            <div className="w-full max-w-72 text-left">
              <TicketStub state="stamped" />
            </div>
          }
        />
      ),
    };
  },
  head: (w) =>
    w.step === "welcome" || w.step === "in" ? null : (
      <TicketStub state={stubState(w.step)} compact={w.keyboard} />
    ),
};

/* ══ HOST: the identity line ════════════════════════════════════════════ */

/**
 * HER WORDS, AS A MESSAGE FROM HER: the event's own description in a bubble
 * under her face, arriving once the way a message does (a typing mark, then
 * the words). Absent when she wrote nothing, and the door writes nothing in its
 * place.
 */
function Greeting() {
  return (
    <div
      data-door-greeting
      className="door-bubble relative rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-reading text-pretty text-foreground"
    >
      <span aria-hidden className="door-bubble-dots">
        <i />
        <i />
        <i />
      </span>
      <span className="door-bubble-text">{DESCRIPTION}</span>
    </div>
  );
}

function HostLead({ greeting, desk }: { greeting: boolean; desk: boolean }) {
  return (
    <div data-door-host className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <HostAvatar
          size="default"
          className={cn(desk ? "size-16" : "size-14", "shadow-lift")}
        />
        <div className="min-w-0 pt-1.5">
          <p className="text-card-title font-medium">{HOST.name}</p>
          <p className="text-working text-muted-foreground">
            {`Your host · ${EVENT.date}`}
          </p>
        </div>
      </div>
      {greeting && <Greeting />}
      <div>
        <p className="text-label font-medium text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {EVENT.name}
        </p>
      </div>
    </div>
  );
}

function HostChip() {
  return (
    <span data-door-host-chip className="flex min-w-0 items-center gap-2">
      <HostAvatar />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight font-medium">
          {EVENT.name}
        </span>
        <span className="block truncate text-xs leading-tight text-muted-foreground">
          {`Hosted by ${HOST.name}`}
        </span>
      </span>
    </span>
  );
}

const HOST_LOOK: LookDef = {
  // The lightest of the four: her album stays nearly readable behind her face.
  scrim: { blur: 10, dim: 0.14 },
  slots: (w) => {
    if (w.step === "menu" || w.step === "menu-email")
      return {
        cardHeader: (
          <div className="relative z-10 mb-2.5">
            <HostChip />
          </div>
        ),
      };
    return {
      welcomeHero: <HostLead greeting={w.greeting} desk={w.size === "desk"} />,
      inBeat: (
        <InBeat
          mark={
            <span className="relative">
              <HostAvatar size="default" className="size-14 shadow-lift" />
              <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-popover">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            </span>
          }
        />
      ),
    };
  },
  head: (w) => (w.step === "welcome" || w.step === "in" ? null : <HostChip />),
};

export const LOOKS: Record<Look, LookDef> = {
  lit: LIT,
  peek: PEEK,
  ticket: TICKET,
  host: HOST_LOOK,
};
