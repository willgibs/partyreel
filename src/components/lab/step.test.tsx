// @contract-for: src/components/lab/step.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  setReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import { composeMessage } from "@/app/(dev)/design/(shell)/lab/_desk/review-message";
import type {
  AskStep,
  ItemsStep,
  SessionStep,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import {
  holdId,
  itemHoldId,
} from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import type { BoardState } from "./board-spec";
import { Step, type StepBoard } from "./step";

/**
 * THE STEP'S CONTRACT (the stepped review, 2026-09-16).
 *
 * What is pinned here is the step's FUNCTION, never its look: that SHOWING an
 * option is not answering it, that choosing lands where the desk's summary
 * reads it, that a second choose clears the answer AND puts the stage back,
 * that "not clear to me" owes its reason, and that a staged question is not
 * asked until the one it waits on is decided.
 *
 * ★ THE FIRST THREE CASES ARE THE ROUND. The surface this replaces could only
 * preview an option by RECORDING it, so looking at five palettes meant
 * answering the question five times and un-answering it four; Will's sitting
 * stopped there. Show and choose being two different gestures is the whole
 * mechanism, and everything else here is furniture around it.
 *
 * Nothing about spacing, colour or motion is asserted. A contract guards a
 * component's function, structure and single sources (Will, 2026-09-12); the
 * step's look is precedent and the next round may rework all of it.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const DEPTH: AskStep = {
  kind: "ask",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  askId: "depth",
  question: "In dark mode, how should two overlapping things be told apart?",
  context: "In dark mode the site has no shadows today.",
  look: "The Separate section on the App dark ground.",
  options: [
    { id: "family", label: "The shadow family", means: "Two soft shadows." },
    { id: "lift", label: "The lift only", means: "One shadow." },
    { id: "neither", label: "No shadow in dark", means: "Dark stays flat." },
  ],
  recommended: "family",
  lands: "the two shadow tokens in theme.css.",
  evidence: { title: "Separate", href: "/design/lab/light#light-separate" },
  section: "separate",
  state: { ground: "app-dark" },
  boardHref: "/design/lab/light",
};

/** An ask that MIRRORS a control, which is what makes its tiles drawable. */
const REGISTER: AskStep = {
  kind: "ask",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  askId: "register",
  question: "How strong should the aurora be?",
  context: "The aurora is the wash of colour behind the composer.",
  options: [
    { id: "accent", label: "Accent: a glow on one section" },
    { id: "identity", label: "Identity: the page reads as a lit room" },
  ],
  recommended: "identity",
  evidence: null,
  section: "composer",
  control: "register",
  boardHref: "/design/lab/light",
};

/** Staged behind REGISTER: it only exists once the aurora is the identity. */
const LANDING: AskStep = {
  kind: "ask",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  askId: "landing",
  question: "Where should the aurora land?",
  context: "Only asked once the aurora is the page's identity.",
  options: [
    { id: "seam", label: "The footer seam only" },
    { id: "room", label: "The whole room" },
  ],
  recommended: "room",
  evidence: null,
  after: { ask: "register", option: "identity" },
  boardHref: "/design/lab/light",
};

const ELSEWHERE: AskStep = {
  kind: "ask",
  board: "type-scale",
  boardTitle: "The type scale",
  round: 2,
  askId: "ladder",
  question: "Which ladder?",
  options: [
    { id: "quarters", label: "Quarters" },
    { id: "thirds", label: "Thirds" },
  ],
  recommended: "quarters",
  evidence: null,
  boardHref: "/design/lab/type-scale",
};

/** A pick-one catalog's winner: the cards are the options, `none` is the exit. */
const WINNER: AskStep = {
  kind: "ask",
  board: "palette",
  boardTitle: "The palette",
  round: 8,
  askId: "palette",
  question: "Which palette should the whole site wear?",
  context: "It decides the grey ramp and every surface.",
  options: [
    { id: "graphite", label: "Graphite", state: { palette: "graphite" } },
    { id: "slate", label: "Slate", state: { palette: "slate" } },
    {
      id: "none",
      label: "None of these: new directions",
      means: "Say what to try instead.",
    },
  ],
  recommended: "graphite",
  evidence: null,
  control: "palette",
  winner: true,
  catalogSection: "catalog",
  stageSection: "dashboard",
  boardHref: "/design/lab/palette",
};

const CARDS: ItemsStep = {
  kind: "items",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  sectionTitle: "The catalog",
  items: [
    { id: "ember", name: "Ember", one: "A warm dark room." },
    { id: "ladder", name: "Ladder", one: "Ember with the warmth taken out." },
  ],
  vocabulary: ["keep", "refine", "kill"],
  mode: "keep-any",
  walk: "one-at-a-time",
  evidence: null,
  section: "catalog",
  boardHref: "/design/lab/light",
};

const QUEUE: SessionStep[] = [DEPTH, REGISTER, LANDING, ELSEWHERE];

/** A board surface that records what it was asked to draw, and in what state. */
function fakeBoard(): StepBoard & { drawn: [string, BoardState][] } {
  const drawn: [string, BoardState][] = [];
  const state: Record<string, string> = {};
  return {
    drawn,
    controls: [
      {
        id: "register",
        label: "Register",
        options: [
          { id: "off", label: "Off" },
          { id: "accent", label: "Accent" },
          { id: "identity", label: "Identity" },
        ],
        default: "off",
        clearable: true,
      },
    ],
    state,
    setState: (patch) => Object.assign(state, patch),
    evidence: (id, at) => {
      drawn.push([id, at]);
      return <div data-testid={`evidence-${id}`} />;
    },
  };
}

function step(
  param: string,
  board?: StepBoard,
  boardId: string | undefined = "light",
  steps: SessionStep[] = QUEUE,
) {
  return render(
    <Step boardId={boardId} steps={steps} param={param} board={board} />,
  );
}

/**
 * ★ A TILE IS NOT A <button>. It wraps the board's own evidence, and a real
 * section contains real buttons: nesting one inside a button is invalid HTML
 * and a hydration error (found live, 2026-09-16). So the tile is a
 * `role="button"` div whose preview is inert, and the tests reach it the way a
 * reader does.
 */
const tile = (label: string) =>
  screen.getByText(label).closest('[role="button"]') as HTMLElement;

beforeEach(() => {
  push.mockClear();
  setReviewStore(EMPTY_REVIEW);
  window.scrollTo = vi.fn();
});

describe("a step, show versus choose", () => {
  it("shows an option without recording it", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.click(tile("Accent: a glow on one section"));
    // The stage moved...
    expect(board.state.register).toBe("accent");
    // ...and nothing was answered.
    expect(
      getReviewStore().answers[holdId("light", 5, "register")],
    ).toBeUndefined();
  });

  it("records the option on a second press of the one being shown", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.click(tile("Accent: a glow on one section"));
    await userEvent.click(tile("Accent: a glow on one section"));
    expect(getReviewStore().answers[holdId("light", 5, "register")]).toEqual({
      choice: "accent",
      note: "",
    });
    // The store IS the summary's source: the desk composes the ledger line
    // from these same keys, and lab-review.test.ts proves the grammar.
    expect(
      composeMessage([
        { board: "light", round: 5, ask: "register", choice: "accent" },
      ]),
    ).toBe("review light r5: register=accent");
  });

  it("clears the answer on a third press and resets the stage", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.click(tile("Accent: a glow on one section")); // show
    await userEvent.click(tile("Accent: a glow on one section")); // choose
    await userEvent.click(tile("Accent: a glow on one section")); // clear
    expect(
      getReviewStore().answers[holdId("light", 5, "register")],
    ).toBeUndefined();
    // ★ The control goes back to its DECLARED default, not to the cleared
    // choice: a board still wearing an answer nobody holds is the un-unpickable
    // pick this round's sibling fixed (Will, 2026-09-16).
    expect(board.state.register).toBe("off");
  });

  it("draws every option on the board's own section, in that option's state", () => {
    const board = fakeBoard();
    step("light.register", board);
    const composer = board.drawn
      .filter(([id]) => id === "composer")
      .map(([, at]) => at.register);
    expect(composer).toEqual(expect.arrayContaining(["accent", "identity"]));
  });

  it("falls back to text tiles when nothing declares how to draw an option", () => {
    const board = fakeBoard();
    step("light.depth", board);
    // `depth` mirrors no control and its options carry no state, so the only
    // thing drawn is the stage, never a tile preview.
    expect(board.drawn.every(([id]) => id === "separate")).toBe(true);
    expect(screen.getByText("Two soft shadows.")).toBeInTheDocument();
  });
});

describe("a step, as a form", () => {
  it("asks the question in the words a stranger can answer it in", () => {
    step("light.depth", fakeBoard());
    expect(screen.getByRole("heading")).toHaveTextContent(DEPTH.question);
    expect(screen.getByText(DEPTH.context!)).toBeInTheDocument();
    expect(screen.getByText(DEPTH.lands!)).toBeInTheDocument();
    for (const option of DEPTH.options) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
      expect(screen.getByText(option.means!)).toBeInTheDocument();
    }
  });

  it("marks the option the board recommends, and only that one", () => {
    step("light.depth", fakeBoard());
    const said = screen.getAllByText("the board says");
    expect(said).toHaveLength(1);
    expect(said[0].closest('[role="button"]')).toHaveTextContent(
      "The shadow family",
    );
  });

  it("carries the note with the answer", async () => {
    step("light.depth", fakeBoard());
    await userEvent.click(tile("The shadow family"));
    await userEvent.type(screen.getByRole("textbox"), "the dim pair");
    expect(getReviewStore().answers[holdId("light", 5, "depth")]).toEqual({
      choice: "family",
      note: "the dim pair",
    });
  });

  it("applies the ask's declared state on landing", () => {
    const board = fakeBoard();
    step("light.depth", board);
    expect(board.state.ground).toBe("app-dark");
  });

  it("holds Next until a question marked unclear says what was unclear", async () => {
    step("light.depth", fakeBoard());
    await userEvent.click(screen.getByText("This question is not clear to me"));
    expect(getReviewStore().answers[holdId("light", 5, "depth")].choice).toBe(
      "?",
    );
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("button", { name: /^Next$/ })).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "which two things?");
    expect(screen.getByRole("button", { name: /^Next$/ })).toBeEnabled();
  });

  it("renders nothing for a session on another board", () => {
    const { container } = step("type-scale.ladder", fakeBoard());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("a step, staged behind another", () => {
  it("skips a staged step, and reaches it once its question is answered", async () => {
    // Nothing held: `landing` waits on `register`, so Next from `register`
    // goes past it and out of the board.
    const { unmount } = step("light.register", fakeBoard());
    await userEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(push).toHaveBeenCalledWith(
      "/design/lab/type-scale?session=type-scale.ladder",
    );
    unmount();

    push.mockClear();
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("light", 5, "register")]: { choice: "identity", note: "" },
      },
    });
    step("light.register", fakeBoard());
    await userEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("heading")).toHaveTextContent(LANDING.question);
  });

  it("drops a staged step as moot when its question went the other way", async () => {
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("light", 5, "register")]: { choice: "accent", note: "" },
      },
    });
    step("light.register", fakeBoard());
    await userEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(push).toHaveBeenCalledWith(
      "/design/lab/type-scale?session=type-scale.ladder",
    );
  });

  it("counts the walk without the staged steps", () => {
    step("light.depth", fakeBoard());
    // Four steps declared, one of them staged: the reviewer has three.
    expect(screen.getByText("step 1 of 3")).toBeInTheDocument();
  });
});

describe("a step on a catalog", () => {
  it("asks a pick-one catalog's winner on the cards themselves", async () => {
    const board = fakeBoard();
    step("palette.palette", board, "palette", [WINNER]);
    // The catalog section IS the tiles, so the grid is what gets drawn.
    expect(board.drawn.some(([id]) => id === "catalog")).toBe(true);
    // And "None of these" is the winner ask's own option, so the ledger line
    // stays `palette=none` and the grammar never grows a fourth word.
    await userEvent.click(tile("None of these: new directions"));
    expect(getReviewStore().answers[holdId("palette", 8, "palette")]).toEqual({
      choice: "none",
      note: "",
    });
  });

  it("walks a keep-any catalog one card at a time", async () => {
    step("light.items", fakeBoard(), "light", [CARDS]);
    expect(screen.getByText("card 1 of 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Next card/ }));
    expect(screen.getByText("card 2 of 2")).toBeInTheDocument();
  });

  it("keeps a catalog as ONE step whichever way it is walked", () => {
    step("light.items", fakeBoard(), "light", [CARDS]);
    expect(screen.getByText("step 1 of 1")).toBeInTheDocument();
  });

  it("fills Next only once every card has a verdict", () => {
    const one = step("light.items", fakeBoard(), "light", [CARDS]);
    expect(screen.getByRole("button", { name: /^Next$/ })).not.toHaveClass(
      "bg-foreground",
    );
    one.unmount();
    setReviewStore({
      ...EMPTY_REVIEW,
      items: {
        [itemHoldId("light", 5, "ember")]: { verdict: "keep", note: "" },
        [itemHoldId("light", 5, "ladder")]: { verdict: "kill", note: "" },
      },
    });
    step("light.items", fakeBoard(), "light", [CARDS]);
    expect(screen.getByRole("button", { name: /^Next$/ })).toHaveClass(
      "bg-foreground",
    );
  });
});
