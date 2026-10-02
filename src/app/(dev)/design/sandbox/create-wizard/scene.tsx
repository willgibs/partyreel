"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN.
 *
 * ★ A REAL VIEWPORT AT A DEVICE'S OWN SIZE (375 by 812, 1440 by 900): the
 * type ladder is a `vw` clamp and the room is laid out against the screen's
 * height, so only a same-origin frame at the true size shows what a host
 * meets. The lab's front door draws it (`Frame`, fitted by `Fit`, captioned
 * by `Measured`).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer. The live frames (Try it, a step as it
 * opens) run on local state.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the words a host
 * reads on the screen (the pictures' own type aside), the picture's size,
 * where the one action and Back sit, what is ticked. If a caption and the
 * words above a frame disagree, the caption is the truth.
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
 * text node outside a `[data-cw-picture]` (a guest's phone, a code's plate,
 * the keyboard), split on whitespace, counting a token with a letter or a
 * digit in it. A page at rest is one page; a step change draws two, and is
 * read by its arriving page.
 */
export function wordsIn(root: Element): number {
  const doc = root.ownerDocument;
  const height = doc.defaultView?.innerHeight ?? Infinity;
  const walk = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let n = 0;
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    const el = t.parentElement;
    if (el?.closest("[data-cw-picture], [data-cw-flyer], [aria-hidden]"))
      continue;
    // A sheet still under the screen's foot is not read yet.
    const r = el?.getBoundingClientRect();
    if (r && (r.top >= height || r.bottom <= 0)) continue;
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

/** Where Back stands, if the step has one. */
function backOf(root: HTMLElement): string | null {
  const back = root.querySelector<HTMLElement>("[data-cw-back]");
  if (!back) return null;
  return back.dataset.cwBack === "foot"
    ? "Back beside the button"
    : "Back at the head's left";
}

/** The page a reader should count: the arriving one when two are drawn. */
function pageOf(root: HTMLElement): HTMLElement | null {
  const pages = root.querySelectorAll<HTMLElement>("[data-cw-page]");
  return pages[pages.length - 1] ?? null;
}

/** The question's top, from the screen's top: the place it never leaves. */
function questionAt(root: HTMLElement): string | null {
  const page = pageOf(root);
  const q = page?.querySelector("[data-cw-question] h1");
  const screen = root.querySelector("[data-cw-screen]");
  if (!q || !screen) return null;
  const top =
    q.getBoundingClientRect().top - screen.getBoundingClientRect().top;
  return `the question ${px(top)} px down`;
}

/** A step at rest, or a change between two: its words, its picture, Back, its action. */
export const readScreen: Reader = (root, win) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  const page = pageOf(root);
  if (!screen || !page) return null;
  // A change draws the leaving page too; the words are the arriving step's.
  const leaving = [...screen.querySelectorAll("[data-cw-page]")].slice(0, -1);
  const words =
    wordsIn(screen) - leaving.reduce((n, p) => n + wordsIn(p), 0);
  const parts = [`${words} words to read`];
  const q = questionAt(root);
  if (q) parts.push(q);
  const name = screen.querySelector<HTMLElement>("[data-cw-name-dst]");
  if (name?.innerText.trim()) parts.push("the name in the head");
  const back = backOf(screen);
  if (back) parts.push(back);
  const go = reachOf(screen, win);
  if (go) parts.push(go);
  return parts.join("; ");
};

/** The add step: which is picked, each phone's size, the hour, the camera's setting. */
export const readAdd: Reader = (root) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  const picked = root.querySelector<HTMLElement>(
    '[data-cw-choice][data-state="on"]',
  );
  if (!screen || !picked) return null;
  const phones = [...root.querySelectorAll("[data-cw-phone]")].map((p) =>
    sizeOf(p),
  );
  if (phones.some((p) => !p)) return null;
  const parts = [
    `picked: ${picked.dataset.cwChoice === "camera" ? "the camera" : "the album"}`,
    phones.length === 1
      ? `one phone, ${phones[0]}`
      : `${phones.length} phones, ${phones.join(" and ")}`,
  ];
  const at = root.querySelector<HTMLElement>("[data-cw-hour]");
  if (at) parts.push(`the night at ${at.dataset.cwHour}`);
  const reveal = root.querySelector<HTMLElement>("[data-cw-reveal]");
  if (reveal) parts.push(`develops ${reveal.dataset.cwReveal}`);
  parts.push(`${wordsIn(screen)} words to read`);
  return parts.join("; ");
};

/** The look step: the code's size, the looks on offer, the words. */
export const readLook: Reader = (root) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  if (!screen) return null;
  const codes = [...root.querySelectorAll("[data-cw-code] svg, [data-cw-picture] svg")]
    .map((s) => s.getBoundingClientRect().width)
    .filter((w) => w > 2);
  if (!codes.length) return null;
  const parts = [
    `the largest code ${px(Math.max(...codes))} px`,
    `${codes.length} code${codes.length === 1 ? "" : "s"} on screen`,
  ];
  const look =
    root.querySelector<HTMLElement>('[data-cw-style][data-state="on"]')?.dataset
      .cwStyle ??
    root.querySelector<HTMLElement>("[data-cw-code]")?.dataset.cwCode;
  if (look) parts.push(`on ${look}`);
  parts.push(`${wordsIn(screen)} words to read`);
  return parts.join("; ");
};

/** The beat: the code's size, what is ticked, room, the words and the action. */
export const readBeat: Reader = (root, win) => {
  const screen = root.querySelector<HTMLElement>("[data-cw-screen]");
  const code = sizeOf(root.querySelector("[data-cw-real] svg"));
  if (!screen || !code) return null;
  const parts = [`the code ${code}`];
  const steps = root.querySelectorAll("[data-cw-step]");
  if (steps.length) {
    const ticked = root.querySelectorAll('[data-cw-step][data-done="true"]');
    parts.push(
      root.querySelector('[data-cw-left="list"]')
        ? `${steps.length} rows left`
        : `${ticked.length} of ${steps.length} steps ticked`,
    );
  }
  if (root.querySelector("[data-cw-room], [data-cw-step='room']"))
    parts.push("room said");
  parts.push(`${wordsIn(screen)} words to read`);
  const go = reachOf(screen, win);
  if (go) parts.push(go);
  return parts.join("; ");
};
