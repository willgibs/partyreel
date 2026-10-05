import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadStackTile } from "@/components/guest/upload/stack-tile";

/**
 * THE ONE TILE THIS DEVICE DRAWS AT THE ALBUM'S HEAD: one stack per pick.
 *
 * FUNCTION ONLY. Nothing here reads an alpha, a blur or an offset: the scrim's
 * darkness and the ghost edges are free to retune without asking a test. What
 * is held is what the tile SAYS and the one structural rule it lives under —
 * the bright edge, because a photograph must not gain or lose an edge at the
 * moment it finishes uploading, and `lit-edge-contract.test.ts` holds the other
 * half of that from the closed list's side.
 *
 * ★ THE WAITING TILE'S THREE PINS LEFT WITH THE TILE (voice-guest r2, Will's
 * `held=uploads`: a held photograph shows only in her uploads). What they
 * guarded is gone from the product, not reshaped, so they were deleted rather
 * than retargeted; `live-gallery.test.tsx` pins that a held upload hands the
 * album's head nothing.
 */
const file = (name = "a.jpg") =>
  new File([new Uint8Array([1])], name, { type: "image/jpeg" });

describe("one pick is one object", () => {
  it("counts what is still to go when the pick holds several", () => {
    render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={9}
      />,
    );
    expect(screen.getByText("9 to go")).toBeInTheDocument();
  });

  it("says no count at all for a single file: a stack of one is a tile", () => {
    const { container } = render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={1}
      />,
    );
    expect(screen.queryByText(/to go/)).toBeNull();
    // And no ghost edges either: there is nothing behind it.
    expect(container.querySelectorAll("[aria-hidden]")).toHaveLength(0);
  });

  it("carries the CURRENT file's progress, because the queue runs one at a time", () => {
    const { container } = render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={42}
        remaining={3}
      />,
    );
    const bar = container.querySelector(
      "[data-pending-progress]",
    ) as HTMLElement;
    expect(bar.style.width).toBe("42%");
  });

  it("wears the album tile's bright edge", () => {
    const { container } = render(
      <UploadStackTile file={file()} url="blob:x" progress={1} remaining={1} />,
    );
    expect(
      container.querySelector("[data-media-tile][data-lit]"),
    ).not.toBeNull();
  });
});

describe("the x stops the file in the air (upload-cancel)", () => {
  it("is drawn only when the file can still be stopped, and says what it does", () => {
    const { container, rerender } = render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={1}
      />,
    );
    expect(container.querySelector("[data-stop-upload]")).toBeNull();
    rerender(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={1}
        onStop={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Stop upload" }),
    ).toBeInTheDocument();
  });

  it("only asks: a press calls the tile's handler once, and nothing is stopped here", () => {
    const onStop = vi.fn();
    render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={3}
        onStop={onStop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Stop upload" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("sits outside the photograph's own box, so the bar and the count still read", () => {
    const { container } = render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={20}
        remaining={3}
        onStop={() => {}}
      />,
    );
    const tile = container.querySelector("[data-media-tile]")!;
    expect(tile.contains(container.querySelector("[data-stop-upload]"))).toBe(
      false,
    );
    expect(screen.getByText("3 to go")).toBeInTheDocument();
  });
});
