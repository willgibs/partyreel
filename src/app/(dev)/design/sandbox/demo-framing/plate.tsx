"use client";

import { Play } from "lucide-react";
import type { CSSProperties } from "react";

import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { DomainDot, LIFT_MS, PrintFace, type TouchId, TypedSlug } from "./card";
import { DOMAIN, type Prints } from "./fixtures";

/**
 * THE ADDRESS ON THE STAGE (`stage=centre`): the home's first screen with the
 * typewriter as its object, the card and its stream moved to the QR code
 * page. The address is set large on the card's own white paper, a line the
 * width of the block under it, and the four prints of the address standing
 * are dealt above it: they lift away as it is erased and the next party's are
 * dealt in, one after another, as it lands. That is the "new, more subtle
 * surrounding motion" his note asked for, and it only ever moves when the
 * address does, so the screen keeps one motion at a time.
 *
 * ★ THE LINE IS FIXED AND THE ADDRESS IS SET FROM ITS LEFT, as an address bar
 * is: a centred address would slide sideways under every key. Its width is
 * the longest address the loop types plus the caret and the touch's mark,
 * measured under every frame (`plateSays`).
 *
 * ★ ONE DRAWING PER END, THE TABLET COMPOSED, as the card is: every length is
 * `base + --hhs-k * (lg - base)`, with the `--hhs-k` the hero's sheet sets.
 */

type PlateGeo = {
  /** The paper's box, corner and padding. */
  w: number;
  h: number;
  radius: number;
  pad: number;
  /** The address's size: the domain and the slug share one line. */
  font: number;
  /** A print, its white border, and how far the four stand over the paper. */
  print: { w: number; h: number; border: number };
  rise: number;
  face: number;
  /** The four prints: `x` from the paper's centre, turned `r` degrees, `y` down from the box's top. */
  fan: readonly { x: number; r: number; y: number }[];
};

const PLATE: Record<"base" | "lg", PlateGeo> = {
  base: {
    w: 343,
    h: 54,
    radius: 14,
    pad: 16,
    font: 17,
    print: { w: 60, h: 75, border: 3 },
    rise: 64,
    face: 16,
    fan: [
      { x: -102, r: -11, y: 12 },
      { x: -36, r: -3, y: 0 },
      { x: 32, r: 4, y: 3 },
      { x: 100, r: 12, y: 14 },
    ],
  },
  lg: {
    w: 600,
    h: 84,
    radius: 20,
    pad: 28,
    font: 32,
    print: { w: 108, h: 135, border: 4 },
    rise: 116,
    face: 27,
    fan: [
      { x: -186, r: -11, y: 18 },
      { x: -66, r: -3, y: 0 },
      { x: 60, r: 4, y: 5 },
      { x: 182, r: 12, y: 22 },
    ],
  },
};

/** One length at every geometry, as the hero's `--hhs-k` picks it. */
function len(pick: (o: PlateGeo) => number): string {
  const base = pick(PLATE.base);
  const lg = pick(PLATE.lg);
  if (base === lg) return `${base}px`;
  return `calc(${base}px + var(--hhs-k) * ${+(lg - base).toFixed(3)}px)`;
}

/** The lamp's box for the plate: wider than the card's, as what it lights is. */
export const PLATE_LAMP = { w: "min(1040px, 190vw)", h: 560 };

const PAPER_SHADOW =
  "0 10px 20px -6px oklch(0 0 0 / 0.45), 0 22px 44px -10px oklch(0 0 0 / 0.55)";
const PAPER_SHADOW_LIFTED =
  "0 16px 28px -8px oklch(0 0 0 / 0.5), 0 34px 60px -14px oklch(0 0 0 / 0.6)";

/** The deal's clocks: in slow and one after another, out quick and together. */
const DEAL_IN_MS = 620;
const DEAL_STAGGER_MS = 110;
const LIFT_OUT_MS = 260;

function PlayMark() {
  const edge = len((o) =>
    Math.max(18, (o.print.w - o.print.border * 2) * 0.24),
  );
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
        style={{
          width: `calc(${edge} * 0.46)`,
          height: `calc(${edge} * 0.46)`,
          marginLeft: 1,
        }}
      />
    </span>
  );
}

export function AddressPlate({
  slug,
  prints,
  dealt,
  touch,
  lifted,
  still,
}: {
  /** The demo's own address: what React renders and reduced motion keeps. */
  slug: string;
  /** The standing address's four prints. */
  prints: Prints;
  /** Whether they are out: lifted away while the address changes. */
  dealt: boolean;
  touch: TouchId;
  lifted: boolean;
  still: boolean;
}) {
  const rise = `calc(-1 * (4px + var(--hhs-k) * 2px))`;
  return (
    <span
      aria-hidden
      data-hero-object
      data-df-plate
      data-df-lifted={lifted ? "" : undefined}
      className="relative block"
      style={{
        width: len((o) => o.w),
        height: len((o) => o.rise + o.h),
        transform: lifted ? `translateY(${rise})` : "translateY(0)",
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      {prints.map((p, i) => {
        const r = PLATE.lg.fan[i].r;
        const out = !dealt;
        return (
          <span
            key={i}
            data-df-print
            data-df-dealt={dealt ? "" : undefined}
            className="absolute block bg-white shadow-lift ring-1 ring-black/10"
            style={
              {
                left: len((o) => o.w / 2 + o.fan[i].x - o.print.w / 2),
                top: len((o) => o.fan[i].y),
                width: len((o) => o.print.w),
                height: len((o) => o.print.h),
                borderRadius: 6,
                transformOrigin: "50% 100%",
                opacity: out ? 0 : 1,
                transform: out
                  ? `translateY(-14px) rotate(${r + (r < 0 ? -5 : 5)}deg) scale(0.96)`
                  : lifted
                    ? `translateY(-3px) rotate(${(r * 1.25).toFixed(2)}deg)`
                    : `rotate(${r}deg)`,
                // In slow and one after another, out quick and together: a
                // deal lands as a hand lays prints down, and they leave as one.
                transition: still
                  ? "none"
                  : out
                    ? `opacity ${LIFT_OUT_MS}ms ease-in ${i * 30}ms, transform ${LIFT_OUT_MS}ms ease-in ${i * 30}ms`
                    : `opacity ${DEAL_IN_MS}ms var(--ease-emphasis) ${i * DEAL_STAGGER_MS}ms, transform ${DEAL_IN_MS}ms var(--ease-emphasis) ${i * DEAL_STAGGER_MS}ms`,
              } as CSSProperties
            }
          >
            <span
              className="absolute block"
              style={{ inset: len((o) => o.print.border) }}
            >
              <PrintFace
                print={p}
                face={len((o) => o.face)}
                faceFont={len((o) => Math.round(o.face * 0.42))}
                mark={<PlayMark />}
              />
            </span>
          </span>
        );
      })}
      <span
        className="absolute inset-x-0 bottom-0 block"
        style={{
          borderRadius: len((o) => o.radius),
          boxShadow: lifted ? PAPER_SHADOW_LIFTED : PAPER_SHADOW,
          transition: `box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
        }}
      >
        <span
          data-df-line
          className="surface-paper flex items-center bg-white text-foreground ring-1 ring-black/10"
          style={{
            height: len((o) => o.h),
            paddingInline: len((o) => o.pad),
            borderRadius: len((o) => o.radius),
            fontSize: len((o) => o.font),
            lineHeight: 1.2,
          }}
        >
          {touch === "live" ? (
            <DomainDot
              size={len((o) => o.font * 0.34)}
              gap={len((o) => o.font * 0.42)}
            />
          ) : null}
          <span data-df-domain className="shrink-0 text-faint">
            {DOMAIN}
          </span>
          <span
            data-df-slug
            className="flex min-w-0 flex-1 items-center font-semibold tracking-[-0.01em] text-foreground"
          >
            <TypedSlug
              slug={slug}
              touch={touch}
              caretW={len((o) => (o === PLATE.lg ? 3 : 2))}
              arrowSize={len((o) => o.font * 0.82)}
            />
          </span>
        </span>
      </span>
    </span>
  );
}
