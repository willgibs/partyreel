import Link from "next/link";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { CONTACT_DIRECTORY } from "@/lib/constants/contact";

/**
 * THE DIRECTORY BESIDE THE FORM (contact-page r1 `beside=directory`): the
 * self-serve doors stand next to the note they might spare, so the way out
 * arrives before anyone has typed. It sat numbered in a band lower down; Will:
 * "icons instead of numbers ... The headings seem quite small and thin", so a
 * row is an icon, a heading on the ladder's `subsection` step (`font-heading`
 * alone, the face's one weight) and one line of what is there.
 *
 * The icon tile is the marketing pages' own (a bordered `rounded-lg` square at
 * `strokeWidth` 1.5, muted until the row is pointed at); colour stays out of
 * it, since hue encodes app state only. A whole row is the link, and its
 * chevron spreads on hover like every learn-more on the site (`.mkt-learn`).
 * Server-rendered: nothing here needs the client.
 */
export function ContactDirectory() {
  return (
    <div>
      <Caption id="contact-directory-label">
        Looking for something else?
      </Caption>
      <ul
        aria-labelledby="contact-directory-label"
        className="mt-3 flex flex-col"
      >
        {CONTACT_DIRECTORY.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="mkt-learn group flex items-start gap-4 border-t py-4 transition-colors duration-150 hover:border-foreground/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors duration-150 group-hover:border-foreground/30 group-hover:text-foreground">
                <entry.icon aria-hidden className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="flex items-center gap-1 font-heading text-subsection">
                  {entry.title}
                  <LearnChevron />
                </h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {entry.body}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
