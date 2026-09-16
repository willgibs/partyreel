// @contract-for: src/components/lab/review-card.tsx
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

import { ReviewCard } from "./review-card";

/**
 * THE REVIEW CARD'S CONTRACT (the clarity round, 2026-09-15).
 *
 * What is pinned here is the card's FUNCTION, never its look: that an ask
 * arrives with the words a stranger can answer it in, that an answer lands
 * where the desk's summary reads it, that a pick previews itself when the ask
 * says it can, and that the card belongs to ONE board. Will's first review
 * died on a card that showed three tokens and put the evidence in another tab
 * ("hard to visibly tell what Family and Lift are from the previews"), so the
 * first case below is the one that matters: every option's label AND what
 * choosing it means are on the screen.
 *
 * Nothing about spacing, colour or motion is asserted. A contract guards a
 * component's function, structure and single sources (Will, 2026-09-12); the
 * card's look is precedent and the next round may rework all of it.
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
  evidence: { title: "Separate", href: "/design/lab/light#light-separate" },
  section: "separate",
  state: { ground: "app-dark" },
  boardHref: "/design/lab/light",
};

const REGISTER: AskStep = {
  kind: "ask",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  askId: "register",
  question: "How strong should the aurora be?",
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

/**
 * A CATALOG STEP (the revamp, 2026-09-16). The card renders no verdict controls
 * for it on purpose: the rows live on the cards in the grid underneath, and a
 * sticky card carrying three buttons per card would cover the grid it is
 * asking about. What IS pinned here is that the card counts them and fills Next
 * only when every one has a verdict.
 */
const PALETTES: ItemsStep = {
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
  evidence: null,
  section: "catalog",
  boardHref: "/design/lab/light",
};

const QUEUE: SessionStep[] = [DEPTH, REGISTER, ELSEWHERE];
const WITH_CATALOG: SessionStep[] = [PALETTES, DEPTH, REGISTER, ELSEWHERE];

function card(
  param: string,
  setState: (patch: Record<string, string>) => void = vi.fn(),
  boardId = "light",
  steps: SessionStep[] = QUEUE,
) {
  return render(
    <ReviewCard
      boardId={boardId}
      steps={steps}
      param={param}
      setState={setState}
    />,
  );
}

/** A verdict held as if it had been pressed on the card in the grid below. */
function rule(item: string, verdict: string) {
  const store = getReviewStore();
  setReviewStore({
    ...store,
    items: {
      ...store.items,
      [itemHoldId("light", 5, item)]: { verdict, note: "" },
    },
  });
}

beforeEach(() => {
  push.mockClear();
  setReviewStore(EMPTY_REVIEW);
  window.scrollTo = vi.fn();
});

describe("the review card", () => {
  it("asks the question in the words a stranger can answer it in", () => {
    card("light.depth");
    expect(screen.getByRole("heading")).toHaveTextContent(DEPTH.question);
    expect(screen.getByText(DEPTH.context!)).toBeInTheDocument();
    expect(screen.getByText(DEPTH.look!, { exact: false })).toBeInTheDocument();
    for (const option of DEPTH.options) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
      expect(screen.getByText(option.means!)).toBeInTheDocument();
    }
  });

  it("marks the option the board recommends, and only that one", () => {
    card("light.depth");
    const said = screen.getAllByText("the board says");
    expect(said).toHaveLength(1);
    expect(said[0].closest("button")).toHaveTextContent("The shadow family");
  });

  it("counts the step across the whole queue, not this board's share", () => {
    card("light.register");
    expect(screen.getByText(`Step 2 of ${QUEUE.length}`)).toBeInTheDocument();
  });

  it("holds a pick where the desk's summary reads it", async () => {
    card("light.depth");
    await userEvent.click(screen.getByText("The lift only"));
    expect(getReviewStore().answers[holdId("light", 5, "depth")]).toEqual({
      choice: "lift",
      note: "",
    });
    // The store IS the summary's source: the desk composes the ledger line
    // from these same keys, and lab-review.test.ts proves the grammar.
    expect(
      composeMessage([
        { board: "light", round: 5, ask: "depth", choice: "lift" },
      ]),
    ).toBe("review light r5: depth=lift");
  });

  it("carries the note with the answer", async () => {
    card("light.depth");
    await userEvent.click(screen.getByText("The shadow family"));
    await userEvent.type(
      screen.getByRole("textbox"),
      "the dim dance floor pair",
    );
    expect(getReviewStore().answers[holdId("light", 5, "depth")]).toEqual({
      choice: "family",
      note: "the dim dance floor pair",
    });
  });

  it("sets the board's control when the ask names one, so a pick is a preview", async () => {
    const setState = vi.fn();
    card("light.register", setState);
    setState.mockClear(); // the landing state, which the next case pins
    await userEvent.click(
      screen.getByText("Identity: the page reads as a lit room"),
    );
    expect(setState).toHaveBeenCalledWith({ register: "identity" });
  });

  it("leaves the board alone when the ask names no control", async () => {
    const setState = vi.fn();
    card("light.depth", setState);
    setState.mockClear();
    await userEvent.click(screen.getByText("The lift only"));
    expect(setState).not.toHaveBeenCalled();
  });

  it("applies the ask's declared state on landing", () => {
    const setState = vi.fn();
    card("light.depth", setState);
    expect(setState).toHaveBeenCalledWith({ ground: "app-dark" });
  });

  it("records 'not clear to me' as an answer and puts the cursor in the note", async () => {
    card("light.depth");
    await userEvent.click(screen.getByText("This question is not clear to me"));
    expect(getReviewStore().answers[holdId("light", 5, "depth")].choice).toBe(
      "?",
    );
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("steps inside a board without navigating", async () => {
    card("light.depth");
    await userEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("heading")).toHaveTextContent(REGISTER.question);
  });

  it("links the last ask of a board to the next board's first open ask", () => {
    card("light.register");
    expect(screen.getByRole("link", { name: /^Next$/ })).toHaveAttribute(
      "href",
      "/design/lab/type-scale?session=type-scale.ladder",
    );
  });

  it("links the last ask of the queue to the desk's summary", () => {
    card("type-scale.ladder", vi.fn(), "type-scale");
    expect(screen.getByRole("link", { name: /^Next$/ })).toHaveAttribute(
      "href",
      "/design/lab?session=end",
    );
  });

  it("clears a pick on a second press, and keeps the note", async () => {
    card("light.depth");
    await userEvent.click(screen.getByText("The lift only"));
    await userEvent.type(screen.getByRole("textbox"), "on the dark ground");
    await userEvent.click(screen.getByText("The lift only"));
    expect(getReviewStore().answers[holdId("light", 5, "depth")]).toEqual({
      choice: "",
      note: "on the dark ground",
    });
  });

  it("renders nothing for a session on another board", () => {
    const { container } = card("type-scale.ladder");
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no session names an ask", () => {
    const { container } = card("");
    expect(container).toBeEmptyDOMElement();
  });
});

describe("the review card on a catalog", () => {
  it("names the section and how many cards are in it", () => {
    card("light.items", vi.fn(), "light", WITH_CATALOG);
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Rule on the 2 in The catalog",
    );
  });

  it("counts the verdicts as they land, and they are not on the card", () => {
    card("light.items", vi.fn(), "light", WITH_CATALOG);
    expect(screen.getByText("0 of 2 ruled")).toBeInTheDocument();
    // The controls belong on the cards in the grid, never on the sticky card.
    expect(screen.queryByRole("button", { name: /keep: Ember/ })).toBeNull();
  });

  it("fills Next only once every card has a verdict", () => {
    rule("ember", "keep");
    const one = card("light.items", vi.fn(), "light", WITH_CATALOG);
    expect(screen.getByText("1 of 2 ruled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Next$/ })).not.toHaveClass(
      "bg-card",
    );
    one.unmount();

    rule("ladder", "kill");
    card("light.items", vi.fn(), "light", WITH_CATALOG);
    expect(screen.getByText("2 of 2 ruled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Next$/ })).toHaveClass(
      "bg-card",
    );
  });

  it("steps on to the board's first ask without navigating", async () => {
    card("light.items", vi.fn(), "light", WITH_CATALOG);
    await userEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("heading")).toHaveTextContent(DEPTH.question);
  });
});
