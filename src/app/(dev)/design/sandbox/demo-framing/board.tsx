"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, optionId, optionLabel } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { PARTIES } from "./fixtures";
import { HeroStage, HomeBlock } from "./hero";
import { HeroObject, type TakeId } from "./objects";
import { heroSays, Scene, type ScreenId, Story, touchSays } from "./scene";
import { LoopScore } from "./score";
import { Specimen } from "./specimen";
import { DEMO_FRAMING } from "./spec";
import { type Score, scoreOf } from "./typing";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each hero drawn whole where it lives, the
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
const OBJECT: Record<TakeId, { lane: string; says: string }> = {
  card: {
    lane: "The card",
    says: "the card holds the arriving party's light while its name types on it, and the photograph develops in as the address lands, its faces, counts and code with it",
  },
  plate: {
    lane: "The pane",
    says: "the pane holds the party standing while the next address types, and as it lands the code is rewritten in a ripple from its heart and the glass relit by the new party's photograph",
  },
  door: {
    lane: "The door",
    says: "the door stands ajar in the arriving party's light while its address types, and swings open on the new party's cover as it lands",
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
function Home({ hero }: { hero: TakeId }) {
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
function Close({ hero, lifted }: { hero: TakeId; lifted: boolean }) {
  const party = PARTIES[0];
  return (
    <HeroObject
      take={hero}
      parties={PARTIES}
      live={{
        party,
        coming: party,
        addresses: ADDRESSES,
        up: true,
        lifted,
        still: true,
      }}
    />
  );
}

const SCREEN_NAME: Record<Exclude<ScreenId, "close">, string> = {
  "1440": "the home at 1440",
  tablet: "the home on a tablet held upright",
  "375": "the home at 375",
};

function stagePreview(take: TakeId): ReactNode {
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
  "stage.card": stagePreview("card"),
  "stage.plate": stagePreview("plate"),
  "stage.door": stagePreview("door"),
};

export function DemoFramingBoard() {
  return <ExplorationBoard spec={DEMO_FRAMING} previews={PREVIEWS} />;
}
