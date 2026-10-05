import { render, screen } from "@testing-library/react";
import { Dialog } from "radix-ui";
import { describe, expect, it } from "vitest";

import { DoorHeading } from "@/components/guest/door/heading";

/**
 * THE DOOR'S ONE HEADING, as every guest sheet wears it. Pinned: its lines reveal in the order they read (the eyebrow
 * first), `hidden` leaves the words to a sheet that says them itself, and `announce` makes them the dialog's own title
 * and description (one node each, named by Radix), which is how the upload failure sheet wears it.
 */
const line = (el: HTMLElement) => el.style.getPropertyValue("--door-line-i");

describe("DoorHeading", () => {
  it("reveals its lines in the order they read: the eyebrow, the title, the reason", () => {
    render(
      <DoorHeading
        eyebrow="Almost in"
        title="Add your photos"
        reason="One more go."
      />,
    );
    expect([
      line(screen.getByText("Almost in")),
      line(screen.getByText("Add your photos")),
      line(screen.getByText("One more go.")),
    ]).toEqual(["0", "1", "2"]);
  });

  it("starts at the title where there is no eyebrow, and draws no reason where there is none", () => {
    const { container } = render(<DoorHeading title="Add your photos" />);
    expect(line(screen.getByText("Add your photos"))).toBe("0");
    expect(container.querySelectorAll("[data-door-line]")).toHaveLength(1);
  });

  it("keeps the id a field's helper line asks for on the reason", () => {
    render(
      <DoorHeading
        title="Check your email"
        reason="We sent a code."
        reasonId="why"
      />,
    );
    expect(screen.getByText("We sent a code.")).toHaveAttribute("id", "why");
  });

  it("is hidden from a screen reader where its sheet says the same words itself", () => {
    const { container } = render(
      <DoorHeading hidden title="Add your photos" />,
    );
    expect(container.querySelector("[data-door-heading]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  describe("announce", () => {
    const inDialog = (heading: React.ReactNode) =>
      render(
        <Dialog.Root open>
          <Dialog.Content>{heading}</Dialog.Content>
        </Dialog.Root>,
      );

    it("★ makes its words the dialog's title and its description, once each, and hides nothing", () => {
      inDialog(
        <DoorHeading
          announce
          title="2 of 3 didn't upload"
          reason="Everything else is in the album."
        />,
      );
      const dialog = screen.getByRole("dialog", {
        name: "2 of 3 didn't upload",
      });
      expect(dialog).toHaveAccessibleDescription(
        "Everything else is in the album.",
      );
      expect(screen.getAllByText("2 of 3 didn't upload")).toHaveLength(1);
      expect(document.querySelector("[data-door-heading]")).not.toHaveAttribute(
        "aria-hidden",
      );
      // Still the door's heading: its lines carry their reveal.
      expect(screen.getByText("2 of 3 didn't upload")).toHaveAttribute(
        "data-door-line",
      );
    });

    it("names the dialog alone where there is no reason (the caller opts the description out)", () => {
      render(
        <Dialog.Root open>
          <Dialog.Content aria-describedby={undefined}>
            <DoorHeading announce title="1 of 1 didn't upload" />
          </Dialog.Content>
        </Dialog.Root>,
      );
      const dialog = screen.getByRole("dialog", {
        name: "1 of 1 didn't upload",
      });
      expect(dialog).not.toHaveAttribute("aria-describedby");
    });
  });
});
