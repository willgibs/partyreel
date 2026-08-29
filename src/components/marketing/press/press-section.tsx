import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

/**
 * THE PRESS BODY SECTION: a sticky heading on the left, the content on the right.
 *
 * Why this shape (Will, 2026-08-28): the body had been a narrow centered reading column,
 * which left the page feeling emptier than the hero and the sheet above it. Two columns
 * spend the full measure, and pinning the heading means you always know which register
 * you are in while scrolling a long asset grid or a twelve-row table. It also gives the
 * page a spine: three headings, three answers.
 *
 * ★ lg:self-start is load-bearing. A grid item stretches to the row height by default,
 * which makes `position: sticky` a silent no-op because the element already spans the
 * whole scroll range. This is the classic sticky-in-grid trap.
 *
 * The offset rides --mkt-header-h (the one chrome-height knob, marketing.css) rather than
 * a hardcoded rem, so the pinned heading keeps clearing the overlay header if that height
 * is ever retuned. Same reason the scroll-margin does: each section is a deep-link target
 * (#assets, #words, #facts) so a reporter can send a colleague straight to the fact sheet.
 */
export function PressSection({
  id,
  heading,
  note,
  aside,
  className,
  children,
}: {
  id: string;
  heading: string;
  /** One line under the heading. Context, never a second paragraph. */
  note?: string;
  /** Optional extra in the pinned column, e.g. the kit download beside the assets. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[calc(var(--mkt-header-h)+1.5rem)] py-16 sm:py-20",
        className,
      )}
    >
      <Container className="grid gap-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--mkt-header-h)+2.5rem)] lg:self-start">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            {heading}
          </h2>
          {note && (
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              {note}
            </p>
          )}
          {aside && <div className="mt-5">{aside}</div>}
        </div>
        <div>{children}</div>
      </Container>
    </section>
  );
}
