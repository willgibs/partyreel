"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  CardSheet,
  ClaimShowcase,
  type ClaimOption,
  ListShowcase,
  type ListOption,
  NamedShowcase,
  namedOf,
  type NamedOption,
  NoPage,
} from "./album";
import { PEOPLE, whoOf } from "./fixtures";
import {
  type BlockOption,
  type BodyOption,
  type HeadOption,
  type IdentityOption,
  ProfilePage,
  type ViewerId,
  viewerOf,
} from "./profile";
import {
  Ground,
  measureHead,
  measureList,
  measurePictures,
  measureReach,
  Scene,
  type ScreenId,
  screenOf,
} from "./scene";
import { PROFILE_PAGE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real profile or the real
 * album at a real viewport, phone first, with one thing changed.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The screen is a knob all
 * eight decisions share and every picture reads it; so are whose page it is and
 * who is looking. A decision staged behind another is drawn WEARING that
 * answer, which is the point of the staging: the head, the body, the top block
 * and the block affordance are each judged inside whichever container `exists`
 * settled on, and the claim and the list inside whichever list `named` settled
 * on. Going back redraws the earlier ones in the world he chose rather than the
 * one this board assumed.
 *
 * ★ A STAGED DECISION WEARS ITS PARENT'S RECOMMENDATION UNTIL HE ANSWERS.
 * `defineExploration` mirrors every ask as a control whose default IS the
 * recommendation and `useBoardState` fills each declared control, so there is
 * never an unanswered value to read.
 *
 * ★ THE GROUND IS TODAY'S PRODUCT, NOT THIS BOARD'S OWN ANSWERS. A decision is
 * drawn against what ships, so no question quietly arrives wearing the answer
 * to one he has not been asked: the head stays today's logo-and-button under
 * `made-of`, the body stays today's grey names under `head`, and the guest list
 * stays the wrapping one under `claim`. The only exception is the staging
 * itself, and `exists` is the one thing the four page decisions all wear.
 */

const TODAY = {
  head: "today" as HeadOption,
  body: "events" as BodyOption,
  identity: "today" as IdentityOption,
  block: "overflow" as BlockOption,
};

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);
const who = (s: BoardState) => PEOPLE[whoOf(s.who as string)];
const viewer = (s: BoardState): ViewerId => viewerOf(s.viewer as string);

/**
 * ONE PAGE DECISION'S PICTURE. It takes the whole page's state and overrides
 * only the axis being judged, so the frame under a question is the real
 * composition and not a cut-out of one part of it.
 */
function page(
  s: BoardState,
  id: string,
  title: string,
  over: Partial<{
    head: HeadOption;
    identity: IdentityOption;
    body: BodyOption;
    block: BlockOption;
  }>,
  measure: (root: HTMLElement, win: Window) => string,
) {
  const person = who(s);
  const shape = { ...TODAY, ...over };
  // The overflow opens only where it IS the question (see profile.tsx).
  const menuOpen = over.block !== undefined;
  return (
    <Scene id={id} screen={screen(s)} title={title} measure={measure}>
      <Ground>
        <ProfilePage
          person={person}
          head={shape.head}
          identity={shape.identity}
          body={shape.body}
          block={shape.block}
          viewer={viewer(s)}
          menuOpen={menuOpen}
        />
      </Ground>
    </Scene>
  );
}

/* ── exists: the container ───────────────────────────────────────────────── */

const exists = (s: BoardState, option: "page" | "card" | "none") => {
  if (option === "page")
    return page(s, "exists-page", "The page", {}, measurePictures);
  return (
    <Scene
      id={`exists-${option}`}
      screen={screen(s)}
      title={option === "card" ? "A card, no address" : "No person page"}
      caption={
        option === "card"
          ? "Raised from a chip on the album. There is no URL for this, so nothing links to it and nothing indexes it"
          : "The same twenty-four names, with nothing behind any of them"
      }
    >
      <Ground>
        {option === "card" ? <CardSheet person={who(s)} /> : <NoPage />}
      </Ground>
    </Scene>
  );
};

/* ── the staged page decisions ───────────────────────────────────────────── */

/** A decision staged behind `exists` is only ASKED in the world where a person
 *  has a page. When `exists` settled on a card the page parts are drawn inside
 *  the card, and when it settled on none there is nothing to draw. */
function staged(
  s: BoardState,
  id: string,
  title: string,
  over: Partial<{
    head: HeadOption;
    identity: IdentityOption;
    body: BodyOption;
    block: BlockOption;
  }>,
  measure: (root: HTMLElement, win: Window) => string,
) {
  if (s.exists === "none")
    return (
      <Scene
        id={`${id}-none`}
        screen={screen(s)}
        title={title}
        short
        caption="There is no page to put this on: exists answered none"
      >
        <Ground>
          <NoPage />
        </Ground>
      </Scene>
    );
  if (s.exists === "card")
    return (
      <Scene
        id={`${id}-card`}
        screen={screen(s)}
        title={title}
        caption="Inside the card, because exists answered card: no head, and no address"
      >
        <Ground>
          <CardSheet person={who(s)} />
        </Ground>
      </Scene>
    );
  return page(s, id, title, over, measure);
}

/* ── the pictures ────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof PROFILE_PAGE> = {
  "exists.page": (s) => exists(s, "page"),
  "exists.card": (s) => exists(s, "card"),
  "exists.none": (s) => exists(s, "none"),

  "head.today": (s) =>
    staged(s, "head-today", "The head", { head: "today" }, measureHead),
  "head.guest": (s) =>
    staged(s, "head-guest", "The head", { head: "guest" }, measureHead),
  "head.bare": (s) =>
    staged(s, "head-bare", "The head", { head: "bare" }, measureHead),

  "made-of.events": (s) =>
    staged(
      s,
      "body-events",
      "What fills it",
      { body: "events" },
      measurePictures,
    ),
  "made-of.covers": (s) =>
    staged(
      s,
      "body-covers",
      "What fills it",
      { body: "covers" },
      measurePictures,
    ),
  "made-of.wall": (s) =>
    staged(s, "body-wall", "What fills it", { body: "wall" }, measurePictures),

  "identity.today": (s) =>
    staged(s, "id-today", "The top", { identity: "today" }, measurePictures),
  "identity.counts": (s) =>
    staged(s, "id-counts", "The top", { identity: "counts" }, measurePictures),
  "identity.line": (s) =>
    staged(s, "id-line", "The top", { identity: "line" }, measurePictures),

  "block.overflow": (s) =>
    staged(s, "block-overflow", "Block", { block: "overflow" }, measureReach),
  "block.inline": (s) =>
    staged(s, "block-inline", "Block", { block: "inline" }, measureReach),
  "block.report": (s) =>
    staged(s, "block-report", "Block", { block: "report" }, measureReach),

  "named.everyone": (s) => named(s, "everyone"),
  "named.handles": (s) => named(s, "handles"),
  "named.optout": (s) => named(s, "optout"),

  "claim.account": (s) => claim(s, "account"),
  "claim.after": (s) => claim(s, "after"),
  "claim.inline": (s) => claim(s, "inline"),

  "list.wrap": (s) => list(s, "wrap"),
  "list.cap": (s) => list(s, "cap"),
  "list.faces": (s) => list(s, "faces"),
};

/* ── the album side ──────────────────────────────────────────────────────── */

function named(s: BoardState, option: NamedOption) {
  return (
    <Scene
      id={`named-${option}`}
      screen={screen(s)}
      title="Who an album names"
      measure={measureList}
    >
      <Ground>
        <NamedShowcase option={option} />
      </Ground>
    </Scene>
  );
}

function claim(s: BoardState, option: ClaimOption) {
  const membership = namedOf(s.named as string);
  return (
    <Scene
      id={`claim-${option}`}
      screen={screen(s)}
      title="Where the handle is offered"
      short
      caption={
        option === "account"
          ? "The shipped card, drawn at rest: its live control debounces a signed-in Server Function on every keystroke"
          : "Press it: the offer is real state here and reaches nothing"
      }
    >
      <Ground>
        <ClaimShowcase option={option} membership={membership} />
      </Ground>
    </Scene>
  );
}

function list(s: BoardState, option: ListOption) {
  const membership = namedOf(s.named as string);
  return (
    <Scene
      id={`list-${option}`}
      screen={screen(s)}
      title="The list at a real wedding"
      measure={measureList}
    >
      <Ground>
        <ListShowcase option={option} membership={membership} />
      </Ground>
    </Scene>
  );
}

export function ProfilePageBoard() {
  return <ExplorationBoard spec={PROFILE_PAGE} previews={PREVIEWS} />;
}
