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

/**
 * ★ THE SEND STANDS BY WHERE IT IS (no-signal r1, Will's `drop=standby`): the line dropped, so the photograph stays and
 * the bar gives way to Standby's point and "No connection", the promise in a few words under it; the x still stops it,
 * and a press on the photograph opens what waits.
 */
describe("the send standing by for the line", () => {
  it("★ says the state and its promise in the bar's place, with no bar and no count but a spoken one", () => {
    const { container } = render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={38}
        remaining={3}
        standby={{ note: "Kept on this phone" }}
      />,
    );
    const pane = screen.getByRole("status");
    expect(pane).toHaveTextContent("No connection");
    expect(pane).toHaveTextContent("Kept on this phone");
    expect(pane).toHaveTextContent(", 3 waiting");
    expect(pane.querySelector("[data-wait-point]")).not.toBeNull();
    // A photograph goes again from the start: no bar held at 38%, and no "to go" beside a send going nowhere.
    expect(container.querySelector("[data-pending-progress]")).toBeNull();
    expect(screen.queryByText(/to go/)).toBeNull();
    // The bright edge is the album's still: the photograph neither gains nor loses one for the wait.
    expect(
      container.querySelector("[data-media-tile][data-lit]"),
    ).not.toBeNull();
  });

  it("★ keeps the x, and a press on the photograph opens what waits; nothing opens by itself", () => {
    const onStop = vi.fn();
    const onOpenWaits = vi.fn();
    render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={0}
        remaining={1}
        onStop={onStop}
        standby={{ note: "Keep this page open" }}
        onOpenWaits={onOpenWaits}
      />,
    );
    expect(onOpenWaits).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "See what waits for your connection",
      }),
    );
    expect(onOpenWaits).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Stop upload" }));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Keep this page open")).toBeInTheDocument();
  });

  it("offers no press on a photograph that is going: the stack is a picture, as ever", () => {
    render(
      <UploadStackTile
        file={file()}
        url="blob:x"
        progress={40}
        remaining={1}
        onOpenWaits={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", {
        name: "See what waits for your connection",
      }),
    ).toBeNull();
  });
});
