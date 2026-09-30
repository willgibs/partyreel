"use client";

// The veils' own sheet. Its one keyframe (`vl-drift`, round three's) is
// unique across the lab (src/app/keyframe-uniqueness.test.ts); the other
// veils' keyframes are written below from `veils.ts`, each named `pvh-*`.
import "./veils.css";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { CANVAS, type Mode } from "@/components/lab";
import { marketingImage } from "@/lib/constants/marketing-media";

import {
  BEAM,
  beamCycleMs,
  beamKeyframes,
  beamPhotos,
  beamShotDelayMs,
  beamSlotMs,
  DRIFT,
  driftCentre,
  GLIMPSE,
  glimpseCycleMs,
  glimpseKeyframes,
  LENS,
  lensKeyframes,
  lensPath,
  scrimShape,
  type VeilId,
} from "./veils";

/**
 * THE FOUR VEILS (privacy-hero round four, 2026-09-29), one per `VeilId`,
 * each a `PageHero` `backdrop` over the photograph the board's knob names.
 * CSS drives every picture (`veils.css`); React hands each element its place
 * and timing as custom properties and, for the three variations, writes
 * their keyframes from `veils.ts` into a <style> of their own, so a rest, a
 * spot or a count has one home and the sheet never retypes it. A `@keyframes`
 * animation already yields to a hidden tab at the compositor, and reduced
 * motion is the sheet's own media query, so nothing here reads either.
 *
 * ★ THE PHOTOGRAPH COMES THROUGH THE MEDIA MANIFEST BY ID (bible 9), never by
 * an index into another hero's list: round three's `photoOf(i)` read the home
 * hero's twelve by position, which is all `field.ts`, `field.css` and
 * `field-layer.tsx` still stood for. The swap when the asset lands is one id.
 *
 * ★ A CLEAR VIEW IS THE CANVAS'S OWN SIZE, CUT BY ITS PARENT. The lens, the
 * beam and every glimpse carry the same photograph in the same box as the
 * veil beneath, offset the opposite way to their own place, so the clarity is
 * always exactly the part of the photograph it sits over.
 */

const px = (n: number) => `${n}px`;

function Photo({
  id,
  mode,
  className = "pvh-photo",
}: {
  id: string;
  mode: Mode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Image
        src={marketingImage(id).src}
        alt=""
        fill
        sizes={px(CANVAS[mode].w)}
        className="object-cover"
      />
    </div>
  );
}

/** The canvas and the scrim every full-bleed veil shares. */
function shared(mode: Mode): Record<string, string> {
  const s = scrimShape(mode);
  return {
    "--pvh-w": px(CANVAS[mode].w),
    "--pvh-h": px(CANVAS[mode].h),
    "--pvh-scrim-rx": px(s.rx),
    "--pvh-scrim-ry": px(s.ry),
    "--pvh-scrim-cy": px(s.cy),
    "--pvh-top-fall": `${Math.round(s.topFall * 100)}%`,
    "--pvh-eyebrow-y": px(s.eyebrowY),
  };
}

type VeilProps = { mode: Mode; photo: string };

/* ── The drift: round three's veil, as it stands ────────────────────────── */

/**
 * Round three's `VeilConcept`, its markup and numbers unchanged: one
 * photograph in a disc on the lockup's centre, blurred and dim, and the same
 * frame sharp under a window that drifts (`.vl-clear`'s `mask-position`).
 */
export function DriftVeil({ mode, photo }: VeilProps) {
  const { x, y } = driftCentre(mode);
  const size = DRIFT.washPx[mode];
  const src = marketingImage(photo).src;
  const vars = {
    "--vl-cx": px(x),
    "--vl-cy": px(y),
    "--vl-size": px(size),
    "--vl-base-o": DRIFT.baseOpacity,
    "--vl-porthole": px(DRIFT.windowPx[mode]),
    "--vl-cycle": `${DRIFT.cycleMs}ms`,
  } as CSSProperties;

  return (
    <div className="pvh-layer" aria-hidden data-veil="drift" style={vars}>
      <div className="vl-wash">
        <div
          className="vl-blur"
          style={{ filter: `blur(${DRIFT.blurPx[mode]}px)` }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={px(size)}
            className="object-cover"
          />
        </div>
        <div className="vl-clear">
          <Image
            src={src}
            alt=""
            fill
            sizes={px(size)}
            className="object-cover"
          />
        </div>
      </div>
      <div className="vl-scrim" />
    </div>
  );
}

/* ── The lens ───────────────────────────────────────────────────────────── */

export function LensVeil({ mode, photo }: VeilProps) {
  const d = LENS.lensPx[mode];
  const { cycleMs } = lensPath(mode);
  const first = LENS.rests[mode][0];
  const name = `pvh-lens-${mode}`;
  const vars = {
    ...shared(mode),
    "--lns-d": px(d),
    "--lns-x0": px(first.x - d / 2),
    "--lns-y0": px(first.y - d / 2),
    "--lns-name": name,
    "--lns-name-view": `${name}-view`,
    "--lns-cycle": `${cycleMs}ms`,
  } as CSSProperties;

  return (
    <div className="pvh-layer" aria-hidden data-veil="lens" style={vars}>
      <style>{lensKeyframes(mode, name)}</style>
      <Photo id={photo} mode={mode} />
      {/* The lightbox's own ground, the utility itself: one material. */}
      <div className="lns-ground glass-behind" />
      <div className="lns-lens" data-lens>
        <div className="lns-view">
          <Photo id={photo} mode={mode} />
        </div>
        <span className="lns-rim" />
      </div>
      <div className="pvh-scrim" />
    </div>
  );
}

/* ── The beam ───────────────────────────────────────────────────────────── */

export function BeamVeil({ mode, photo }: VeilProps) {
  const w = BEAM.widthPx[mode];
  const name = `pvh-beam-${mode}`;
  const photos = beamPhotos(photo);
  const vars = {
    ...shared(mode),
    "--bm-w": px(w),
    "--bm-edge": `${Math.round(((1 - BEAM.core) / 2) * 100)}%`,
    "--bm-fade-top": `${Math.round(BEAM.fade.top * 100)}%`,
    "--bm-fade-foot": `${Math.round(BEAM.fade.foot * 100)}%`,
    // At rest the beam stands a fifth of the way in, over the first
    // photograph, clear of the words, where the reduced-motion reader and
    // the crawler meet it.
    "--bm-x0": px(Math.round(CANVAS[mode].w * 0.2 - w / 2)),
    "--bm-name": name,
    "--bm-name-view": `${name}-view`,
    "--bm-name-shot": `${name}-shot`,
    "--bm-slot": `${beamSlotMs()}ms`,
    "--bm-cycle": `${beamCycleMs()}ms`,
    "--bm-bright": BEAM.veil.brightness,
    "--bm-sat": BEAM.veil.saturate,
    "--bm-blur": px(BEAM.veil.blurPx),
    "--bm-grain-o": BEAM.grain.opacity,
    "--bm-grain-tile": px(BEAM.grain.tilePx),
  } as CSSProperties;
  const shots = (className: string) =>
    photos.map((id, i) => (
      <div
        key={id}
        className={className}
        data-first={i === 0 ? "" : undefined}
        style={{ "--bm-delay": `${beamShotDelayMs(i)}ms` } as CSSProperties}
      >
        <Photo id={id} mode={mode} />
      </div>
    ));

  return (
    <div className="pvh-layer" aria-hidden data-veil="beam" style={vars}>
      <style>{beamKeyframes(mode, name)}</style>
      <div className="bm-veil">
        {shots("bm-shot bm-dim")}
        <div className="bm-grain" />
      </div>
      <div className="bm-band" data-beam>
        <div className="bm-view">{shots("bm-shot")}</div>
      </div>
      <div className="pvh-scrim" />
    </div>
  );
}

/* ── The glimpses ───────────────────────────────────────────────────────── */

export function GlimpseVeil({ mode, photo }: VeilProps) {
  const name = `pvh-glimpse-${mode}`;
  const spots = GLIMPSE.spots[mode];
  const vars = {
    ...shared(mode),
    "--glm-blur": px(GLIMPSE.blurPx[mode]),
    "--glm-base-o": GLIMPSE.baseOpacity,
    "--glm-core": `${Math.round(GLIMPSE.core * 100)}%`,
    "--glm-name": name,
    "--glm-name-view": `${name}-view`,
    "--glm-cycle": `${glimpseCycleMs(mode)}ms`,
  } as CSSProperties;

  return (
    <div className="pvh-layer" aria-hidden data-veil="glimpse" style={vars}>
      <style>{glimpseKeyframes(mode, name)}</style>
      <div className="glm-veil">
        <Photo id={photo} mode={mode} />
      </div>
      {spots.map((s, i) => (
        <div
          key={i}
          className="glm-spot"
          data-spot
          data-first={i === 0 ? "" : undefined}
          style={
            {
              "--glm-x": px(s.x),
              "--glm-y": px(s.y),
              "--glm-d": px(s.d),
              "--glm-delay": `${i * GLIMPSE.stepMs}ms`,
            } as CSSProperties
          }
        >
          <div className="glm-view">
            <Photo id={photo} mode={mode} />
          </div>
        </div>
      ))}
      <div className="pvh-scrim" />
    </div>
  );
}

export const VEIL_LAYER: Record<VeilId, (p: VeilProps) => ReactNode> = {
  drift: (p) => <DriftVeil {...p} />,
  lens: (p) => <LensVeil {...p} />,
  beam: (p) => <BeamVeil {...p} />,
  glimpse: (p) => <GlimpseVeil {...p} />,
};
