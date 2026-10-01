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

/**
 * ★ HER OWN UPLOAD LANDS ONCE (crumbs-32, from `crumbs-23`'s unmeasured line). A guest's own upload draws its object
 * URL until its link lands, then the presigned preview, and `sameObject` is false across the two, so the tile ran its
 * landing again: measured in a local walk, the link landed 494 ms after her photograph appeared, the tile sat on the
 * shimmer for the 344 ms the preview took, then faded in a second time. An object URL is this device's own picture of
 * the photograph its link now serves, so a tile already showing it takes the link in place (the browser keeps drawing
 * what it has until the new address is ready); one still waiting on it takes the link as any new photograph.
 */
describe("MediaTile and her own upload", () => {
  const OWN = { type: "photo" as const, url: "blob:http://localhost:3131/f1" };
  const LINKED = {
    type: "photo" as const,
    url: "https://r2.test/p1/original.jpg?X-Amz-Signature=a",
    previewUrl: "https://r2.test/p1/preview.webp?X-Amz-Signature=a",
  };

  it("★ swaps her object URL for the photograph's link in place, the landing not run again", () => {
    complete(true);
    const { container, rerender } = render(<MediaTile item={OWN} />);
    expect(imgOf(container)).toHaveAttribute("data-instant");

    // Her link lands; the preview is not in the browser yet.
    complete(false);
    rerender(<MediaTile item={LINKED} />);
    expect(imgOf(container)).toHaveAttribute("src", LINKED.previewUrl);
    // Still showing, with no transition switched on: no shimmer, no second fade.
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    expect(imgOf(container)).toHaveAttribute("data-instant");
    fireEvent.load(imgOf(container));
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    expect(imgOf(container)).toHaveAttribute("data-instant");
  });

  it("★ the re-key mounts a fresh tile on the same object URL and shows it at once (build 34's LOOK, measured not to fade)", () => {
    // At approved completion the album's tile replaces the in-flight stack tile: a NEW <img> on the very object
    // URL the stack tile just drew. The browser holds that picture, so the element answers `complete` the moment it
    // exists (measured in a visible Chrome with the stack tile leaving 0 to 3 s before the tile mounted, and in a
    // hidden tab: `data-instant` in the mount's own commit, opacity 1 on the first frame), and the tile shows it
    // with no fade. Pinned so a change to the landing cannot make it start fading.
    complete(true);
    const first = render(<MediaTile item={OWN} />);
    first.unmount();
    const { container } = render(<MediaTile item={OWN} />);
    expect(imgOf(container)).toHaveAttribute("src", OWN.url);
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    expect(imgOf(container)).toHaveAttribute("data-instant");
  });

  it("keeps a fade it already ran: an own photograph that faded in is not faded again", () => {
    complete(false);
    const { container, rerender } = render(<MediaTile item={OWN} />);
    fireEvent.load(imgOf(container));
    expect(shimmerOf(container)).toHaveAttribute("data-done");
    rerender(<MediaTile item={LINKED} />);
    expect(imgOf(container)).toHaveAttribute("src", LINKED.previewUrl);
    expect(shimmerOf(container)).toHaveAttribute("data-done");
  });

  it("takes the link as any new photograph while her object URL is still on its way", () => {
    complete(false);
    const { container, rerender } = render(<MediaTile item={OWN} />);
    rerender(<MediaTile item={LINKED} />);
    expect(imgOf(container)).toHaveAttribute("src", LINKED.previewUrl);
    expect(shimmerOf(container)).not.toHaveAttribute("data-done");
    fireEvent.load(imgOf(container));
    expect(shimmerOf(container)).toHaveAttribute("data-done");
  });
});
