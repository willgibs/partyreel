/**
 * THE KEEP'S OWN PIECES: the door's last screen (`guest-capture` r1, `moment=first` and
 * `shape=sheet-step`), drawn by the modal from this file. The flows the modal runs around them
 * (when the keep is due, the marker on Confirm, Maybe later putting it down, the claim on a code)
 * are pinned beside the door in `entry-modal.test.tsx`; these are the words and the two views.
 *
 *   1. IT OFFERS THE EVENT (voice-guest r2, Will's `keep=warm`), by name, and counts what landed
 *      inside it, the singular reading as a singular.
 *   2. IT SAYS WHERE WHAT SHE SENT WENT: into the host's album, or, where it waits, how it develops
 *      (the-wait r1, `model=time`: as the host lets it in, or with everyone's at the develop time),
 *      never "joined the album" for a photograph the album does not show.
 *   3. ITS CONFIRM IS THE ACCOUNT DOOR IN THIS SHEET: the address typed at the door this visit in
 *      its field, the newsletter switch off until she turns it on.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { developsWhen } from "@/lib/guest/camera/words";

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

  // RESHAPED (the-wait r1, `model=time`): a held one said "is waiting for approval" in her uploads' words; every wait
  // develops now, and the clock is the host's. The scar kept: never "joined" for a photograph the album does not show.
  it("never says it joined the album on an event that holds uploads: it develops as the host lets it in", () => {
    expect(keepSentLine({ count: 1, held: true, hostName: "Maya" })).toBe(
      "Your photo develops as Maya lets it in.",
    );
    expect(keepSentLine({ count: 2, held: true, hostName: "Maya" })).toBe(
      "Your 2 photos develop as Maya lets them in.",
    );
    expect(keepSentLine({ count: 1, held: true })).toBe(
      "Your photo develops as the host lets it in.",
    );
  });

  /* ★ RED-TEAM 43'S MEDIUM: on an album with a develop time ahead, her shots are sealed until it develops, and the
     Sent line said "Your 2 photos joined Will Gibson's album." Now it says they develop with everyone's, and when. */
  it("★ a sealed shot develops with everyone's, at its time in her clock, and never joined", () => {
    const now = Date.parse("2026-10-02T20:00:00.000Z");
    const at = "2026-10-03T13:00:00.000Z";
    const line = keepSentLine({
      count: 2,
      held: true,
      developsAt: at,
      hostName: "Will Gibson",
      nowMs: now,
    });
    expect(line).toBe(
      `Your 2 photos develop with everyone's ${developsWhen(at, now)}.`,
    );
    expect(line).not.toContain("joined");
    expect(
      keepSentLine({ count: 1, held: true, developsAt: at, nowMs: now }),
    ).toBe(`Your photo develops with everyone's ${developsWhen(at, now)}.`);
    // Before her clock is known, and for a time it cannot read, it still develops, and says no time.
    expect(
      keepSentLine({ count: 1, held: true, developsAt: at, nowMs: null }),
    ).toBe("Your photo develops with everyone's.");
    expect(
      keepSentLine({ count: 1, held: true, developsAt: "soon", nowMs: now }),
    ).toBe("Your photo develops with everyone's.");
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
    expect(sent).toHaveTextContent(
      "SentYour photo develops as Maya lets it in.",
    );
  });
});

/**
 * ★ IT NAMES WHAT SHE SENT (red-team 44's NIT: "Your 5 photos are waiting to develop" with a video among them). A
 * camera album's are shots, as the camera calls them; elsewhere they are named by kind, a mix in `formatKindCount`'s
 * own word for one, uploads; the Sent line and the offer alike. Handed nothing about what went, the words are today's.
 */
describe("what she sent, named", () => {
  const AT = "2026-10-03T13:00:00.000Z";
  const photo = "photo" as const;
  const video = "video" as const;

  const NOW = Date.parse("2026-10-02T20:00:00.000Z");

  it("★ calls a camera album's shots, whatever each one is", () => {
    const sent = { kinds: [photo, photo, photo, photo, video], camera: true };
    expect(
      keepSentLine({ count: 5, held: true, developsAt: AT, sent, nowMs: NOW }),
    ).toBe(`Your 5 shots develop with everyone's ${developsWhen(AT, NOW)}.`);
    expect(keepCopy(5, "Maya & Jay", sent).reason).toMatch(
      /with your 5 shots,/,
    );
    expect(
      keepSentLine({
        count: 1,
        held: true,
        developsAt: AT,
        sent: { kinds: [video], camera: true },
        nowMs: NOW,
      }),
    ).toBe(`Your shot develops with everyone's ${developsWhen(AT, NOW)}.`);
  });

  it("★ names a mix as uploads, never photos", () => {
    const sent = { kinds: [photo, photo, video], camera: false };
    expect(
      keepSentLine({ count: 3, held: true, developsAt: AT, sent, nowMs: NOW }),
    ).toBe(`Your 3 uploads develop with everyone's ${developsWhen(AT, NOW)}.`);
    expect(
      keepSentLine({ count: 3, held: false, hostName: "Maya", sent }),
    ).toBe("Your 3 uploads joined Maya\u2019s album.");
    expect(keepCopy(3, "Maya & Jay", sent).reason).toMatch(
      /with your 3 uploads,/,
    );
  });

  it("names videos as videos, one or many", () => {
    expect(
      keepSentLine({
        count: 1,
        held: true,
        sent: { kinds: [video], camera: false },
      }),
    ).toBe("Your video develops as the host lets it in.");
    expect(
      keepSentLine({
        count: 2,
        held: false,
        hostName: "Maya",
        sent: { kinds: [video, video], camera: false },
      }),
    ).toBe("Your 2 videos joined Maya\u2019s album.");
    expect(
      keepCopy(1, "Maya & Jay", { kinds: [video], camera: false }).reason,
    ).toMatch(/with your video,/);
  });

  it("keeps photos for photos, and today's words when nothing says what went", () => {
    expect(
      keepSentLine({
        count: 2,
        held: false,
        hostName: "Maya",
        sent: { kinds: [photo, photo], camera: false },
      }),
    ).toBe("Your 2 photos joined Maya\u2019s album.");
    expect(keepSentLine({ count: 2, held: false, hostName: "Maya" })).toBe(
      "Your 2 photos joined Maya\u2019s album.",
    );
    expect(keepCopy(2, "Maya & Jay").reason).toMatch(/with your 2 photos,/);
  });

  it("★ the offer says it on its Sent line and in its reason", () => {
    render(
      <KeepOffer
        count={2}
        held
        developsAt={AT}
        sent={{ kinds: [photo, video], camera: true }}
        eventName="Maya & Jay"
        onConfirm={vi.fn()}
        onLater={vi.fn()}
      />,
    );
    // Rendered after hydration, so the time is said in the reader's clock.
    expect(
      screen.getByText(/^Your 2 shots develop with everyone's/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confirm your email and Maya & Jay stays in your account with your 2 shots, to come back to anytime.",
      ),
    ).toBeInTheDocument();
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
