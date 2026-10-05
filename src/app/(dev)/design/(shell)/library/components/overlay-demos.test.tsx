import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setViewportWidth } from "../../../../../../../vitest.setup";
import { DialogSheetDemo, type OverlayVariant } from "./overlay-demos";

/**
 * THE DIALOG AND THE SHEET ARE DRAWN AS THEMSELVES, AT BOTH SCREENS (`overlay-demos.tsx`): the centred Dialog and its
 * fullScreen takeover, the responsive Sheet (the guest door's, with a keyboard to stand on) and a fixed side. The frame
 * is the lab's (its own test's); what is pinned here is which primitive each specimen mounts and that only the one with a
 * field is offered the keyboard.
 */

vi.mock("@/components/lab", () => ({
  Frame: (props: { id: string; children: ReactNode }) =>
    props.id.endsWith("-desk") ? (
      <figure data-testid={props.id}>{props.children}</figure>
    ) : null,
  Measured: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  setViewportWidth(1280);
});
afterEach(() => {
  vi.unstubAllGlobals();
  setViewportWidth(1024);
  document.body.inert = false;
});

const layer = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot=${slot}]`);

describe("each primitive is the one the entry says it is", () => {
  it("★ the Dialog stands as the centred shape every confirm and form wears", () => {
    render(<DialogSheetDemo variant="dialog" />);
    expect(layer("dialog-content")?.getAttribute("data-shape")).toBe("dialog");
    expect(screen.getByRole("dialog")).toHaveTextContent(/delete this event/i);
  });

  it("★ the takeover is the fullScreen room: no shape of its own, and it brings its own Done", () => {
    render(<DialogSheetDemo variant="takeover" />);
    expect(layer("dialog-content")).toBeTruthy();
    expect(layer("dialog-content")?.hasAttribute("data-shape")).toBe(false);
    expect(
      screen.getByRole("button", { name: "Done", hidden: true }),
    ).toBeInTheDocument();
  });

  it("★ the guest door's sheet is the responsive one, and a fixed side is its own", () => {
    const responsive = render(<DialogSheetDemo variant="responsive" />);
    expect(layer("sheet-content")?.getAttribute("data-side")).toBe(
      "responsive",
    );
    responsive.unmount();
    render(<DialogSheetDemo variant="side" />);
    expect(layer("sheet-content")?.getAttribute("data-side")).toBe("right");
  });
});

describe("the keyboard goes with the field", () => {
  const FIELD: Record<OverlayVariant, boolean> = {
    dialog: false,
    takeover: false,
    responsive: true,
    side: false,
  };
  it.each(Object.keys(FIELD) as OverlayVariant[])(
    "★ %s is offered the keyboard only if a field stands in it",
    (variant) => {
      render(<DialogSheetDemo variant={variant} />);
      expect(Boolean(screen.queryByText(/keyboard up, in the hand/i))).toBe(
        FIELD[variant],
      );
      expect(Boolean(document.querySelector("input"))).toBe(FIELD[variant]);
    },
  );
});
