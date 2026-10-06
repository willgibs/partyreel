/**
 * THE HELD DOOR'S WAIT ON A CAMERA ALBUM TAKES ITS SHOTS WITH THE ALBUM'S CAMERA (crumbs-83; the ROADMAP's "the held
 * door's wait chooser (`door/wait-picks.tsx`) still offers the photo library on a camera album, so a library photo can
 * wait for the roll; offer the album's camera there, as the door's step now does").
 *
 * With `camera` the chooser is no picker at all: one primary opens the album's camera, and once something waits, Take
 * another opens it again; the shots live in the tab (the device keeps a choice, never the camera's shots), so the door
 * says to keep it open. Without it the chooser is the picker it always was. The door's wiring (the held door hands the
 * chooser the door's own camera) is `entry-modal.test.tsx`'s.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WaitPicks, type WaitPick } from "./wait-picks";

const shot = (n: number): WaitPick => ({
  id: `q${n}`,
  file: new File([new Uint8Array([n])], `shot-${n}.jpg`, {
    type: "image/jpeg",
  }),
  kind: "photo",
  status: "queued",
  progress: 0,
});

describe("on a camera album", () => {
  it("★ offers the album's camera and no picker of any kind: the library is not a way in", () => {
    const onOpen = vi.fn();
    const { container } = render(<WaitPicks picks={[]} camera={{ onOpen }} />);
    // The old chooser drew its picker here on every album.
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Choose what you’ll add" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Take a photo" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Nothing is sent until you’re let in."),
    ).toBeTruthy();
  });

  it("once shots wait, Take another opens the camera again, and the tab is named: they live in it alone", () => {
    const onOpen = vi.fn();
    render(<WaitPicks picks={[shot(1), shot(2)]} camera={{ onOpen }} />);
    expect(screen.getByText(/2 photos ready/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Change" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Take another" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Keep this tab open/)).toBeTruthy();
  });
});

describe("on an album that takes uploads", () => {
  it("is the picker it always was: one input, Choose what you'll add, and a Change once chosen", () => {
    const onPick = vi.fn();
    const { container, rerender } = render(
      <WaitPicks picks={[]} onPick={onPick} acceptsVideo={false} />,
    );
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input?.accept).toBe("image/*");
    expect(
      screen.getByRole("button", { name: "Choose what you’ll add" }),
    ).toBeTruthy();
    const files = [shot(1).file];
    fireEvent.change(input!, { target: { files } });
    expect(onPick).toHaveBeenCalledWith(files);

    rerender(<WaitPicks picks={[shot(1)]} onPick={onPick} kept />);
    expect(screen.getByRole("button", { name: "Change" })).toBeTruthy();
    expect(screen.queryByText(/Keep this tab open/)).toBeNull();
  });
});
