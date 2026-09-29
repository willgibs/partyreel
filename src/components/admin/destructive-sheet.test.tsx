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

function sheet(
  props: Partial<React.ComponentProps<typeof DestructiveSheet>> = {},
) {
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
    // The second argument is the confirm's note (admin-triage r1): this act
    // carries none, so it is handed "".
    expect(onConfirm).toHaveBeenCalledWith("grace@whitlockevents.co", "");
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

/**
 * ONE NOTE, TYPED INTO THE CONFIRM (admin-triage r1, `verdict=note` and
 * `escalate=door`, Will 2026-09-28): a report's Remove leaves an optional line
 * on the record, and a hold from a report states its reason there, filled in.
 */
describe("a confirm can carry one note", () => {
  it("an optional note asks for nothing, and hands over what was written, trimmed", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      verb: "Remove",
      note: { label: "Note", placeholder: "Why, in one line" },
    });
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    const field = screen.getByRole("textbox", { name: /note/i });
    expect(confirmButton(/remove/i)).toBeEnabled();

    await user.type(field, "  Child in frame; her parent asked.  ");
    await user.click(confirmButton(/remove/i));
    expect(onConfirm).toHaveBeenCalledWith(
      "",
      "Child in frame; her parent asked.",
    );
  });

  it("an empty optional note is handed over as nothing at all", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({ verb: "Remove", note: { label: "Note" } });
    await user.click(confirmButton(/remove/i));
    expect(onConfirm).toHaveBeenCalledWith("", "");
  });

  it("a required note holds the verb until a line is written", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      verb: "Set hold and preserve",
      note: { label: "Reason, on the record", required: true },
    });
    const verb = confirmButton(/set hold and preserve/i);
    expect(screen.getByText("(required)")).toBeInTheDocument();
    expect(verb).toBeDisabled();

    // Spaces are not a reason.
    await user.type(screen.getByRole("textbox"), "   ");
    expect(verb).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "report 8d2f0b14");
    expect(verb).toBeEnabled();
    await user.click(verb);
    expect(onConfirm).toHaveBeenCalledWith("", "report 8d2f0b14");
  });

  it("a filled-in note starts from its value, and the operator's edit is what is handed over", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      verb: "Set hold and preserve",
      note: {
        label: "Reason, on the record",
        required: true,
        defaultValue: "Report 8d2f0b14",
      },
    });
    const field = screen.getByRole("textbox");
    expect(field).toHaveValue("Report 8d2f0b14");
    expect(confirmButton(/set hold and preserve/i)).toBeEnabled();

    await user.type(field, ", CyberTipline filing");
    await user.click(confirmButton(/set hold and preserve/i));
    expect(onConfirm).toHaveBeenCalledWith(
      "",
      "Report 8d2f0b14, CyberTipline filing",
    );
  });

  it("a permanent act with a note still waits for its identifier, and hands over both", async () => {
    const user = userEvent.setup();
    const { onConfirm } = sheet({
      severity: "permanent",
      confirmText: "grace@whitlockevents.co",
      note: { label: "Note" },
    });
    await user.type(
      screen.getByRole("textbox", { name: /note/i }),
      "Asked twice.",
    );
    expect(confirmButton()).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: /type/i }),
      "grace@whitlockevents.co",
    );
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(
      "grace@whitlockevents.co",
      "Asked twice.",
    );
  });
});
