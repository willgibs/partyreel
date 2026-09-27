/**
 * THE KEEP'S OWN PIECES: the door's last screen (`guest-capture` r1, `moment=first` and
 * `shape=sheet-step`), drawn by the modal from this file. The flows the modal runs around them
 * (when the keep is due, the marker on Confirm, Maybe later putting it down, the claim on a code)
 * are pinned beside the door in `entry-modal.test.tsx`; these are the words and the two views.
 *
 *   1. IT COUNTS WHAT LANDED, and the singular reads as a singular, heading included.
 *   2. IT SAYS WHERE WHAT SHE SENT WENT: into the host's album, or, on an event that holds uploads,
 *      to the host first (never "joined the album" for a photograph the album does not show).
 *   3. ITS CONFIRM IS THE ACCOUNT DOOR IN THIS SHEET: the address typed at the door this visit in
 *      its field, the newsletter switch off until she turns it on.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  KeepConfirm,
  keepCopy,
  KeepOffer,
  keepSentLine,
} from "./save-account-prompt";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("keepCopy", () => {
  it("counts what landed, and says one photograph in the singular", () => {
    expect(keepCopy(7).reason).toMatch(/all 7 stay with you/i);
    expect(keepCopy(1).reason).toMatch(/it stays with you/i);
    expect(keepCopy(1_250).reason).toMatch(/all 1,250 stay/);
  });

  // A plural heading over one file reads as a typo beside its own "it stays".
  it("the heading counts too: singular for exactly one, plural otherwise", () => {
    expect(keepCopy(7).title).toBe("Keep these photos");
    expect(keepCopy(1).title).toBe("Keep this photo");
  });

  it("promises the account, never a profile", () => {
    expect(keepCopy(3).reason).toMatch(/in your account/);
    expect(keepCopy(3).reason).not.toMatch(/profile/i);
  });
});

describe("keepSentLine", () => {
  it("says it joined the host's album, by name when the host has one", () => {
    expect(keepSentLine({ count: 1, held: false, hostName: "Maya" })).toBe(
      "Your photo joined Maya’s album.",
    );
    expect(keepSentLine({ count: 3, held: false, hostName: null })).toBe(
      "Your 3 photos joined the album.",
    );
  });

  it("never says it joined the album on an event that holds uploads for the host", () => {
    expect(keepSentLine({ count: 1, held: true, hostName: "Maya" })).toBe(
      "Your photo is waiting for the host.",
    );
    expect(keepSentLine({ count: 2, held: true, hostName: "Maya" })).toBe(
      "Your 2 photos are waiting for the host.",
    );
  });
});

describe("KeepOffer", () => {
  it("says what went, the offer, and its two ways on", () => {
    const onConfirm = vi.fn();
    const onLater = vi.fn();
    render(
      <KeepOffer
        count={2}
        held={false}
        hostName="Maya"
        onConfirm={onConfirm}
        onLater={onLater}
      />,
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(
      screen.getByText("Your 2 photos joined Maya’s album."),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep these photos")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /maybe later/i }));
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  /* ★ HER FIRST PHOTO SENT IS A BEAT IN THE ALBUM'S LIGHT (`identity-door` r3, Will's `beat=lit`):
     "Sent" beside the lit check, over where it went, and said to a screen reader as well (it is
     what happened, which the sheet's own name, the offer, does not say). */
  it("heads with the lit check beside Sent, read aloud", () => {
    const { container } = render(
      <KeepOffer
        count={1}
        held
        hostName="Maya"
        onConfirm={vi.fn()}
        onLater={vi.fn()}
      />,
    );
    const sent = container.querySelector("[data-keep-sent]");
    expect(sent?.querySelector('[data-door-check="sent"]')).not.toBeNull();
    expect(sent?.closest("[aria-hidden]")).toBeNull();
    expect(sent).toHaveTextContent("SentYour photo is waiting for the host.");
  });
});

describe("KeepConfirm", () => {
  /* ★ THE ADDRESS TYPED AT THE DOOR ARRIVES IN THE FIELD: typing the same address twice in one
     visit is the friction the optional field was meant to remove. */
  it("opens on the address typed at the door", async () => {
    render(
      <KeepConfirm
        qrToken="tok-1"
        hintEmail="priya@example.com"
        onVerified={vi.fn()}
      />,
    );
    const field = await screen.findByPlaceholderText(/you@/i);
    await waitFor(() =>
      expect((field as HTMLInputElement).value).toBe("priya@example.com"),
    );
  });

  it("opens on an empty field for a guest who skipped it", async () => {
    render(<KeepConfirm qrToken="tok-1" onVerified={vi.fn()} />);
    const field = await screen.findByPlaceholderText(/you@/i);
    expect((field as HTMLInputElement).value).toBe("");
  });

  it("carries the newsletter switch, off until she turns it on", async () => {
    render(<KeepConfirm qrToken="tok-1" onVerified={vi.fn()} />);
    const toggle = await screen.findByRole("switch", {
      name: /send me occasional partyreel updates/i,
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("wears the keep door's own words", () => {
    render(<KeepConfirm qrToken="tok-1" onVerified={vi.fn()} />);
    expect(screen.getByText("Keep your photos")).toBeInTheDocument();
  });
});
