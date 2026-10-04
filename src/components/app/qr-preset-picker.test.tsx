import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  QR_PRESETS,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";

import { QrPresetPicker } from "./qr-preset-picker";

/**
 * THE FOUR LOOKS AS ONE CHOICE (create-wizard r2 `look=places`: four swatches under the two places her
 * code goes, each a corner of its own code, where a rounded finder reads as rounded and Bold's coral as
 * coral). What fails silently: a look missing from the four, two chosen at once, a pick the parent never
 * hears, and a keyboard that cannot move between them.
 */

vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({ value }: { value: string }) => (
    <div data-testid="styled-qr" data-value={value} />
  ),
}));

const JOIN = `https://partyreel.com/e/${"0".repeat(32)}`;

function Controlled({ onPick }: { onPick?: (k: QrStyleKey) => void }) {
  const [value, setValue] = useState<QrStyleKey>("classic");
  return (
    <QrPresetPicker
      value={value}
      onChange={(k) => {
        setValue(k);
        onPick?.(k);
      }}
      joinUrl={JOIN}
    />
  );
}

describe("the looks", () => {
  it("offers every look by its own name, exactly one chosen", () => {
    render(<Controlled />);
    const looks = screen.getAllByRole("radio");
    expect(looks.map((l) => l.textContent)).toEqual(
      QR_STYLE_KEYS.map((k) => QR_PRESETS[k].label),
    );
    expect(
      looks.filter((l) => l.getAttribute("aria-checked") === "true"),
    ).toEqual([screen.getByRole("radio", { name: /classic/i })]);
  });

  it("hands the parent the look she pressed", async () => {
    const onPick = vi.fn();
    render(<Controlled onPick={onPick} />);
    await userEvent.click(screen.getByRole("radio", { name: /rounded/i }));
    expect(onPick).toHaveBeenLastCalledWith("rounded");
    expect(screen.getByRole("radio", { name: /rounded/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("moves between the looks from the keyboard, the arrows choosing as they go", async () => {
    const onPick = vi.fn();
    render(<Controlled onPick={onPick} />);
    act(() => screen.getByRole("radio", { name: /classic/i }).focus());
    // Held, as a finger holds a key: the group moves focus a tick after the keydown, and a look is
    // chosen by a focus that arrives while an arrow is down.
    await userEvent.keyboard("{ArrowRight>}");
    await waitFor(() => expect(onPick).toHaveBeenLastCalledWith("bold"));
    await userEvent.keyboard("{/ArrowRight}");
    expect(screen.getByRole("radio", { name: /bold/i })).toHaveFocus();
  });

  it("draws each look on the link it is handed, never a short placeholder", () => {
    render(<Controlled />);
    for (const code of screen.getAllByTestId("styled-qr"))
      expect(code).toHaveAttribute("data-value", JOIN);
  });
});
