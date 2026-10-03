/**
 * (`toHaveTextContent` folds every space, the no-break one before AM included, into a plain one.)
 *
 * THE DELETION DIALOG SAYS WILL'S KEY POINTS (lp/account-exit, 2026-10-03), plain and short: the
 * plan cancelled now and not refunded, her events deleted right away, the nightly cleanup's time in
 * her own zone with this email locked until then and free after, and, only when she has any, her
 * photos in other people's albums, which stay unless she turns on taking them out (off by default).
 * The done screen repeats when the email can start fresh, and stays until she leaves it.
 *
 * Pinned: which lines show for which account, the time's words in a known zone, the choice's
 * number and default, what the press sends, and the done screen's time. Never looks.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  deleteMyAccountAction: vi.fn(),
  getDeletionFactsAction: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/app/(app)/account/actions", () => ({
  deleteMyAccountAction: (...args: unknown[]) =>
    state.deleteMyAccountAction(...args),
  getDeletionFactsAction: () => state.getDeletionFactsAction(),
  sendDeletionCodeAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: state.toastError } }));
// The reader is in New York; the purge's 05:00 UTC is her 1:00 AM.
vi.mock("@/lib/lifecycle/purge-time", async (orig) => ({
  ...(await orig<typeof import("@/lib/lifecycle/purge-time")>()),
  browserZone: () => "America/New_York",
}));

const { AccountDeleteCard, uploadsElsewhereChoice } =
  await import("@/components/app/account-delete-card");

/** 3:00 PM in New York, 2 October 2026. */
const NOW = new Date("2026-10-02T19:00:00Z");
const PURGE_BY = "2026-10-03T05:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  state.toastError.mockReset();
  state.getDeletionFactsAction.mockReset().mockResolvedValue({
    ok: true,
    uploadsElsewhere: { photos: 12, videos: 1 },
    purgeBy: PURGE_BY,
  });
  state.deleteMyAccountAction
    .mockReset()
    .mockResolvedValue({ ok: true, purgeBy: PURGE_BY });
});

afterEach(() => {
  vi.useRealTimers();
});

async function open(
  props: Partial<React.ComponentProps<typeof AccountDeleteCard>> = {},
) {
  render(
    <AccountDeleteCard
      eventCount={3}
      hasPassword
      hasPlan
      email="maya@example.com"
      {...props}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
  const dialog = screen.getByRole("alertdialog");
  // The facts land a moment after the dialog does.
  await act(async () => {});
  return dialog;
}

const terms = (dialog: HTMLElement) =>
  dialog.querySelector<HTMLElement>("[data-deletion-terms]")!;

describe("what the dialog says", () => {
  it("★ names the plan, the events and the cleanup's time in her own zone", async () => {
    const dialog = await open();
    const list = terms(dialog);
    expect(list).toHaveTextContent("Your plan is cancelled now.");
    expect(list).toHaveTextContent(
      "You won’t be billed again, and the rest of this period isn’t refunded.",
    );
    expect(list).toHaveTextContent(
      "Your 3 events are deleted right away, with every photo and video in them.",
    );
    expect(list).toHaveTextContent(
      "Your account is erased for good by 1:00 AM tomorrow, in our nightly cleanup.",
    );
    expect(list).toHaveTextContent(
      "Until then this email can’t sign in or start a new account. After that, it can start fresh.",
    );
  });

  it("says less for less: no plan, no events, nothing elsewhere", async () => {
    state.getDeletionFactsAction.mockResolvedValue({
      ok: true,
      uploadsElsewhere: { photos: 0, videos: 0 },
      purgeBy: PURGE_BY,
    });
    const dialog = await open({ eventCount: 0, hasPlan: false });
    const items = within(terms(dialog)).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Your account is erased for good by");
    expect(dialog.querySelector("[data-uploads-elsewhere]")).toBeNull();
  });

  it("one event is one event", async () => {
    const dialog = await open({ eventCount: 1 });
    expect(terms(dialog)).toHaveTextContent(
      "Your event is deleted right away, with every photo and video in it.",
    );
  });

  it("shows this device's own reckoning of the time until the server's lands", async () => {
    state.getDeletionFactsAction.mockReturnValue(new Promise(() => {}));
    const dialog = await open();
    expect(terms(dialog)).toHaveTextContent(
      "Your account is erased for good by 1:00 AM tomorrow",
    );
  });
});

describe("asking the server", () => {
  it("asks once for a hover and the press after it, and again for a later opening", async () => {
    render(
      <AccountDeleteCard
        eventCount={3}
        hasPassword
        hasPlan
        email="maya@example.com"
      />,
    );
    const trigger = screen.getByRole("button", { name: /delete account/i });
    fireEvent.pointerEnter(trigger);
    fireEvent.click(trigger);
    await act(async () => {});
    expect(state.getDeletionFactsAction).toHaveBeenCalledTimes(1);
    // Closing hands focus back to the trigger, which asks nothing new so soon.
    fireEvent.click(screen.getByRole("button", { name: "Keep my account" }));
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await act(async () => {});
    expect(state.getDeletionFactsAction).toHaveBeenCalledTimes(1);
    // A minute on, she may have taken photos back: the next opening asks again.
    fireEvent.click(screen.getByRole("button", { name: "Keep my account" }));
    await act(async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 60_000));
    });
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await act(async () => {});
    expect(state.getDeletionFactsAction).toHaveBeenCalledTimes(2);
  });
});

describe("her photos in other people's albums", () => {
  it("★ offers to take them out, with the server's count, off by default", async () => {
    const dialog = await open();
    const choice = within(dialog).getByRole("switch", {
      name: "Also remove the 12 photos and 1 video I added to other people’s albums",
    });
    expect(choice).toHaveAttribute("aria-checked", "false");
    expect(dialog).toHaveTextContent(
      "Otherwise they stay there, without your name or email.",
    );
  });

  it("★ sends her choice beside the proof, and nothing she did not choose", async () => {
    const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText(/password/i), {
      target: { value: "correct horse" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete my account" }),
    );
    await act(async () => {});
    expect(state.deleteMyAccountAction).toHaveBeenLastCalledWith(
      { method: "password", password: "correct horse" },
      { removeUploadsElsewhere: false },
    );
  });

  it("sends it on when she turns it on", async () => {
    const dialog = await open();
    fireEvent.click(within(dialog).getByRole("switch"));
    fireEvent.change(within(dialog).getByLabelText(/password/i), {
      target: { value: "correct horse" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete my account" }),
    );
    await act(async () => {});
    expect(state.deleteMyAccountAction).toHaveBeenLastCalledWith(
      { method: "password", password: "correct horse" },
      { removeUploadsElsewhere: true },
    );
  });

  it("is not offered when the count never came", async () => {
    state.getDeletionFactsAction.mockResolvedValue({
      ok: false,
      message: "Couldn't load this.",
    });
    const dialog = await open();
    expect(dialog.querySelector("[data-uploads-elsewhere]")).toBeNull();
  });

  it("names what they are, and one is in one album", () => {
    expect(uploadsElsewhereChoice({ photos: 1, videos: 0 }).label).toBe(
      "Also remove the photo I added to someone else’s album",
    );
    expect(uploadsElsewhereChoice({ photos: 0, videos: 1 }).label).toBe(
      "Also remove the video I added to someone else’s album",
    );
    expect(uploadsElsewhereChoice({ photos: 0, videos: 4 }).label).toBe(
      "Also remove the 4 videos I added to other people’s albums",
    );
    expect(uploadsElsewhereChoice({ photos: 1_249, videos: 0 }).label).toBe(
      "Also remove the 1,249 photos I added to other people’s albums",
    );
    expect(uploadsElsewhereChoice({ photos: 1, videos: 0 }).hint).toBe(
      "Otherwise it stays there, without your name or email.",
    );
  });
});

describe("the done screen", () => {
  it("★ repeats when the email can start fresh, and stays until she leaves", async () => {
    const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText(/password/i), {
      target: { value: "correct horse" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete my account" }),
    );
    await act(async () => {});
    const done = screen.getByRole("alertdialog");
    expect(done).toHaveTextContent("Your account is deleted");
    expect(done).toHaveTextContent(
      "You’re signed out, and this email can start a new account after 1:00 AM tomorrow.",
    );
    // No timer takes it away: it is still there a minute on.
    await act(async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 60_000));
    });
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Your account is deleted",
    );
    expect(within(done).getByRole("button", { name: "Done" })).toBeVisible();
  });

  it("★ has no dead control: its corner × leaves, as its Done does", async () => {
    const real = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...real, assign },
    });
    try {
      const dialog = await open();
      fireEvent.change(within(dialog).getByLabelText(/password/i), {
        target: { value: "correct horse" },
      });
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete my account" }),
      );
      await act(async () => {});
      const done = screen.getByRole("alertdialog");
      fireEvent.click(within(done).getByRole("button", { name: "Close" }));
      expect(assign).toHaveBeenCalledWith("/");
      // And it is still on screen until the page leaves.
      expect(screen.getByRole("alertdialog")).toHaveTextContent(
        "Your account is deleted",
      );
      fireEvent.click(within(done).getByRole("button", { name: "Done" }));
      expect(assign).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: real,
      });
    }
  });

  it("a refusal keeps the dialog, with the server's words", async () => {
    state.deleteMyAccountAction.mockResolvedValue({
      ok: false,
      code: "uploads",
      message:
        "We couldn't take all your photos out of other people's albums just now, so your account wasn't deleted. Please try again.",
    });
    const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText(/password/i), {
      target: { value: "correct horse" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete my account" }),
    );
    await act(async () => {});
    expect(state.toastError).toHaveBeenCalledWith(
      expect.stringContaining("your account wasn't deleted"),
    );
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Delete your account?",
    );
  });
});
