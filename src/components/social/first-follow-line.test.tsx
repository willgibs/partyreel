import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstFollowLine, FirstFollowSlot } from "./first-follow-line";
import {
  firstNameOf,
  FOLLOWING_WORDS,
  followWords,
  PrivateLine,
} from "./private-line";

/**
 * THE PRIVATE LINE AND WHAT A FIRST FOLLOW SAYS (`account-moments` r2, `follow=once`; `relation-toggle.test.tsx` holds
 * when the control draws it). Pinned: the words are one sentence whose only variable is the person, named by the first
 * word of a name and never by a title or an initial; the same fact standing on a list says "each of them"; the line is
 * the lock and its words in one object that her own page wears too; and a slot outside a scope draws nothing (a page
 * that never wrapped its head has no line to show).
 */

describe("what a first follow says", () => {
  it.each([
    ["Maya Alvarez", "Maya"],
    ["Maya", "Maya"],
    ["  Maya   Alvarez ", "Maya"],
    ["@maya-alvarez", "@maya-alvarez"],
    ["Dr. Okafor", "Dr. Okafor"],
    ["J. Smith", "J. Smith"],
    ["J", "J"],
  ])("names %j as %j", (name, said) => {
    expect(firstNameOf(name)).toBe(said);
  });

  it.each([null, undefined, "", "   "])("names no one for %j", (name) => {
    expect(firstNameOf(name)).toBeNull();
  });

  it("★ is the one sentence, with the person's name where it is known and 'They' where it is not", () => {
    expect(followWords("Maya Alvarez")).toBe(
      "Only you see who you follow. Maya just sees one more follower.",
    );
    expect(followWords(null)).toBe(
      "Only you see who you follow. They just see one more follower.",
    );
    // Standing on the list it is about, there are many of them.
    expect(FOLLOWING_WORDS).toContain(
      "Each of them just sees one more follower.",
    );
    expect(FOLLOWING_WORDS.startsWith("Only you see who you follow.")).toBe(
      true,
    );
  });
});

describe("the private line", () => {
  it("is a lock the screen reader skips beside its words", () => {
    const { container } = render(
      <PrivateLine>Only you can see this page.</PrivateLine>,
    );
    expect(screen.getByText("Only you can see this page.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is a row of its own, opened as it arrives, that a screen reader leaves to the control's live region", () => {
    const { container } = render(
      <FirstFollowLine words={followWords("Maya")} />,
    );
    const line = container.querySelector("[data-follow-line]");
    expect(line).not.toBeNull();
    expect(line!.querySelector("p")).toHaveAttribute("aria-hidden", "true");
    expect(line).toHaveTextContent(followWords("Maya"));
  });

  it("is never drawn by a slot with no scope around it", () => {
    const { container } = render(<FirstFollowSlot />);
    expect(container).toBeEmptyDOMElement();
  });
});
