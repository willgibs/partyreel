import type { BoardState } from "@/components/lab/exploration";

import { type Ground, type Screen } from "./knobs";

/**
 * EVERY ANSWER AND KNOB A STORY READS, off the board's state, in one place:
 * each story takes the whole state and reads what it needs here, so a later
 * question is drawn in the earlier answer (the returning guest's Add as the
 * `over` answer leaves it) without the board's map knowing which reads which.
 * Each reader falls back to the decision's own `today` where the state says
 * nothing (the board opens every other axis at today, `Decision.today`).
 */

export type OverWay = "switch" | "offer" | "wrap";
export type KeepsakeWay = "closed" | "reel" | "hers" | "still";
export type CardWay = "name" | "cover" | "strip" | "light";
export type RecapWay = "stage" | "hub" | "cover" | "home";
export type BridgeWay = "home" | "header" | "end";

const pick = <T extends string>(
  v: string | undefined,
  ways: readonly T[],
  fallback: T,
): T => (ways.includes(v as T) ? (v as T) : fallback);

/** A guest's screen: a phone first. */
export const guestScreen = (s: BoardState): Screen =>
  pick(s.screen, ["375", "1440"] as const, "375");

/** The host's screen: a laptop first. */
export const hostScreen = (s: BoardState): Screen =>
  pick(s.desk, ["1440", "375"] as const, "1440");

/** The ground under a page: paper (light) first. */
export const groundIn = (s: BoardState): Ground =>
  pick(s.ground, ["paper", "room"] as const, "paper");

export const overIn = (s: BoardState): OverWay =>
  pick(s.over, ["switch", "offer", "wrap"] as const, "switch");

export const keepsakeIn = (s: BoardState): KeepsakeWay =>
  pick(s.keepsake, ["closed", "reel", "hers", "still"] as const, "closed");

export const cardIn = (s: BoardState): CardWay =>
  pick(s.card, ["name", "cover", "strip", "light"] as const, "name");

export const recapIn = (s: BoardState): RecapWay =>
  pick(s.recap, ["stage", "hub", "cover", "home"] as const, "stage");

export const bridgeIn = (s: BoardState): BridgeWay =>
  pick(s.bridge, ["home", "header", "end"] as const, "home");

/** Whether the party is over by her wrap (Add stays open, receded) rather than her closing adding (Add gone). */
export const wrapped = (s: BoardState) => overIn(s) === "wrap";
