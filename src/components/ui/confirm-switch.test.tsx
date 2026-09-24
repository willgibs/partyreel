import { useState } from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmSwitch } from "@/components/ui/confirm-switch";

/**
 * `app-vocabulary` r1, `confirm-switch=primitive`: one component owns the
 * glyph and the deferred-open dance once. What this guards is the CONTRACT —
 * it asks on the edge `confirmWhen` names and never on the other, the ask is
 * deferred past the same tick a synchronous open would race, and Cancel
 * leaves the value untouched — never a class, a copy string or a size.
 */

function Harness({
  confirmWhen,
  onChange,
}: {
  confirmWhen: (next: boolean) => boolean;
  onChange?: (next: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <ConfirmSwitch
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onChange?.(next);
      }}
      label="Require verified emails"
      description="Guests confirm their email before uploading."
      confirmWhen={confirmWhen}
      dialogTitle="Let guests upload without verifying?"
      dialogDescription="Guests will add photos under a typed display name instead."
      confirmLabel="Allow unverified uploads"
      cancelLabel="Keep emails required"
    />
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ConfirmSwitch", () => {
  it("shows the glyph beside the label, unconditionally", () => {
    render(<Harness confirmWhen={() => false} />);
    const label = screen.getByText("Require verified emails").closest("label");
    expect(label?.querySelector("svg")).toBeTruthy();
  });

  it("applies at once on the edge confirmWhen refuses", () => {
    const onChange = vi.fn();
    render(<Harness confirmWhen={() => false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks on the edge confirmWhen names, and applies nothing until confirmed", () => {
    const onChange = vi.fn();
    // Asks only when the switch is about to turn OFF.
    render(<Harness confirmWhen={(next) => !next} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    // The non-asking edge (off -> on) applied at once, same as the case above.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");

    // Now the asking edge: on -> off.
    fireEvent.click(screen.getByRole("switch"));
    // Nothing applied yet, and the dialog is not open until the deferred tick
    // (the same radix dismissable-layer dodge the two hand-rolled callers used).
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Let guests upload without verifying?")).toBeTruthy();
    // Still unapplied: the confirm is a decision, not a side effect of opening.
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies the pending value on Confirm", () => {
    const onChange = vi.fn();
    render(<Harness confirmWhen={(next) => !next} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch")); // off -> on, instant
    fireEvent.click(screen.getByRole("switch")); // on -> off, asks
    act(() => {
      vi.advanceTimersByTime(0);
    });
    fireEvent.click(screen.getByText("Allow unverified uploads"));
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leaves the value untouched on Cancel", () => {
    const onChange = vi.fn();
    render(<Harness confirmWhen={(next) => !next} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch")); // off -> on, instant
    fireEvent.click(screen.getByRole("switch")); // on -> off, asks
    act(() => {
      vi.advanceTimersByTime(0);
    });
    fireEvent.click(screen.getByText("Keep emails required"));
    // Only the one instant application from the first click — Cancel never
    // calls back.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
