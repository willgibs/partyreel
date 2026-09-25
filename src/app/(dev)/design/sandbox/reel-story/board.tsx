"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { cardPreview } from "./card";
import { closePreview } from "./close";
import { playPreview } from "./play";
import { REEL_STORY } from "./spec";
import { wallPreview } from "./wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is its real section in a real
 * frame at the width the screen knob names (`scene.tsx`), the reel on the real
 * engine over the board's demo album (`fixtures.ts`, `parts.tsx`). The close
 * is the shipped `SectionLight` and `CtaBand`; the card is drawn in its three
 * places; the wall stands beside the shipped door; the play mark's options
 * are drawn pressed, over the home's reel section.
 */
const PREVIEWS: PreviewsFor<typeof REEL_STORY> = {
  "close.starts": (s) => closePreview(s, "starts"),
  "close.every-photo": (s) => closePreview(s, "every-photo"),
  "close.big-screen": (s) => closePreview(s, "big-screen"),
  "close.hosting": (s) => closePreview(s, "hosting"),

  "card.as-it-happens": (s) => cardPreview(s, "as-it-happens"),
  "card.cut-together": (s) => cardPreview(s, "cut-together"),
  "card.joins": (s) => cardPreview(s, "joins"),

  "wall.pair": (s) => wallPreview(s, "pair"),
  "wall.screen": (s) => wallPreview(s, "screen"),
  "wall.bleed": (s) => wallPreview(s, "bleed"),

  "play.overlay": (s) => playPreview(s, "overlay"),
  "play.route": (s) => playPreview(s, "route"),
  "play.modal": (s) => playPreview(s, "modal"),
};

export function ReelStoryBoard() {
  return <ExplorationBoard spec={REEL_STORY} previews={PREVIEWS} />;
}
