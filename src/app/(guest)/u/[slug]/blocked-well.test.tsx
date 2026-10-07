import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlockedWell } from "./blocked-well";

/**
 * THE WELL ON A PAGE SHE BLOCKED (`account-moments` r1, `block=line`). Its words are the pick (what stands, to whom,
 * and that they are not told); pinned is the part a drawing cannot show: Unblock hands focus to the page's actions
 * row, because the Server Function's re-render takes the whole well away and a keyboard press would otherwise leave
 * focus on a node that is gone.
 */

const unblock = vi.fn();
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  unblockProfileAction: (...args: unknown[]) => unblock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  unblock.mockResolvedValue({ ok: true });
});

function page() {
  return (
    <>
      <div data-profile-actions>
        <button type="button">More options</button>
      </div>
      <BlockedWell profileId="jordan" name="Jordan Pike" />
    </>
  );
}

describe("the blocked well", () => {
  it("says it to her: whom she blocked, that neither can follow, that they are not told, and Unblock by name", () => {
    render(page());
    expect(
      screen.getByText(/you blocked jordan pike\. neither of you can follow/i),
    ).toHaveTextContent(/they aren.t told/i);
    expect(
      screen.getByRole("button", { name: "Unblock Jordan Pike" }),
    ).toBeInTheDocument();
  });

  it("★ hands focus to the page's actions when Unblock lands, which is what stays when the well goes", async () => {
    render(page());
    const unblockButton = screen.getByRole("button", {
      name: "Unblock Jordan Pike",
    });
    unblockButton.focus();
    fireEvent.click(unblockButton);
    await waitFor(() => expect(unblock).toHaveBeenCalledWith("jordan"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "More options" }),
      ).toHaveFocus(),
    );
  });

  it("keeps focus where it is when the flip is refused, and says why", async () => {
    unblock.mockResolvedValue({ ok: false, message: "Not now." });
    render(page());
    const unblockButton = screen.getByRole("button", {
      name: "Unblock Jordan Pike",
    });
    unblockButton.focus();
    fireEvent.click(unblockButton);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Not now."));
    expect(
      screen.getByRole("button", { name: "More options" }),
    ).not.toHaveFocus();
  });
});
