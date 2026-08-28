import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { trackAttrs } from "@/lib/analytics/events";
import {
  GENERAL_APPLICATION,
  OPEN_ROLES,
  type JobOpening,
} from "@/lib/constants/careers";

/**
 * THE OPEN ROLES SECTION - the page's destination, and the piece that has to
 * survive the next five listings without changing shape (Will, 2026-08-28: "we
 * plan on having an ongoing General Application, our first specifically listed
 * role and we will add more listings in the future").
 *
 * Two registers, on purpose:
 *  - REAL VACANCIES render as rows from OPEN_ROLES. A row, not a card grid, so
 *    one listing does not look lonely and six do not look like a wall. Every
 *    fact on a row comes from careers.ts, so adding a listing is one entry.
 *  - THE GENERAL APPLICATION is separated by a hairline and dressed quieter:
 *    permanent and first-class, but never wearing vacancy metadata. The site
 *    must never appear to advertise a job it does not have, which is the same
 *    invariant IS_HIRING protects for the footer badge.
 *
 * Empty state is real, not theoretical: with zero named roles the heading and
 * the copy both change, and the catch-all becomes the only door. That is what
 * the page looks like the day the last role closes, so it is built now.
 */
export function RoleListings() {
  const hasRoles = OPEN_ROLES.length > 0;

  return (
    <SectionShell
      id="open-roles"
      eyebrow="Open roles"
      heading={hasRoles ? "Come build with us." : "Nothing open right now."}
      subhead={
        hasRoles
          ? "Every application gets read. If nothing here fits, the last entry is always open."
          : "No named roles are open at the moment, but we are always glad to meet people who care about this kind of work."
      }
    >
      <div className="mx-auto mt-12 flex max-w-3xl flex-col">
        {hasRoles && (
          <Reveal className="flex flex-col">
            {OPEN_ROLES.map((role, index) => (
              <RoleRow key={role.slug} role={role} index={index} />
            ))}
          </Reveal>
        )}

        {GENERAL_APPLICATION && (
          <GeneralRow
            role={GENERAL_APPLICATION}
            index={OPEN_ROLES.length}
            standalone={!hasRoles}
          />
        )}
      </div>
    </SectionShell>
  );
}

/**
 * One vacancy. The hairline rules do the layering (the elevation contract bans
 * shadows in dark), the title carries the hover, and the chevron rides the
 * shared .mkt-learn ancestor hook so the arm-spread comes from the house recipe
 * rather than a second copy of it.
 */
function RoleRow({ role, index }: { role: JobOpening; index: number }) {
  return (
    <Link
      href={`/careers/${role.slug}`}
      data-mkt-reveal
      style={{ "--i": index } as CSSProperties}
      {...trackAttrs("cta_click", {
        cta: `role-${role.slug}`,
        location: "careers-listings",
      })}
      className="mkt-learn group flex flex-col gap-3 border-t border-foreground/12 py-6 transition-colors duration-150 first:border-t-0 hover:border-foreground/30 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="font-heading text-lg transition-colors duration-150 sm:text-xl">
          {role.title}
        </h3>
        <p className="text-sm text-pretty text-muted-foreground">{role.hook}</p>
      </div>
      <div className="flex shrink-0 items-center gap-5">
        <RoleFacts role={role} />
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
          <span className="sr-only sm:not-sr-only">View role</span>
          <LearnChevron />
        </span>
      </div>
    </Link>
  );
}

/**
 * The facts line. Deliberately NOT Badge chips: three grey pills per row read
 * as filler metadata and stack badly once there are several listings. A slashed
 * inline line stays quiet, wraps cleanly, and drops any fact a role has not
 * stated (location is optional by contract).
 */
function RoleFacts({ role }: { role: JobOpening }) {
  const facts = [role.team, role.type, role.location].filter(Boolean);
  return (
    <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
      {facts.map((fact, i) => (
        <span key={fact} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className="text-foreground/20">
              /
            </span>
          )}
          {fact}
        </span>
      ))}
    </span>
  );
}

/**
 * The permanent catch-all. Same row rhythm so it belongs to the list, a muted
 * plate and an "Always open" label so it can never be mistaken for a vacancy.
 * When it is the ONLY entry (no named roles) it stands alone without the
 * separating hairline, so the section does not read as a list with one thing
 * missing from it.
 */
function GeneralRow({
  role,
  index,
  standalone,
}: {
  role: JobOpening;
  index: number;
  standalone: boolean;
}) {
  return (
    <Reveal className={standalone ? "" : "mt-4"}>
      <Link
        href={`/careers/${role.slug}`}
        data-mkt-reveal
        style={{ "--i": index } as CSSProperties}
        {...trackAttrs("cta_click", {
          cta: "role-general",
          location: "careers-listings",
        })}
        className="mkt-learn group flex flex-col gap-3 rounded-sm bg-foreground/[0.04] px-5 py-5 transition-colors duration-150 hover:bg-foreground/[0.07] sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <Eyebrow>Always open</Eyebrow>
          </div>
          <h3 className="font-heading text-lg">{role.title}</h3>
          <p className="text-sm text-pretty text-muted-foreground">
            {role.hook}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
          Introduce yourself
          <LearnChevron />
        </span>
      </Link>
    </Reveal>
  );
}
