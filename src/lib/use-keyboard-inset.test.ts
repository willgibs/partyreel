import { describe, expect, it } from "vitest";

import { KEYBOARD_MIN_PX, readKeyboard } from "@/lib/use-keyboard-inset";

/**
 * THE KEYBOARD INSET, AS A PURE FUNCTION. Every reading here is a phone the door meets: an iPhone
 * SE's 667px layout viewport with the keyboard closed, open, panned by iOS and stale after iOS 26
 * closes it, and Android both ways. The sheet stands on `inset`; `open` switches its foot.
 */
const SE = { innerHeight: 667, restHeight: 667 };

describe("readKeyboard", () => {
  it("closed: no field focused is no inset at all, whatever the viewport says", () => {
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 667,
        vvOffsetTop: 0,
        fieldFocused: false,
      }),
    ).toEqual({ inset: 0, open: false });
    // A pinch-zoomed page shrinks the visual viewport too, and must never move a sheet.
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 300,
        vvOffsetTop: 120,
        fieldFocused: false,
      }),
    ).toEqual({ inset: 0, open: false });
  });

  it("focused, before the keyboard lands: nothing hidden yet, nothing lifted", () => {
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 667,
        vvOffsetTop: 0,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 0, open: false });
  });

  it("open: the lift is exactly what the keyboard hides", () => {
    // 667 tall, 360 visible above a 307px keyboard, no pan.
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 360,
        vvOffsetTop: 0,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 307, open: true });
  });

  it("panned: iOS's own pan is subtracted, so the lift never stacks on it (vaul's bug)", () => {
    // iOS scrolled the visual viewport 120px down to reveal the field: the keyboard now hides
    // only what lies below 120 + 360 = 480, so the sheet lifts 187px, not 307.
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 360,
        vvOffsetTop: 120,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 187, open: true });
    // Panned all the way: the visible region already ends at the layout viewport's foot. The
    // keyboard is no smaller for it, so the foot still reads it as open.
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 360,
        vvOffsetTop: 307,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 0, open: true });
  });

  it("measured on an iPhone SE: iOS's own 191px scroll leaves a 36px lift, and the keyboard reads open", () => {
    // Safari's web area is 547px at rest; the keyboard with its form bar leaves 321px visible.
    expect(
      readKeyboard({
        innerHeight: 547,
        restHeight: 547,
        vvHeight: 321,
        vvOffsetTop: 191,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 35, open: true });
  });

  it("rounds sub-pixel viewports, and never lifts by a negative", () => {
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 359.6,
        vvOffsetTop: 0.2,
        fieldFocused: true,
      }).inset,
    ).toBe(307);
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 667,
        vvOffsetTop: 40,
        fieldFocused: true,
      }).inset,
    ).toBe(0);
  });

  it("the stale offset: iOS 26 leaves offsetTop behind after the keyboard closes", () => {
    // The keyboard closed, which blurred the field: the stale 180px pan is ignored outright.
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 667,
        vvOffsetTop: 180,
        fieldFocused: false,
      }),
    ).toEqual({ inset: 0, open: false });
  });

  it("Android, resizes-visual (Chrome's default): the same arithmetic as iOS", () => {
    expect(
      readKeyboard({
        innerHeight: 800,
        restHeight: 800,
        vvHeight: 470,
        vvOffsetTop: 0,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 330, open: true });
  });

  it("Android, resizes-content: nothing to lift, and the keyboard still reads as open", () => {
    // The layout viewport itself shrank from 800 to 470 around the keyboard.
    expect(
      readKeyboard({
        innerHeight: 470,
        restHeight: 800,
        vvHeight: 470,
        vvOffsetTop: 0,
        fieldFocused: true,
      }),
    ).toEqual({ inset: 0, open: true });
  });

  it("a sliver is not a keyboard: it lifts as measured and never switches the foot", () => {
    const sliver = KEYBOARD_MIN_PX - 1;
    expect(
      readKeyboard({
        ...SE,
        vvHeight: 667 - sliver,
        vvOffsetTop: 0,
        fieldFocused: true,
      }),
    ).toEqual({ inset: sliver, open: false });
  });
});
