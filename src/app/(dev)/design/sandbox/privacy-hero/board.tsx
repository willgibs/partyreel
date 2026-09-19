"use client";

import { CANVAS, ExplorationBoard, Frame } from "@/components/lab";
import type { Mode } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  ACCESS,
  APERTURE,
  type ConceptId,
  SEAL,
  sealStepMs,
} from "./concepts";
import { PrivacyHero } from "./hero";
import { PRIVACY_HERO } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each concept is the privacy page's first
 * screen at 1440 and again at 375, in real viewports (round three,
 * 2026-09-19).
 *
 * ★ STILL A FRAME, FOR THE SAME REASON ROUND TWO NEEDED ONE. `text-title`
 * reads the BROWSER's width, so a 375 div on a wide page draws the 1440
 * headline. `Frame` portals the composition into a same-origin iframe, the
 * only real viewport the lab has.
 *
 * ★ NO PAUSE CONTEXT THIS ROUND, AND THAT IS A DELIBERATE DEPARTURE FROM
 * ROUND TWO'S `TrailPause`. That plumbing existed to hold a many-node rAF
 * loop's CLOCK still while a preview sat off-screen. Nothing here runs a
 * loop: every concept is a `@keyframes` animation, which the compositor
 * already throttles on a hidden tab, and reduced motion is a media query
 * rather than a read of one. Cheaper by construction, not by an omission.
 *
 * ★ ONE ASK, THREE OPTIONS, NO STAGED FOLLOW-UP. Round three is a concept
 * pick, not a refinement of one mechanism's dimensions, so nothing here
 * reads a prior answer the way round two's `look()` did.
 */

/** The numbers under each screen, measured off the same constants the
 *  picture is built from (`concepts.ts`), never retyped. */
function captionFor(concept: ConceptId, mode: Mode): string {
  if (concept === "aperture") {
    const [lo, hi] = APERTURE.opacity;
    const [ringLo, ringHi] = APERTURE.ring[mode];
    return `1 photograph, blurred ${APERTURE.blurPx[mode]}px, ${Math.round(lo * 100)} to ${Math.round(hi * 100)}% opacity · a ${ringLo} to ${ringHi}px ring · one breath every ${APERTURE.cycleMs / 1000}s`;
  }
  if (concept === "access") {
    const n = ACCESS.tiles[mode];
    return `${n} tiles at ${ACCESS.sizePx[mode]}px, frosted at ${Math.round(ACCESS.frosted.opacity * 100)}% · ${ACCESS.holdMs}ms clear, ${ACCESS.fadeMs}ms to fade · a turn every ${ACCESS.stepMs}ms, a full circuit in ${ACCESS.cycleMs / 1000}s`;
  }
  const n = SEAL.cards[mode];
  const { w, h } = SEAL.size[mode];
  const step = sealStepMs(mode);
  return `${n} cards at ${w}x${h}px · sealed to ${SEAL.sealedPct}%, opens to ${SEAL.openPct}% · ${SEAL.openMs}ms open, ${SEAL.closeMs}ms to reseal · one in turn every ${step / 1000}s`;
}

function Screens({ concept }: { concept: ConceptId }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Frame
        id={`pvh-desk-${concept}`}
        w={CANVAS.desktop.w}
        h={CANVAS.desktop.h}
        title="1440"
        caption={captionFor(concept, "desktop")}
      >
        <PrivacyHero spec={{ mode: "desktop", concept }} />
      </Frame>
      <Frame
        id={`pvh-phone-${concept}`}
        w={CANVAS.phone.w}
        h={CANVAS.phone.h}
        title="375"
        caption={captionFor(concept, "phone")}
      >
        <PrivacyHero spec={{ mode: "phone", concept }} />
      </Frame>
    </div>
  );
}

const PREVIEWS: PreviewsFor<typeof PRIVACY_HERO> = {
  "concept.aperture": <Screens concept="aperture" />,
  "concept.access": <Screens concept="access" />,
  "concept.seal": <Screens concept="seal" />,
};

export function PrivacyHeroBoard() {
  return <ExplorationBoard spec={PRIVACY_HERO} previews={PREVIEWS} />;
}
