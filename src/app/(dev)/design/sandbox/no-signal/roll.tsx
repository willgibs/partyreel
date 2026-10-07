"use client";

import { afterShotHint, reelCaption } from "@/lib/guest/camera/words";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";
import { cn } from "@/lib/utils";

import {
  type CameraState,
  CellarCamera,
  HisShots,
  ReelAt2x,
  RefusedInAlbum,
} from "./camera";
import { CELLAR_SHOTS, ROLL } from "./fixtures";
import {
  find,
  findAll,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";
import { WaitPoint } from "./stack";
import { reelWaiting, shotsWaitingLine } from "./words";

/**
 * A DISPOSABLE'S ROLL IN A DEAD ZONE (the `roll` ask, Will's one-way door):
 * Sam has 4 frames left of 24 when he goes down to the cellar, where there is
 * no signal, and he keeps pressing until the camera stops him or he stops.
 *
 * ★ TODAY, AS BUILT (`album-camera.tsx`, `shots.ts`'s `pendingSince`): a shot
 * that fails for want of a line leaves the count and the reel at once, so the
 * camera says "4 left" through the cellar, each press says "Shot 21 taken."
 * (`afterShotHint`: the frame the count says is next) before the uploader's
 * dropped line and its Retry come back, and nothing stops him. Upstairs, with
 * the camera open, the line's return sends all six again (`retryByItself` on
 * `online`): the count falls from 4 to the roll's end at once, the first four
 * land, and the server refuses the last two in its own words. ★ NOT IN HIS
 * LIST: his shots skip a refusal for the roll (`tiles`: only a send that may go
 * again is drawn), so the two are said only when he closes the camera, on the
 * album's failure sheet, whose Retry both cannot pass (`retryCanPass` reads
 * `roll_spent` as a send that may go again).
 *
 * ★ LIKE FILM: every press spends a frame on the device at once, sent or not,
 * so the count steps down in the cellar, the roll ends at 0 with its waiting
 * shots said, and the four land as the line returns; the server still counts
 * at insert, so only a second device could go past the roll (refused, as now).
 *
 * ★ UNDER THE FRAMES, A LEDGER (a lab drawing, never the product's): each press
 * in the cellar, the count the camera showed after it, and where its shot is
 * at 12:41 am; under it, the reel of the first frame at twice a phone's size.
 */

export type RollWay = "lands" | "taken";

/** The frames he has when he goes down. */
const LEFT = ROLL.cap - ROLL.before;

const frameCaption = (frame: number) =>
  reelCaption({ frame, cap: ROLL.cap, done: false, host: false, sending: 0 });

/** His second shot in the cellar, the line under the shutter at rest. */
const SECOND: Record<RollWay, CameraState> = {
  // Off the count and the reel, said in the uploader's own sentence beside production's Retry.
  lands: {
    used: ROLL.before,
    waiting: 0,
    left: LEFT,
    caption: frameCaption(ROLL.before + 1),
    hint: UPLOAD_WORDS.dropped,
    retry: true,
  },
  taken: {
    used: ROLL.before + 2,
    waiting: 2,
    left: LEFT - 2,
    caption: reelWaiting(frameCaption(ROLL.before + 3), 2),
    hint: shotsWaitingLine(2),
  },
};

/** Still pressing: today his 6th, the moment after the press; like film, his 4th, the roll's end. */
const PRESSING: Record<RollWay, CameraState> = {
  // The press says its frame for a moment (`SAID_MS`), Retry hidden under it: the 21st, as at every press down here.
  lands: {
    ...SECOND.lands,
    hint: afterShotHint(ROLL.before + 1),
    retry: false,
  },
  // The line under the shutter goes with the shutter, so the roll's end says what waits in its own caption line.
  taken: {
    used: ROLL.cap,
    waiting: LEFT,
    left: 0,
    caption: reelWaiting(
      reelCaption({
        frame: ROLL.cap,
        cap: ROLL.cap,
        held: ROLL.cap,
        done: true,
        host: false,
        sending: 0,
      }),
      LEFT,
    ),
    hint: "",
    done: true,
    doneNote: shotsWaitingLine(LEFT),
  },
};

/** Each frame's point first: the whole stage cuts a title at about 46 characters. */
const TITLES: Record<RollWay, readonly [string, string, string]> = {
  lands: [
    "11:49 pm · 2nd shot: off the reel, 4 left",
    "11:53 pm · 6th shot: still 4 left, not stopped",
    "12:41 am · back in the album: 2 of 6 refused",
  ],
  taken: [
    "11:49 pm · 2nd shot: 2 left, 2 waiting",
    "11:51 pm · 4th shot: his roll ends, 4 waiting",
    "12:41 am · his shots: all 4 in, none refused",
  ],
};

/* ── what the frames read ──────────────────────────────────────────────── */

/** Reads whichever surface the frame holds: the album's sheet, his shots, or the camera. */
const readRoll: Reader = (root, win) => {
  const sheet = find(root, "[role='dialog']");
  if (sheet && inView(sheet, win)) {
    const rows = [...sheet.querySelectorAll("[data-upload-failures] li")];
    const said = [
      ...new Set(
        rows.map((li) =>
          textOf(li.querySelector(":scope > span.flex-1 > span:last-child")),
        ),
      ),
    ];
    const keys = [...sheet.querySelectorAll("button")]
      .map((b) => textOf(b))
      .filter((t) => t && t !== "Close");
    return parts(
      `the album's sheet: "${textOf(sheet.querySelector("h2"))}"`,
      `${rows.length} rows: ${said.map((s) => `"${s}"`).join(", ")}`,
      `its keys: ${keys.join(", ")}`,
    );
  }
  if (find(root, "[data-ns-shots]")) {
    const words = findAll(root, ".cam-shot").map((r) =>
      textOf(r.querySelector(".cam-shot-words")),
    );
    const tally = [...new Set(words)]
      .map((w) => `${words.filter((x) => x === w).length} "${w}"`)
      .join(", ");
    const head = textOf(find(root, ".cam-shots-bar p"));
    return parts(
      `his shots: "${head}"`,
      `${words.length} in the list: ${tally}`,
    );
  }
  const cells = findAll(root, ".cam-cell");
  // His cellar shots are the reel's only minutes past 11 pm.
  const his = cells.filter((c) => textOf(c).startsWith("11:")).length;
  const waiting = cells.filter((c) => c.hasAttribute("data-sending")).length;
  const done = find(root, "[data-cam-done]");
  const hint = textOf(find(root, "[data-cam-hint]"));
  const retry = find(root, ".cam-hint-action");
  // The roll's end: its line and the caption under its keys (the title is the panel's own name).
  const end = done
    ? [...done.querySelectorAll(":scope > p")].slice(1).map(textOf)
    : [];
  return parts(
    `${textOf(find(root, "[data-cam-count] p"))} left`,
    `"${textOf(find(root, "[data-cam-caption]"))}"`,
    `${his} of his cellar shots on the reel, ${waiting} waiting`,
    done
      ? `the roll's end: ${end.map((l) => `"${l}"`).join(" ")}`
      : `"${hint}"${retry ? " beside Retry" : ""}`,
  );
};

/* ── the ledger under the frames ───────────────────────────────────────── */

type Fate = "in" | "refused" | "untaken";

/**
 * EACH PRESS IN THE CELLAR: the count the camera showed after it (null where
 * the shutter was off and no press could be), and where its shot is at 12:41.
 */
const PRESSES: Record<RollWay, readonly { left: number | null; fate: Fate }[]> =
  {
    lands: CELLAR_SHOTS.map((_, i) => ({
      left: LEFT,
      fate: i < LEFT ? "in" : "refused",
    })),
    taken: CELLAR_SHOTS.map((_, i) =>
      i < LEFT
        ? { left: LEFT - 1 - i, fate: "in" }
        : { left: null, fate: "untaken" },
    ),
  };

const FATE_WORDS: Record<Fate, string> = {
  in: "In",
  // Said once across the two frames they stand under.
  refused: "Both refused",
  untaken: "Never taken",
};

const LEDGER_HEAD =
  "His presses in the cellar: the count each one left, and where each shot is at 12:41 am.";

const LEDGER_LINE: Record<RollWay, string> = {
  lands:
    "The count stayed at 4 and nothing stopped him; as the line came back it fell to 0, and his last 2 were refused.",
  taken:
    "Each press spent a frame and the shutter stopped at 0; as the line came back, all 4 went in.",
};

const REEL_LINE: Record<RollWay, string> = {
  lands:
    "The reel at 11:49 pm, at twice a phone's size: neither of his 2 shots is on it.",
  taken:
    "The reel at 11:49 pm, at twice a phone's size: his 2 waiting, half-lit and still.",
};

const COUNT_CELL = "text-[13px] leading-tight text-muted-foreground";
const FATE_CELL = "flex items-center gap-1.5 text-sm leading-tight";

/**
 * HIS PRESSES, THE COUNT EACH LEFT, AND WHERE EACH SHOT ENDS: one row a fact,
 * the two the shutter never took (like film) drawn as the empty frames they
 * are, the two the roll refused (today) as the photographs he lost; under it
 * the reel at twice a phone's size. ★ A COLUMN, so the whole stage stands it
 * beside the phones in the room their height leaves, at a size it can be read
 * at once the stage is scaled to fit.
 */
function CellarLedger({ way }: { way: RollWay }) {
  const presses = PRESSES[way];
  const fifth = presses[LEFT]!;
  return (
    <figure
      data-ns-ledger={way}
      className="m-0 flex w-full max-w-[34rem] flex-col gap-4"
    >
      <figcaption className="flex flex-col gap-1 text-sm text-pretty">
        <span className="text-muted-foreground">{LEDGER_HEAD}</span>
        <span>{LEDGER_LINE[way]}</span>
      </figcaption>
      <div className="grid grid-cols-6 gap-x-2.5 gap-y-2">
        {presses.map((p, i) => (
          <span
            key={`shot-${i}`}
            data-ns-fate={p.fate}
            className={cn(
              "relative aspect-[3/4] w-full overflow-hidden rounded-tile",
              p.fate === "untaken"
                ? "outline-1 -outline-offset-1 outline-muted-foreground/45 outline-dashed"
                : "bg-muted",
            )}
          >
            {p.fate === "untaken" ? null : (
              // eslint-disable-next-line @next/next/no-img-element -- his shot, as the press took it
              <img
                src={CELLAR_SHOTS[i]!.src}
                alt=""
                className={cn(
                  "size-full object-cover",
                  p.fate === "refused" && "opacity-40 grayscale",
                )}
              />
            )}
          </span>
        ))}
        {presses.map((p, i) =>
          p.left === null ? null : (
            <span key={`left-${i}`} className={cn(COUNT_CELL, "tabular-nums")}>
              {`${p.left} left`}
            </span>
          ),
        )}
        {fifth.left === null ? (
          <span className={cn(COUNT_CELL, "col-span-2")}>Shutter off</span>
        ) : null}
        {presses.slice(0, LEFT).map((p, i) => (
          <span key={`fate-${i}`} className={FATE_CELL}>
            <WaitPoint lit />
            {FATE_WORDS[p.fate]}
          </span>
        ))}
        <span className={cn(FATE_CELL, "col-span-2")}>
          {fifth.fate === "refused" ? <WaitPoint unlit /> : null}
          {FATE_WORDS[fifth.fate]}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <ReelAt2x s={SECOND[way]} />
        <p className="text-[13px] text-pretty text-muted-foreground">
          {REEL_LINE[way]}
        </p>
      </div>
    </figure>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

export function RollStory({ way }: { way: RollWay }) {
  const id = (k: string) => `ns-roll-${k}-${way}`;
  const [t1, t2, t3] = TITLES[way];
  return (
    <Story under={<CellarLedger way={way} />}>
      <Scene id={id("second")} title={t1} measure={readRoll}>
        <CellarCamera s={SECOND[way]} />
      </Scene>
      <Scene id={id("pressing")} title={t2} measure={readRoll}>
        <CellarCamera s={PRESSING[way]} />
      </Scene>
      <Scene id={id("back")} title={t3} measure={readRoll}>
        {way === "lands" ? <RefusedInAlbum /> : <HisShots landed={LEFT} />}
      </Scene>
    </Story>
  );
}
