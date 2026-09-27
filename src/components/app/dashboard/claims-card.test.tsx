import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ClaimableEvent } from "@/lib/db/queries/claims";
import { formatEventDate } from "@/lib/utils";

import {
  ClaimCard,
  confirmDeleteTitle,
  lockWords,
  namesLabel,
  SETTLE_MS,
  whoLine,
} from "./claims-card";

/**
 * ONE WAITING EVENT ON TOP OF THE CLAIMS REVIEW (`identity-claims` r1, `pass=cards`). Pinned: what
 * the card says (the album's date only where the album shows one, every typed name, a grouped count),
 * a gated album's lock where its photographs would be, and the answers' two holds: an arriving card
 * answers nothing for a beat, and a card whose answer is being written answers nothing more.
 */

const TOMS: ClaimableEvent = {
  eventId: "e-toms",
  eventName: "Tom's Leaving Do",
  eventDate: "2026-08-29",
  names: ["Priya"],
  uploadCount: 4,
  lastUploadAt: "2026-08-29T22:40:00Z",
  gate: null,
  previews: ["https://r2.test/a", "https://r2.test/b"],
};

function renderCard(
  over: Partial<ClaimableEvent> = {},
  props: Partial<Parameters<typeof ClaimCard>[0]> = {},
) {
  const onClaim = vi.fn();
  const onNotMine = vi.fn();
  render(
    <ClaimCard
      row={{ ...TOMS, ...over }}
      arriving={false}
      pending={null}
      onClaim={onClaim}
      onNotMine={onNotMine}
      {...props}
    />,
  );
  return { onClaim, onNotMine };
}

describe("what the card says", () => {
  it("names the event, its date, who it was added as and how many", () => {
    renderCard();
    expect(screen.getByText("Tom's Leaving Do")).toBeInTheDocument();
    expect(screen.getByText(formatEventDate("2026-08-29"))).toBeInTheDocument();
    expect(screen.getByText("Added as Priya · 4 photos")).toBeInTheDocument();
  });

  it("shows her own previews, one tile each", () => {
    renderCard();
    const card = screen.getByRole("article", { name: "Tom's Leaving Do" });
    expect(
      [...card.querySelectorAll("img")].map((img) => img.getAttribute("src")),
    ).toEqual(["https://r2.test/a", "https://r2.test/b"]);
  });

  it("★ a password album shows a lock and the count, never a photograph or a date", () => {
    renderCard({ gate: "password", eventDate: null, previews: [] });
    expect(
      screen.getByText("4 photos stay behind the host’s password"),
    ).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("a private album says so in the same place", () => {
    renderCard({ gate: "private", uploadCount: 1, previews: [] });
    expect(
      screen.getByText("1 photo stays in an album the host made private"),
    ).toBeInTheDocument();
  });

  it("an open album with nothing to show yet draws no empty row", () => {
    renderCard({ previews: [] });
    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryByText(/stay/)).not.toBeInTheDocument();
  });

  it("groups a count past 999 and names every typed name", () => {
    expect(
      whoLine({ ...TOMS, uploadCount: 1249, names: ["Priya", "P.", "Pri"] }),
    ).toBe("Added as Priya, P., and Pri · 1,249\u00a0photos");
    expect(namesLabel([])).toBeNull();
    expect(whoLine({ ...TOMS, names: [], uploadCount: 1 })).toBe(
      "1\u00a0photo",
    );
    expect(lockWords({ ...TOMS, gate: "password", uploadCount: 1249 })).toBe(
      "1,249\u00a0photos stay behind the host’s password",
    );
  });
});

describe("the answers", () => {
  it("a card the review opens on answers at once", () => {
    const { onClaim, onNotMine } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Claim" }));
    fireEvent.click(screen.getByRole("button", { name: "Not mine" }));
    expect(onClaim).toHaveBeenCalledTimes(1);
    expect(onNotMine).toHaveBeenCalledTimes(1);
  });

  describe("★ an arriving card holds its answers for a beat", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("drops a tap that lands as it slides in, then answers", () => {
      const { onClaim } = renderCard({}, { arriving: true });
      const claim = screen.getByRole("button", { name: "Claim" });
      expect(claim).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(claim);
      expect(onClaim).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(SETTLE_MS);
      });
      expect(claim).not.toHaveAttribute("aria-disabled");
      fireEvent.click(claim);
      expect(onClaim).toHaveBeenCalledTimes(1);
    });
  });

  it("answers nothing while its own answer is being written", () => {
    const { onClaim, onNotMine } = renderCard({}, { pending: "claim" });
    fireEvent.click(screen.getByRole("button", { name: "Claim" }));
    fireEvent.click(screen.getByRole("button", { name: "Not mine" }));
    expect(onClaim).not.toHaveBeenCalled();
    expect(onNotMine).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Claim" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});

/**
 * The confirm-delete title's pluralisation, pinned the moment it was written (a count-bearing
 * sentence gets its pin immediately): one upload is "photo or video" (never "photo", which would lie
 * when the one upload is a video) and several are "photos and videos"; one event is "this event"
 * and several name the count; every count grouped. The review asks per card, so it always says
 * "this event"; the several-event forms stay pinned for any caller that lists more.
 */
describe("the confirm-delete title", () => {
  it.each([
    [
      1,
      1,
      "Permanently delete the 1 photo or video added under your email at this event?",
    ],
    [
      1,
      2,
      "Permanently delete the 1 photo or video added under your email at these 2 events?",
    ],
    [
      2,
      1,
      "Permanently delete the 2 photos and videos added under your email at this event?",
    ],
    [
      1249,
      1,
      "Permanently delete the 1,249 photos and videos added under your email at this event?",
    ],
  ])("%i photos at %i events", (photos, events, title) => {
    expect(confirmDeleteTitle(photos, events)).toBe(title);
  });
});
