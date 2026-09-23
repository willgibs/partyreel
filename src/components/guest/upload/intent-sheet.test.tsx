// @contract-for: src/components/guest/upload/intent-sheet.tsx
// @contract-for: src/components/guest/upload/review-step.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";

/**
 * THE ADD SHEET AND ITS REVIEW STEP (Will, `tap=sheet` + `warning=both`,
 * 2026-09-21: "allows us a custom visual design to support anything across
 * operating systems"; "It may be helpful to preview the photos before upload,
 * just to allow guests to catch an accidental selection").
 *
 * FUNCTION ONLY, and every rule below is one whose breakage is INVISIBLE in a
 * screenshot:
 *
 *  · `capture` on the camera input and not on the album one is the entire
 *    difference between the two rows. Lose it and both rows open the same
 *    chooser, which looks identical and is the option Will did not take.
 *  · `multiple` on the album input and not on the camera one: iOS ignores
 *    `multiple` under `capture` anyway, and a camera row that claims to take
 *    several is a promise the platform breaks.
 *  · Nothing may reach `onSend` that a guest removed, and nothing may reach it
 *    at all before Send — the review step exists for exactly that.
 *
 * The WORDS on the two rows and the shape of the tiles are Will's and are not
 * pinned. Nor is the synchronous `.click()` (Safari drops a picker opened after
 * an `await`): jsdom has no gesture model, so that one is held by the source
 * itself and by a real iPhone.
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
  it("mounts both inside the sheet", () => {
    open();
    const { camera, album } = inputs();
    expect(camera).not.toBeNull();
    expect(album).not.toBeNull();
    // Inside the sheet's own content, never parked on the page: a Radix dialog
    // aria-hidden's everything outside it, so an input out there is inert.
    const content = document.querySelector('[data-slot="sheet-content"]')!;
    expect(content.contains(camera!)).toBe(true);
    expect(content.contains(album!)).toBe(true);
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
    open();
    fireEvent.change(inputs().album!, { target: { files: [file("a.jpg")] } });
    fireEvent.click(screen.getByRole("button", { name: /Remove a\.jpg/ }));
    // Not "Send 0": there is nothing to review, so the sheet is what it was.
    expect(screen.queryByRole("button", { name: /^Send/ })).toBeNull();
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
    open();
    expect(document.querySelectorAll("[data-upload-terms]")).toHaveLength(1);
    fireEvent.change(inputs().album!, { target: { files: [file("a.jpg")] } });
    expect(document.querySelectorAll("[data-upload-terms]")).toHaveLength(1);
  });
});

/**
 * THE SHEET NEVER FLASHES THE TWO ROWS ON ITS OWN WAY OUT (the alias
 * red-team's POLISH item, 2026-09-21, captured in the pane at 375, 12:11
 * EDT). Send used to clear the picks in the same tick as the close call, so
 * the still-open (closing) sheet repainted "Take a photo / Choose from your
 * album" underneath itself for the rest of its own exit. The fix defers the
 * clear to the CONTENT's own animationend, which jsdom never fires on its
 * own - so a render straight after Send, with `open` still true (exactly the
 * moment the sheet is mid-exit in the real browser), is the whole test: the
 * review step must still be what is on screen.
 */
describe("the review step survives its own sheet closing", () => {
  it("after Send, with open still true, the review step is still what renders", () => {
    const onOpenChange = vi.fn();
    const onSend = vi.fn();
    render(
      <UploadIntentSheet
        open
        onOpenChange={onOpenChange}
        hostName="Maya"
        onSend={onSend}
      />,
    );
    const kept = file("kept.jpg");
    fireEvent.change(inputs().album!, { target: { files: [kept] } });
    expect(screen.getByRole("button", { name: "Send 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSend).toHaveBeenCalledWith([kept]);
    // The two intent rows must NOT be back - that is the flash the fix kills.
    expect(
      screen.queryByRole("button", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send 1" })).toBeInTheDocument();
  });
});
