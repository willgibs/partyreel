"use client";

import { useState } from "react";

import { BoardDock, DockRow, Knob } from "@/components/lab/dock";
import { Step } from "@/components/lab/step";
import { Toggle } from "@/components/lab/toggle";

import type { AskStep } from "../_desk/session-step";

/**
 * WHAT A BOARD BECOMES, MOUNTED: the two pieces of machinery a board's spec
 * turns into, so an agent writing decisions sees where they land.
 *
 * ★ EVERY SPECIMEN IS REAL, NEVER A PICTURE OF ONE. A kit page that drew a
 * screenshot of a dock would be exactly the failure the kit exists to end (a
 * board arguing from a rendering of evidence rather than from evidence), so
 * the step here is the step and the dock is the dock. They are machinery, not
 * the front door: a board never imports them (its decisions become the step,
 * its `configs` the dock's knobs), which is why they are imported by module.
 * The tools that stood here beside them (a loupe, a compare, a cost meter, a
 * select table, a catalog's cards) left with the page-shaped board, because no
 * question-first board used them (the lab revamp, 2026-09-29).
 */

/**
 * THE REVIEW CARD, on a fixture queue of its own (the clarity round,
 * 2026-09-15).
 *
 * ★ THE BOARD ID IS DELIBERATELY NOT A BOARD. The card holds an answer under
 * `<board>.r<n>.<ask>` in the reader's own review store, which is the same
 * store Will's real answers live in, so a demo on a real board id would put a
 * fixture answer in his ledger message. `kit-demo` is in no registry and no
 * queue reads it, so the demo writes somewhere nothing will ever compose from.
 *
 * ★ AND IT IS UNPINNED HERE. On a board the card sticks under the dock; this
 * page has no dock and no evidence to keep clear, so the className drops the
 * bleed and the sticky and the specimen sits in the flow like every other one.
 */
const DEMO_STEPS: AskStep[] = [
  {
    kind: "ask",
    board: "kit-demo",
    boardTitle: "A fixture board",
    round: 0,
    askId: "ground",
    question: "Which ground should this specimen be judged on?",
    context:
      "The ground is the surface a specimen is read against: the marketing cinema dark, the paper light, or the app's own dark. It is the kind of thing an ask has to say before it can be answered by someone who has not read the board.",
    look: "The panel under the card, which is the control this ask names.",
    options: [
      {
        id: "cinema",
        label: "Cinema",
        means: "The marketing dark, where the lamps were tuned.",
      },
      {
        id: "paper",
        label: "Paper",
        means: "The light marketing ground, where two of the five go dirty.",
      },
      {
        id: "app-dark",
        label: "App dark",
        means: "The app's own dark, where a missing shadow shows first.",
      },
    ],
    recommended: "cinema",
    evidence: null,
    control: "ground",
    boardHref: "/design/lab/kit",
  },
  {
    kind: "ask",
    board: "kit-demo",
    boardTitle: "A fixture board",
    round: 0,
    askId: "last",
    question: "And the last ask of a queue links out rather than steps?",
    context:
      "Inside a board Next is a state change with no navigation. The last ask of a board links to the next board's first open ask, and the last ask of the whole queue links to the desk's summary, which is the link on this one.",
    options: [
      { id: "yes", label: "Yes", means: "Press Next and read where it goes." },
      { id: "no", label: "No", means: "Then this card owes a round." },
    ],
    recommended: "yes",
    evidence: null,
    boardHref: "/design/lab/kit",
  },
];

export function StepDemo() {
  const [ground, setGround] = useState("cinema");
  return (
    <div className="flex flex-col gap-3">
      <Step
        boardId="kit-demo"
        steps={DEMO_STEPS}
        param="kit-demo.ground"
        board={{
          state: { ground },
          setState: (patch) => {
            if (patch.ground) setGround(patch.ground);
          },
          // No section is drawn here: the demo's point is the show-versus-choose
          // gesture, and a board's real evidence is a whole board.
          evidence: () => null,
        }}
      />
      <div
        className="flex h-24 items-center justify-center rounded-xl border border-border text-[11px]"
        style={{
          background:
            ground === "paper"
              ? "oklch(0.97 0.004 95)"
              : ground === "app-dark"
                ? "oklch(0.18 0.006 265)"
                : "oklch(0.13 0.012 285)",
          color: ground === "paper" ? "oklch(0.2 0 0)" : "oklch(0.95 0 0)",
        }}
      >
        the ground the ask names, set by the pick above
      </div>
      <p className="text-[11px] text-muted-foreground">
        A press on a tile SHOWS its option on the ground above; a second press
        on the same tile records it, and a third clears it and puts the ground
        back. Press 1, 2 or 3.
      </p>
    </div>
  );
}

export function DockDemo() {
  const [canvas, setCanvas] = useState("desktop");
  return (
    // The dock is sticky; a short wrapper bounds where it can stick, so the
    // demo cannot ride down the whole toolbox.
    <div className="relative h-28 overflow-hidden rounded-xl border border-border">
      <BoardDock label="A fixture board's controls">
        <DockRow>
          <Knob label="Canvas">
            <Toggle
              ariaLabel="Canvas"
              options={[
                { id: "desktop", label: "1440" },
                { id: "phone", label: "375" },
              ]}
              value={canvas}
              onChange={setCanvas}
            />
          </Knob>
        </DockRow>
      </BoardDock>
      <p className="px-3 py-2 text-[11px] text-muted-foreground">
        The board&rsquo;s own switches at the left, the shell&rsquo;s reading
        controls at the right end. On a board the template fills it from the
        declared controls.
      </p>
    </div>
  );
}
