/**
 * THE KEEP'S OWN PIECES: the door's last screen (`guest-capture` r1, `moment=first` and
 * `shape=sheet-step`), drawn by the modal from this file. The flows the modal runs around them
 * (when the keep is due, the marker on Confirm, Maybe later putting it down, the claim on a code)
 * are pinned beside the door in `entry-modal.test.tsx`; these are the words and the two views.
 *
 *   1. IT OFFERS THE EVENT (voice-guest r2, Will's `keep=warm`), by name, and counts what landed
 *      inside it, the singular reading as a singular.
 *   2. IT SAYS WHERE WHAT SHE SENT WENT: into the host's album, or, on an event that holds uploads,
 *      waiting for approval in her uploads' own words (never "joined the album" for a photograph
 *      the album does not show).
 *   3. ITS CONFIRM IS THE ACCOUNT DOOR IN THIS SHEET: the address typed at the door this visit in
 *      its field, the newsletter switch off until she turns it on.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";

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
  // ★ RESHAPED (voice-wiring). These pinned "Keep these photos" over "all 7 stay with you", and a
  // heading that counted ("Keep this photo" for one). Will's `keep=warm` (voice-guest r2) made the
  // event the offer, so the heading no longer counts and the scar kept is the count inside the
  // line, one photograph said in the singular.
  it("offers the event, the future its reason", () => {
    expect(keepCopy(6, "Maya & Jay")).toEqual({
      title: "Keep this event",
      reason:
        "Confirm your email and Maya & Jay stays in your account with your 6 photos, to come back to anytime.",
    });
  });

  it("counts what landed inside it, and says one photograph in the singular", () => {
    expect(keepCopy(1, "Maya & Jay").reason).toMatch(/with your photo,/);
    expect(keepCopy(1_250, "Maya & Jay").reason).toMatch(
      /with your 1,250 photos,/,
    );
    expect(keepCopy(1, "Maya & Jay").title).toBe("Keep this event");
  });

  it("never reads with a hole where the event's name would be", () => {
    expect(keepCopy(2).reason).toMatch(
      /^Confirm your email and this event stays/,
    );
    expect(keepCopy(2, "  ").reason).toMatch(/and this event stays/);
  });

  it("promises the account, never a profile", () => {
    expect(keepCopy(3, "Maya & Jay").reason).toMatch(/in your account/);
    expect(keepCopy(3, "Maya & Jay").reason).not.toMatch(/profile/i);
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
      "Your photo is waiting for approval.",
    );
    expect(keepSentLine({ count: 2, held: true, hostName: "Maya" })).toBe(
      "Your 2 photos are waiting for approval.",
    );
  });

  // One state, one name (voice-guest r2 `status=approval`): the Sent line on a held event says
  // what her uploads call the same photograph a moment later.
  it("names a held photograph in her uploads' own words", () => {
    expect(keepSentLine({ count: 1, held: true })).toContain(
      TRACKER_WORDS.waiting.toLowerCase(),
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
        eventName="Maya & Jay"
        onConfirm={onConfirm}
        onLater={onLater}
      />,
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(
      screen.getByText("Your 2 photos joined Maya’s album."),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep this event")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confirm your email and Maya & Jay stays in your account with your 2 photos, to come back to anytime.",
      ),
    ).toBeInTheDocument();

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
    expect(sent).toHaveTextContent("SentYour photo is waiting for approval.");
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
