"use client";

import "./account-moments.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { type TidyWay, TidyMoment } from "./connections";
import { screenOf } from "./knobs";
import { type InviteWay, type MeShape, MePage } from "./me";
import {
  BlockAsk,
  BlockedMoment,
  type BlockWay,
  FollowMoment,
  type FollowWay,
} from "./relations";
import { Scene, Story } from "./scene";
import { ACCOUNT_MOMENTS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole on production's own
 * page as Priya meets it, its frames left to right as the moment runs, at her
 * phone or her laptop on the Screen knob. Every caption is read off its frame
 * (`scene.tsx`).
 */

function follow(s: BoardState, way: FollowWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-follow-${way}`}
        screen={screen}
        title="Maya's page, the moment after Follow"
      >
        <FollowMoment way={way} />
      </Scene>
    </Story>
  );
}

function block(s: BoardState, way: BlockWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-block-${way}-ask`}
        screen={screen}
        title="Jordan's page, Block's ask"
      >
        <BlockAsk />
      </Scene>
      <Scene
        id={`am-block-${way}-after`}
        screen={screen}
        title="Jordan's page, the moment after"
      >
        <BlockedMoment way={way} />
      </Scene>
    </Story>
  );
}

function tidy(s: BoardState, way: TidyWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-tidy-${way}-unfollow`}
        screen={screen}
        title="Connections, after Following on Sam"
      >
        <TidyMoment way={way} stage="unfollow" />
      </Scene>
      <Scene
        id={`am-tidy-${way}-unblock`}
        screen={screen}
        title="Connections, after Unblock on Ray"
      >
        <TidyMoment way={way} stage="unblock" />
      </Scene>
    </Story>
  );
}

const shapeOf = (v: unknown): MeShape =>
  v === "private" || v === "halves" ? v : "today";

function me(s: BoardState, shape: MeShape) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene id={`am-me-${shape}`} screen={screen} title="Your profile, opened">
        <MePage shape={shape} invite="today" />
      </Scene>
    </Story>
  );
}

function invite(s: BoardState, way: InviteWay) {
  const screen = screenOf(s.screen);
  const shape = shapeOf(s["me-page"]);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-invite-${shape}-${way}`}
        screen={screen}
        title="Your profile, opened"
      >
        <MePage shape={shape} invite={way} />
      </Scene>
      {way === "notnow" ? (
        <Scene
          id={`am-invite-${shape}-${way}-folded`}
          screen={screen}
          title="Your profile, after Not now"
        >
          <MePage shape={shape} invite={way} stage="folded" />
        </Scene>
      ) : null}
    </Story>
  );
}

const PREVIEWS: PreviewsFor<typeof ACCOUNT_MOMENTS> = {
  "follow.today": (s) => follow(s, "today"),
  "follow.line": (s) => follow(s, "line"),
  "follow.toast": (s) => follow(s, "toast"),
  "block.today": (s) => block(s, "today"),
  "block.line": (s) => block(s, "line"),
  "block.toast": (s) => block(s, "toast"),
  "tidy.today": (s) => tidy(s, "today"),
  "tidy.stays": (s) => tidy(s, "stays"),
  "tidy.toast": (s) => tidy(s, "toast"),
  "me-page.today": (s) => me(s, "today"),
  "me-page.private": (s) => me(s, "private"),
  "me-page.halves": (s) => me(s, "halves"),
  "invite.today": (s) => invite(s, "today"),
  "invite.line": (s) => invite(s, "line"),
  "invite.notnow": (s) => invite(s, "notnow"),
};

export function AccountMomentsBoard() {
  return <ExplorationBoard spec={ACCOUNT_MOMENTS} previews={PREVIEWS} />;
}
