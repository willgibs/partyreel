"use client";

// The concepts' own sheet, no keyframe collision with `field.css` (which
// declares none) or any other board's (src/app/keyframe-uniqueness.test.ts).
import "./concepts.css";

import Image from "next/image";
import type { CSSProperties } from "react";

import type { Mode } from "@/components/lab";

import {
  ACCESS,
  accessTiles,
  APERTURE,
  apertureCentre,
  SEAL,
  sealCards,
  sealStepMs,
} from "./concepts";
import { photoOf } from "./field-layer";

/**
 * THE THREE CONCEPTS' COMPONENTS (privacy-hero round three, 2026-09-19): one
 * per `ConceptId`, each a `PageHero` `backdrop`. Pure CSS drives every
 * picture (`concepts.css`); React's only job is to hand each element its own
 * position and timing as custom properties, which is also why none of these
 * needs the old engine's pause plumbing (`field-layer.tsx`'s `FieldPause`,
 * built for a many-node rAF loop). A `@keyframes` animation already yields
 * to a hidden tab at the compositor, and reduced motion is the CSS rule
 * itself rather than a read of it, so there is nothing left for JS to hold.
 *
 * ★ EVERY POSITION IS THE ONE `concepts.test.ts` CHECKS. `accessTiles` and
 * `sealCards` are pure functions of `mode`; nothing in here invents a
 * coordinate `concepts.ts` does not already own.
 */

function px(n: number) {
  return `${n}px`;
}

export function ApertureConcept({ mode }: { mode: Mode }) {
  const { x, y } = apertureCentre(mode);
  const [lo, hi] = APERTURE.opacity;
  const [ringLo, ringHi] = APERTURE.ring[mode];
  const vars = {
    "--apr-cx": px(x),
    "--apr-cy": px(y),
    "--apr-size": px(APERTURE.washPx[mode]),
    "--apr-lo": lo,
    "--apr-hi": hi,
    "--apr-ring-lo": px(ringLo),
    "--apr-ring-hi": px(ringHi),
    "--apr-cycle": `${APERTURE.cycleMs}ms`,
  } as CSSProperties;

  return (
    <div className="cpt-layer" aria-hidden style={vars}>
      <div
        className="apr-wash"
        style={{ filter: `blur(${APERTURE.blurPx[mode]}px)` }}
      >
        <Image
          src={photoOf(4).src}
          alt=""
          fill
          sizes={px(APERTURE.washPx[mode])}
          className="object-cover"
        />
      </div>
      <div className="apr-ring" />
      <div className="apr-scrim" />
    </div>
  );
}

export function AccessConcept({ mode }: { mode: Mode }) {
  const tiles = accessTiles(mode);
  const size = ACCESS.sizePx[mode];

  return (
    <div className="cpt-layer" aria-hidden>
      {tiles.map((t, i) => (
        <div
          key={i}
          className="acc-tile"
          style={
            {
              "--acc-x": px(t.x),
              "--acc-y": px(t.y),
              "--acc-size": px(size),
              "--acc-i": i,
              "--acc-cycle": `${ACCESS.cycleMs}ms`,
              "--acc-step": `${ACCESS.stepMs}ms`,
            } as CSSProperties
          }
        >
          <Image
            src={photoOf(i).src}
            alt=""
            fill
            sizes={px(size)}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function SealConcept({ mode }: { mode: Mode }) {
  const cards = sealCards(mode);
  const { w, h } = SEAL.size[mode];
  const step = sealStepMs(mode);

  return (
    <div className="cpt-layer" aria-hidden>
      {cards.map((c, i) => (
        <div
          key={i}
          className="seal-card"
          style={
            {
              "--seal-x": px(c.x),
              "--seal-y": px(c.y),
              "--seal-w": px(w),
              "--seal-h": px(h),
              "--seal-i": i,
              "--seal-cycle": `${SEAL.cycleMs}ms`,
              "--seal-step": `${step}ms`,
              "--seal-sealed": `${SEAL.sealedPct}%`,
              "--seal-open": `${SEAL.openPct}%`,
            } as CSSProperties
          }
        >
          <div className="seal-photo">
            <Image
              src={photoOf(i * 3).src}
              alt=""
              fill
              sizes={px(w)}
              className="object-cover"
            />
          </div>
          <div className="seal-cover" />
        </div>
      ))}
    </div>
  );
}
