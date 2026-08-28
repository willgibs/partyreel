import Link from "next/link";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { ASK_AI_TARGETS, LLMS_TXT_HREF } from "@/lib/constants/ask-ai";
import {
  FOOTER_LEGAL,
  FOOTER_NAV,
  isNavGroup,
  type NavItem,
} from "@/lib/constants/marketing-nav";
import { SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import { FooterDisclosure } from "./footer-disclosure";
import { FooterQr } from "./footer-qr";

/**
 * THE INK SLAB (the footer rebuild, superseding the wireframe-grade original).
 *
 * THE IDEA: at the bottom of a site written entirely for humans, the last two
 * rows are addressed to machines. One for cameras (the QR), one for language
 * models (the assistant line, the human-facing face of the /llms.txt layer).
 * Both modules were already ruled in; stacking them in a cramped brand column
 * made them a list, and lifting them into the opening register makes them an
 * argument. Then the index, then the legal bar.
 *
 * ── THE SLAB PAINTS WITH --gallery*, AND REDECLARES TOKENS LOCALLY ──
 *
 * The footer renders in THREE contexts: cinema (.dark), paper (.surface-paper,
 * forced light), and the root 404 (.surface-paper, and OUTSIDE (marketing) so
 * marketing.css never loads). It must look identical in all three.
 *
 * --gallery* is the system's always-dark family, declared once in :root and
 * deliberately never overridden in .dark. globals.css states the rule outright:
 * "never nest .dark inside .surface-paper (always-dark media surfaces use
 * --gallery* instead)". A .dark wrapper here would ALSO silently neuter every
 * `dark:` utility in the subtree, because the custom variant is
 * `:is(.dark *):not(.surface-paper *)`.
 *
 * ★ But bg-gallery alone is a trap, and this is the part that bites: --ring,
 * --border, --foreground and --muted-foreground are NOT part of that family, so
 * under paper they keep their LIGHT values. `* { outline-ring/50 }` in globals
 * then paints focus rings at oklch(0.3) on an oklch(0.155) slab: 1.43:1 against
 * a 3:1 requirement, an outright WCAG failure. A bare `border-t` paints a
 * near-white hairline for the same reason. None of it is visible while working
 * on cinema pages, where the footer sits inside .dark and the ring reads 12.4:1.
 * So the slab REDECLARES the handful of tokens it needs, which is the
 * .surface-paper mechanism applied to one subtree. Everything inside then uses
 * ordinary utilities and is correct by construction rather than by vigilance.
 * Do not remove these; the bug they fix is invisible on the page you develop on.
 *
 * Contrast on the slab: --gallery-foreground 17.9:1, --gallery-muted 5.37:1
 * (AA for body text). Never stack opacity on the muted token: /80 lands at
 * ~4.0:1 and fails. --gallery-border is 2.49:1, so it is decoration only and
 * must never become a control boundary or a focus indicator.
 *
 * ── MOTION ──
 *
 * One entrance, on the QR plate alone, and the index deliberately gets none: a
 * footer is most often reached ON PURPOSE (End key, fast flick to find Terms),
 * and a staggered column reveal would land the visitor on an empty black slab
 * for 700ms plus stagger while they are trying to click. [data-mkt-cut] rather
 * than [data-mkt-reveal] because the footer follows the credits, and a film's
 * last card cuts in. Reveal is already on every marketing page (SectionShell
 * uses it), so this costs one more observer, not a new chunk.
 *
 * Rejected and worth not re-adding: [data-mkt-pulse] on the QR is a 2.2s
 * INFINITE loop with no hover gate whose ring is a box-shadow, which the dark
 * elevation contract forbids, and whose --mkt-pulse-ring resolves invisible on
 * paper. .mkt-avatar is an empty CSS shell needing a bespoke per-item island
 * built for a row of equal-width avatars, not text links.
 */

// The one link treatment, shared by every row so the slab reads as one surface.
// py-1 lifts a 20px line box to a 28px hit target (footer links are the most
// mis-clicked elements on the web) without changing the visual rhythm.
const FOOTER_LINK =
  "block py-1 text-[13px] text-muted-foreground transition-colors duration-150 hover:text-foreground";

// External assistant links: quiet inline text, never vendor logos. This footer
// deliberately carries no social icons (the company has no accounts), so three
// competitors' marks would be exactly the noise that ruling avoided.
const INLINE_LINK =
  "text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

function columnId(title: string) {
  return `footer-nav-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function MarketingFooter({
  disclosure = true,
}: {
  /**
   * Collapse the long-tail groups. The root 404 passes false: it renders
   * outside (marketing), so [data-mkt] is absent, every .mkt-acc selector fails
   * to match, and a "collapsed" group would sit permanently open with its links
   * clipped out of nothing. Flat is the honest fallback there.
   */
  disclosure?: boolean;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        // The local token redeclaration (see the header note). Keep together.
        "[--background:var(--gallery)] [--border:var(--gallery-border)] [--foreground:var(--gallery-foreground)] [--muted-foreground:var(--gallery-muted)] [--ring:var(--gallery-foreground)]",
        // ★ --brand must be redeclared DIRECTLY, not via --primary. Logo paints
        // the mark `bg-brand text-brand-foreground`, and although :root defines
        // --brand as var(--primary), a var() inside a custom property is
        // substituted at the element that DECLARES it: --brand resolved to ink
        // back at :root and inherits down already-resolved, so overriding
        // --primary here does nothing for it. (.dark redeclares both, which is
        // why the mark looked right on cinema and inverted to a near-invisible
        // dark-on-dark tile on every paper page.) --primary is redeclared too so
        // any future primary-painted child is correct by construction.
        "[--primary-foreground:var(--gallery)] [--primary:var(--gallery-foreground)]",
        "[--brand-foreground:var(--gallery)] [--brand:var(--gallery-foreground)]",
        "bg-background text-foreground",
      )}
    >
      <Container className="pt-20 pb-8 sm:pt-24 sm:pb-10">
        <SignOff />
        <Index disclosure={disclosure} />
        <LegalBar year={year} />
      </Container>
    </footer>
  );
}

/**
 * Register one: the two machine-readable rows, side by side.
 *
 * Split into two blocks rather than one left-hugging stack because the row is
 * ~1200px wide and a single stack left ~600px of dead space, which is exactly
 * the wireframe feel this rebuild exists to remove. The camera audience gets the
 * headline and the object; the assistant audience gets a quiet column of its own
 * at the far end. Same idea, one row, full width.
 */
function SignOff() {
  return (
    <Reveal className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* The QR is desktop-only ON PURPOSE: you cannot scan your own screen,
            so shipping one to phones is decoration. Phones get the tap path.
            Gated on DEMO_EVENT_URL per the DemoCtaLink contract (no demo event
            configured means no demo link anywhere, never a dead CTA). */}
        {DEMO_EVENT_URL && (
          <div data-mkt-cut className="hidden shrink-0 sm:block">
            <FooterQr
              value={DEMO_EVENT_URL}
              href={DEMO_EVENT_URL}
              label="Open the live demo album"
            />
          </div>
        )}
        <div className="flex flex-col items-start gap-3">
          <p className="font-heading text-2xl sm:text-3xl">
            {DEMO_EVENT_URL ? (
              <>
                <span className="hidden sm:inline">
                  Point your camera here.
                </span>
                <span className="sm:hidden">Open a live album.</span>
              </>
            ) : (
              SITE_THESIS
            )}
          </p>
          {DEMO_EVENT_URL && (
            <>
              <p className="max-w-xs text-[15px] text-pretty text-muted-foreground">
                <span className="hidden sm:inline">
                  Scan to open a real event album on your phone. No app, no
                  account.
                </span>
                <span className="sm:hidden">
                  A real event album, on your phone. No app, no account.
                </span>
              </p>
              {/* The phone's stand-in for the scan. */}
              <Link
                href={DEMO_EVENT_URL}
                // -my-1 py-2 lifts the line box to a 39px touch target (WCAG
                // 2.5.8 wants 24px minimum) without changing the visual rhythm.
                className="mkt-learn -my-1 inline-flex items-center gap-1 py-2 text-[15px] font-medium text-foreground transition-transform duration-150 active:scale-[0.99] sm:hidden"
              >
                Open the demo album
                <LearnChevron />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex max-w-sm flex-col items-start gap-2">
        <p className="text-[13px] font-medium text-foreground">
          Using an assistant?
        </p>
        <p className="text-[13px] text-pretty text-muted-foreground">
          Ask{" "}
          {ASK_AI_TARGETS.map((target, i) => (
            <span key={target.label}>
              {i > 0 && (i === ASK_AI_TARGETS.length - 1 ? ", or " : ", ")}
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className={INLINE_LINK}
              >
                {target.label}
              </a>
            </span>
          ))}{" "}
          about Partyreel. Or read our{" "}
          <Link href={LLMS_TXT_HREF} className={INLINE_LINK}>
            llms.txt
          </Link>
          .
        </p>
      </div>
    </Reveal>
  );
}

/** Register two: the brand block plus the sitemap columns. */
function Index({ disclosure }: { disclosure: boolean }) {
  return (
    <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t pt-12 sm:mt-20 sm:pt-14 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-x-12">
      <div className="col-span-2 flex flex-col items-start gap-3 lg:col-span-1">
        <Link href="/" aria-label="Partyreel home">
          <Logo />
        </Link>
        {/* Imports the ruled thesis rather than duplicating it: the original
            footer carried a byte-identical hardcoded copy, so a thesis rewrite
            would silently have skipped the most-seen surface on the site. */}
        <p className="max-w-[30ch] text-[13px] text-pretty text-muted-foreground">
          {SITE_THESIS}
        </p>
      </div>
      {FOOTER_NAV.map((column) => {
        const id = columnId(column.title);
        return (
          <nav key={column.title} aria-labelledby={id}>
            {/* A <p>, not an <h2>: the footer should name its landmarks without
                inventing headings in the document outline. Inter 500 rather than
                Eyebrow, whose uppercase + 0.14em tracking is the "a section
                begins here" register SectionShell owns; spending it on four
                column labels would devalue it site-wide. The hierarchy comes
                from the ink step (0.97 against 0.62) instead, which is stronger
                than case and costs no vertical space. */}
            <p id={id} className="text-[13px] font-medium text-foreground">
              {column.title}
            </p>
            <ul className="mt-4 flex flex-col gap-y-2">
              {column.links.map((item) => (
                <FooterEntry
                  key={isNavGroup(item) ? item.label : item.href}
                  item={item}
                  disclosure={disclosure}
                />
              ))}
            </ul>
          </nav>
        );
      })}
    </div>
  );
}

function FooterEntry({
  item,
  disclosure,
}: {
  item: NavItem;
  disclosure: boolean;
}) {
  if (!isNavGroup(item)) {
    return (
      <li>
        <Link href={item.href} className={FOOTER_LINK}>
          {item.label}
        </Link>
      </li>
    );
  }
  if (disclosure) {
    return <FooterDisclosure group={item} linkClassName={FOOTER_LINK} />;
  }
  // The no-disclosure fallback (root 404): the group collapses to its HUB link
  // alone, not to its full child list. Rendering all ten long-tail rows flat
  // pushed Product to sixteen rows against Company's two, which reads as a
  // mistake rather than as generosity, and the hubs reach every one of those
  // pages in a click. It also keeps the 404 footer looking like the marketing
  // footer's resting state instead of a different component.
  if (!item.href) return null;
  return (
    <li>
      <Link href={item.href} className={FOOTER_LINK}>
        {item.label}
      </Link>
    </li>
  );
}

/** Register three: the legal bar. */
function LegalBar({ year }: { year: number }) {
  return (
    <div className="mt-14 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {/* Mono for the numeral only, per the R6 type ruling. */}
        <span aria-hidden>&copy;</span>{" "}
        <span className="font-mono tabular-nums">{year}</span> Partyreel
      </p>
      <ul className="flex flex-wrap items-center gap-x-6">
        {FOOTER_LEGAL.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
