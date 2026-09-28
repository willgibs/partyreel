"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  CARD_EVENT,
  CARD_FACES,
  CARD_GUEST_COUNT,
  CARD_GUESTS,
  CARD_STILLS,
  CARD_VALUE,
  CARD_VIDEO,
  CHAT_TITLE,
} from "./fixtures";

/**
 * THE LINK CARD, ROUND TWO: round one's `link` exactly as he picked it, and
 * the branches off it, each keeping what he liked (compact and low, read at a
 * glance, one link with the code as one face of it, the guests and the photos
 * inside it) and pushing ONE idea further.
 *
 * ★ EVERY CARD IS DRAWN AT THREE SIZES. `base` and `lg` are the page's own
 * breakpoint pair, drawn as a CSS pair exactly as `DemoQr` draws today's
 * object (`BySize`), so a frame at 375, 900 and 1440 each wears the size the
 * page would. `tablet` is the size the `tablet` ask's composed geometry would
 * give it, drawn alone: every length `base`'s plus the same `t` of the way to
 * `lg`'s that `tablet.ts` composes the band with (`compose`).
 *
 * ★ PAPER IS LITERAL WHITE, and its words wear `.surface-paper`'s ink. On the
 * cinema ground `bg-card` is near-black, which is today's failure (a dark box
 * with a grey hairline, `event-object.tsx`'s "a border in it is a GAP"). The
 * paper's shadow is the QR door's plate shadow (`.rvr-plate`, the card Will
 * called the first truly beautiful one), carried on a wrapper OUTSIDE the paper
 * subtree, because `.surface-paper` re-declares `--shadow-*` at paper's alphas,
 * which vanish on the room.
 *
 * ★ NOTHING HERE MOVES (the carried `still`). The band is the hero's one
 * motion; his `reel-story` note on two moving things side by side was "the
 * motion in both cancels each other out".
 */

export type Size = "base" | "tablet" | "lg";

/** The same step `tablet.ts` composes the band's middle geometry with. */
const T = (900 - 375) / (1440 - 375);

type Num = number | readonly Num[] | { readonly [k: string]: Num };

/**
 * A card's tablet size, composed from its two drawn ones: every number
 * `base + T * (lg - base)`, rounded as the drawn sizes are set. Structural, so
 * a card's table stays the one place its sizes are written.
 */
function compose<V extends Num>(base: V, lg: V): V {
  if (typeof base === "number")
    return (Math.round((base + T * ((lg as number) - base)) * 10) /
      10) as unknown as V;
  if (Array.isArray(base))
    return base.map((b: Num, i) =>
      compose(b, (lg as readonly Num[])[i]),
    ) as unknown as V;
  const out: Record<string, Num> = {};
  for (const k of Object.keys(base))
    out[k] = compose(
      (base as Record<string, Num>)[k],
      (lg as Record<string, Num>)[k],
    );
  return out as unknown as V;
}

/** A card's three sizes from its two drawn ones. */
function sized<V extends Num>(t: { base: V; lg: V }): Record<Size, V> {
  return { base: t.base, lg: t.lg, tablet: compose(t.base, t.lg) };
}

/**
 * Both breakpoints' drawings at once, one hidden by CSS; or one size alone,
 * when the `tablet` ask names the geometry a frame wears.
 *
 * ★ ONE DISPLAY UTILITY PER BOX, NEVER A PAIR. The lab's utilities compile into
 * a sublayer of production's, so `hidden lg:contents` stays hidden at 1440
 * (the kit's `lab-utility-loses-to-production` trap); a lone `max-lg:hidden`
 * has nothing to lose to.
 */
function BySize({ size, draw }: { size?: Size; draw: (s: Size) => ReactNode }) {
  if (size) return <>{draw(size)}</>;
  return (
    <>
      <div className="lg:hidden">{draw("base")}</div>
      <div className="max-lg:hidden">{draw("lg")}</div>
    </>
  );
}

/** Where every object centres itself: on the slot `hero.tsx` stands it in. */
function Centred({ children }: { children: ReactNode }) {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      {children}
    </span>
  );
}

/**
 * A photograph in its window at the tile radius, filling the box it is given.
 * `marked` puts the album tile's own play mark on the one the album holds as a
 * video, so a card says photos AND videos in the product's own mark rather
 * than in a caption.
 */
function Photo({
  id,
  w,
  h,
  radius,
  marked = false,
}: {
  id: string;
  w: number;
  h: number;
  radius?: number;
  marked?: boolean;
}) {
  const img = marketingImage(id);
  const video = marked && id === CARD_VIDEO;
  return (
    <span
      data-card-photo
      data-card-video={video ? "" : undefined}
      className="relative block shrink-0 overflow-hidden rounded-[var(--radius-tile)]"
      style={{ width: w, height: h, borderRadius: radius }}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={`${Math.ceil(w)}px`}
        className="object-cover"
      />
      {video ? <PlayMark size={Math.round(w * 0.24)} /> : null}
    </span>
  );
}

/**
 * The album tile's play mark (`CornerPlayBadge`'s glass and glyph), sized to
 * the print it sits on. Not in the tile's corner: a print's foot is tucked
 * under the card, so the mark stands in the middle of what SHOWS of it, two
 * fifths down rather than half.
 */
function PlayMark({ size }: { size: number }) {
  const edge = Math.max(18, size);
  return (
    <span
      aria-hidden
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
        style={{ width: edge * 0.46, height: edge * 0.46, marginLeft: 1 }}
      />
    </span>
  );
}

/** The code, drawn: FooterQr's own path at the size a card gives it. */
function Code({ size, className }: { size: number; className?: string }) {
  return (
    <FooterQr
      value={CARD_VALUE}
      size={size}
      className={cn("shrink-0 p-0", className)}
    />
  );
}

/** The code in its hairline tile, as round one set it beside the address. */
function CodeTile({ size }: { size: number }) {
  return (
    <span className="flex shrink-0 overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-black/10">
      <Code size={size} />
    </span>
  );
}

/**
 * One guest's face: the guest list's seeded avatar at any size.
 *
 * ★ THE OVERLAP IN A ROW IS A SHARE OF THE FACE, never the group's fixed 8px:
 * at a card's 18px a fixed overlap hid a third of each face and the initial
 * with it (ROADMAP's `AvatarGroup` line).
 */
function Face({
  seed,
  initial,
  size,
  ring = "ring-white",
  style,
}: {
  seed: string;
  initial: string;
  size: number;
  ring?: string;
  style?: CSSProperties;
}) {
  return (
    <Avatar
      size="sm"
      seed={seed}
      className={cn("ring-2", ring)}
      style={{ width: size, height: size, ...style }}
    >
      <AvatarFallback
        className="font-semibold"
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}

/** Three of the album's guests, the guest list's own collapsed face row. */
function Faces({ size, ring = "ring-white" }: { size: number; ring?: string }) {
  return (
    <AvatarGroup
      aria-hidden
      data-card-faces
      className="space-x-0 *:data-[slot=avatar]:ring-0"
    >
      {CARD_FACES.map((f, i) => (
        <Face
          key={f.seed}
          seed={f.seed}
          initial={f.initial}
          size={size}
          ring={ring}
          style={{ marginLeft: i === 0 ? 0 : -Math.round(size * 0.22) }}
        />
      ))}
    </AvatarGroup>
  );
}

/** The paper's own shadow: the QR door's plate (`.rvr-plate`), see the header. */
const PAPER_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

/** The same two shadows as a filter, for a sheet whose outline is not a box
 *  (the message's tail): a box-shadow would leave the tail unshadowed. */
const PAPER_DROP =
  "drop-shadow(0 6px 7px oklch(0 0 0 / 0.4)) drop-shadow(0 14px 14px oklch(0 0 0 / 0.45))";

/** A sheet of white paper, its shadow outside the paper's token set. */
function Paper({
  radius,
  className,
  style,
  children,
}: {
  radius: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className="block"
      style={{ borderRadius: radius, boxShadow: PAPER_SHADOW }}
    >
      <span
        data-card-surface
        className={cn(
          "surface-paper block bg-white text-foreground ring-1 ring-black/10",
          className,
        )}
        style={{ borderRadius: radius, ...style }}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * The custom address, its two halves set apart: the domain quiet, the slug the
 * host typed in ink, because that is the part a guest reads aloud or types.
 */
function Address({
  domain,
  slug,
  className,
}: {
  domain: number;
  slug: number;
  className?: string;
}) {
  return (
    <span
      data-hero-link
      className={cn("flex min-w-0 flex-col text-left", className)}
    >
      <span
        className="text-muted-foreground"
        style={{ fontSize: domain, lineHeight: `${domain + 4}px` }}
      >
        {CARD_EVENT.domain}
      </span>
      <span
        data-hero-slug
        className="truncate font-semibold tracking-[-0.01em] text-foreground"
        style={{ fontSize: slug, lineHeight: `${slug + 4}px` }}
      >
        {CARD_EVENT.slug}
      </span>
    </span>
  );
}

/** A print: a photograph on white paper standing up out of the card. */
type Print = { x: number; y: number; r: number };

function Prints({
  prints,
  order,
  w,
  h,
  border,
  radius,
  photoRadius = 3,
  width,
  marked,
  faces,
}: {
  prints: readonly Print[];
  /** Which of the album's stills each print shows, by index; in order when left out. */
  order?: readonly number[];
  w: number;
  h: number;
  border: number;
  radius: number;
  photoRadius?: number;
  /** The object's width: `x` is from its centre. */
  width: number;
  /** Whether the one filmed wears its play mark. */
  marked?: boolean;
  /** A guest's face pinned to each print's top corner, at this size. */
  faces?: number;
}) {
  return (
    <>
      {prints.map((f, i) => {
        const id = CARD_STILLS[(order?.[i] ?? i) % CARD_STILLS.length];
        const guest = faces ? CARD_GUESTS[i % CARD_GUESTS.length] : null;
        return (
          <span
            key={`${id}-${i}`}
            className="absolute block bg-white shadow-lift ring-1 ring-black/10"
            style={{
              left: width / 2 + f.x - w / 2,
              top: f.y,
              width: w,
              height: h,
              padding: border,
              borderRadius: radius,
              transform: `rotate(${f.r}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <Photo
              id={id}
              w={w - border * 2}
              h={h - border * 2}
              radius={photoRadius}
              marked={marked}
            />
            {guest && faces ? (
              // Pinned over the print's corner like a name on a print passed
              // round the table: it turns with the print it belongs to.
              <span
                data-card-guest
                className="absolute"
                style={{ left: -faces * 0.3, top: -faces * 0.3 }}
              >
                <Face seed={guest.seed} initial={guest.initial} size={faces} />
              </span>
            ) : null}
          </span>
        );
      })}
    </>
  );
}

/* ── link: round one's link, the reference ──────────────────────────────── */

/**
 * `link` (round one's pick, drawn exactly as he picked it): THE LINK IS THE
 * OBJECT, AND THE ALBUM RISES OUT OF IT. A white card the size of a share chip
 * carrying the link's two faces side by side, the code and the custom address,
 * with the guests at its end and four prints standing up out of its top edge
 * like photographs in a sleeve.
 */
const LINK = sized({
  lg: {
    w: 312,
    h: 80,
    radius: 16,
    code: 58,
    pad: 11,
    domain: 12,
    slug: 18,
    face: 26,
    print: { w: 104, h: 130, border: 4 },
    rise: 98,
    fan: [
      { x: -92, r: -12, y: 16 },
      { x: -33, r: -4, y: 0 },
      { x: 29, r: 5, y: 4 },
      { x: 88, r: 13, y: 20 },
    ],
  },
  base: {
    w: 224,
    h: 60,
    radius: 13,
    code: 42,
    pad: 9,
    domain: 10,
    slug: 14,
    face: 18,
    print: { w: 74, h: 92, border: 3 },
    rise: 70,
    fan: [
      { x: -65, r: -12, y: 12 },
      { x: -23, r: -4, y: 0 },
      { x: 21, r: 5, y: 3 },
      { x: 62, r: 13, y: 14 },
    ],
  },
});

function LinkAt({ size }: { size: Size }) {
  const g = LINK[size];
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h }}
    >
      <Prints
        prints={g.fan}
        w={g.print.w}
        h={g.print.h}
        border={g.print.border}
        radius={6}
        width={g.w}
      />
      <span className="absolute inset-x-0 bottom-0 block">
        <Paper
          radius={g.radius}
          className="flex items-center"
          style={{ height: g.h, padding: g.pad, gap: g.pad + 2 }}
        >
          <CodeTile size={g.code} />
          <Address domain={g.domain} slug={g.slug} className="flex-1" />
          <Faces size={g.face} />
        </Paper>
      </span>
    </span>
  );
}

export function LinkObject({ size }: { size?: Size }) {
  return (
    <Centred>
      <BySize size={size} draw={(s) => <LinkAt size={s} />} />
    </Centred>
  );
}

/* ── guests: every print, the guest who added it ─────────────────────────── */

/**
 * `guests`: THE FACES LEAVE THE CARD'S END AND GO TO THE PHOTOGRAPHS THEY
 * TOOK. Each print wears the guest who added it, pinned to its corner, so
 * "everyone uploads to it" is read off the album itself rather than off a row
 * of faces beside the link; the one a guest filmed wears the album's play
 * mark. The card keeps the link's two faces, and where the faces stood it
 * counts the rest of the guests in.
 */
const GUESTS = sized({
  lg: {
    w: 312,
    h: 80,
    radius: 16,
    code: 58,
    pad: 11,
    domain: 12,
    slug: 18,
    count: 30,
    face: 26,
    print: { w: 104, h: 130, border: 4 },
    rise: 98,
    fan: [
      { x: -92, r: -12, y: 16 },
      { x: -33, r: -4, y: 0 },
      { x: 29, r: 5, y: 4 },
      { x: 88, r: 13, y: 20 },
    ],
  },
  base: {
    w: 224,
    h: 60,
    radius: 13,
    code: 42,
    pad: 9,
    domain: 10,
    slug: 14,
    count: 22,
    face: 19,
    print: { w: 74, h: 92, border: 3 },
    rise: 70,
    fan: [
      { x: -65, r: -12, y: 12 },
      { x: -23, r: -4, y: 0 },
      { x: 21, r: 5, y: 3 },
      { x: 62, r: 13, y: 14 },
    ],
  },
});

function GuestsAt({ size }: { size: Size }) {
  const g = GUESTS[size];
  const rest = CARD_GUEST_COUNT - CARD_GUESTS.length;
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h }}
    >
      <Prints
        prints={g.fan}
        order={[1, 2, 3, 0]}
        w={g.print.w}
        h={g.print.h}
        border={g.print.border}
        radius={6}
        width={g.w}
        marked
        faces={g.face}
      />
      <span className="absolute inset-x-0 bottom-0 block">
        <Paper
          radius={g.radius}
          className="flex items-center"
          style={{ height: g.h, padding: g.pad, gap: g.pad + 2 }}
        >
          <CodeTile size={g.code} />
          <Address domain={g.domain} slug={g.slug} className="flex-1" />
          {/* The rest of the guests, in the guest list's own count chip. */}
          <span
            data-card-count
            className="flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground tabular-nums"
            style={{
              height: g.count,
              minWidth: g.count,
              padding: `0 ${Math.round(g.count * 0.22)}px`,
              fontSize: Math.round(g.count * 0.4),
            }}
          >
            +{rest}
          </span>
        </Paper>
      </span>
    </span>
  );
}

export function GuestsObject({ size }: { size?: Size }) {
  return (
    <Centred>
      <BySize size={size} draw={(s) => <GuestsAt size={s} />} />
    </Centred>
  );
}

/* ── chat: the link as it lands in the group chat ────────────────────────── */

/**
 * `chat`: THE LINK AS IT LANDS IN THE GROUP CHAT (his `reel-story` r3 note:
 * "how easily this is to send a link in a group chat"). The card is the
 * message the host drops in the chat, unfurled in the product's own words
 * (`CHAT_TITLE`, the real unfurl's title) with the code as its picture and the
 * custom address under it; the guests are the chat, in a reaction pill hanging
 * off its foot; the album rises out of the message as it rises out of the
 * link.
 *
 * ★ THE BUBBLE IS WHITE PAPER, NOT A MESSENGER'S BLUE: the chrome carries no
 * hue (design-system.md's identity), and a coloured bubble would be the one
 * coloured thing in a hero whose colour is its photographs. The tail alone
 * says "message". Its shadow is a filter because a box-shadow would leave the
 * tail bare.
 */
const CHAT = sized({
  lg: {
    w: 332,
    h: 82,
    radius: 20,
    code: 56,
    pad: 12,
    title: 15,
    link: 12,
    tail: 20,
    face: 22,
    pill: { h: 30, pad: 4, count: 12 },
    print: { w: 104, h: 130, border: 4 },
    rise: 98,
    fan: [
      { x: -92, r: -12, y: 16 },
      { x: -33, r: -4, y: 0 },
      { x: 29, r: 5, y: 4 },
      { x: 88, r: 13, y: 20 },
    ],
  },
  base: {
    w: 244,
    h: 62,
    radius: 16,
    code: 42,
    pad: 9,
    title: 11.5,
    link: 9.5,
    tail: 15,
    face: 17,
    pill: { h: 23, pad: 3, count: 9.5 },
    print: { w: 74, h: 92, border: 3 },
    rise: 70,
    fan: [
      { x: -65, r: -12, y: 12 },
      { x: -23, r: -4, y: 0 },
      { x: 21, r: 5, y: 3 },
      { x: 62, r: 13, y: 14 },
    ],
  },
});

/**
 * The message's tail: the bubble's own corner drawn out into the curl a sent
 * message wears, in the bubble's white. The box overlaps the bubble by eight
 * of its fourteen units, so the curl leaves the right edge and returns under
 * the foot with no seam; the bubble keeps that corner square for it.
 */
function Tail({ size }: { size: number }) {
  const w = (size * 14) / 18;
  return (
    <svg
      aria-hidden
      width={w}
      height={size}
      viewBox="0 0 14 18"
      className="absolute"
      style={{ right: -(w * 6) / 14, bottom: 0 }}
    >
      <path d="M0 0H8C8 8.5 10 13.5 14 18C8.5 18 3.5 16 0 12.5Z" fill="#fff" />
    </svg>
  );
}

function ChatAt({ size }: { size: Size }) {
  const g = CHAT[size];
  const rest = CARD_GUEST_COUNT - CARD_FACES.length;
  const line = Math.round(g.title * 1.25);
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h + g.pill.h / 2 }}
    >
      <Prints
        prints={g.fan}
        w={g.print.w}
        h={g.print.h}
        border={g.print.border}
        radius={6}
        width={g.w}
      />
      <span
        className="absolute inset-x-0 block"
        style={{ top: g.rise, filter: PAPER_DROP }}
      >
        <span
          data-card-surface
          className="surface-paper relative flex items-center bg-white text-foreground"
          style={{
            height: g.h,
            padding: g.pad,
            gap: g.pad + 1,
            borderRadius: `${g.radius}px ${g.radius}px 0 ${g.radius}px`,
          }}
        >
          <CodeTile size={g.code} />
          <span
            data-hero-link
            className="flex min-w-0 flex-1 flex-col text-left"
          >
            {/* The unfurl's title as a narrow preview sets it: the verb on
                one line, the event's name whole on the next. */}
            <span
              data-chat-title
              className="font-semibold text-foreground"
              style={{ fontSize: g.title, lineHeight: `${line}px` }}
            >
              <span className="block">{CHAT_TITLE.lead}</span>
              <span className="block truncate">{CHAT_TITLE.name}</span>
            </span>
            <span
              className="truncate text-muted-foreground"
              style={{
                fontSize: g.link,
                lineHeight: `${g.link + 4}px`,
                marginTop: Math.round(g.pad / 4),
              }}
            >
              {CARD_EVENT.domain}
              <span data-hero-slug className="font-medium text-foreground">
                {CARD_EVENT.slug}
              </span>
            </span>
          </span>
          <Tail size={g.tail} />
        </span>
      </span>
      {/* The chat, hanging off the message's foot as a reaction does. */}
      <span
        className="absolute flex items-center rounded-full bg-white ring-1 ring-black/10"
        style={{
          left: g.pad + 2,
          top: g.rise + g.h - g.pill.h / 2,
          height: g.pill.h,
          padding: `0 ${g.pill.pad * 2.5}px 0 ${g.pill.pad}px`,
          gap: g.pill.pad * 1.5,
          boxShadow: PAPER_SHADOW,
        }}
      >
        <Faces size={g.face} />
        <span
          className="font-semibold text-muted-foreground tabular-nums"
          style={{ fontSize: g.pill.count }}
        >
          +{rest}
        </span>
      </span>
    </span>
  );
}

export function ChatObject({ size }: { size?: Size }) {
  return (
    <Centred>
      <BySize size={size} draw={(s) => <ChatAt size={s} />} />
    </Centred>
  );
}

/* ── spread: lower still, the whole album fanned along its edge ──────────── */

/**
 * `spread`: LOWER STILL, AND THE WHOLE ALBUM ALONG ITS EDGE. His one reason
 * for the link was that it is low and reads at a glance where everything else
 * stood too tall, so this pushes exactly that: eight smaller prints spread
 * across the card's top edge in one even arc, like a deck fanned on a table,
 * rising little more than half as high. More of the album shows and the object
 * is a quarter shorter than the link (137px against 181 at 1440, measured);
 * each photograph is smaller, which is the cost.
 */
const SPREAD = sized({
  lg: {
    w: 312,
    h: 80,
    radius: 16,
    code: 58,
    pad: 11,
    domain: 12,
    slug: 18,
    face: 26,
    print: { w: 66, h: 84, border: 3 },
    rise: 56,
    arc: { half: 124, turn: 15, drop: 12 },
  },
  base: {
    w: 224,
    h: 60,
    radius: 13,
    code: 42,
    pad: 9,
    domain: 10,
    slug: 14,
    face: 18,
    print: { w: 48, h: 61, border: 2.5 },
    rise: 41,
    arc: { half: 89, turn: 15, drop: 9 },
  },
});

/** Eight prints on one even arc: turned and dropped by how far out they sit. */
function arcOf(a: { half: number; turn: number; drop: number }, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const u = (i / (n - 1)) * 2 - 1;
    return { x: u * a.half, r: u * a.turn, y: a.drop * u * u };
  });
}

function SpreadAt({ size }: { size: Size }) {
  const g = SPREAD[size];
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h }}
    >
      <Prints
        prints={arcOf(g.arc, 8)}
        w={g.print.w}
        h={g.print.h}
        border={g.print.border}
        radius={5}
        photoRadius={2.5}
        width={g.w}
      />
      <span className="absolute inset-x-0 bottom-0 block">
        <Paper
          radius={g.radius}
          className="flex items-center"
          style={{ height: g.h, padding: g.pad, gap: g.pad + 2 }}
        >
          <CodeTile size={g.code} />
          <Address domain={g.domain} slug={g.slug} className="flex-1" />
          <Faces size={g.face} />
        </Paper>
      </span>
    </span>
  );
}

export function SpreadObject({ size }: { size?: Size }) {
  return (
    <Centred>
      <BySize size={size} draw={(s) => <SpreadAt size={s} />} />
    </Centred>
  );
}

/* ── typed: the address leads ────────────────────────────────────────────── */

/**
 * `typed`: THE CUSTOM ADDRESS LEADS, AS IT IS TYPED (his `reel-story` r3 note:
 * "or simply write your custom link for people to copy/type"). The card
 * becomes the one line a host claims and a guest types: the whole address on
 * one line at a size read across a table, the slug in ink with the caret
 * still after it, in a field's rounded shape. The code shrinks to the
 * address's badge at its start, the other face of the same link; the guests
 * stay at its end.
 */
const TYPED = sized({
  lg: {
    w: 396,
    h: 56,
    code: 40,
    pad: 8,
    text: 16,
    face: 24,
    print: { w: 104, h: 130, border: 4 },
    rise: 98,
    fan: [
      { x: -92, r: -12, y: 16 },
      { x: -33, r: -4, y: 0 },
      { x: 29, r: 5, y: 4 },
      { x: 88, r: 13, y: 20 },
    ],
  },
  base: {
    w: 296,
    h: 42,
    code: 30,
    pad: 6,
    text: 12,
    face: 17,
    print: { w: 74, h: 92, border: 3 },
    rise: 70,
    fan: [
      { x: -65, r: -12, y: 12 },
      { x: -23, r: -4, y: 0 },
      { x: 21, r: 5, y: 3 },
      { x: 62, r: 13, y: 14 },
    ],
  },
});

function TypedAt({ size }: { size: Size }) {
  const g = TYPED[size];
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h }}
    >
      <Prints
        prints={g.fan}
        w={g.print.w}
        h={g.print.h}
        border={g.print.border}
        radius={6}
        width={g.w}
      />
      <span className="absolute inset-x-0 bottom-0 block">
        <Paper
          radius={g.h / 2}
          className="flex items-center"
          style={{
            height: g.h,
            padding: `0 ${g.pad * 2}px 0 ${g.pad}px`,
            gap: g.pad * 1.5,
          }}
        >
          {/* The badge's corner is two fifths of its edge, not the pill's
              corner less its inset: that would make it a circle and cut the
              code's finder squares. */}
          <span
            className="flex shrink-0 overflow-hidden ring-1 ring-black/10"
            style={{ borderRadius: Math.round(g.code * 0.4) }}
          >
            <Code size={g.code} />
          </span>
          <span
            data-hero-link
            className="flex min-w-0 flex-1 items-center text-left whitespace-nowrap"
            style={{ fontSize: g.text, lineHeight: `${g.text + 6}px` }}
          >
            <span className="text-muted-foreground">{CARD_EVENT.domain}</span>
            <span
              data-hero-slug
              className="font-semibold tracking-[-0.01em] text-foreground"
            >
              {CARD_EVENT.slug}
            </span>
            {/* The caret, standing still after the slug: a field just typed. */}
            <span
              aria-hidden
              className="ml-px inline-block bg-foreground"
              style={{
                width: Math.max(1.5, g.text / 9),
                height: g.text * 1.15,
              }}
            />
          </span>
          <Faces size={g.face} />
        </Paper>
      </span>
    </span>
  );
}

export function TypedObject({ size }: { size?: Size }) {
  return (
    <Centred>
      <BySize size={size} draw={(s) => <TypedAt size={s} />} />
    </Centred>
  );
}

/* ── the registry the hero reads ─────────────────────────────────────────── */

export type CardId = "link" | "guests" | "chat" | "spread" | "typed";

const each = (f: (s: Size) => number): Record<Size, number> => ({
  base: f("base"),
  tablet: f("tablet"),
  lg: f("lg"),
});

/**
 * Every card, and the height of the box it centres on at each size: the
 * hero's floor needs it (`hero.tsx`, the card never lifts clear of the axis
 * the band is born on).
 */
export const CARDS: Record<
  CardId,
  { Obj: (p: { size?: Size }) => ReactNode; height: Record<Size, number> }
> = {
  link: { Obj: LinkObject, height: each((s) => LINK[s].rise + LINK[s].h) },
  guests: {
    Obj: GuestsObject,
    height: each((s) => GUESTS[s].rise + GUESTS[s].h),
  },
  chat: {
    Obj: ChatObject,
    height: each((s) => CHAT[s].rise + CHAT[s].h + CHAT[s].pill.h / 2),
  },
  spread: {
    Obj: SpreadObject,
    height: each((s) => SPREAD[s].rise + SPREAD[s].h),
  },
  typed: { Obj: TypedObject, height: each((s) => TYPED[s].rise + TYPED[s].h) },
};
