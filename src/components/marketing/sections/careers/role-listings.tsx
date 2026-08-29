import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";

import { RoleEmblem } from "./role-emblem";
import { Reveal } from "@/components/marketing/system/reveal";
import { trackAttrs } from "@/lib/analytics/events";
import {
  GENERAL_APPLICATION,
  OPEN_ROLES,
  type JobOpening,
} from "@/lib/constants/careers";

/**
 * THE OPEN ROLES LIST - the page's destination, and the piece that has to
 * survive the next five listings without changing shape.
 *
 * ! ONE CARD DESIGN FOR EVERY ENTRY (Will, 2026-08-28). An early pass gave the
 *   General Application its OWN treatment so it could not be mistaken for a
 *   vacancy, and with exactly one real role that backfired: "having two
 *   different designs... makes the two total roles feel like they have
 *   conflicting designs." A second container only reads as distinction once
 *   there is a pattern to stand apart from. So every entry is the same card and
 *   the honesty lives in its DATA instead: the catch-all's type is "Always open"
 *   rather than "Full-time", it states no team at all, and its action says
 *   Introduce yourself rather than View role. Do not reintroduce a separate
 *   treatment unless there are several named roles above it.
 *
 * The card surface is the house's light gray plate (`bg-muted/50` + hairline),
 * the same one the contact form's stationery note uses, so a listing reads as
 * an object you can pick up rather than a row in a table - and on hover it
 * literally does, going to white card stock with a firmer hairline. The index
 * and the facts share one ruled line across the top, which is what gives the
 * card a structure instead of three stacked text blocks.
 *
 * Adding a listing is one entry in careers.ts. The empty state (zero named
 * roles) is real, not theoretical: the heading and the copy both change and the
 * catch-all becomes the only door, which is what the page looks like the day
 * the last role closes.
 */
export function RoleListings() {
  const hasRoles = OPEN_ROLES.length > 0;
  const entries = [
    ...OPEN_ROLES,
    ...(GENERAL_APPLICATION ? [GENERAL_APPLICATION] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal className="flex flex-col gap-4">
        {entries.map((role, index) => (
          <RoleRow key={role.slug} role={role} index={index} />
        ))}
      </Reveal>
      {!hasRoles && (
        <p
          className="mt-8 text-sm text-pretty text-muted-foreground"
          data-mkt-reveal
          style={{ "--i": entries.length } as CSSProperties}
        >
          No named roles are open at the moment. We are still glad to meet
          people who care about this kind of work.
        </p>
      )}
    </div>
  );
}

/**
 * One entry. Hairline rules do the layering (the elevation contract bans
 * shadows in dark), and the chevron rides the shared .mkt-learn ancestor hook
 * so the arm-spread comes from the house recipe rather than a second copy.
 */
function RoleRow({ role, index }: { role: JobOpening; index: number }) {
  const facts = [role.team, role.type, role.location].filter(Boolean);
  return (
    <Link
      href={`/careers/${role.slug}`}
      data-mkt-reveal
      style={{ "--i": index } as CSSProperties}
      {...trackAttrs("cta_click", {
        cta: `role-${role.slug}`,
        location: "careers-listings",
      })}
      // The morph hook. The delegate names this card's emblem on click, so it
      // travels into the role page's header instead of the two pages cutting.
      data-role-morph=""
      // The hover is the card being PICKED UP off the desk: the gray plate goes
      // to white card stock and the hairline firms up. No shadow, because the
      // elevation contract keeps that for the floating layer only, and a
      // surface here is hairline-led.
      // The house focus treatment, which this card was missing: without it a
      // keyboard visitor got the BROWSER's default hairline ring, while the blog
      // cards, the pricing plans and the help chips all draw the ring token. On
      // paper (not over a photograph), so it takes the ring form rather than
      // /blog's inset white outline.
      className="mkt-learn group grid gap-x-8 gap-y-5 rounded-sm border bg-muted/50 p-6 transition-[border-color,background-color] duration-200 ease-emphasis hover:border-foreground/30 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:grid-cols-[1fr_auto] sm:items-end sm:gap-x-10 sm:p-7"
    >
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <RoleEmblem slug={role.slug} className="-my-1 mr-1" />
          {/* Inter, not mono. The index is a quiet ordinal here, and the R6
              ruling keeps mono for tabular alignment rather than decoration. */}
          <span className="text-xs font-medium text-muted-foreground/70 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {facts.map((fact, i) => (
              <span key={fact} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden className="text-foreground/25">
                    /
                  </span>
                )}
                {fact}
              </span>
            ))}
          </span>
        </div>
        <h3 className="font-heading text-xl sm:text-2xl">{role.title}</h3>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          {role.hook}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
        {role.catchAll ? "Introduce yourself" : "View role"}
        <LearnChevron />
      </span>
    </Link>
  );
}
