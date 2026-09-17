import Link from "next/link";

import { cn } from "@/lib/utils";

import { LiveQr } from "./live-qr";

// "Scan to join" card. Decorative QR block by default; pass `href` to make the whole
// card a tap-through to the demo event (the QR graphic stays decorative, the Link
// carries the accessible name). Round 3 swaps the decorative block for a REAL scannable
// QR encoding the demo URL — same shell, no rebuild. Brand-tinted finder corners match
// the real QR-preset look (brand only tints the finders; data stays grayscale).
//
// THE QR CARD takes the bright edge (globals.css, [data-lit]; LiveQr wears the
// same hook on the same box). data-lit="border" because the card wears a
// border: the light lands on it. The card must keep that 1px border and must
// never clip, or the edge is cut off at the padding box (lit-edge-contract).

const SIZE = 13;
type CellKind = "dark" | "light" | "finder" | "finder-center";

// Deterministic (no hydration drift): a brand finder in each of 3 corners + a static
// pseudo-scatter for the data area.
const QR_CELLS: CellKind[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);
  const inFinder =
    (x < 3 && y < 3) || (x >= SIZE - 3 && y < 3) || (x < 3 && y >= SIZE - 3);
  if (inFinder) {
    const fx = x < 3 ? x : x - (SIZE - 3);
    const fy = y < 3 ? y : y - (SIZE - 3);
    return fx === 1 && fy === 1 ? "finder-center" : "finder";
  }
  return (x * 73 + y * 151 + x * y * 13) % 5 < 2 ? "dark" : "light";
});

const CELL_CLASS: Record<CellKind, string> = {
  dark: "bg-foreground",
  light: "bg-transparent",
  finder: "bg-brand",
  "finder-center": "bg-card",
};

export function QrFrame({
  href,
  liveQrUrl,
  caption = "Scan to join",
  className,
}: {
  /** When set, the card links here (the demo event). */
  href?: string;
  /** When set, render a REAL scannable QR encoding this URL instead of the
      decorative block (the configured demo event). */
  liveQrUrl?: string;
  caption?: string;
  className?: string;
}) {
  if (liveQrUrl) {
    return <LiveQr url={liveQrUrl} caption={caption} className={className} />;
  }

  const visual = (
    <div
      aria-hidden
      data-lit="border"
      className={cn(
        "flex w-full max-w-[260px] flex-col items-center gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5",
        className,
      )}
    >
      <div
        className="grid w-40 gap-px"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
      >
        {QR_CELLS.map((kind, index) => (
          <span
            key={index}
            className={cn("aspect-square rounded-[1px]", CELL_CLASS[kind])}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">{caption}</span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Try the live demo"
        className="block transition-transform duration-150 active:scale-[0.99]"
      >
        {visual}
      </Link>
    );
  }
  return visual;
}
