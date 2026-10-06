/**
 * A FRAME WEARS ITS PANE'S THEME (lab-kit-2, from ROADMAP's line on the Specimen's split). The frame copied the lab
 * page's class list onto its `<html>` and its scene's ground, so the Library's Specimen, which draws a specimen twice
 * (one pane forced to `.surface-paper`, one to `.dark`), drew a frame's scene twice in the page's one theme, and a frame
 * on a light stage in a dark lab was dark. Every test here draws the real frame, in the real panes, and reads the class
 * the frame's own document wears.
 *
 * Each frame is handed a document of its own (the other frame tests stand one in front of every iframe): two frames in
 * one tree must not answer for each other.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Specimen } from "@/app/(dev)/design/gallery/specimen";

import { Frame } from "./frame";
import { frameClass } from "./frame-theme";

let docs: Map<HTMLIFrameElement, Document>;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  docs = new Map();
  vi.spyOn(
    HTMLIFrameElement.prototype,
    "contentDocument",
    "get",
  ).mockImplementation(function (this: HTMLIFrameElement) {
    let doc = docs.get(this);
    if (!doc) {
      doc = document.implementation.createHTMLDocument("committed");
      // A srcdoc that committed before hydration: the frame mounts at once.
      Object.defineProperty(doc, "URL", { value: "about:srcdoc" });
      docs.set(this, doc);
    }
    return doc;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.className = "";
});

/** The class each frame's own `<html>` wears, in document order. */
const roots = (container: HTMLElement) =>
  [...container.querySelectorAll("iframe")].map(
    (frame) => docs.get(frame)!.documentElement.className,
  );
/** The class each frame's scene ground wears, in document order. */
const grounds = (container: HTMLElement) =>
  [...container.querySelectorAll("iframe")].map(
    (frame) => docs.get(frame)!.querySelector("[data-lab-scene]")!.className,
  );

const scene = (id: string) => (
  <Frame id={id} w={400} h={300} title={id}>
    <p>the scene</p>
  </Frame>
);

describe("Frame: the theme it wears", () => {
  it("wears the page's class where no pane stands above it, as it always did", () => {
    document.documentElement.className = "font-vars dark";
    const { container } = render(scene("alone"));
    expect(roots(container)).toEqual(["font-vars dark"]);
    expect(grounds(container)).toEqual(["font-vars dark"]);
  });

  it("★ wears the nearest pane's ground, with the page's font variables, in a dark lab", () => {
    document.documentElement.className = "font-vars dark";
    const { container } = render(
      <div className="surface-paper">{scene("paper")}</div>,
    );
    expect(roots(container)).toEqual(["font-vars surface-paper"]);
    expect(grounds(container)).toEqual(["font-vars surface-paper"]);
  });

  it("★ wears a dark pane's ground in a light lab (next-themes' `light` goes with the page's theme)", () => {
    document.documentElement.className = "font-vars light";
    const { container } = render(<div className="dark">{scene("room")}</div>);
    expect(roots(container)).toEqual(["font-vars dark"]);
    expect(grounds(container)).toEqual(["font-vars dark"]);
  });

  it("takes the NEAREST ground when panes stand inside panes", () => {
    document.documentElement.className = "font-vars light";
    const { container } = render(
      <div className="dark">
        <div className="surface-paper">
          <div className="dark">{scene("inner")}</div>
        </div>
      </div>,
    );
    expect(roots(container)).toEqual(["font-vars dark"]);
    const paper = render(
      <div className="dark">
        <div className="surface-paper">{scene("inner")}</div>
      </div>,
    );
    expect(roots(paper.container)).toEqual(["font-vars surface-paper"]);
  });

  it("★ follows its pane while it is open, and the lab's own toggle leaves a pane's ground alone", async () => {
    document.documentElement.className = "font-vars dark";
    const { container } = render(
      <div className="surface-paper" data-testid="pane">
        {scene("live")}
      </div>,
    );
    expect(roots(container)).toEqual(["font-vars surface-paper"]);

    // A board changing its stage's ground writes the pane's class; the frame is re-skinned with it.
    await act(async () => {
      screen.getByTestId("pane").className = "dark";
    });
    expect(roots(container)).toEqual(["font-vars dark"]);

    // The page's own toggle is not the pane's: the frame stays in the room it stands in.
    await act(async () => {
      document.documentElement.className = "font-vars light";
    });
    expect(roots(container)).toEqual(["font-vars dark"]);
  });

  it("★ draws the Specimen's light and dark split once in each theme, in a dark lab", async () => {
    document.documentElement.className = "font-vars dark";
    const { container } = render(
      <Specimen label="A frame">{scene("split")}</Specimen>,
    );
    expect(roots(container)).toEqual(["font-vars dark"]);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /light and dark side by side/i }),
      );
    });
    // The light pane first, then the room: each scene on the ground of the pane it stands in.
    expect(roots(container)).toEqual([
      "font-vars surface-paper",
      "font-vars dark",
    ]);
    expect(grounds(container)).toEqual([
      "font-vars surface-paper",
      "font-vars dark",
    ]);
  });

  it("★ draws the Specimen's split once in each theme in a light lab too", async () => {
    document.documentElement.className = "font-vars light";
    const { container } = render(
      <Specimen label="A frame">{scene("split")}</Specimen>,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /light and dark side by side/i }),
      );
    });
    expect(roots(container)).toEqual([
      "font-vars surface-paper",
      "font-vars dark",
    ]);
  });
});

describe("frameClass", () => {
  it("is the page's class for no figure at all (the first render, before the frame is mounted)", () => {
    document.documentElement.className = "font-vars dark";
    expect(frameClass(null)).toBe("font-vars dark");
  });
});
