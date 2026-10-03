import { describe, expect, it } from "vitest";

import {
  ALBUM_TAKE,
  bytesOf,
  CLIP,
  countOf,
  MB,
  PHOTO_ORIGINAL,
  PHOTO_PHONE,
  phonePixels,
  SHEET_BYTES,
  sheetsOf,
  WAY_TAKE,
} from "./model";

/**
 * THE BOARD'S NUMBERS HOLD TOGETHER: a menu row, a sheet's header and a toast
 * print these, so a part that carried more than a sheet takes, or a phone size
 * heavier than its original, would draw a wrong picture under a right word.
 */
describe("what each way home carries", () => {
  it("counts the album as the cover does", () => {
    expect(countOf(ALBUM_TAKE)).toBe(214);
  });

  it("makes phone size lighter than the original, and leaves a clip alone", () => {
    expect(PHOTO_PHONE).toBeLessThan(PHOTO_ORIGINAL / 4);
    const clip = { photos: 0, clips: 1 };
    expect(bytesOf(clip, "phone")).toBe(bytesOf(clip, "original"));
    expect(bytesOf(ALBUM_TAKE, "phone")).toBeLessThan(
      bytesOf(ALBUM_TAKE, "original"),
    );
  });

  it("packs every file whole into sheets no heavier than one sheet carries", () => {
    for (const take of [...Object.values(WAY_TAKE), ALBUM_TAKE])
      for (const size of ["original", "phone"] as const) {
        const sheets = sheetsOf(take, size);
        expect(sheets.reduce((a, b) => a + b, 0)).toBe(countOf(take));
        let left = take.photos;
        for (const n of sheets) {
          const photos = Math.min(n, left);
          left -= photos;
          const bytes =
            photos * (size === "phone" ? PHOTO_PHONE : PHOTO_ORIGINAL) +
            (n - photos) * CLIP;
          expect(bytes).toBeLessThanOrEqual(SHEET_BYTES);
        }
      }
  });

  it("carries her 24 picks in one sheet at either size", () => {
    expect(sheetsOf(WAY_TAKE.select, "original")).toEqual([24]);
    expect(sheetsOf(WAY_TAKE.select, "phone")).toEqual([24]);
    expect(bytesOf(WAY_TAKE.select, "original")).toBeGreaterThan(60 * MB);
    expect(bytesOf(WAY_TAKE.select, "phone")).toBeLessThan(15 * MB);
  });

  it("needs fewer sheets for the whole album at phone size", () => {
    expect(sheetsOf(ALBUM_TAKE, "phone").length).toBeLessThan(
      sheetsOf(ALBUM_TAKE, "original").length,
    );
  });

  it("brings a phone-size photograph's long side to 2048", () => {
    const px = phonePixels();
    expect(Math.max(px.w, px.h)).toBe(2048);
    expect(px.w / px.h).toBeCloseTo(4 / 3, 2);
  });
});
