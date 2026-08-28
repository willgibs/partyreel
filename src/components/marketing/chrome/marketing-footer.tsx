import Link from "next/link";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { ASK_AI_TARGETS, LLMS_TXT_HREF } from "@/lib/constants/ask-ai";
import {
  FOOTER_LEGAL,
  FOOTER_NAV,
  MARKETING_CTA,
  type FooterColumn,
  type NavLink,
} from "@/lib/constants/marketing-nav";
import { SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import { FooterDemo } from "./footer-demo";
import { FooterGlow } from "./footer-glow";

/**
 * THE INK SLAB (the footer rebuild; revised after Will's review of pass one).
 *
 * Three registers: the demo invitation, the index, the legal bar. Pass one put
 * the whole sitemap at 13px with a 34px row pitch and folded Features + Events
 * behind chevrons, which read as a legal footer and buried the two most core
 * marketing page families. The reference's quality is mostly CONFIDENCE and AIR
 * (~22px headings, ~60px row pitch, nothing hidden), so this pass spends the
 * type scale and drops the disclosure entirely.
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
 * --border, --foreground, --muted-foreground and --brand are NOT in that family,
 * so under paper they keep their LIGHT values. `* { outline-ring/50 }` in
 * globals then paints focus rings at oklch(0.3) on an oklch(0.155) slab: 1.44:1
 * measured, against a 3:1 requirement. Muted text lands at 2.62:1 against 4.5:1,
 * and a bare `border-t` paints a near-white hairline. None of it is visible
 * while working on cinema pages, where the footer sits inside .dark and the ring
 * reads 12.4:1. So the slab REDECLARES the tokens it needs, which is the
 * .surface-paper mechanism applied to one subtree. Everything inside then uses
 * ordinary utilities and is correct by construction rather than by vigilance.
 * Do not remove these; the bug they fix is invisible on the page you develop on.
 *
 * --brand needs redeclaring DIRECTLY, not via --primary: a var() inside a custom
 * property is substituted at the element that DECLARES it, so --brand: var(--primary)
 * already resolved to ink back at :root and inherits down resolved.
 *
 * Contrast on the slab: --gallery-foreground 17.9:1, --gallery-muted 5.37:1 (AA
 * for body text). Never stack opacity on the muted token: /80 lands at ~4.0:1
 * and fails. --gallery-border is 2.49:1, so it is decoration only and must never
 * become a control boundary or a focus indicator.
 *
 * ── MOTION ──
 *
 * Two mechanics, both earning their place. The seam glow (FooterGlow) gives the
 * top edge depth instead of a hard cut. One [data-mkt-cut] fires on the demo
 * object alone, and the INDEX deliberately gets no entrance: a footer is most
 * often reached on purpose (End key, a fast flick to find Terms), and a
 * staggered column reveal would strand that person on an empty black slab.
 *
 * Rejected, worth not re-adding: [data-mkt-pulse] on the QR is a 2.2s INFINITE
 * loop with no hover gate whose ring is a box-shadow, which the dark elevation
 * contract forbids, and whose --mkt-pulse-ring resolves invisible on paper.
 * .mkt-avatar is an empty CSS shell needing a bespoke per-item island built for
 * a row of equal-width avatars.
 */

// The one link treatment. py-1 lifts a 24px line box to a 32px hit target
// without changing the visual rhythm; footer links are the most mis-clicked
// elements on the web.
const FOOTER_LINK =
  "block py-1 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground";

// Quiet inline text for the assistant row, never vendor logos: this footer
// deliberately carries no social icons (the company has no accounts), so three
// competitors' marks would be exactly the noise that ruling avoided.
const INLINE_LINK =
  "text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

const columnId = (title: string) =>
  `footer-nav-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function MarketingFooter() {
  return (
    <footer
      className={cn(
        // The local token redeclaration (see the header note). Keep together.
        "[--background:var(--gallery)] [--border:var(--gallery-border)] [--foreground:var(--gallery-foreground)] [--muted-foreground:var(--gallery-muted)] [--ring:var(--gallery-foreground)]",
        "[--brand-foreground:var(--gallery)] [--brand:var(--gallery-foreground)] [--primary-foreground:var(--gallery)] [--primary:var(--gallery-foreground)]",
        // isolate + relative give the seam glow something to pin to without it
        // escaping over the page above.
        "relative isolate bg-background text-foreground",
      )}
    >
      <FooterGlow />
      <Container className="relative pt-20 pb-8 sm:pt-24 sm:pb-10">
        <SignOff />
        <Index />
        <LegalBar />
      </Container>
    </footer>
  );
}

/** Register one: the demo invitation. */
function SignOff() {
  // Never a dead CTA (the DemoCtaLink contract): with no demo event configured
  // the QR would encode the marketing site the visitor is already on, so the
  // whole invitation stands down to the thesis.
  if (!DEMO_EVENT_URL) {
    return (
      <p className="max-w-xl font-heading text-3xl sm:text-4xl">
        {SITE_THESIS}
      </p>
    );
  }
  return (
    <Reveal className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
      {/* The object and its copy travel together; only the CTA is pushed to the
          far edge, or justify-between strands the text mid-row. */}
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10">
        {/* Desktop only: you cannot scan your own screen, so a QR on a phone is
            decoration. Phones get the tap path below instead. */}
        <div data-mkt-cut className="hidden sm:block">
          <FooterDemo href={DEMO_EVENT_URL} value={DEMO_EVENT_URL} />
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">
            Explore a demo event.
          </h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            <span className="hidden sm:inline">
              Scan the code for a real event album on your phone, exactly the
              way a guest arrives. No app, no account.
            </span>
            <span className="sm:hidden">
              A real event album, exactly the way a guest arrives. No app, no
              account.
            </span>
          </p>
          <Link
            href={DEMO_EVENT_URL}
            className="mkt-learn -my-1 inline-flex items-center gap-1 py-2 text-[15px] font-medium text-foreground transition-transform duration-150 active:scale-[0.99] sm:hidden"
          >
            Open the demo album
            <LearnChevron />
          </Link>
        </div>
      </div>
      {/* The footer's one conversion action, and the only one a (paper) route
          gets: CtaBand sits above the footer on cinema pages but nowhere on
          /about, /press, /careers or a 404. Deliberately SECONDARY to the demo
          (a hairline, not a fill) so the two do not compete, and hand-rolled
          against the gallery tokens because a shadcn Button would paint
          --primary ink on the slab and vanish. It also gives the register a
          right edge; without it the row left ~600px of dead space, the exact
          wireframe quality this pass exists to remove. */}
      <Link
        href={MARKETING_CTA.href}
        className="mkt-learn hidden items-center gap-2 rounded-[var(--radius-action)] border px-6 py-3 text-[15px] font-medium text-foreground transition-[color,border-color,transform,scale] duration-150 ease-emphasis hover:border-foreground/40 active:scale-[0.97] lg:inline-flex"
      >
        {MARKETING_CTA.label}
        <LearnChevron />
      </Link>
    </Reveal>
  );
}

/** Register two: the brand block plus the four sitemap columns. */
function Index() {
  return (
    <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 border-t pt-14 sm:mt-16 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10">
      <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-1">
        <Link href="/" aria-label="Partyreel home">
          <Logo />
        </Link>
        {/* Imports the ruled thesis rather than duplicating it: the original
            footer carried a byte-identical hardcoded copy, so a thesis rewrite
            would silently have skipped the most-seen surface on the site. */}
        <p className="max-w-[26ch] text-[15px] text-pretty text-muted-foreground">
          {SITE_THESIS}
        </p>
        {/* Tucked here on purpose (Will's review): the demo row above should own
            its register, and this belongs with the other "what is Partyreel"
            copy. It is the one human-facing surface of the /llms.txt layer. */}
        <p className="max-w-[30ch] pt-2 text-[13px] text-pretty text-muted-foreground">
          Using an assistant? Ask{" "}
          {ASK_AI_TARGETS.map((target, i) => (
            <span key={target.label}>
              {i > 0 &&
                (i === ASK_AI_TARGETS.length - 1
                  ? ASK_AI_TARGETS.length === 2
                    ? " or "
                    : ", or "
                  : ", ")}
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
          about Partyreel, or read our{" "}
          <Link href={LLMS_TXT_HREF} className={INLINE_LINK}>
            llms.txt
          </Link>
          .
        </p>
      </div>
      {FOOTER_NAV.map((column) => (
        <FooterNavColumn key={column.title} column={column} />
      ))}
    </div>
  );
}

function FooterNavColumn({ column }: { column: FooterColumn }) {
  const id = columnId(column.title);
  return (
    <nav aria-labelledby={id}>
      {/* Urbanist at 18px, full ink. Pass one set these at 13px Inter and the
          columns read as small print; the reference's confidence in its column
          headings is most of what separates the two. A <p>, not an <h2>: the
          footer should name its landmarks without inventing headings in the
          document outline. */}
      <p id={id} className="font-heading text-lg text-foreground">
        {column.title}
      </p>
      <ul className="mt-6 flex flex-col gap-y-3">
        {column.links.map((link) => (
          <FooterLink key={link.href} link={link} />
        ))}
      </ul>
      {column.tail && (
        <ul className="mt-6 flex flex-col gap-y-3 border-t pt-6">
          {column.tail.map((link) => (
            <FooterLink key={link.href} link={link} />
          ))}
        </ul>
      )}
    </nav>
  );
}

function FooterLink({ link }: { link: NavLink }) {
  return (
    <li>
      <Link href={link.href} className={FOOTER_LINK}>
        {link.label}
      </Link>
    </li>
  );
}

/** Register three: the legal bar. */
function LegalBar() {
  const year = new Date().getFullYear();
  return (
    <div className="mt-16 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
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
