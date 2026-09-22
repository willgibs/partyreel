import Image from "next/image";
import Link from "next/link";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { trackAttrs } from "@/lib/analytics/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE DEMO FRAME (`door=frame`, round two, 2026-09-20/21, overriding round
 * one's `doors=pile`; "the closing sitting's second
 * batch": "this visual is the same height as the image banner behind, and
 * isn't as noticeable as it could be" was his note on the board's own
 * drawing). One photograph in a plain mat, the live code tucked into its
 * corner: the ONE object every demo door now shares (the hero's plate, the
 * footer's invitation, a feature page's line, the nav panel's featured pane),
 * replacing four different treatments — a bare QR, a four-photo fan, a bare
 * text line, an empty pane — with one. The board's `FrameObject`
 * (`sandbox/demo-event/doors.tsx`, round two) is the drawing; the sizes below
 * are its production retuning against the REAL hero rather than the lab's
 * flat 140px mock (cinema-hero.tsx's own note carries the measurement).
 *
 * PRESENTATIONAL ONLY, deliberately: no link, no env gate. Every mount below
 * already owns a `<Link>` of its own (its own aria-label, its own
 * `demo_open` source), so this never wraps one — nesting a second anchor
 * inside another is invalid HTML, and the four callers' analytics stay
 * exactly as distinct as they were. `DemoTicket`, below, is the one
 * exception: the Library's specimen and the site-chrome sandbox still call
 * it bare, with no surrounding door of their own.
 *
 * ★ THE CODE READS AS AN ACCENT, NOT AS THE OBJECT, WHICH COSTS SCANNABILITY
 * AND IS A DELIBERATE CALL (his to overrule). `hero-stream.ts`'s own
 * `QR_FLOOR_PX_PER_MODULE` (3px: a 112px code measured 2.73px/module and
 * nobody could scan it) sized the OLD bare-QR hero at 144/128, because the
 * code was the whole object there. A first pass here pinned the corner badge
 * to those same pixels and it read as a QR code with a photograph leaking out
 * from behind it — the badge was WIDER than the photograph. `hero` and
 * `heroCompact` now follow the retired ticket's OWN precedent instead (92px,
 * 2.24px/module, shipped for months with no complaint on the one door that
 * was ever a photo-and-code combination rather than a bare plate): a code
 * that reads as a symbol and a tap target, never assumed scannable at arm's
 * length. `footer` keeps a bigger badge (108px) because its copy explicitly
 * promises a scan ("Scan the code… on your phone") and the footer has no
 * hero's tight vertical budget to spend it in. `line` and `nav` sit beside or
 * inside other content, where the retired ticket already accepted the same
 * trade at its own smaller sizes.
 */
export type DemoFrameSize = "hero" | "heroCompact" | "footer" | "line" | "nav";

/** The photograph's own window at each place, before the mat's padding. A
 *  portrait crop of a landscape still (object-cover), same ratio throughout
 *  so one number — the mat's height — is what changes place to place.
 *  `heroCompact` is the hero below `lg` (cinema-hero.tsx renders both,
 *  swapped by a plain `lg:hidden` pair): the same object, smaller, because
 *  the axis-to-headline clearance the real hero measures out at 375 is half
 *  of what it measures at 1440. */
const FRAME_PHOTO: Record<DemoFrameSize, { w: number; h: number }> = {
  hero: { w: 200, h: 240 },
  heroCompact: { w: 144, h: 173 },
  footer: { w: 172, h: 206 },
  nav: { w: 84, h: 101 },
  line: { w: 40, h: 48 },
};

/** The code's rendered edge, quiet zone included (see the header note for
 *  which sizes clear the scannable floor and which trade it for proportion). */
const FRAME_QR: Record<DemoFrameSize, number> = {
  hero: 92,
  heroCompact: 72,
  footer: 108,
  nav: 34,
  line: 22,
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
  size = "hero",
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
        // The LAYER shadow is the noticeability the ruling asked for: a mat
        // floating over whatever runs behind it (the corridor, the ink
        // footer, a paper line) wears the floating-object shadow, never the
        // card-on-card contact shadow the corner plate wears below.
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
 * RETIRED AS A DOOR (`doors=pile`, 2026-09-20), THEN THE FRAME'S OWN NAME
 * FOR IT (`door=frame`, round two). Nothing in the shipped site imports this
 * any more — every real mount below renders `DemoFrame` inside its own door
 * — but the Library's specimen and the site-chrome sandbox still call it
 * bare (`<DemoTicket />`, `<DemoTicket layout="column" />`, neither wrapped
 * in a door of the caller's own), so it stays as the one COMPLETE,
 * self-contained door: the frame at its own size, wrapped in the object's
 * own link and gate. `layout` keeps its old name and its old two values so
 * neither caller needed an edit; `row` reads as the hero's size, `column` as
 * the nav pane's.
 */
export function DemoTicket({
  layout = "row",
}: {
  layout?: "row" | "column";
}) {
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
        size={layout === "column" ? "nav" : "hero"}
      />
    </Link>
  );
}
