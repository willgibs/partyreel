/**
 * THE REEL AS A TIMELINE, AS DATA (disposable-mode r3, Will's `camera=timeline`: "the more modern reel also feels more
 * bespoke to the product, while staying pretty subtle"). Every frame of her roll in order: the ones she has spent,
 * sealed glass with the minute she took them; the one she is on, holding the live picture; the fresh ones after it.
 *
 * ★ HER SHOTS THIS VISIT ARE HER NEWEST FRAMES. The roll's count is the server's (`roll-view.ts`), which knows how many
 * frames she has spent but not which picture is which; this visit's shots, oldest first, take the last frames of the
 * spent run, so the reel can say their minutes, which is a video, and which are still going. An earlier visit's
 * frames are sealed glass with nothing on them.
 *
 * ★ A FRAME WAITING FOR THE LINE IS SPENT, AND SAYS IT WAITS (no-signal r1, Will's `roll=taken`): its shot is on the
 * roll from the press, sent or not, like film, so it stands among the spent frames with its minute, marked `waiting`
 * (half-lit and still, `camera-roll.css`) where one still going up is marked `sending` (the pulsing dot).
 *
 * Pure, so every rule is a unit test.
 */

export type ReelCellState = "exposed" | "current" | "rolling" | "fresh";

export type ReelCell = {
  /** Its frame on the roll, 1-based. */
  n: number;
  state: ReelCellState;
  /** This visit's shot on this frame. */
  shotKey?: string;
  /** The minute it was taken: "10:41". */
  minute?: string;
  /** A video's whole seconds. */
  video?: number;
  /** Its bytes are still on their way. */
  sending?: boolean;
  /** It waits for the line: spent, on the roll, and not yet sent (`roll=taken`). */
  waiting?: boolean;
};

/** A minute as the reel prints it, on the clock of the party: "10:41", "9:05". */
export function reelMinute(at: number): string {
  const d = new Date(at);
  const hour = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${hour}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function reelCells(input: {
  /** Frames on the roll. */
  cap: number;
  /** Frames spent. */
  used: number;
  /** A video is being filmed on the current frame. */
  recording: boolean;
  /** This visit's counted shots, oldest first. */
  recent: readonly {
    key: string;
    takenAt: number;
    kind: "photo" | "video";
    seconds?: number;
    sending: boolean;
    /** It waits for the line (optional, so every caller before the line's wait reads as before). */
    waiting?: boolean;
  }[];
}): ReelCell[] {
  const cap = Math.max(1, Math.floor(input.cap));
  const used = Math.max(0, Math.min(cap, Math.floor(input.used)));
  const recent = input.recent.slice(-used);
  const firstRecent = used - recent.length + 1;
  const cells: ReelCell[] = [];
  for (let n = 1; n <= cap; n++) {
    if (n <= used) {
      const shot = n >= firstRecent ? recent[n - firstRecent] : undefined;
      cells.push(
        shot
          ? {
              n,
              state: "exposed",
              shotKey: shot.key,
              minute: reelMinute(shot.takenAt),
              ...(shot.kind === "video"
                ? { video: Math.max(1, Math.round(shot.seconds ?? 0)) }
                : {}),
              ...(shot.waiting
                ? { waiting: true }
                : shot.sending
                  ? { sending: true }
                  : {}),
            }
          : { n, state: "exposed" },
      );
    } else if (n === used + 1) {
      cells.push({ n, state: input.recording ? "rolling" : "current" });
    } else {
      cells.push({ n, state: "fresh" });
    }
  }
  return cells;
}

/** The newest frame she has spent: the last exposed one (this visit's newest shot, where it has one), or none. */
export function newestCell(cells: readonly ReelCell[]): ReelCell | undefined {
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i].state === "exposed") return cells[i];
  }
  return undefined;
}

/** The frame the reel centres on: the one she is on, or the last once the roll is spent. */
export function reelCentre(cells: readonly ReelCell[]): number {
  const live = cells.find(
    (c) => c.state === "current" || c.state === "rolling",
  );
  return live ? live.n : (cells.at(-1)?.n ?? 1);
}
