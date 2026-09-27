"use client";

import { ImageUp } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { CornerPlayBadge } from "@/components/shared/album-tile";
import { DemoFrame } from "@/components/marketing/system/demo-ticket";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  CARD_EVENT,
  CARD_FACES,
  CARD_STILLS,
  CARD_VALUE,
  CARD_VIDEO,
  TODAY_VALUE,
} from "./fixtures";

/**
 * THE HERO'S OBJECT, FOUR WAYS: today's framed photograph, and three compact
 * event cards, each an album with its one link (the custom address and the
 * code as one of its faces, never the whole) and next to no words.
 *
 * ★ EVERY CARD IS DRAWN AT BOTH BREAKPOINTS AS A CSS PAIR, exactly as `DemoQr`
 * draws today's, so a frame at 375 and one at 1440 each wear the size the page
 * would (`ByBp`).
 *
 * ★ PAPER IS LITERAL WHITE, and its words wear `.surface-paper`'s ink. On the
 * cinema ground `bg-card` is near-black, which is today's failure (a dark box
 * with a grey hairline, `event-object.tsx`'s "a border in it is a GAP"). The
 * paper's shadow is the QR door's plate shadow (`.rvr-plate`, the card Will
 * called the first truly beautiful one), carried on a wrapper OUTSIDE the paper
 * subtree, because `.surface-paper` re-declares `--shadow-*` at paper's alphas,
 * which vanish on the room.
 *
 * ★ NOTHING HERE MOVES. The band is the hero's one motion; a card that also
 * moved would be two things fighting for one eye (his river-and-reel note on
 * `reel-story` r2: "the motion in both cancels each other out"). The code does
 * not have to scan any more, so its stillness is compositional now, not
 * functional: the source stands still while the album leaves it.
 */

export type Bp = "base" | "lg";

/**
 * Both breakpoints' drawings at once, one hidden by CSS.
 *
 * ★ ONE DISPLAY UTILITY PER BOX, NEVER A PAIR. The lab's utilities compile into
 * a sublayer of production's, so `hidden lg:contents` stays hidden at 1440
 * (the kit's `lab-utility-loses-to-production` trap); a lone `max-lg:hidden`
 * has nothing to lose to.
 */
function ByBp({ base, lg }: { base: ReactNode; lg: ReactNode }) {
  return (
    <>
      <div className="lg:hidden">{base}</div>
      <div className="max-lg:hidden">{lg}</div>
    </>
  );
}

/**
 * A photograph in its window at the tile radius, filling the box it is given.
 * The one the album holds as a video wears the album tile's own play mark
 * (`CornerPlayBadge`), so a card whose tiles show their foot says photos AND
 * videos in the product's own mark rather than in a caption. The link's
 * prints tuck their foot under the card, where a mark would be hidden, so it
 * marks none.
 */
function Photo({
  id,
  w,
  h,
  radius,
  marked = false,
  className,
  style,
}: {
  id: string;
  w: number;
  h: number;
  radius?: number;
  /** Whether a video here wears its play mark (the card shows tiles' feet). */
  marked?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const img = marketingImage(id);
  const video = marked && id === CARD_VIDEO;
  return (
    <span
      data-card-photo
      data-card-video={video ? "" : undefined}
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-[var(--radius-tile)]",
        className,
      )}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={`${Math.ceil(w)}px`}
        className="object-cover"
      />
      {video ? <CornerPlayBadge /> : null}
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

/**
 * Three of the album's guests, the guest list's own collapsed face row. The
 * overlap is a share of the face, never the group's fixed 8px: at a card's
 * 18px a fixed overlap hid a third of each face and the initial with it.
 */
function Faces({ size, ring }: { size: number; ring: string }) {
  return (
    <AvatarGroup
      aria-hidden
      data-card-faces
      className="space-x-0 *:data-[slot=avatar]:ring-0"
    >
      {CARD_FACES.map((f, i) => (
        <Avatar
          key={f.seed}
          size="sm"
          seed={f.seed}
          className={cn("ring-2", ring)}
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.22),
          }}
        >
          <AvatarFallback
            className="font-semibold"
            style={{ fontSize: Math.round(size * 0.42) }}
          >
            {f.initial}
          </AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}

/**
 * A ROW LAID LIKE THE ALBUM LAYS ONE (`lib/shared/album-rows.ts`'s idea, at a
 * card's size): every photograph at one height, the widths their aspects give,
 * the row filling its width exactly. Whole pixels, the last tile taking the
 * rounding, so no seam opens on a fractional edge.
 */
function justify(aspects: readonly number[], width: number, gap: number) {
  const sum = aspects.reduce((a, b) => a + b, 0);
  const h = Math.round((width - gap * (aspects.length - 1)) / sum);
  const ws = aspects.map((a) => Math.round(a * h));
  const drawn = ws.reduce((a, b) => a + b, 0) + gap * (aspects.length - 1);
  ws[ws.length - 1] += width - drawn;
  return { h, ws };
}

/** The paper's own shadow: the QR door's plate (`.rvr-plate`), see the header. */
const PAPER_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

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

/* ── today ───────────────────────────────────────────────────────────────── */

/** `today`: the shipped `DemoFrame`, centred on the axis as `DemoQr` sets it. */
export function TodayObject() {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      <ByBp
        base={<DemoFrame value={TODAY_VALUE} size="heroCompact" />}
        lg={<DemoFrame value={TODAY_VALUE} size="hero" />}
      />
    </span>
  );
}

/* ── album: the album on a card ──────────────────────────────────────────── */

/**
 * `album`: A SHEET OF PAPER WITH THE ALBUM ON IT. Four photographs laid in two
 * justified rows with the code as the fifth tile (bottom left, standing over
 * the address it is the other face of), and at the foot the custom address
 * and three of the guests who filled it. The card reads top to bottom as the
 * sentence the hero wants: an album, its link, everyone in it.
 */
const ALBUM = {
  lg: {
    w: 288,
    pad: 9,
    gap: 4,
    top: [1.25, 0.8],
    bottom: [1, 1.34, 1],
    foot: { gap: 12, inset: 5, bottom: 11, domain: 12, slug: 17, face: 26 },
  },
  base: {
    w: 200,
    pad: 7,
    gap: 4,
    top: [1.25, 0.8],
    bottom: [1, 1.34, 1],
    foot: { gap: 9, inset: 3, bottom: 8, domain: 10, slug: 13, face: 20 },
  },
} as const;

function AlbumAt({ bp }: { bp: Bp }) {
  const g = ALBUM[bp];
  const inner = g.w - g.pad * 2;
  const top = justify(g.top, inner, g.gap);
  const bottom = justify(g.bottom, inner, g.gap);
  const [a, b, c, d] = CARD_STILLS;
  return (
    // The corner is the tile's plus the padding, so the paper and the
    // photographs read as one shape (design-system.md's nested-corner rule).
    <Paper radius={4 + g.pad} style={{ width: g.w, padding: g.pad }}>
      <span className="flex flex-col" style={{ gap: g.gap }}>
        <span className="flex" style={{ gap: g.gap }}>
          <Photo id={a} w={top.ws[0]} h={top.h} marked />
          <Photo id={b} w={top.ws[1]} h={top.h} marked />
        </span>
        <span className="flex" style={{ gap: g.gap }}>
          <span
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-tile)] bg-white ring-1 ring-black/10 ring-inset"
            style={{ width: bottom.ws[0], height: bottom.h }}
          >
            <Code size={bottom.h - 2} />
          </span>
          <Photo id={c} w={bottom.ws[1]} h={bottom.h} marked />
          <Photo id={d} w={bottom.ws[2]} h={bottom.h} marked />
        </span>
      </span>
      <span
        className="flex items-end justify-between gap-3"
        style={{
          marginTop: g.foot.gap,
          padding: `0 ${g.foot.inset}px ${g.foot.bottom}px`,
        }}
      >
        <Address domain={g.foot.domain} slug={g.foot.slug} />
        <Faces size={g.foot.face} ring="ring-white" />
      </span>
    </Paper>
  );
}

export function AlbumObject() {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      <ByBp base={<AlbumAt bp="base" />} lg={<AlbumAt bp="lg" />} />
    </span>
  );
}

/* ── page: the event's own page, as a guest meets it ─────────────────────── */

/**
 * `page`: THE EVENT'S OWN PAGE, COMPACT, AS A GUEST MEETS IT. Its identity at
 * the head, the way the event page's header stands a live code beside its
 * title (host-app.md, "The header is one object"): the code as the event's
 * badge, the custom address as its name, the guests at the end; then the
 * album; then the one action a guest has, the product's own Add photos. The
 * only card whose words say "everyone uploads to it" as a thing you can do.
 */
const PAGE = {
  lg: {
    w: 288,
    pad: 10,
    gap: 4,
    code: 44,
    domain: 12,
    slug: 17,
    face: 24,
    top: [0.8, 1.25, 0.8],
    bottom: [1.34, 1, 1.34],
    button: { h: 36, text: 13, icon: 16, corner: 0.9 },
  },
  base: {
    w: 200,
    pad: 7,
    gap: 4,
    code: 32,
    domain: 10,
    slug: 13,
    face: 18,
    top: [0.8, 1.25, 0.8],
    bottom: [1.34, 1, 1.34],
    button: { h: 28, text: 11, icon: 13, corner: 0.7 },
  },
} as const;

function PageAt({ bp }: { bp: Bp }) {
  const g = PAGE[bp];
  const inner = g.w - g.pad * 2;
  const top = justify(g.top, inner, g.gap);
  const bottom = justify(g.bottom, inner, g.gap);
  const row = (ids: readonly string[], r: { h: number; ws: number[] }) => (
    <span className="flex" style={{ gap: g.gap }}>
      {ids.map((id, i) => (
        <Photo key={id} id={id} w={r.ws[i]} h={r.h} marked />
      ))}
    </span>
  );
  return (
    <Paper
      radius={4 + g.pad}
      className="flex flex-col"
      style={{ width: g.w, padding: g.pad, gap: g.pad }}
    >
      <span className="flex items-center" style={{ gap: g.pad }}>
        <span className="flex shrink-0 overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-black/10">
          <Code size={g.code} />
        </span>
        <Address domain={g.domain} slug={g.slug} className="flex-1" />
        <Faces size={g.face} ring="ring-white" />
      </span>
      <span className="flex flex-col" style={{ gap: g.gap }}>
        {row([CARD_STILLS[0], CARD_STILLS[1], CARD_STILLS[2]], top)}
        {row([CARD_STILLS[3], CARD_STILLS[4], CARD_STILLS[5]], bottom)}
      </span>
      {/* The guest's one action, in the product's own words and button: ink
          on paper, its corner riding its height (button.tsx's ratio). */}
      <span
        data-card-action
        className="flex items-center justify-center gap-1.5 bg-primary font-medium text-primary-foreground"
        style={{
          height: g.button.h,
          fontSize: g.button.text,
          borderRadius: `calc(var(--radius-action) * ${g.button.corner})`,
        }}
      >
        <ImageUp
          style={{ width: g.button.icon, height: g.button.icon }}
          aria-hidden
        />
        Add photos
      </span>
    </Paper>
  );
}

export function PageObject() {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      <ByBp base={<PageAt bp="base" />} lg={<PageAt bp="lg" />} />
    </span>
  );
}

/* ── link: the link, its album rising out of it ──────────────────────────── */

/**
 * `link`: THE LINK IS THE OBJECT, AND THE ALBUM RISES OUT OF IT. A white card
 * the size of a share chip carrying the link's two faces side by side, the
 * code and the custom address, with the guests at its end and four prints
 * standing up out of its top edge like photographs in a sleeve. The band then
 * reads as the rest of them leaving: one link, and the album pours out of it.
 */
const LINK = {
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
} as const;

function LinkAt({ bp }: { bp: Bp }) {
  const g = LINK[bp];
  return (
    <span
      className="relative block"
      style={{ width: g.w, height: g.rise + g.h }}
    >
      {/* The prints, behind the card: each stands on the card's top edge and
          tucks under it, so none reads as loose on the room. */}
      {g.fan.map((f, i) => (
        <span
          key={CARD_STILLS[i]}
          className="absolute block rounded-[6px] bg-white shadow-lift ring-1 ring-black/10"
          style={{
            left: g.w / 2 + f.x - g.print.w / 2,
            top: f.y,
            width: g.print.w,
            height: g.print.h,
            padding: g.print.border,
            transform: `rotate(${f.r}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          <Photo
            id={CARD_STILLS[i]}
            w={g.print.w - g.print.border * 2}
            h={g.print.h - g.print.border * 2}
            radius={3}
          />
        </span>
      ))}
      <span className="absolute inset-x-0 bottom-0 block">
        <Paper
          radius={g.radius}
          className="flex items-center"
          style={{ height: g.h, padding: g.pad, gap: g.pad + 2 }}
        >
          <span className="flex shrink-0 overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-black/10">
            <Code size={g.code} />
          </span>
          <Address domain={g.domain} slug={g.slug} className="flex-1" />
          <Faces size={g.face} ring="ring-white" />
        </Paper>
      </span>
    </span>
  );
}

export function LinkObject() {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      <ByBp base={<LinkAt bp="base" />} lg={<LinkAt bp="lg" />} />
    </span>
  );
}
