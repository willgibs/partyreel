// @contract-for: src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
import { describe, expect, it } from "vitest";

import type { BoardSpec } from "@/components/lab/board-spec";

import type { AskState } from "./queue";
import { EMPTY_REVIEW, type ReviewStore } from "./review-store";
import { SAMPLE_BOARD } from "./sample-spec";
import { stepBlocked, toSteps, walkable } from "./session-step";
import { holdId, itemHoldId } from "./step-id";

/**
 * STAGING'S CONTRACT (the stepped review, 2026-09-16).
 *
 * ★ A QUESTION THAT ONLY EXISTS ONCE ANOTHER IS ANSWERED IS NOT A QUESTION YET.
 * Half of what made Will's sitting expensive was being asked about a world he
 * had not agreed to: the aurora's landing before the aurora was kept, the
 * accent's reach before an accent was chosen. `after` says so in the spec, and
 * the two halves of resolving it are pinned here: the LEDGER's, which only the
 * server can read and which rides the step as `afterRuled`, and the SESSION's,
 * which is what the reviewer answered a minute ago in this browser.
 *
 * ★ AND THE TWO HAVE TO AGREE. They are one rule read from two places, so a
 * disagreement would show as a step the desk lists and the walk skips (or
 * worse, the reverse): the cases below drive both sides of the same `after`.
 */

const SPEC_OF = (id: string) =>
  (id === SAMPLE_BOARD.id ? SAMPLE_BOARD : undefined) as BoardSpec | undefined;

const ROUND = SAMPLE_BOARD.round.n;

/** Every ask of the fixture as open work, which is what a first sitting sees. */
const openAsks = (): AskState[] =>
  SAMPLE_BOARD.asks.map((ask) => ({
    board: SAMPLE_BOARD.id,
    boardTitle: SAMPLE_BOARD.title,
    round: ROUND,
    ask,
    answer: null,
    staged: Boolean(ask.after),
    moot: false,
    outcome: "open" as const,
  }));

/** The steps, with whatever the ledger is said to hold for this board. */
const steps = (ruled: {
  answers?: Record<string, string | null>;
  items?: Record<string, string>;
}) =>
  toSteps(
    [
      {
        asks: openAsks(),
        items: [],
        ruled: { answers: ruled.answers ?? {}, items: ruled.items ?? {} },
      },
    ],
    SPEC_OF,
    null,
  );

const held = (ask: string, choice: string): ReviewStore => ({
  ...EMPTY_REVIEW,
  answers: { [holdId(SAMPLE_BOARD.id, ROUND, ask)]: { choice, note: "" } },
});

const NOTES = "notes";
const WINNER = "winner";

describe("a staged ask", () => {
  it("is blocked while the question it waits on is undecided", () => {
    const step = steps({}).find((s) => s.kind === "ask" && s.askId === NOTES)!;
    expect(step.after).toEqual({ ask: WINNER, option: "as-data" });
    expect(stepBlocked(step, EMPTY_REVIEW)).toBe("staged");
  });

  it("opens once that question is answered THIS WAY in the session", () => {
    const step = steps({}).find((s) => s.kind === "ask" && s.askId === NOTES)!;
    expect(stepBlocked(step, held(WINNER, "as-data"))).toBeNull();
  });

  it("is moot once that question went the other way", () => {
    const step = steps({}).find((s) => s.kind === "ask" && s.askId === NOTES)!;
    expect(stepBlocked(step, held(WINNER, "as-prose"))).toBe("moot");
  });

  it("stays staged on 'not clear to me', which is not a decision", () => {
    const step = steps({}).find((s) => s.kind === "ask" && s.askId === NOTES)!;
    expect(stepBlocked(step, held(WINNER, "?"))).toBe("staged");
  });

  /**
   * ★ THE LEDGER SIDE IS RESOLVED ON THE SERVER. The open work is by definition
   * what the ledger does NOT hold, so a prerequisite ruled last week is in
   * neither `asks` nor `items`: without `afterRuled` the follow-up would stay
   * staged for ever and the round could never complete.
   */
  it("opens on a ruling from an earlier sitting, with nothing held here", () => {
    const step = steps({ answers: { [WINNER]: "as-data" } }).find(
      (s) => s.kind === "ask" && s.askId === NOTES,
    )!;
    expect(step.afterRuled).toBe("as-data");
    expect(stepBlocked(step, EMPTY_REVIEW)).toBeNull();
  });

  it("is moot on a ruling from an earlier sitting that went the other way", () => {
    const step = steps({ answers: { [WINNER]: "as-a-form" } }).find(
      (s) => s.kind === "ask" && s.askId === NOTES,
    )!;
    expect(stepBlocked(step, EMPTY_REVIEW)).toBe("moot");
  });

  it("lets this sitting's answer overrule the ledger's", () => {
    const step = steps({ answers: { [WINNER]: "as-prose" } }).find(
      (s) => s.kind === "ask" && s.askId === NOTES,
    )!;
    expect(stepBlocked(step, held(WINNER, "as-data"))).toBeNull();
  });

  it("keeps a staged step out of the walk and the rest of it in", () => {
    const all = steps({});
    const open = walkable(all, EMPTY_REVIEW);
    expect(all.length - open.length).toBe(1);
    expect(open.some((s) => s.kind === "ask" && s.askId === NOTES)).toBe(false);
  });
});

describe("a step waiting on a catalog card", () => {
  const ITEM = SAMPLE_BOARD.candidates[0].id;
  const after = { item: ITEM, verdict: "keep" as const };
  const card = () => ({
    ...steps({}).find((s) => s.kind === "ask" && s.askId === NOTES)!,
    after,
    afterRuled: null,
  });

  it("is staged until the card is ruled, and moot on the other verdict", () => {
    expect(stepBlocked(card(), EMPTY_REVIEW)).toBe("staged");
    const keep: ReviewStore = {
      ...EMPTY_REVIEW,
      items: {
        [itemHoldId(SAMPLE_BOARD.id, ROUND, ITEM)]: {
          verdict: "keep",
          note: "",
        },
      },
    };
    expect(stepBlocked(card(), keep)).toBeNull();
    const kill: ReviewStore = {
      ...EMPTY_REVIEW,
      items: {
        [itemHoldId(SAMPLE_BOARD.id, ROUND, ITEM)]: {
          verdict: "kill",
          note: "",
        },
      },
    };
    expect(stepBlocked(card(), kill)).toBe("moot");
  });
});
