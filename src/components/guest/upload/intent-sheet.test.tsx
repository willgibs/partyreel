import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";

/**
 * THE ADD CHOICE AND ITS REVIEW STEP. A choice of our own carries one design
 * across every operating system, and its review step lets a guest preview the
 * photos and catch an accidental selection before anything uploads.
 *
 * ★ RESHAPED ON PURPOSE BY `popups` r1 (`choices=menu`, 2026-09-27): the two
 * rows are a menu now (under the Add she pressed at a desk, at the thumb in a
 * hand) and the review is a confirmation of its own, so the scars moved with
 * them. Kept: capture on one input only, multiple on the other only, nothing
 * sent before Send or after a removal, two picks with one name kept apart, the
 * terms line on both steps, and no flash of the two rows under a closing
 * review. Dropped, with its expired reason: "the inputs live inside the sheet's
 * content" (a menu's content unmounts when its row closes it, so the inputs
 * moved to the page, where they outlive it; `intent-sheet.tsx` says why).
 *
 * FUNCTION ONLY, and every rule below is one whose breakage is INVISIBLE in a
 * screenshot:
 *
 *  · `capture` on the camera input and not on the album one is the entire
 *    difference between the two rows. Lose it and both rows open the same
 *    chooser, which looks identical and undoes the point of having two rows.
 *  · `multiple` on the album input and not on the camera one: iOS ignores
 *    `multiple` under `capture` anyway, and a camera row that claims to take
 *    several is a promise the platform breaks.
 *  · Nothing may reach `onSend` that a guest removed, and nothing may reach it
 *    at all before Send — the review step exists for exactly that.
 *
 * The WORDS on the two rows and the shape of the tiles are not pinned. Nor is
 * the synchronous `.click()` (Safari drops a picker opened after an `await`):
 * jsdom has no gesture model, so that one is held by the source itself and by a
 * real iPhone.
 */
const file = (name: string, type = "image/jpeg") =>
  new File([new Uint8Array([1])], name, { type });

const inputs = () => ({
  camera: document.querySelector(
    'input[type="file"][capture]',
  ) as HTMLInputElement | null,
  album: document.querySelector(
    'input[type="file"][multiple]',
  ) as HTMLInputElement | null,
});

function open(onSend = vi.fn()) {
  render(
    <UploadIntentSheet
      open
      onOpenChange={() => {}}
      hostName="Maya"
      onSend={onSend}
    />,
  );
  return { onSend };
}

describe("two inputs, and only one of them is the camera", () => {
  it("mounts both where they outlive the menu, and each row clicks its own", () => {
    open();
    const { camera, album } = inputs();
    expect(camera).not.toBeNull();
    expect(album).not.toBeNull();
    // Never inside the menu: its content unmounts when a row closes it, and an
    // input gone before the picker answers never fires `change`.
    const menu = document.querySelector('[data-slot^="responsive-menu"]')!;
    expect(menu).not.toBeNull();
    expect(menu.contains(camera!)).toBe(false);
    expect(menu.contains(album!)).toBe(false);

    const cameraClick = vi.spyOn(camera!, "click");
    fireEvent.click(screen.getByRole("menuitem", { name: /take a photo/i }));
    expect(cameraClick).toHaveBeenCalledTimes(1);
  });

  it("takes a photograph on the camera row: capture, no multiple", () => {
    open();
    const { camera } = inputs();
    expect(camera!.getAttribute("capture")).toBe("environment");
    expect(camera!.multiple).toBe(false);
    expect(camera!.accept).not.toContain("video");
  });

  it("takes both kinds, many at a time, on the album row: no capture", () => {
    open();
    const { album } = inputs();
    expect(album!.hasAttribute("capture")).toBe(false);
    expect(album!.multiple).toBe(true);
    expect(album!.accept).toContain("image/");
    expect(album!.accept).toContain("video/");
  });
});

describe("the review step stands between the picker and the album", () => {
  it("sends nothing until Send is tapped", () => {
    const { onSend } = open();
    fireEvent.change(inputs().album!, {
      target: { files: [file("a.jpg"), file("b.jpg")] },
    });
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send 2" })).toBeInTheDocument();
  });

  it("lists every pick, and a removed one never goes", () => {
    const { onSend } = open();
    const kept = file("kept.jpg");
    const oops = file("oops.jpg");
    fireEvent.change(inputs().album!, { target: { files: [kept, oops] } });

    expect(document.querySelectorAll("[data-review-picks] > li")).toHaveLength(
      2,
    );
    fireEvent.click(screen.getByRole("button", { name: /Remove oops\.jpg/ }));
    expect(document.querySelectorAll("[data-review-picks] > li")).toHaveLength(
      1,
    );

    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    expect(onSend).toHaveBeenCalledWith([kept]);
  });

  it("goes back to the two rows when the last pick is removed", () => {
    const onOpenChange = vi.fn();
    render(
      <UploadIntentSheet
        open={false}
        onOpenChange={onOpenChange}
        hostName="Maya"
        onSend={vi.fn()}
      />,
    );
    fireEvent.change(inputs().album!, { target: { files: [file("a.jpg")] } });
    fireEvent.click(screen.getByRole("button", { name: /Remove a\.jpg/ }));
    // Not "Send 0": there is nothing to review, so the choice is asked again.
    expect(screen.queryByRole("button", { name: /^Send/ })).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(inputs().album).not.toBeNull();
  });

  it("keeps two picks apart when they share a name", () => {
    // A camera roll hands back duplicates constantly, and a File is not a key.
    const { onSend } = open();
    const a = file("IMG_0001.jpg");
    const b = file("IMG_0001.jpg");
    fireEvent.change(inputs().album!, { target: { files: [a, b] } });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Remove IMG_0001\.jpg/ })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    expect(onSend).toHaveBeenCalledWith([b]);
  });
});

describe("the terms line", () => {
  it("stands on the pick step and again under Send", () => {
    const props = { hostName: "Maya", onOpenChange: () => {}, onSend: vi.fn() };
    const { rerender } = render(<UploadIntentSheet open {...props} />);
    expect(document.querySelectorAll("[data-upload-terms]")).toHaveLength(1);
    // A row's tap closes the menu as it opens the picker; the review follows.
    rerender(<UploadIntentSheet open={false} {...props} />);
    fireEvent.change(inputs().album!, { target: { files: [file("a.jpg")] } });
    expect(document.querySelectorAll("[data-upload-terms]")).toHaveLength(1);
  });
});

/**
 * THE REVIEW NEVER FLASHES THE TWO ROWS ON ITS WAY OUT. The rows were once the
 * same sheet's other step, so clearing the picks with the close repainted them
 * under a closing sheet; now they are a separate menu that Send never reopens,
 * and the picks clear only on the review's own animationend. So after Send the
 * rows stay shut (the menu was closed by the row that picked) and the files
 * went, once.
 */
describe("the review closes without the two rows", () => {
  it("after Send, the files go and the rows are not asked again", () => {
    const onOpenChange = vi.fn();
    const onSend = vi.fn();
    render(
      <UploadIntentSheet
        open={false}
        onOpenChange={onOpenChange}
        hostName="Maya"
        onSend={onSend}
      />,
    );
    const kept = file("kept.jpg");
    fireEvent.change(inputs().album!, { target: { files: [kept] } });
    expect(screen.getByRole("button", { name: "Send 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith([kept]);
    expect(onOpenChange).not.toHaveBeenCalledWith(true);
    expect(
      screen.queryByRole("menuitem", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
  });
});
