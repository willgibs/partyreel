/**
 * A PHOTOGRAPH THAT IS ALREADY THERE SHOWS AT ONCE, AND ONE THAT LANDS LATER FADES IN (crumbs-18: the album's
 * `arrival=push`, "Nothing fades; it reads as inserted", with the glow the one thing that does).
 *
 * `MediaTile` fades a photograph in over 300ms so a presigned image never pops in. It used to run that fade
 * on a photograph that was complete when its `<img>` mounted too: the "is it complete?" read sat in a passive
 * effect, so the tile painted transparent for a frame, then flipped, then faded. A pushed arrival, whose
 * stills the stage has decoded before its row opens, therefore wiped in over a photograph fading in.
 *
 * jsdom loads no images, so `complete` is stood in for by the prototype's getter: a photograph in the
 * browser's memory cache answers true at the moment its element is created (the HTML spec's "list of
 * available images"), which is the case being pinned. What is pinned is what the fade rides on: the
 * shimmer's `data-done` (the photograph is showing) and the image's `data-instant` (it switched no
 * transition on to get there).
 */
import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MediaTile } from "@/components/app/media-grid";

const realComplete = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  "complete",
)!;

/** What `img.complete` answers for every image in the test: a photograph the browser already holds, or one still on its way. */
function complete(answer: boolean) {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => answer,
  });
}

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", realComplete);
});

const PHOTO = { type: "photo" as const, url: "https://r2.test/p1.jpg" };
const shimmerOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="skeleton"]')!;
const imgOf = (container: HTMLElement) => container.querySelector("img")!;

describe("MediaTile's fade", () => {
  it("★ shows a photograph that was already complete when it mounted at once, with no fade to run", () => {
    complete(true);
    const { container } = render(<MediaTile item={PHOTO} />);
    // Showing (the shimmer has left), in the commit the mount made, and no transition to fade it in.
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    expect(imgOf(container)).toHaveAttribute("data-instant");
  });

  it("★ fades in a photograph that lands after the tile mounted", () => {
    complete(false);
    const { container } = render(<MediaTile item={PHOTO} />);
    const img = imgOf(container);
    expect(shimmerOf(container)).not.toHaveAttribute("data-done");
    expect(img).not.toHaveAttribute("data-instant");

    fireEvent.load(img);
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    // It landed late: the transition that fades it in stays on.
    expect(img).not.toHaveAttribute("data-instant");
  });

  it("keeps a photograph shown at once shown when its load event arrives after", () => {
    // A cached image still fires `load`, a task after it mounted: that must not put a fade back on it.
    complete(true);
    const { container } = render(<MediaTile item={PHOTO} />);
    fireEvent.load(imgOf(container));
    expect(imgOf(container)).toHaveAttribute("data-instant");
    expect(shimmerOf(container)).toHaveAttribute("data-done");
  });

  it("★ reads a preview poster the same way: a video's still already there shows at once", () => {
    complete(true);
    const { container } = render(
      <MediaTile
        item={{
          type: "video",
          url: "https://r2.test/v1.mp4",
          previewUrl: "https://r2.test/v1-preview.webp",
        }}
      />,
    );
    expect(imgOf(container)).toHaveAttribute("data-instant");
    expect(shimmerOf(container)).toHaveAttribute("data-done");
  });

  it("★ a photograph whose link lands after the tile mounted is read when its <img> arrives", () => {
    // The paged album mints links per window, so a tile can mount a beat before its link: the image
    // element arrives later, and one the browser already holds is there at once too.
    complete(true);
    const { container, rerender } = render(
      <MediaTile item={{ type: "photo", url: "" }} />,
    );
    expect(container.querySelector("img")).toBeNull();
    rerender(<MediaTile item={PHOTO} />);
    expect(imgOf(container)).toHaveAttribute("data-instant");
    expect(shimmerOf(container)).toHaveAttribute("data-done");
  });

  it("fades in the next photograph when the tile is handed a different one", () => {
    complete(true);
    const { container, rerender } = render(<MediaTile item={PHOTO} />);
    expect(imgOf(container)).toHaveAttribute("data-instant");
    // A different stored object under the same tile is a photograph landing after mount.
    complete(false);
    rerender(
      <MediaTile item={{ type: "photo", url: "https://r2.test/p2.jpg" }} />,
    );
    expect(imgOf(container)).not.toHaveAttribute("data-instant");
    expect(shimmerOf(container)).not.toHaveAttribute("data-done");
    fireEvent.load(imgOf(container));
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    expect(imgOf(container)).not.toHaveAttribute("data-instant");
  });
});
