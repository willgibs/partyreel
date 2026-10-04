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
  "[data-cw-picture], [data-cw-flight], [data-room-ghost], [data-room-flight], [aria-hidden], .sr-only, [inert]";

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
  const q = room.querySelector("[data-room-question] h1");
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
  approval: "Reviewed",
  disposable: "Disposable",
};

/**
 * The add step: which style is picked and how many are offered, the pictures'
 * sizes, the night's moment, the develop time, the words, and where the
 * question and Continue stand.
 */
export const readAdd: Reader = (root, win) => {
  const room = roomOf(root);
  if (!room) return null;
  const choices = [...room.querySelectorAll<HTMLElement>("[data-cw-choice]")];
  const picked = choices.find((c) => c.dataset.state === "on");
  if (!picked) return null;
  const phones = [...room.querySelectorAll("[data-cw-phone]")].map(sizeOf);
  const styles = [...room.querySelectorAll("[data-cw-style-picture]")].map(
    sizeOf,
  );
  const shots = [...room.querySelectorAll(".cw-strip-shot")].map(sizeOf);
  if ([...phones, ...styles, ...shots].some((p) => !p)) return null;
  const parts = [
    `${choices.length} styles offered, ${NAMES[picked.dataset.cwChoice ?? ""] ?? "?"} picked`,
  ];
  if (phones.length)
    parts.push(
      phones.length === 1
        ? `one phone, ${phones[0]}`
        : `${phones.length} phones, each ${phones[0]}`,
    );
  if (styles.length) parts.push(`${styles.length} pictures, each ${styles[0]}`);
  if (shots.length) parts.push(`${shots.length} moments, each ${shots[0]}`);
  const night = room.querySelector<HTMLElement>("[data-cw-night]");
  if (night) parts.push(`the night at ${night.dataset.cwNight}`);
  const develop = room.querySelector<HTMLElement>("[data-cw-develop]");
  if (develop) parts.push(`develops ${develop.dataset.cwDevelop}`);
  parts.push(`${wordsIn(room)} words to read`);
  const q = questionAt(room);
  if (q) parts.push(q);
  const go = reachOf(room, win);
  if (go) parts.push(go);
  const over = overflowOf(room);
  if (over) parts.push(over);
  return parts.join("; ");
};

/** Settings on paper: the styles it offers, the one ticked, the words. */
export const readPaper: Reader = (root) => {
  const doc = root.ownerDocument;
  const cards = [...doc.querySelectorAll<HTMLElement>("[data-album-style]")];
  if (!cards.length) return null;
  const on = cards.find((c) => c.dataset.state === "on");
  const pictures = [...doc.querySelectorAll("[data-cw-style-picture]")].map(
    sizeOf,
  );
  if (pictures.some((p) => !p)) return null;
  const body = doc.querySelector("[data-settings-page]");
  return [
    `Settings on paper: ${cards.length} album styles, ${NAMES[on?.dataset.albumStyle ?? ""] ?? "none"} ticked`,
    `each picture ${pictures[0]}`,
    body ? `${wordsIn(body)} words on the page` : null,
  ]
    .filter(Boolean)
    .join("; ");
};
