"use client";

import "./account-moments.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { ConnectionsMoment } from "./connections";
import { FollowMoment, type FollowWay } from "./follow";
import { photosOf, screenOf } from "./knobs";
import { type InviteWay, MePage } from "./me";
import { Scene, Story } from "./scene";
import { ACCOUNT_MOMENTS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole on production's own
 * page as Priya meets it, its frames left to right as the moment runs, at her
 * phone or her laptop on the Screen knob. Every caption is read off its frame
 * (`scene.tsx`).
 *
 * A follow is the same three moments in every option, so the frames compare
 * one for one: her first follow (Maya's page), her fortieth weeks later
 * (Theo's), and Connections, where her follows live.
 */

function follow(s: BoardState, way: FollowWay) {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-follow-${way}-first`}
        screen={screen}
        title={
          way === "mark"
            ? "Maya's page, her first follow, the mark asked"
            : "Maya's page, her first follow"
        }
      >
        <FollowMoment way={way} who="first" />
      </Scene>
      <Scene
        id={`am-follow-${way}-later`}
        screen={screen}
        title="Theo's page, her fortieth follow"
      >
        <FollowMoment way={way} who="later" />
      </Scene>
      <Scene
        id={`am-follow-${way}-connections`}
        screen={screen}
        title="Account, her Connections"
      >
        <ConnectionsMoment said={way === "once"} />
      </Scene>
    </Story>
  );
}

function invite(s: BoardState, way: InviteWay) {
  const screen = screenOf(s.screen);
  const photos = photosOf(s.photos);
  return (
    <Story screen={screen}>
      <Scene
        id={`am-invite-${way}-${photos}`}
        screen={screen}
        title="Your profile, opened"
      >
        <MePage invite={way} photos={photos} />
      </Scene>
    </Story>
  );
}

const PREVIEWS: PreviewsFor<typeof ACCOUNT_MOMENTS> = {
  "follow.today": (s) => follow(s, "today"),
  "follow.once": (s) => follow(s, "once"),
  "follow.mark": (s) => follow(s, "mark"),
  "invite.today": (s) => invite(s, "today"),
  "invite.plate": (s) => invite(s, "plate"),
  "invite.address": (s) => invite(s, "address"),
  "invite.window": (s) => invite(s, "window"),
};

export function AccountMomentsBoard() {
  return <ExplorationBoard spec={ACCOUNT_MOMENTS} previews={PREVIEWS} />;
}
