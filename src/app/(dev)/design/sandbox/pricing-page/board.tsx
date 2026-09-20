"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type Fit, FitBlock } from "./fit";
import { type Phone, PhonePlans } from "./phone";
import { Scene, Widths } from "./scene";
import { PRICING_PAGE } from "./spec";

/**
 * THE PREVIEWS, ROUND TWO: two decisions, six pictures, on the real shipped
 * pair and ticket (`plans.tsx`'s given world). Neither ask stages behind the
 * other (both are independent of round one's now-settled axes), so each
 * option is a plain node rather than a function of board state.
 *
 * ★ TWO WIDTHS FOR `fit`, ONE FOR `phone`. `fit`'s split-panel shape only
 * exists at `lg`, so it draws at 1440 and 375 like round one's convention
 * (`Widths`); `phone` IS the 375 column, so it draws once (`tile: "phone"`
 * in the spec, `Scene` directly, matching round one's own convention for a
 * question whose evidence is a column rather than a page).
 */

// Measured off the laid-out frames (never guessed: PROGRAM.md's own rule),
// each with a small margin so a later copy tweak does not reclip it.
const FIT_H: Record<Fit, { desktop: number; phone: number }> = {
  wall: { desktop: 2520, phone: 3350 },
  split: { desktop: 2220, phone: 3420 },
  inline: { desktop: 1560, phone: 2460 },
};

const FIT_NOTE: Record<Fit, string> = {
  wall: "The ratified V1: drag it and the wall fills, under the real pair.",
  split: "The configurator left, a designed plan card as the live result right.",
  inline: "No separate section: Pro's own slider is left to carry the whole answer.",
};

function fit(f: Fit) {
  return (
    <Widths
      id={`fit-${f}`}
      ground="paper"
      desktopH={FIT_H[f].desktop}
      phoneH={FIT_H[f].phone}
      note={FIT_NOTE[f]}
      render={() => <FitBlock fit={f} />}
    />
  );
}

const PHONE_H = 2350;
const PHONE_NOTE: Record<Phone, string> = {
  stack: "One card under another, production's own order.",
  swipe: "A snapping row, the next card peeking, repaired and lab:demo-pressed.",
  tabs: "Two tabs, one side of the fork at a time.",
};

function phone(p: Phone) {
  return (
    <Scene id={`phone-${p}`} w={375} h={PHONE_H} ground="paper" title="375" note={PHONE_NOTE[p]}>
      <PhonePlans phone={p} />
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof PRICING_PAGE> = {
  "fit.wall": fit("wall"),
  "fit.split": fit("split"),
  "fit.inline": fit("inline"),

  "phone.stack": phone("stack"),
  "phone.swipe": phone("swipe"),
  "phone.tabs": phone("tabs"),
};

export function PricingPageBoard() {
  return <ExplorationBoard spec={PRICING_PAGE} previews={PREVIEWS} />;
}
