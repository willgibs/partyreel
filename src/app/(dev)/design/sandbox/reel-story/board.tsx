"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { besidePreview } from "./beside";
import { heroPreview } from "./hero";
import { linePreview } from "./line";
import { REEL_STORY } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is its real section in a real
 * frame at the width the screen knob names (`scene.tsx`). The hero's object
 * is drawn in the real first screen with the band running on its own loop;
 * the demo line in the home's close and the /reel hero; the reel's line in
 * its three places.
 */
const PREVIEWS: PreviewsFor<typeof REEL_STORY> = {
  "hero.today": (s) => heroPreview(s, "today"),
  "hero.refined": (s) => heroPreview(s, "refined"),
  "hero.print": (s) => heroPreview(s, "print"),
  "hero.plate": (s) => heroPreview(s, "plate"),

  "beside.none": (s) => besidePreview(s, "none"),
  "beside.live": (s) => besidePreview(s, "live"),
  "beside.faces": (s) => besidePreview(s, "faces"),
  "beside.peek": (s) => besidePreview(s, "peek"),

  "line.as-it-happens": (s) => linePreview(s, "as-it-happens"),
  "line.as-they-land": (s) => linePreview(s, "as-they-land"),
  "line.new-photo": (s) => linePreview(s, "new-photo"),
  "line.two-beats": (s) => linePreview(s, "two-beats"),
};

export function ReelStoryBoard() {
  return <ExplorationBoard spec={REEL_STORY} previews={PREVIEWS} />;
}
