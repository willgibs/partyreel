"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { AFTERGLOW } from "./afterglow";
import { CONTACT_SHEET } from "./contact-sheet";
import type { Vision } from "./deck/contract";
import { Deck } from "./deck/deck";
import { EVERYONE } from "./everyone";
import { screenOf } from "./knobs";
import { BRAND } from "./spec";

/**
 * THE PREVIEWS: each vision's deck, its fourteen slides in the contract's one
 * order, at a desk (1440 by 900) or on a phone (375 wide) on the Read on knob.
 * Each deck is its agency team's own folder (`afterglow/`, `contact-sheet/`,
 * `everyone/`); the deck around them is `deck/`. Every photograph is a
 * bootstrap still and every seeded colour is production's own hashvatar.
 */
function deck(vision: Vision) {
  return function VisionDeck(s: BoardState) {
    return <Deck vision={vision} screen={screenOf(s.screen)} />;
  };
}

const PREVIEWS: PreviewsFor<typeof BRAND> = {
  "vision.afterglow": deck(AFTERGLOW),
  "vision.contact-sheet": deck(CONTACT_SHEET),
  "vision.everyone": deck(EVERYONE),
};

export function BrandBoard() {
  return <ExplorationBoard spec={BRAND} previews={PREVIEWS} />;
}
