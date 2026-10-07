"use client";

import { reelCaption } from "@/lib/guest/camera/words";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";

import { type CameraState, CellarCamera, CellarShots } from "./camera";
import { ROLL } from "./fixtures";
import {
  find,
  findAll,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";
import { reelWaiting, shotsWaitingLine } from "./words";

/**
 * A DISPOSABLE'S ROLL IN A DEAD ZONE (the `roll` ask, Will's one-way door):
 * Sam has 4 frames left of 24 when he goes down to the cellar, where there is
 * no signal, and he keeps pressing until the camera stops him or he stops.
 *
 * ★ TODAY, AS BUILT (`roll-view.ts`, `shots.ts`'s `pendingSince`): a shot that
 * fails for want of a line is taken off the count and the reel at once, so
 * the camera says "4 left" through the cellar and lets him take 6; upstairs
 * it sends them again by itself (while it is open), the first 4 land and the
 * server refuses the other 2 in its own words, which his shots list says as
 * "Didn't send". ★ LIKE FILM: every press spends a frame on the device at
 * once, so the count steps down in the cellar, the roll ends at 0, and the
 * four waiting land as the line returns; the server still counts at insert,
 * so a second device is the only way past the roll (and is refused, as now).
 */

export type RollWay = "lands" | "taken";

const LEFT = ROLL.cap - ROLL.before;

/** His second shot in the cellar. */
const SECOND: Record<RollWay, CameraState> = {
  lands: {
    used: ROLL.before,
    waiting: 0,
    left: LEFT,
    caption: reelCaption({
      frame: ROLL.before + 1,
      cap: ROLL.cap,
      done: false,
      host: false,
      sending: 0,
    }),
    hint: UPLOAD_WORDS.dropped,
    retry: true,
  },
  taken: {
    used: ROLL.before + 2,
    waiting: 2,
    left: LEFT - 2,
    caption: reelWaiting(
      reelCaption({
        frame: ROLL.before + 3,
        cap: ROLL.cap,
        done: false,
        host: false,
        sending: 0,
      }),
      2,
    ),
    hint: shotsWaitingLine(2),
  },
};

/** Still pressing: six taken (today), or the roll's end at its fourth (like film). */
const PRESSING: Record<RollWay, CameraState> = {
  lands: SECOND.lands,
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
    hint: shotsWaitingLine(LEFT),
    done: true,
  },
};

const TITLES: Record<RollWay, readonly [string, string, string]> = {
  lands: [
    "11:49 pm · the cellar, his 2nd shot there: the count still says 4",
    "11:53 pm · his 6th shot there: the count still says 4",
    "12:40 am · upstairs, the line back: 4 go in, 2 are refused",
  ],
  taken: [
    "11:49 pm · the cellar, his 2nd shot there: 2 left, 2 waiting",
    "11:51 pm · his 4th: that's his roll, 4 waiting",
    "12:40 am · upstairs, the line back: all 4 go in",
  ],
};

const readCamera: Reader = (root) => {
  const shots = find(root, "[data-ns-shots]");
  if (shots) {
    const rows = findAll(root, ".cam-shot");
    const words = rows.map((r) => textOf(r.querySelector(".cam-shot-words")));
    const failed = words.filter((w) => /send/i.test(w)).length;
    return `his shots: ${rows.length} (${rows.length - failed} developing, ${failed} didn't send)`;
  }
  const count = textOf(find(root, "[data-cam-count] p"));
  const caption = textOf(find(root, "[data-cam-caption]"));
  const hint = textOf(find(root, "[data-cam-hint]"));
  const waiting = findAll(root, ".cam-cell[data-sending]").length;
  const done = find(root, "[data-cam-done]");
  return parts(
    `${count} left`,
    `"${caption}"`,
    `${waiting} frames waiting on the reel`,
    done ? "the roll's end stands" : hint ? `"${hint}"` : undefined,
  );
};

export function RollStory({ way }: { way: RollWay }) {
  const id = (k: string) => `ns-roll-${k}-${way}`;
  const [t1, t2, t3] = TITLES[way];
  return (
    <Story>
      <Scene id={id("second")} title={t1} measure={readCamera}>
        <CellarCamera s={SECOND[way]} />
      </Scene>
      <Scene id={id("pressing")} title={t2} measure={readCamera}>
        <CellarCamera s={PRESSING[way]} />
      </Scene>
      <Scene id={id("back")} title={t3} measure={readCamera}>
        <CellarShots refused={way === "lands" ? ROLL.cellar - LEFT : 0} />
      </Scene>
    </Story>
  );
}
