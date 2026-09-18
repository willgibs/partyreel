import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type NotFoundScreenProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  /** CTA row — pass <Button asChild><Link/></Button> elements. */
  actions: ReactNode;
  /** Optional secondary line under the actions (e.g. a demo link). */
  footnote?: ReactNode;
  /**
   * Which half of the site this dead end is on, which is the ONE thing the
   * title needs to know (Will's type ruling, 2026-09-17: the dead-link title
   * joins the ladder, at the prose step on marketing and the page step inside
   * the app). A prop rather than an ancestor selector, and certainly rather
   * than a second component: `[data-mkt]` is absent on the root 404, which
   * renders outside (marketing) and would silently read as the app.
   */
  surface?: "marketing" | "app";
  className?: string;
};

/** The dead-link title's step, per half of the site. */
const TITLE_STEP = {
  marketing: "text-prose",
  app: "text-page",
} as const;

// Shared "dead end" hero for the not-found pages (root + guest + host variants).
// Presentational + content-only: NO Container or page chrome, because the three call
// sites live in different wrappers (the host variant already sits inside AppShell's
// <main><Container>, so a self-wrapping component would double-wrap). Mirrors the
// centered stacks in the guest private-event screen + the help no-results block.
// Owns the [data-not-found] entrance hook; children carry --nf-i for a top-down
// stagger (see globals.css). CSS-only motion, so it runs in a Server Component.
//
// ★ ITS TITLE IS ON THE LADDER NOW, AND IT USED TO BE THE ONE H1 THAT WAS NOT.
// It shipped in Inter 600 at a hand-rolled 30/36 while every other h1 on the
// site wore the heading face; Will ruled it onto the set (2026-09-17). The
// `surface` prop is the whole of the difference between the two halves, so the
// six call sites still share ONE component and one dead-end grammar.
export function NotFoundScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  footnote,
  surface = "app",
  className,
}: NotFoundScreenProps) {
  return (
    <div
      data-not-found
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-5 text-center",
        className,
      )}
    >
      <div
        style={{ "--nf-i": 0 } as CSSProperties}
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-6" aria-hidden />
      </div>
      <div
        style={{ "--nf-i": 1 } as CSSProperties}
        className="flex flex-col gap-3"
      >
        {eyebrow && (
          <span className="text-sm font-medium text-brand">{eyebrow}</span>
        )}
        {/* No `font-semibold` and no `tracking-tight`: the face carries 700,
            and `tracking-tight` resolves to 0em here, which would cancel the
            step's own letter-spacing through --tw-tracking. */}
        <h1 className={cn("font-heading text-balance", TITLE_STEP[surface])}>
          {title}
        </h1>
        <p className="text-pretty text-muted-foreground">{description}</p>
      </div>
      <div
        style={{ "--nf-i": 2 } as CSSProperties}
        className="flex flex-col gap-3 sm:flex-row"
      >
        {actions}
      </div>
      {footnote && (
        <div style={{ "--nf-i": 3 } as CSSProperties} className="text-sm">
          {footnote}
        </div>
      )}
    </div>
  );
}
