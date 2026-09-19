"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { ArcPreview, type ArcShape } from "./arc";
import { CardsPreview, type CardShape } from "./cards";
import { CONFERENCES, WEDDINGS } from "./fixtures";
import { HeroPreview, type HeroShape } from "./hero";
import { LadderPreview, type LadderShape } from "./ladder";
import { PhonePreview, type PhoneShape } from "./phone";
import { ProofPreview, type ProofShape } from "./proof";
import { Scene, Widths } from "./scene";
import { SECOND_GROUND, SecondPreview, type SecondShape } from "./second";
import { EVENT_IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option drawn as a CONCEPT on the real /events pieces
 * (`PageHero`, `EventHeroMedia`, `TypeDirectory`, `ReelAngleBand`,
 * `InlineReelPlayer`, `HelpPane`, `PaperChapter`, `CtaBand`) and the shared
 * engines the rest of the site already rides (`PhotoSection`, `AlbumStream`,
 * `River`, `SectionLight`), at 1440 and 375.
 *
 * ★ EVERY HEIGHT IS MEASURED, NEVER COMPUTED. The numbers below are read off
 * the rendered stage at localhost, and each scene prints its own measured
 * height and first-picture depth beneath the frame. PROGRAM.md's warning ("a
 * board once drew an option with its formula's sign backwards") is exactly what
 * a guessed height invites: a frame shorter than its concept cuts the concept
 * and the capture lies about where the page ends.
 *
 * ★ THREE DECISIONS ARE FUNCTIONS OF THE BOARD'S STATE. `second-section`,
 * `the-arc` and `the-phone` are staged, so their previews read the answers they
 * wait on out of the state the step hands them and draw inside that world.
 */

const heroOf = (v: unknown): HeroShape =>
  v === "room" || v === "arrival" || v === "object" || v === "today"
    ? v
    : "object";

const secondOf = (v: unknown): SecondShape =>
  v === "today" || v === "statement" || v === "beats" || v === "live"
    ? v
    : "statement";

/* ── 1. The hero's theme ───────────────────────────────────────────────── */

const HERO_H: Record<HeroShape, { d: number; p: number }> = {
  room: { d: 1600, p: 720 },
  arrival: { d: 2150, p: 860 },
  object: { d: 2110, p: 1020 },
  today: { d: 2130, p: 1040 },
};

const heroPreview = (shape: HeroShape) => (
  <Widths
    id={`hero-${shape}`}
    ground="cinema"
    desktopH={HERO_H[shape].d}
    phoneH={HERO_H[shape].p}
    render={(w) => (
      <HeroPreview
        shape={shape}
        width={w}
        worked={WEDDINGS}
        second={CONFERENCES}
      />
    )}
  />
);

/* ── 2. The second section (after the hero's theme) ─────────────────────── */

const SECOND_H: Record<SecondShape, { d: number; p: number }> = {
  today: { d: 540, p: 600 },
  statement: { d: 960, p: 1090 },
  beats: { d: 1680, p: 1890 },
  live: { d: 1070, p: 700 },
};

function secondScreen(shape: SecondShape, at: BoardState) {
  return (
    <Widths
      id={`second-${shape}`}
      ground={SECOND_GROUND[shape]}
      desktopH={SECOND_H[shape].d}
      phoneH={SECOND_H[shape].p}
      render={() => (
        <SecondPreview
          shape={shape}
          heroShape={heroOf(at["hero-theme"])}
          type={WEDDINGS}
        />
      )}
    />
  );
}

/* ── 3. The arc (after the second section) ──────────────────────────────── */

const ARC_H: Record<ArcShape, { d: number; p: number }> = {
  today: { d: 1830, p: 2380 },
  chapter: { d: 2000, p: 2600 },
  dark: { d: 1830, p: 2400 },
};

function arcScreen(shape: ArcShape, at: BoardState) {
  return (
    <Widths
      id={`arc-${shape}`}
      ground="cinema"
      desktopH={ARC_H[shape].d}
      phoneH={ARC_H[shape].p}
      render={(w) => (
        <ArcPreview
          shape={shape}
          second={secondOf(at["second-section"])}
          width={w}
          type={WEDDINGS}
        />
      )}
    />
  );
}

/* ── 4. The cards ──────────────────────────────────────────────────────── */

const CARDS_H: Record<CardShape, { d: number; p: number }> = {
  today: { d: 1040, p: 1780 },
  frame: { d: 1190, p: 1830 },
  stack: { d: 1160, p: 2180 },
  plate: { d: 1270, p: 2180 },
};

const cardsPreview = (shape: CardShape) => (
  <Widths
    id={`cards-${shape}`}
    ground="cinema"
    desktopH={CARDS_H[shape].d}
    phoneH={CARDS_H[shape].p}
    render={() => <CardsPreview shape={shape} />}
  />
);

/* ── 5. The proof ──────────────────────────────────────────────────────── */

const PROOF_H: Record<ProofShape, { d: number; p: number }> = {
  today: { d: 1100, p: 950 },
  flanked: { d: 1470, p: 1090 },
  landscape: { d: 1090, p: 770 },
  door: { d: 870, p: 1000 },
};

const proofPreview = (shape: ProofShape) => (
  <Widths
    id={`proof-${shape}`}
    ground="cinema"
    desktopH={PROOF_H[shape].d}
    phoneH={PROOF_H[shape].p}
    render={() => <ProofPreview shape={shape} type={WEDDINGS} />}
  />
);

/* ── 6. The ladder ─────────────────────────────────────────────────────── */

const LADDER_H: Record<LadderShape, { d: number; p: number }> = {
  today: { d: 1110, p: 1440 },
  reading: { d: 1150, p: 1470 },
  every: { d: 1170, p: 1520 },
};

const ladderPreview = (shape: LadderShape) => (
  <Widths
    id={`ladder-${shape}`}
    ground="cinema"
    desktopH={LADDER_H[shape].d}
    phoneH={LADDER_H[shape].p}
    render={() => <LadderPreview shape={shape} />}
  />
);

/* ── 7. The phone (tile: "phone", one width, the fold drawn) ───────────── */

const PHONE_H = 812;

function phoneScreen(shape: PhoneShape, at: BoardState) {
  return (
    <Scene
      id={`phone-${shape}`}
      w={375}
      h={PHONE_H}
      title="375"
      fold
      ground="cinema"
    >
      <PhonePreview
        shape={shape}
        heroShape={heroOf(at["hero-theme"])}
        type={WEDDINGS}
      />
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_IDENTITY> = {
  "hero-theme.room": heroPreview("room"),
  "hero-theme.arrival": heroPreview("arrival"),
  "hero-theme.object": heroPreview("object"),
  "hero-theme.today": heroPreview("today"),

  "second-section.today": (s) => secondScreen("today", s),
  "second-section.statement": (s) => secondScreen("statement", s),
  "second-section.beats": (s) => secondScreen("beats", s),
  "second-section.live": (s) => secondScreen("live", s),

  "the-arc.today": (s) => arcScreen("today", s),
  "the-arc.chapter": (s) => arcScreen("chapter", s),
  "the-arc.dark": (s) => arcScreen("dark", s),

  "the-cards.today": cardsPreview("today"),
  "the-cards.frame": cardsPreview("frame"),
  "the-cards.stack": cardsPreview("stack"),
  "the-cards.plate": cardsPreview("plate"),

  "the-proof.today": proofPreview("today"),
  "the-proof.flanked": proofPreview("flanked"),
  "the-proof.landscape": proofPreview("landscape"),
  "the-proof.door": proofPreview("door"),

  "the-ladder.today": ladderPreview("today"),
  "the-ladder.reading": ladderPreview("reading"),
  "the-ladder.every": ladderPreview("every"),

  "the-phone.words": (s) => phoneScreen("words", s),
  "the-phone.media": (s) => phoneScreen("media", s),
  "the-phone.split": (s) => phoneScreen("split", s),
};

export function EventIdentityBoard() {
  return <ExplorationBoard spec={EVENT_IDENTITY} previews={PREVIEWS} />;
}
