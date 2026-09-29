"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import {
  FACE_OFFSET,
  LG_MIN,
  OBJECT,
  type ObjectGeo,
  TABLET_MIN,
} from "@/components/marketing/sections/home/hero-stream";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { type CardPrint, DOMAIN } from "./fixtures";

/**
 * A MOCK OF THE LINK CARD, OVER ITS REAL PIECES.
 *
 * Production's `LinkCard` (`sections/home/cinema-hero-card.tsx`) reads one
 * constant, `OBJECT_EVENT` and `OBJECT_PRINTS` in `hero-stream.ts`, so it can
 * only ever draw today's wedding. This is the same card with its content as
 * props: the same geometry (`OBJECT`, every length composed by `--hhs-k` the
 * hero sets, so the one card wears the phone's and the desk's drawings), the
 * same code (`FooterQr`), the same seeded faces (`Avatar`), the same play mark
 * (the house glass), the same paper and shadow. Only the slug, the four prints
 * and the count change, which is everything this board asks about.
 *
 * ★ THE HELPERS ARE RETYPED, NOT IMPORTED: `len`, `inner` and the paper's
 * shadow are private to the production module, and a board never reaches into
 * one. Each is a line, and the wedding frame (today's card, byte for byte in
 * its content) is the check that the retyping holds.
 *
 * ★ THE MARKS ARE THE MEASUREMENT'S: `data-df-slug`, `data-df-domain` and
 * `data-df-rest` are what the caption reads, so a frame says what it prints.
 */

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

const PHOTO_SIZES = `(min-width: ${LG_MIN}px) ${Math.ceil(inner(OBJECT.lg))}px, (min-width: ${TABLET_MIN}px) ${Math.ceil(inner(OBJECT.tablet))}px, ${Math.ceil(inner(OBJECT.base))}px`;

const PAPER_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

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

function Print({ print, i }: { print: CardPrint; i: number }) {
  const img = marketingImage(print.photo);
  const face = len((o) => o.face);
  return (
    <span
      data-df-print
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
          sizes={PHOTO_SIZES}
          loading="eager"
          className="object-cover"
        />
        {print.video ? <PlayMark /> : null}
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
          seed={print.guest.seed}
          className="ring-2 ring-white"
          style={{ width: face, height: face }}
        >
          <AvatarFallback
            className="font-semibold"
            style={{ fontSize: lenRound((o) => o.face * 0.42) }}
          >
            {print.guest.initial}
          </AvatarFallback>
        </Avatar>
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

export function MockLinkCard({
  slug,
  prints,
  rest,
  code,
}: {
  slug: string;
  prints: readonly CardPrint[];
  /** The guests past the four prints, counted in at the card's end. */
  rest: number;
  /** What the code encodes. */
  code: string;
}) {
  return (
    <span
      aria-hidden
      data-hero-object
      className="relative block"
      style={{ width: len((o) => o.w), height: len((o) => o.rise + o.h) }}
    >
      {prints.map((p, i) => (
        <Print key={`${p.photo}-${i}`} print={p} i={i} />
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
          <CodeTile value={code} />
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span
              data-df-domain
              className="text-faint"
              style={{
                fontSize: len((o) => o.domain),
                lineHeight: len((o) => o.domain + 4),
              }}
            >
              {DOMAIN}
            </span>
            <span
              data-df-slug
              className="truncate font-semibold tracking-[-0.01em] text-foreground"
              style={{
                fontSize: len((o) => o.slug),
                lineHeight: len((o) => o.slug + 4),
              }}
            >
              {slug}
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
