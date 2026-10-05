"use client";

import "./customize.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { AccountUsual } from "./account";
import { GuestAlbum, HubAlbum } from "./album";
import { GuestCamera } from "./camera";
import { AddStep, NameStepFrom } from "./create";
import {
  AT_THE_PARTY,
  ALBUM_COUNT,
  DINNER_ROLL,
  NIGHT,
  OTHER_ROLL,
  type Photo,
  THIRTIETH,
  WEDDING,
  WEDDING_ROLL,
} from "./fixtures";
import { type Screen, screenOf } from "./knobs";
import { type RollWay } from "./roll-control";
import {
  AlbumPage,
  AddsWithRoll,
  FirstScreen,
  MoreFold,
  SettingsScene,
  weddingEvent,
} from "./settings";
import {
  find,
  findAll,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
  wordsIn,
} from "./scene";
import { CUSTOMIZE } from "./spec";

/**
 * THE PREVIEWS, one per option, every frame production's own surface with
 * only the option's piece added (`spec.ts` says what each decision is):
 *
 *  - `roll`: Settings' What guests can add for the wedding (12 picked), Create
 *    for a dinner of eight (a bigger roll picked), and a guest's camera on a
 *    roll of 12 and of 36 (production's camera parts round a still);
 *  - `home`: Settings' first screen and the place each new choice is made;
 *  - `mine`: where Maya makes a choice her usual, then Create opening on it;
 *  - `order`: Priya's album at the party and the morning after.
 *
 * ★ STAND-INS, SAID ONCE: the photographs are the marketing stills (bible 9),
 * the camera's picture is one of them (a lab frame never opens a camera), the
 * hub behind Settings is quoted, and every write and link is inert.
 */

/* ── what the frames read ──────────────────────────────────────────────── */

/** The roll's control: which way, what it holds, and what it shows picked. */
const readRoll = (root: HTMLElement): string | null => {
  const roll = find(root, "[data-cz-roll]");
  if (!roll) return null;
  const on = findAll(root, "[data-cz-film][data-state='on']").map(
    (b) => b.dataset.czFilm,
  );
  const stepper = find(root, "[data-cz-stepper]");
  const winder = find(root, "[data-cz-winder]");
  return parts(
    `the roll's control (${roll.dataset.czRoll}) holds ${roll.dataset.czValue}`,
    on.length ? `the ${on[0]} box picked` : undefined,
    stepper ? `a stepper at ${stepper.dataset.czStepper}` : undefined,
    winder ? `the counter wound to ${winder.dataset.czWinder}` : undefined,
  );
};

const readSettingsPage: Reader = (root) => {
  const page = find(root, "[data-settings-page]");
  if (!page) return null;
  const card = find(root, "[data-album-style='disposable']");
  const offers = findAll(root, "[data-cz-offer]").map((o) => textOf(o));
  return parts(
    `Settings, ${page.dataset.settingsPage}`,
    card ? `Disposable says "${textOf(card)}"` : undefined,
    find(root, "[data-cz-roll]") ? readRoll(root) : undefined,
    offers.length ? `offers: ${offers.join(" | ")}` : undefined,
    `${wordsIn(page)} words on the page`,
  );
};

const readFirst: Reader = (root) => {
  const first = find(root, "[data-cz-first]");
  if (!first) return null;
  const sentences = findAll(root, "[data-settings-sentence]").map(textOf);
  const menu = find(root, "[role='menu']");
  return parts(
    `${sentences.length} sentences`,
    sentences.join(" / "),
    menu ? `a menu open: ${textOf(menu)}` : undefined,
  );
};

const readCreate: Reader = (root) => {
  const room = find(root, "[data-room]");
  if (!room) return null;
  const head = textOf(find(root, "[data-room-name]"));
  const picked = find(root, "[data-cz-style][data-state='on']");
  const develop = find(root, "[data-cz-develop]");
  const usual = find(root, "[data-cz-usual]");
  const starts = find(root, "[data-cz-starts]");
  const start = find(root, "[data-cz-start]");
  const body = find(root, "[data-room-body]");
  const over = body ? body.scrollHeight - body.clientHeight : 0;
  return parts(
    `Create, ${room.dataset.room} step${head ? `, for ${head}` : ""}`,
    picked ? `${picked.dataset.czStyle} picked` : undefined,
    develop ? `develops ${develop.dataset.czDevelop}` : undefined,
    find(root, "[data-cz-roll]") ? readRoll(root) : undefined,
    usual ? `"${textOf(usual)}"` : undefined,
    starts ? textOf(starts) : undefined,
    start ? `starts from ${start.dataset.czStart}` : undefined,
    over > 1 ? `THE ROOM SCROLLS by ${Math.round(over)} px` : undefined,
  );
};

const readCamera: Reader = (root) => {
  const cam = find(root, "[data-cz-camera]");
  const caption = find(root, "[data-cam-caption]");
  const count = find(root, "[data-cam-count]");
  if (!cam || !caption || !count) return null;
  return parts(
    `a roll of ${cam.dataset.czCamera}: "${textOf(caption)}"`,
    `"${textOf(count)}" beside the shutter`,
    `${findAll(root, ".cam-cell").length} frames on the reel`,
    textOf(find(root, "[data-cam-sub]")),
  );
};

const readAlbum: Reader = (root) => {
  const tiles = findAll(root, "[data-cz-tile]");
  if (!tiles.length) return null;
  const line = find(root, "[data-cz-album-line]");
  const menu = find(root, "[role='menu']");
  return parts(
    `opens on ${tiles
      .slice(0, 3)
      .map((t) => t.dataset.czTile)
      .join(", ")}`,
    `${tiles.length} photographs laid`,
    line ? `the album says "${textOf(line)}"` : undefined,
    menu ? `a menu open: ${textOf(menu)}` : undefined,
  );
};

const readAccount: Reader = (root) => {
  const card = find(root, "[data-cz-new-parties]");
  if (!card) return null;
  return parts(
    `Account: ${findAll(root, "[data-cz-usual-row]")
      .map((r) => textOf(r))
      .join(" / ")}`,
    find(root, "[data-cz-roll]") ? readRoll(root) : undefined,
  );
};

/* ── the roll ──────────────────────────────────────────────────────────── */

/** The bigger roll a dinner of eight picks in each way: film tops out at 36. */
const DINNER: Record<RollWay, number> = {
  film: DINNER_ROLL,
  count: OTHER_ROLL,
  both: OTHER_ROLL,
  wind: OTHER_ROLL,
};

function RollStory({ way, screen }: { way: RollWay; screen: Screen }) {
  return (
    <Story screen={screen}>
      <Scene
        id={`cz-roll-settings-${way}`}
        screen={screen}
        title="Settings: the wedding of 150, 12 each"
        measure={readSettingsPage}
      >
        <SettingsScene screen={screen} page="What guests can add">
          <AddsWithRoll way={way} start={WEDDING_ROLL} />
        </SettingsScene>
      </Scene>
      <Scene
        id={`cz-roll-create-${way}`}
        screen={screen}
        title={`Create: a dinner for eight, ${DINNER[way]} each`}
        measure={readCreate}
      >
        <AddStep
          name="Dinner at Maya's"
          way={way}
          roll={DINNER[way]}
          develop="9 am tomorrow"
        />
      </Scene>
      <Scene
        id="cz-camera-12"
        screen="375"
        title="A guest's camera, a roll of 12"
        measure={readCamera}
      >
        <GuestCamera roll={12} frame={10} />
      </Scene>
      <Scene
        id="cz-camera-36"
        screen="375"
        title="A guest's camera, a roll of 36"
        measure={readCamera}
      >
        <GuestCamera roll={36} frame={10} />
      </Scene>
    </Story>
  );
}

/* ── where a choice lives ──────────────────────────────────────────────── */

type Home = "words" | "rows" | "album" | "more";

function TodayFirst({ screen, id }: { screen: Screen; id: string }) {
  return (
    <Scene
      id={id}
      screen={screen}
      title="Settings' first screen, as today"
      measure={readFirst}
    >
      <SettingsScene screen={screen} page={null}>
        <FirstScreen words={false} />
      </SettingsScene>
    </Scene>
  );
}

function HomeStory({ home, screen }: { home: Home; screen: Screen }) {
  if (home === "words")
    return (
      <Story screen={screen}>
        <Scene
          id="cz-home-words"
          screen={screen}
          title="Settings: the party in five sentences"
          measure={readFirst}
        >
          <SettingsScene screen={screen} page={null}>
            <FirstScreen words />
          </SettingsScene>
        </Scene>
        <Scene
          id="cz-home-words-take"
          screen={screen}
          title="Pressing what guests take home"
          measure={readFirst}
        >
          <SettingsScene screen={screen} page={null}>
            <FirstScreen words open="take" />
          </SettingsScene>
        </Scene>
      </Story>
    );
  if (home === "rows")
    return (
      <Story screen={screen}>
        <TodayFirst screen={screen} id="cz-home-rows-first" />
        <Scene
          id="cz-home-rows-page"
          screen={screen}
          title="The album, a page of its own"
          measure={readSettingsPage}
        >
          <SettingsScene screen={screen} page="The album">
            <AlbumPage />
          </SettingsScene>
        </Scene>
      </Story>
    );
  if (home === "album")
    return (
      <Story screen={screen}>
        <TodayFirst screen={screen} id="cz-home-album-first" />
        <Scene
          id="cz-home-album-hub"
          screen={screen}
          title="Her album, saying how guests see it"
          measure={readAlbum}
        >
          <HubAlbum screen={screen} photos={newestFirst(NIGHT)} />
        </Scene>
      </Story>
    );
  return (
    <Story screen={screen}>
      <TodayFirst screen={screen} id="cz-home-more-first" />
      <Scene
        id="cz-home-more-page"
        screen={screen}
        title="What guests can add, More open"
        measure={readSettingsPage}
      >
        <SettingsScene screen={screen} page="What guests can add">
          <AddsWithRoll
            way={null}
            start={WEDDING_ROLL}
            more={<MoreFold way="both" />}
          />
        </SettingsScene>
      </Scene>
    </Story>
  );
}

/* ── her usual ─────────────────────────────────────────────────────────── */

type Mine = "offer" | "account" | "copy" | "remember";

/** What Create says her usual is, under the values it gave. */
const USUAL_LINE = "Your usual: develops at noon, 12 shots each";

/** The wedding with its develop moved to noon: what Maya changed. */
const NOON = weddingEvent({ develops_at: WEDDING.developsAtNoon });

function MineStory({ mine, screen }: { mine: Mine; screen: Screen }) {
  const settings = (offer: boolean) => (
    <Scene
      id={`cz-mine-settings-${mine}`}
      screen={screen}
      title={
        offer
          ? "Settings: the wedding, each change offered"
          : "Settings: the wedding, nothing to press"
      }
      measure={readSettingsPage}
    >
      <SettingsScene screen={screen} page="What guests can add" event={NOON}>
        <AddsWithRoll
          way="both"
          start={WEDDING_ROLL}
          offer={offer}
          developOffer={offer ? "noon" : undefined}
        />
      </SettingsScene>
    </Scene>
  );
  const create = (startsFrom?: string, usual?: string) => (
    <Scene
      id={`cz-mine-create-${mine}`}
      screen={screen}
      title={`Create: ${THIRTIETH.name}, ${usual ? "at her usual" : startsFrom ? "starting from a party" : "as it opens"}`}
      measure={readCreate}
    >
      <AddStep
        name={THIRTIETH.name}
        way="both"
        roll={WEDDING_ROLL}
        develop="Noon tomorrow"
        usual={usual}
        startsFrom={startsFrom}
      />
    </Scene>
  );
  if (mine === "offer")
    return (
      <Story screen={screen}>
        {settings(true)}
        {create(undefined, USUAL_LINE)}
      </Story>
    );
  if (mine === "account")
    return (
      <Story screen={screen}>
        <Scene
          id="cz-mine-account"
          screen={screen}
          title="Account: Your new parties"
          measure={readAccount}
        >
          <AccountUsual />
        </Scene>
        {create(undefined, USUAL_LINE)}
      </Story>
    );
  if (mine === "copy")
    return (
      <Story screen={screen}>
        <Scene
          id="cz-mine-copy-name"
          screen={screen}
          title={`Create: ${THIRTIETH.name}, where it starts`}
          measure={readCreate}
        >
          <NameStepFrom
            name={THIRTIETH.name}
            past={WEDDING.name}
            pastLine="Disposable, 12 shots each, developing at noon."
          />
        </Scene>
        {create(`Like ${WEDDING.name}`)}
      </Story>
    );
  return (
    <Story screen={screen}>
      {settings(false)}
      {create("As your last party")}
    </Story>
  );
}

/* ── the album's order ─────────────────────────────────────────────────── */

type Order = "newest" | "night" | "turns";

function newestFirst(photos: readonly Photo[]): Photo[] {
  return [...photos].reverse();
}

/** What a frame's first photograph says about its order. */
const orderOf = (first: Photo) =>
  first.id === NIGHT[0]!.id ? "the night in order" : "newest first";

function OrderStory({ order, screen }: { order: Order; screen: Screen }) {
  const atParty =
    order === "night" ? AT_THE_PARTY : newestFirst(AT_THE_PARTY);
  const after =
    order === "night" || order === "turns" ? NIGHT : newestFirst(NIGHT);
  return (
    <Story screen={screen}>
      <Scene
        id={`cz-order-party-${order}`}
        screen={screen}
        title={`At the party: ${orderOf(atParty[0]!)}`}
        measure={readAlbum}
      >
        <GuestAlbum
          screen={screen}
          photos={atParty}
          count={ALBUM_COUNT.party}
        />
      </Scene>
      <Scene
        id={`cz-order-morning-${order}`}
        screen={screen}
        title={`The morning after: ${orderOf(after[0]!)}`}
        measure={readAlbum}
      >
        <GuestAlbum
          screen={screen}
          photos={after}
          count={ALBUM_COUNT.morning}
        />
      </Scene>
    </Story>
  );
}

/* ── the map ───────────────────────────────────────────────────────────── */

const at = (s: BoardState) => screenOf(s.screen);

const PREVIEWS: PreviewsFor<typeof CUSTOMIZE> = {
  "roll.film": (s) => <RollStory way="film" screen={at(s)} />,
  "roll.count": (s) => <RollStory way="count" screen={at(s)} />,
  "roll.both": (s) => <RollStory way="both" screen={at(s)} />,
  "roll.wind": (s) => <RollStory way="wind" screen={at(s)} />,
  "home.words": (s) => <HomeStory home="words" screen={at(s)} />,
  "home.rows": (s) => <HomeStory home="rows" screen={at(s)} />,
  "home.album": (s) => <HomeStory home="album" screen={at(s)} />,
  "home.more": (s) => <HomeStory home="more" screen={at(s)} />,
  "mine.offer": (s) => <MineStory mine="offer" screen={at(s)} />,
  "mine.account": (s) => <MineStory mine="account" screen={at(s)} />,
  "mine.copy": (s) => <MineStory mine="copy" screen={at(s)} />,
  "mine.remember": (s) => <MineStory mine="remember" screen={at(s)} />,
  "order.newest": (s) => <OrderStory order="newest" screen={at(s)} />,
  "order.night": (s) => <OrderStory order="night" screen={at(s)} />,
  "order.turns": (s) => <OrderStory order="turns" screen={at(s)} />,
};

export function CustomizeBoard() {
  return <ExplorationBoard spec={CUSTOMIZE} previews={PREVIEWS} />;
}
