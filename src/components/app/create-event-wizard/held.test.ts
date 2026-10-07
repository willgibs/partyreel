import { describe, expect, it } from "vitest";

import { DEFAULT_ERROR_MESSAGE } from "@/lib/errors/codes";

import { HELD_DROPPED, HELD_KEPT, heldFailure } from "./held";

/**
 * A FAILED CREATE, HELD (create-wizard r4's `failed=held`): every failure says first that nothing she chose was lost,
 * then why and the one way to put it right, and only the plan's limit trades Try again for its Upgrade. What fails
 * silently: a failure that forgets to say her work is kept, one that says the failure twice, and a limit offered a
 * retry that cannot pass it (or an Upgrade where no plan could lift it).
 */

const FREE = { planName: "Free", maxEvents: 1 };

describe("the words under her code", () => {
  it("★ says what is kept, then to check the line, when nothing answered at all", () => {
    expect(heldFailure(null, FREE)).toEqual({
      line: `${HELD_KEPT} ${HELD_DROPPED}`,
      way: "retry",
    });
  });

  it.each([
    [
      "the breaker's own sentence",
      "You've created a lot of events today. Try again tomorrow.",
      "You've created a lot of events today. Try again tomorrow.",
    ],
    [
      "a session that ended",
      "Please sign in and try again.",
      "Please sign in and try again.",
    ],
    [
      "the create's catch-all, which only repeats the question, as its way out",
      "Couldn't create the event. Please try again.",
      "Please try again.",
    ],
    ["no words at all, as the house's default", "  ", DEFAULT_ERROR_MESSAGE],
  ])("★ keeps the server's own words: %s", (_, message, said) => {
    expect(heldFailure({ code: "unknown", message }, FREE)).toEqual({
      line: `${HELD_KEPT} ${said}`,
      way: "retry",
    });
  });
});

describe("the plan's limit keeps its Upgrade", () => {
  const limit = {
    code: "limit_reached",
    message: "You've reached the event limit for your plan.",
  };

  it.each([
    ["Free", 1, "Free holds one event."],
    ["Event Pass", 3, "Event Pass holds 3 events."],
  ] as const)(
    "★ %s names its own number, never a written one",
    (planName, maxEvents, holds) => {
      const held = heldFailure(limit, { planName, maxEvents });
      expect(held.way).toBe("upgrade");
      expect(held.line).toBe(
        `${HELD_KEPT} ${holds} Delete an event or upgrade to add more.`,
      );
    },
  );

  it("offers no Upgrade where the plan holds every event: the server's words, and Try again", () => {
    expect(heldFailure(limit, { planName: "Pro", maxEvents: null })).toEqual({
      line: `${HELD_KEPT} ${limit.message}`,
      way: "retry",
    });
  });
});
