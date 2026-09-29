import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CONTACT_DIRECTORY } from "@/lib/constants/contact";

import { ContactDirectory } from "./contact-directory";

describe("the directory beside the form", () => {
  it("lists every door as one link to its page, headed by its title", () => {
    render(<ContactDirectory />);
    const list = screen.getByRole("list", {
      name: "Looking for something else?",
    });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(CONTACT_DIRECTORY.length);
    for (const entry of CONTACT_DIRECTORY) {
      const link = within(list).getByRole("link", {
        name: new RegExp(entry.title),
      });
      expect(link).toHaveAttribute("href", entry.href);
      expect(
        within(link).getByRole("heading", { level: 3, name: entry.title }),
      ).toBeInTheDocument();
      expect(within(link).getByText(entry.body)).toBeInTheDocument();
    }
  });

  // contact-page r1 `beside`: "icons instead of numbers". An icon is decorative
  // (the title names the door) and no ordinal survives beside it.
  it("draws an icon for each door, hidden from assistive tech, and no index numerals", () => {
    const { container } = render(<ContactDirectory />);
    const list = container.querySelector("ul")!;
    expect(
      list.querySelectorAll("svg[aria-hidden='true']").length,
    ).toBeGreaterThanOrEqual(CONTACT_DIRECTORY.length);
    expect(list.textContent).not.toMatch(/\b0\d\b/);
  });
});
