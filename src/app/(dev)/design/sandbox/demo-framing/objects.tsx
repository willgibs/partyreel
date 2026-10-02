"use client";

import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { CodeMark } from "./code";
import { DOMAIN } from "./fixtures";

/**
 * THE HERO'S OBJECT, THREE WAYS: his hybrid's one group, the code over the
 * address, drawn as each take stands it (`TAKES`).
 *
 *  - `rise`: the code stands up out of the link, its foot tucked behind the
 *    address bar as the card's prints stand out of the card today, and a new
 *    code rises out of the bar each time an address lands.
 *  - `open`: one white object, the link that opens into its invite: a pill
 *    while the address is being typed, a card with the code at its head once
 *    it lands, and back.
 *  - `words`: the code alone on paper, and its address under it in the
 *    night's own white type, the way a code is printed with its link under it.
 *
 * ★ THE ADDRESS IS A SIZE DOWN FROM ROUND TWO'S STAGE (his note: "knock the
 * partyreel link typing font size down a little so it doesn't fight with the
 * H1"): 21 px at a desk, where round two set 32 and the headline is 88, and
 * 15 at a phone. The caption reads both sizes off the frame.
 *
 * ★ THE LINE IS AS WIDE AS THE WIDEST ADDRESS THE LOOP TYPES, AND CENTRED:
 * invisible copies of every address, stacked in one cell, give the line its
 * width, so the object's silhouette never changes under a key and no address
 * is ever cut (round two measured that with a probe; here it holds by
 * construction). Round two set its stage's address from the left, as an
 * address bar is, so nothing slid under a key; under a centred code the
 * address at rest has to be centred too, or the group leans, so it is set
 * from the middle and moves half a letter a key while it types.
 *
 * ★ EVERY LENGTH IS `base + --hhs-k * (lg - base)`, the hero's own sheet
 * picking the phone's drawing, the desk's or the tablet's between them, as
 * the card does today.
 *
 * ★ THE MOTION IS CSS TRANSITIONS ON A DATA STATE the hero's loop sets once a
 * turn (`up`, `open`), never a per-frame write, so the browser runs each
 * spring on the compositor; under reduced motion or in a paused frame every
 * transition is off and the object simply stands.
 */

export type TakeId = "rise" | "open" | "words";

/** One length at every geometry, as the hero's `--hhs-k` picks it. */
export function len(base: number, lg: number): string {
  if (base === lg) return `${base}px`;
  return `calc(${base}px + var(--hhs-k) * ${+(lg - base).toFixed(3)}px)`;
}

type Pair = { readonly base: number; readonly lg: number };
const at = (p: Pair) => len(p.base, p.lg);

/** The object's sizes, per take: the phone's drawing and the desk's. */
const G = {
  /** The address's size and its line's height. */
  font: { base: 15, lg: 21 },
  line: { base: 20, lg: 28 },
  /** The bar's height and its inset, for the two takes on paper. */
  barH: { base: 46, lg: 60 },
  padX: { base: 18, lg: 24 },
  /** The code's edge, quiet zone included, and its corner. */
  code: { base: 96, lg: 128 },
  codeR: { base: 15, lg: 19 },
  /**
   * How far the code's foot tucks behind the bar (`rise`): inside its quiet
   * zone (four of 37 units, 10.4 px at the phone's 96 and 13.8 at the desk's
   * 128), so the bar never covers a module and the code still scans.
   */
  tuck: { base: 8, lg: 11 },
  /** The concave joint where the code meets the bar, so the two are one paper. */
  fillet: { base: 9, lg: 12 },
  /** The invite's head over the code, and the code's air over the address (`open`). */
  padTop: { base: 14, lg: 18 },
  gap: { base: 6, lg: 8 },
  openR: { base: 22, lg: 28 },
  /**
   * The code alone (`words`): larger, since it is the object, and its gap to
   * the words. ★ THE GAP IS THE BAND'S, NOT A TASTE: the words are white type
   * on the night, so they stand clear of everything the stream reaches below
   * the axis at their own half-width (`hero-stream.ts` `reachOf`: 64 px at a
   * 375 phone's 118, 51 at a desk's 166) plus a margin; at a phone that is
   * most of a line further down than a caption would sit.
   */
  soloCode: { base: 104, lg: 140 },
  soloR: { base: 16, lg: 20 },
  soloGap: { base: 28, lg: 18 },
  /**
   * The least air between the object's foot and the headline. The two paper
   * takes stand well clear of it (their foot is on the axis's own line); the
   * words stand under the band, so the block steps down to keep it.
   */
  air: { base: 40, lg: 64 },
} as const satisfies Record<string, Pair>;

/**
 * HOW EACH OBJECT STANDS ON THE STREAM'S AXIS, per geometry, for the hero's
 * layout: its box height, how far above its foot the axis runs (where the
 * album is born behind it), and what it paints above its box. On paper the
 * album leaves from behind the address, so the code crowns it; in `words` it
 * leaves (or arrives) behind the code, since the words on the night may never
 * stand on a photograph.
 */
export type Stand = {
  readonly box: number;
  readonly axis: number;
  /** The least air between its foot and the headline. */
  readonly air: number;
};
export const STANDS: Record<TakeId, { base: Stand; lg: Stand }> = {
  rise: {
    base: {
      box: G.code.base - G.tuck.base + G.barH.base,
      axis: G.barH.base / 2,
      air: G.air.base,
    },
    lg: {
      box: G.code.lg - G.tuck.lg + G.barH.lg,
      axis: G.barH.lg / 2,
      air: G.air.lg,
    },
  },
  open: {
    base: {
      box: G.padTop.base + G.code.base + G.gap.base + G.barH.base,
      axis: G.barH.base / 2,
      air: G.air.base,
    },
    lg: {
      box: G.padTop.lg + G.code.lg + G.gap.lg + G.barH.lg,
      axis: G.barH.lg / 2,
      air: G.air.lg,
    },
  },
  words: {
    base: {
      box: G.soloCode.base + G.soloGap.base + G.line.base,
      axis: G.line.base + G.soloGap.base + G.soloCode.base / 2,
      air: G.air.base,
    },
    lg: {
      box: G.soloCode.lg + G.soloGap.lg + G.line.lg,
      axis: G.line.lg + G.soloGap.lg + G.soloCode.lg / 2,
      air: G.air.lg,
    },
  },
};

/** Paper on the cinema ground: the card's own two-layer shadow, and lifted. */
const PAPER = {
  rest: "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)",
  lifted:
    "0 14px 24px -6px oklch(0 0 0 / 0.5), 0 28px 48px -12px oklch(0 0 0 / 0.6)",
};

/** The lift's clock: an occasional reply to a pointer, so quick (bible 5). */
const LIFT_MS = 240;

/** How far the object rises under a pointer: the phone's drawing, then the desk's. */
const RISE = { base: 4, lg: 6 };

/** A spring that overshoots and settles: the code's arrival. */
const SPRING = "cubic-bezier(0.2, 1.32, 0.36, 1)";
/** A smaller overshoot, for a box that grows (the invite opening). */
const SPRING_SOFT = "cubic-bezier(0.25, 1.18, 0.4, 1)";
/** In with intent, out quick (house: the in-out curve for a thing that leaves). */
const AWAY = "cubic-bezier(0.55, 0, 0.8, 0.2)";

export type ObjectLive = {
  /** The address standing, whose code is shown. */
  readonly slug: string;
  /** Every address the loop types: the line's width is the widest's. */
  readonly addresses: readonly string[];
  /** The code stands (`rise`, `words`), or the invite is open (`open`). */
  readonly up: boolean;
  /** Under a pointer (or its focus), at a desk. */
  readonly lifted: boolean;
  /** Reduced motion or a paused frame: everything simply stands. */
  readonly still: boolean;
};

/* ── the address line, shared ─────────────────────────────────────────────── */

/**
 * THE TYPED ADDRESS: the domain in the quiet step, the slug the host typed in
 * ink, the caret the loop fades, and the settled arrow (`touch=arrow`), which
 * nudges toward where it goes under a pointer (his note: "a slight hover
 * state so a user feels it is clickable"). React renders the demo's own
 * address once; while the loop types, it rewrites that one text node.
 */
function TypedLine({
  slug,
  addresses,
  night,
  lifted,
}: {
  slug: string;
  /** Every address the loop types: the line is as wide as the widest. */
  addresses: readonly string[];
  /** White type on the cinema ground (`words`), not ink on paper. */
  night: boolean;
  lifted: boolean;
}) {
  const parts = (typed: string, sizer: boolean) => (
    <>
      <span
        data-df-domain={sizer ? undefined : ""}
        className={night ? "text-white/55" : "text-faint"}
      >
        {DOMAIN}
      </span>
      <span
        data-df-typed={sizer ? undefined : ""}
        data-df-own={sizer ? undefined : slug}
        className={cn(
          "font-semibold tracking-[-0.01em]",
          night ? "text-white" : "text-foreground",
        )}
      >
        {typed}
      </span>
      <span
        data-df-caret={sizer ? undefined : ""}
        aria-hidden
        className={cn(
          "shrink-0 self-center rounded-full",
          night ? "bg-white" : "bg-foreground",
        )}
        style={{
          width: len(1.5, 2),
          height: "1.05em",
          marginLeft: "0.04em",
          opacity: 0,
        }}
      />
      <span
        data-df-touch={sizer ? undefined : "arrow"}
        className="flex shrink-0 self-center"
        style={{
          marginLeft: "0.16em",
          transform: lifted ? "translate(0.08em, -0.08em)" : "none",
          transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <ArrowUpRight
          aria-hidden
          strokeWidth={2.3}
          className={cn(
            "transition-colors",
            night
              ? lifted
                ? "text-white"
                : "text-white/55"
              : lifted
                ? "text-foreground"
                : "text-muted-foreground",
          )}
          style={{ width: "0.86em", height: "0.86em" }}
        />
      </span>
    </>
  );
  return (
    <span
      data-df-line
      className="relative inline-flex items-center whitespace-nowrap"
      style={{ fontSize: at(G.font), lineHeight: at(G.line) }}
    >
      {/* The sizers: every address the loop types, unseen and stacked in one
          cell, so the line is exactly as wide as the widest of them. */}
      <span aria-hidden className="invisible grid">
        {addresses.map((a) => (
          <span key={a} className="col-start-1 row-start-1 flex items-center">
            {parts(a, true)}
          </span>
        ))}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        {parts(slug, false)}
      </span>
    </span>
  );
}

/** The code on its plate: the quiet zone's white, its corners rounded. */
function Plate({
  slug,
  edge,
  radius,
  shadow,
  tucked = false,
}: {
  slug: string;
  edge: Pair;
  radius: Pair;
  shadow: string;
  /** Its foot stands in the bar, so only its head is rounded. */
  tucked?: boolean;
}) {
  const r = at(radius);
  return (
    <span
      // A hairline only where the plate stands alone: tucked into the bar, a
      // ring would draw a seam across the joint the fillets make one paper.
      className={cn("block overflow-hidden", !tucked && "ring-1 ring-black/10")}
      style={{
        width: at(edge),
        height: at(edge),
        borderRadius: tucked ? `${r} ${r} 0 0` : r,
        boxShadow: shadow,
        transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <CodeMark slug={slug} style={{ width: "100%", height: "100%" }} />
    </span>
  );
}

/**
 * THE JOINT: two concave corners of paper where the code's sides meet the
 * bar's top edge, so the code reads as growing out of the link rather than a
 * tile set on it. They ride the code's foot, so they sink and rise with it,
 * and run on down behind the bar, so the spring's overshoot never lifts them
 * clear of it.
 */
function Fillets() {
  const r = at(G.fillet);
  const top = `calc(${at(G.code)} - ${at(G.tuck)} - ${r})`;
  const paper = (corner: string) =>
    `radial-gradient(circle at ${corner} 0, transparent calc(${r} - 0.5px), #fff ${r}) top left / 100% ${r} no-repeat, linear-gradient(#fff, #fff) bottom left / 100% calc(100% - ${r}) no-repeat`;
  const box = { top, width: r, height: `calc(${r} + 16px)` };
  return (
    <>
      <span
        aria-hidden
        className="absolute"
        style={{ ...box, left: `calc(-1 * ${r})`, background: paper("0") }}
      />
      <span
        aria-hidden
        className="absolute"
        style={{ ...box, right: `calc(-1 * ${r})`, background: paper("100%") }}
      />
    </>
  );
}

const liftOf = (lifted: boolean) =>
  lifted ? `translateY(calc(-1 * ${len(RISE.base, RISE.lg)}))` : "none";

/* ── rise: the code stands up out of the link ─────────────────────────────── */

function RiseObject({ live }: { live: ObjectLive }) {
  const { slug, addresses, up, lifted, still } = live;
  const shadow = lifted ? PAPER.lifted : PAPER.rest;
  // The code's window runs from well over its head (its shadow and its
  // overshoot) down to the bar's middle, behind the bar: sunk past that line,
  // the code is gone into the link.
  const headroom = 48;
  const sink = `calc(${at({ base: G.code.base - G.tuck.base, lg: G.code.lg - G.tuck.lg })} + ${at({ base: G.barH.base / 2, lg: G.barH.lg / 2 })})`;
  return (
    <span
      aria-hidden
      data-hero-object
      data-df-object="rise"
      data-df-up={up ? "" : undefined}
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col items-center"
      style={{
        paddingTop: at({
          base: G.code.base - G.tuck.base,
          lg: G.code.lg - G.tuck.lg,
        }),
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{
          top: -headroom,
          width: `calc(${at(G.code)} + ${headroom * 2}px)`,
          height: `calc(${headroom}px + ${sink})`,
        }}
      >
        <span
          data-df-code-plate
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: headroom,
            transform: up ? "translateY(0)" : `translateY(${sink})`,
            transition: still
              ? "none"
              : up
                ? `transform 640ms ${SPRING}`
                : `transform 240ms ${AWAY}`,
          }}
        >
          <Plate
            slug={slug}
            edge={G.code}
            radius={G.codeR}
            shadow={shadow}
            tucked
          />
          <Fillets />
        </span>
      </span>
      <span
        className="surface-paper relative flex items-center rounded-full bg-white text-foreground"
        style={{
          height: at(G.barH),
          paddingInline: at(G.padX),
          boxShadow: shadow,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <TypedLine
          slug={slug}
          addresses={addresses}
          night={false}
          lifted={lifted}
        />
      </span>
    </span>
  );
}

/* ── open: the link opens into its invite ─────────────────────────────────── */

function OpenObject({ live }: { live: ObjectLive }) {
  const { slug, addresses, up, lifted, still } = live;
  const shadow = lifted ? PAPER.lifted : PAPER.rest;
  const openH = at({
    base: G.padTop.base + G.code.base + G.gap.base + G.barH.base,
    lg: G.padTop.lg + G.code.lg + G.gap.lg + G.barH.lg,
  });
  return (
    <span
      aria-hidden
      data-hero-object
      data-df-object="open"
      data-df-up={up ? "" : undefined}
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col justify-end"
      style={{
        height: openH,
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      {/* The one white object: a pill while the address is typed, the invite
          once it lands. It grows UP from the address, which never moves. */}
      <span
        data-df-paper
        className="surface-paper absolute inset-x-0 bottom-0 block overflow-hidden bg-white ring-1 ring-black/10"
        style={{
          height: up ? openH : at(G.barH),
          borderRadius: up
            ? at(G.openR)
            : at({ base: G.barH.base / 2, lg: G.barH.lg / 2 }),
          boxShadow: shadow,
          transition: still
            ? `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`
            : up
              ? `height 620ms ${SPRING_SOFT}, border-radius 620ms ${SPRING_SOFT}, box-shadow ${LIFT_MS}ms var(--ease-emphasis)`
              : `height 420ms var(--ease-in-out-strong, cubic-bezier(0.77, 0, 0.175, 1)) 90ms, border-radius 420ms var(--ease-in-out-strong, cubic-bezier(0.77, 0, 0.175, 1)) 90ms, box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        {/* The code at the invite's head, standing still as the paper rises
            past it, so it is revealed from its foot up: out of the link. */}
        <span
          data-df-code-plate
          className="absolute left-1/2 block -translate-x-1/2"
          style={{
            bottom: `calc(${at(G.barH)} + ${at(G.gap)})`,
            opacity: up ? 1 : 0,
            transform: up ? "scale(1)" : "scale(0.94)",
            transition: still
              ? "none"
              : up
                ? `opacity 260ms ease-out 120ms, transform 620ms ${SPRING_SOFT} 60ms`
                : `opacity 140ms ease-in, transform 200ms ${AWAY}`,
          }}
        >
          <span
            className="block overflow-hidden"
            style={{
              width: at(G.code),
              height: at(G.code),
              borderRadius: at(G.codeR),
            }}
          >
            <CodeMark slug={slug} style={{ width: "100%", height: "100%" }} />
          </span>
        </span>
      </span>
      <span
        className="surface-paper relative flex items-center justify-center text-foreground"
        style={{ height: at(G.barH), paddingInline: at(G.padX) }}
      >
        <TypedLine
          slug={slug}
          addresses={addresses}
          night={false}
          lifted={lifted}
        />
      </span>
    </span>
  );
}

/* ── words: the code alone, its address on the night ──────────────────────── */

function WordsObject({ live }: { live: ObjectLive }) {
  const { slug, addresses, up, lifted, still } = live;
  const shadow = lifted ? PAPER.lifted : PAPER.rest;
  return (
    <span
      aria-hidden
      data-hero-object
      data-df-object="words"
      data-df-up={up ? "" : undefined}
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col items-center"
      style={{
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-code-plate
        className="block"
        style={{
          opacity: up ? 1 : 0,
          transform: up ? "scale(1)" : "scale(0.78)",
          transition: still
            ? "none"
            : up
              ? `opacity 220ms ease-out, transform 600ms ${SPRING}`
              : `opacity 180ms ease-in, transform 220ms ${AWAY}`,
        }}
      >
        <Plate slug={slug} edge={G.soloCode} radius={G.soloR} shadow={shadow} />
      </span>
      <span
        className="flex items-center"
        style={{ marginTop: at(G.soloGap), height: at(G.line) }}
      >
        <TypedLine slug={slug} addresses={addresses} night lifted={lifted} />
      </span>
    </span>
  );
}

export function HeroObject({ take, live }: { take: TakeId; live: ObjectLive }) {
  return take === "rise" ? (
    <RiseObject live={live} />
  ) : take === "open" ? (
    <OpenObject live={live} />
  ) : (
    <WordsObject live={live} />
  );
}
