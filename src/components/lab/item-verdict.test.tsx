import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  setReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import { composeLibraryLine } from "@/app/(dev)/design/(shell)/lab/_desk/review-message";
import { itemHoldId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import { LIBRARY_VERDICTS } from "./board-spec";
import { ItemVerdictRow } from "./item-verdict";

/**
 * THE ITEM VERDICT ROW'S CONTRACT (the revamp, 2026-09-16).
 *
 * What is pinned is the row's FUNCTION: that it offers exactly the vocabulary
 * it was handed, that a press lands where the message is composed from, that a
 * second press on the same word clears it while the note survives, and that the
 * key it writes under is the ledger's own. Nothing about its spacing, its
 * colour or its shape is asserted: the look is precedent and the next round may
 * rebuild all of it (Will, 2026-09-12).
 */
beforeEach(() => {
  setReviewStore(EMPTY_REVIEW);
});

const KEY = itemHoldId("palette", 6, "ember");

describe("the item verdict row", () => {
  it("offers exactly the vocabulary it is handed", () => {
    render(
      <ItemVerdictRow scope="palette" round={6} id="ember" name="Ember" />,
    );
    for (const word of ["keep", "refine", "kill"]) {
      expect(
        screen.getByRole("button", { name: `${word}: Ember` }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /redesign/ })).toBeNull();
  });

  it("takes the Library's own ladder as a prop, so one row serves both", () => {
    render(
      <ItemVerdictRow
        scope="library"
        round={0}
        id="button"
        name="Button"
        vocabulary={LIBRARY_VERDICTS}
      />,
    );
    for (const word of LIBRARY_VERDICTS) {
      expect(
        screen.getByRole("button", { name: `${word}: Button` }),
      ).toBeInTheDocument();
    }
  });

  it("holds a verdict under the ledger's own key", async () => {
    render(
      <ItemVerdictRow scope="palette" round={6} id="ember" name="Ember" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "keep: Ember" }));
    expect(getReviewStore().items[KEY]).toEqual({ verdict: "keep", note: "" });
  });

  it("carries the note with the verdict", async () => {
    render(
      <ItemVerdictRow scope="palette" round={6} id="ember" name="Ember" />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "refine: Ember" }),
    );
    await userEvent.type(screen.getByRole("textbox"), "warm the room only");
    expect(getReviewStore().items[KEY]).toEqual({
      verdict: "refine",
      note: "warm the room only",
    });
  });

  it("clears on a second press and keeps the note", async () => {
    render(
      <ItemVerdictRow scope="palette" round={6} id="ember" name="Ember" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "kill: Ember" }));
    await userEvent.type(screen.getByRole("textbox"), "too warm");
    await userEvent.click(screen.getByRole("button", { name: "kill: Ember" }));
    expect(getReviewStore().items[KEY]).toEqual({
      verdict: "",
      note: "too warm",
    });
  });

  it("presses exactly one word at a time", async () => {
    render(
      <ItemVerdictRow scope="palette" round={6} id="ember" name="Ember" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "keep: Ember" }));
    await userEvent.click(screen.getByRole("button", { name: "kill: Ember" }));
    const pressed = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed.map((b) => b.textContent)).toEqual(["kill"]);
  });

  it("writes into the same store the Library line is composed from", async () => {
    render(
      <ItemVerdictRow
        scope="library"
        round={0}
        id="masonry"
        name="Masonry"
        vocabulary={LIBRARY_VERDICTS}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "redesign: Masonry" }),
    );
    const held = getReviewStore().items[itemHoldId("library", 0, "masonry")];
    expect(
      composeLibraryLine([{ entry: "masonry", verdict: held.verdict }]),
    ).toBe("review library: masonry=redesign");
  });
});
