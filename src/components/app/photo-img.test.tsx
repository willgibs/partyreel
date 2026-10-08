/**
 * A PHOTOGRAPH THIS BROWSER CANNOT DRAW IS NAMED WHEREVER IT IS DRAWN (crumbs-93, red-team 58's NIT): the album's tile
 * names an undecodable HEIC ("Can't show here / HEIC") but the stage's wall drew a broken image where the same photograph
 * stood. `PhotoImg` is the one `<img>` of the surfaces outside the tile, and it hands over to the tile's own stand-in.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { TILE_STAND_IN } from "@/components/app/media-grid";

import { PhotoImg } from "./photo-img";

const real = {
  complete: Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "complete",
  )!,
  naturalWidth: Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "naturalWidth",
  )!,
};

/**
 * What the browser says of every image in the test the moment it is attached: a photograph still on its way
 * (`complete` false), one it holds whole (`complete`, with a width), or one that already failed (`complete`, with none:
 * `complete` is true for a broken image too).
 */
function attached(state: { complete: boolean; naturalWidth: number }) {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => state.complete,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => state.naturalWidth,
  });
}

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", real.complete);
  Object.defineProperty(
    HTMLImageElement.prototype,
    "naturalWidth",
    real.naturalWidth,
  );
});

const HEIC =
  "https://r2.test/events/e1/photo/p1/original.heic?X-Amz-Signature=abc";
const JPG =
  "https://r2.test/events/e1/photo/p2/preview.webp?X-Amz-Signature=def";

describe("PhotoImg", () => {
  it("is the image it was given, in the classes it was given, until the browser says it cannot draw it", () => {
    const { container } = render(
      <PhotoImg
        src={JPG}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />,
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", JPG);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveClass("absolute", "inset-0", "size-full");
    expect(container.querySelector("[data-photo-stand-in]")).toBeNull();
  });

  it("★ names a photograph that will not draw, with its format, in the very box the image filled", () => {
    const { container } = render(
      <PhotoImg src={HEIC} className="absolute inset-0 size-full" />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    const standIn = container.querySelector("[data-photo-stand-in]")!;
    expect(standIn).toHaveClass("absolute", "inset-0", "size-full");
    expect(standIn).toHaveTextContent(TILE_STAND_IN);
    expect(standIn).toHaveTextContent("HEIC");
    expect(
      standIn.querySelector("[data-tile-stand-in='photo']"),
    ).not.toBeNull();
  });

  it("names a file that will not draw without a format of its own as just that: a format every browser draws is never the reason", () => {
    const { container } = render(<PhotoImg src={JPG} className="size-full" />);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText(TILE_STAND_IN)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/HEIC|WebP/);
  });

  it("★ asks again for a different photograph: the next still, a rolled link", () => {
    const { container, rerender } = render(
      <PhotoImg src={HEIC} className="size-full" />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("[data-photo-stand-in]")).not.toBeNull();
    rerender(<PhotoImg src={JPG} className="size-full" />);
    expect(container.querySelector("[data-photo-stand-in]")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", JPG);
  });
  it("★ names a photograph that failed before React listened: attached `complete` with no width, no `error` ever heard (crumbs-94, red-team 58b)", () => {
    attached({ complete: true, naturalWidth: 0 });
    const { container } = render(
      <PhotoImg src={HEIC} className="absolute inset-0 size-full" />,
    );
    expect(container.querySelector("img")).toBeNull();
    const standIn = container.querySelector("[data-photo-stand-in]")!;
    expect(standIn).toHaveClass("absolute", "inset-0", "size-full");
    expect(standIn).toHaveTextContent(TILE_STAND_IN);
    expect(standIn).toHaveTextContent("HEIC");
  });

  it("★ the same on a page the server drew: its HTML names the image, the browser fails it from the cache before hydration, and the first paint after is the stand-in", () => {
    const html = renderToString(
      <PhotoImg src={HEIC} className="absolute inset-0 size-full" />,
    );
    expect(html).toContain("<img");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    attached({ complete: true, naturalWidth: 0 });
    let root!: ReturnType<typeof hydrateRoot>;
    act(() => {
      root = hydrateRoot(
        container,
        <PhotoImg src={HEIC} className="absolute inset-0 size-full" />,
      );
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-photo-stand-in]")).toHaveTextContent(
      TILE_STAND_IN,
    );
    act(() => root.unmount());
    container.remove();
  });

  it("an image the browser holds whole is the image, and one still on its way is too, until it says it cannot draw it", () => {
    attached({ complete: true, naturalWidth: 640 });
    const whole = render(<PhotoImg src={JPG} className="size-full" />);
    expect(whole.container.querySelector("img")).toBeInTheDocument();
    expect(whole.container.querySelector("[data-photo-stand-in]")).toBeNull();
    whole.unmount();

    attached({ complete: false, naturalWidth: 0 });
    const onItsWay = render(<PhotoImg src={HEIC} className="size-full" />);
    expect(onItsWay.container.querySelector("img")).toBeInTheDocument();
    expect(
      onItsWay.container.querySelector("[data-photo-stand-in]"),
    ).toBeNull();
    fireEvent.error(onItsWay.container.querySelector("img")!);
    expect(
      onItsWay.container.querySelector("[data-photo-stand-in]"),
    ).not.toBeNull();
  });

  it("★ a different photograph under a stand-in is read afresh by the same read: the next one that draws is the image", () => {
    attached({ complete: true, naturalWidth: 0 });
    const { container, rerender } = render(
      <PhotoImg src={HEIC} className="size-full" />,
    );
    expect(container.querySelector("[data-photo-stand-in]")).not.toBeNull();
    attached({ complete: true, naturalWidth: 640 });
    rerender(<PhotoImg src={JPG} className="size-full" />);
    expect(container.querySelector("[data-photo-stand-in]")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", JPG);
  });
});
