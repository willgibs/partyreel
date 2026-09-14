import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import {
  MARKETING_REELS,
  marketingImage,
  type MarketingReel,
} from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

/**
 * THE HOME-HERO BOARD'S CONTRACT (round two, 2026-09-14).
 *
 * Round one asked "where does the type live so no photograph is dimmed" and
 * answered it with four grids. Will's read: bland, generic, the image-grid
 * idiom of ten to twenty years ago, and none of them captured the one thing
 * Partyreel is, the QR that becomes the whole event's album. Round two asks
 * one sharper question, THE HERO IS THE QR BECOMING THE ALBUM, and answers it
 * three ways, one mechanism each, built by three agents in parallel against
 * this file. Everything a concept needs from the board comes through here;
 * a concept file imports nothing from lib/demo or lib/env (the demo URL
 * arrives as a prop), so every concept module stays pure for Vitest.
 *
 * What every concept holds fixed:
 *  - the media at 100% (bible 1): no darkening layer over a photograph; the
 *    one scrim on the board is B's text-layer radial, a toggle, so Will rules
 *    it rather than inherits it;
 *  - the h1 at paint and never gated (bible 13; marketing-h1-policy scans the
 *    lab too): no data-mkt-cut, no data-mkt-reveal, no .mkt-line on an h1;
 *  - the ladder (bible 5): LADDER below, resolved per canvas;
 *  - every animation inside `prefers-reduced-motion: no-preference` with a
 *    designed rest state (bible 14), and the loops paused on a hidden tab
 *    through the stage's data-paused;
 *  - cinema and unlit by the standing ruling; light only as a flagged
 *    departure, listed in `departures` so it is on the board, not buried.
 *
 * Board mechanics a concept must respect:
 *  - `sizes` on next/image is CANVAS-relative ("1440px" / "375px"), never a
 *    vw value: the stage is zoomed, so a vw picks the wrong candidate;
 *  - `eager` is production truth for anything in the first screen;
 *  - Replay is a REMOUNT (the stage key), so entrances are CSS with
 *    `animation-fill-mode: both` and state resets for free;
 *  - a filling animation and [data-mkt-isolate] never share an element;
 *  - geometry for POSITION comes from CANVAS, never from getBoundingClientRect,
 *    which lies under zoom; a zoom-invariant RATIO off a rect (top / height,
 *    the gathering's parallax) is safe, because the zoom factor cancels;
 *  - tailwind-merge drops a `leading-*` that precedes a `text-{size}` in the
 *    same cn() (a size utility may carry a line-height), and LADDER's classes
 *    are size classes: put the leading AFTER the ladder class, always (it bit
 *    the reel twice);
 *  - the lab's pause source is useTabHidden below (the stage sets data-paused
 *    from it; a JS loop reads the same attribute); production swaps in
 *    useAmbientPause, which also pauses off-screen;
 *  - keyframes live in the concept's OWN sheet with its prefix (hhs-, hhr-,
 *    hhg-); keyframe-uniqueness.test.ts reads every sheet under the lab;
 *  - video follows the house pattern: no `autoplay` attribute, imperative
 *    play().catch(), the poster as a separate next/image beneath, cross-faded
 *    on onPlaying; useAmbientPause where production would pause;
 *  - the media manifest is the only source of paths (bible 18).
 */

export type Mode = "desktop" | "phone";
export type CopyMode = "ruled" | "proposed";
export type ConceptId = "source" | "reel" | "gathering";

export type ConceptProps = {
  mode: Mode;
  /** Which lockup copy to render: the ruled thesis or the concept's proposal. */
  copy: CopyMode;
  /** B reads it (the text-layer radial); the others ignore it. */
  scrim: boolean;
  /** The live demo's guest URL, or null when no demo is configured. */
  qrUrl: string | null;
  /** Bumped by Replay; the stage remounts anyway, this is for keyed loops. */
  runId: number;
};

export type Concept = {
  id: ConceptId;
  n: number;
  name: string;
  /** One or two sentences under the name: the argument, not the mechanics. */
  rationale: string;
  /** The eyebrow this concept proposes, in one line, so the board can list it. */
  eyebrow: string;
  /** The copy proposal beside the ruled line (bible 21: the thesis stays the default). */
  proposed: { h1: string; subhead: string; secondary: string };
  /** Flagged departures from the bible or a standing ruling, one line each. */
  departures: string[];
  /** The assets this concept asks Will for, one line each, specific. */
  assets: string[];
  render: (p: ConceptProps) => ReactNode;
};

/** The canvases the board judges on: a hero is a viewport-shaped thing, so the
 *  board lays it out at a real viewport's pixels and fits with `zoom`. */
export const CANVAS = {
  desktop: { w: 1440, h: 930 },
  phone: { w: 375, h: 760 },
} as const;

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
 *  Eleven are landscape and none is wider than 900px; Will's 36-frame set
 *  (a third portrait, 24 also as 512-square) replaces them by id. */
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

/** The stand-in reels: the landscape one for B's highlight loop, the portrait
 *  one for C's vertical clips (cut by currentTime ranges). */
export const REELS = {
  landscape: "hero-candidate-02",
  portrait: "hero-candidate-01",
} as const;

export function reelById(
  id: (typeof REELS)[keyof typeof REELS],
): MarketingReel {
  const found = MARKETING_REELS.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown marketing reel: ${id}`);
  return found;
}

/** The ruled copy (bible 21) and the one shared proposal for the secondary. */
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

/** The lockup copy for a concept under the board's copy toggle. */
export function copyFor(concept: Concept, mode: CopyMode): HeroCopy {
  if (mode === "proposed") {
    return {
      h1: concept.proposed.h1,
      subhead: concept.proposed.subhead,
      primary: RULED.primary,
      secondary: concept.proposed.secondary,
      proposed: true,
    };
  }
  return {
    h1: RULED.h1,
    subhead: RULED.subhead,
    primary: RULED.primary,
    secondary: RULED.secondary,
    proposed: false,
  };
}

/** Pause loops in a hidden tab only. No IntersectionObserver on purpose: the
 *  lab wants everything running side by side, and an IO here would also make
 *  the board unverifiable in a background tab, where observers never fire.
 *  Shared here because every concept that drives a video or a rAF loop needs
 *  it (three copies existed after round two's first pass). */
export function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return hidden;
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

/** What a concept renders until its track lands: the ground, the name, and
 *  the track that owns it, so the board is reviewable while three agents
 *  build in parallel. */
export function Placeholder({
  concept,
  track,
}: {
  concept: Pick<Concept, "name" | "rationale">;
  track: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-8 text-center">
      <p className="font-heading text-3xl text-white">{concept.name}</p>
      <p className="max-w-md text-sm text-white/60">{concept.rationale}</p>
      <p className="font-mono text-[11px] text-white/40">
        being built on lp/{track}
      </p>
    </div>
  );
}
