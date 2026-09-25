"use client";

import "./reel-story.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { phoneOf, screenOf } from "./fixtures";
import { REEL_STORY } from "./spec";
import {
  ArcPreview,
  EventsPreview,
  HelpNamingPreview,
  PricingPreview,
  Screen,
  StepsPreview,
  ThesisPreview,
  TeaserPreview,
} from "./surfaces";

/**
 * THE PREVIEWS: every option is the real copy in the real piece (see spec.ts's
 * head comment). `screen` is the one shared config every ask carries
 * (`configs: [SCREEN]`): a reviewer flips it once and every ask redraws at
 * that width, exactly the `reel-view` convention this board reuses rather
 * than stacking both widths under every option (twenty-one specimens would
 * otherwise become forty-two).
 */

const THESIS_LINE: Record<string, string> = {
  grows: "Every event has a reel.",
  verbs: "Scan. Add. Watch it grow.",
  auto: "The reel that makes itself.",
};

function thesisScreen(id: string, s: BoardState) {
  const screen = screenOf(s.screen);
  const phone = phoneOf(screen);
  return (
    <Screen
      id={`thesis-${id}`}
      screen={screen}
      h={phone ? 760 : 820}
      caption="The home's close (CinemaClose) above, the feature hub's reel door below: one line, two real places."
    >
      <ThesisPreview line={THESIS_LINE[id]} phone={phone} />
    </Screen>
  );
}

const ARC_ORDER: Record<
  string,
  | readonly ["live", "screen", "clip"]
  | readonly ["clip", "live", "screen"]
  | readonly ["screen", "live", "clip"]
> = {
  "live-first": ["live", "screen", "clip"],
  "clip-first": ["clip", "live", "screen"],
  "screen-first": ["screen", "live", "clip"],
};

function arcScreen(id: string, s: BoardState) {
  const screen = screenOf(s.screen);
  const phone = phoneOf(screen);
  return (
    <Screen
      id={`arc-${id}`}
      screen={screen}
      h={phone ? 1620 : 1280}
      caption="The style switcher stays above this; these three chapters replace the four built for the old stored reel."
    >
      <ArcPreview order={ARC_ORDER[id]} phone={phone} />
    </Screen>
  );
}

function teaserScreen(
  id: "engine" | "film" | "poster" | "crossfade",
  s: BoardState,
) {
  const screen = screenOf(s.screen);
  const phone = phoneOf(screen);
  return (
    <Screen
      id={`teaser-${id}`}
      screen={screen}
      h={phone ? 700 : 780}
      caption="The home's reel-teaser section, real SectionShell and real copy, only the player swapped."
    >
      <TeaserPreview variant={id} phone={phone} />
    </Screen>
  );
}

function pricingScreen(id: "renamed" | "one-row" | "footnote", s: BoardState) {
  const screen = screenOf(s.screen);
  return (
    <Screen
      id={`pricing-${id}`}
      screen={screen}
      h={id === "footnote" ? 340 : 300}
      caption={
        'The comparison matrix’s own "The reel" group, real MAX_REEL_SECONDS numbers, on the table’s dark ground.'
      }
    >
      <PricingPreview variant={id} />
    </Screen>
  );
}

function stepsScreen(
  id: "grow-clip" | "screen-step" | "folded",
  s: BoardState,
) {
  const screen = screenOf(s.screen);
  const phone = phoneOf(screen);
  return (
    <Screen
      id={`steps-${id}`}
      screen={screen}
      h={phone ? 560 : 400}
      caption="The loop's numbered rail; the last step is the one this ask rewrites, both sides."
    >
      <StepsPreview variant={id} phone={phone} />
    </Screen>
  );
}

function eventsScreen(id: "wall" | "clip" | "gone", s: BoardState) {
  const screen = screenOf(s.screen);
  const phone = phoneOf(screen);
  return (
    <Screen
      id={`events-${id}`}
      screen={screen}
      h={id === "gone" ? (phone ? 680 : 620) : phone ? 1200 : 760}
      caption="event-door.tsx's own door, unchanged; only the reel column beside it (or its absence) changes."
    >
      <EventsPreview variant={id} phone={phone} />
    </Screen>
  );
}

function helpScreen(
  id: "highlight-reel" | "the-reel" | "reels-clips" | "live-reel",
  s: BoardState,
) {
  const screen = screenOf(s.screen);
  return (
    <Screen
      id={`help-${id}`}
      screen={screen}
      ground="paper"
      h={620}
      caption="The header panel's entry, the help hub's category strip cell, and its full pane: one name in three sizes."
    >
      <HelpNamingPreview variant={id} />
    </Screen>
  );
}

const PREVIEWS: PreviewsFor<typeof REEL_STORY> = {
  "thesis.grows": (s) => thesisScreen("grows", s),
  "thesis.verbs": (s) => thesisScreen("verbs", s),
  "thesis.auto": (s) => thesisScreen("auto", s),

  "arc.live-first": (s) => arcScreen("live-first", s),
  "arc.clip-first": (s) => arcScreen("clip-first", s),
  "arc.screen-first": (s) => arcScreen("screen-first", s),

  "teaser.engine": (s) => teaserScreen("engine", s),
  "teaser.film": (s) => teaserScreen("film", s),
  "teaser.poster": (s) => teaserScreen("poster", s),
  "teaser.crossfade": (s) => teaserScreen("crossfade", s),

  "pricing.renamed": (s) => pricingScreen("renamed", s),
  "pricing.one-row": (s) => pricingScreen("one-row", s),
  "pricing.footnote": (s) => pricingScreen("footnote", s),

  "steps.grow-clip": (s) => stepsScreen("grow-clip", s),
  "steps.screen-step": (s) => stepsScreen("screen-step", s),
  "steps.folded": (s) => stepsScreen("folded", s),

  "events.wall": (s) => eventsScreen("wall", s),
  "events.clip": (s) => eventsScreen("clip", s),
  "events.gone": (s) => eventsScreen("gone", s),

  "help.highlight-reel": (s) => helpScreen("highlight-reel", s),
  "help.the-reel": (s) => helpScreen("the-reel", s),
  "help.reels-clips": (s) => helpScreen("reels-clips", s),
  "help.live-reel": (s) => helpScreen("live-reel", s),
};

export function ReelStoryBoard() {
  return <ExplorationBoard spec={REEL_STORY} previews={PREVIEWS} />;
}
