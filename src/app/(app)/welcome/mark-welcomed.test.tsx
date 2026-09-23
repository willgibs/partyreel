import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarkWelcomedOnMount } from "./mark-welcomed";

/**
 * A GUEST-MADE ACCOUNT'S FIRST VISIT IS ITS WELCOME (lib/welcome.ts, `isGuestFirstVisit`). The dashboard renders the
 * marker instead of sending the account to a host tour, so the marker must do the one thing an exit of the tour does:
 * persist welcomed_at, exactly once, and draw nothing.
 */
const markWelcomedAction = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/app/(app)/actions", () => ({ markWelcomedAction }));

beforeEach(() => {
  markWelcomedAction.mockClear();
});

describe("MarkWelcomedOnMount", () => {
  it("marks the account welcomed once, on mount, and renders nothing", async () => {
    const { container } = render(<MarkWelcomedOnMount />);
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
  });

  it("writes once under Strict Mode's doubled effects too", async () => {
    render(
      <StrictMode>
        <MarkWelcomedOnMount />
      </StrictMode>,
    );
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalled());
    expect(markWelcomedAction).toHaveBeenCalledTimes(1);
  });

  it("a failed write stays quiet: the next visit decides again", async () => {
    markWelcomedAction.mockRejectedValueOnce(new Error("offline"));
    const { container } = render(<MarkWelcomedOnMount />);
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
  });
});
