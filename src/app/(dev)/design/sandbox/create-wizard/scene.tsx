"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN.
 *
 * ★ A REAL VIEWPORT AT A DEVICE'S OWN SIZE (375 by 812, 1440 by 900): the
 * type ladder is a `vw` clamp, the room is laid out against the screen's
 * height and her event's page against its width, so only a same-origin frame
 * at the true size shows what a host meets. The lab's front door draws it
 * (`Frame`, fitted by `Fit`, captioned by `Measured`), and the frame's own
 * window carries the Aurora's filter host, so the room's light is
 * production's field, never a stand-in.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the screen standing,
 * the words a host reads on it (the pictures' own type aside), what the beat
 * says and its one button, what her event's checklist says, each picture's
 * size and what it is doing. If a caption and the words above a frame
 * disagree, the caption is the truth.
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
          timers={[300, 1200, 2800, 6000]}
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
  "[data-style-picture], [data-room-ghosts], [data-room-flyers], [data-cw-flyer], [aria-hidden], .sr-only, [inert], [role='img']";

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
    if (Number(el.ownerDocument.defaultView?.getComputedStyle(el).opacity) < 0.05)
      continue;
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

/** An element's visible words, trimmed to one line. */
const said = (el: Element | null | undefined): string =>
  ((el as HTMLElement | null)?.innerText ?? el?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();

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
  return `"${said(go) || "the action"}" ${px(r.height)} px tall, ${down}% down`;
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
  develop: "Disposable's own screen",
  look: "the code's look",
  beat: "the beat",
  invite: "the invite screen",
};

const MOMENT_NAMES: Record<string, string> = {
  arrive: "arriving",
  party: "the party",
  morning: "next morning",
};

/**
 * The album style step: what is picked, the pictures and their sizes, which one is moving and where in its story,
 * and whether the slider stands under them.
 */
function readPreviews(room: HTMLElement, parts: string[]): boolean {
  const cards = [...room.querySelectorAll<HTMLElement>("[data-album-style]")];
  const on = cards.find((c) => c.dataset.state === "checked");
  if (!on) return false;
  const pics = [
    ...room.querySelectorAll<HTMLElement>("[data-style-picture]"),
  ].filter((p) => p.getBoundingClientRect().height >= 2);
  if (pics.length === 0) return false;
  parts.push(`${NAMES[on.dataset.albumStyle ?? ""] ?? "?"} picked`);
  const sizes = pics.map(sizeOf);
  parts.push(
    pics.length === 1
      ? `one picture, ${sizes[0]}`
      : `${pics.length} pictures, each ${sizes[0]}`,
  );
  const moving = pics.filter(
    (p) => p.dataset.moment && p.dataset.moment !== "rest",
  );
  if (moving.length)
    parts.push(
      `${moving.length === 1 ? "one picture" : `${moving.length} pictures`} at ${MOMENT_NAMES[moving[0]!.dataset.moment!] ?? moving[0]!.dataset.moment}`,
    );
  parts.push(
    room.querySelector("[data-night]") ? "the slider under them" : "no slider",
  );
  return true;
}

/** The beat: her code made or making, its sub, what stands under the code, the head's close. */
function readBeat(room: HTMLElement, win: Window, parts: string[]) {
  const beat = room.querySelector<HTMLElement>("[data-beat]");
  if (!beat) return;
  const made = beat.dataset.beat === "arrived";
  parts.push(made ? "her own code, made" : "the sample, developing");
  if (!made) return;
  const sub = room.querySelector("[data-cw-sub]");
  if (sub) parts.push(`the sub says "${said(sub)}"`);
  const rounds = room.querySelectorAll("[data-beat-rounds] .cr-act").length;
  if (rounds) parts.push(`${rounds} rounds under the code`);
  const starts = room.querySelector("[data-cw-starts]");
  if (starts) parts.push(`then "${said(starts)}"`);
  const tiles = [...room.querySelectorAll<HTMLElement>(".cw-tile")];
  if (tiles.length)
    parts.push(
      `${tiles.filter((t) => t.dataset.state === "up").length} of ${tiles.length} photos up`,
    );
  const close = room.querySelector<HTMLElement>("[data-room-close]");
  const shown =
    close &&
    Number(win.getComputedStyle(close).opacity) > 0.05 &&
    win.getComputedStyle(close).visibility !== "hidden";
  parts.push(shown ? "the head's close standing" : "no close in the head");
}

/** The invite screen: the message's size and its ways out. */
function readInvite(room: HTMLElement, parts: string[]) {
  const msg = room.querySelector(".cw-message");
  const size = sizeOf(msg);
  if (size) parts.push(`the message ${size}`);
  const acts = [...room.querySelectorAll("[data-cw-invite-acts] .cr-act")];
  if (acts.length)
    parts.push(`its ways out: ${acts.map((a) => said(a)).join(", ")}`);
}

/** The room's screens: the steppers, the step's own facts, the words, the question and the one action. */
function readTheRoom(room: HTMLElement, win: Window): string | null {
  const screen = room.dataset.room ?? "";
  const parts = [`${SCREEN_NAMES[screen] ?? screen}`];
  const hairlines = room.querySelectorAll("[data-room-step]").length;
  if (hairlines) parts.push(`${hairlines} steps`);
  if (screen === "add" && !readPreviews(room, parts)) return null;
  if (screen === "beat") readBeat(room, win, parts);
  if (screen === "invite") readInvite(room, parts);
  if (room.getAttribute("aria-busy") === "true") parts.push("working");
  parts.push(`${wordsIn(room)} words to read`);
  const q = questionAt(room);
  if (q) parts.push(q);
  const go = reachOf(room, win);
  if (go) parts.push(go);
  const over = overflowOf(room);
  if (over) parts.push(over);
  return parts.join("; ");
}

/**
 * Her event, as she lands: what the checklist says (its shape and its first words), the Settings card's word, the
 * album's (its photos, or its empty place's title), and how far down the first screen the checklist and the album start.
 */
function readHub(hub: HTMLElement, win: Window): string | null {
  const parts = ["her event"];
  const list = hub.querySelector<HTMLElement>("[data-checklist]");
  if (list) {
    const rows = list.querySelectorAll("[data-checklist-item]").length;
    const head = said(
      list.querySelector("[data-checklist-head]") ?? list.querySelector("p"),
    );
    parts.push(
      list.dataset.checklistFolded !== undefined
        ? `the checklist one line: "${said(list).replace(/\s*Show$/, "")}"`
        : rows
          ? `the checklist ${rows} rows under "${head}"`
          : `the checklist one line: "${said(list.querySelector("p"))}"`,
    );
    parts.push(`checklist ${px(list.getBoundingClientRect().top)} px down`);
  } else parts.push("no checklist");
  const settings = [...hub.querySelectorAll<HTMLElement>("a, button")].find(
    (el) => /^Settings\b/.test(el.getAttribute("aria-label") ?? said(el)),
  );
  if (settings)
    parts.push(
      `Settings card "${(settings.getAttribute("aria-label") ?? said(settings)).replace(/^Settings:?\s*/, "")}"`,
    );
  const tiles = hub.querySelectorAll("[data-cw-tile]").length;
  const empty = hub.querySelector("[data-album-empty]");
  if (tiles) parts.push(`${tiles} photos in the album`);
  else if (empty)
    parts.push(
      `the album empty: "${said(empty.querySelector("[data-slot='empty-title']") ?? empty)}"`,
    );
  const album = hub.querySelector("[data-cw-album]");
  if (album) {
    const top = px(album.getBoundingClientRect().top);
    parts.push(
      top < win.innerHeight
        ? `the album ${top} px down`
        : `the album UNDER THE FOLD, ${top - win.innerHeight} px past it`,
    );
  }
  return parts.join("; ");
}

/**
 * ONE READER FOR EVERY FRAME: the room's screen when the room stands, her event's page once she is in it.
 */
export const readRoom: Reader = (root, win) => {
  const doc = root.ownerDocument;
  const room = doc.querySelector<HTMLElement>("[data-room]");
  if (room) return readTheRoom(room, win);
  const hub = doc.querySelector<HTMLElement>("[data-cw-hub]");
  if (hub) return readHub(hub, win);
  return null;
};
