import { cn } from "@/lib/utils";

/**
 * A page section with an anchor the table of contents and the dock can reach:
 * `scroll-mt` clears the top bar and, on a board, the dock. `Sub` is the
 * third level. Both are server-safe (no hooks) so a page composes them freely.
 */
const SCROLL_MT =
  "scroll-mt-[calc(var(--lab-topbar-h,0px)+var(--board-dock-h,0px)+12px)]";

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
    <section id={id} className={cn("pt-10 first:pt-6", SCROLL_MT, className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg tracking-tight">{title}</h2>
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
    <div id={id} className={cn("pt-6", SCROLL_MT, className)}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {blurb && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
