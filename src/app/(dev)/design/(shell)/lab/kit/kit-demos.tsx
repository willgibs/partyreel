"use client";

import { useState } from "react";

import {
  type BoardSpec,
  BeforeAfter,
  BoardDock,
  Catalog,
  Cell,
  Compare,
  CompareTwo,
  CopyButton,
  CostMeter,
  defineBoard,
  DockRow,
  ItemVerdictRow,
  Knob,
  Labeled,
  Loupe,
  Notes,
  Paste,
  Step,
  SelectTable,
  type Spot,
  SpotCompare,
  Specimen,
  Stage,
  Toggle,
  Walk,
} from "@/components/lab";

import type { AskStep } from "../_desk/session-step";

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

/** The two halves of one card, touching: the whole of what BeforeAfter is. */
export function BeforeAfterDemo() {
  return (
    <BeforeAfter
      before={
        <div className="grid h-20 w-40 place-items-center rounded-lg border border-border text-[11px] text-muted-foreground">
          a plain edge
        </div>
      }
      after={
        <div className="grid h-20 w-40 place-items-center rounded-lg border border-border text-[11px] text-muted-foreground shadow-[0_0_24px_-6px_var(--color-foreground)]">
          the same edge, lit
        </div>
      }
    />
  );
}

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

/* ── The catalog, and everything hung off it ─────────────────────────────── */

/**
 * ONE FIXTURE SPEC FOR THE CATALOG, THE TWO-UP, THE SPOTS, THE WALK AND THE
 * NOTES, so the toolbox demonstrates the pieces WORKING TOGETHER rather than
 * five unrelated islands. Its id is `kit-demo`, which is in no registry, so a
 * verdict pressed here lands in the reader's store under a scope nothing ever
 * composes a message from.
 */
const DEMO_SPEC: BoardSpec = defineBoard({
  id: "kit-demo",
  title: "A fixture board",
  question: "Which corner should a card have?",
  round: { n: 0, date: "2026-09-16", changed: "the fixture" },
  verdict: {
    recommendation: "The soft corner.",
    because: "It is the one you can see at arm's length.",
  },
  asks: [],
  candidates: [
    {
      id: "square",
      name: "Square",
      one: "No corner at all: the edge is the shape.",
      verdict: "kill",
      facts: [["Radius", "0px"]],
      rationale:
        "Cheapest to draw and the hardest to soften later, because every nested surface inherits the decision.",
    },
    {
      id: "today",
      name: "Today",
      one: "The corner the site ships, two pixels of it.",
      verdict: "refine",
      facts: [["Radius", "2px"]],
      rationale: "It is what ships, so it is what a candidate has to beat.",
    },
    {
      id: "soft",
      name: "Soft",
      one: "A corner you can see from a metre away.",
      verdict: "ship",
      recommended: true,
      facts: [["Radius", "8px"]],
      rationale:
        "The step a reviewer can name without a loupe, which is the whole test for a corner.",
    },
  ],
  departures: [],
  assets: [],
  sections: [
    { id: "catalog", title: "The catalog", lede: "Three corners." },
    { id: "spots", title: "The places", lede: "Where a corner lands." },
  ],
  catalog: {
    section: "catalog",
    control: "pick",
    compare: ["compare-a", "compare-b"],
  },
  controls: [
    {
      id: "pick",
      label: "Pick",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "square", label: "Square" },
        { id: "today", label: "Today" },
        { id: "soft", label: "Soft" },
      ],
      default: "none",
      clearable: true,
    },
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "square", label: "Square" },
        { id: "today", label: "Today" },
        { id: "soft", label: "Soft" },
      ],
      default: "today",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "square", label: "Square" },
        { id: "today", label: "Today" },
        { id: "soft", label: "Soft" },
      ],
      default: "soft",
    },
  ],
  notes: [
    {
      section: "catalog",
      state: { pick: "soft" },
      text: "A note carries the state it was written in, and one press puts the board there. This one is only true with Soft picked.",
    },
  ],
  lookFirst: [
    {
      section: "catalog",
      state: { pick: "soft" },
      note: "Start on the board's own pick, so the first thing you see is what it is arguing for.",
    },
    {
      section: "spots",
      state: { pick: "square" },
      note: "Then the one it is arguing against, in the places the corner actually lands.",
    },
  ],
  links: { bible: [] },
});

const RADIUS: Record<string, number> = { square: 0, today: 2, soft: 8 };

/** The judged thing: one card, at one corner. Real pixels, never a picture. */
function Corner({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex items-center justify-center p-5">
      <div
        className="flex size-24 items-center justify-center border border-border bg-card text-[11px] text-muted-foreground"
        style={{ borderRadius: RADIUS[id] ?? 0 }}
      >
        {label}
      </div>
    </div>
  );
}

/** The demos that share one board state, so a Pick here moves the pair below. */
function useDemoState() {
  const [state, set] = useState<Record<string, string>>({
    pick: "none",
    "compare-a": "today",
    "compare-b": "soft",
  });
  return {
    state,
    setState: (patch: Record<string, string>) =>
      set((s) => ({ ...s, ...patch })),
  };
}

export function CatalogDemo() {
  const { state, setState } = useDemoState();
  return (
    <div className="flex flex-col gap-4">
      <Catalog
        spec={DEMO_SPEC}
        state={state}
        setState={setState}
        ground="app-light"
        render={(candidate) => (
          <Corner id={candidate.id} label={candidate.name} />
        )}
      />
      <p className="text-[11px] text-muted-foreground">
        Press Pick and the card drives the board; press it again and the pick
        clears. A and B set the pair below. The verdict row is the
        reviewer&rsquo;s, and it writes to the same store the desk composes his
        message from.
      </p>
      <CompareTwo
        spec={DEMO_SPEC}
        state={state}
        render={(candidate) => (
          <div className="rounded-lg border border-border">
            <Corner id={candidate.id} label={candidate.name} />
          </div>
        )}
      />
    </div>
  );
}

const DEMO_SPOTS: readonly Spot[] = [
  {
    id: "card",
    name: "A card on the dashboard",
    note: "The commonest surface in the product, and the one a corner is judged on first.",
  },
  { id: "tile", name: "A photograph in the album" },
];

export function SpotCompareDemo() {
  const { state } = useDemoState();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-muted-foreground">
        CompareTwo is under the Catalog above. This is the other shape: the same
        two real places, drawn under A and under B.
      </p>
      <SpotCompare
        spec={DEMO_SPEC}
        state={state}
        spots={DEMO_SPOTS}
        render={(spot, candidate) => (
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">{spot.name}</p>
            <Corner id={candidate.id} label={candidate.name} />
          </div>
        )}
      />
    </div>
  );
}

export function ItemVerdictDemo() {
  return (
    <div className="flex flex-col gap-2">
      <ItemVerdictRow scope="kit-demo" round={0} id="soft" name="Soft" />
      <p className="text-[11px] text-muted-foreground">
        Press the same word twice and it clears; the note survives, because the
        words are the expensive half.
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

export function WalkDemo() {
  const { state, setState } = useDemoState();
  return (
    <div className="flex flex-col gap-2">
      <Walk spec={DEMO_SPEC} setState={setState} />
      <p className="text-[11px] text-muted-foreground">
        Each step scrolls to its section AND sets the state it was written for.
        The pick is now {state.pick}.
      </p>
    </div>
  );
}

export function NotesDemo() {
  const { state, setState } = useDemoState();
  return (
    <Notes
      spec={DEMO_SPEC}
      section="catalog"
      state={state}
      setState={setState}
    />
  );
}

export function CostDemo() {
  return (
    <CostMeter
      phases={[
        { id: "rest", label: "Rest", solo: "none" },
        { id: "running", label: "Running", solo: "target" },
      ]}
      statics="A fixture: nothing on this page animates, so both phases read the same and that IS the reading."
    />
  );
}
