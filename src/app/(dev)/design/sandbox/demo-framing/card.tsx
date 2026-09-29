"use client";

import { ArrowUpRight, Play } from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import {
  FACE_OFFSET,
  OBJECT,
  type ObjectGeo,
} from "@/components/marketing/sections/home/hero-stream";
import { LiveDot } from "@/components/marketing/system/demo-modal/demo-door";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { type CardPrint, DOMAIN, type Prints } from "./fixtures";

/**
 * A MOCK OF THE LINK CARD, OVER ITS REAL PIECES.
 *
 * Production's `LinkCard` (`sections/home/cinema-hero-card.tsx`) reads one
 * constant, so it can only ever draw today's `mia-and-theo`. This is the same
 * card with its content as props: the same geometry (`OBJECT`, every length
 * composed by the `--hhs-k` the hero sets, so the one card wears the phone's
 * and the desk's drawings), the same code (`FooterQr`), the same seeded faces,
 * the same play mark, the same paper and shadow. What changes is what this
 * round asks about: the address (still, or typed by the hero's loop), the
 * prints (swapped when the stream pours another party), and the touch that
 * says the card opens.
 *
 * ★ THE HELPERS ARE RETYPED, NOT IMPORTED: `len`, `inner` and the paper's
 * shadow are private to the production module, and a board never reaches into
 * one. Each is a line.
 *
 * ★ THE ADDRESS IS WRITTEN BY THE HERO'S LOOP, NOT BY REACT. React renders the
 * demo's own address once; while a typewriter runs, the loop rewrites that
 * same text node and the caret's opacity every frame, so nothing re-renders
 * per key. React never fights it: the node's value only changes from React's
 * side when the address itself does.
 *
 * ★ THE MARKS ARE THE MEASUREMENT'S: `data-df-slug`, `data-df-typed`,
 * `data-df-domain`, `data-df-rest` and `data-df-touch` are what a caption reads.
 *
 * ★ PHOTOGRAPHS ARE `unoptimized`: the stills are 900-pixel JPEGs of about a
 * hundred kilobytes, and a board drawing twenty frames of them must not queue
 * a hundred resizes on `next dev`'s image optimizer (crumbs-16 watched a
 * doubled set of image asks wedge it). The pixels on screen are the same.
 */

/** The touch that says the card opens (the `touch` decision). */
export type TouchId = "lift" | "arrow" | "live" | "lamp";

/** One length at every geometry, as the hero's `--hhs-k` picks it. */
function len(pick: (o: ObjectGeo) => number): string {
  const base = pick(OBJECT.base);
  const lg = pick(OBJECT.lg);
  if (base === lg) return `${base}px`;
  return `calc(${base}px + var(--hhs-k) * ${+(lg - base).toFixed(3)}px)`;
}

const lenRound = (pick: (o: ObjectGeo) => number) =>
  len((o) => Math.round(pick(o)));

/** The photograph's own window inside a print. */
const inner = (o: ObjectGeo) => o.print.w - o.print.border * 2;

const PAPER_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

/** The paper lifted under a pointer: the same two layers, thrown further. */
const PAPER_SHADOW_LIFTED =
  "0 14px 24px -6px oklch(0 0 0 / 0.5), 0 28px 48px -12px oklch(0 0 0 / 0.6)";

/** The lift's clock: an occasional reply to a pointer, so quick (bible 5). */
export const LIFT_MS = 240;

/** How far the card rises under a pointer: the phone's drawing, then the desk's. */
const RISE = { base: 4, lg: 6 } as const;

export function PlayMark() {
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

/** A print's photograph and the face pinned over its corner: the part that
 *  changes when the party does. `mark` draws the video's play mark. */
export function PrintFace({
  print,
  face,
  faceFont,
  mark,
}: {
  print: CardPrint;
  face: string;
  faceFont: string;
  mark: ReactNode;
}) {
  const img = marketingImage(print.photo);
  return (
    <>
      <span className="relative block size-full overflow-hidden rounded-[3px]">
        <Image src={img.src} alt="" fill unoptimized className="object-cover" />
        {print.video ? mark : null}
      </span>
      <span
        className="absolute"
        style={{
          left: `calc(${face} * ${-FACE_OFFSET})`,
          top: `calc(${face} * ${-FACE_OFFSET})`,
        }}
      >
        <Avatar
          size="sm"
          seed={print.guest.seed}
          className="ring-2 ring-white"
          style={{ width: face, height: face }}
        >
          <AvatarFallback
            className="font-semibold"
            style={{ fontSize: faceFont }}
          >
            {print.guest.initial}
          </AvatarFallback>
        </Avatar>
      </span>
    </>
  );
}

/**
 * A LAYER THAT CROSS-FADES WHEN ITS CONTENT CHANGES (the stream pouring
 * another party, `together`): the new print fades in over the old, and the
 * old leaves once it is covered, so the paper never shows bare. Under reduced
 * motion, or in a paused frame, the swap is instant.
 */
export function Crossfade({
  id,
  ms,
  delay,
  still,
  children,
}: {
  /** What the content is: a change of id is a change of content. */
  id: string;
  ms: number;
  delay: number;
  still: boolean;
  children: ReactNode;
}) {
  const [layers, setLayers] = useState([{ id, node: children }]);
  const [shown, setShown] = useState(id);
  // Derived from the props during render (React's "storing information from
  // previous renders"), so no effect sets state after a commit.
  if (id !== shown) {
    setShown(id);
    setLayers((ls) =>
      still
        ? [{ id, node: children }]
        : [...ls.slice(-1), { id, node: children }],
    );
  }
  return (
    <span className="absolute inset-0 block">
      {layers.map((l, i) => (
        <FadeLayer
          key={l.id}
          arriving={i > 0}
          ms={ms}
          delay={delay}
          onArrived={() => setLayers((ls) => ls.filter((x) => x.id === l.id))}
        >
          {l.node}
        </FadeLayer>
      ))}
    </span>
  );
}

function FadeLayer({
  arriving,
  ms,
  delay,
  onArrived,
  children,
}: {
  arriving: boolean;
  ms: number;
  delay: number;
  onArrived: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const done = useRef(onArrived);
  useLayoutEffect(() => {
    done.current = onArrived;
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !arriving) return;
    const run = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ms,
      delay,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      fill: "backwards",
    });
    run.onfinish = () => done.current();
    return () => run.cancel();
  }, [arriving, ms, delay]);
  return (
    <span ref={ref} className="absolute inset-0 block">
      {children}
    </span>
  );
}

function Print({
  print,
  i,
  lifted,
  still,
}: {
  print: CardPrint;
  i: number;
  lifted: boolean;
  still: boolean;
}) {
  const r = OBJECT.lg.fan[i].r;
  return (
    <span
      data-df-print
      className="absolute block bg-white shadow-lift ring-1 ring-black/10"
      style={{
        left: len((o) => o.w / 2 + o.fan[i].x - o.print.w / 2),
        top: len((o) => o.fan[i].y),
        width: len((o) => o.print.w),
        height: len((o) => o.print.h),
        borderRadius: 6,
        // The fan opens a little under a pointer, as a hand picking a card up
        // spreads what stands in it; staggered so the four do not move as one.
        transform: lifted
          ? `translateY(-3px) rotate(${(r * 1.25).toFixed(2)}deg)`
          : `rotate(${r}deg)`,
        transformOrigin: "50% 100%",
        transition: `transform ${LIFT_MS + 40}ms var(--ease-emphasis) ${i * 18}ms`,
      }}
    >
      <span
        className="absolute block"
        style={{ inset: len((o) => o.print.border) }}
      >
        <Crossfade
          id={`${print.photo}:${print.guest.seed}`}
          ms={520}
          delay={i * 90}
          still={still}
        >
          <PrintFace
            print={print}
            face={len((o) => o.face)}
            faceFont={lenRound((o) => o.face * 0.42)}
            mark={<PlayMark />}
          />
        </Crossfade>
      </span>
    </span>
  );
}

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
 * THE TYPED ADDRESS: the text node the hero's loop rewrites, the caret it
 * fades, and, under `arrow`, the mark that says the address opens. Shared by
 * the card and the stage's address plate, so a typewriter is one thing.
 */
export function TypedSlug({
  slug,
  touch,
  caretW,
  arrowSize,
}: {
  slug: string;
  touch: TouchId;
  caretW: string;
  arrowSize: string;
}) {
  return (
    <>
      {/* `data-df-own` is React's, never the loop's: what a caption reads as the
          demo's own address whatever the typewriter has typed by then. */}
      <span data-df-typed data-df-own={slug} className="min-w-0 truncate">
        {slug}
      </span>
      <span
        data-df-caret
        aria-hidden
        className="shrink-0 self-center rounded-full bg-current"
        style={{
          width: caretW,
          height: "1.05em",
          marginLeft: "0.04em",
          opacity: 0,
        }}
      />
      {touch === "arrow" ? (
        <span data-df-touch="arrow" className="flex shrink-0 self-center">
          <ArrowUpRight
            aria-hidden
            strokeWidth={2.4}
            className="text-muted-foreground"
            style={{
              width: arrowSize,
              height: arrowSize,
              marginLeft: "0.14em",
            }}
          />
        </span>
      ) : null}
    </>
  );
}

/** The live dot, at the address's own size (a phone's domain is 10 px, and
 *  the eyebrow's 8 px dot beside it would shout), `gap` before the words, as
 *  `DemoCtaLink` sets it before its own. */
export function DomainDot({ size, gap }: { size: string; gap: string }) {
  return (
    <span
      data-df-touch="live"
      className="flex shrink-0"
      style={{ "--df-dot": size, marginInlineEnd: gap } as CSSProperties}
    >
      <LiveDot className="size-[var(--df-dot)]" />
    </span>
  );
}

export function MockLinkCard({
  slug,
  prints,
  rest,
  code,
  touch,
  lifted,
  still,
}: {
  /** The demo's own address: what React renders and reduced motion keeps. */
  slug: string;
  prints: Prints;
  /** The guests past the four prints, counted in at the card's end. */
  rest: number;
  /** What the code encodes. */
  code: string;
  touch: TouchId;
  /** Under a pointer (or its focus), or drawn so on purpose. */
  lifted: boolean;
  /** Reduced motion or a paused frame: a swap is instant. */
  still: boolean;
}) {
  return (
    <span
      aria-hidden
      data-hero-object
      data-df-lifted={lifted ? "" : undefined}
      className="relative block"
      style={{
        width: len((o) => o.w),
        height: len((o) => o.rise + o.h),
        transform: lifted
          ? `translateY(calc(-1 * (${RISE.base}px + var(--hhs-k) * ${RISE.lg - RISE.base}px)))`
          : "translateY(0)",
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      {prints.map((p, i) => (
        <Print key={i} print={p} i={i} lifted={lifted} still={still} />
      ))}
      <span
        className="absolute inset-x-0 bottom-0 block"
        style={{
          borderRadius: len((o) => o.radius),
          boxShadow: lifted ? PAPER_SHADOW_LIFTED : PAPER_SHADOW,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
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
          <CodeTile value={code} />
          {/* The live dot stands before the whole address, as it stands
              before the words of every other door to the demo (the eyebrow,
              `DemoCtaLink`): centred on the two lines, so the domain and the
              slug keep one left edge. */}
          <span className="flex min-w-0 flex-1 items-center">
            {touch === "live" ? (
              <DomainDot
                size={len((o) => o.domain * 0.62)}
                gap={len((o) => o.domain * 0.7)}
              />
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span
                data-df-domain
                className="flex items-center text-faint"
                style={{
                  fontSize: len((o) => o.domain),
                  lineHeight: len((o) => o.domain + 4),
                }}
              >
                {DOMAIN}
              </span>
              <span
                data-df-slug
                className="flex min-w-0 items-center font-semibold tracking-[-0.01em] text-foreground"
                style={{
                  fontSize: len((o) => o.slug),
                  lineHeight: len((o) => o.slug + 4),
                }}
              >
                <TypedSlug
                  slug={slug}
                  touch={touch}
                  caretW={len((o) => (o === OBJECT.lg ? 2 : 1.5))}
                  arrowSize={len((o) => o.slug * 0.86)}
                />
              </span>
            </span>
          </span>
          <span
            data-df-rest
            className="flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground tabular-nums"
            style={{
              height: len((o) => o.count),
              minWidth: len((o) => o.count),
              paddingInline: lenRound((o) => o.count * 0.22),
              fontSize: lenRound((o) => o.count * 0.4),
            }}
          >
            +{rest}
          </span>
        </span>
      </span>
    </span>
  );
}
