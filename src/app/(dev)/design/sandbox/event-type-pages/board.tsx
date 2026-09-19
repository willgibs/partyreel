"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { DirectoryPreview, type DirectoryShape } from "./directory";
import { HeroPicturePreview, type HeroPictureShape } from "./hero-picture";
import { HowManyPreview, type HowManyShape } from "./how-many";
import { OneHeroPreview, type OneHeroShape } from "./one-hero";
import { OnePageOrFourPreview, type PageShape } from "./one-page-or-four";
import { PhonePreview } from "./the-phone";
import { ProofPreview, type ProofShape } from "./the-proof";
import { WhoGreetedPreview, type WhoGreetedShape } from "./who-greeted";
import { EVENT_TYPE_PAGES } from "./spec";
import { Scene, Widths } from "./scene";

/**
 * THE PREVIEWS: every option on the real pieces (`PageHero`, `EventHeroMedia`,
 * `TypeDirectory`'s grammar, `BuiltFor`/`HelpPane`, `ReelAngleBand`,
 * `FaqAccordion`, `CtaBand`) or a fixture built from the same primitives where
 * the decision needs an invented type or copy the single source cannot hold,
 * drawn at both 1440 and 375 (the `Widths` convention every recent board
 * shares) except THE PHONE, which declares `tile: "phone"` and draws one
 * width only.
 *
 * Heights are MEASURED against the rendered stage (`document.
 * documentElement.scrollHeight` inside each frame, read live at
 * localhost:3131), never guessed: PROGRAM.md's own warning ("a board once drew
 * an option with its formula's sign backwards") is exactly the failure mode a
 * computed height invites.
 */

function heroPictureOf(v: unknown): HeroPictureShape {
  return v === "split" || v === "artifacts" || v === "photos" || v === "phone"
    ? v
    : "split";
}

/* ── 1. One page or four ──────────────────────────────────────────────── */

const ONE_PAGE_H: Record<PageShape, { d: number; p: number }> = {
  template: { d: 1220, p: 1780 },
  bespoke: { d: 1780, p: 2420 },
  shell: { d: 1220, p: 1780 },
};

const onePagePreview = (shape: PageShape) => (
  <Widths
    id={`one-page-${shape}`}
    ground="cinema"
    desktopH={ONE_PAGE_H[shape].d}
    phoneH={ONE_PAGE_H[shape].p}
    render={() => <OnePageOrFourPreview shape={shape} />}
  />
);

/* ── 2. The hero's picture ─────────────────────────────────────────────── */

const HERO_PICTURE_H: Record<HeroPictureShape, { d: number; p: number }> = {
  split: { d: 1160, p: 2040 },
  artifacts: { d: 820, p: 1560 },
  photos: { d: 1080, p: 1960 },
  phone: { d: 820, p: 1560 },
};

const heroPicturePreview = (shape: HeroPictureShape) => (
  <Widths
    id={`hero-picture-${shape}`}
    ground="cinema"
    desktopH={HERO_PICTURE_H[shape].d}
    phoneH={HERO_PICTURE_H[shape].p}
    render={() => <HeroPicturePreview shape={shape} />}
  />
);

/* ── 3. One hero (staged after the hero's picture) ────────────────────── */

const ONE_HERO_H: Record<OneHeroShape, { d: number; p: number }> = {
  today: { d: 1120, p: 1150 },
  "page-hero": { d: 1120, p: 1040 },
  "hub-on-type": { d: 610, p: 640 },
};

function oneHeroScreen(shape: OneHeroShape, state: BoardState) {
  const heroShape = heroPictureOf(state["hero-picture"]);
  return (
    <Widths
      id={`one-hero-${shape}`}
      ground="cinema"
      desktopH={ONE_HERO_H[shape].d}
      phoneH={ONE_HERO_H[shape].p}
      render={() => <OneHeroPreview shape={shape} heroShape={heroShape} />}
    />
  );
}

/* ── 4. Who is greeted ─────────────────────────────────────────────────── */

const WHO_GREETED_H: Record<WhoGreetedShape, { d: number; p: number }> = {
  host: { d: 1120, p: 1040 },
  "guest-line": { d: 1180, p: 1090 },
  "planner-line": { d: 1180, p: 1090 },
};

const whoGreetedPreview = (shape: WhoGreetedShape) => (
  <Widths
    id={`who-greeted-${shape}`}
    ground="cinema"
    desktopH={WHO_GREETED_H[shape].d}
    phoneH={WHO_GREETED_H[shape].p}
    render={() => <WhoGreetedPreview shape={shape} />}
  />
);

/* ── 5. The proof ──────────────────────────────────────────────────────── */

const PROOF_H: Record<ProofShape, { d: number; p: number }> = {
  reel: { d: 1100, p: 1080 },
  stats: { d: 1370, p: 1300 },
  story: { d: 780, p: 1710 },
  "demo-door": { d: 1300, p: 1340 },
};

const proofPreview = (shape: ProofShape) => (
  <Widths
    id={`the-proof-${shape}`}
    ground="cinema"
    desktopH={PROOF_H[shape].d}
    phoneH={PROOF_H[shape].p}
    render={() => <ProofPreview shape={shape} />}
  />
);

/* ── 6. How many ───────────────────────────────────────────────────────── */

const HOW_MANY_H: Record<HowManyShape, { d: number; p: number }> = {
  four: { d: 970, p: 1780 },
  five: { d: 1420, p: 2140 },
  three: { d: 1035, p: 1400 },
};

const howManyPreview = (shape: HowManyShape) => (
  <Widths
    id={`how-many-${shape}`}
    ground="cinema"
    desktopH={HOW_MANY_H[shape].d}
    phoneH={HOW_MANY_H[shape].p}
    render={() => <HowManyPreview shape={shape} />}
  />
);

/* ── 7. The directory (staged after the hero's picture) ───────────────── */

const DIRECTORY_H: Record<DirectoryShape, { d: number; p: number }> = {
  "tilt-two-up": { d: 940, p: 1900 },
  "four-across": { d: 480, p: 1560 },
  list: { d: 660, p: 700 },
};

function directoryScreen(shape: DirectoryShape, state: BoardState) {
  const heroShape = heroPictureOf(state["hero-picture"]);
  return (
    <Widths
      id={`directory-${shape}`}
      ground="cinema"
      desktopH={DIRECTORY_H[shape].d}
      phoneH={DIRECTORY_H[shape].p}
      render={() => <DirectoryPreview shape={shape} heroShape={heroShape} />}
    />
  );
}

/* ── 8. The phone (tile: "phone", one width only) ─────────────────────── */

const PHONE_H = 812;

const phonePreview = (shape: "measured" | "tightened" | "one-screen") => (
  <Scene id={`the-phone-${shape}`} w={375} h={PHONE_H} title="375">
    <PhonePreview shape={shape} />
  </Scene>
);

const PREVIEWS: PreviewsFor<typeof EVENT_TYPE_PAGES> = {
  "one-page-or-four.template": onePagePreview("template"),
  "one-page-or-four.bespoke": onePagePreview("bespoke"),
  "one-page-or-four.shell": onePagePreview("shell"),

  "hero-picture.split": heroPicturePreview("split"),
  "hero-picture.artifacts": heroPicturePreview("artifacts"),
  "hero-picture.photos": heroPicturePreview("photos"),
  "hero-picture.phone": heroPicturePreview("phone"),

  "one-hero.today": (s) => oneHeroScreen("today", s),
  "one-hero.page-hero": (s) => oneHeroScreen("page-hero", s),
  "one-hero.hub-on-type": (s) => oneHeroScreen("hub-on-type", s),

  "who-greeted.host": whoGreetedPreview("host"),
  "who-greeted.guest-line": whoGreetedPreview("guest-line"),
  "who-greeted.planner-line": whoGreetedPreview("planner-line"),

  "the-proof.reel": proofPreview("reel"),
  "the-proof.stats": proofPreview("stats"),
  "the-proof.story": proofPreview("story"),
  "the-proof.demo-door": proofPreview("demo-door"),

  "how-many.four": howManyPreview("four"),
  "how-many.five": howManyPreview("five"),
  "how-many.three": howManyPreview("three"),

  "directory.tilt-two-up": (s) => directoryScreen("tilt-two-up", s),
  "directory.four-across": (s) => directoryScreen("four-across", s),
  "directory.list": (s) => directoryScreen("list", s),

  "the-phone.measured": phonePreview("measured"),
  "the-phone.tightened": phonePreview("tightened"),
  "the-phone.one-screen": phonePreview("one-screen"),
};

export function EventTypePagesBoard() {
  return <ExplorationBoard spec={EVENT_TYPE_PAGES} previews={PREVIEWS} />;
}
