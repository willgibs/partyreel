"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  IdleCode,
  IdleInvite,
  IdleStills,
  StartCountdown,
  StartFrame,
  StartPlain,
  WallRoot,
} from "./parts";
import { REEL_SCREEN } from "./spec";
import { type ScreenId, screenOf, Wall } from "./wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * ★ EVERY SCREEN IS THE VIEW. Both questions are states of the one full-screen
 * view on a television, drawn with the view's own code plate in its corner and
 * no event name, so nothing here is judged against a screen that could not
 * exist under his answers.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: how wide the code is
 * as a share of the screen, how many words the screen says, what is behind the
 * plate and how big the press is. When the words above a frame and the number
 * under it disagree, the number is the truth.
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

const measureIdle: Reader = (root) => {
  const box = wallBox(root);
  const code = root.querySelector<HTMLElement>("[data-rsc-code]");
  if (!box || !code) return null;
  const c = code.getBoundingClientRect();
  const wall = root.querySelector("[data-rsc-wall]");
  const photo = root.querySelector('[data-rsc-still="idle"] img')
    ? "over the one photograph there is"
    : "on black";
  const n = wordsIn(wall);
  return `Measured: the code is ${pct(c.width, box.width)} of the screen's width, ${photo}; the screen says ${n} ${n === 1 ? "word" : "words"} in all, and no count.`;
};

function idleScene(id: "code" | "invite" | "stills", s: BoardState) {
  const body =
    id === "code" ? <IdleCode /> : id === "invite" ? <IdleInvite /> : <IdleStills />;
  return (
    <Wall
      id={`idle-${id}`}
      screen={screen(s)}
      title="Before it starts"
      measure={measureIdle}
    >
      <WallRoot>{body}</WallRoot>
    </Wall>
  );
}

/* ── start: the press the browser insists on ─────────────────────────────── */

const measureStart: Reader = (root) => {
  const plate = root.querySelector("[data-rsc-plate]");
  if (!plate) return null;
  const behind = root.querySelector('[data-rsc-still="first"] img')
    ? "the reel's first frame behind it"
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
  return `Measured: ${wordsIn(plate)} words on the plate, ${behind}, a press target of ${size}, and ${corner}.`;
};

function startScene(id: "frame" | "button" | "countdown", s: BoardState) {
  const body =
    id === "frame" ? (
      <StartFrame />
    ) : id === "button" ? (
      <StartPlain />
    ) : (
      <StartCountdown />
    );
  return (
    <Wall
      id={`start-${id}`}
      screen={screen(s)}
      title="The Start plate"
      measure={measureStart}
    >
      <WallRoot>{body}</WallRoot>
    </Wall>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_SCREEN> = {
  "idle.code": (s) => idleScene("code", s),
  "idle.invite": (s) => idleScene("invite", s),
  "idle.stills": (s) => idleScene("stills", s),

  "start.frame": (s) => startScene("frame", s),
  "start.button": (s) => startScene("button", s),
  "start.countdown": (s) => startScene("countdown", s),
};

export function ReelScreenBoard() {
  return <ExplorationBoard spec={REEL_SCREEN} previews={PREVIEWS} />;
}
