import { describe, expect, it } from "vitest";

import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import {
  MODULE_FLOOR_MM,
  MODULE_FLOOR_PX,
  moduleMm,
  modulePx,
  qrModuleCount,
} from "@/lib/qr/module-floor";
import { PRINT_STOCK, SHEET_MM, STOCK_IDS, mmToPx } from "@/lib/qr/stock";

/**
 * THE PAPER'S ONE SILENT FAILURE (Will, `venue=sheet`, 2026-09-21).
 *
 * A printed sheet is the one surface no screenshot, no headless browser and no
 * reviewer's eye ever checks: it exists inside a print dialog, and the thing
 * that breaks is not visible even there — a code whose modules came out too
 * small looks perfect on the page and simply does not scan at the party. So the
 * ARITHMETIC is the contract.
 *
 * Both halves have to hold, because either alone is silent:
 *   - every piece's code clears the print floor at the LONGEST link a real
 *     event can have, for every preset (the Q presets carry more modules);
 *   - every piece fits the one box that is printable on Letter AND A4, so no
 *     piece can quietly push a second page or lose its cut lines off the edge.
 *
 * Nothing about how a piece LOOKS is pinned.
 */

/** The worst case a real event presents: a 32-char token on the longest origin. */
const LONGEST_JOIN_URL = `https://partyreel.com/e/${"a".repeat(32)}`;
/** What the shipped fixtures actually encode, so the margin is reported honestly. */
const TYPICAL_JOIN_URL = "https://partyreel.com/e/7b41e9c0d8a24f6e93b5c1027ad4e8f6";

describe("the module floor", () => {
  it("counts more modules for the higher error correction the soft presets use", () => {
    // rounded + dots bump to Q precisely because their shapes cost decode
    // margin; a preset whose count did NOT rise would mean the bump was lost.
    const m = qrModuleCount(TYPICAL_JOIN_URL, "classic");
    const q = qrModuleCount(TYPICAL_JOIN_URL, "rounded");
    expect(q).toBeGreaterThan(m);
  });

  it("reserves the screen renderer's ten percent per side", () => {
    // StyledQr spends `size - 2 * round(size * 0.1)` on the data. 200px on a
    // 33-module code is the shipped share-sheet plate; the arithmetic is what
    // every caption on the retired board reported.
    const count = qrModuleCount(TYPICAL_JOIN_URL, "classic");
    expect(modulePx(200, TYPICAL_JOIN_URL, "classic")).toBeCloseTo(
      (200 - 40) / count,
      5,
    );
  });

  it("keeps every shipped screen plate above the screen floor", () => {
    // The share sheet's and the beat's plates. A plate is a fixed pixel number
    // in this product, so it meets the floor by arithmetic — this is the check
    // that the arithmetic still comes out right after a preset changes.
    for (const style of QR_STYLE_KEYS) {
      for (const size of [200, 240]) {
        expect(
          modulePx(size, LONGEST_JOIN_URL, style),
          `${style} at ${size}px`,
        ).toBeGreaterThanOrEqual(MODULE_FLOOR_PX);
      }
    }
  });
});

describe("the printed stock", () => {
  it("clears the print floor on every piece, at every preset, on the longest link", () => {
    for (const id of STOCK_IDS) {
      const piece = PRINT_STOCK[id];
      for (const style of QR_STYLE_KEYS) {
        const mm = moduleMm(piece.codeMm, LONGEST_JOIN_URL, style);
        expect(mm, `${id} / ${style}`).toBeGreaterThanOrEqual(MODULE_FLOOR_MM);
      }
    }
  });

  it("clears it with real room, not by a hair (a cheap printer spreads ink)", () => {
    // The smallest piece, the densest preset, the longest link: the true worst
    // case in the product. 0.5mm is the floor; a piece that only just cleared it
    // would stop scanning on the first domestic inkjet.
    const worst = Math.min(
      ...QR_STYLE_KEYS.map((s) =>
        moduleMm(PRINT_STOCK.cards.codeMm, LONGEST_JOIN_URL, s),
      ),
    );
    expect(worst).toBeGreaterThanOrEqual(MODULE_FLOOR_MM * 1.3);
  });

  it("fits the box that is printable on BOTH Letter and A4", () => {
    // A4 is narrower (210 vs 216) and Letter is shorter (279 vs 297); at
    // Chrome's ~10.2mm default margin the shared printable area is about
    // 189.7 x 258.7mm. Setting @page to widen it is forbidden house-wide.
    const A4 = { w: 210, h: 297 };
    const LETTER = { w: 216, h: 279 };
    const MARGIN_MM = 10.2;
    const printable = {
      w: Math.min(A4.w, LETTER.w) - MARGIN_MM * 2,
      h: Math.min(A4.h, LETTER.h) - MARGIN_MM * 2,
    };
    expect(SHEET_MM.w).toBeLessThanOrEqual(printable.w);
    expect(SHEET_MM.h).toBeLessThanOrEqual(printable.h);
  });

  it("lays nine cards on one sheet without spilling off it", () => {
    const { faceMm, perSheet } = PRINT_STOCK.cards;
    expect(perSheet).toBe(9);
    expect(faceMm.w * 3).toBeLessThanOrEqual(SHEET_MM.w);
    expect(faceMm.h * 3).toBeLessThanOrEqual(SHEET_MM.h);
  });

  it("keeps every piece's code inside its own face", () => {
    for (const id of STOCK_IDS) {
      const piece = PRINT_STOCK[id];
      expect(piece.codeMm, id).toBeLessThan(piece.faceMm.w);
      expect(piece.codeMm, id).toBeLessThan(piece.faceMm.h);
    }
  });

  it("converts millimetres to the px the code renderer takes", () => {
    // FooterQr's `size` is a number of CSS px, and on paper 96px is one inch by
    // spec — so this conversion is exact, not an approximation of a physical size.
    expect(mmToPx(25.4)).toBe(96);
  });
});
