"use client";

import type { ComponentType } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  IdleCode,
  IdleInvite,
  IdleSeats,
  IdleStills,
  IdleWelcome,
  type SoundId,
  SoundScreen,
  StartCountdown,
  StartFrame,
  StartPlain,
  StartWindow,
  WallRoot,
} from "./parts";
import { REEL_SCREEN } from "./spec";
import { type ScreenId, screenOf, Wall } from "./wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * ★ EVERY SCREEN IS THE VIEW. Every question is a state of the one full-screen
 * view on a television, drawn with the view's own code plate in its corner, so
 * each option is judged on a screen that can really exist rather than on a
 * mode of its own.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: how wide the code is
 * as a share of the screen, how many words the screen says, whether it names
 * the event or counts to the reel, what is behind the press and how big the
 * press is. When the words above a frame and the number under it disagree,
 * the number is the truth.
 */

type Reader = (root: HTMLElement) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";

const wallBox = (root: HTMLElement): DOMRect | null =>
  root.querySelector<HTMLElement>("[data-rsc-wall]")?.getBoundingClientRect() ??
  null;

const wordsIn = (el: Element | null): number =>
  el
    ? (((el as HTMLElement).innerText || "").trim().match(/\S+/g)?.length ?? 0)
    : 0;

/* ── idle: the screen before the reel ────────────────────────────────────── */

type IdleId = "code" | "invite" | "stills" | "welcome" | "seats";

const measureIdle: Reader = (root) => {
  const box = wallBox(root);
  const code = root.querySelector<HTMLElement>("[data-rsc-code]");
  if (!box || !code) return null;
  const c = code.getBoundingClientRect();
  const wall = root.querySelector("[data-rsc-wall]");
  const photo = root.querySelector('[data-rsc-still="idle"] img')
    ? "over the one photograph there is"
    : root.querySelector('[data-rsc-seat="filled"] img')
      ? "beside the one photograph, in its seat"
      : "on black";
  const n = wordsIn(wall);
  const name = root.querySelector("[data-rsc-name]")
    ? "names the event"
    : "names nothing";
  const count = root.querySelector("[data-rsc-count]")
    ? "counts to the reel"
    : "counts nothing";
  return `Measured: the code is ${pct(c.width, box.width)} of the screen's width, ${photo}; the screen says ${n} ${n === 1 ? "word" : "words"} in all, ${name} and ${count}.`;
};

const IDLE: Record<IdleId, ComponentType> = {
  code: IdleCode,
  invite: IdleInvite,
  stills: IdleStills,
  welcome: IdleWelcome,
  seats: IdleSeats,
};

function idleScene(id: IdleId, s: BoardState) {
  const Body = IDLE[id];
  return (
    <Wall
      id={`idle-${id}`}
      screen={screen(s)}
      title="Before it starts"
      measure={measureIdle}
    >
      <WallRoot>
        <Body />
      </WallRoot>
    </Wall>
  );
}

/* ── start: the press the browser insists on ─────────────────────────────── */

type StartId = "frame" | "button" | "countdown" | "window";

const measureStart: Reader = (root) => {
  const plate = root.querySelector("[data-rsc-plate]");
  if (!plate) return null;
  const behind = root.querySelector("[data-rsc-playing]")
    ? "the reel playing behind it"
    : root.querySelector('[data-rsc-still="first"] img')
      ? "the reel's first frame held behind it"
      : "a dark plate";
  const press = root
    .querySelector<HTMLElement>("[data-rsc-start-button]")
    ?.getBoundingClientRect();
  const size = press
    ? `${Math.round(press.width)} by ${Math.round(press.height)}px`
    : "no press target";
  const corner = root.querySelector("[data-rsc-corner]")
    ? "the code in its corner"
    : "no code";
  return `Measured: ${wordsIn(plate)} words ask for the press, ${behind}, a press target of ${size}, and ${corner}.`;
};

const START: Record<StartId, ComponentType> = {
  frame: StartFrame,
  button: StartPlain,
  countdown: StartCountdown,
  window: StartWindow,
};

function startScene(id: StartId, s: BoardState) {
  const Body = START[id];
  return (
    <Wall
      id={`start-${id}`}
      screen={screen(s)}
      title="The Start plate"
      measure={measureStart}
    >
      <WallRoot>
        <Body />
      </WallRoot>
    </Wall>
  );
}

/* ── sound: whether the screen ever plays a video's own sound ──────────── */

const measureSound: Reader = (root) => {
  const dock = root.querySelector("[data-rsc-dock]");
  if (!dock) return null;
  const n = dock.querySelectorAll("[data-rsc-control]").length;
  const s =
    root.querySelector<HTMLElement>("[data-rsc-sound]")?.dataset.rscSound;
  const tip = (
    root.querySelector<HTMLElement>("[data-rsc-tip]")?.innerText ?? ""
  ).trim();
  const sound =
    s === "on"
      ? `a speaker, on from the Start press ("${tip}")`
      : s === "off"
        ? `a speaker, off until pressed ("${tip}")`
        : "no speaker, so every video moment plays muted";
  return `Measured: the dock carries ${n} controls; ${sound}.`;
};

function soundScene(id: SoundId, s: BoardState) {
  return (
    <Wall
      id={`sound-${id}`}
      screen={screen(s)}
      title="Sound on the screen"
      measure={measureSound}
    >
      <WallRoot>
        <SoundScreen sound={id} />
      </WallRoot>
    </Wall>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_SCREEN> = {
  "idle.code": (s) => idleScene("code", s),
  "idle.invite": (s) => idleScene("invite", s),
  "idle.stills": (s) => idleScene("stills", s),
  "idle.welcome": (s) => idleScene("welcome", s),
  "idle.seats": (s) => idleScene("seats", s),

  "start.frame": (s) => startScene("frame", s),
  "start.button": (s) => startScene("button", s),
  "start.countdown": (s) => startScene("countdown", s),
  "start.window": (s) => startScene("window", s),

  "sound.silent": (s) => soundScene("silent", s),
  "sound.off": (s) => soundScene("off", s),
  "sound.on": (s) => soundScene("on", s),
};

export function ReelScreenBoard() {
  return <ExplorationBoard spec={REEL_SCREEN} previews={PREVIEWS} />;
}
