"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { OBJECT_CODE_PATH } from "@/components/marketing/sections/home/hero-stream";
import { SITE_URL } from "@/lib/constants/site";

import { AlbumPage, Welcome } from "./album";
import { MockLinkCard } from "./card";
import {
  type Album,
  albumOf,
  DEMO_TODAY,
  NAMES_IDS,
  type NamesId,
  restOf,
  STORIES,
  STORY_IDS,
  type Story,
  type StoryId,
} from "./fixtures";
import { HomeHero } from "./hero";
import {
  albumSays,
  cardSays,
  Scene,
  Story as Frames,
  welcomeSays,
} from "./scene";
import { DEMO_FRAMING } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole where it lives, the
 * home's real first screen with a mock of the link card in its object slot,
 * and the demo album's first screen as a phone opens it. Every frame is titled
 * with its option's own name, read off the spec, and every caption is read off
 * the frame.
 *
 * ★ EACH DECISION IS DRAWN IN THE WORLD THE OTHERS HOLD (`exploration.ts`'s
 * `Preview`). The party is drawn in today's kind of name until the name is
 * answered; the name is drawn in the party picked; which event opens is drawn
 * in both. And where the card opens today's demo (`picture`), every drawing
 * says so: the card prints the demo's own link and opens its album, so a name
 * that no longer reaches the card is seen not to.
 */

type DemoId = "one" | "hero" | "picture";

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

const storyOf = (s: BoardState): Story =>
  STORIES[pick<StoryId>(STORY_IDS, s.story, "wedding")];
const namesOf = (s: BoardState) =>
  pick<NamesId>(NAMES_IDS, s.names, "first-names");
const demoOf = (s: BoardState) =>
  pick<DemoId>(["one", "hero", "picture"], s.demo, "one");

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
 * THE CARD AND THE ALBUM IT OPENS, in one world: the party, its name and which
 * event the card reaches. A hero event of its own carries its own code (the
 * short door stays the general demo's); a card that pictures a party prints
 * the demo's own link and opens its album.
 */
function worldOf(story: Story, names: NamesId, demo: DemoId) {
  const party = albumOf(story, names);
  // A pictured party keeps its prints and its count: only the link is the
  // demo's, which is exactly the seam that option is asked about.
  const card = (
    <MockLinkCard
      slug={demo === "picture" ? DEMO_TODAY.naming.slug : party.naming.slug}
      prints={story.prints}
      rest={restOf(story.guests)}
      code={demo === "hero" ? `${SITE_URL}/e/${party.naming.slug}` : DEMO_CODE}
    />
  );
  const opens: Album = demo === "picture" ? DEMO_TODAY : party;
  const elsewhere: Album = demo === "one" ? party : DEMO_TODAY;
  return { card, opens, elsewhere };
}

/** The four the month makes, under a party's frames. */
function Makes({ story }: { story: Story }) {
  return (
    <p className="max-w-3xl text-sm text-pretty text-muted-foreground">
      Stand-ins from the band&rsquo;s stills. The month makes the four prints:{" "}
      {story.prints.map((p) => p.makes).join("; ")}.
    </p>
  );
}

/* ── 1. The party ─────────────────────────────────────────────────────── */

function storyPreview(s: BoardState, option: StoryId): ReactNode {
  const story = STORIES[option];
  const name = LABEL("story", option);
  const { card, opens } = worldOf(story, namesOf(s), demoOf(s));
  return (
    <Frames
      desk={
        <Scene
          id={`df-story-${option}-desk`}
          screen="1440"
          title={`${name}: the home at 1440, the card a mock over LinkCard's pieces`}
          measure={cardSays}
        >
          <HomeHero card={card} />
        </Scene>
      }
      phones={
        <>
          <Scene
            id={`df-story-${option}-phone`}
            screen="375"
            title={`${name}: the home at 375`}
            measure={cardSays}
          >
            <HomeHero card={card} />
          </Scene>
          <Scene
            id={`df-story-${option}-album`}
            screen="375"
            title={`${name}: the album it opens`}
            measure={albumSays}
          >
            <AlbumPage album={opens} />
          </Scene>
        </>
      }
      note={<Makes story={story} />}
    />
  );
}

/* ── 2. What it is called ─────────────────────────────────────────────── */

function namesPreview(s: BoardState, option: NamesId): ReactNode {
  const story = storyOf(s);
  const name = LABEL("names", option);
  const { card, opens } = worldOf(story, option, demoOf(s));
  return (
    <Frames
      phones={
        <>
          <Scene
            id={`df-names-${story.id}-${option}-card`}
            screen="375"
            title={`${name}: the card at 375`}
            measure={cardSays}
          >
            <HomeHero card={card} />
          </Scene>
          <Scene
            id={`df-names-${story.id}-${option}-welcome`}
            screen="375"
            title={`${name}: the demo's welcome`}
            measure={welcomeSays}
          >
            <AlbumPage album={opens} overlay={<Welcome album={opens} />} />
          </Scene>
          <Scene
            id={`df-names-${story.id}-${option}-album`}
            screen="375"
            title={`${name}: the album's head`}
            measure={albumSays}
          >
            <AlbumPage album={opens} />
          </Scene>
        </>
      }
      note={
        <p className="text-sm text-muted-foreground">
          The tab and a pasted link say &ldquo;Add photos to{" "}
          {opens.naming.title}&rdquo;.
        </p>
      }
    />
  );
}

/* ── 3. Which event it opens ──────────────────────────────────────────── */

function demoPreview(s: BoardState, option: DemoId): ReactNode {
  const story = storyOf(s);
  const names = namesOf(s);
  const name = LABEL("demo", option);
  const { card, opens, elsewhere } = worldOf(story, names, option);
  return (
    <Frames
      phones={
        <>
          <Scene
            id={`df-demo-${story.id}-${names}-${option}-card`}
            screen="375"
            title={`${name}: the card`}
            measure={cardSays}
          >
            <HomeHero card={card} />
          </Scene>
          <Scene
            id={`df-demo-${story.id}-${names}-${option}-opens`}
            screen="375"
            title={`${name}: pressing the card`}
            measure={albumSays}
          >
            <AlbumPage album={opens} />
          </Scene>
          <Scene
            id={`df-demo-${story.id}-${names}-${option}-elsewhere`}
            screen="375"
            title={`${name}: the footer, the nav and the event pages`}
            measure={albumSays}
          >
            <AlbumPage album={elsewhere} />
          </Scene>
        </>
      }
    />
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DEMO_FRAMING> = {
  "story.wedding": (s) => storyPreview(s, "wedding"),
  "story.birthday": (s) => storyPreview(s, "birthday"),
  "story.weekend": (s) => storyPreview(s, "weekend"),
  "story.reunion": (s) => storyPreview(s, "reunion"),
  "story.work": (s) => storyPreview(s, "work"),

  "names.first-names": (s) => namesPreview(s, "first-names"),
  "names.voice": (s) => namesPreview(s, "voice"),
  "names.occasion": (s) => namesPreview(s, "occasion"),
  "names.family": (s) => namesPreview(s, "family"),
  "names.playful": (s) => namesPreview(s, "playful"),

  "demo.one": (s) => demoPreview(s, "one"),
  "demo.hero": (s) => demoPreview(s, "hero"),
  "demo.picture": (s) => demoPreview(s, "picture"),
};

export function DemoFramingBoard() {
  return <ExplorationBoard spec={DEMO_FRAMING} previews={PREVIEWS} />;
}
