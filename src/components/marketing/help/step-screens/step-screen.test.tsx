import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * A STEP'S SCREEN, AS A READER MEETS IT (help-center r1 `article=screen`): one picture to a screen
 * reader, named for the surface it shows, at the slot's width before anything loads (so the text
 * beside it never moves), and an unknown id refused out loud rather than drawn as a hole.
 */
vi.mock("next/dynamic", () => ({
  // The door's pieces arrive on demand in the product; the frame is what this pins.
  default: () => () => null,
}));

const { StepScreen } = await import("./step-screen");

describe("StepScreen", () => {
  it("draws a desk's picture as one image, named, on the server's first paint", () => {
    render(<StepScreen id="qr-download" />);
    const picture = screen.getByRole("img", {
      name: "Download the code: SVG (best for print) or PNG (best for screens)",
    });
    expect(picture).toHaveAttribute("data-step-screen", "qr-download");
    // The quoted menu is inside the picture, hidden from assistive tech as its own words.
    expect(picture.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("stands a phone's frame at its final size before its document is made", () => {
    const { container } = render(<StepScreen id="door-code" />);
    const picture = screen.getByRole("img", {
      name: "Check your email, six boxes for the code",
    });
    expect(picture.style.width).not.toBe("");
    expect(picture.style.height).not.toBe("");
    expect(
      container.querySelector('[data-step-screen="door-code"]'),
    ).not.toBeNull();
  });

  it("refuses an id the registry does not hold", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<StepScreen id="door-nope" />)).toThrow(
      /Unknown step screen "door-nope"/,
    );
    spy.mockRestore();
  });
});
