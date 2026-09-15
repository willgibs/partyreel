import { Hash } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A page section with an anchor the table of contents and the dock can reach.
 *
 * ★ THE ID LIVES ON THE HEADING, not on the wrapper. Phase 0 put it on the
 * `<section>`, which meant the table of contents (which scans `h2[id], h3[id]`,
 * the shape a rendered markdown doc produces) found nothing on any hand-built
 * page: the bible, the policies and the glossary all showed an empty rail at
 * `xl`. One id for one thing, on the element a reader is actually being sent
 * to; `scroll-mt` rides with it so the heading clears the top bar and, on a
 * board, the dock. Every `#id` a page already links still resolves.
 *
 * `Sub` is the third level. Both are server-safe (no hooks) so a page composes
 * them freely, and the `#` beside a heading is a plain fragment link, which the
 * browser resolves without dropping the gate key from the query.
 */
const SCROLL_MT =
  "scroll-mt-[calc(var(--lab-topbar-h,0px)+var(--board-dock-h,0px)+12px)]";

function Anchor({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label={`Link to ${label}`}
      className="shrink-0 text-muted-foreground opacity-0 transition-opacity duration-90 group-hover:opacity-100 focus-visible:opacity-100"
    >
      <Hash className="size-3.5" aria-hidden />
    </a>
  );
}

export function Section({
  id,
  title,
  blurb,
  aside,
  children,
  className,
}: {
  id: string;
  title: string;
  blurb?: string;
  /** A count, a pill, a link kept on the heading's line. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-section={id} className={cn("pt-10 first:pt-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={id}
          className={cn(
            "group flex items-center gap-1.5 font-heading text-lg tracking-tight",
            SCROLL_MT,
          )}
        >
          {title}
          <Anchor id={id} label={title} />
        </h2>
        {aside}
      </div>
      {blurb && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Sub({
  id,
  title,
  blurb,
  children,
  className,
}: {
  id: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-section={id} className={cn("pt-6", className)}>
      <h3
        id={id}
        className={cn(
          "group flex items-center gap-1.5 text-sm font-semibold",
          SCROLL_MT,
        )}
      >
        {title}
        <Anchor id={id} label={title} />
      </h3>
      {blurb && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
