import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

import { HOME_HERO } from "./spec";

/**
 * WHAT THE HOME-HERO CONCEPTS SHARE (round two, 2026-09-14; shrunk onto the lab
 * kit in the Library x Lab migration wave, 2026-09-15).
 *
 * ★ THIS FILE IS NO LONGER WHERE THE BOARD ARGUES. Through round four it
 * carried the contract, the doctrine AND every concept's metadata; the argument
 * now lives in `spec.ts` as data and the presentation lives in the kit
 * (`@/components/lab`). What is left here is the three things the kit cannot
 * know: the hero's own geometry constants, its photograph and QR atoms, and the
 * copy resolver. A piece that belongs to every board belongs in the kit, and a
 * piece that belongs to one concept belongs in that concept's file.
 *
 * ★ AND `Concept` IS NOW `{ id, render }`. A candidate's name, rationale, copy
 * proposal, departures and assets are `spec.ts`'s, because `sandbox/registry.ts`
 * is imported by a SERVER page and by node tests and a `.tsx` module would drag
 * a client tree into both. The engines were not otherwise touched by the wave.
 *
 * ★ THIS FILE IS READ ACROSS LANES. The album-hero board imports `FRAMES`,
 * `CANVAS`, `GUTTER`, `LADDER`, `Mode` and `Photo` from here, so those six are a
 * published surface: shrink them in agreement with that track, never alone.
 *
 * What every concept holds fixed:
 *  - the media at 100% (bible 1): no darkening layer over a photograph;
 *  - the h1 at paint and never gated (bible 13): no data-mkt-cut, no
 *    data-mkt-reveal, no .mkt-line on an h1. marketing-h1-policy scans the
 *    marketing tree and not the lab, so on a board it is discipline rather
 *    than a test, and a hero that fails it here fails it at wiring;
 *  - the ladder (bible 5): LADDER below, resolved per canvas;
 *  - every animation inside `prefers-reduced-motion: no-preference` with a
 *    designed rest state (bible 14), and the loops paused on a hidden tab
 *    through the stage's data-paused;
 *  - cinema and unlit by the standing ruling; light only as a flagged
 *    departure, listed on the candidate in `spec.ts` so it is on the board.
 *
 * Board mechanics a concept must respect:
 *  - `sizes` on next/image is CANVAS-relative ("1440px" / "375px"), never a
 *    vw value: the stage may be zoomed, so a vw picks the wrong candidate;
 *  - `eager` is production truth for anything in the first screen;
 *  - Replay is a REMOUNT (the stage key), so entrances are CSS with
 *    `animation-fill-mode: both` and state resets for free;
 *  - a filling animation and [data-mkt-isolate] never share an element;
 *  - geometry for POSITION comes from CANVAS, never from getBoundingClientRect,
 *    which lies under zoom; a zoom-invariant RATIO off a rect (top / height) is
 *    safe, because the zoom factor cancels;
 *  - tailwind-merge drops a `leading-*` that precedes a `text-{size}` in the
 *    same cn() (a size utility may carry a line-height), and LADDER's classes
 *    are size classes: put the leading AFTER the ladder class, always (it bit
 *    the reel twice);
 *  - the lab's pause source is the kit's useTabHidden (the stage sets
 *    data-paused from it; a JS loop reads the same attribute); production swaps
 *    in useAmbientPause, which also pauses off-screen;
 *  - keyframes live in the concept's OWN sheet with its prefix (hhs-, hhc-,
 *    hhi-); keyframe-uniqueness.test.ts reads every sheet under the lab;
 *  - the media manifest is the only source of paths (bible 18).
 */

/** Mode, CANVAS and useTabHidden are the kit's; re-exported so a concept file
 *  keeps one import and the album-hero lane's imports keep resolving. */
export { CANVAS, useTabHidden, type Mode } from "@/components/lab";
import type { Mode } from "@/components/lab";

export type CopyMode = "ruled" | "proposed";

/** The three concepts the board argues. The burst and the river were killed as
 *  heroes on 2026-09-15 and left for their own boards, which own their ids. */
export type ConceptId = "source" | "scan" | "inflow";

export type ConceptProps = {
  mode: Mode;
  /** Which lockup copy to render: the site thesis or the concept's proposal. */
  copy: CopyMode;
  /** Round two's reel read a text-layer radial; no concept since has needed one
   *  (media at 100%), so the board passes false and shows no toggle. Kept typed
   *  so a variation that wants a flagged scrim can read it. */
  scrim: boolean;
  /** The live demo's guest URL, or null when no demo is configured. */
  qrUrl: string | null;
  /** Bumped by Replay; the stage remounts anyway, this is for keyed loops. */
  runId: number;
};

/** An engine, and nothing else. Everything a reviewer rules on is in spec.ts. */
export type Concept = {
  id: ConceptId;
  render: (p: ConceptProps) => ReactNode;
};

/** The ladder's two cinema steps, RESOLVED per canvas (bible 5): PageHero's
 *  ramps key off the real viewport, never the stage, so a board that shows a
 *  1440 canvas and a 375 canvas on one page resolves each end by hand.
 *  `xl` is text-5xl..text-8xl, `lg` is text-4xl..text-7xl. Retune PageHero's
 *  HERO_SCALE and retune these, or the board stops telling the truth. */
export const LADDER = {
  xl: { desktop: "text-8xl", phone: "text-5xl" },
  lg: { desktop: "text-7xl", phone: "text-4xl text-balance" },
} as const;

/** The site's own gutter at each canvas: Container is max-w-7xl centred with
 *  lg:px-8, so the page column starts at 112px at 1440 and at 16px at 375. */
export const GUTTER = {
  desktop: { left: "pl-28", x: "px-28", inset: 112 },
  phone: { left: "pl-4", x: "px-4", inset: 16 },
} as const;

/** The stand-in frames: the twelve manifest images, sequenced for contrast.
 *  Eleven are landscape and none is wider than 900px; Will's 34-square set
 *  (ASSETS row 2) replaces them by id. The board's stand-ins section renders
 *  this list at the size the corridor reads it, so the ask is visible. */
export const FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

export function frame(i: number) {
  return marketingImage(
    FRAMES[((i % FRAMES.length) + FRAMES.length) % FRAMES.length],
  );
}

/** The site's own lockup: what a concept renders unless its proposal is on. */
export const RULED = {
  h1: SITE_THESIS,
  subhead: SITE_SUBHEAD,
  primary: MARKETING_CTA,
  secondary: "Scan the demo",
} as const;

export type HeroCopy = {
  h1: string;
  subhead: string;
  primary: { label: string; href: string };
  secondary: string;
  proposed: boolean;
};

/**
 * The lockup copy for a concept under the board's Copy control.
 *
 * ★ THE PROPOSAL COMES OUT OF THE SPEC, which is what stops three copies of it
 * drifting. The candidate card, the rendered hero and the Words section all
 * resolve through here, so a line reworded in `spec.ts` is reworded everywhere;
 * before the migration the same strings sat in the concept file and in the
 * board's meta table and had to be edited twice.
 *
 * It takes `{ id }` rather than the whole Concept so an engine can keep calling
 * `copyFor(source, copy)` with its own module-level constant.
 */
export function copyFor(concept: { id: ConceptId }, mode: CopyMode): HeroCopy {
  const ruled: HeroCopy = {
    h1: RULED.h1,
    subhead: RULED.subhead,
    primary: RULED.primary,
    secondary: RULED.secondary,
    proposed: false,
  };
  if (mode !== "proposed") return ruled;
  const proposed = HOME_HERO.candidates.find(
    (c) => c.id === concept.id,
  )?.proposed;
  if (!proposed) return ruled;
  return {
    h1: proposed.h1 ?? ruled.h1,
    subhead: proposed.subhead ?? ruled.subhead,
    primary: RULED.primary,
    secondary: proposed.secondary ?? ruled.secondary,
    proposed: true,
  };
}

/** One photograph at FULL luminance. No scrim prop, and there never will be:
 *  a concept that needs one has not solved the composition. Eager by default,
 *  which is production truth for a hero; pass eager={false} only for a frame
 *  that is genuinely below the viewport. Spread data attributes for your own
 *  sheet's hooks through the rest props. */
export function Photo({
  index,
  className,
  sizes = "1440px",
  eager = true,
  style,
  ...rest
}: Omit<React.ComponentProps<"div">, "children"> & {
  index: number;
  sizes?: string;
  eager?: boolean;
  style?: CSSProperties;
}) {
  const img = frame(index);
  return (
    <div
      {...rest}
      className={cn("relative overflow-hidden bg-white/5", className)}
      style={style}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
    </div>
  );
}

/** The real demo QR, server-renderable and zero-JS (FooterQr's path), on the
 *  white plate scanners need. When no demo is configured it encodes the site
 *  and carries no link, so a concept built around the object still shows it. */
export function DemoQr({
  url,
  size,
  className,
  label = "Scan with your phone, or tap to open the live demo",
}: {
  url: string | null;
  /** Edge length in px, quiet zone included; 96 scans from a laptop screen. */
  size: number;
  className?: string;
  label?: string;
}) {
  const plate = (
    <FooterQr
      value={url ?? "https://partyreel.com"}
      size={size}
      className={className}
    />
  );
  if (!url) return plate;
  return (
    <Link
      href={url}
      aria-label={label}
      className="inline-flex transition-transform duration-150 active:scale-[0.99]"
    >
      {plate}
    </Link>
  );
}
