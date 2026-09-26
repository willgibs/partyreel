import { render, screen, within } from "@testing-library/react";
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

/** An exploration's pair: each decision is its own control, the second staged. */
const PACE: AskStep = {
  kind: "ask",
  board: "hero",
  boardTitle: "A hero",
  round: 1,
  askId: "pace",
  question: "How fast should it travel?",
  options: [
    { id: "slow", label: "Slow", state: { pace: "slow" } },
    { id: "fast", label: "Fast", state: { pace: "fast" } },
  ],
  recommended: "fast",
  evidence: null,
  section: "pace",
  control: "pace",
  boardHref: "/design/lab/hero",
};

const GAP: AskStep = {
  kind: "ask",
  board: "hero",
  boardTitle: "A hero",
  round: 1,
  askId: "gap",
  question: "How far apart should the photographs be?",
  options: [
    { id: "half", label: "Half a photograph", state: { gap: "half" } },
    { id: "edge", label: "Edge to edge", state: { gap: "edge" } },
  ],
  recommended: "half",
  evidence: null,
  section: "gap",
  control: "gap",
  after: { ask: "pace" },
  afterRuled: "slow",
  boardHref: "/design/lab/hero",
};

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

/** The dock's option buttons, reached the way a reader does. */
const chip = (label: string) =>
  within(screen.getByRole("group", { name: "The options" })).getByRole(
    "button",
    { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) },
  );

beforeEach(() => {
  push.mockClear();
  setReviewStore(EMPTY_REVIEW);
  window.scrollTo = vi.fn();
});

/**
 * ★ THE PREVIEW IS THE PAGE AND THE ANSWER IS A DOCK (2026-09-18).
 *
 * The step before this pinned the evidence in a 40vh window above the options,
 * and Will could not see what he was answering: "The top preview UI of our lab
 * is covered by the answer UI, and I cannot scroll it to see the full heights
 * or labels on which height is which." These pin the FUNCTION, never the look:
 * every option is drawn once on the stage, the stage says which one it shows,
 * the options to press come after it in a dock, and the step lands showing
 * the board's recommendation. Nothing here asserts a height, a position or a
 * colour; `pnpm lab:demo` measures the clipping in a real browser.
 */
describe("a step puts the preview on the page and the answer in a dock", () => {
  it("draws every option once on the stage, before the dock", () => {
    const board = fakeBoard();
    const { container } = step("light.register", board);
    const root = container.querySelector("[data-review-step]")!;
    const views = [...root.querySelectorAll("[data-lab-view]")].map((v) =>
      v.getAttribute("data-option"),
    );
    expect(views).toEqual(["accent", "identity"]);
    const dock = root.querySelector("[data-lab-dock]")!;
    // Node.DOCUMENT_POSITION_FOLLOWING === 4: the dock comes after the stage.
    expect(
      root.querySelector("[data-lab-stage]")!.compareDocumentPosition(dock) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      "the answer follows the preview",
    ).toBeTruthy();
  });

  it("lands showing the board's recommendation, and says which it is", () => {
    const board = fakeBoard();
    const { container } = step("light.register", board);
    expect(board.state.register).toBe("identity");
    expect(container.querySelector("[data-lab-stage-label]")).toHaveTextContent(
      "Identity: the page reads as a lit room",
    );
    // Only the shown option is visible and live; the other is inert.
    expect(
      container.querySelector('[data-lab-view][data-option="accent"]'),
    ).toHaveAttribute("inert");
    // Landing is showing, never answering.
    expect(
      getReviewStore().answers[holdId("light", 5, "register")],
    ).toBeUndefined();
  });

  it("prints the author's line about what to look at", () => {
    // `look` was carried on the step type and dropped by the renderer: on an
    // ask whose options cannot be drawn it is the ONLY instruction there is,
    // and river-visual's four steps shipped without it (found 2026-09-17).
    step("light.depth", fakeBoard());
    expect(
      screen.getByText(/The Separate section on the App dark ground\./),
    ).toBeTruthy();
  });

  it("keeps a link inside a preview from leaving the step", async () => {
    const board = {
      ...fakeBoard(),
      evidence: () => <a href="/elsewhere">a link in the picture</a>,
    };
    step("light.register", board);
    let left = true;
    const spy = (e: MouseEvent) => {
      left = !e.defaultPrevented;
    };
    document.addEventListener("click", spy);
    await userEvent.click(screen.getAllByText("a link in the picture")[0]);
    document.removeEventListener("click", spy);
    expect(left).toBe(false);
  });
});

describe("a step, show versus choose", () => {
  it("shows an option without recording it", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.click(chip("Accent: a glow on one section"));
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
    await userEvent.click(chip("Accent: a glow on one section"));
    await userEvent.click(chip("Accent: a glow on one section"));
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

  it("picks the option on the stage with Pick, so agreeing is one press", async () => {
    step("light.register", fakeBoard());
    await userEvent.click(screen.getByRole("button", { name: /^Pick/ }));
    expect(
      getReviewStore().answers[holdId("light", 5, "register")]?.choice,
    ).toBe("identity");
  });

  it("clears the answer on a third press and resets the stage", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.click(chip("Accent: a glow on one section")); // show
    await userEvent.click(chip("Accent: a glow on one section")); // choose
    await userEvent.click(chip("Accent: a glow on one section")); // clear
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

  it("falls back to options in words when nothing declares how to draw one", async () => {
    const board = fakeBoard();
    step("light.depth", board);
    // `depth` mirrors no control and its options carry no state, so the only
    // thing drawn is the evidence, and the options are cards in words.
    expect(board.drawn.every(([id]) => id === "separate")).toBe(true);
    expect(screen.getByText("Two soft shadows.")).toBeInTheDocument();
    // A card in words has nothing to show, so its first press chooses.
    await userEvent.click(
      screen.getByRole("button", { name: /The shadow family/ }),
    );
    expect(getReviewStore().answers[holdId("light", 5, "depth")]?.choice).toBe(
      "family",
    );
  });
});

describe("a step, by its keys", () => {
  it("shows with a digit and picks with the same digit again", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.keyboard("1");
    expect(board.state.register).toBe("accent");
    expect(
      getReviewStore().answers[holdId("light", 5, "register")],
    ).toBeUndefined();
    await userEvent.keyboard("1");
    expect(
      getReviewStore().answers[holdId("light", 5, "register")]?.choice,
    ).toBe("accent");
  });

  it("blinks back to the option shown before with x", async () => {
    const board = fakeBoard();
    step("light.register", board);
    await userEvent.keyboard("1"); // accent, over the landing's identity
    await userEvent.keyboard("x");
    expect(board.state.register).toBe("identity");
    await userEvent.keyboard("x");
    expect(board.state.register).toBe("accent");
  });

  it("goes to the note with n, and on from the note with Enter", async () => {
    step("light.depth", fakeBoard());
    await userEvent.keyboard("n");
    expect(screen.getByRole("textbox")).toHaveFocus();
    await userEvent.keyboard("the dim pair{Enter}");
    expect(getReviewStore().answers[holdId("light", 5, "depth")]?.note).toBe(
      "the dim pair",
    );
    expect(screen.getByRole("heading")).toHaveTextContent(REGISTER.question);
  });

  it("marks the question unclear with ? and asks why before going on", async () => {
    step("light.depth", fakeBoard());
    await userEvent.keyboard("?");
    expect(getReviewStore().answers[holdId("light", 5, "depth")].choice).toBe(
      "?",
    );
    expect(screen.getByRole("textbox")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("heading")).toHaveTextContent(DEPTH.question);
  });

  it("lays the options side by side and back with g", async () => {
    const { container } = step("light.register", fakeBoard());
    const stage = () => container.querySelector("[data-lab-stage]")!;
    expect(stage()).toHaveAttribute("data-arrange", "flip");
    await userEvent.keyboard("g");
    expect(stage()).toHaveAttribute("data-arrange", "side");
    await userEvent.keyboard("g");
    expect(stage()).toHaveAttribute("data-arrange", "flip");
  });
});

describe("a step, as a form", () => {
  it("asks the question in the words a stranger can answer it in", () => {
    step("light.depth", fakeBoard());
    expect(screen.getByRole("heading")).toHaveTextContent(DEPTH.question);
    expect(screen.getByText(DEPTH.context!)).toBeInTheDocument();
    expect(screen.getByText(DEPTH.lands!)).toBeInTheDocument();
    for (const option of DEPTH.options) {
      expect(screen.getAllByText(option.label).length).toBeGreaterThan(0);
      expect(screen.getByText(option.means!)).toBeInTheDocument();
    }
  });

  it("marks the option the board recommends, and only that one", () => {
    step("light.register", fakeBoard());
    const dock = within(screen.getByRole("group", { name: "The options" }));
    const said = dock.getAllByText("the board says");
    expect(said).toHaveLength(1);
    expect(said[0].closest("button")).toHaveTextContent(
      "Identity: the page reads as a lit room",
    );
  });

  it("carries the note with the answer", async () => {
    step("light.depth", fakeBoard());
    await userEvent.click(
      screen.getByRole("button", { name: /The shadow family/ }),
    );
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
    await userEvent.click(
      screen.getByRole("button", { name: "Not clear to me" }),
    );
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

  it("draws a staged step wearing the answer it waits on", () => {
    // This sitting answered the pace; the gap is drawn at that pace.
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: { [holdId("hero", 1, "pace")]: { choice: "fast", note: "" } },
    });
    const board = fakeBoard();
    step("hero.gap", board, "hero", [PACE, GAP]);
    const gaps = board.drawn.filter(([id]) => id === "gap");
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every(([, at]) => at.pace === "fast")).toBe(true);
  });

  it("wears the ledger's answer from an earlier sitting when this one holds none", () => {
    const board = fakeBoard();
    step("hero.gap", board, "hero", [{ ...GAP, ruled: { pace: "slow" } }]);
    const gaps = board.drawn.filter(([id]) => id === "gap");
    expect(gaps.every(([, at]) => at.pace === "slow")).toBe(true);
  });

  /**
   * ★ AND A STAGED STEP REACHED BY URL SAYS WHAT IT IS (lab-tides,
   * 2026-09-19). Back and Next skip it, but a pasted link, a reload after
   * answering its prerequisite the other way, or a deep link can land on one,
   * and it used to draw itself as "step 8 of 7": a number that is not a
   * position, on a page that is not in the walk. The question still renders,
   * because a reader who followed a link to it is owed the question.
   */
  it("does not count itself into the walk when it was reached staged", () => {
    step("light.landing", fakeBoard());
    expect(screen.queryByText(/step \d+ of/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/not in the walk yet: it waits on an earlier answer/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Where should the aurora land?"),
    ).toBeInTheDocument();
  });

  it("says a step is moot when the question it waited on went the other way", () => {
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("light", 5, "register")]: { choice: "accent", note: "" },
      },
    });
    step("light.landing", fakeBoard());
    expect(
      screen.getByText(/not in the walk: moot this round/),
    ).toBeInTheDocument();
  });

  it("counts itself again once its question is answered its way", () => {
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("light", 5, "register")]: { choice: "identity", note: "" },
      },
    });
    step("light.landing", fakeBoard());
    expect(screen.getByText(/step \d+ of/)).toBeInTheDocument();
  });
});

/**
 * THE BOARD'S OWN TOOLS, REACHABLE FROM A STEP (lab-tides, 2026-09-19). A
 * step's dock is the ANSWER's, so a board's own cluster (a Reload frames, a
 * Replay) was reachable only by leaving the question and opening the whole
 * board, which is the trip the stepped review exists to end.
 */
describe("a step carries the board's own dock cluster", () => {
  it("puts it on the stage head, where a tall stage keeps it on screen", () => {
    const board = fakeBoard();
    board.tools = <button type="button">Reload frames</button>;
    const { container } = step("light.register", board);
    const head = container.querySelector("[data-lab-stage-head]")!;
    expect(
      within(head as HTMLElement).getByRole("button", {
        name: "Reload frames",
      }),
    ).toBeInTheDocument();
  });

  it("offers it beside the strip on a step whose options are words", () => {
    const board = fakeBoard();
    board.tools = <button type="button">Reload frames</button>;
    step("light.depth", board);
    expect(
      screen.getByRole("button", { name: "Reload frames" }),
    ).toBeInTheDocument();
  });

  it("adds nothing when the board declares none", () => {
    const { container } = step("light.register", fakeBoard());
    expect(container.querySelector("[data-lab-board-tools]")).toBeNull();
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
    await userEvent.click(
      screen.getByRole("button", { name: /None of these: new directions/ }),
    );
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
