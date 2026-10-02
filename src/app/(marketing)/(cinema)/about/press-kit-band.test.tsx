import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ABOUT_PRESS_HREF, ABOUT_PRESS_KIT } from "@/lib/constants/about";
import {
  formatKitBytes,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
} from "@/lib/constants/press";

import { PressKitBand } from "./press-kit-band";

/**
 * THE BAND /press LANDS ON (about-press r1): the anchor every Press door points
 * at, four plates drawn from the kit's manifest, one download and his usage
 * line. How it looks is the page's to judge in a browser; these hold what a
 * redirect and a link depend on.
 */

describe("the press kit band", () => {
  it("is the section every Press door's address ends on", () => {
    const { container } = render(<PressKitBand />);
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section!.id).toBe(ABOUT_PRESS_KIT.id);
    expect(ABOUT_PRESS_HREF).toBe(`/about#${section!.id}`);
    // A named region, so the anchor lands a reader on a heading, not on a bare box.
    expect(
      screen.getByRole("heading", { level: 2, name: ABOUT_PRESS_KIT.heading }),
    ).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-labelledby");
  });

  it("shows four plates, each an image that says which file it is", () => {
    render(<PressKitBand />);
    const plates = screen.getByRole("list", {
      name: ABOUT_PRESS_KIT.platesLabel,
    });
    const items = within(plates).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    // Four DIFFERENT things (the mark twice on two grounds, the code, the card), by label.
    const labels = ["mark-dark", "mark-light", "qr", "share-card"].map(
      (id) => PRESS_KIT.find((a) => a.id === id)!.label,
    );
    expect(new Set(labels).size).toBe(4);
    for (const label of labels) {
      expect(within(plates).getByAltText(label)).toBeInTheDocument();
    }
  });

  it("offers the one download: the kit's zip, named and sized from the manifest", () => {
    render(<PressKitBand />);
    const download = screen.getByRole("link", {
      name: `${ABOUT_PRESS_KIT.downloadLabel} (${formatKitBytes(PRESS_KIT_BYTES)})`,
    });
    expect(download).toHaveAttribute("href", PRESS_KIT_ZIP);
    expect(download).toHaveAttribute("download");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("carries his usage line beside the files", () => {
    render(<PressKitBand />);
    expect(
      screen.getByText(ABOUT_PRESS_KIT.usage, { exact: false }),
    ).toBeTruthy();
  });
});
