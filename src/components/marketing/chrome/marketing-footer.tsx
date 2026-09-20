import Link from "next/link";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { ctaCorner } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { ASK_AI_TARGETS, LLMS_TXT_HREF } from "@/lib/constants/ask-ai";
import { IS_HIRING } from "@/lib/constants/careers";
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
 * ── THE SLAB IS .surface-ink, AND IT PAINTS WITH ITS OWN --background ──
 *   (globals.css, one class since the library phase, 2026-09-11; the reasoning below
 *   is why that class exists)
 *
 * The footer renders in THREE contexts: cinema (.dark), paper (.surface-paper,
 * forced light), and the root 404 (.surface-paper, and OUTSIDE (marketing) so
 * marketing.css never loads). It must look identical in all three.
 *
 * ★ THE SLAB IS NO LONGER THE MEDIA WELL (the palette's round eight, Graphite,
 * 2026-09-17). Both jobs used to ride --gallery* at one value; the ruling splits
 * them, the well down to 0.065 so a photograph is the only light on it and this
 * leaf up to 0.165 so it reads as a step below a paper page rather than a hole
 * in it. So the class writes the slab's values out and `bg-background` inside it
 * is the slab. A `bg-gallery` here would now paint the WELL, which is a
 * different, much deeper colour: do not reach for it.
 *
 * A .dark wrapper is still forbidden. globals.css states the rule outright:
 * "never nest .dark inside .surface-paper (always-dark media surfaces use
 * --gallery* instead)", and a .dark wrapper here would ALSO silently neuter
 * every `dark:` utility in the subtree, because the custom variant is
 * `:is(.dark *):not(.surface-paper *)`.
 *
 * ★ And a background alone is a trap, which is the part that bites: --ring,
 * --border, --foreground, --muted-foreground and --brand are NOT surfaces, so
 * under paper they keep their LIGHT values. `* { outline-ring/50 }` in globals
 * then paints focus rings at oklch(0.3 0.008 286) on the slab: 1.41:1 measured,
 * against a 3:1 requirement. Muted text lands at 2.69:1 against 4.5:1, and a
 * bare `border-t` paints a near-white hairline. None of it is visible while
 * working on cinema pages, where the footer sits inside .dark and the ring
 * reads 13.6:1. So the slab REDECLARES the tokens it needs, which is the
 * .surface-paper mechanism applied to one subtree. Everything inside then uses
 * ordinary utilities and is correct by construction rather than by vigilance.
 * Do not remove these; the bug they fix is invisible on the page you develop on.
 *
 * --brand needs redeclaring DIRECTLY, not inherited: a var() inside a custom
 * property is substituted at the element that DECLARES it, so :root's
 * --brand: var(--primary) already resolved to paper ink back at :root and
 * inherits down resolved. The class re-declares --primary AND --brand together,
 * so the alias re-resolves here.
 *
 * Contrast on the slab: --foreground 17.40:1, --muted-foreground 7.60:1 (AA for
 * body text), --faint 4.21:1 (captions and timestamps only). Never stack an
 * opacity on a text token here; the hairline is decoration and must never become
 * a control boundary or a focus indicator.
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

const LEGAL_LINK =
  "block py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground";

const columnId = (title: string) =>
  `footer-nav-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function MarketingFooter() {
  return (
    <footer
      className={cn(
        // The slab's token set AND its ground: .surface-ink in globals.css
        // (see the header note). bg-background below is the slab, not the well.
        "surface-ink",
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

/**
 * THE FOOTER'S ONE ACTION, and the only one a (paper) route gets: CtaBand sits
 * above the footer on cinema pages but nowhere on /about, /press, /careers or
 * a 404. Deliberately SECONDARY to the demo (a hairline, not a fill) so the
 * two do not compete, and hand-rolled on purpose: the slab's .surface-ink set
 * would let a Button paint, but the outline register is the point. It is a
 * 44px action, so it wears the 44px action's corner (ctaCorner), not the 40px
 * one.
 *
 * ★ AT EVERY WIDTH, IN BOTH STATES (`foot-door=always`, Will 2026-09-19:
 * "Start free always, the demo when it is set"). It used to be `lg`-only AND
 * inside the demo branch, so a phone reader reached the end of /about with
 * nothing to do at all, and an unset demo token took the site's only footer
 * action down with it on every page. One rule now, not two: a conversion
 * action is never wired to whether a demo event happens to be configured, and
 * never to a breakpoint either. At phone width it lands under the invitation,
 * which reads as a ladder (a quiet link to look, a bordered button to act)
 * rather than as two competing offers.
 */
function StartFree() {
  return (
    <Link
      href={MARKETING_CTA.href}
      {...trackAttrs("cta_click", { cta: "start-free", location: "footer" })}
      className={cn(
        "mkt-learn inline-flex items-center gap-2 border px-6 py-3 text-[15px] font-medium text-foreground transition-[color,border-color,transform,scale] duration-150 ease-emphasis hover:border-foreground/40 active:scale-[0.97]",
        ctaCorner,
      )}
    >
      {MARKETING_CTA.label}
      <LearnChevron />
    </Link>
  );
}

/** Register one: the demo invitation, and the action beside it. */
function SignOff() {
  // Never a dead CTA (the DemoCtaLink contract): with no demo event configured
  // the QR would encode the marketing site the visitor is already on, so the
  // INVITATION stands down to the thesis. The ACTION does not go with it (see
  // StartFree); no Reveal on this branch, because nothing in it carries a cut
  // and an observer for two static elements is an island for nothing.
  if (!DEMO_EVENT_URL) {
    return (
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <p className="max-w-xl font-heading text-chapter">{SITE_THESIS}</p>
        <StartFree />
      </div>
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
          {/* The `section` step, one rung DOWN from `chapter` (Will,
              2026-09-19, ruling the walkthrough's close: "as a separate
              exploration, the footer 'Explore a demo event.' should be a
              heading size down from these closing section H2s to create
              hierarchy, it's far too big right now"). It used to sit a rung
              ABOVE them on the argument that the footer is the page's closer;
              read against a real closing H2 a hundred pixels up, the footer
              out-shouting the page's own last word was the louder mistake.
              Level with a closing H2 is the hierarchy he asked for. */}
          <h2 className="font-heading text-section">Explore a demo event.</h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            <span className="hidden sm:inline">
              Scan the code for a real event album on your phone, exactly the
              way a guest arrives. No app required.
            </span>
            <span className="sm:hidden">
              A real event album, exactly the way a guest arrives. No app required.
            </span>
          </p>
          <Link
            href={DEMO_EVENT_URL}
            {...trackAttrs("demo_open", { source: "footer-mobile" })}
            className="mkt-learn -my-1 inline-flex items-center gap-1 py-2 text-[15px] font-medium text-foreground transition-transform duration-150 active:scale-[0.99] sm:hidden"
          >
            Open the demo album
            <LearnChevron />
          </Link>
        </div>
      </div>
      {/* It also gives the register a right edge; without it the row left
          ~600px of dead space, the exact wireframe quality this pass exists to
          remove. */}
      <StartFree />
    </Reveal>
  );
}

/** Register two: the brand block plus the four sitemap columns. */
function Index() {
  return (
    <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 border-t pt-14 sm:mt-16 sm:pt-16 lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10">
      {/* lg:pr-12 rather than a bigger grid gap: the four link columns keep
          their own even rhythm and only the brand block is pushed away from
          them. The track widens to 1.45fr to PAY for that padding, or the
          padding eats the column and the thesis starts wrapping. */}
      <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-1 lg:pr-12">
        {/* The v1 wordmark, alone, as in the nav (Will, 2026-09-17). It was
            already wordmark-only here: a mark's filled tile is a second white
            rectangle directly under the QR plate, and the two read as a clash. */}
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
                {...trackAttrs("assistant_click", {
                  target: target.label.toLowerCase(),
                })}
                className={INLINE_LINK}
              >
                {target.label}
              </a>
            </span>
          ))}{" "}
          about Partyreel.
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
      {column.href ? (
        // The hairline underline is the whole distinction between a linked and
        // an unlinked column title; it brightens on hover. Same vocabulary the
        // assistant row uses, so "underlined = goes somewhere" stays one idea.
        <Link
          href={column.href}
          id={id}
          className="inline-block font-heading text-subsection text-foreground underline decoration-current/25 underline-offset-[6px] transition-[text-decoration-color] duration-150 hover:decoration-current"
        >
          {column.title}
        </Link>
      ) : (
        <p id={id} className="font-heading text-subsection text-foreground">
          {column.title}
        </p>
      )}
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
  // The badge is matched on the route here rather than declared in
  // marketing-nav.ts on purpose: that module is deliberately dependency-free and
  // never imports the registries it mirrors, and this signal is DERIVED from
  // JOB_OPENINGS so it takes itself down when the last real role closes.
  const hiring = IS_HIRING && link.href === "/careers";
  return (
    <li>
      <Link
        href={link.href}
        className={cn(FOOTER_LINK, hiring && "flex items-center gap-2")}
      >
        {link.label}
        {hiring && (
          <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.1em] whitespace-nowrap text-foreground uppercase">
            We&rsquo;re hiring
          </span>
        )}
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
        <span aria-hidden>&copy;</span>{" "}
        <span className="tabular-nums">{year}</span> Partyreel
      </p>
      <ul className="flex flex-wrap items-center gap-x-6">
        {FOOTER_LEGAL.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={LEGAL_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
        {/* The machine-readable source sits with the other fine print rather
            than in the assistant blurb: a human reader never needs it, and a
            crawler finds it wherever it lives. */}
        <li>
          <Link href={LLMS_TXT_HREF} className={LEGAL_LINK}>
            llms.txt
          </Link>
        </li>
      </ul>
    </div>
  );
}
