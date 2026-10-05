import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Nav } from "@/app/(dev)/design/_data/catalog";

/**
 * A TOOL'S NOTE KEEPS A NAME IN ONE PIECE (crumbs-79). The index draws each note from the nav in a narrow card, where
 * a line broke after the `?` of `?boundary=global` (a `?` and a `-` are both places a browser may break) and stranded
 * half of a name from the other. Every run of the note with a `?` or a `-` inside it is held in one piece, and every
 * other word wraps as it always did. jsdom has no layout, so what is held here is the markup that does it (the
 * `whitespace-nowrap` runs) and that the note still reads whole, in its order.
 */
const NOTE =
  "Throws on render, on purpose: bare reaches the root boundary, ?boundary=global reaches global-error.";

const NAV = vi.hoisted<Nav>(() => [
  {
    id: "lab",
    label: "Lab",
    href: "/design/lab",
    blurb: "",
    sections: [
      {
        id: "tools",
        label: "Tools",
        items: [
          {
            href: "/design/lab/tools/boom",
            label: "Error boundary",
            badge: "tool",
            note: "Throws on render, on purpose: bare reaches the root boundary, ?boundary=global reaches global-error.",
          },
          {
            href: "/design/lab/tools/motion",
            label: "Motion tuner",
            badge: "tool",
            note: "The live knobs behind every animated surface, with replayable specimens.",
          },
        ],
      },
    ],
  },
]);

vi.mock("@/app/(dev)/design/(shell)/_shell/shell-context", () => ({
  useNav: () => NAV,
  LabLink: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const { ToolsIndex } = await import("./tools-index");

describe("the tools index's notes", () => {
  it("holds a ?query and a hyphenated name in one piece, and wraps every other word as ever", () => {
    const { container } = render(<ToolsIndex />);
    // Inside the notes only: the badge beside a label is nowrap too.
    const held = [
      ...container.querySelectorAll(".leading-relaxed .whitespace-nowrap"),
    ].map((el) => el.textContent);
    // The boundary probe's two names, and nothing from the plain note beside it.
    expect(held).toEqual(["?boundary=global", "global-error."]);
  });

  it("reads each note whole, in its order", () => {
    const { container } = render(<ToolsIndex />);
    expect(container.textContent).toContain(NOTE);
    expect(container.textContent).toContain(
      "The live knobs behind every animated surface, with replayable specimens.",
    );
  });
});
