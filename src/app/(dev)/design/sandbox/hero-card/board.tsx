"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { heroPreview, lightPreview, tabletPreview } from "./hero";
import { HERO_CARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the home's real first screen
 * in a real frame at the width the screen knob names (`scene.tsx`), the band
 * running on its own loop, only the object changed. The tablet's geometry is
 * drawn in whichever card the state holds, because it is asked once the card
 * is picked (the step hands the picked answer in).
 */
const PREVIEWS: PreviewsFor<typeof HERO_CARD> = {
  "card.link": (s) => heroPreview(s, "link"),
  "card.guests": (s) => heroPreview(s, "guests"),
  "card.chat": (s) => heroPreview(s, "chat"),
  "card.spread": (s) => heroPreview(s, "spread"),
  "card.typed": (s) => heroPreview(s, "typed"),
  "light.none": (s) => lightPreview(s, "none"),
  "light.pool": (s) => lightPreview(s, "pool"),
  "light.bloom": (s) => lightPreview(s, "bloom"),
  "tablet.today": (s) => tabletPreview(s, "today"),
  "tablet.tablet": (s) => tabletPreview(s, "tablet"),
  "tablet.early": (s) => tabletPreview(s, "early"),
};

export function HeroCardBoard() {
  return <ExplorationBoard spec={HERO_CARD} previews={PREVIEWS} />;
}
