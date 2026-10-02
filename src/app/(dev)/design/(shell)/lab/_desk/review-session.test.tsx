/**
 * THE END OF THE WALK HAS A PLACE FOR A NOTE ABOUT THE WHOLE PROGRAM (lab-sitting, from ROADMAP's line: "the
 * desk's end-of-walk message has no place for a note about the whole program (it reaches the Orchestrator
 * only through chat)"). Every board's line has its board note; a note about all of them had nowhere to go but
 * a chat message beside the paste. It rides the paste as the bare `note: "..."` the transcript reads (and
 * records nowhere, saying where it goes), and it is a message on its own when nothing else was answered.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_REVIEW, getReviewStore, setReviewStore } from "./review-store";
import { ReviewSession } from "./review-session";
import type { AskStep } from "./session-step";
import { holdId } from "./step-id";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
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

const ASK: AskStep = {
  kind: "ask",
  board: "light",
  boardTitle: "Light, shadow and lamp",
  round: 5,
  askId: "depth",
  question: "In dark mode, how should two overlapping things be told apart?",
  options: [
    { id: "family", label: "The shadow family" },
    { id: "lift", label: "The lift only" },
  ],
  recommended: "family",
  evidence: null,
  boardHref: "/design/lab/light",
};

const end = () =>
  render(
    <ReviewSession
      steps={[ASK]}
      param="end"
      title="The message"
      blurb="One line per board."
      build="abc1234"
    />,
  );

const programField = () =>
  screen.getByRole("textbox", { name: /for the whole program/i });

beforeEach(() => {
  setReviewStore(EMPTY_REVIEW);
});

describe("the end of the walk", () => {
  it("★ composes a note for the whole program as its own line, even with nothing else answered", () => {
    end();
    fireEvent.change(programField(), {
      target: { value: "every board, pictures first" },
    });
    expect(getReviewStore().program).toBe("every board, pictures first");
    expect(
      screen.getByText(/note: "every board, pictures first"/),
    ).toBeInTheDocument();
  });

  it("puts it after the boards' lines", () => {
    setReviewStore({
      ...EMPTY_REVIEW,
      answers: {
        [holdId("light", 5, "depth")]: { choice: "lift", note: "" },
      },
      program: "and quieter",
    });
    end();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" &&
          el.textContent ===
            '# build abc1234\nreview light r5: depth=lift\nnote: "and quieter"',
      ),
    ).toBeInTheDocument();
    expect(programField()).toHaveValue("and quieter");
  });

  it("composes nothing for a blank one", async () => {
    end();
    await act(async () => {
      fireEvent.change(programField(), { target: { value: "   " } });
    });
    expect(screen.queryByText(/note:/)).not.toBeInTheDocument();
  });
});
