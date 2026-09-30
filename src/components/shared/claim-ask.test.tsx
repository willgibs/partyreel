/**
 * THE ASK ON A SHARED PHONE, AS A SCREEN (shared-claims). Photos a phone holds that were typed under
 * a name at odds with the account are claimed only on her word: one question a name, asked once no
 * other door or sheet is up, answered by "Not mine" (remembered, nothing moves) or "They're mine"
 * (exactly those tickets, said once, the page refreshed). A question closed unanswered is asked again
 * on a later visit, never guessed.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentClaimAsks,
  publishClaimAsks,
  saidNotMine,
  type ClaimAsk as Ask,
} from "@/lib/guest/claim-ask";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("sonner", () => ({ toast }));
const claimAskedUploads = vi.fn();
vi.mock("@/lib/guest/claim-uploads", () => ({
  CLAIMED_TOAST: "We added your uploads to your account.",
  claimAskedUploads: (...a: unknown[]) => claimAskedUploads(...a),
}));

const { ClaimAsk } = await import("./claim-ask");

function ask(over: Partial<Ask> = {}): Ask {
  return {
    account: "acct-sam",
    name: "Dana",
    uploads: 3,
    tickets: [
      { album: "album-1", token: "tok-1" },
      { album: "album-2", token: "tok-2" },
    ],
    ...over,
  };
}

const question = (name = "3 photos were added on this phone as Dana") =>
  screen.findByRole("alertdialog", { name });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  publishClaimAsks([]);
  document.body.innerHTML = "";
});

describe("ClaimAsk", () => {
  it("draws nothing while nothing is asked", async () => {
    render(<ClaimAsk />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("★ asks in plain words, the safe answer first, once no other layer is up", async () => {
    render(<ClaimAsk />);
    act(() => publishClaimAsks([ask()]));
    const dialog = await question();
    expect(dialog).toHaveTextContent(
      "Are they yours? If they are, they join your account.",
    );
    const buttons = screen.getAllByRole("button", { name: /mine/ });
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Not mine",
      "They're mine",
    ]);
  });

  it("★ waits while a door or a sheet is up, and asks once it has closed", async () => {
    const door = document.createElement("div");
    door.setAttribute("role", "dialog");
    document.body.appendChild(door);
    render(<ClaimAsk />);
    act(() => publishClaimAsks([ask()]));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();

    act(() => door.remove());
    await question();
  });

  it("Not mine is remembered for that account on those albums, and nothing moves", async () => {
    render(<ClaimAsk />);
    act(() => publishClaimAsks([ask()]));
    await question();
    fireEvent.click(screen.getByRole("button", { name: "Not mine" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(saidNotMine("acct-sam", "album-1")).toBe(true);
    expect(saidNotMine("acct-sam", "album-2")).toBe(true);
    expect(claimAskedUploads).not.toHaveBeenCalled();
    expect(currentClaimAsks()).toEqual([]);
  });

  it("★ They're mine claims exactly those tickets, says it once and refreshes the page", async () => {
    claimAskedUploads.mockResolvedValue(3);
    render(<ClaimAsk />);
    const asked = ask();
    act(() => publishClaimAsks([asked]));
    await question();
    fireEvent.click(screen.getByRole("button", { name: "They're mine" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(claimAskedUploads).toHaveBeenCalledWith(asked);
    expect(toast.success).toHaveBeenCalledWith(
      "We added your uploads to your account.",
    );
    expect(saidNotMine("acct-sam", "album-1")).toBe(false);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("a yes that fails says so and remembers nothing, so a later visit asks again", async () => {
    claimAskedUploads.mockResolvedValue(null);
    render(<ClaimAsk />);
    act(() => publishClaimAsks([ask()]));
    await question();
    fireEvent.click(screen.getByRole("button", { name: "They're mine" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.success).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(saidNotMine("acct-sam", "album-1")).toBe(false);
  });

  it("closed unanswered, it goes for this visit and is not remembered", async () => {
    render(<ClaimAsk />);
    act(() => publishClaimAsks([ask()]));
    const dialog = await question();
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(currentClaimAsks()).toEqual([]);
    expect(saidNotMine("acct-sam", "album-1")).toBe(false);
    expect(claimAskedUploads).not.toHaveBeenCalled();
  });

  it("two names are two questions, one at a time", async () => {
    render(<ClaimAsk />);
    act(() =>
      publishClaimAsks([
        ask(),
        ask({
          name: "Mike",
          uploads: 1,
          tickets: [{ album: "album-3", token: "tok-3" }],
        }),
      ]),
    );
    await question();
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Not mine" }));
    await question("1 photo was added on this phone as Mike");
    expect(saidNotMine("acct-sam", "album-3")).toBe(false);
  });
});
