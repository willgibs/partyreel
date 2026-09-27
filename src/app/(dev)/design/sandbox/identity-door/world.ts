import type { BoardState } from "@/components/lab/board-spec";

/**
 * THE WORLD EVERY SCREEN IS DRAWN IN: one answer per ask of round three.
 *
 * ★ EVERY AXIS STARTS AT TODAY (`Decision.today`). A step hands its preview
 * the state with every answer Will has already given worn, so a later ask is
 * judged in the door his earlier picks made; an axis he has not answered is
 * production as it is, never another option's guess.
 */

export type Icons = "today" | "lit" | "bare";
export type Chooser = "today" | "told" | "link" | "bare";
export type Hint = "today" | "change" | "none";
export type Code = "today" | "mail" | "inplace";
export type Beat = "today" | "lit" | "hers";

export type World = {
  icons: Icons;
  chooser: Chooser;
  hint: Hint;
  code: Code;
  beat: Beat;
};

export const TODAY: World = {
  icons: "today",
  chooser: "today",
  hint: "today",
  code: "today",
  beat: "today",
};

const pick = <T extends string>(
  v: string | undefined,
  all: readonly T[],
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

export const worldOf = (s: BoardState): World => ({
  icons: pick(s.icons, ["today", "lit", "bare"], "today"),
  chooser: pick(s.chooser, ["today", "told", "link", "bare"], "today"),
  hint: pick(s.hint, ["today", "change", "none"], "today"),
  code: pick(s.code, ["today", "mail", "inplace"], "today"),
  beat: pick(s.beat, ["today", "lit", "hers"], "today"),
});

/** A stable key for a frame: the same world draws the same frame. */
export const worldKey = (w: World) =>
  `${w.icons}.${w.chooser}.${w.hint}.${w.code}.${w.beat}`;
