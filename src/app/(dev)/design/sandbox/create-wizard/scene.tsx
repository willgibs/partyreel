"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN.
 *
 * ★ A REAL VIEWPORT AT A DEVICE'S OWN SIZE (375 by 812, 1440 by 900): the
 * type ladder is a `vw` clamp and the room is laid out against the screen's
 * height, so only a same-origin frame at the true size shows what a host
 * meets. The lab's front door draws it (`Frame`, fitted by `Fit`, captioned
 * by `Measured`), and the frame's own window carries the Aurora's filter host,
 * so the room's light is production's field, never a stand-in.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the words a host
 * reads on the screen (the pictures' own type aside), each picture's size,
 * where the question and the one action sit, what is picked, the night's
 * moment. If a caption and the words above a frame disagree, the caption is
 * the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={title}
        caption={measured}
      >
        <Measured
          probe={measure}
          deps={[id, screen]}
          onMeasure={setMeasured}
          timers={[300, 1200, 2800]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, read left to right. Phones stand in a row;
 * laptops wrap two to a row, so four of them stand as a square rather than a
 * strip of thumbnails.
 */
export function Story({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-start gap-6"
      style={screen === "1440" ? { maxWidth: 2 * 1440 + 24 } : undefined}
    >
      {children}
    </div>
  );
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** Text a host never reads: a picture's own type, a flight, a hidden or a reader-only line. */
const UNREAD =
  "[data-style-picture], [data-room-ghosts], [data-room-flyers], [aria-hidden], .sr-only, [inert]";

/**
 * THE WORDS A HOST READS ON THE SCREEN, the pictures' own type aside: every
 * text node outside a picture, split on whitespace, counting a token with a
 * letter or a digit in it, and only what stands on the screen.
 */
export function wordsIn(root: Element): number {
  const doc = root.ownerDocument;
  const height = doc.defaultView?.innerHeight ?? Infinity;
  const walk = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let n = 0;
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    const el = t.parentElement;
    if (!el || el.closest(UNREAD)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.top >= height || r.bottom <= 0) continue;
    for (const token of (t.textContent ?? "").split(/\s+/))
      if (/[\p{L}\p{N}]/u.test(token)) n++;
  }
  return n;
}

const px = (n: number) => Math.round(n);

/** The marked element's size, or null until it has laid out. */
function sizeOf(el: Element | null): string | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return `${px(r.width)} by ${px(r.height)} px`;
}

/** The room on the screen: production's own ground. */
const roomOf = (root: HTMLElement) =>
  root.ownerDocument.querySelector<HTMLElement>("[data-room]");

/** Where the question stands, from the screen's top: the place it never leaves. */
function questionAt(room: HTMLElement): string | null {
  const q = room.querySelector("[data-room-question] h1:not([data-held])");
  if (!q) return null;
  return `the question ${px(q.getBoundingClientRect().top)} px down`;
}

/** Where the screen's one action sits for a thumb. */
function reachOf(room: HTMLElement, win: Window): string | null {
  const go = room.querySelector<HTMLElement>("[data-cw-go]");
  if (!go) return null;
  const r = go.getBoundingClientRect();
  if (r.height < 2) return null;
  const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
  return `${(go.innerText || "the action").trim()} ${px(r.height)} px tall, ${down}% down`;
}

/** Whether the room's body holds what it is given; said only when it does not. */
function overflowOf(room: HTMLElement): string | null {
  const body = room.querySelector<HTMLElement>("[data-room-body]");
  if (!body) return null;
  const over = body.scrollHeight - body.clientHeight;
  return over > 1 ? `THE ROOM SCROLLS by ${px(over)} px` : null;
}

const NAMES: Record<string, string> = {
  live: "Live",
  approval: "Review",
  disposable: "Disposable",
};

/** The screen standing in the room, by its question's own words. */
const SCREEN_NAMES: Record<string, string> = {
  name: "the name",
  add: "the album style step",
  develop: "the develop time's own screen",
  look: "the code's look",
  beat: "the beat",
};

/**
 * The album style step: what is picked, the pictures and their sizes, where
 * Disposable's develop time stands (in view, or under the fold), the steppers.
 */
function readStyles(room: HTMLElement, win: Window, parts: string[]): boolean {
  const cards = [...room.querySelectorAll<HTMLElement>("[data-album-style]")];
  const on = cards.find((c) => c.dataset.state === "checked");
  if (!on) return false;
  const pics = [...room.querySelectorAll("[data-style-picture]")].map(sizeOf);
  if (pics.some((p) => !p)) return false;
  parts.push(`${NAMES[on.dataset.albumStyle ?? ""] ?? "?"} picked`);
  parts.push(
    pics.length === 1
      ? `one picture, ${pics[0]}`
      : `${pics.length} pictures, each ${pics[0]}`,
  );
  const slot = room.querySelector<HTMLElement>("[data-develop-slot][data-open]");
  const row = slot?.querySelector<HTMLElement>("[data-develop-row]");
  if (row && getComputedStyle(slot!).display !== "none") {
    const r = row.getBoundingClientRect();
    const foot = room.querySelector("[data-room-foot]")?.getBoundingClientRect();
    const fold = foot ? foot.top : win.innerHeight;
    parts.push(
      r.height < 2
        ? "the develop time opening"
        : r.bottom <= fold
          ? `the develop time in view, ${px(r.top)} px down`
          : `the develop time UNDER THE FOLD, ${px(r.top - fold)} px past the foot`,
    );
  } else if (on.dataset.albumStyle === "disposable") {
    parts.push("no develop time on this screen");
  }
  return true;
}

/** The beat: what the code is, what stands under it, what the close carries. */
function readBeat(room: HTMLElement, parts: string[]) {
  const beat = room.querySelector<HTMLElement>("[data-beat]");
  if (!beat) return;
  const state = beat.dataset.beat;
  const sample = beat.querySelector<HTMLElement>("[data-beat-sample]");
  const real = beat.querySelector("[data-beat-real]");
  const sampleSeen =
    sample &&
    Number(getComputedStyle(sample.firstElementChild ?? sample).opacity) > 0.05;
  parts.push(
    state === "arrived"
      ? "her own code, made"
      : state === "failed"
        ? "the failure, held on the beat"
        : real
          ? "her code developing"
          : sampleSeen
            ? "the sample, waiting"
            : "a blank print, waiting",
  );
  const close = beat.querySelector<HTMLElement>(
    "[data-beat-steps], [data-cw-close]",
  );
  if (state === "arrived")
    parts.push(
      close
        ? close.matches("[data-beat-steps]")
          ? `closes on ${close.querySelectorAll("li").length} marks`
          : close.dataset.cwClose === "named"
            ? `closes on ${close.querySelectorAll("li").length} named steps`
            : "closes on one line"
        : "closes on nothing of Settings",
    );
}

/** Where a failure is said, if one is. */
function readFailure(room: HTMLElement, parts: string[]) {
  const doc = room.ownerDocument;
  const toastEl = doc.querySelector("[data-sonner-toast]");
  if (toastEl) parts.push("a toast says it failed");
  const said = room.querySelector<HTMLElement>("[data-cw-failed]");
  if (said)
    parts.push(
      said.dataset.cwFailed === "line"
        ? "said under the question"
        : "said where she was looking",
    );
}

/**
 * ONE READER FOR EVERY FRAME: the screen standing, the steppers, the step's
 * own facts (the styles, or the beat and a failure), the words a host reads,
 * where the question and the one action stand, and whether the room scrolls.
 */
export const readRoom: Reader = (root, win) => {
  const room = roomOf(root);
  if (!room) return null;
  const screen = room.dataset.room ?? "";
  const parts = [`${SCREEN_NAMES[screen] ?? screen}`];
  const hairlines = room.querySelectorAll("[data-room-step]").length;
  if (hairlines) parts.push(`${hairlines} steps`);
  if (screen === "add" && !readStyles(room, win, parts)) return null;
  if (screen === "develop") {
    const row = room.querySelector("[data-develop-row]");
    if (row) parts.push(`the develop time ${px(row.getBoundingClientRect().top)} px down`);
  }
  readBeat(room, parts);
  readFailure(room, parts);
  if (room.getAttribute("aria-busy") === "true") parts.push("working");
  parts.push(`${wordsIn(room)} words to read`);
  const q = questionAt(room);
  if (q) parts.push(q);
  const go = reachOf(room, win);
  if (go) parts.push(go);
  const over = overflowOf(room);
  if (over) parts.push(over);
  return parts.join("; ");
};
