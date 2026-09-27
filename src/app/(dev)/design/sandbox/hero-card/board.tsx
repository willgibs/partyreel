"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { heroPreview } from "./hero";
import { HERO_CARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the home's real first screen
 * in a real frame at the width the screen knob names (`scene.tsx`), the band
 * running on its own loop, only the object changed.
 */
const PREVIEWS: PreviewsFor<typeof HERO_CARD> = {
  "card.today": (s) => heroPreview(s, "today"),
  "card.album": (s) => heroPreview(s, "album"),
  "card.page": (s) => heroPreview(s, "page"),
  "card.link": (s) => heroPreview(s, "link"),
};

export function HeroCardBoard() {
  return <ExplorationBoard spec={HERO_CARD} previews={PREVIEWS} />;
}
