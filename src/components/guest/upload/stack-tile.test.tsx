// @contract-for: src/components/guest/upload/stack-tile.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  UploadStackTile,
  WaitingTile,
} from "@/components/guest/upload/stack-tile";

/**
 * THE TWO TILES THIS DEVICE DRAWS AT THE ALBUM'S HEAD (`batch=one` and
 * `held=tile`, Will 2026-09-21).
 *
 * FUNCTION ONLY. Nothing here reads an alpha, a blur or an offset: the scrim's
 * darkness and the ghost edges are Will's and he retunes them without asking a
 * test. What is held is what each tile SAYS and the one structural rule both
 * live under — the bright edge, because a photograph must not gain or lose an
 * edge at the moment it finishes uploading, and `lit-edge-contract.test.ts`
 * holds the other half of that from the closed list's side.
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

describe("a held photograph waits in place", () => {
  it("says what it is waiting for, and offers nothing to press", () => {
    render(<WaitingTile file={file()} url="blob:x" />);
    expect(screen.getByText("Waiting for the host")).toBeInTheDocument();
    // "Clean, no button": there is nothing a guest can do about a host's queue,
    // and a control that does nothing is worse than none.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("wears the album tile's bright edge too", () => {
    const { container } = render(<WaitingTile file={file()} url="blob:x" />);
    expect(
      container.querySelector("[data-media-tile][data-lit]"),
    ).not.toBeNull();
  });

  it("draws no progress: its bytes are already in", () => {
    const { container } = render(<WaitingTile file={file()} url="blob:x" />);
    expect(container.querySelector("[data-pending-progress]")).toBeNull();
  });
});
