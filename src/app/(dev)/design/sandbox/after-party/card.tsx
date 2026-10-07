"use client";

import type { CSSProperties, ReactNode } from "react";

import { CARD_FOOT } from "@/app/(guest)/e/[token]/card/words";
import { BRAND_HEX } from "@/lib/constants/site";
import { EVENT_CARD_ALT, EVENT_CARD_SIZE } from "@/lib/guest/event-card";
import { formatMediaCount } from "@/lib/format/count";

import {
  ALBUM,
  ALBUM_LIGHT,
  COVER,
  type Moment,
  type Still,
  WEDDING,
} from "./fixtures";

/**
 * THE SHARE CARD, AS THE ROUTE DRAWS IT (`/e/[token]/card/route.tsx`): a
 * 1200 by 630 picture an unfurler fetches once per paste, here drawn in the
 * frame's own DOM in the route's own markup (Satori's subset of HTML and CSS:
 * flex boxes and inline styles, nothing else), so what a frame shows is what
 * the route would paint.
 *
 * ★ ONE FAMILY, BY WHAT THE LINK IS: the album while it takes photos (its
 * foot invites), the album as its keepsake (its foot says look), a password
 * album (its name and nothing of its photographs: the door stands first) and
 * a Private one (the generic card, by its address alone). A photo's own link
 * is that photograph, as today, in every option.
 *
 * ★ PRIVACY IS THE FRAME, NEVER AN OPTION: a card carries photographs only on
 * an album anyone with the link may see whole (an open album an anonymous
 * visitor meets at full access), only what its cover may show (approved, never
 * hidden, held, waiting or a clip), and never a face.
 *
 * ★ STAND-INS: the stills are the marketing photographs (900 wide, so a card's
 * 1200 upscales them a little); the type is the app's sans, where the route's
 * renderer draws its own.
 */

/** How a card is drawn: the four answers of the `card` question. */
export type CardWay = "name" | "cover" | "strip" | "light";

/** Which link the card answers: the album live or kept, a password album, a Private one. */
export type CardOf = "live" | "keepsake" | "password" | "private";

const W = EVENT_CARD_SIZE.width;
const H = EVENT_CARD_SIZE.height;

/** The route's own mark: the aperture on its white tile, then the word. */
function Mark({ size = 64, word = true }: { size?: number; word?: boolean }) {
  const icon = Math.round(size * 0.625);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3125 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: "#fafafa",
        }}
      >
        <svg
          width={icon}
          height={icon}
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
      {word ? (
        <div
          style={{
            fontSize: Math.round(size * 0.53),
            fontWeight: 600,
            color: "#d4d4d8",
          }}
        >
          Partyreel
        </div>
      ) : null}
    </div>
  );
}

/** A photograph covering its box, as the route would draw a presigned preview. */
function Photo({ s, style }: { s: Still; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the card's own markup: Satori draws <img>, never next/image
    <img
      src={s.src}
      alt=""
      style={{
        objectFit: "cover",
        objectPosition: s.focus,
        ...style,
      }}
    />
  );
}

/** The heading the route guards against a pathological name (70 characters). */
const heading = (name: string) =>
  name.length > 70 ? `${name.slice(0, 69)}…` : name;

/** The album's light as a Bloom: its hues as one glow behind the subject, never chips side by side. */
function bloomOf(at = "38% 62%"): string {
  const [a, b, c] = ALBUM_LIGHT;
  const lamp = (h: number, l: number, ch: number, alpha: number) =>
    `oklch(${l} ${ch} ${h} / ${alpha})`;
  return [
    a &&
      `radial-gradient(60% 75% at ${at}, ${lamp(a.h, 0.62, 0.15, 0.9)}, transparent 70%)`,
    b &&
      `radial-gradient(45% 60% at 72% 30%, ${lamp(b.h, 0.55, 0.13, 0.55)}, transparent 72%)`,
    c &&
      `radial-gradient(40% 55% at 18% 18%, ${lamp(c.h, 0.5, 0.1, 0.4)}, transparent 70%)`,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * ONE CARD, AT ITS TRUE SIZE (1200 by 630): the way it is drawn and the link
 * it answers. A gated album never shows a photograph or its light's source,
 * whatever the way: the password album's card names it; the Private one is
 * the generic card.
 */
export function Card({
  way,
  of,
  moment,
}: {
  way: CardWay;
  of: CardOf;
  moment: Moment;
}) {
  const named = of !== "private";
  const name = named ? WEDDING.name : EVENT_CARD_ALT;
  const foot = of === "live" ? CARD_FOOT.add : CARD_FOOT.look;
  const open = of === "live" || of === "keepsake";
  const box: CSSProperties = {
    position: "relative",
    width: W,
    height: H,
    display: "flex",
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
    color: "#fafafa",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  // ★ A GATED ALBUM'S CARD IS TODAY'S, in every way that would carry a photograph: nothing of a closed album leaves it.
  // The light's way alone dresses a password album's card, since its light is no picture (its own option's claim).
  if (way === "name" || (!open && way !== "light") || !named)
    return (
      <div
        data-ap-card={`name-${of}`}
        style={{
          ...box,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 88,
        }}
      >
        <Mark />
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 1000,
          }}
        >
          {heading(name)}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
          {foot}
        </div>
      </div>
    );

  if (way === "cover")
    return (
      <div data-ap-card={`cover-${of}`} style={box}>
        <Photo
          s={COVER}
          style={{ position: "absolute", inset: 0, width: W, height: H }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.42) 42%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.28) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: W,
            height: H,
            padding: "64px 80px 72px",
          }}
        >
          <Mark size={52} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 80,
                fontWeight: 700,
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
                maxWidth: 980,
              }}
            >
              {heading(name)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {foot}
            </div>
          </div>
        </div>
      </div>
    );

  if (way === "strip") {
    const four = [ALBUM[3]!, ALBUM[1]!, ALBUM[6]!, ALBUM[0]!];
    return (
      <div
        data-ap-card={`strip-${of}`}
        style={{ ...box, flexDirection: "column" }}
      >
        <div style={{ display: "flex", gap: 6, height: 360 }}>
          {four.map((s) => (
            <Photo
              key={s.id}
              s={s}
              style={{ width: (W - 18) / 4, height: 360 }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 72px 52px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {heading(name)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
              {`${formatMediaCount(moment.album)} · ${foot.replace(" on Partyreel", "")}`}
            </div>
            <Mark size={40} />
          </div>
        </div>
      </div>
    );
  }

  // The light: the album's own hues as one Bloom behind the name, no photograph.
  return (
    <div
      data-ap-card={`light-${of}`}
      style={{
        ...box,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 88,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: bloomOf(),
        }}
      />
      <div style={{ position: "relative", display: "flex" }}>
        <Mark />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1.04,
          letterSpacing: "-0.02em",
          maxWidth: 1000,
        }}
      >
        {heading(name)}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          fontSize: 30,
          color: "rgba(255,255,255,0.78)",
        }}
      >
        {foot}
      </div>
    </div>
  );
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
    <div style={{ width, height: H * k, overflow: "hidden" }}>
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
