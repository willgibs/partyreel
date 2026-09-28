"use client";

import "@/components/guest/door.css";

import { useMemo } from "react";

import { ExplorationBoard } from "@/components/lab";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { WaitingTile } from "@/components/guest/upload/stack-tile";

import {
  ALBUM,
  EVENT,
  HELD_DECIDED,
  HELD_IN,
  HELD_OUT,
  HER_UPLOADS,
  LET_IN,
  PICK,
  type Still,
} from "./fixtures";
import {
  HELD_TOAST,
  type HeldPlace,
  type Register,
  STATUS,
  type StatusWords,
  UPLOADS_TITLE,
} from "./lines";
import { HeldLine, KeepAsk, UploadsList } from "./parts";
import {
  AlbumPage,
  HeldSheet,
  isCut,
  lineCount,
  lines,
  PHONE,
  QuotedToast,
  type Reader,
  Scene,
  Trio,
  UploadsScreen,
  wordCount,
} from "./scene";
import { VOICE_GUEST } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn in the place it ships, on
 * a 375 phone, with the rest of that place at today's words.
 *
 * ★ EVERY FRAME IS TITLED WITH ITS OPTION'S OWN NAME (the guidance: "the
 * specimen carries the option's name"), read off the spec rather than typed
 * twice, so the words on the stage head and the words over the phone agree.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`guest-capture`'s
 * discipline): how many of hers stand at the album's head, what the badge
 * reads, how many lines a status runs and whether the row cut it short, how
 * tall the keep's sheet stands. A line that looks short in a spec and is cut
 * at 375 is exactly what a voice board exists to catch, and the number under
 * the frame is the truth.
 */

const LABEL = (ask: string, option: string) => {
  const found = VOICE_GUEST.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** `held`'s option names, short enough to head a frame's own moment. */
const HELD_SHORT: Record<HeldPlace, string> = {
  tiles: "At the album's head",
  uploads: "Only in her uploads",
  line: "One line at the album's head",
  toast: "A toast, then her uploads",
};

/* ── what the frames read ──────────────────────────────────────────────────── */

const text = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** Her tracker's round button, as the frame draws it: its badge, or none. */
const badgeOf = (root: HTMLElement) => {
  const count = root.querySelector("[data-upload-tracker-count]");
  if (count) return `the badge reads ${text(count)}`;
  return root.querySelector("[data-upload-tracker]")
    ? "no badge"
    : "no round button";
};

/** The waiting tiles standing at the album's head, and their size. */
const tilesOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-waiting-tile]"));

/** 1. The moment her two go. */
const measureSent: Reader = (root) => {
  if (!root.querySelector("[data-vg-rows] [data-vg-tile]")) return null;
  const tiles = tilesOf(root);
  const line = root.querySelector("[data-vg-held-line]");
  const toast = root.querySelector("[data-vg-toast] [data-vg-line]");
  let where: string;
  if (tiles.length) {
    const w = Math.round(tiles[0].getBoundingClientRect().width);
    if (!w) return null;
    where = `${tiles.length} of hers at the album's head, ${w}px squares`;
  } else if (line) {
    const n = lineCount(line);
    if (!n) return null;
    where = `nothing of hers in the album, ${lines(n)} at its head`;
  } else if (toast) {
    const n = lineCount(toast);
    if (!n) return null;
    where = `a ${wordCount(text(toast))}-word toast on ${lines(n)}, nothing of hers in the album`;
  } else {
    where = "nothing of hers in the album";
  }
  return `Measured: ${where}; ${badgeOf(root)}.`;
};

/** 2. Later: Maya let one in and left one out. */
const measureLater: Reader = (root) => {
  const first = root.querySelector("[data-vg-rows] [data-vg-tile]");
  // Not settled until the one Maya let in leads the rows, as every option has it.
  if (first?.getAttribute("data-vg-tile") !== LET_IN.id) return null;
  const tiles = tilesOf(root);
  const head = tiles.length
    ? `the one left out still waits at the head, "${text(tiles[0])}"`
    : "nothing of hers waits in the album";
  return `Measured: ${head}; ${badgeOf(root)}.`;
};

/**
 * Her uploads, by what they show: how many of hers stand where, then how much
 * room each status's words leave on their row. A row's words are one
 * truncated line, so a status that grows is CUT, never wrapped: the room to
 * spare is how close each option comes to that, and the caption says "cut"
 * the moment it happens.
 */
const measureList: Reader = (root) => {
  const screen = root.querySelector("[data-vg-screen]");
  if (!screen) return null;
  const rows = Array.from(screen.querySelectorAll("[data-upload-tracker-row]"));
  if (!rows.length) return null;
  const count = (status: string) =>
    rows.filter((r) => r.getAttribute("data-upload-tracker-row") === status)
      .length;
  const tally = [
    [count("waiting"), "waiting"],
    [count("approved"), "in the album"],
    [count("refused"), "left out"],
  ]
    .filter(([n]) => n)
    .map(([n, what]) => `${n} ${what}`)
    .join(", ");
  const said: string[] = [];
  for (const [status, name] of [
    ["waiting", "waiting"],
    ["refused", "left out"],
  ] as const) {
    const el = screen.querySelector(`[data-vg-status="${status}"]`);
    const row = el?.parentElement;
    if (!el || !row) continue;
    if (isCut(el)) {
      said.push(`${name} is cut short`);
      continue;
    }
    const spare = Math.round(
      row.getBoundingClientRect().right - el.getBoundingClientRect().right,
    );
    if (!el.getBoundingClientRect().width) return null;
    said.push(`${name} fits with ${spare}px to spare`);
  }
  const why = screen.querySelector("[data-vg-why]");
  if (why) {
    const n = lineCount(why);
    if (!n) return null;
    said.push(`left out moves to its own section, its why on ${lines(n)}`);
  }
  return `Measured: ${tally}; ${said.join(", ")}.`;
};

/** The keep: how much there is to read before its button, and the sheet. */
const measureKeep: Reader = (root) => {
  const sheet = root.querySelector<HTMLElement>("[data-entry-sheet]");
  const ask = root.querySelector("[data-entry-sheet] [data-vg-line]");
  if (!sheet || !ask) return null;
  const n = lineCount(ask);
  const h = Math.round(sheet.getBoundingClientRect().height);
  if (!n || !h) return null;
  return `Measured: ${wordCount(text(ask))} words over ${lines(n)} before Confirm your email; the sheet stands ${h}px, ${Math.round((h / PHONE.h) * 100)}% of the phone.`;
};

/* ── 1. where a held photo shows ───────────────────────────────────────────── */

/** The real waiting tile (`stack-tile.tsx`), on a File standing in for hers. */
function Held({ still, name }: { still: Still; name: string }) {
  const file = useMemo(
    () => new File([], name, { type: "image/jpeg" }),
    [name],
  );
  return <WaitingTile file={file} url={still.src} />;
}

function HeldPreview({ place }: { place: HeldPlace }) {
  const tiles = place === "tiles";
  const short = HELD_SHORT[place];
  return (
    <Trio>
      {/* The moment her pick finishes: both of hers are with Maya. */}
      <Scene
        id={`vg-held-${place}-sent`}
        title={`${short}: the moment her 2 go`}
        measure={measureSent}
      >
        <AlbumPage
          moderated
          count={EVENT.approvedTotal}
          tracker={2}
          scroll
          head={
            tiles
              ? [
                  <Held key="in" still={HELD_IN} name="IMG_4821.jpg" />,
                  <Held key="out" still={HELD_OUT} name="IMG_4826.jpg" />,
                ]
              : []
          }
          line={place === "line" ? <HeldLine n={2} /> : undefined}
          items={ALBUM}
          overlay={
            place === "toast" ? (
              <QuotedToast title={HELD_TOAST(2)} action={UPLOADS_TITLE} />
            ) : undefined
          }
        />
      </Scene>
      {/* Later: Maya let the arch in and left the petals out. Today the album
          never learns a refusal, so its tile waits on; every other option
          holds nothing of hers that is not in the album. */}
      <Scene
        id={`vg-held-${place}-later`}
        title={`${short}: later, one let in and one left out`}
        measure={measureLater}
      >
        <AlbumPage
          moderated
          count={EVENT.approvedTotal + 1}
          tracker={tiles ? 1 : 0}
          scroll
          head={
            tiles
              ? [<Held key="out" still={HELD_OUT} name="IMG_4826.jpg" />]
              : []
          }
          items={[LET_IN, ...ALBUM]}
        />
      </Scene>
      {/* Her uploads, opened: where she learns the one left out, in today's
          words (`status` asks those). The same list in every option. */}
      <Scene
        id={`vg-held-${place}-list`}
        title={`${short}: her uploads, opened`}
        measure={measureList}
      >
        <AlbumPage
          moderated
          count={EVENT.approvedTotal + 1}
          tracker={0}
          items={[LET_IN, ...ALBUM]}
          overlay={
            <UploadsScreen>
              <UploadsList uploads={HELD_DECIDED} words={STATUS.today} />
            </UploadsScreen>
          }
        />
      </Scene>
    </Trio>
  );
}

/* ── 2. her uploads' words ─────────────────────────────────────────────────── */

function StatusScene({ words }: { words: StatusWords }) {
  return (
    <Scene
      id={`vg-status-${words}`}
      title={LABEL("status", words)}
      measure={measureList}
    >
      <AlbumPage
        moderated
        count={EVENT.approvedTotal + 2}
        tracker={1}
        items={[LET_IN, ...ALBUM]}
        overlay={
          <UploadsScreen>
            <UploadsList uploads={HER_UPLOADS} words={STATUS[words]} />
          </UploadsScreen>
        }
      />
    </Scene>
  );
}

/* ── 3. keeping it ─────────────────────────────────────────────────────────── */

function KeepScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-keep-${register}`}
      title={LABEL("keep", register)}
      measure={measureKeep}
    >
      <AlbumPage
        moderated={false}
        count={EVENT.approvedTotal + PICK}
        tracker={null}
        items={ALBUM}
        overlay={
          <HeldSheet>
            <KeepAsk register={register} />
          </HeldSheet>
        }
      />
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof VOICE_GUEST> = {
  "held.tiles": <HeldPreview place="tiles" />,
  "held.uploads": <HeldPreview place="uploads" />,
  "held.line": <HeldPreview place="line" />,
  "held.toast": <HeldPreview place="toast" />,

  "status.today": <StatusScene words="today" />,
  "status.host": <StatusScene words="host" />,
  "status.approval": <StatusScene words="approval" />,
  "status.apart": <StatusScene words="apart" />,

  "keep.today": <KeepScene register="today" />,
  "keep.warm": <KeepScene register="warm" />,
  "keep.bright": <KeepScene register="bright" />,
  "keep.exact": <KeepScene register="exact" />,
  "keep.tender": <KeepScene register="tender" />,
};

export function VoiceGuestBoard() {
  return <ExplorationBoard spec={VOICE_GUEST} previews={PREVIEWS} />;
}
