"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import type { CardWay } from "./card";
import { Room } from "./chrome";
import { AT_THE_DOOR, CHRIS, PRIYA, ROSA } from "./fixtures";
import { type ScreenId, screenOf } from "./knobs";
import { FacesRoom } from "./room-faces";
import { ListRoom } from "./room-list";
import { MixedRoom } from "./room-mixed";
import { Mark, Press, Reveal, Scene, Story } from "./scene";
import { GUESTS_ROOM } from "./spec";
import { TodayRoom } from "./today";
import { TodayRoomCards } from "./today-cards";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole as production's
 * room over the hub (`chrome.tsx`), at her phone or her laptop on the Screen
 * knob. `rows` draws four frames down the room (opened, its guests, the
 * invite list, its foot); `card` opens four names in the room he picked (its
 * `after`), the presses production's own (`Press`).
 * Every caption is read off its frame (`scene.tsx`).
 */

type RowsWay = "today" | "list" | "faces" | "mixed";

const rowsOf = (v: unknown): RowsWay =>
  v === "list" || v === "faces" || v === "mixed" ? v : "today";

/**
 * The room the `rows` answer draws, its names opening the card the `card`
 * answer draws. ★ TODAY'S ROOM IS PRODUCTION'S OWN WHERE THE ROOM IS ASKED,
 * and its retyped twin (`today-cards.tsx`, a card at every name) where a card
 * is, so a candidate card opens from the names production draws.
 */
function RoomFor({
  rows,
  card,
  asked,
}: {
  rows: RowsWay;
  card: CardWay;
  asked: "rows" | "card";
}) {
  if (rows === "list") return <ListRoom card={card} />;
  if (rows === "faces") return <FacesRoom card={card} />;
  if (rows === "mixed") return <MixedRoom card={card} />;
  return asked === "rows" ? <TodayRoom /> : <TodayRoomCards card={card} />;
}

/** Marks the room's sections for the caption, so it reads what each frame shows. */
function RowsMarks() {
  return (
    <>
      <Mark at="#at-the-door, [data-at-the-door]" as="At the door" />
      <Mark at="[data-gr-door-row], [data-door-person]" as="a door row" />
    </>
  );
}

function rowsPreview(s: BoardState, way: RowsWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene id={`gr-rows-${way}-top`} screen={screen} title="The room, opened">
        <Room screen={screen}>
          <RoomFor rows={way} card="today" asked="rows" />
          <RowsMarks />
        </Room>
      </Scene>
      <Scene
        id={`gr-rows-${way}-guests`}
        screen={screen}
        title="Scrolled to the guests"
      >
        <Room screen={screen}>
          <RoomFor rows={way} card="today" asked="rows" />
          {/* Today's guests are a row of faces that opens them in a second panel: that panel is how she sees
              them, so today's frame is it, opened by its own press. */}
          {way === "today" ? (
            <Press
              at="button"
              text="guests added photos"
              until="[data-guest-list-panel]"
            />
          ) : (
            <Reveal at="#in" />
          )}
          <Mark at="#in, [data-guest-list-panel]" as="The guests" />
        </Room>
      </Scene>
      <Scene
        id={`gr-rows-${way}-mid`}
        screen={screen}
        title="Scrolled to the invite list"
      >
        <Room screen={screen}>
          <RoomFor rows={way} card="today" asked="rows" />
          <Reveal at="#invited, [data-invited-section]" />
          <Mark at="#invited, [data-invited-section]" as="Invited" />
        </Room>
      </Scene>
      <Scene id={`gr-rows-${way}-foot`} screen={screen} title="The room's foot">
        <Room screen={screen}>
          <RoomFor rows={way} card="today" asked="rows" />
          <Reveal at="#blocked, [data-blocked-section]" />
          <Mark at="#blocked, [data-blocked-section]" as="Blocked" />
        </Room>
      </Scene>
    </Story>
  );
}

/** The presses that open a guest's card in the room as drawn: today's names wait behind the row of faces. */
function OpenGuest({
  rows,
  id,
  behindMore = false,
}: {
  rows: RowsWay;
  id: string;
  /** Today's names panel pages at 24: a typed name, listed last, waits behind Show more. */
  behindMore?: boolean;
}) {
  const name = `[data-gr-name="${id}"]`;
  return (
    <>
      {rows === "today" ? (
        <Press at="[data-gr-faces-row]" until="[data-guest-list-panel]" />
      ) : null}
      {rows === "today" && behindMore ? (
        <Press at="[data-gr-more]" until={name} />
      ) : null}
      {rows === "list" && behindMore ? (
        <Press at="[data-gr-show-all]" until={name} />
      ) : null}
      <Reveal at={name} offset={160} />
      <Press at={name} until='[data-slot="guest-peek"]' />
      <Mark at='[data-slot="guest-peek"]' as="the card" />
      <span hidden data-gr-expect-card="" />
    </>
  );
}

function cardPreview(s: BoardState, way: CardWay) {
  const screen: ScreenId = screenOf(s.screen);
  const rows = rowsOf(s.rows);
  const dev = AT_THE_DOOR[0]!;
  return (
    <Story screen={screen}>
      <Scene
        id={`gr-card-${rows}-${way}-priya`}
        screen={screen}
        title="Priya's name, pressed"
      >
        <Room screen={screen}>
          <RoomFor rows={rows} card={way} asked="card" />
          <OpenGuest rows={rows} id={PRIYA.id} />
        </Room>
      </Scene>
      <Scene
        id={`gr-card-${rows}-${way}-rosa`}
        screen={screen}
        title="Aunt Rosa's name, pressed"
      >
        <Room screen={screen}>
          <RoomFor rows={rows} card={way} asked="card" />
          <OpenGuest rows={rows} id={ROSA.id} behindMore={rows === "today"} />
        </Room>
      </Scene>
      <Scene
        id={`gr-card-${rows}-${way}-door`}
        screen={screen}
        title="A name at the door, pressed"
      >
        <Room screen={screen}>
          <RoomFor rows={rows} card={way} asked="card" />
          <Press
            at={`[data-gr-name="${dev.guestId}"]`}
            until='[data-slot="guest-peek"]'
          />
          <Mark at='[data-slot="guest-peek"]' as="the card" />
          <span hidden data-gr-expect-card="" />
        </Room>
      </Scene>
      <Scene
        id={`gr-card-${rows}-${way}-blocked`}
        screen={screen}
        title="A blocked name, pressed"
      >
        <Room screen={screen}>
          <RoomFor rows={rows} card={way} asked="card" />
          <Reveal at={`[data-gr-name="${CHRIS.id}"]`} offset={220} />
          <Press
            at={`[data-gr-name="${CHRIS.id}"]`}
            until='[data-slot="guest-peek"]'
          />
          <Mark at='[data-slot="guest-peek"]' as="the card" />
          <span hidden data-gr-expect-card="" />
        </Room>
      </Scene>
    </Story>
  );
}

const PREVIEWS: PreviewsFor<typeof GUESTS_ROOM> = {
  "rows.today": (s) => rowsPreview(s, "today"),
  "rows.list": (s) => rowsPreview(s, "list"),
  "rows.faces": (s) => rowsPreview(s, "faces"),
  "rows.mixed": (s) => rowsPreview(s, "mixed"),
  "card.today": (s) => cardPreview(s, "today"),
  "card.photos": (s) => cardPreview(s, "photos"),
  "card.standing": (s) => cardPreview(s, "standing"),
};

export function GuestsRoomBoard() {
  return <ExplorationBoard spec={GUESTS_ROOM} previews={PREVIEWS} />;
}
