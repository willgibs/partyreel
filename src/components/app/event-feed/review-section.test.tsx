/**
 * ★ REVIEW'S OWN COUNT WEARS THE ONE STATUS A COUNT THAT WAITS ON HER WEARS (crumbs-87, from event-header-wiring-2): the
 * hub's Review badge is `--needs-you`, solid, and the room's own count, titled and untitled alike, still wore the
 * waiting amber. The room's rows, its grid and its triage are `review-room-hub.test.tsx`'s and `use-review-triage`'s:
 * here the grid and the actions are stood in and only the head's count is read.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./review-grid", () => ({ ReviewGrid: () => null }));
vi.mock("./review-actions", () => ({ ReviewActions: () => null }));

const { ReviewSection } = await import("./review-section");

/** Only what the section reads of the triage in its pending state. */
function triage(waiting: number) {
  return {
    visualState: "pending",
    beatKind: "approve",
    pending: Array.from({ length: waiting }, (_, i) => ({ id: `u${i}` })),
    selected: new Set<string>(),
    exiting: new Set<string>(),
    selectMode: false,
    toggle: () => {},
    peekId: null,
    setPeekId: () => {},
    decide: async () => {},
    arrivals: 0,
    folding: false,
    foldIn: async () => [],
  } as unknown as React.ComponentProps<typeof ReviewSection>["triage"];
}

describe("Review's own count", () => {
  it("titled: a solid needs-you pill beside the heading, its words for a screen reader", () => {
    render(
      <ReviewSection
        triage={triage(105)}
        onEnableModeration={() => {}}
        enabling={false}
      />,
    );
    const pill = screen.getByText("105").closest("span");
    expect(pill?.className).toContain("bg-(--needs-you)");
    expect(pill?.className).toContain("text-(color:--needs-you-foreground)");
    expect(pill?.className).not.toContain("warning");
    expect(pill?.textContent).toBe("105 waiting");
  });

  it("untitled, under its panel's own title: the same pill, in words", () => {
    render(
      <ReviewSection
        triage={triage(2)}
        onEnableModeration={() => {}}
        enabling={false}
        titled={false}
      />,
    );
    const pill = screen.getByText("2 waiting");
    expect(pill.className).toContain("bg-(--needs-you)");
    expect(pill.className).not.toContain("warning");
    expect(pill.closest("[data-review-waiting]")).not.toBeNull();
  });
});
