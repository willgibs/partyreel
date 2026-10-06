"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { visionOf } from "./afterglow/vision";
import { APERTURE } from "./aperture";
import { CAST } from "./cast";
import type { Vision } from "./deck/contract";
import { Deck } from "./deck/deck";
import { INK } from "./ink";
import { screenOf } from "./knobs";
import { BRAND } from "./spec";

/**
 * THE PREVIEWS: each take's deck, its fourteen slides in round one's order,
 * at a desk (1440 by 900) or on a phone (375 wide) on the Read on knob. Every
 * slide is one shared composition (`afterglow/slides/`) drawn inside its take
 * (`aperture/`, `ink/`, `cast/`), so the stage compares like with like and the
 * takes differ only where their constructions do. Every photograph is a
 * bootstrap still and every seeded colour is production's own hashvatar.
 */
function deck(vision: Vision) {
  return function TakeDeck(s: BoardState) {
    return <Deck vision={vision} screen={screenOf(s.screen)} />;
  };
}

const PREVIEWS: PreviewsFor<typeof BRAND> = {
  "take.aperture": deck(visionOf(APERTURE)),
  "take.ink": deck(visionOf(INK)),
  "take.cast": deck(visionOf(CAST)),
};

export function BrandBoard() {
  return <ExplorationBoard spec={BRAND} previews={PREVIEWS} />;
}
