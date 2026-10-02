/**
 * THE DOORWAY (`locked-door` r2, Will's `family=doorway` and `shape=shared`): one drawing for every door,
 * its leaf the state. Pinned here is what the drawing must never do whoever draws it: wear the album's
 * light or show its photographs anywhere it was not handed them, show a photograph through a door that
 * is not open, or draw a leaf and a light on a link that opens nothing. Looks stay open.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DoorColumn, DoorWords } from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { HOUSE_HUES } from "@/lib/guest/door-light";

afterEach(cleanup);

const way = (root: HTMLElement) => root.querySelector("[data-door-way]");
const PHOTOS = [
  "/p/1.webp",
  "/p/2.webp",
  "/p/3.webp",
  "/p/4.webp",
  "/p/5.webp",
];

describe("the doorway", () => {
  it("draws its state on its leaf, in the house five unless it is handed the album's light", () => {
    for (const state of ["open", "ajar", "shut"] as const) {
      const { container } = render(<Doorway state={state} />);
      expect(way(container)?.getAttribute("data-door-way")).toBe(state);
      expect(way(container)?.getAttribute("data-door-hues")).toBe(
        HOUSE_HUES.slice(0, 3).join(","),
      );
      expect(container.querySelector(".door-way-leaf")).not.toBeNull();
      expect(container.querySelector(".door-way-sill")).not.toBeNull();
      cleanup();
    }
  });

  it("wears the hues it is handed, and says them", () => {
    const { container } = render(
      <Doorway state="open" hues={[12.4, 140, 222.6, 300]} />,
    );
    expect(way(container)?.getAttribute("data-door-hues")).toBe("12,140,223");
  });

  it("★ shows the album only through an OPEN door, and never more than four of it", () => {
    const { container } = render(<Doorway state="open" photos={PHOTOS} />);
    const srcs = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src"),
    );
    expect(srcs).toEqual(PHOTOS.slice(0, 4));
    cleanup();
    for (const state of ["ajar", "shut", "none"] as const) {
      const { container: c } = render(
        <Doorway state={state} photos={PHOTOS} />,
      );
      expect(c.querySelector("img")).toBeNull();
      cleanup();
    }
  });

  it("is decoration: hidden from assistive tech, the words beside it say what it shows", () => {
    const { container } = render(<Doorway state="shut" />);
    expect(way(container)?.getAttribute("aria-hidden")).toBe("true");
  });

  it("★ a link that opens nothing is an empty frame: no leaf, no room, no light", () => {
    const { container } = render(<Doorway state="none" />);
    expect(way(container)?.getAttribute("data-door-way")).toBe("none");
    expect(way(container)?.hasAttribute("data-door-hues")).toBe(false);
    expect(container.querySelector(".door-way-leaf")).toBeNull();
    expect(container.querySelector(".door-way-room")).toBeNull();
    expect(container.querySelector(".door-way-sill")).toBeNull();
  });
});

describe("the door's words", () => {
  it("stand under the doorway: the headline and its lines read as one message", () => {
    render(
      <DoorColumn doorway={<Doorway state="shut" />}>
        <DoorWords
          eyebrow="Event link"
          title="This event link didn't work"
          titleAs="h1"
          lines={["The link may be mistyped."]}
        />
      </DoorColumn>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("This event link didn't work");
    // The line is the headline's own sibling, after it, so the message is one box.
    expect(heading.nextElementSibling?.textContent).toBe(
      "The link may be mistyped.",
    );
    // Every line rises in the door's text reveal, in order.
    const lines = [
      ...document.querySelectorAll<HTMLElement>("[data-door-line]"),
    ];
    expect(lines.map((l) => l.style.getPropertyValue("--door-line-i"))).toEqual(
      ["0", "1", "2"],
    );
  });
});
