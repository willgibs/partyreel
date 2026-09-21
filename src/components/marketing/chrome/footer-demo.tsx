import Link from "next/link";

import { DemoFrame } from "@/components/marketing/system/demo-ticket";
import { trackAttrs } from "@/lib/analytics/events";

/**
 * THE DEMO INVITATION: the frame, at the footer's own size (`door=frame`,
 * round two, 2026-09-20/21, overriding round one's `doors=pile`;
 * docs/design/rulings.md "the closing sitting's second batch"). This used to
 * be its own object — four fanned photographs under a plate, the one hover
 * delight on an otherwise still surface (git holds it at `d1f38489`, the
 * `.mkt-stack` / `.mkt-stack-card` recipe it rode is unused now and left in
 * `marketing.css` for whoever owns that sheet this round) — and is now the
 * same object every demo door shares, so a visitor who has seen it once at
 * the hero recognises it here rather than meeting a second idiom for the
 * same invitation.
 *
 * `FooterQr` stays a separate export (three lab files import it directly for
 * the real matrix alone); this component now reaches it only through
 * `DemoFrame`. Positioning stays self-sufficient: DemoFrame carries its own
 * radius, border and shadow as plain utilities, so the root 404 (where
 * `marketing.css` never loads) renders it identically — no recipe to lose
 * this time, since none is worn.
 */
export function FooterDemo({ href, value }: { href: string; value: string }) {
  return (
    <Link
      href={href}
      aria-label="Explore a demo event"
      {...trackAttrs("demo_open", { source: "footer-qr" })}
      className="inline-flex shrink-0 transition-transform duration-150 active:scale-[0.99]"
    >
      <DemoFrame value={value} size="footer" />
    </Link>
  );
}
