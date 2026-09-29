import { Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  FACE_OFFSET,
  FRAME_SIZES,
  LG_MIN,
  OBJECT,
  OBJECT_EVENT,
  OBJECT_PRINTS,
  type ObjectGeo,
  STREAM_FRAMES,
  TABLET_MIN,
} from "./hero-stream";

/**
 * THE LINK CARD: the home hero's object (`hero-stream.ts` "The object" says
 * what it is and why; every number it draws is there).
 *
 * ★ ONE CARD IN THE MARKUP, SIZED BY THE SHEET. Every length below is written
 * `calc(base + var(--hhs-k) * (lg - base))`, and the sheet sets `--hhs-k` to 0
 * on a phone, `TABLET_STEP` on a tablet and 1 at a desk, so the one card wears
 * the phone's drawing, the desk's and the composed tablet's between them with
 * no copy per breakpoint: its four photographs are requested once, eagerly,
 * because they are lit on the first paint as the band's resting frames are,
 * and the server's HTML already carries every size, so nothing shifts. While
 * they are the band's own photographs, "once" is the band's request
 * (`printSizes`).
 *
 * ★ PAPER IS LITERAL WHITE, and its words wear `.surface-paper`'s ink. On the
 * cinema ground `bg-card` is near-black, a dark box with a grey hairline. The
 * paper's shadow is carried on a wrapper OUTSIDE the paper subtree, because
 * `.surface-paper` re-declares `--shadow-*` at paper's alphas, which vanish on
 * the room.
 *
 * ★ NOTHING HERE MOVES. The band is the hero's one motion: two moving things
 * side by side cancel each other out.
 *
 * ★ A PICTURE OF AN INVITE, NAMED BY ITS DOOR: the card is `aria-hidden`, and
 * the door that wraps it (`cinema-hero.tsx`) carries the one accessible name,
 * as the retired frame's did.
 */

/** One length of the card at every geometry, as the sheet's `--hhs-k` picks
 *  it: the phone's drawing plus that share of the way to the desk's. */
function len(pick: (o: ObjectGeo) => number): string {
  const base = pick(OBJECT.base);
  const lg = pick(OBJECT.lg);
  if (base === lg) return `${base}px`;
  return `calc(${base}px + var(--hhs-k) * ${+(lg - base).toFixed(3)}px)`;
}

/** The same, for a length the drawings round to a whole pixel at each size. */
function lenRound(pick: (o: ObjectGeo) => number): string {
  return len((o) => Math.round(pick(o)));
}

/** The photograph's own window inside a print, in px, per geometry. */
const inner = (o: ObjectGeo) => o.print.w - o.print.border * 2;

/** What a print's own photograph asks for: its window at each geometry, never a vw. */
const PHOTO_SIZES = `(min-width: ${LG_MIN}px) ${Math.ceil(inner(OBJECT.lg))}px, (min-width: ${TABLET_MIN}px) ${Math.ceil(inner(OBJECT.tablet))}px, ${Math.ceil(inner(OBJECT.base))}px`;

/**
 * ★ A PRINT OF ONE OF THE BAND'S PHOTOGRAPHS ASKS FOR THE BAND'S COPY (build
 * 19's red-team). React's server render preloads every eager image it draws,
 * one preload per srcset and sizes, and Chrome shows a larger candidate of the
 * same srcset when one is already in memory: a print asking for its own small
 * window was preloaded at `w=96` and then drawn from the band's `w=384`, so each
 * load fetched up to four copies nobody saw and logged them as preloaded but
 * not used. Asking the band's sizes makes a print's srcset and sizes the band
 * frame's own: one preload for the two, one file on screen in every browser,
 * and not a byte more than the band already spends. The prints are stand-ins
 * on the band's photographs until ASSETS row 33 gives them their own, and a
 * photograph the band does not carry asks for its own window again, with no
 * edit here.
 */
export function printSizes(photo: string): string {
  return (STREAM_FRAMES as readonly string[]).includes(photo)
    ? FRAME_SIZES
    : PHOTO_SIZES;
}

/** The paper's own shadow (the QR door's plate, `.rvr-plate`), see the header. */
const PAPER_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

/** The rest of the guests, counted in at the card's end. */
const REST = OBJECT_EVENT.guests - OBJECT_PRINTS.length;

/**
 * The album tile's play mark (`CornerPlayBadge`'s glass and glyph), sized to
 * the print it sits on. Not in the tile's corner: a print's foot is tucked
 * under the card, so the mark stands in the middle of what SHOWS of it, two
 * fifths down rather than half.
 */
function PlayMark() {
  const edge = lenRound((o) => Math.max(18, inner(o) * 0.24));
  const glyph = len((o) => Math.max(18, Math.round(inner(o) * 0.24)) * 0.46);
  return (
    <span
      className={cn(
        "pointer-events-none absolute flex items-center justify-center rounded-full",
        GLASS_MARK,
      )}
      style={{
        width: edge,
        height: edge,
        left: "50%",
        top: "40%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <Play
        className={cn("fill-white text-white", GLASS_MARK_LIT)}
        style={{ width: glyph, height: glyph, marginLeft: 1 }}
      />
    </span>
  );
}

/**
 * One print: a photograph on white paper standing up out of the card, turned
 * about its foot, and the face of the guest who added it pinned over its top
 * corner, turning with it, like a name on a print passed round the table.
 */
function Print({ i }: { i: number }) {
  const print = OBJECT_PRINTS[i];
  const img = marketingImage(print.photo);
  const face = len((o) => o.face);
  return (
    <span
      className="absolute block bg-white shadow-lift ring-1 ring-black/10"
      style={{
        left: len((o) => o.w / 2 + o.fan[i].x - o.print.w / 2),
        top: len((o) => o.fan[i].y),
        width: len((o) => o.print.w),
        height: len((o) => o.print.h),
        padding: len((o) => o.print.border),
        borderRadius: 6,
        transform: `rotate(${OBJECT.lg.fan[i].r}deg)`,
        transformOrigin: "50% 100%",
      }}
    >
      <span className="relative block size-full overflow-hidden rounded-[3px]">
        <Image
          src={img.src}
          alt=""
          fill
          sizes={printSizes(print.photo)}
          loading="eager"
          className="object-cover"
        />
        {"video" in print ? <PlayMark /> : null}
      </span>
      <span
        className="absolute"
        style={{
          left: len((o) => -o.face * FACE_OFFSET),
          top: len((o) => -o.face * FACE_OFFSET),
        }}
      >
        <Avatar
          size="sm"
          seed={print.seed}
          className="ring-2 ring-white"
          style={{ width: face, height: face }}
        >
          <AvatarFallback
            className="font-semibold"
            style={{ fontSize: lenRound((o) => o.face * 0.42) }}
          >
            {print.initial}
          </AvatarFallback>
        </Avatar>
      </span>
    </span>
  );
}

/** The code in its hairline tile: FooterQr's path, sized by the sheet
 *  (`.hhs-code svg`), since the svg's own size attribute is a single number. */
function CodeTile({ value }: { value: string }) {
  return (
    <span
      className="hhs-code flex shrink-0 overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-black/10"
      style={{ "--hhs-code": len((o) => o.code) } as CSSProperties}
    >
      <FooterQr value={value} size={OBJECT.lg.code} className="shrink-0 p-0" />
    </span>
  );
}

/**
 * The custom address, its two halves set apart: the domain in the faint step
 * and the slug the host typed in ink, because the slug is the part a guest
 * reads aloud or types, and the domain is the same on every event.
 */
function Address() {
  return (
    <span className="flex min-w-0 flex-1 flex-col text-left">
      <span
        className="text-faint"
        style={{
          fontSize: len((o) => o.domain),
          lineHeight: len((o) => o.domain + 4),
        }}
      >
        {OBJECT_EVENT.domain}
      </span>
      <span
        className="truncate font-semibold tracking-[-0.01em] text-foreground"
        style={{
          fontSize: len((o) => o.slug),
          lineHeight: len((o) => o.slug + 4),
        }}
      >
        {OBJECT_EVENT.slug}
      </span>
    </span>
  );
}

export function LinkCard({ value }: { value: string }) {
  return (
    <span
      aria-hidden
      data-hero-object
      className="relative block"
      style={{ width: len((o) => o.w), height: len((o) => o.rise + o.h) }}
    >
      {OBJECT_PRINTS.map((p, i) => (
        <Print key={p.photo} i={i} />
      ))}
      <span
        className="absolute inset-x-0 bottom-0 block"
        style={{ borderRadius: len((o) => o.radius), boxShadow: PAPER_SHADOW }}
      >
        <span
          className="surface-paper flex items-center bg-white text-foreground ring-1 ring-black/10"
          style={{
            height: len((o) => o.h),
            padding: len((o) => o.pad),
            gap: len((o) => o.pad + 2),
            borderRadius: len((o) => o.radius),
          }}
        >
          <CodeTile value={value} />
          <Address />
          {/* The rest of the guests, in the guest list's own count chip. */}
          <span
            className="flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground tabular-nums"
            style={{
              height: len((o) => o.count),
              minWidth: len((o) => o.count),
              paddingInline: lenRound((o) => o.count * 0.22),
              fontSize: lenRound((o) => o.count * 0.4),
            }}
          >
            +{REST}
          </span>
        </span>
      </span>
    </span>
  );
}
