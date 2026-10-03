"use client";

import "./demo-framing.css";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, RefObject } from "react";

import { Doorway } from "@/components/guest/door/doorway";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { LiveCode } from "./code";
import {
  DOMAIN,
  facesOf,
  type Party,
  titleOf,
  TYPED_MAX,
  typedSlugOf,
} from "./fixtures";

/**
 * THE HERO'S OBJECTS, ROUND FOUR: what each hero stands on the stream's axis.
 *
 *  - `plate`: his centre object nailed. The link and its code as ONE thing, a
 *    pane of the product's own glass holding the designed code on its white
 *    tile with the address set under it; it never changes shape, its code
 *    redraws in place (`code.tsx`), and the album glows through it.
 *  - `card`: his second direction. A mini event card (the party's cover, its
 *    name and its day, the first faces in) that types its name along with the
 *    address, over the link set minimal in white on the night.
 *  - `field`: the link as a field the visitor can take over and type their
 *    own party into, its code a small picture at the field's head.
 *
 * ★ THE ADDRESS IS A SIZE DOWN FROM ROUND TWO'S STAGE (settled): 21 px at a
 * desk, 15 at a phone, in every object; the caption reads it off the frame.
 *
 * ★ EVERY LENGTH IS `base + --hhs-k * (lg - base)`: the hero's sheet picks the
 * phone's drawing, the desk's, or the tablet's composed between them, as the
 * shipped card does, so one object in the markup serves three geometries.
 *
 * ★ THE MOTION IS CSS ON STATE THE LOOP SETS ONCE A TURN (`up`, the standing
 * party), never a per-frame write, so the browser runs every transition on
 * its own clock; under reduced motion or in a paused frame nothing moves and
 * the object simply stands, whole.
 */

export type TakeId = "plate" | "card" | "field" | "door";

/** One length at every geometry, as the hero's `--hhs-k` picks it. */
export function len(base: number, lg: number): string {
  if (base === lg) return `${base}px`;
  return `calc(${base}px + var(--hhs-k) * ${+(lg - base).toFixed(3)}px)`;
}

export type Pair = { readonly base: number; readonly lg: number };
export const at = (p: Pair) => len(p.base, p.lg);
const sum = (...ps: Pair[]): Pair => ({
  base: ps.reduce((a, p) => a + p.base, 0),
  lg: ps.reduce((a, p) => a + p.lg, 0),
});

/** The address, every object: its size and line (settled: a size down from round two). */
const FONT = { base: 15, lg: 21 } as const;
export const LINE = { base: 20, lg: 28 } as const;

export type ObjectLive = {
  /** The address standing: whose code, cover and picture are shown. */
  readonly party: Party;
  /** Every address the loop types: a line is as wide as the widest. */
  readonly addresses: readonly string[];
  /** An address stands (its album pours); false while the next is typed. */
  readonly up: boolean;
  /** Under a pointer (or its focus), at a desk. */
  readonly lifted: boolean;
  /** Reduced motion or a paused frame: everything simply stands. */
  readonly still: boolean;
};

/**
 * HOW EACH OBJECT STANDS ON THE STREAM'S AXIS, per geometry: its box height,
 * how far above its foot the axis runs (where the album is born behind it),
 * and the least air between its foot and the headline.
 */
export type Stand = {
  readonly box: number;
  readonly axis: number;
  readonly air: number;
};

/** The lift's clock: an occasional reply to a pointer, so quick (bible 5). */
export const LIFT_MS = 240;

/** How far an object rises under a pointer: the phone's drawing, then the desk's. */
const RISE = { base: 4, lg: 6 };

export const liftOf = (lifted: boolean) =>
  lifted ? `translateY(calc(-1 * ${len(RISE.base, RISE.lg)}))` : "none";

/** Paper on the cinema ground: the shipped card's own two-layer shadow, and lifted. */
export const PAPER = {
  rest: "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)",
  lifted:
    "0 14px 24px -6px oklch(0 0 0 / 0.5), 0 28px 48px -12px oklch(0 0 0 / 0.6)",
};

/* ── the address, shared ──────────────────────────────────────────────── */

/** The caret the loop fades: on while an address changes, gone once it lands. */
function Caret({ night }: { night: boolean }) {
  return (
    <span
      data-df-caret=""
      aria-hidden
      className={cn(
        "inline-block shrink-0 self-center rounded-full",
        night ? "bg-white" : "bg-foreground",
      )}
      style={{
        width: len(1.5, 2),
        height: "1.05em",
        marginLeft: "0.04em",
        opacity: 0,
      }}
    />
  );
}

/** The settled arrow: it nudges toward where it goes under a pointer. */
function Arrow({
  lifted,
  night,
  className,
}: {
  lifted: boolean;
  night: boolean;
  className?: string;
}) {
  return (
    <span
      data-df-touch="arrow"
      className={cn("flex shrink-0 items-center justify-center", className)}
      style={{
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
              : "text-white/60"
            : lifted
              ? "text-foreground"
              : "text-muted-foreground",
        )}
        style={{ width: "0.86em", height: "0.86em" }}
      />
    </span>
  );
}

/**
 * THE TYPED LINE, ONE ROW: the domain in the quiet step, the slug in ink (or
 * white on the night), the caret, the arrow. Invisible copies of every address
 * the loop types, stacked in one cell, give the line its width, so the object
 * never changes size under a key and no address is ever cut. Centred under a
 * centred object, so it moves half a letter a key while it types.
 */
export function LinkLine({
  slug,
  addresses,
  night,
  lifted,
  arrow = true,
}: {
  slug: string;
  addresses: readonly string[];
  night: boolean;
  lifted: boolean;
  /** The arrow after it (a field carries its arrow in a well of its own). */
  arrow?: boolean;
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
      {sizer ? (
        <span style={{ width: len(1.5, 2), marginLeft: "0.04em" }} />
      ) : (
        <Caret night={night} />
      )}
      {arrow ? (
        <span style={{ marginLeft: "0.16em" }} className="flex">
          {sizer ? (
            <span style={{ width: "0.86em" }} />
          ) : (
            <Arrow lifted={lifted} night={night} />
          )}
        </span>
      ) : null}
    </>
  );
  return (
    <span
      data-df-line=""
      className="relative inline-flex items-center whitespace-nowrap"
      style={{ fontSize: at(FONT), lineHeight: at(LINE) }}
    >
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

/* ── plate: the code and its link, one pane ───────────────────────────── */

const PLATE = {
  pad: { base: 12, lg: 16 },
  tilePad: { base: 10, lg: 14 },
  code: { base: 132, lg: 168 },
  // Concentric with the pane: its radius less the inset between them.
  tileR: { base: 14, lg: 18 },
  r: { base: 26, lg: 34 },
  gap: { base: 11, lg: 15 },
  domain: { base: 11, lg: 13 },
  domainLine: { base: 14, lg: 17 },
  inset: { base: 4, lg: 6 },
  chip: { base: 26, lg: 34 },
  foot: { base: 13, lg: 18 },
} as const;

const PLATE_TILE = sum(PLATE.code, PLATE.tilePad, PLATE.tilePad);
const PLATE_W = sum(PLATE_TILE, PLATE.pad, PLATE.pad);
const PLATE_H = sum(
  PLATE.pad,
  PLATE_TILE,
  PLATE.gap,
  PLATE.domainLine,
  LINE,
  PLATE.foot,
);
/** The axis, from the pane's foot: the middle of its two-line address. */
const PLATE_AXIS: Pair = {
  base: PLATE.foot.base + (PLATE.domainLine.base + LINE.base) / 2,
  lg: PLATE.foot.lg + (PLATE.domainLine.lg + LINE.lg) / 2,
};

/**
 * THE PLATE. A pane of the product's one glass (`.glass`: Crystal, the glass
 * board's pick) is legitimate exactly here, where a photograph is the
 * ground: the album is born behind it on the axis and seen through it, so the
 * pane is never a bland white card, it is lit by whichever party stands. The
 * code sits on its own white tile inside the pane (dark modules on white, the
 * presets' one rule) with two and a half modules of quiet zone; the address
 * reads under it in two lines, the domain over the slug the way the shipped
 * card sets it, with the arrow in its own round well beside them.
 *
 * ★ THE CODE SWITCHES ON, NEVER RISES. While the next address is typed the
 * tile goes dark to the pane's own glass, its eyes with it; as the address
 * lands the tile lights white and the new code blooms out of its party's
 * picture (`code.tsx`). One silhouette for every address: nothing about the
 * object moves but the light in it.
 */
function PlateObject({ live }: { live: ObjectLive }) {
  const { party, lifted, still, up } = live;
  return (
    <span
      aria-hidden
      data-hero-object=""
      data-df-object="plate"
      data-df-lifted={lifted ? "" : undefined}
      className="relative block"
      style={{
        width: at(PLATE_W),
        height: at(PLATE_H),
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-pane=""
        className="absolute inset-0 block glass"
        style={{
          borderRadius: at(PLATE.r),
          boxShadow: lifted
            ? `inset 0 1px 0 0 rgb(255 255 255 / 0.34), inset 0 0 0 1px rgb(255 255 255 / 0.14), ${PAPER.lifted}`
            : `inset 0 1px 0 0 rgb(255 255 255 / 0.28), inset 0 0 0 1px rgb(255 255 255 / 0.1), ${PAPER.rest}`,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      />
      {still ? null : (
        // The light the pane catches as a new code switches on: one sweep
        // across the glass and the tile, once a landing.
        <span
          key={party.slug}
          aria-hidden
          data-df-sheen=""
          className="pointer-events-none absolute inset-0 z-10 block overflow-hidden"
          style={{ borderRadius: at(PLATE.r) }}
        />
      )}
      <span className="absolute flex flex-col" style={{ inset: at(PLATE.pad) }}>
        <span
          data-df-tile=""
          data-df-lit={up ? "" : undefined}
          className="block shrink-0"
          style={{
            padding: at(PLATE.tilePad),
            borderRadius: at(PLATE.tileR),
          }}
        >
          <LiveCode
            slug={party.slug}
            photo={party.cover}
            motion={!still}
            style={{ width: at(PLATE.code), height: at(PLATE.code) }}
          />
        </span>
        <span
          className="flex items-center"
          style={{
            marginTop: at(PLATE.gap),
            paddingLeft: at(PLATE.inset),
            gap: len(6, 8),
          }}
        >
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span
              data-df-domain=""
              className="text-white/55"
              style={{
                fontSize: at(PLATE.domain),
                lineHeight: at(PLATE.domainLine),
              }}
            >
              {DOMAIN}
            </span>
            <span
              data-df-line=""
              className="flex items-center whitespace-nowrap"
              style={{ fontSize: at(FONT), lineHeight: at(LINE) }}
            >
              <span
                data-df-typed=""
                data-df-own={party.slug}
                className="font-semibold tracking-[-0.01em] text-white"
              >
                {party.slug}
              </span>
              <Caret night />
            </span>
          </span>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full transition-colors",
              lifted ? "bg-white/22" : "bg-white/12",
            )}
            style={{
              width: at(PLATE.chip),
              height: at(PLATE.chip),
              fontSize: at(FONT),
              transitionDuration: `${LIFT_MS}ms`,
            }}
          >
            <Arrow lifted={lifted} night />
          </span>
        </span>
      </span>
    </span>
  );
}

/* ── card: a mini event card over a minimal link ──────────────────────── */

const CARD = {
  w: { base: 176, lg: 236 },
  inset: { base: 7, lg: 9 },
  coverH: { base: 118, lg: 160 },
  r: { base: 22, lg: 29 },
  coverR: { base: 15, lg: 20 },
  padX: { base: 10, lg: 14 },
  padTop: { base: 10, lg: 13 },
  title: { base: 18, lg: 24 },
  titleLine: { base: 22, lg: 29 },
  meta: { base: 11, lg: 13 },
  metaLine: { base: 15, lg: 18 },
  rowGap: { base: 9, lg: 12 },
  face: { base: 20, lg: 26 },
  /** The code in the card's corner: a picture of the party's own code. */
  code: { base: 26, lg: 34 },
  foot: { base: 11, lg: 14 },
  /** The card's foot to the link's line, on the night. */
  linkGap: { base: 14, lg: 18 },
} as const;

const CARD_H = sum(
  CARD.inset,
  CARD.coverH,
  CARD.padTop,
  CARD.titleLine,
  CARD.metaLine,
  CARD.rowGap,
  CARD.face,
  CARD.foot,
);

/** How many faces a card shows before its count. */
const FACES = 4;

/**
 * One party's cover, laid over the last: a new party's fades in over the old
 * one with a breath of scale, so the card turns to its new event as one
 * gesture rather than blinking.
 */
function Covers({
  parties,
  party,
  still,
}: {
  parties: readonly Party[];
  party: Party;
  still: boolean;
}) {
  return (
    <>
      {parties.map((p) => {
        const on = p.slug === party.slug;
        return (
          <Image
            key={p.slug}
            data-df-cover={on ? p.cover : undefined}
            src={marketingImage(p.cover).src}
            alt=""
            fill
            unoptimized
            className="object-cover"
            style={{
              opacity: on ? 1 : 0,
              transform: on ? "scale(1)" : "scale(1.06)",
              transition: still
                ? "none"
                : on
                  ? "opacity 520ms var(--ease-emphasis), transform 900ms var(--ease-emphasis)"
                  : "opacity 380ms ease-in 140ms, transform 520ms ease-in 140ms",
            }}
          />
        );
      })}
    </>
  );
}

/**
 * THE CARD. White paper, as the shipped card is on the cinema ground, the
 * party's cover inset at its head like a print, then what an invitation says
 * in the fewest words: its name (in the loud face, typed along with the
 * address, since the address IS the host's name for it), its day and how
 * many came, and the first faces in. Under it, on the night, the link in
 * white at the settled size: minimal, the card above it the thing to look at.
 *
 * ★ THE EVENT COMES INTO FOCUS AS ITS LINK LANDS. While an address is typed,
 * its name types on the card and the rest of the card (the cover, the day,
 * the faces) goes soft, out of focus, the last party's still; as the address
 * lands the new party's cover sharpens in over it and its lines arrive.
 */
function CardObject({
  live,
  parties,
}: {
  live: ObjectLive;
  parties: readonly Party[];
}) {
  const { party, addresses, lifted, still, up } = live;
  const faces = facesOf(party, FACES);
  const rest = party.guests - faces.length;
  const meta = (
    <span
      key={party.slug}
      data-df-meta=""
      data-df-swap={still ? undefined : ""}
      className="block truncate text-muted-foreground tabular-nums"
      style={{ fontSize: at(CARD.meta), lineHeight: at(CARD.metaLine) }}
    >
      {party.when} · {party.guests} guests
    </span>
  );
  return (
    <span
      aria-hidden
      data-hero-object=""
      data-df-object="card"
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col items-center"
      style={{
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-card=""
        data-df-up={up ? "" : undefined}
        className="surface-paper relative block bg-white text-foreground"
        style={{
          width: at(CARD.w),
          height: at(CARD_H),
          borderRadius: at(CARD.r),
          boxShadow: lifted ? PAPER.lifted : PAPER.rest,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <span
          className="absolute block overflow-hidden bg-muted"
          style={{
            left: at(CARD.inset),
            right: at(CARD.inset),
            top: at(CARD.inset),
            height: at(CARD.coverH),
            borderRadius: at(CARD.coverR),
          }}
        >
          <span data-df-covers="" className="absolute inset-0 block">
            <Covers parties={parties} party={party} still={still} />
          </span>
        </span>
        <span
          className="absolute inset-x-0 bottom-0 flex flex-col text-left"
          style={{
            top: `calc(${at(CARD.inset)} + ${at(CARD.coverH)})`,
            paddingTop: at(CARD.padTop),
            paddingInline: at(CARD.padX),
          }}
        >
          <span
            className="flex items-center font-heading tracking-[-0.015em] whitespace-nowrap"
            style={{ fontSize: at(CARD.title), lineHeight: at(CARD.titleLine) }}
          >
            <span data-df-title="">{titleOf(party.slug)}</span>
          </span>
          {/* The dimming rides a wrapper: a line's arrival is an animation,
              whose fill would outrank a dim set on the line itself. */}
          <span data-df-dims="" className="block">
            {meta}
            <span
              key={`faces-${party.slug}`}
              data-df-swap={still ? undefined : ""}
              className="flex items-center"
              style={{ marginTop: at(CARD.rowGap), animationDelay: "60ms" }}
            >
              {faces.map((f, i) => (
                <Avatar
                  key={f.name}
                  size="sm"
                  seed={f.seed}
                  className="ring-2 ring-white"
                  style={{
                    width: at(CARD.face),
                    height: at(CARD.face),
                    marginLeft: i === 0 ? 0 : len(-6, -8),
                    zIndex: FACES - i,
                  }}
                >
                  <AvatarFallback
                    className="font-semibold"
                    style={{ fontSize: len(8, 10) }}
                  >
                    {f.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              ))}
              <span
                className="font-semibold text-muted-foreground tabular-nums"
                style={{
                  fontSize: len(10, 12),
                  marginLeft: len(5, 7),
                }}
              >
                +{rest}
              </span>
              {/* Its code in the corner, as an invitation prints one: a
                picture at this size, the card being the thing to press. */}
              <span
                className="ml-auto block"
                style={{ width: at(CARD.code), height: at(CARD.code) }}
              >
                <LiveCode
                  slug={party.slug}
                  photo={party.cover}
                  motion={!still}
                  style={{ width: "100%", height: "100%" }}
                />
              </span>
            </span>
          </span>
        </span>
      </span>
      <span
        className="flex items-center"
        style={{ marginTop: at(CARD.linkGap), height: at(LINE) }}
      >
        <LinkLine
          slug={party.slug}
          addresses={addresses}
          night
          lifted={lifted}
        />
      </span>
    </span>
  );
}

/* ── field: the link, yours to type ───────────────────────────────────── */

const FIELD = {
  h: { base: 52, lg: 64 },
  padL: { base: 6, lg: 8 },
  chipEdge: { base: 40, lg: 48 },
  chipPad: { base: 3, lg: 4 },
  chipR: { base: 12, lg: 15 },
  gap: { base: 10, lg: 14 },
  go: { base: 40, lg: 48 },
  padR: { base: 6, lg: 8 },
} as const;

export type FieldHands = {
  /** The visitor's own address, or null while the field is the demo's. */
  readonly mine: string | null;
  readonly take: () => void;
  readonly type: (value: string) => void;
  /** Land what they typed now (Enter), rather than after their pause. */
  readonly land: () => void;
  readonly release: () => void;
  readonly inputRef: RefObject<HTMLInputElement | null>;
};

/**
 * THE FIELD. The link as a real field on paper: its code a small picture at
 * its head (a picture at this size, not a scan: the field is the thing to
 * press), the address typing itself until a visitor takes it, and the arrow
 * in its round dark well at its end. Pressed, the field is theirs: a real
 * input after the domain, their code redrawn as they pause, their album
 * leaving it; the arrow opens the demo while the field is the demo's and
 * starts their own party with their link once they have typed.
 */
function FieldObject({
  live,
  hands,
}: {
  live: ObjectLive;
  hands?: FieldHands;
}) {
  const { party, addresses, lifted, still } = live;
  const mine = hands?.mine ?? null;
  const theirs = mine !== null && mine.length > 0;
  // The well is the arrow while the field is the demo's, and grows into the
  // field's own Start once the visitor has typed a party of theirs.
  const chip = (
    <span
      data-df-go={theirs ? "start" : "demo"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap text-white transition-colors",
        lifted || theirs ? "bg-foreground" : "bg-foreground/85",
      )}
      style={{
        minWidth: at(FIELD.go),
        height: at(FIELD.go),
        paddingInline: theirs ? len(14, 18) : 0,
        gap: len(4, 6),
        fontSize: theirs ? len(13, 15) : at(FONT),
        transitionDuration: `${LIFT_MS}ms`,
      }}
    >
      {theirs ? "Start" : null}
      <Arrow lifted={lifted || theirs} night />
    </span>
  );
  return (
    <span
      data-hero-object=""
      data-df-object="field"
      data-df-mine={mine === null ? undefined : mine}
      data-df-lifted={lifted ? "" : undefined}
      className="relative block"
      style={{
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-field=""
        className="surface-paper relative flex items-center rounded-full bg-white text-foreground"
        style={{
          height: at(FIELD.h),
          paddingLeft: at(FIELD.padL),
          paddingRight: at(FIELD.padR),
          gap: at(FIELD.gap),
          boxShadow:
            mine !== null
              ? `0 0 0 3px rgb(255 255 255 / 0.22), ${PAPER.lifted}`
              : lifted
                ? PAPER.lifted
                : PAPER.rest,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <span
          aria-hidden
          className="block shrink-0 bg-white ring-1 ring-black/10"
          style={{
            width: at(FIELD.chipEdge),
            height: at(FIELD.chipEdge),
            padding: at(FIELD.chipPad),
            borderRadius: at(FIELD.chipR),
          }}
        >
          <LiveCode
            slug={party.slug}
            photo={party.cover}
            motion={!still}
            style={{ width: "100%", height: "100%" }}
          />
        </span>
        {mine === null ? (
          <button
            type="button"
            data-df-claim=""
            aria-label="Type your own party's link"
            onClick={hands?.take}
            className="relative flex min-w-0 flex-1 cursor-text items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            <span aria-hidden className="flex">
              <LinkLine
                slug={party.slug}
                addresses={addresses}
                night={false}
                lifted={false}
                arrow={false}
              />
            </span>
          </button>
        ) : (
          <label
            className="relative flex min-w-0 flex-1 items-center whitespace-nowrap"
            style={{ fontSize: at(FONT), lineHeight: at(LINE) }}
          >
            {/* The sizers, as the typed line has them: the field keeps the
                width the demo's addresses gave it while it is theirs. */}
            <span aria-hidden className="invisible flex">
              <LinkLine
                slug={party.slug}
                addresses={addresses}
                night={false}
                lifted={false}
                arrow={false}
              />
            </span>
            <span className="absolute inset-0 flex items-center">
              <span data-df-domain="" className="text-faint">
                {DOMAIN}
              </span>
              <Input
                ref={hands?.inputRef}
                data-df-input=""
                aria-label="Your party's link"
                value={mine}
                placeholder="your-party"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                maxLength={TYPED_MAX}
                enterKeyHint="go"
                inputMode="url"
                onChange={(e) => hands?.type(typedSlugOf(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") hands?.land();
                  if (e.key === "Escape") hands?.release();
                }}
                onBlur={() => {
                  if (!mine) hands?.release();
                }}
                // The product's field, unframed: it is the address's own line,
                // so it wears the line's size and weight and no box of its own.
                className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 font-semibold tracking-[-0.01em] text-foreground caret-foreground shadow-none placeholder:font-normal placeholder:text-faint focus-visible:ring-0 md:text-[length:inherit] dark:bg-transparent"
                style={{ fontSize: "inherit", lineHeight: "inherit" }}
              />
            </span>
          </label>
        )}
        <a
          href={theirs ? `/login?link=${encodeURIComponent(mine)}` : "/demo"}
          aria-label={theirs ? `Start ${DOMAIN}${mine}` : "Open the live demo"}
          className="ml-auto rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {chip}
        </a>
      </span>
      {/* What the field is, said once a pointer finds it: it types itself,
          so a visitor may not guess it is theirs to type. */}
      <span
        aria-hidden
        data-df-hint=""
        className="pointer-events-none absolute inset-x-0 top-full flex justify-center text-white/65"
        style={{
          marginTop: len(10, 12),
          fontSize: len(12, 13),
          opacity: lifted && mine === null ? 1 : 0,
          transform: lifted && mine === null ? "none" : "translateY(-3px)",
          transition: `opacity ${LIFT_MS}ms var(--ease-emphasis), transform ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        Press to type your own party
      </span>
    </span>
  );
}

/* ── door: every link a door to its party ─────────────────────────────── */

const DOOR = {
  w: { base: 124, lg: 176 },
  h: { base: 188, lg: 268 },
  r: { base: 16, lg: 22 },
  /** The door's foot to the link on its threshold. */
  linkGap: { base: 22, lg: 30 },
} as const;

/** The album seen through an open door: its first four photographs. */
const throughOf = (party: Party) =>
  party.pours.slice(0, 4).map((p) => marketingImage(p.photo).src);

/**
 * THE DOOR (a new hero of the lane's own). Production's doorway, the door
 * every guest meets (his `family=doorway`, "a big win for our design
 * assets"), stood on the home's axis at a hero's size: the party's own light
 * in its room, its album seen through the open leaf, and the link on its
 * threshold. Each address is its own party's door: it swings to while the
 * next is typed, its light a line under it, and opens on the new party's
 * light and album as it lands, the album leaving through it.
 */
function DoorObject({ live }: { live: ObjectLive }) {
  const { party, addresses, lifted, up } = live;
  return (
    <span
      aria-hidden
      data-hero-object=""
      data-df-object="door"
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col items-center"
      style={{
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-doorway=""
        className="block"
        style={
          {
            "--df-way-w": at(DOOR.w),
            "--df-way-h": at(DOOR.h),
            "--df-way-r": at(DOOR.r),
          } as CSSProperties
        }
      >
        <Doorway
          state={up ? "open" : "shut"}
          hues={party.hues}
          photos={throughOf(party)}
        />
      </span>
      <span
        className="flex items-center"
        style={{ marginTop: at(DOOR.linkGap), height: at(LINE) }}
      >
        <LinkLine
          slug={party.slug}
          addresses={addresses}
          night
          lifted={lifted}
        />
      </span>
    </span>
  );
}

/* ── the stands ───────────────────────────────────────────────────────── */

/** The air every object keeps over the headline, at least. */
const AIR = { base: 40, lg: 64 } as const;

/** The card and its link: the card's box, the gap and the link's line. */
const CARD_BOX = sum(CARD_H, CARD.linkGap, LINE);

export const STANDS: Record<TakeId, { base: Stand; lg: Stand }> = {
  // Through the address, under the code, as his round two note put the
  // code over the input: the album is born behind the pane's glass there and
  // seen through it as it leaves, the lit code standing over the stream.
  plate: {
    base: { box: PLATE_H.base, axis: PLATE_AXIS.base, air: AIR.base },
    lg: { box: PLATE_H.lg, axis: PLATE_AXIS.lg, air: AIR.lg },
  },
  // Behind the card's cover: the link under the card stands on the night
  // below the stream's reach (the caption measures its clearance).
  card: {
    base: {
      box: CARD_BOX.base,
      axis: CARD_BOX.base - CARD.inset.base - CARD.coverH.base / 2,
      air: AIR.base,
    },
    lg: {
      box: CARD_BOX.lg,
      axis: CARD_BOX.lg - CARD.inset.lg - CARD.coverH.lg / 2,
      air: AIR.lg,
    },
  },
  // Through the door's lower third: the album leaves past its frame, and the
  // link on its threshold stands on the night below the stream's reach.
  door: {
    base: {
      box: DOOR.h.base + DOOR.linkGap.base + LINE.base,
      axis: DOOR.linkGap.base + LINE.base + DOOR.h.base * 0.36,
      air: AIR.base,
    },
    lg: {
      box: DOOR.h.lg + DOOR.linkGap.lg + LINE.lg,
      axis: DOOR.linkGap.lg + LINE.lg + DOOR.h.lg * 0.36,
      air: AIR.lg,
    },
  },
  // Through the field's middle, as the shipped card's axis runs.
  field: {
    base: { box: FIELD.h.base, axis: FIELD.h.base / 2, air: AIR.base },
    lg: { box: FIELD.h.lg, axis: FIELD.h.lg / 2, air: AIR.lg },
  },
};

export function HeroObject({
  take,
  live,
  parties,
  hands,
}: {
  take: TakeId;
  live: ObjectLive;
  parties: readonly Party[];
  /** The field's visitor, where the hero hands it one. */
  hands?: FieldHands;
}) {
  if (take === "plate") return <PlateObject live={live} />;
  if (take === "card") return <CardObject live={live} parties={parties} />;
  if (take === "door") return <DoorObject live={live} />;
  return <FieldObject live={live} hands={hands} />;
}
