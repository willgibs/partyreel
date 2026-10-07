"use client";

import localFont from "next/font/local";
import type { CSSProperties, ReactNode } from "react";

import { CARD_FOOT } from "@/app/(guest)/e/[token]/card/words";
import {
  HOUSE_LIGHT,
  unOlive,
} from "@/components/app/event-feed/event-hub-head-edge";
import { fitChroma, hex } from "@/lib/avatar/gradient";
import {
  WORDMARK_ASPECT,
  WORDMARK_PATH,
  WORDMARK_VIEWBOX,
} from "@/lib/brand/wordmark";
import { BRAND_HEX } from "@/lib/constants/site";
import { EVENT_CARD_ALT, EVENT_CARD_SIZE } from "@/lib/guest/event-card";

import type { CardWay } from "./answers";
import { ALBUM_LIGHT, COVER_SIX, type Light, WEDDING } from "./fixtures";

/**
 * THE SHARE CARD, IN THE ROUTE'S OWN MARKUP (`/e/[token]/card/route.tsx`): a
 * 1200 by 630 picture an unfurler fetches once per paste, drawn here in the
 * frame's DOM in Satori's subset (flex boxes and inline styles, `display:
 * flex` on every box with more than one child, `<img>` with a src and a size,
 * radial and linear gradients, hex and rgba colours), so the wiring lane ports
 * `CardMarkup` as it stands: the route computes `CardFacts` and hands them in.
 *
 * ★ ONE FAMILY, BY WHAT THE LINK IS (the ROADMAP's line): the album, live or
 * kept, a password album (its name alone: the door stands first) and a Private
 * one (the generic card, by its address alone). A photo's own link is that
 * photograph, as today, in every way (`cards.tsx`).
 *
 * ★ A NEW WAY'S PICTURE NEVER SAYS WHAT TO DO (the creative director's pass,
 * 2026-10-07): the link's own title and line stand right under the picture in
 * every chat and say add or look legibly (`openAlbumWords`), where a line on
 * the card read at 7 to 8 px in a bubble and would have stayed in Sunday's
 * pastes for good ("186", "Add yours"). So the cover, the strip and the light
 * draw the album's name and its picture alone, ONE picture live or kept, with
 * nothing on it to go stale; only today's card keeps its foot (it is today).
 * The wiring follows: their image ignores `?add`, so the page may name the
 * plain address for them, one picture per album at the edge.
 *
 * ★ THE FACTS ARE THE SAME FOR WHOEVER ASKS (`EVENT_CARD_CACHE_CONTROL`: the
 * edge serves an hour's copy to everyone), so `CardFacts` holds only what the
 * album says to nobody in particular: photographs only where an anonymous
 * visitor sees the album whole (an open album at full access), and only what
 * its cover may show (`pickCoverIds`: the reel's opening stills or the newest
 * approved, never hidden, held, waiting or a clip), never a face from the guest
 * row. Everything else gets `photos: []`, and every way then draws a name card
 * (the light's lit by its light, which is no photograph).
 *
 * ★ THE PHOTOGRAPHS ARE CROPPED CENTRED, as the album's cover crops them
 * (`.head-still`: `object-fit: cover`, no position): production keeps no focal
 * point, so a card that set one would draw what the route cannot.
 *
 * ★ TODAY'S CARD IN THE ROUTE'S OWN FACE, THE NEW WAYS' NAME IN ONE OTHER.
 * Satori draws with the fonts it is handed, and `@vercel/og` hands it Geist at
 * 400 alone, so the route paints its "bold" name and its 600 mark in Geist
 * Regular (its PNG, fetched 2026-10-07): the lab loads that very TTF for
 * today's card and for nothing else (`ROUTE_FACE`, handed in as `CardMarkup`'s
 * `face`, which the route never passes). The new ways set one thing
 * in type, the album's name in the heading face as its cover sets it (the
 * wordmark is a path), so the route loads one TTF for them, Urbanist 700
 * (Next 16's `readFile(join(process.cwd(), ...))` recipe, traced into the
 * function), named where `HEADING` names the app's variable.
 *
 * ★ `data-ap-*` IS THE LAB'S, NEVER THE CARD'S: the readers under each frame
 * read what a card carries off these attributes; Satori ignores them, and the
 * route drops them.
 */

export type { CardWay };

/** Which link a card answers, in the board's words: the album live or kept, a password album, a Private one. */
export type CardOf = "live" | "keepsake" | "password" | "private";

/**
 * WHAT THE ROUTE KNOWS WHEN IT DRAWS A CARD, the same for whoever asks: the
 * input the wiring lane computes, read as nobody in particular.
 */
export type CardFacts = {
  /** The album's name, or null for the generic card (a Private, unknown or deleted album: its address alone). */
  name: string | null;
  /** The address carries `?add`: the album takes photos right now (today's foot reads it; no new way draws it). */
  inviting: boolean;
  /** The photographs the card may carry, as presigned previews in the cover's own order; none behind a door. */
  photos: readonly string[];
  /** The album's light (at most three hues, heaviest first), or null where the card may read none. */
  light: Light | null;
};

/** What a card is drawn as once the album's door has had its say: today's name card, the family's, or the way's own. */
export type Drawn = "today" | "named" | "cover" | "strip" | "light";

const W = EVENT_CARD_SIZE.width;
const H = EVENT_CARD_SIZE.height;

/** The room's dark, the card's ground (today's). */
const ROOM = "#0d0d0d";
const WHITE = "#fafafa";
/** The foot's quiet grey and the mark's lighter one (today's). */
const QUIET = "#a1a1aa";
const MARK_GREY = "#d4d4d8";

/**
 * THE NEW WAYS' ONE FACE, the album's name as its cover sets it (the frame
 * carries next/font's variable). ★ THE ROUTE NAMES "Urbanist" HERE once it
 * loads the TTF; until then Satori paints it in Geist Regular.
 */
const HEADING = "var(--font-display), var(--font-sans), sans-serif";

/** The heading the route guards against a pathological name (70 characters). */
const heading = (name: string) =>
  name.length > 70 ? `${name.slice(0, 69)}…` : name;

/** A name's size, stepped down by its length, since Satori never fits text itself: the first step whose length holds it. */
const sizeFor = (name: string, steps: readonly (readonly [number, number])[]) =>
  (steps.find(([upTo]) => name.length <= upTo) ?? steps[steps.length - 1]!)[1];

/* ── the marks ──────────────────────────────────────────────────────────── */

/** Today's mark, the route's own: the aperture on its white tile, then the word (the placeholder the header retired). */
function Tile() {
  return (
    <div
      data-ap-mark="tile"
      style={{ display: "flex", alignItems: "center", gap: 20 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: WHITE,
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke={BRAND_HEX}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
          <line x1="9.69" y1="8" x2="21.17" y2="8" />
          <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
          <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
          <line x1="14.31" y1="16" x2="2.83" y2="16" />
          <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
        </svg>
      </div>
      <div style={{ fontSize: 34, fontWeight: 600, color: MARK_GREY }}>
        Partyreel
      </div>
    </div>
  );
}

/**
 * THE HOUSE'S MARK, SMALL AND QUIET (bible 7: her name first, as little
 * Partyreel as possible): the v1 wordmark alone, from its one path, as the
 * guest header and the site's own card draw it.
 */
function Wordmark({
  height,
  color = MARK_GREY,
  opacity = 1,
}: {
  height: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg
      data-ap-mark="wordmark"
      width={Math.round(height * WORDMARK_ASPECT)}
      height={height}
      viewBox={WORDMARK_VIEWBOX}
      fill={color}
      style={{ opacity }}
    >
      <path d={WORDMARK_PATH} />
    </svg>
  );
}

/** A photograph covering its box, centred, as the route draws a presigned preview. */
function Photo({
  src,
  width,
  height,
  style,
}: {
  src: string;
  width: number;
  height: number;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the card's own markup: Satori draws <img>, never next/image
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      style={{ width, height, objectFit: "cover", ...style }}
    />
  );
}

/* ── the light ──────────────────────────────────────────────────────────── */

const arc = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/**
 * A HUE AS LIGHT IN THE ROOM: the register the album's cover lights its dark
 * in (`.head-light`: L 0.72, C 0.15, "deep on the cover's dark ground so it
 * reads as a lit room rather than a stain"), never olive (`unOlive`), fitted
 * to the screen and written as hex, since Satori reads no `oklch()`. ★ NOT THE
 * SEAM'S: its L 0.82 is a line's register, and a pastel dimmed over the dark
 * reads as beige smoke, never light (the first draw's, measured).
 */
function lampHex(h: number): string {
  return hex(fitChroma({ l: 0.72, c: 0.15, h: unOlive(h) }));
}

/** A hex colour at an alpha, as Satori reads one (#rrggbbaa). */
const at = (color: string, alpha: number) =>
  `${color}${Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0")}`;

/**
 * THE HOUSE EMBER (brand r2's: "the house lamps lit as one glow, amber to
 * coral, never side by side"): the light of a card that may read no album's,
 * the generic one. Its amber and its coral, from the house's own dusk.
 */
const HOUSE_EMBER: Light = [
  { h: HOUSE_LIGHT.hues[1]!, w: 0.6 },
  { h: HOUSE_LIGHT.hues[HOUSE_LIGHT.hues.length - 1]!, w: 0.4 },
];

/**
 * THE HUES A BLOOM CARRIES: the light's heaviest, and the others only where
 * they sit within 60° of it (one family, one light). A hue further off would
 * light as a second lamp beside the first (chips, then a rainbow), so it stays
 * the album's and leaves the card's glow. Maya & Jay's gold keeps its coral
 * (30° off) and leaves its green (78° off).
 */
export function bloomHues(light: Light): number[] {
  const [a, ...rest] = light;
  if (!a) return [];
  const core = unOlive(a.h);
  return [
    core,
    ...rest.map((l) => unOlive(l.h)).filter((h) => arc(core, h) <= 60),
  ];
}

/**
 * ONE BLOOM BEHIND THE NAME (Aperture's light, never paint): one field of
 * the core hue at the name's back, bright across the line it lights and
 * falling off fast to the room's dark (a long dim falloff is what reads as
 * smoke: any light dimmed over the dark goes brown), its family's other hues
 * warming it from inside its bright zone, to either side, never out in the
 * falloff alone. Every stop fades through a half-strength one, so an edge is a
 * fade, never a rim (the house light's way, `.head-light`). Radial gradients
 * alone: Satori draws neither a blur nor a conic.
 */
function bloomOf(hues: readonly number[], x: number, y: number): string {
  const [core, side, other] = hues.map(lampHex);
  if (!core) return "none";
  const field = `radial-gradient(52% 66% at ${x}% ${y}%, ${at(core, 0.8)} 0%, ${at(core, 0.5)} 30%, ${at(core, 0.15)} 58%, ${at(core, 0)} 80%)`;
  const warm = (color: string, dx: number, dy: number, peak: number) =>
    `radial-gradient(20% 30% at ${x + dx}% ${y + dy}%, ${at(color, peak)} 0%, ${at(color, peak * 0.42)} 55%, ${at(color, 0)} 100%)`;
  // The first listed paints on top: the family's warmths over the field.
  return [
    other ? warm(other, -14, 6, 0.3) : null,
    side ? warm(side, 16, -5, 0.4) : null,
    field,
  ]
    .filter(Boolean)
    .join(", ");
}

/* ── the card ───────────────────────────────────────────────────────────── */

/** What a way draws for these facts: a door's album falls back to a name card in every way but the light. */
export function drawnAs(way: CardWay, facts: CardFacts): Drawn {
  if (way === "name") return "today";
  if (way === "light") return "light";
  if (facts.name !== null && way === "cover" && facts.photos.length >= 1)
    return "cover";
  if (facts.name !== null && way === "strip" && facts.photos.length >= 2)
    return "strip";
  return "named";
}

/** The card's own box: the room, at its true size. */
const BOX: CSSProperties = {
  position: "relative",
  width: W,
  height: H,
  display: "flex",
  overflow: "hidden",
  backgroundColor: ROOM,
  color: WHITE,
};

/** The album's name as a new way sets it: the heading face, tight, balanced over its lines. */
const NAME: CSSProperties = {
  display: "flex",
  fontFamily: HEADING,
  fontWeight: 700,
  letterSpacing: "-0.035em",
  textWrap: "balance",
};

/**
 * ONE GRID FOR THE FAMILY: every new card stands its name 64 from the side and
 * its mark 56 from the top, so a door's name card reads as the open album's
 * card with its photographs taken away, edge for edge (today's keeps the
 * route's 88).
 */
const SIDE = 64;
const HEAD = 56;
/** The name's size by its length, one ladder for every card a name stands alone on (the strip's band takes its own). */
const NAME_STEPS = [
  [22, 96],
  [32, 80],
  [70, 64],
] as const;

/**
 * ONE CARD, AT ITS TRUE SIZE (1200 by 630), in the route's markup: how the
 * way draws these facts. Every box a flex box, every colour hex or rgba.
 */
export function CardMarkup({
  way,
  facts,
  face,
}: {
  way: CardWay;
  facts: CardFacts;
  /**
   * The family today's card names where a browser draws it (the lab's
   * `ROUTE_FAMILY`, the route's own TTF). The route passes none: Satori's
   * default face is that very file.
   */
  face?: string;
}) {
  const drawn = drawnAs(way, facts);
  const name = heading(facts.name ?? EVENT_CARD_ALT);
  const lab = {
    "data-ap-card": drawn,
    "data-ap-generic": facts.name === null ? "" : undefined,
  };

  // TODAY'S, THE ROUTE'S MARKUP AS IT STANDS, in the face its PNG paints (the route names no family: Satori's default).
  if (drawn === "today") {
    // The invitation only on a card that names its album (the route's rule): the generic card says nothing of uploads.
    const inviting = facts.name !== null && facts.inviting;
    return (
      <div
        {...lab}
        data-ap-photos={0}
        style={{
          ...BOX,
          // ★ NEVER A KEY SET TO undefined: Satori reads a style's every key and throws on `fontFamily: undefined`
          // (its `.split`), where React drops it; so the route's card carries no fontFamily at all.
          ...(face ? { fontFamily: face } : {}),
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 88,
        }}
      >
        <Tile />
        <div
          data-ap-name=""
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 1000,
          }}
        >
          {name}
        </div>
        <div
          data-ap-foot=""
          style={{ display: "flex", fontSize: 30, color: QUIET }}
        >
          {inviting ? CARD_FOOT.add : CARD_FOOT.look}
        </div>
      </div>
    );
  }

  if (drawn === "cover") {
    const size = sizeFor(name, NAME_STEPS);
    return (
      <div {...lab} data-ap-photos={1} style={BOX}>
        <Photo
          src={facts.photos[0]!}
          width={W}
          height={H}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        {/* The cover's own scrim (`.head-scrim`, its stops): a breath at the top where the header's wordmark stands, the
            weight at the foot where the name does, so white reads over the brightest photograph a guest could take. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            backgroundImage:
              "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 22%), linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 56%, rgba(0,0,0,0.8) 100%)",
          }}
        />
        {/* The wordmark where the guest header stands it on the album's cover: its top left, small. */}
        <div
          style={{
            position: "absolute",
            top: HEAD,
            left: SIDE,
            display: "flex",
          }}
        >
          <Wordmark height={28} color={WHITE} opacity={0.9} />
        </div>
        {/* The name over the cover's foot, alone: its baseline as far from the foot as it stands from the side (its
            line box ends 0.16 em under the baseline, Urbanist's descent at a 1.02 line, measured on the 96 px name). */}
        <div
          data-ap-name=""
          style={{
            ...NAME,
            position: "absolute",
            left: SIDE,
            right: SIDE,
            bottom: SIDE - Math.round(size * 0.16),
            fontSize: size,
            lineHeight: 1.02,
          }}
        >
          {name}
        </div>
      </div>
    );
  }

  if (drawn === "strip") {
    const shown = facts.photos.slice(0, 4);
    const gap = 6;
    // Two thirds of the card the photographs', a third the name's: with no line under it, the pictures take the room.
    const band = 420;
    const tile = (W - gap * (shown.length - 1)) / shown.length;
    const size = sizeFor(name, [
      [26, 72],
      [40, 56],
      [70, 46],
    ]);
    return (
      <div
        {...lab}
        data-ap-photos={shown.length}
        style={{ ...BOX, flexDirection: "column" }}
      >
        <div style={{ display: "flex", gap, height: band }}>
          {shown.map((src, i) => (
            <Photo key={`${i}-${src}`} src={src} width={tile} height={band} />
          ))}
        </div>
        {/* The name on the room's dark under its photographs, and the house's mark quiet at the far end of its line. */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            padding: `0 ${SIDE}px`,
          }}
        >
          <div
            data-ap-name=""
            style={{ ...NAME, fontSize: size, lineHeight: 1.04, maxWidth: 860 }}
          >
            {name}
          </div>
          <div style={{ display: "flex", flexShrink: 0 }}>
            <Wordmark height={28} color={QUIET} />
          </div>
        </div>
      </div>
    );
  }

  // The family's name card, its name alone (a door's album in the cover and the strip), or lit by the album's light
  // in the light's way (the generic card by the house's ember): the mark at its top left, the name across its middle.
  const lit = drawn === "light";
  const hues = lit ? bloomHues(facts.light ?? HOUSE_EMBER) : [];
  const size = sizeFor(name, NAME_STEPS);
  return (
    <div
      {...lab}
      data-ap-photos={0}
      data-ap-light={
        lit
          ? `${facts.light ? "album" : "house"}:${hues.map((h) => Math.round(h)).join(",")}`
          : undefined
      }
      style={{ ...BOX, alignItems: "center", padding: `0 ${SIDE}px` }}
    >
      {lit ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            backgroundImage: bloomOf(hues, 42, 50),
          }}
        />
      ) : null}
      <div
        style={{ position: "absolute", top: HEAD, left: SIDE, display: "flex" }}
      >
        <Wordmark height={28} />
      </div>
      <div
        data-ap-name=""
        style={{
          ...NAME,
          position: "relative",
          fontSize: size,
          lineHeight: 1.04,
          maxWidth: W - SIDE * 2,
        }}
      >
        {name}
      </div>
    </div>
  );
}

/* ── the board's album, as facts ────────────────────────────────────────── */

/**
 * THE FACTS FOR MAYA & JAY'S ALBUM AT A LINK: what the route would read as
 * nobody in particular. An open album carries the cover's six (the reel's
 * opening first); a password album its name and its light (its colours, never
 * its photographs: the light way's own claim); a Private one nothing at all.
 * Nothing here depends on the moment: a new way's card is one picture for the
 * album, live or kept, and today's reads only the address's `?add`.
 */
export function factsOf(of: CardOf): CardFacts {
  const open = of === "live" || of === "keepsake";
  return {
    name: of === "private" ? null : WEDDING.name,
    inviting: of === "live",
    photos: open ? COVER_SIX.map((s) => s.src) : [],
    light: of === "private" ? null : ALBUM_LIGHT,
  };
}

/**
 * TODAY'S FACE, THE ROUTE'S OWN FILE (the lab's alone, never ported): the TTF
 * `@vercel/og` hands Satori by default (Geist at 400, which it names "geist"),
 * loaded from its own path so today's card paints here as the route's PNG
 * does. ★ ONE FACE FOR EVERY WEIGHT (`100 900`): Satori never synthesises a
 * bold, so the route's 700 name and 600 mark paint regular, and a face
 * declared at 400 alone would let the browser fake a bold the PNG never had.
 */
const ROUTE_FACE = localFont({
  src: "../../../../../../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  weight: "100 900",
  display: "block",
  preload: false,
  adjustFontFallback: false,
});

/** The family today's card names in the lab: the frame's reader proves it loaded before a caption names it. */
export const ROUTE_FAMILY = ROUTE_FACE.style.fontFamily;

/** One of the board's cards: the way, and the link it answers, today's in the route's own face. */
export function Card({ way, of }: { way: CardWay; of: CardOf }) {
  return <CardMarkup way={way} facts={factsOf(of)} face={ROUTE_FAMILY} />;
}

/** A card drawn at a width: the true card, scaled (a chat's bubble, the sheet's half size). */
export function CardAt({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const k = width / W;
  return (
    <div
      data-ap-at={width}
      style={{ width, height: H * k, overflow: "hidden" }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
