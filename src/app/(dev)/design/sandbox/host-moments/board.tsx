"use client";

import "./host-moments.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import {
  CameraAfter,
  CameraBefore,
  type GuestWay,
  TellMoment,
  type TellWay,
} from "./develop";
import { PasswordMoment, type PasswordWay } from "./door";
import {
  type BackWay,
  DeclinedDoor,
  DeclineRoom,
  type DeclineWay,
  LetBackAfter,
  LetBackAsk,
} from "./guests";
import { screenOf } from "./knobs";
import { Scene, Story } from "./scene";
import { HOST_MOMENTS } from "./spec";
import {
  BannerDashboard,
  BannerList,
  type BannerWay,
  GoalList,
  type GoalWay,
} from "./storage";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole on production's
 * own page as Maya meets it, its frames left to right as the moment runs, at
 * her laptop or her phone on the Screen knob (a guest's frames are a phone's
 * whatever it says). Every caption is read off its frame (`scene.tsx`).
 */

function password(s: BoardState, way: PasswordWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-password-${way}`}
        screen={screen}
        title="Who can get in, A password picked"
      >
        <PasswordMoment screen={screen} way={way} />
      </Scene>
    </Story>
  );
}

function tell(s: BoardState, way: TellWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-tell-${way}`}
        screen={screen}
        title="How guests add, At a develop time picked"
      >
        <TellMoment screen={screen} way={way} />
      </Scene>
    </Story>
  );
}

const freshRoll = (way: GuestWay) => (
  <Story screen="375">
    <Scene
      id={`hm-roll-${way}-before`}
      screen="375"
      title="Priya's camera at 9:35 pm"
    >
      <CameraBefore />
    </Scene>
    <Scene
      id={`hm-roll-${way}-after`}
      screen="375"
      title="Priya's camera, opened again"
    >
      <CameraAfter way={way} />
    </Scene>
  </Story>
);

function decline(s: BoardState, way: DeclineWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-decline-${way}-room`}
        screen={screen}
        title={
          way === "choose"
            ? "Guests, Decline pressed on Dev"
            : "Guests, the moment after Decline"
        }
      >
        <DeclineRoom screen={screen} way={way} />
      </Scene>
      <Scene id={`hm-decline-${way}-door`} screen="375" title="What Dev meets">
        <DeclinedDoor way={way === "block" ? "block" : "again"} />
      </Scene>
    </Story>
  );
}

function letBack(s: BoardState, way: BackWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-back-${way}-ask`}
        screen={screen}
        title="Blocked, Let back in on Dev"
      >
        <LetBackAsk screen={screen} way={way} />
      </Scene>
      <Scene
        id={`hm-back-${way}-after`}
        screen={screen}
        title="Guests, the moment after"
      >
        <LetBackAfter screen={screen} way={way} />
      </Scene>
    </Story>
  );
}

function banner(s: BoardState, way: BannerWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-banner-${way}-dash`}
        screen={screen}
        title="Her dashboard, over her plan"
      >
        <BannerDashboard way={way} />
      </Scene>
      <Scene
        id={`hm-banner-${way}-list`}
        screen={screen}
        title="Where the banner leads"
      >
        <BannerList way={way} />
      </Scene>
    </Story>
  );
}

function goal(s: BoardState, way: GoalWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`hm-goal-${way}-some`}
        screen={screen}
        title="Two videos picked"
      >
        <GoalList way={way} stage="some" />
      </Scene>
      <Scene
        id={`hm-goal-${way}-enough`}
        screen={screen}
        title="Enough picked to fit"
      >
        <GoalList way={way} stage="enough" />
      </Scene>
    </Story>
  );
}

const PREVIEWS: PreviewsFor<typeof HOST_MOMENTS> = {
  "password.today": (s) => password(s, "today"),
  "password.both": (s) => password(s, "both"),
  "password.picture": (s) => password(s, "picture"),
  "tell.today": (s) => tell(s, "today"),
  "tell.line": (s) => tell(s, "line"),
  "tell.choose": (s) => tell(s, "choose"),
  "fresh-roll.today": freshRoll("today"),
  "fresh-roll.line": freshRoll("line"),
  "fresh-roll.panel": freshRoll("panel"),
  "decline.block": (s) => decline(s, "block"),
  "decline.again": (s) => decline(s, "again"),
  "decline.choose": (s) => decline(s, "choose"),
  "let-back.today": (s) => letBack(s, "today"),
  "let-back.row": (s) => letBack(s, "row"),
  "let-back.straight": (s) => letBack(s, "straight"),
  "banner.today": (s) => banner(s, "today"),
  "banner.number": (s) => banner(s, "number"),
  "banner.sweep": (s) => banner(s, "sweep"),
  "goal.today": (s) => goal(s, "today"),
  "goal.line": (s) => goal(s, "line"),
  "goal.sweep": (s) => goal(s, "sweep"),
};

export function HostMomentsBoard() {
  return <ExplorationBoard spec={HOST_MOMENTS} previews={PREVIEWS} />;
}
