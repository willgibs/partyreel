import { describe, expect, it } from "vitest";

import type { ExportSummary } from "@/lib/export/build-manifest";
import {
  packSheets,
  SAVE_MAX_ITEMS,
  saveHints,
  setNoun,
  sheetCanSave,
  SHEET_BYTES,
  takeHomeSizes,
} from "@/lib/export/take-home";

const MB = 1024 * 1024;

const summary = (over: Partial<ExportSummary> = {}): ExportSummary => ({
  shown: {
    photo: {
      count: 24,
      bytes: Math.round(24 * 2.9 * MB),
      phone: Math.round(24 * 0.55 * MB),
    },
    video: { count: 0, bytes: 0, phone: 0 },
  },
  hidden: {
    photo: {
      count: 3,
      bytes: Math.round(3 * 2.9 * MB),
      phone: Math.round(3 * 0.55 * MB),
    },
    video: { count: 1, bytes: 22 * MB, phone: 22 * MB },
  },
  ...over,
});

describe("packSheets: a Save's files into the phone's share sheets", () => {
  it("carries up to 100 MB a sheet, in order, never splitting a file", () => {
    expect(SHEET_BYTES).toBe(100 * MB);
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      bytes: Math.round(0.55 * MB),
    }));
    const { sheets, loose } = packSheets(items);
    expect(loose).toEqual([]);
    expect(sheets.map((s) => s.length)).toEqual([181, 19]);
    expect(sheets.flat().map((i) => i.id)).toEqual(items.map((i) => i.id));
    for (const sheet of sheets) {
      expect(sheet.reduce((sum, i) => sum + i.bytes, 0)).toBeLessThanOrEqual(
        100 * MB,
      );
    }
  });

  it("24 phone-size photographs are one sheet, the board's own", () => {
    const { sheets } = packSheets(
      Array.from({ length: 24 }, () => ({ bytes: Math.round(0.55 * MB) })),
    );
    expect(sheets).toHaveLength(1);
  });

  it("a clip heavier than a whole sheet is loose (downloaded plainly), and the rest still pack", () => {
    const big = { id: "big", bytes: 140 * MB };
    const { sheets, loose } = packSheets([
      { id: "a", bytes: 60 * MB },
      big,
      { id: "b", bytes: 50 * MB },
    ]);
    expect(loose).toEqual([big]);
    expect(sheets.map((s) => s.map((i) => i.id))).toEqual([["a"], ["b"]]);
  });

  it("asks for at most one zip's worth at once", () => {
    expect(SAVE_MAX_ITEMS).toBe(2000);
  });
});

describe("takeHomeSizes and saveHints: each choice shows its size", () => {
  it("reads a guest's selection: its photographs at phone size beside its originals", () => {
    const sizes = takeHomeSizes(summary());
    expect(sizes).toEqual({
      photos: 24,
      clips: 0,
      original: Math.round(24 * 2.9 * MB),
      phone: Math.round(24 * 0.55 * MB),
      photosPhone: Math.round(24 * 0.55 * MB),
      clipBytes: 0,
    });
    expect(saveHints(sizes)).toEqual({
      photos: "24 photos · 13.2 MB",
      originals: "Originals · 69.6 MB",
    });
  });

  it("a host's Include hidden items adds the hidden set to both sizes; a clip weighs the same in both", () => {
    const sizes = takeHomeSizes(summary(), true);
    expect(sizes.photos).toBe(27);
    expect(sizes.clips).toBe(1);
    expect(sizes.phone - sizes.photosPhone).toBe(22 * MB);
    expect(sizes.original).toBe(
      Math.round(24 * 2.9 * MB) + Math.round(3 * 2.9 * MB) + 22 * MB,
    );
  });

  it("names a set in the album's words", () => {
    expect(setNoun(1, 0)).toBe("1 photo");
    expect(setNoun(24, 0)).toBe("24 photos");
    expect(setNoun(24, 2)).toBe("26 photos & videos");
    expect(setNoun(0, 1)).toBe("1 video");
    expect(setNoun(0, 3)).toBe("3 videos");
    expect(setNoun(2000, 0)).toBe("2,000 photos");
  });
});

describe("sheetCanSave: where a Save can go into Photos", () => {
  const IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const DESK =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
  const sheet = { share: async () => {}, canShare: () => true };

  it("a phone whose sheet takes a JPEG", () => {
    expect(
      sheetCanSave({ userAgent: IPHONE, maxTouchPoints: 5, ...sheet }),
    ).toBe(true);
  });

  it("never a desk, and never a phone whose sheet takes no file", () => {
    expect(sheetCanSave({ userAgent: DESK, maxTouchPoints: 0, ...sheet })).toBe(
      false,
    );
    expect(
      sheetCanSave({
        userAgent: IPHONE,
        maxTouchPoints: 5,
        share: async () => {},
        canShare: () => false,
      }),
    ).toBe(false);
    expect(sheetCanSave({ userAgent: IPHONE, maxTouchPoints: 5 })).toBe(false);
  });
});
