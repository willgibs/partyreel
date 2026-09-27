import { describe, expect, it } from "vitest";

import { isDesk, opensModal, type DoorPress, type Screen } from "./opens";

/**
 * THE RULE EVERY DEMO DOOR FOLLOWS: a plain press at a desk opens the modal,
 * and every other press is the link's (the demo in a new tab). What fails here
 * fails quietly on the real site: a phone that opens a code to scan with
 * itself, or a Cmd-click that cannot open the demo in a tab of its own.
 */

const PLAIN: DoorPress = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

const DESK: Screen = { desk: true, coarse: false };
const PHONE: Screen = { desk: false, coarse: true };
/** A phone on its side, or a tablet: past 640, with a finger for a pointer. */
const TOUCH_WIDE: Screen = { desk: true, coarse: true };
/** A narrow window on a laptop: a mouse, under 640. */
const NARROW_DESK: Screen = { desk: false, coarse: false };

describe("a demo door's press", () => {
  it("opens the modal on a plain press at a desk", () => {
    expect(opensModal(PLAIN, DESK)).toBe(true);
  });

  it("leaves the press to the link on a phone, a tablet and a narrow window", () => {
    expect(opensModal(PLAIN, PHONE)).toBe(false);
    expect(opensModal(PLAIN, TOUCH_WIDE)).toBe(false);
    expect(opensModal(PLAIN, NARROW_DESK)).toBe(false);
  });

  it("leaves every modified or secondary press to the browser, even at a desk", () => {
    for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(opensModal({ ...PLAIN, [key]: true }, DESK), key).toBe(false);
    }
    expect(opensModal({ ...PLAIN, button: 1 }, DESK), "middle").toBe(false);
  });

  it("never takes back a press something upstream already claimed", () => {
    expect(opensModal({ ...PLAIN, defaultPrevented: true }, DESK)).toBe(false);
  });

  it("reads a desk as a width and a pointer together", () => {
    expect(isDesk(DESK)).toBe(true);
    expect(isDesk(TOUCH_WIDE)).toBe(false);
    expect(isDesk(NARROW_DESK)).toBe(false);
  });
});
