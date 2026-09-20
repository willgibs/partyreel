// @contract-for: src/components/admin/destructive-sheet.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DestructiveSheet } from "./destructive-sheet";

/**
 * THE ONE DESTRUCTIVE GRAMMAR (admin-wiring, 2026-09-20; `destructive=sheet`).
 *
 * The portal had four grammars and the severity did not line up with the
 * friction: a typed dialog for an account, a plain one for a photo, an
 * arm-then-confirm for a legal hold, and a bare switch for the purge sweep,
 * which was the cheapest click in the portal and one of its more expensive
 * mistakes. What is pinned is the three rules that make one panel size itself:
 *
 *  - every act SAYS what it touches, in full, before it happens;
 *  - only a permanent act with something to identify asks you to type, and it
 *    cannot be confirmed until you have;
 *  - a confirmation runs ONCE, and it is handed what was actually typed.
 */

const touches = ["18 events, binned now", "1 subscription, cancelled first"];

function sheet(props: Partial<React.ComponentProps<typeof DestructiveSheet>> = {}) {
  const onConfirm = vi.fn(async () => ({ ok: true as const }));
  render(
    <DestructiveSheet
      open
      onOpenChange={() => {}}
      title="Delete this account?"
      lede="Immediate and permanent."
      verb="Delete account"
      touches={touches}
      severity="reversible"
      successMessage="Done."
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm };
}

const confirmButton = (name = /delete account/i) =>
  screen.getByRole("button", { name });

describe("it says what the act touches", () => {
  it("lists every line it was given, and never a summary of them", () => {
    sheet({ touches: [...touches, "2 events under legal hold, skipped"] });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const touch of touches) {
      expect(screen.getByText(touch)).toBeInTheDocument();
    }
  });
});

describe("only a permanent act makes you type", () => {
  it("asks for nothing on a reversible one, and is pressable at once", () => {
    sheet({ severity: "reversible" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("asks for nothing on a permanent act with nothing to identify", () => {
    // Friction with nothing to check is friction people learn to type through,
    // so a permanent act is still red and still asks for no typing when there
    // is no specific wrong thing to get wrong.
    sheet({ severity: "permanent" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("refuses to confirm until the identifier matches", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      severity: "permanent",
      confirmText: "grace@whitlockevents.co",
    });
    expect(confirmButton()).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "grace@whitlock");
    expect(confirmButton()).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "events.co");
    expect(confirmButton()).toBeEnabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("the confirmation itself", () => {
  it("runs once, and is handed what was actually typed", async () => {
    // The account delete's server guard compares the confirmation against the
    // row it is about to delete: a client that sent the expected string every
    // time would turn that guard into a tautology.
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      severity: "permanent",
      confirmText: "grace@whitlockevents.co",
    });
    await user.type(screen.getByRole("textbox"), "grace@whitlockevents.co");
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("grace@whitlockevents.co");
  });

  it("runs once on a reversible act too", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({ verb: "Pause the sweep" });
    await user.click(confirmButton(/pause the sweep/i));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("leaves Cancel doing nothing but closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { onConfirm } = sheet({ onOpenChange });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
