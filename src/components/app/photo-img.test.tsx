/**
 * A PHOTOGRAPH THIS BROWSER CANNOT DRAW IS NAMED WHEREVER IT IS DRAWN (crumbs-93, red-team 58's NIT): the album's tile
 * names an undecodable HEIC ("Can't show here / HEIC") but the stage's wall drew a broken image where the same photograph
 * stood. `PhotoImg` is the one `<img>` of the surfaces outside the tile, and it hands over to the tile's own stand-in.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TILE_STAND_IN } from "@/components/app/media-grid";

import { PhotoImg } from "./photo-img";

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
});
