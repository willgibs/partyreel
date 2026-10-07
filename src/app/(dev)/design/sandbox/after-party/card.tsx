"use client";

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
import { albumCountWords } from "@/lib/export/take-home";
import { EVENT_CARD_ALT, EVENT_CARD_SIZE } from "@/lib/guest/event-card";

import type { CardWay } from "./answers";
import {
  ALBUM_LIGHT,
  COVER_SIX,
  type Light,
  type Moment,
  WEDDING,
} from "./fixtures";

/**
 * THE SHARE CARD, IN THE ROUTE'S OWN MARKUP (`/e/[token]/card/route.tsx`): a
 * 1200 by 630 picture an unfurler fetches once per paste, drawn here in the
 * frame's DOM in Satori's subset (flex boxes and inline styles, `display:
 * flex` on every box with more than one child, `<img>` with a src and a size,
 * radial and linear gradients, hex and rgba colours), so the wiring lane ports
 * `CardMarkup` as it stands: the route computes `CardFacts` and hands them in.
 *
 * ★ ONE FAMILY, BY WHAT THE LINK IS (the ROADMAP's line): the album while it
 * takes photos (its foot invites), the album as its keepsake (its foot says
 * look), a password album (its name and nothing of its photographs: the door
 * stands first) and a Private one (the generic card, by its address alone). A
 * photo's own link is that photograph, as today, in every way (`cards.tsx`).
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
 * ★ TWO FACES, AND THE ROUTE LOADS NEITHER TODAY. Satori draws with the fonts
 * it is handed; `@vercel/og` hands it Geist at 400 alone, so today's card
 * paints its "bold" name in Geist Regular (the route's own PNG, fetched on
 * 2026-10-07). The lab draws the app's two faces instead (`FACE`): Inter for
 * every line, and for the new ways the album's name in the heading face, as
 * its cover sets it. The route draws what this draws once it loads Urbanist
 * 700 and Inter 400 as TTFs (Next 16's `readFile(join(process.cwd(), ...))`
 * recipe, traced into the function), and names them where `FACE` names the
 * app's variables.
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
  /** The address carries `?add`: the album takes photos right now. */
  inviting: boolean;
  /** The photographs the card may carry, as presigned previews in the cover's own order; none behind a door. */
  photos: readonly string[];
  /** The album's light (at most three hues, heaviest first), or null where the card may read none. */
  light: Light | null;
  /** What the album holds, in its own count words ("214 photos & videos"), or null behind a door. */
  count: string | null;
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
 * THE TWO FACES, as the lab names them (the frame carries next/font's
 * variables). ★ THE ROUTE NAMES ITS LOADED FONTS HERE: "Urbanist" and
 * "Inter"; until it loads them, Satori paints both in Geist Regular.
 */
const FACE = {
  heading: "var(--font-display), var(--font-sans), sans-serif",
  text: "var(--font-sans), system-ui, sans-serif",
} as const;

/** The heading the route guards against a pathological name (70 characters). */
const heading = (name: string) =>
  name.length > 70 ? `${name.slice(0, 69)}…` : name;

/** A name's size, stepped down by its length, since Satori never fits text itself: the first step whose length holds it. */
const sizeFor = (name: string, steps: readonly (readonly [number, number])[]) =>
  (steps.find(([upTo]) => name.length <= upTo) ?? steps[steps.length - 1]!)[1];

/**
 * THE FAMILY'S FOOT: crumbs-87's two lines without "on Partyreel", since the
 * new ways carry the wordmark (one Partyreel to a card, never two). words.ts
 * would hold them beside `CARD_FOOT`.
 */
export const FAMILY_FOOT = {
  add: "Add your photos & videos",
  look: "See the photos & videos",
} as const;

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
  fontFamily: FACE.text,
};

/**
 * ONE CARD, AT ITS TRUE SIZE (1200 by 630), in the route's markup: how the
 * way draws these facts. Every box a flex box, every colour hex or rgba.
 */
export function CardMarkup({ way, facts }: { way: CardWay; facts: CardFacts }) {
  const drawn = drawnAs(way, facts);
  const name = heading(facts.name ?? EVENT_CARD_ALT);
  // The invitation only on a card that names its album (the route's rule): the generic card says nothing of uploads.
  const inviting = facts.name !== null && facts.inviting;
  const lab = {
    "data-ap-card": drawn,
    "data-ap-generic": facts.name === null ? "" : undefined,
  };

  if (drawn === "today")
    return (
      <div
        {...lab}
        data-ap-photos={0}
        style={{
          ...BOX,
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

  const foot = inviting ? FAMILY_FOOT.add : FAMILY_FOOT.look;

  if (drawn === "cover") {
    const size = sizeFor(name, [
      [22, 96],
      [32, 80],
      [70, 64],
    ]);
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
          style={{ position: "absolute", top: 56, left: 64, display: "flex" }}
        >
          <Wordmark height={28} color={WHITE} opacity={0.9} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 58,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            data-ap-name=""
            style={{
              display: "flex",
              fontFamily: FACE.heading,
              fontSize: size,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              textWrap: "balance",
              maxWidth: 1040,
            }}
          >
            {name}
          </div>
          <div
            data-ap-foot=""
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: 32,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {foot}
          </div>
        </div>
      </div>
    );
  }

  if (drawn === "strip") {
    const shown = facts.photos.slice(0, 4);
    const gap = 6;
    const band = 392;
    const tile = (W - gap * (shown.length - 1)) / shown.length;
    const size = sizeFor(name, [
      [26, 72],
      [40, 56],
      [70, 46],
    ]);
    // The live strip invites in two words beside the count; the kept one is its count alone.
    const line = facts.count
      ? inviting
        ? `${facts.count} · Add yours`
        : facts.count
      : foot;
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
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div
            data-ap-name=""
            style={{
              display: "flex",
              fontFamily: FACE.heading,
              fontSize: size,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              textWrap: "balance",
              maxWidth: 1072,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
            }}
          >
            <div
              data-ap-foot=""
              data-ap-count={facts.count ?? undefined}
              style={{ display: "flex", fontSize: 36, color: QUIET }}
            >
              {line}
            </div>
            <Wordmark height={24} color={QUIET} />
          </div>
        </div>
      </div>
    );
  }

  // The family's name card, lit by the album's light where the way is the light's (the generic card by the house's).
  const hues = drawn === "light" ? bloomHues(facts.light ?? HOUSE_EMBER) : [];
  const size = sizeFor(name, [
    [24, 88],
    [36, 72],
    [70, 60],
  ]);
  return (
    <div
      {...lab}
      data-ap-photos={0}
      data-ap-light={
        drawn === "light"
          ? `${facts.light ? "album" : "house"}:${hues.map((h) => Math.round(h)).join(",")}`
          : undefined
      }
      style={{
        ...BOX,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 88,
      }}
    >
      {drawn === "light" ? (
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
      <div style={{ position: "relative", display: "flex" }}>
        <Wordmark height={28} />
      </div>
      <div
        data-ap-name=""
        style={{
          position: "relative",
          display: "flex",
          fontFamily: FACE.heading,
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
          textWrap: "balance",
          maxWidth: 1024,
        }}
      >
        {name}
      </div>
      <div
        data-ap-foot=""
        style={{
          position: "relative",
          display: "flex",
          fontSize: 30,
          color: drawn === "light" ? "rgba(255,255,255,0.78)" : QUIET,
        }}
      >
        {foot}
      </div>
    </div>
  );
}

/* ── the board's album, as facts ────────────────────────────────────────── */

/**
 * THE FACTS FOR MAYA & JAY'S ALBUM AT A LINK: what the route would read as
 * nobody in particular. An open album carries the cover's six (the reel's
 * opening first) and its count; a password album its name and its light (its
 * colours, never its photographs: the light way's own claim); a Private one
 * nothing at all.
 */
export function factsOf(of: CardOf, moment: Moment): CardFacts {
  const open = of === "live" || of === "keepsake";
  return {
    name: of === "private" ? null : WEDDING.name,
    inviting: of === "live",
    photos: open ? COVER_SIX.map((s) => s.src) : [],
    light: of === "private" ? null : ALBUM_LIGHT,
    count: open
      ? albumCountWords({
          count: moment.album,
          kinds: { photos: moment.photos, videos: moment.videos },
        })
      : null,
  };
}

/** One of the board's cards: the way, and the link it answers at a moment. */
export function Card({
  way,
  of,
  moment,
}: {
  way: CardWay;
  of: CardOf;
  moment: Moment;
}) {
  return <CardMarkup way={way} facts={factsOf(of, moment)} />;
}

/** A card drawn at a chat's width: the true card, scaled to the bubble. */
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
