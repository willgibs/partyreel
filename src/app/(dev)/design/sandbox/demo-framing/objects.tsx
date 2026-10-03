"use client";

import "./demo-framing.css";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { Doorway } from "@/components/guest/door/doorway";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { LiveCode } from "./code";
import { DOMAIN, facesOf, type Party, titleOf } from "./fixtures";

/**
 * THE HERO'S OBJECTS, ROUND FIVE: round four's three strongest, each taken
 * further, standing on the stream's axis.
 *
 *  - `card` (his second direction, recommended): the product's own event card
 *    at a hero's size. The party's photograph fills it, its name is set on the
 *    photograph's own dark foot (the dashboard card's grammar), its faces and
 *    its album's count under the name and its code in the corner; the link
 *    minimal under it, on the night.
 *  - `plate` (his first): the code and its link as one pane of the product's
 *    glass, lit from inside by its party's photograph, the address one line
 *    under the code with its arrow after it.
 *  - `door`: production's doorway at a hero's size, open on its party's cover,
 *    the link lit on its threshold.
 *
 * ★ NOTHING EVER STANDS EMPTY OR SOFT. Round four's weakest parts were each a
 * picture of something loading: the card's cover blurred out of focus while
 * an address typed, the pane's tile gone dark to an empty code, the door shut
 * to a dark slab. Between two parties the card now holds the next party's
 * light with its name typing on it, the code stays whole, and the door stands
 * ajar in the next party's light; as an address lands the photograph develops
 * in, the code is rewritten in a ripple from its heart (`code.tsx`) and the
 * door swings open.
 *
 * ★ THE ADDRESS IS A SIZE DOWN FROM ROUND TWO'S STAGE (settled): 21 px at a
 * desk, 15 at a phone, in every object; the caption reads it off the frame.
 *
 * ★ EVERY LENGTH IS `base + --hhs-k * (lg - base)`: the hero's sheet picks the
 * phone's drawing, the desk's, or the tablet's composed between them, as the
 * shipped card does, so one object in the markup serves three geometries.
 *
 * ★ THE MOTION IS CSS ON STATE THE LOOP SETS ONCE A TURN (`up`, the standing
 * party, the coming one), never a per-frame write, so the browser runs every
 * transition on its own clock; under reduced motion or in a paused frame
 * nothing moves and the object simply stands, whole.
 */

export type TakeId = "card" | "plate" | "door";

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
  /** The address standing: whose photograph, code and album are out. */
  readonly party: Party;
  /**
   * Whose light the object wears: the party whose address is being typed,
   * from the beat on the bare domain, and the standing one otherwise.
   */
  readonly coming: Party;
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
function Arrow({ lifted, night }: { lifted: boolean; night: boolean }) {
  return (
    <span
      data-df-touch="arrow"
      className="flex shrink-0 items-center justify-center"
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
 * THE TYPED LINE, ONE ROW: the domain in the quiet step, the slug in white,
 * the caret, the arrow. Invisible copies of every address the loop types,
 * stacked in one cell, give the line its width, so the object never changes
 * size under a key and no address is ever cut. Centred under a centred
 * object, so it moves half a letter a key while it types.
 */
export function LinkLine({
  slug,
  addresses,
  night,
  lifted,
}: {
  slug: string;
  addresses: readonly string[];
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
      {sizer ? (
        <span style={{ width: len(1.5, 2), marginLeft: "0.04em" }} />
      ) : (
        <Caret night={night} />
      )}
      <span style={{ marginLeft: "0.16em" }} className="flex">
        {sizer ? (
          <span style={{ width: "0.86em" }} />
        ) : (
          <Arrow lifted={lifted} night={night} />
        )}
      </span>
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

/**
 * Every party's photograph, laid in one place, the standing party's on: all
 * of them are drawn so the next is already loaded when its address lands (the
 * wiring loads only the next ahead of its landing; ROADMAP's line). `data-df-on`
 * is what the sheet develops in.
 */
function Photographs({
  parties,
  party,
}: {
  parties: readonly Party[];
  party: Party;
}) {
  return (
    <>
      {parties.map((p) => {
        const on = p.slug === party.slug;
        return (
          <Image
            key={p.slug}
            data-df-cover={on ? p.cover : undefined}
            data-df-on={on ? "" : undefined}
            src={marketingImage(p.cover).src}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        );
      })}
    </>
  );
}

/* ── card: the event card over its link ───────────────────────────────── */

const CARD = {
  w: { base: 192, lg: 232 },
  h: { base: 240, lg: 290 },
  r: { base: 22, lg: 28 },
  padX: { base: 12, lg: 17 },
  padB: { base: 12, lg: 16 },
  title: { base: 21, lg: 28 },
  titleLine: { base: 25, lg: 32 },
  meta: { base: 11, lg: 13 },
  metaLine: { base: 16, lg: 19 },
  rowGap: { base: 6, lg: 8 },
  face: { base: 18, lg: 22 },
  /** The code's white mat in the cover's corner: a picture at this size. */
  chip: { base: 40, lg: 48 },
  chipPad: { base: 4, lg: 5 },
  chipInset: { base: 10, lg: 12 },
  chipR: { base: 10, lg: 13 },
  /** The card's foot to the link's line, on the night. */
  linkGap: { base: 14, lg: 18 },
} as const;

/** How many faces the card shows before the rest are counted in. */
const FACES = 3;

/**
 * A PARTY'S LIGHT, POOLED ON THE CARD: its three hues at the lamp's register,
 * where its photograph will stand, the way a lit room looks before its
 * pictures are hung. It is the colour the lamp behind the card already throws
 * (`lampOf`), so the card and the room agree while a name is typed.
 */
function lightOf(p: Party): string {
  const h = (x: number) => ((x % 360) + 360) % 360;
  const [a, b, c] = p.hues;
  return [
    `radial-gradient(95% 70% at 24% 20%, oklch(0.76 0.14 ${h(a)} / 0.95), transparent 68%)`,
    `radial-gradient(85% 75% at 86% 44%, oklch(0.64 0.17 ${h(b)} / 0.85), transparent 70%)`,
    `radial-gradient(130% 85% at 40% 112%, oklch(0.46 0.16 ${h(c)} / 0.95), transparent 72%)`,
    `oklch(0.2 0.05 ${h(c)})`,
  ].join(", ");
}

/**
 * THE CARD (his second direction, nailed). The product's own event card at a
 * hero's size, portrait like an invitation: the party's photograph fills it,
 * its name sits on the photograph's own dark foot in the loud face (the
 * dashboard card's grammar, `event-card.tsx`), its first faces, the rest of
 * its guests counted in and its photographs under the name, its code on a
 * white mat in the cover's corner. Under it, on
 * the night, the link in white at the settled size: minimal, the card above
 * it the thing to look at. Never a date (round thirteen: nothing depends on a
 * timeline), so an undated party and a weekend read alike.
 *
 * ★ THE CARD IS WRITTEN, THEN DEVELOPED. While an address is erased and the
 * next typed, the card holds a party's light (`lightOf`): the standing one's
 * as its name erases, the arriving one's from the beat on the bare domain,
 * the name typing on it in white, its faces, counts and code gone with the
 * party they belonged to. As the address lands its photograph develops in
 * over the light (from bright and pale to itself), its faces and code arrive,
 * and the album leaves it at lightspeed.
 */
function CardObject({
  live,
  parties,
}: {
  live: ObjectLive;
  parties: readonly Party[];
}) {
  const { party, coming, addresses, lifted, still, up } = live;
  const faces = facesOf(party, FACES);
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
        className="relative block overflow-hidden bg-black"
        style={{
          width: at(CARD.w),
          height: at(CARD.h),
          borderRadius: at(CARD.r),
          boxShadow: lifted ? PAPER.lifted : PAPER.rest,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        {parties.map((p) => (
          <span
            key={p.slug}
            data-df-light={p.slug === coming.slug ? p.slug : undefined}
            className="df-light absolute inset-0 block"
            style={{
              background: lightOf(p),
              opacity: p.slug === coming.slug ? 1 : 0,
            }}
          />
        ))}
        <span data-df-covers="" className="absolute inset-0 block">
          <Photographs parties={parties} party={party} />
        </span>
        {/* The foot's shade, the product card's own: what the name stands on. */}
        <span
          className="pointer-events-none absolute inset-0 block"
          style={{
            background:
              "linear-gradient(to top, rgb(0 0 0 / 0.66) 0%, rgb(0 0 0 / 0.2) 40%, transparent 62%)",
          }}
        />
        <span
          className="pointer-events-none absolute inset-0 block"
          style={{
            borderRadius: at(CARD.r),
            boxShadow:
              "inset 0 0 0 1px rgb(255 255 255 / 0.12), inset 0 1px 0 0 rgb(255 255 255 / 0.2)",
          }}
        />
        <span
          data-df-chip=""
          className="absolute block bg-white"
          style={{
            top: at(CARD.chipInset),
            right: at(CARD.chipInset),
            width: at(CARD.chip),
            height: at(CARD.chip),
            padding: at(CARD.chipPad),
            borderRadius: at(CARD.chipR),
            boxShadow: "0 2px 8px -2px rgb(0 0 0 / 0.4)",
          }}
        >
          <LiveCode
            slug={party.slug}
            photo={party.cover}
            motion={!still}
            style={{ width: "100%", height: "100%" }}
          />
        </span>
        <span
          className="absolute inset-x-0 bottom-0 flex flex-col text-left text-white"
          style={{
            paddingInline: at(CARD.padX),
            paddingBottom: at(CARD.padB),
          }}
        >
          <span
            className="block font-heading whitespace-nowrap"
            style={{
              fontSize: at(CARD.title),
              lineHeight: at(CARD.titleLine),
              letterSpacing: "-0.015em",
              textShadow: "0 1px 14px rgb(0 0 0 / 0.28)",
            }}
          >
            <span data-df-title="">{titleOf(party.slug)}</span>
          </span>
          {/* The fading rides a wrapper: a line's arrival is an animation,
              whose fill would outrank a fade set on the line itself. */}
          <span data-df-dims="" className="block">
            <span
              key={party.slug}
              data-df-meta=""
              data-df-swap={still ? undefined : ""}
              className="flex items-center"
              style={{ marginTop: at(CARD.rowGap), gap: len(6, 8) }}
            >
              <span className="flex shrink-0">
                {faces.map((f, i) => (
                  <Avatar
                    key={f.name}
                    size="sm"
                    seed={f.seed}
                    className="ring-[1.5px] ring-white/85"
                    style={{
                      width: at(CARD.face),
                      height: at(CARD.face),
                      marginLeft: i === 0 ? 0 : len(-5, -7),
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
              </span>
              {/* The rest of its guests counted in after the faces, as the
                  guest list's own chip counts them, then its album. */}
              <span
                className="truncate font-medium text-white/80 tabular-nums"
                style={{
                  fontSize: at(CARD.meta),
                  lineHeight: at(CARD.metaLine),
                }}
              >
                +{party.guests - faces.length} · {party.photos} photos
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

/* ── plate: the code and its link, one pane ───────────────────────────── */

const PLATE = {
  padX: { base: 14, lg: 20 },
  padT: { base: 14, lg: 20 },
  padB: { base: 11, lg: 15 },
  /** The white mat round the code: a little over two modules of quiet zone. */
  matPad: { base: 9, lg: 12 },
  code: { base: 124, lg: 160 },
  // Concentric with the pane: its radius less the inset between them.
  matR: { base: 14, lg: 16 },
  r: { base: 28, lg: 36 },
  gap: { base: 11, lg: 15 },
} as const;

const PLATE_MAT = sum(PLATE.code, PLATE.matPad, PLATE.matPad);
const PLATE_H = sum(PLATE.padT, PLATE_MAT, PLATE.gap, LINE, PLATE.padB);

/**
 * THE PANE (his first direction, nailed). One piece of the product's glass
 * (`.glass`, Crystal) lit from inside by its party's own photograph, far out
 * of focus, so the pane is never a dark box: it is the colour of the party
 * standing, and turns with it. The code stands on its white mat (dark modules
 * on white, the presets' one rule), the party's picture at its heart; under
 * it the address reads as one line, the link it is, with its arrow after it.
 *
 * ★ THE CODE STAYS WHOLE. While the next address is typed the pane holds the
 * party standing, code and light alike, and the typing has the stage; as the
 * address lands the code is rewritten in a ripple from its heart (only the
 * dots that differ turn, ring by ring), the glass is relit by the new party's
 * photograph and one sheen crosses it. One silhouette for every address.
 */
function PlateObject({
  live,
  parties,
}: {
  live: ObjectLive;
  parties: readonly Party[];
}) {
  const { party, addresses, lifted, still } = live;
  return (
    <span
      aria-hidden
      data-hero-object=""
      data-df-object="plate"
      data-df-lifted={lifted ? "" : undefined}
      className="relative flex flex-col items-center"
      style={{
        height: at(PLATE_H),
        paddingInline: at(PLATE.padX),
        paddingTop: at(PLATE.padT),
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <span
        data-df-pane=""
        className="absolute inset-0 block overflow-hidden"
        style={{
          borderRadius: at(PLATE.r),
          boxShadow: lifted ? PAPER.lifted : PAPER.rest,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <span data-df-pane-light="" className="absolute block">
          <Photographs parties={parties} party={party} />
        </span>
        <span
          className="absolute inset-0 block glass"
          style={{ borderRadius: at(PLATE.r) }}
        />
        {still ? null : (
          // The light the pane catches as a new code is written: one sweep
          // across the glass, once a landing.
          <span
            key={party.slug}
            aria-hidden
            data-df-sheen=""
            className="pointer-events-none absolute inset-0 z-10 block overflow-hidden"
          />
        )}
      </span>
      <span
        data-df-tile=""
        className="relative block shrink-0 bg-white"
        style={{
          padding: at(PLATE.matPad),
          borderRadius: at(PLATE.matR),
          boxShadow:
            "0 1px 2px rgb(0 0 0 / 0.22), 0 8px 20px -8px rgb(0 0 0 / 0.5)",
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
        className="relative flex items-center"
        style={{ marginTop: at(PLATE.gap), height: at(LINE) }}
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

/* ── door: every link a door to its party ─────────────────────────────── */

const DOOR = {
  w: { base: 124, lg: 176 },
  h: { base: 188, lg: 268 },
  r: { base: 16, lg: 22 },
  /** The door's foot to the link on its threshold. */
  linkGap: { base: 22, lg: 30 },
} as const;

/**
 * THE DOOR. Production's doorway (his `family=doorway`, "a big win for our
 * design assets"), the door every guest meets, stood on the home's axis at a
 * hero's size: open on its party's light with its cover through the leaf, and
 * the link on its threshold, in the light the doorway throws on the floor.
 *
 * ★ NEVER A DARK SLAB. Round four shut the door while an address typed, which
 * drew a dark panel where the party had been; now it stands AJAR, its light a
 * line round the leaf in the arriving party's hues (the doorway's own resting
 * state), and swings open onto the new party's cover as its address lands.
 * Under a pointer it opens a little wider, the welcome the door is for.
 */
function DoorObject({ live }: { live: ObjectLive }) {
  const { party, coming, addresses, lifted, up } = live;
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
          state={up ? "open" : "ajar"}
          hues={(up ? party : coming).hues}
          photos={[marketingImage(party.cover).src]}
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
const CARD_BOX = sum(CARD.h, CARD.linkGap, LINE);

/** Where the stream is born in the card: its photograph's middle, over the name. */
const CARD_EYE = 0.44;

export const STANDS: Record<TakeId, { base: Stand; lg: Stand }> = {
  // Behind the photograph, over its name: the link under the card stands on
  // the night below the stream's reach (the caption measures the headline).
  card: {
    base: {
      box: CARD_BOX.base,
      axis: CARD_BOX.base - CARD.h.base * CARD_EYE,
      air: AIR.base,
    },
    lg: {
      box: CARD_BOX.lg,
      axis: CARD_BOX.lg - CARD.h.lg * CARD_EYE,
      air: AIR.lg,
    },
  },
  // Through the code's heart, as his round two note had the stream leave the
  // code and its link: the album is born behind the pane and leaves its sides.
  plate: {
    base: {
      box: PLATE_H.base,
      axis: PLATE.padB.base + LINE.base + PLATE.gap.base + PLATE_MAT.base / 2,
      air: AIR.base,
    },
    lg: {
      box: PLATE_H.lg,
      axis: PLATE.padB.lg + LINE.lg + PLATE.gap.lg + PLATE_MAT.lg / 2,
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
};

export function HeroObject({
  take,
  live,
  parties,
}: {
  take: TakeId;
  live: ObjectLive;
  parties: readonly Party[];
}) {
  if (take === "card") return <CardObject live={live} parties={parties} />;
  if (take === "plate") return <PlateObject live={live} parties={parties} />;
  return <DoorObject live={live} />;
}
