"use client";

import { useState } from "react";

import {
  type BoardState,
  CANVAS,
  ExplorationBoard,
  Fit,
  Frame,
  Measured,
  type Mode,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { PrivacyHero } from "./hero";
import { PHOTO_ID, photoFrom } from "./knobs";
import { readVeil } from "./measure";
import { PRIVACY_HERO } from "./spec";
import type { VeilId } from "./veils";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each veil is the privacy page's first
 * screen at 1440 and again at 375, in real viewports (round four,
 * 2026-09-29).
 *
 * ★ A FRAME, BECAUSE `text-title` READS THE VIEWPORT. A 375 div on a wide
 * page draws the 1440 headline; `Frame` portals the screen into a same-origin
 * iframe, the only real viewport the lab has, and `Fit` zooms a 1440 frame to
 * the room when the lab's Fit preference asks.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME (`measure.ts`), NEVER TYPED: the
 * clearing's size as drawn, the veil's filter as the browser resolved it, the
 * loop from the running animation, and how far the nearest resting clearing
 * sits from the words' own boxes. If the words above a frame and its caption
 * disagree, the caption is the truth.
 *
 * ★ NO PAUSE CONTEXT, AS IN ROUND THREE: every veil is `@keyframes`, which the
 * compositor already throttles on a hidden tab, and reduced motion is the
 * sheet's own media query rather than a read of it.
 */

function Screen({
  veil,
  mode,
  photo,
}: {
  veil: VeilId;
  mode: Mode;
  photo: string;
}) {
  const [caption, setCaption] = useState("measuring");
  const { w, h } = CANVAS[mode];
  return (
    <Fit w={w}>
      <Frame
        id={`pvh-${mode}-${veil}`}
        w={w}
        h={h}
        title={mode === "desktop" ? "1440" : "375"}
        caption={caption}
      >
        <Measured
          probe={readVeil}
          deps={[veil, mode, photo]}
          onMeasure={setCaption}
          timers={[300, 1200, 2600]}
        >
          <PrivacyHero spec={{ mode, veil, photo }} />
        </Measured>
      </Frame>
    </Fit>
  );
}

function Screens({ veil, s }: { veil: VeilId; s: BoardState }) {
  const photo = PHOTO_ID[photoFrom(s.photo)];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Screen veil={veil} mode="desktop" photo={photo} />
      <Screen veil={veil} mode="phone" photo={photo} />
    </div>
  );
}

/** Every preview reads the knob, so all four wear the same photograph. */
const PREVIEWS: PreviewsFor<typeof PRIVACY_HERO> = {
  "veil.drift": (s) => <Screens veil="drift" s={s} />,
  "veil.lens": (s) => <Screens veil="lens" s={s} />,
  "veil.beam": (s) => <Screens veil="beam" s={s} />,
  "veil.glimpse": (s) => <Screens veil="glimpse" s={s} />,
};

export function PrivacyHeroBoard() {
  return <ExplorationBoard spec={PRIVACY_HERO} previews={PREVIEWS} />;
}
