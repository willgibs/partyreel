import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SwitchStates } from "@/lib/jobs/spend-watch";

import type { WatchToggle } from "./switch-controls";

/**
 * THE SWITCHES' WRITE IS THE SERVER FUNCTION UNTIL A SPECIMEN HANDS IN ANOTHER (`switch-controls.tsx`'s `toggle`).
 *
 * The spend watch's two switches pause guest uploads and lifecycle mail for every album, and the Library draws the card
 * over the real project, so a specimen's press must change nothing. The seam is one optional prop; what is pinned is that
 * it changes nothing for the portal (no `toggle`: the same Server Function, called with the same key and the same
 * direction, from the OFF edge's sheet and from the way back) and that with one the Server Function is never reached. The
 * sheet's own words and the card's are `spend-watch-card.test.tsx`'s.
 */

const action = vi.hoisted(() => ({
  toggleWatchSwitchAction: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/app/admin/jobs/actions", () => action);

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));

const { SpendWatchSwitches } = await import("./spend-watch-card");

const ON: SwitchStates = {
  uploads_enabled: { enabled: true, updatedAtMs: null },
  lifecycle_mail_enabled: { enabled: true, updatedAtMs: null },
  export_enabled: { enabled: true, updatedAtMs: null },
  purge_cron_enabled: { enabled: true, updatedAtMs: null },
};

const OFF_UPLOADS: SwitchStates = {
  ...ON,
  uploads_enabled: { enabled: false, updatedAtMs: 1 },
};

function card(over: { toggle?: WatchToggle; switches?: SwitchStates } = {}) {
  return render(
    <SpendWatchSwitches
      switches={over.switches ?? ON}
      latest={null}
      unreadable={null}
      toggle={over.toggle}
    />,
  );
}

const flip = (name: string) =>
  userEvent.click(screen.getByRole("switch", { name: `Toggle ${name}` }));

/** The OFF edge: the switch opens the one sheet, and its verb is the act. */
async function pause(name: string, verb: string) {
  await flip(name);
  const sheet = await screen.findByRole("alertdialog");
  await userEvent.click(within(sheet).getByRole("button", { name: verb }));
}

beforeEach(() => {
  action.toggleWatchSwitchAction.mockClear();
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("with no toggle, the portal's switches write as they always did", () => {
  it("★ the OFF edge asks first, and the sheet's verb calls the Server Function with the key and the direction", async () => {
    card();
    await flip("Guest uploads");
    // Pressing the switch only asks: nothing is written until the sheet's verb.
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(action.toggleWatchSwitchAction).not.toHaveBeenCalled();
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Pause uploads",
      }),
    );
    await waitFor(() =>
      expect(action.toggleWatchSwitchAction).toHaveBeenCalledWith(
        "uploads_enabled",
        false,
      ),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Guest uploads paused."),
    );
    expect(
      await screen.findByText("Paused for every guest"),
    ).toBeInTheDocument();
  });

  it("★ turning it back on is immediate, and calls the Server Function with the key on", async () => {
    card({ switches: OFF_UPLOADS });
    await flip("Guest uploads");
    await waitFor(() =>
      expect(action.toggleWatchSwitchAction).toHaveBeenCalledWith(
        "uploads_enabled",
        true,
      ),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("with a toggle, the Server Function is never reached", () => {
  it("★ both switches this card holds write through it, in the same directions", async () => {
    const toggle = vi.fn(async () => ({ ok: true as const }));
    card({ toggle });
    await pause("Guest uploads", "Pause uploads");
    await waitFor(() =>
      expect(toggle).toHaveBeenCalledWith("uploads_enabled", false),
    );
    await pause("Lifecycle mail", "Hold the mail");
    await waitFor(() =>
      expect(toggle).toHaveBeenCalledWith("lifecycle_mail_enabled", false),
    );
    expect(action.toggleWatchSwitchAction).not.toHaveBeenCalled();
  });

  it("★ a refusal it answers is the real switch's: the toast says so and the switch stays on", async () => {
    const toggle = vi.fn(async () => ({
      ok: false as const,
      code: "unknown" as const,
      message: "Couldn't update the switch. Please try again.",
    }));
    card({ toggle });
    await pause("Guest uploads", "Pause uploads");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't update the switch. Please try again.",
      ),
    );
    // The refusal leaves the sheet open over the card, which hides the switch from the accessibility tree.
    expect(
      screen.getByRole("switch", {
        name: "Toggle Guest uploads",
        hidden: true,
      }),
    ).toBeChecked();
    expect(action.toggleWatchSwitchAction).not.toHaveBeenCalled();
  });

  it("★ the way back goes through it too", async () => {
    const toggle = vi.fn(async () => ({ ok: true as const }));
    card({ toggle, switches: OFF_UPLOADS });
    await flip("Guest uploads");
    await waitFor(() =>
      expect(toggle).toHaveBeenCalledWith("uploads_enabled", true),
    );
    expect(action.toggleWatchSwitchAction).not.toHaveBeenCalled();
  });
});
