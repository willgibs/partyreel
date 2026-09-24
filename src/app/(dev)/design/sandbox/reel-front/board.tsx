"use client";

import "./reel-front.css";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { ALBUM_IDS, mediaFor, TAKE_STILLS } from "./fixtures";
import {
  Ground,
  DurationBadge,
  GlyphBadge,
  LiveBadge,
  SignatureFrame,
  SignatureGraded,
  SignatureHardcut,
  SignaturePlain,
  SignatureStacked,
  TileCard,
} from "./parts";
import { REEL_FRONT } from "./spec";
import { Scene, type ScreenId } from "./scene";

/**
 * THE PREVIEWS, AND NOTHING ELSE (the `guest-capture`/`media-viewer` rule,
 * carried here). Round two asks two slots on the SAME tile: `signature`
 * (the media) and `badge` (the other corner); every other fact on the card
 * is round one's, drawn as ground, never varied again.
 *
 * ★ EVERY OPTION IS DRAWN AT BOTH 375 AND 1440, UNCONDITIONALLY (his own
 * ask), the `tile` ask's own round-one pattern: two real `Scene`s side by
 * side rather than one behind a screen knob, since there is no other ask left
 * to share one with.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the tile's own box,
 * which treatment actually drew, how many of the take's stills are cycling,
 * whether the corner carries a mark at all.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;

/** The album beneath the tile, in both asks: round one's own context, so a
 *  reviewer can judge the tile's difference FROM something, not in a void. */
const ALBUM = mediaFor(ALBUM_IDS);

function TilePair({
  id,
  title,
  measure,
  media,
  badge,
}: {
  id: string;
  title: string;
  measure: Reader;
  media: ReactNode;
  badge?: ReactNode;
}) {
  const page = <Ground slot={<TileCard media={media} badge={badge} />} items={ALBUM} />;
  const sizes: ScreenId[] = ["375", "1440"];
  return (
    <div className="flex flex-wrap items-start gap-6">
      {sizes.map((sc) => (
        <Scene key={sc} id={id} screen={sc} title={title} measure={measure}>
          {page}
        </Scene>
      ))}
    </div>
  );
}

/* ── signature: how the tile reads as the reel, over its own take ────────── */

const measureSignature: Reader = (root) => {
  const tile = root.querySelector<HTMLElement>("[data-rf-tile]");
  const media = root.querySelector<HTMLElement>("[data-rf-signature]");
  const cross = root.querySelector<HTMLElement>("[data-rf-crossfade]");
  if (!tile || !media) return null;
  const box = tile.getBoundingClientRect();
  const count = cross?.getAttribute("data-rf-count") ?? "0";
  return `Measured: the tile is ${Math.round(box.width)} by ${Math.round(
    box.height,
  )}px, the "${media.getAttribute(
    "data-rf-signature",
  )}" treatment over ${count} of the reel's own take.`;
};

function signatureScreen(
  shape: "plain" | "graded" | "stacked" | "frame" | "hardcut",
) {
  const media =
    shape === "plain" ? (
      <SignaturePlain images={TAKE_STILLS} />
    ) : shape === "graded" ? (
      <SignatureGraded images={TAKE_STILLS} />
    ) : shape === "stacked" ? (
      <SignatureStacked images={TAKE_STILLS} />
    ) : shape === "frame" ? (
      <SignatureFrame images={TAKE_STILLS} />
    ) : (
      <SignatureHardcut images={TAKE_STILLS} />
    );
  return (
    <TilePair
      id={`signature-${shape}`}
      title="The tile's signature"
      measure={measureSignature}
      media={media}
    />
  );
}

/* ── badge: what replaces "The reel" chip, if anything ────────────────────── */

const measureBadge: Reader = (root) => {
  const tile = root.querySelector<HTMLElement>("[data-rf-tile]");
  if (!tile) return null;
  const badge = tile.querySelector<HTMLElement>("[data-rf-badge]");
  return `Measured: the corner ${
    badge ? `carries a "${badge.getAttribute("data-rf-badge")}" mark` : "is empty"
  }.`;
};

function badgeScreen(shape: "none" | "live" | "glyph" | "duration") {
  const badge =
    shape === "none" ? null
    : shape === "live" ? <LiveBadge />
    : shape === "glyph" ? <GlyphBadge />
    : <DurationBadge />;
  return (
    <TilePair
      id={`badge-${shape}`}
      title="The corner mark"
      measure={measureBadge}
      media={<SignaturePlain images={TAKE_STILLS} />}
      badge={badge}
    />
  );
}

/* ── the map the step draws from ─────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_FRONT> = {
  "signature.plain": () => signatureScreen("plain"),
  "signature.graded": () => signatureScreen("graded"),
  "signature.stacked": () => signatureScreen("stacked"),
  "signature.frame": () => signatureScreen("frame"),
  "signature.hardcut": () => signatureScreen("hardcut"),

  "badge.none": () => badgeScreen("none"),
  "badge.live": () => badgeScreen("live"),
  "badge.glyph": () => badgeScreen("glyph"),
  "badge.duration": () => badgeScreen("duration"),
};

export function ReelFrontBoard() {
  return <ExplorationBoard spec={REEL_FRONT} previews={PREVIEWS} />;
}
