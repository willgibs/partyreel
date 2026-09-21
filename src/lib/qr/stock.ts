/**
 * THE STOCK THE APP PRINTS (Will, `venue=sheet`, 2026-09-21: "This is a great
 * spark to a bigger idea. We should have a full gallery of printable QR designs
 * ready to go, rather than only offering the code itself").
 *
 * Three pieces in ONE design, laid out in PHYSICAL units. The gallery of designs
 * his note asks for is a ROADMAP line (his own no-new-board rule closes the desk
 * first); what ships here is the one design, printable today.
 *
 * ★ EVERY NUMBER IS MILLIMETRES, AND THAT IS THE WHOLE TRICK. A print sheet has
 * no viewport, so a layout in rem or in Tailwind steps is a layout whose size
 * depends on a root font size that the print stylesheet does not control. In
 * print, CSS absolute units ARE physical (96px = 1in by spec), so `mm` and `pt`
 * resolve to the same object on screen and on paper: what the preview shows at
 * 100% is what comes out of the printer.
 *
 * ★ ONE SHEET BOX FITS BOTH LETTER AND A4, BECAUSE WE CANNOT SET @page. The
 * house's print doctrine forbids `@page` anywhere (it cannot be scoped to a
 * selector, so a margin set for this sheet would silently re-margin the help
 * articles and the legal documents: `globals.css`, `legal-print.test.ts`), which
 * means the browser's own default margin applies — about 10.2 mm a side in
 * Chrome. The printable area is then ~189.7 × 276.7 mm on A4 and ~195.7 × 258.7
 * on Letter, so ONE box that fits both is 190 wide by 259 tall. SHEET_MM sits
 * under both with a margin for the rounding every driver does its own way.
 */

/** CSS px per millimetre (96 px per inch, 25.4 mm per inch). Exact on paper. */
export const PX_PER_MM = 96 / 25.4;

/** Millimetres to CSS px, for the one prop that takes a number (`FooterQr`'s size). */
export function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM * 100) / 100;
}

/**
 * The printable box shared by Letter and A4 at the browser's default margin.
 * Everything below lays out inside it, so no piece can push a second page.
 */
export const SHEET_MM = { w: 186, h: 252 } as const;

export type StockId = "cards" | "sign" | "poster";

export type StockPiece = {
  id: StockId;
  /** What the host picks it by. */
  label: string;
  /** The line under the label: what comes out of the printer. */
  spec: string;
  /** The code's rendered edge in mm, quiet zone included (see module-floor.ts). */
  codeMm: number;
  /** The piece's own face width in mm (a card is one cell of the grid). */
  faceMm: { w: number; h: number };
  /** How many faces the sheet carries. */
  perSheet: number;
  /** The heading's size in points, and the two supporting lines'. */
  type: { title: number; name: number; link: number };
};

/**
 * ★ THE CARD IS 62 × 84 mm AND IS NOT CALLED A7, ON PURPOSE. A7 is 74 × 105,
 * and nine of those is 222 × 315 mm — wider than A4 is, before any margin. The
 * board's caption said "A7, nine to a sheet" and nine A7 cards have never fitted
 * one sheet; three columns of 62 and three rows of 84 fit the box above exactly,
 * on both papers, with the cut lines inside the printable area rather than off
 * the edge of it.
 */
export const PRINT_STOCK: Record<StockId, StockPiece> = {
  cards: {
    id: "cards",
    label: "Table cards",
    spec: "Nine to a page, cut lines included",
    codeMm: 34,
    faceMm: { w: SHEET_MM.w / 3, h: 84 },
    perSheet: 9,
    type: { title: 10, name: 7.5, link: 6.5 },
  },
  sign: {
    id: "sign",
    label: "Welcome sign",
    spec: "One to a page, for a table by the door",
    codeMm: 90,
    faceMm: { w: SHEET_MM.w, h: SHEET_MM.h },
    perSheet: 1,
    type: { title: 26, name: 15, link: 12 },
  },
  poster: {
    id: "poster",
    label: "Poster",
    spec: "One to a page, for the bar or the entrance",
    codeMm: 130,
    faceMm: { w: SHEET_MM.w, h: SHEET_MM.h },
    perSheet: 1,
    type: { title: 38, name: 20, link: 14 },
  },
};

export const STOCK_IDS = ["cards", "sign", "poster"] as const;

/** A stored/query value resolved to a real piece; anything unknown is the cards. */
export function resolveStock(id: string | null | undefined): StockPiece {
  return id && id in PRINT_STOCK ? PRINT_STOCK[id as StockId] : PRINT_STOCK.cards;
}

/**
 * The one sentence every piece carries. It is the whole instruction: a guest
 * reading a table card needs to know what the code does, not what we are.
 */
export const STOCK_LINE = "Scan to add your photos";
