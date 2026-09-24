"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { controlPreview } from "./control";
import { phonePreview } from "./phone";
import { ScopeShowcase } from "./scope";
import { ALBUM_COLUMNS } from "./spec";
import { scalePreview } from "./scale";
import { widthPreview } from "./width";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real fixture album on
 * the real `MasonryColumns`, at the width where its decision's difference
 * shows. `width`, `scale` and `phone` read a screen knob from the board's
 * state (`screens.ts`); `scope` and `control` are not width-dependent, so
 * their pictures are plain nodes.
 */
const PREVIEWS: PreviewsFor<typeof ALBUM_COLUMNS> = {
  "width.edge": (s) => widthPreview(s, "edge"),
  "width.contained": (s) => widthPreview(s, "contained"),
  "width.bleed": (s) => widthPreview(s, "bleed"),

  "scale.unlimited": (s) => scalePreview(s, "unlimited"),
  "scale.grows": (s) => scalePreview(s, "grows"),
  "scale.ceiling": (s) => scalePreview(s, "ceiling"),

  "phone.fixed-two": (s) => phonePreview(s, "fixed-two"),
  "phone.scales": (s) => phonePreview(s, "scales"),
  "phone.step-three": (s) => phonePreview(s, "step-three"),

  "scope.shared": <ScopeShowcase option="shared" />,
  "scope.split": <ScopeShowcase option="split" />,
  "scope.shared-defaults": <ScopeShowcase option="shared-defaults" />,

  "control.three-step": controlPreview("three-step"),
  "control.slider": controlPreview("slider"),
  "control.five-step": controlPreview("five-step"),
};

export function AlbumColumnsBoard() {
  return <ExplorationBoard spec={ALBUM_COLUMNS} previews={PREVIEWS} />;
}
