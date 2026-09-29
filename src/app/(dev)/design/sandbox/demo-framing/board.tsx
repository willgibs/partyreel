"use client";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";
import { OBJECT_CODE_PATH } from "@/components/marketing/sections/home/hero-stream";
import { SITE_URL } from "@/lib/constants/site";

import { AlbumPage, Welcome } from "./album";
import { MockLinkCard, type TouchId } from "./card";
import {
  ADDRESS_IDS,
  ADDRESSES,
  type AddressId,
  DEMO_PRINTS,
  demoAlbum,
  type Party,
  partiesFor,
  REST,
} from "./fixtures";
import { CARD_LAMP, HeroStage, HomeBlock, type Motion, QrBlock } from "./hero";
import { AddressPlate, PLATE_LAMP } from "./plate";
import {
  addressSays,
  albumSays,
  qrSays,
  Scene,
  Story,
  touchSays,
  welcomeSays,
} from "./scene";
import { LoopScore } from "./score";
import { Specimen } from "./specimen";
import { DEMO_FRAMING } from "./spec";
import { type Pace, type Score, scoreOf } from "./typing";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole where it lives, the
 * home's real first screen with a mock of the card (or the address on the
 * stage) in its object slot, the QR code page's hero where an option moves the
 * stream there, and the demo album's first screen as a phone opens it. Every
 * frame is titled with its option's own name, read off the spec, and every
 * caption is read off the frame.
 *
 * ★ EACH DECISION IS DRAWN IN THE WORLD THE OTHERS HOLD (`exploration.ts`'s
 * `Preview`). The address is drawn still, on the card and in the album it
 * opens; the stage is drawn in the address picked; the touch is drawn on the
 * object the stage leaves on the home (the card, or the address on the stage)
 * and in its motion. Before an answer, an axis wears its control's default:
 * today's still stage, the recommended address and touch.
 */

type StageId = "still" | "turns" | "together" | "centre";
const STAGE_IDS: readonly StageId[] = ["still", "turns", "together", "centre"];
const TOUCH_IDS: readonly TouchId[] = ["lift", "arrow", "live", "lamp"];

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

const addressOf = (s: BoardState) =>
  pick<AddressId>(ADDRESS_IDS, s.slug, "our-party");
const stageOf = (s: BoardState) => pick<StageId>(STAGE_IDS, s.stage, "still");
const touchOf = (s: BoardState) => pick<TouchId>(TOUCH_IDS, s.touch, "arrow");

/** An option's own name, off the spec, so a frame's title and its tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = DEMO_FRAMING.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** What the card's code encodes: the demo's short door, as it ships. */
const DEMO_CODE = `${SITE_URL}${OBJECT_CODE_PATH}`;

/**
 * HOW LONG AN ADDRESS STANDS, per stage. `turns` stands longest, because the
 * stream runs full only while an address stands (its score prints the share
 * of the loop it gets); `together` long enough for a few of each party's
 * photographs to leave the card before the next address lands; `centre` just
 * past its deal, since there the address is the whole show.
 */
const PACE: Record<Exclude<StageId, "still">, Pace> = {
  turns: { hold: 3800, restHold: 5000 },
  together: { hold: 3600, restHold: 4400 },
  centre: { hold: 2800, restHold: 3600 },
};

/**
 * One table per world, made once: the hero's loop restarts when its score or
 * its parties change identity, so a preview drawn twice must hand it the same
 * objects.
 */
const PARTIES = new Map<AddressId, readonly Party[]>();
const partiesOf = (a: AddressId) => {
  let p = PARTIES.get(a);
  if (!p) PARTIES.set(a, (p = partiesFor(a)));
  return p;
};
const SCORES = new Map<string, Score | null>();
const scoreFor = (stage: StageId, a: AddressId): Score | null => {
  const key = `${stage}:${a}`;
  if (!SCORES.has(key))
    SCORES.set(
      key,
      stage === "still"
        ? null
        : scoreOf(
            partiesOf(a).map((p) => p.slug),
            PACE[stage],
          ),
    );
  return SCORES.get(key) ?? null;
};

const motionOf = (stage: StageId): Motion =>
  stage === "centre" ? "stage" : stage;

/** Every address a world's object prints: the demo's own, then those it types. */
const addressesOf = (stage: StageId, a: AddressId) =>
  stage === "still"
    ? [ADDRESSES[a].slug]
    : (scoreFor(stage, a)?.addresses ?? [ADDRESSES[a].slug]);

/**
 * THE HOME'S FIRST SCREEN in one world: the address, the stage and the touch.
 * `still` keeps the stage's object and its stream but types nothing, which is
 * how the address itself is judged: as reduced motion and a first paint show it.
 */
function Home({
  address,
  stage,
  touch,
  still = false,
}: {
  address: AddressId;
  stage: StageId;
  touch: TouchId;
  still?: boolean;
}) {
  const parties = partiesOf(address);
  const motion = motionOf(stage);
  return (
    <HeroStage
      motion={motion}
      score={still ? null : scoreFor(stage, address)}
      parties={parties}
      touch={touch}
      lamp={stage === "centre" ? PLATE_LAMP : CARD_LAMP}
      block={<HomeBlock />}
      object={(live) =>
        stage === "centre" ? (
          <AddressPlate
            slug={parties[0].slug}
            prints={parties[live.standing]?.prints ?? DEMO_PRINTS}
            dealt={live.dealt}
            touch={touch}
            lifted={live.lifted}
            still={live.still}
          />
        ) : (
          <MockLinkCard
            slug={parties[0].slug}
            // Only `together` turns the prints to the party typed; `turns`
            // keeps the demo's own four, so its card holds still.
            prints={
              motion === "together"
                ? (parties[live.standing]?.prints ?? DEMO_PRINTS)
                : DEMO_PRINTS
            }
            rest={REST}
            code={DEMO_CODE}
            touch={touch}
            lifted={live.lifted}
            still={live.still}
          />
        )
      }
    />
  );
}

/** THE QR CODE PAGE'S HERO, where `centre` moves the card and its stream. */
function QrPage({ address, touch }: { address: AddressId; touch: TouchId }) {
  const parties = partiesOf(address);
  return (
    <HeroStage
      motion="still"
      score={null}
      parties={parties}
      touch={touch}
      lamp={CARD_LAMP}
      eyebrow
      block={<QrBlock />}
      object={(live) => (
        <MockLinkCard
          slug={parties[0].slug}
          prints={DEMO_PRINTS}
          rest={REST}
          code={DEMO_CODE}
          touch={touch}
          lifted={live.lifted}
          still={live.still}
        />
      )}
    />
  );
}

/**
 * THE FOUR PRINTS AT REST, NAMED: every photograph is a stand-in, so the
 * board says what the month makes for each (ASSETS rows 33 and 34).
 */
function Makes() {
  return (
    <p className="max-w-3xl text-sm text-pretty text-muted-foreground">
      Every photograph is a stand-in from the band&rsquo;s stills, and the kit
      is replaced before launch. The card&rsquo;s four prints at rest are four
      kinds of party:{" "}
      {DEMO_PRINTS.map((p) => `${p.makes} (standing in: ${p.photo})`).join(
        "; ",
      )}
      .
    </p>
  );
}

/* ── 1. The address ───────────────────────────────────────────────────── */

function slugPreview(s: BoardState, option: AddressId): ReactNode {
  const name = LABEL("slug", option);
  const touch = touchOf(s);
  // The address is judged still, on whatever object the stage leaves on the
  // home: the card, or (once `centre` is picked) the address on the stage.
  const stage = stageOf(s);
  const album = demoAlbum(option);
  const says = addressSays(stage === "centre" ? "The address" : "The card", [
    ADDRESSES[option].slug,
  ]);
  const key = `${option}-${touch}-${stage}`;
  return (
    <Story
      desk={
        <Scene
          id={`df-slug-${key}-desk`}
          screen="1440"
          title={`${name}: the home at 1440, still`}
          measure={says}
        >
          <Home address={option} stage={stage} touch={touch} still />
        </Scene>
      }
      phones={
        <>
          <Scene
            id={`df-slug-${key}-phone`}
            screen="375"
            title={`${name}: the home at 375`}
            measure={says}
          >
            <Home address={option} stage={stage} touch={touch} still />
          </Scene>
          <Scene
            id={`df-slug-${option}-album`}
            screen="375"
            title={`${name}: the album it opens`}
            measure={albumSays}
          >
            <AlbumPage album={album} />
          </Scene>
          <Scene
            id={`df-slug-${option}-welcome`}
            screen="375"
            title={`${name}: the demo's welcome`}
            measure={welcomeSays}
          >
            <AlbumPage album={album} overlay={<Welcome album={album} />} />
          </Scene>
        </>
      }
      note={<Makes />}
    />
  );
}

/* ── 2. The address and the stream ────────────────────────────────────── */

function stagePreview(s: BoardState, option: StageId): ReactNode {
  const address = addressOf(s);
  const touch = touchOf(s);
  const name = LABEL("stage", option);
  const what = option === "centre" ? "The address" : "The card";
  const says = addressSays(what, addressesOf(option, address));
  const key = `${option}-${address}-${touch}`;
  return (
    <Story
      desk={
        <Scene
          id={`df-stage-${key}-desk`}
          screen="1440"
          title={`${name}: the home at 1440`}
          measure={says}
        >
          <Home address={address} stage={option} touch={touch} />
        </Scene>
      }
      score={
        <LoopScore
          motion={motionOf(option)}
          score={scoreFor(option, address)}
        />
      }
      phones={
        <>
          <Scene
            id={`df-stage-${key}-phone`}
            screen="375"
            title={`${name}: the home at 375`}
            measure={says}
          >
            <Home address={address} stage={option} touch={touch} />
          </Scene>
          {option === "centre" ? (
            <Scene
              id={`df-stage-${key}-qr-phone`}
              screen="375"
              title={`${name}: the QR code page at 375`}
              measure={qrSays([ADDRESSES[address].slug])}
            >
              <QrPage address={address} touch={touch} />
            </Scene>
          ) : null}
        </>
      }
      after={
        option === "centre" ? (
          <Scene
            id={`df-stage-${key}-qr-desk`}
            screen="1440"
            title={`${name}: the QR code page at 1440, where the card and its stream go`}
            measure={qrSays([ADDRESSES[address].slug])}
          >
            <QrPage address={address} touch={touch} />
          </Scene>
        ) : undefined
      }
    />
  );
}

/* ── 3. What says the card opens ──────────────────────────────────────── */

function touchPreview(s: BoardState, option: TouchId): ReactNode {
  const address = addressOf(s);
  const stage = stageOf(s);
  const name = LABEL("touch", option);
  const plate = stage === "centre";
  const slug = ADDRESSES[address].slug;
  const says = addressSays(
    plate ? "The address" : "The card",
    addressesOf(stage, address),
  );
  const key = `${option}-${address}-${stage}`;
  return (
    <Story
      desk={
        <Scene
          id={`df-touch-${key}-close`}
          screen={plate ? "plate" : "card"}
          title={`${name}: the ${plate ? "address" : "card"} at a desk, at rest and under the pointer`}
          measure={touchSays}
        >
          <Specimen
            touch={option}
            lamp={plate ? PLATE_LAMP : CARD_LAMP}
            stacked={plate}
            object={(lifted) =>
              plate ? (
                <AddressPlate
                  slug={slug}
                  prints={DEMO_PRINTS}
                  dealt
                  touch={option}
                  lifted={lifted}
                  still
                />
              ) : (
                <MockLinkCard
                  slug={slug}
                  prints={DEMO_PRINTS}
                  rest={REST}
                  code={DEMO_CODE}
                  touch={option}
                  lifted={lifted}
                  still
                />
              )
            }
          />
        </Scene>
      }
      phones={
        <Scene
          id={`df-touch-${key}-phone`}
          screen="375"
          title={`${name}: the home at 375, where there is no pointer`}
          measure={says}
        >
          <Home address={address} stage={stage} touch={option} />
        </Scene>
      }
      after={
        <Scene
          id={`df-touch-${key}-desk`}
          screen="1440"
          title={`${name}: the home at 1440 (point at the ${plate ? "address" : "card"} to lift it)`}
          measure={says}
        >
          <Home address={address} stage={stage} touch={option} />
        </Scene>
      }
    />
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DEMO_FRAMING> = {
  "slug.our-party": (s) => slugPreview(s, "our-party"),
  "slug.my-party": (s) => slugPreview(s, "my-party"),
  "slug.our-big-night": (s) => slugPreview(s, "our-big-night"),
  "slug.our-wedding": (s) => slugPreview(s, "our-wedding"),

  "stage.still": (s) => stagePreview(s, "still"),
  "stage.turns": (s) => stagePreview(s, "turns"),
  "stage.together": (s) => stagePreview(s, "together"),
  "stage.centre": (s) => stagePreview(s, "centre"),

  "touch.lift": (s) => touchPreview(s, "lift"),
  "touch.arrow": (s) => touchPreview(s, "arrow"),
  "touch.live": (s) => touchPreview(s, "live"),
  "touch.lamp": (s) => touchPreview(s, "lamp"),
};

export function DemoFramingBoard() {
  return <ExplorationBoard spec={DEMO_FRAMING} previews={PREVIEWS} />;
}
