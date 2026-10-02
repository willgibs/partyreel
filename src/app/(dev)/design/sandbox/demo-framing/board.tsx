"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, optionId, optionLabel } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { PARTIES } from "./fixtures";
import { HeroStage, HomeBlock } from "./hero";
import { HeroObject, LINE, LinkLine, at, type TakeId } from "./objects";
import { heroSays, Scene, type ScreenId, Story, touchSays } from "./scene";
import { type Album, LoopScore } from "./score";
import { Specimen } from "./specimen";
import { DEMO_FRAMING } from "./spec";
import { WallObject, WallStage } from "./tiles";
import { type Score, scoreOf } from "./typing";

/** Every hero on the board: the objects on the stream, and the wall. */
type HeroId = TakeId | "wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every hero drawn whole where it lives, the
 * home's real first screen at 1440, at a tablet held upright and at 375, with
 * its loop's score under the laptop and its object close at a desk, at rest
 * and under the pointer. Every frame is titled with its option's own name,
 * read off the spec, and every caption is read off the frame.
 */

/** Every address the loop types, the demo's own first. */
const ADDRESSES = PARTIES.map((p) => p.slug);

/**
 * One score for every hero, made once (the loop restarts when its score
 * changes identity): an address stands long enough for its warp to settle
 * and its album to turn over, and the demo's own stands first and longest.
 */
const SCORE: Score = scoreOf(ADDRESSES, { hold: 4400, restHold: 5400 });

/** What each hero's object does at each turn, for its lane of the score. */
const OBJECT: Record<HeroId, { lane: string; says: string; album: Album }> = {
  plate: {
    lane: "The code",
    says: "while an address stands its code stands, lit, blooming out of its party's picture as it lands; the tile goes dark to glass while the next is typed",
    album: "stream",
  },
  card: {
    lane: "The card",
    says: "the card types its name along with the address, its event soft until the address lands and the new party's cover sharpens in",
    album: "stream",
  },
  field: {
    lane: "The code",
    says: "the field's code blooms with each address that lands until a visitor takes the field, when their own pause is the landing",
    album: "stream",
  },
  door: {
    lane: "The door",
    says: "the door stands open on its party's light and album while its address stands, swings to as the next is typed and opens on the new party as it lands",
    album: "stream",
  },
  wall: {
    lane: "The code",
    says: "the code at the album's heart folds as an address is erased and blooms as the next lands",
    album: "wall",
  },
};

/** An option's own name, off the spec, so a frame's title and its tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = DEMO_FRAMING.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** THE HOME'S FIRST SCREEN, wearing one hero. */
function Home({ hero }: { hero: HeroId }) {
  if (hero === "wall")
    return (
      <WallStage
        score={SCORE}
        parties={PARTIES}
        addresses={ADDRESSES}
        block={<HomeBlock />}
      />
    );
  return (
    <HeroStage
      take={hero}
      score={SCORE}
      parties={PARTIES}
      addresses={ADDRESSES}
      block={<HomeBlock />}
    />
  );
}

/** A hero's object close, still, at rest or lifted, under the demo's lamp. */
function Close({ hero, lifted }: { hero: HeroId; lifted: boolean }) {
  const party = PARTIES[0];
  if (hero === "wall")
    return (
      <span className="flex flex-col items-center">
        <WallObject party={party} lifted={lifted} still />
        <span
          className="flex items-center"
          style={{ marginTop: 22, height: at(LINE) }}
        >
          <LinkLine
            slug={party.slug}
            addresses={ADDRESSES}
            night
            lifted={lifted}
          />
        </span>
      </span>
    );
  return (
    <HeroObject
      take={hero}
      parties={PARTIES}
      live={{ party, addresses: ADDRESSES, up: true, lifted, still: true }}
    />
  );
}

const SCREEN_NAME: Record<Exclude<ScreenId, "close">, string> = {
  "1440": "the home at 1440",
  tablet: "the home on a tablet held upright",
  "375": "the home at 375",
};

function stagePreview(take: HeroId): ReactNode {
  const name = LABEL("stage", take);
  const says = heroSays(SCORE.addresses);
  const home = (screen: Exclude<ScreenId, "close">) => (
    <Scene
      id={`df-stage-${take}-${screen}`}
      screen={screen}
      title={`${name}: ${SCREEN_NAME[screen]}`}
      measure={says}
    >
      <Home hero={take} />
    </Scene>
  );
  return (
    <Story
      desk={home("1440")}
      score={
        <LoopScore
          score={SCORE}
          album={OBJECT[take].album}
          object={OBJECT[take].lane}
          caption={OBJECT[take].says}
        />
      }
      row={
        <>
          {home("tablet")}
          {home("375")}
        </>
      }
      after={
        <Scene
          id={`df-stage-${take}-close`}
          screen="close"
          title={`${name}: close at a desk, at rest and under the pointer`}
          measure={touchSays}
        >
          <Specimen
            party={PARTIES[0]}
            object={(lifted) => <Close hero={take} lifted={lifted} />}
          />
        </Scene>
      }
    />
  );
}

const PREVIEWS: PreviewsFor<typeof DEMO_FRAMING> = {
  "stage.plate": stagePreview("plate"),
  "stage.card": stagePreview("card"),
  "stage.field": stagePreview("field"),
  "stage.wall": stagePreview("wall"),
  "stage.door": stagePreview("door"),
};

export function DemoFramingBoard() {
  return <ExplorationBoard spec={DEMO_FRAMING} previews={PREVIEWS} />;
}
