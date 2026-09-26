/**
 * SETTINGS' HIGHLIGHT REEL SECTION SAVES EACH CHOICE THE MOMENT IT IS MADE (`reel-host`, Will
 * 2026-09-25: `style=both`, his `switch` amendment).
 *
 * Pinned by behaviour, through the one write (`setReelDefaults`, stubbed): each control sends
 * exactly its own field; the choice shows at once and is put back, with a sentence, when the save
 * is refused; a slow answer to an older pick never undoes a newer one; the switch, which is felt
 * on the album rather than here, refreshes the hub; and a stored value is shown as a guest would
 * start on it (null reads as the default mood and the default hold, never a zero).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SetReelDefaultsResult } from "@/lib/reel/defaults-action";

const { setReelDefaults, refresh, toast } = vi.hoisted(() => ({
  setReelDefaults: vi.fn(),
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/reel/defaults-action", () => ({
  setReelDefaults: (...args: unknown[]) => setReelDefaults(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));

const { HighlightReelCard } = await import("./highlight-reel-card");

type Defaults = {
  showReel: boolean;
  styleId: string | null;
  holdSec: number | null;
};

function answer(defaults: Defaults): SetReelDefaultsResult {
  return { ok: true, defaults };
}

beforeEach(() => {
  setReelDefaults.mockReset();
  refresh.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

function card(
  over: Partial<Defaults> = {},
  sampleStill: string | null = "preview-1",
) {
  return render(
    <HighlightReelCard
      eventId="event-1"
      showReel={over.showReel ?? true}
      styleId={over.styleId === undefined ? null : over.styleId}
      holdSec={over.holdSec === undefined ? null : over.holdSec}
      sampleStill={sampleStill}
    />,
  );
}

const pressed = (el: HTMLElement) => el.getAttribute("data-state") === "on";

describe("what the card shows", () => {
  it("reads a null look and hold as where a guest starts: the default mood and 3 seconds", () => {
    card();
    expect(pressed(screen.getByRole("radio", { name: /cinematic/i }))).toBe(
      true,
    );
    expect(pressed(screen.getByRole("radio", { name: "3 seconds" }))).toBe(
      true,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("shows the looks on the event's own photo, and says so when a sample stands in", () => {
    const { unmount } = card();
    const swatch = document.querySelector("[data-reel-mood='mono'] img");
    expect(swatch?.getAttribute("src")).toBe("preview-1");
    // The mood's own grade, the filter the engine draws a still with.
    expect((swatch as HTMLElement).style.filter).toContain("grayscale(1)");
    expect(screen.queryByText(/sample photo/i)).toBeNull();
    unmount();
    card({}, null);
    expect(screen.getByText(/sample photo/i)).toBeTruthy();
  });
});

describe("saving", () => {
  it("sends only the field that changed, and keeps what the save answered", async () => {
    setReelDefaults.mockResolvedValue(
      answer({ showReel: true, styleId: "mono", holdSec: null }),
    );
    card();
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /noir/i }));
    });
    expect(setReelDefaults).toHaveBeenCalledWith({
      eventId: "event-1",
      styleId: "mono",
    });
    expect(pressed(screen.getByRole("radio", { name: /noir/i }))).toBe(true);
    // A look is seen as it is picked: no toast for it.
    expect(toast.success).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("saves the hold as a step in seconds", async () => {
    setReelDefaults.mockResolvedValue(
      answer({ showReel: true, styleId: null, holdSec: 5 }),
    );
    card();
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "5 seconds" }));
    });
    expect(setReelDefaults).toHaveBeenCalledWith({
      eventId: "event-1",
      holdSec: 5,
    });
    expect(pressed(screen.getByRole("radio", { name: "5 seconds" }))).toBe(
      true,
    );
  });

  it("puts the choice back, with a sentence, when the save is refused", async () => {
    setReelDefaults.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "That didn't save.",
    });
    card({ styleId: "golden" });
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /noir/i }));
    });
    expect(pressed(screen.getByRole("radio", { name: /sunset/i }))).toBe(true);
    expect(pressed(screen.getByRole("radio", { name: /noir/i }))).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't save that setting.",
      expect.objectContaining({ description: "That didn't save." }),
    );
  });

  it("never lets a slow answer to an older pick undo a newer one", async () => {
    let answerFirst: (r: SetReelDefaultsResult) => void = () => {};
    setReelDefaults
      .mockImplementationOnce(
        () => new Promise((resolve) => (answerFirst = resolve)),
      )
      .mockResolvedValueOnce(
        answer({ showReel: true, styleId: "dreamy", holdSec: null }),
      );
    card();
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /noir/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /float/i }));
    });
    await act(async () => {
      answerFirst(answer({ showReel: true, styleId: "mono", holdSec: null }));
    });
    expect(pressed(screen.getByRole("radio", { name: /float/i }))).toBe(true);
  });

  it("says what the switch did, which is felt on the album, and refreshes the hub", async () => {
    setReelDefaults.mockResolvedValue(
      answer({ showReel: false, styleId: null, holdSec: null }),
    );
    card();
    await act(async () => {
      fireEvent.click(screen.getByRole("switch"));
    });
    expect(setReelDefaults).toHaveBeenCalledWith({
      eventId: "event-1",
      showReel: false,
    });
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("ignores a second press on the look already chosen", async () => {
    card({ styleId: "mono" });
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /noir/i }));
    });
    expect(setReelDefaults).not.toHaveBeenCalled();
    expect(pressed(screen.getByRole("radio", { name: /noir/i }))).toBe(true);
  });
});
