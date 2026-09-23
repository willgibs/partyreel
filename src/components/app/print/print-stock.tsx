import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import {
  PRINT_STOCK,
  SHEET_MM,
  STOCK_LINE,
  mmToPx,
  type StockPiece,
} from "@/lib/qr/stock";

/**
 * THE STOCK THE APP PRINTS (Will, `venue=sheet`, 2026-09-21: "This is a great
 * spark to a bigger idea... rather than always requiring the host to design the
 * rest of the assets"). Three pieces, ONE face, every measurement physical.
 *
 * ★ ZERO CLIENT JS, DELIBERATELY. The code is `FooterQr`, the site's server
 * renderer: `qrcode-generator` is DOM-free, so the matrix is computed during the
 * server render and the markup ships inert. The app's other codes ride
 * `StyledQr`, which dynamic-imports `qr-code-styling` inside an effect — right
 * for the designer, wrong here, where nine codes on one page would be nine
 * client islands racing a print dialog the host may have opened already. A code
 * that has not painted when the dialog opens prints as a blank square.
 *
 * ★ AND THAT IS WHY THE PIECES ARE THE CLASSIC PRESET'S SHAPE, WHATEVER THE
 * EVENT'S STYLE IS. `FooterQr` draws square modules in ink on white and nothing
 * else; the styled presets are a screen affordance (`QrDesignerDialog`) that
 * cannot follow onto zero-JS paper. The data is identical — the same permanent
 * link, the same scan — so nothing a guest does changes; what a host loses is
 * the corner tint on the page. It is his to overrule, and the honest trade is
 * named in the print page's own copy rather than hidden.
 *
 * ★ EVERY LENGTH IS mm AND EVERY TYPE SIZE IS pt. See `lib/qr/stock.ts` for why:
 * a print sheet has no viewport, and CSS absolute units are physical on paper.
 * No Tailwind size step appears on a face below.
 */

/**
 * ★ A LINK LONG ENOUGH TO WRAP MUST WRAP INSIDE THE FACE, NEVER OVER ITS
 * NEIGHBOUR (the alias red-team, 2026-09-21: a 61-char link at 8.67px measured
 * 255px wide inside a 234px card and ran into the next one on the printed
 * sheet). `wrap-anywhere` only breaks a token that has somewhere to shrink
 * TO — a flex column's cross-axis child shrink-wraps to its content by
 * default, so an unbroken string still pushes the box wide open with the
 * rule alone. `w-full` below (bound to the face's own inner width, inside its
 * padding) is the other half of the same fix, not a separate one.
 *
 * Today's longest real link is 61 characters (the alias) to 48 (production);
 * `WRAP_RISK_CHARS` gives room for a custom slug beyond that. Past it, two
 * wrapped rows are not enough on the smallest face (the card), so the link
 * steps down one size rather than taking a third row into the card below it.
 * Exported so `print-stock.test.tsx` asserts against the real numbers rather
 * than a second copy of them.
 */
export const WRAP_RISK_CHARS = 70;
export const LINK_STEP_DOWN = 0.85;

/** `piece.type.link`, stepped down and rounded to 2dp past `WRAP_RISK_CHARS`
 *  (a bare `* 0.85` prints binary-float noise like 5.5249999999999995pt —
 *  harmless to a browser, just not a number anyone should have to read). */
function linkFontPt(piece: StockPiece, readableUrl: string): number {
  if (readableUrl.length <= WRAP_RISK_CHARS) return piece.type.link;
  return Math.round(piece.type.link * LINK_STEP_DOWN * 100) / 100;
}

/** The one face, at whatever size the piece asks for. */
function StockFace({
  piece,
  eventName,
  joinUrl,
  readableUrl,
}: {
  piece: StockPiece;
  eventName: string;
  /** The PERMANENT link. What the code encodes, always. */
  joinUrl: string;
  /** What a person reads and types. The slug when there is one. */
  readableUrl: string;
}) {
  const linkPt = linkFontPt(piece, readableUrl);
  return (
    <div
      className="flex flex-col items-center justify-center text-center text-black"
      style={{
        width: `${piece.faceMm.w}mm`,
        height: `${piece.faceMm.h}mm`,
        // A card's own breathing room, proportional to the piece rather than a
        // fixed step: a 62mm card and a 186mm poster cannot share a padding.
        padding: `${piece.faceMm.w * 0.06}mm`,
        gap: `${piece.faceMm.w * 0.035}mm`,
      }}
    >
      {/* p-0: FooterQr's own plate padding is a screen affordance, and the quiet
          zone it needs is already baked into the viewBox (4 modules a side). On
          paper the extra white only shrinks the code inside its allotted mm. */}
      <FooterQr
        value={joinUrl}
        size={mmToPx(piece.codeMm)}
        className="rounded-none p-0"
      />
      <p
        className="font-heading leading-tight"
        style={{ fontSize: `${piece.type.title}pt` }}
      >
        {STOCK_LINE}
      </p>
      <p
        className="leading-tight text-neutral-600"
        style={{ fontSize: `${piece.type.name}pt` }}
      >
        {eventName}
      </p>
      <p
        data-print-link
        className="w-full leading-tight text-neutral-500 wrap-anywhere"
        style={{ fontSize: `${linkPt}pt` }}
      >
        {readableUrl}
      </p>
    </div>
  );
}

/**
 * One piece, repeated to fill its sheet. The cards land three across in a grid
 * whose cell IS the face, with a dashed hairline as the cut line; the sign and
 * the poster are one face at sheet size, so the same component draws all three.
 *
 * `data-print-stock` is the ONE opt-in hook the print block in globals.css hangs
 * off (the house doctrine: no rule may fire on a page that has not opted in).
 */
export function PrintStock({
  stockId,
  eventName,
  joinUrl,
  readableUrl,
}: {
  stockId: StockPiece["id"];
  eventName: string;
  joinUrl: string;
  readableUrl: string;
}) {
  const piece = PRINT_STOCK[stockId];
  const faces = Array.from({ length: piece.perSheet }, (_, i) => i);
  return (
    <div
      data-print-stock
      className="bg-white"
      style={{ width: `${SHEET_MM.w}mm`, height: `${SHEET_MM.h}mm` }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${piece.perSheet === 1 ? 1 : 3}, ${piece.faceMm.w}mm)`,
          gridAutoRows: `${piece.faceMm.h}mm`,
        }}
      >
        {faces.map((i) => (
          <div
            key={i}
            // The cut line, on the cards only: a hairline a pair of scissors can
            // follow, and one that costs nothing when the piece is a single face.
            className={piece.perSheet > 1 ? "border border-dashed border-neutral-300" : ""}
          >
            <StockFace
              piece={piece}
              eventName={eventName}
              joinUrl={joinUrl}
              readableUrl={readableUrl}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
