"use client";

import { useState } from "react";

import {
  Cell,
  Compare,
  CopyButton,
  Knob,
  Labeled,
  Loupe,
  Paste,
  ReviewCard,
  SelectTable,
  Specimen,
  Stage,
  Toggle,
} from "@/components/lab";

import type { SessionStep } from "../_desk/session-step";

/**
 * THE KIT'S SPECIMENS: each piece rendered, so the kit page is the same kind of
 * page as a library component's.
 *
 * ★ EVERY SPECIMEN IS REAL, NEVER A PICTURE OF ONE. A kit page that drew a
 * screenshot of a dock would be exactly the failure the kit exists to end (a
 * board arguing from a rendering of evidence rather than from evidence), so the
 * dock here is a dock, the compare compares, and the loupe magnifies. The two
 * pieces that cannot be shown inertly are the Frame, which would load real
 * pages into this page, and the BoardPage template, which IS the two pilot
 * boards: both are linked rather than mounted.
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
const DEMO_STEPS: SessionStep[] = [
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

export function ReviewCardDemo() {
  const [ground, setGround] = useState("cinema");
  return (
    <div className="flex flex-col gap-3">
      <ReviewCard
        boardId="kit-demo"
        steps={DEMO_STEPS}
        param="kit-demo.ground"
        setState={(patch) => {
          if (patch.ground) setGround(patch.ground);
        }}
        className="mx-0 mt-0 rounded-xl border sm:static"
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
        A pick on an ask that names a control sets that control, so the answer
        and the evidence for it are one gesture. Press 1, 2 or 3.
      </p>
    </div>
  );
}

export function ToggleDemo() {
  const [v, setV] = useState("desktop");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Knob label="Canvas">
        <Toggle
          ariaLabel="Canvas"
          options={[
            { id: "desktop", label: "1440" },
            { id: "phone", label: "375" },
          ]}
          value={v}
          onChange={setV}
        />
      </Knob>
      <span className="text-[11px] text-muted-foreground">
        The name goes on the control: a dock of five unnamed pill groups is five
        questions a stranger answers by clicking.
      </span>
    </div>
  );
}

export function StageDemo() {
  return (
    <Labeled
      name="A 375 canvas on the app's light ground"
      note="Real pixels, so a size is judged at the size it ships. A breakpoint prefix inside a stage reads the BROWSER's width, not the canvas's; key off the mode prop instead."
    >
      <Stage mode="phone" ground="app-light" height={220} fit="zoom">
        <div className="flex h-full flex-col justify-center gap-3 px-6">
          <p className="font-heading text-2xl tracking-tight">A real stage</p>
          <p className="text-sm text-muted-foreground">
            375 CSS pixels wide, on the ground the app paints.
          </p>
        </div>
      </Stage>
    </Labeled>
  );
}

export function SpecimenDemo() {
  return (
    <Specimen cols={3}>
      {[2, 8, 16].map((r) => (
        <Cell
          key={r}
          name={`${r}px`}
          note={r === 2 ? "today" : undefined}
          proposed={r === 8 ? "the corner you can see" : undefined}
        >
          <div
            className="size-20 border border-border bg-muted"
            style={{ borderRadius: r }}
          />
        </Cell>
      ))}
    </Specimen>
  );
}

export function CompareDemo() {
  const card = (r: number) => (
    <div
      className="flex h-24 items-center justify-center border border-border bg-muted text-[11px] text-muted-foreground"
      style={{ borderRadius: r }}
    >
      {r}px
    </div>
  );
  return (
    <Compare
      mode="wipe"
      differs="The corner radius, 2px against 8px. Nothing else in the card moves, so the seam down the middle is the difference."
      a={card(2)}
      b={card(8)}
    />
  );
}

export function LoupeDemo() {
  return (
    <Loupe zoom={6} size={140}>
      <div className="flex gap-1 p-6">
        {[2, 3, 4].map((r) => (
          <div
            key={r}
            className="size-16 bg-foreground/80"
            style={{ borderRadius: r }}
          />
        ))}
      </div>
    </Loupe>
  );
}

export function SelectTableDemo() {
  const [v, setV] = useState("c");
  return (
    <SelectTable
      caption="The rows are the choice: the numbers being compared and the control that picks between them are one object."
      columns={["Family", "Surface", "Float", "Tile"]}
      rows={[
        {
          id: "a",
          cells: ["A, Today", "2", "8", "3"],
          note: "the site as built",
        },
        { id: "b", cells: ["B, Square", "0", "6", "0"] },
        { id: "c", cells: ["C, Soft", "8", "12", "4"], recommended: true },
        { id: "d", cells: ["D, One family", "6", "6", "6"] },
      ]}
      value={v}
      onChange={setV}
    />
  );
}

export function PasteDemo() {
  return (
    <Paste
      label="The block a ruling would land"
      lines={3}
      code={`:root {
  --radius: 8px;
  --radius-float: 12px;
  --radius-tile: 4px;
}

.surface-paper {
  --radius: 8px;
}`}
    />
  );
}

export function CopyDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton text="review rounding r5: surfaces=c; ladder=quarters" />
      <span className="text-[11px] text-muted-foreground">
        One settled state, 1.6 seconds, everywhere on a board. The clipboard can
        reject without a gesture or over plain http; the label stays put rather
        than lying.
      </span>
    </div>
  );
}
