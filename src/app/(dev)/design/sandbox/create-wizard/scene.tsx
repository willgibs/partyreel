"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN.
 *
 * ★ A REAL VIEWPORT AT A DEVICE'S OWN SIZE (375 by 812, 1440 by 900): the
 * type ladder is a `vw` clamp and the three shapes part at a desk, so only a
 * same-origin frame at the true width shows what a host meets. The lab's
 * front door draws it (`Frame`, fitted by `Fit`, captioned by `Measured`).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer: Create's form, its Server Action and
 * the beat's live read are drawn at rest, every control inert. A frame is its
 * own document, so a link pressed in it goes nowhere.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the words a host
 * reads on the screen (the pictures' own type aside), the picture's size,
 * where the one action sits for a thumb, how many of Settings' steps are
 * ticked. If a caption and the words above a frame disagree, the caption is
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
          timers={[300, 1200, 2600]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, read left to right as Create runs. Phones stand in
 * a row; laptops wrap two to a row, so four of them stand as a square rather
 * than a strip of thumbnails.
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

/**
 * THE WORDS A HOST READS ON THE SCREEN, the pictures' own type aside: every
 * text node outside a `[data-cw-picture]` (a guest's phone in a card, a code's
 * plate), split on whitespace, counting a token with a letter or a digit in
 * it. Hidden text is never drawn here, so a node's text is its reading.
 */
export function wordsIn(root: Element): number {
  const doc = root.ownerDocument;
  const walk = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let n = 0;
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    if (t.parentElement?.closest("[data-cw-picture], [data-cw-skip]")) continue;
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

/** Where the screen's one action (`data-cw-go`) sits for a thumb. */
function reachOf(root: HTMLElement, win: Window): string | null {
  const go = root.querySelector<HTMLElement>("[data-cw-go]");
  if (!go) return null;
  const r = go.getBoundingClientRect();
  if (r.height < 2) return null;
  const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
  return `${(go.innerText || "the action").trim()} ${px(r.height)} px tall, ${down}% down`;
}

/** A whole screen: its words, its picture, its action. */
export const readScreen: Reader = (root, win) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  if (!screen) return null;
  const parts = [`${wordsIn(screen)} words to read`];
  const pic = sizeOf(root.querySelector("[data-cw-hero]"));
  if (pic) parts.push(`the picture ${pic}`);
  const go = reachOf(root, win);
  if (go) parts.push(go);
  return parts.join("; ");
};

/** The camera step: which is picked, each card's size, what the compare shows. */
export const readMode: Reader = (root) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  const picked = root.querySelector<HTMLElement>(
    '[data-cw-choice][data-state="on"]',
  );
  if (!screen || !picked) return null;
  const card = sizeOf(root.querySelector("[data-cw-choice] [data-cw-picture]"));
  if (!card) return null;
  const parts = [
    `picked: ${picked.dataset.cwChoice === "camera" ? "the camera" : "the album"}`,
    `each picture ${card}`,
    `${wordsIn(screen)} words to read`,
  ];
  const rows = root.querySelectorAll("[data-cw-row]").length;
  if (rows) parts.push(`the compare: ${rows} rows`);
  const at = root.querySelector<HTMLElement>("[data-cw-hour]");
  if (at) parts.push(`the night at ${at.dataset.cwHour}`);
  const sheet = root.querySelector<HTMLElement>("[data-cw-sheet]");
  if (sheet)
    parts.push(
      `a sheet of ${sheet.querySelectorAll("[data-cw-picture]").length} pictures`,
    );
  const defaults = root.querySelectorAll("[data-cw-default]").length;
  if (defaults) parts.push(`the camera's ${defaults} defaults`);
  return parts.join("; ");
};

/** The beat: the code's size, the rail's ticks, its words. */
export const readBeat: Reader = (root, win) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  const code = sizeOf(root.querySelector("[data-cw-code] svg"));
  if (!screen || !code) return null;
  const parts = [`the code ${code}`];
  const steps = root.querySelectorAll("[data-cw-step]");
  if (steps.length) {
    const ticked = root.querySelectorAll('[data-cw-step][data-done="true"]');
    parts.push(`${ticked.length} of ${steps.length} steps ticked`);
  }
  parts.push(`${wordsIn(screen)} words to read`);
  const go = reachOf(root, win);
  if (go) parts.push(go);
  return parts.join("; ");
};
