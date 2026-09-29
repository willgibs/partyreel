import Image from "next/image";
import Link from "next/link";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { trackAttrs } from "@/lib/analytics/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE DEMO FRAME: one photograph in a plain mat, the live code tucked into its
 * corner. It is the nav panel's featured pane, the one nav group with no other
 * picture of the product (`chrome/mega-panel.tsx`), and `DemoTicket` below.
 * The other demo doors are objects of their own places: the home hero's link
 * card (`sections/home/cinema-hero-card.tsx`), the footer's photo pile under
 * the plate (`footer-demo.tsx`), the demo link alone as words
 * (`demo-cta-link.tsx`).
 *
 * PRESENTATIONAL ONLY, deliberately: no link, no env gate. The pane already
 * owns its door (its own aria-label, its own `demo_open` source), so this never
 * wraps one: nesting a second anchor inside another is invalid HTML.
 * `DemoTicket`, below, is the one exception: the Library's specimen calls it
 * bare, with no door of its own.
 *
 * ★ THE CODE READS AS AN ACCENT, NOT AS THE OBJECT, WHICH COSTS SCANNABILITY
 * ON PURPOSE. A corner badge pinned to a scannable code's pixels (three per
 * module) read as a QR code with a photograph leaking out from behind it, the
 * badge WIDER than the photograph, so `row` follows the retired ticket's own
 * precedent (92px, 2.24px per module): a code that reads as a symbol and a tap
 * target, never assumed scannable at arm's length. `nav` sits inside the
 * panel's pane, where the retired ticket accepted the same trade at its own
 * smaller size.
 */
export type DemoFrameSize = "row" | "nav";

/** The photograph's own window at each place, before the mat's padding. A
 *  portrait crop of a landscape still (object-cover), same ratio throughout,
 *  so one number (the mat's height) is what changes place to place. */
const FRAME_PHOTO: Record<DemoFrameSize, { w: number; h: number }> = {
  row: { w: 200, h: 240 },
  nav: { w: 84, h: 101 },
};

/** The code's rendered edge, quiet zone included (see the header note on the
 *  trade each size makes against scanning). */
const FRAME_QR: Record<DemoFrameSize, number> = {
  row: 92,
  nav: 34,
};

/** The one still every frame carries (the fixture the site already holds,
 *  same as the board's own drawing): a wedding arch, landscape, cropped to
 *  the mat's portrait window. */
const FRAME_IMAGE = "wedding-arch";

/**
 * One photograph, a plain mat, the code tucked into its corner. `value` is
 * separate from any link the caller wraps this in, because a caller previews
 * this object with a fixture URL that never has to be the real demo (the
 * lab's own reason for handing `FooterDemo` an explicit prop rather than
 * reading `DEMO_EVENT_URL` itself).
 */
export function DemoFrame({
  size = "row",
  value,
  className,
}: {
  size?: DemoFrameSize;
  /** What the corner code encodes. */
  value: string;
  className?: string;
}) {
  const { w, h } = FRAME_PHOTO[size];
  const qr = FRAME_QR[size];
  const img = marketingImage(FRAME_IMAGE);
  // Tucked INTO the corner, never pinned wholly inside it and never so far
  // outside it reads as a second object beside the mat rather than part of
  // it (the board's own drawing, right/bottom negative offsets).
  const overlap = Math.max(6, Math.round(qr * 0.16));
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 rounded-[var(--radius-tile)] border bg-card p-2",
        // The LAYER shadow: a mat floating over whatever runs behind it (the
        // nav panel, the Library's ground) wears the floating-object shadow,
        // never the card-on-card contact shadow the corner plate wears below.
        "shadow-layer",
        className,
      )}
    >
      <span
        className="relative block overflow-hidden rounded-[calc(var(--radius-tile)-3px)]"
        style={{ width: w, height: h }}
      >
        <Image
          src={img.src}
          alt=""
          fill
          sizes={`${w}px`}
          className="object-cover"
        />
      </span>
      {/* The plate sits ON the mat (a card on a card, of its own lightness),
          so it wears the LIFT contact shadow plus its hairline ring, never
          the mat's own LAYER shadow (design-system.md's two shadows); the
          ring stays a separate utility from the shadow so neither costs the
          other (theme.css's own note on the pair). */}
      <span
        className="absolute rounded-md bg-white p-1 shadow-lift ring-1 ring-border"
        style={{ right: -overlap, bottom: -overlap }}
      >
        <FooterQr value={value} size={qr} />
      </span>
    </span>
  );
}

/**
 * THE FRAME AS A WHOLE DOOR, for the one caller with no door of its own: the
 * Library's specimen (`<DemoTicket />`, `<DemoTicket layout="column" />`).
 * Nothing in the shipped site imports it; it is the frame at its own size,
 * wrapped in the object's own link and gate. `row` is the larger size, which
 * the home hero wore until the link card replaced it, and `column` the nav
 * pane's.
 */
export function DemoTicket({ layout = "row" }: { layout?: "row" | "column" }) {
  if (!DEMO_EVENT_URL) return null;
  return (
    <Link
      href={DEMO_EVENT_URL}
      aria-label="Scan with your phone, or tap to open the live demo"
      {...trackAttrs("demo_open", {
        source: layout === "column" ? "nav-ticket" : "hero-ticket",
      })}
      className="inline-flex transition-transform duration-150 active:scale-[0.99]"
    >
      <DemoFrame
        value={DEMO_EVENT_URL}
        size={layout === "column" ? "nav" : "row"}
      />
    </Link>
  );
}
