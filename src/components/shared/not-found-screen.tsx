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
  className?: string;
};

// Shared "dead end" hero for the not-found pages (root + guest + host variants).
// Presentational + content-only: NO Container or page chrome, because the three call
// sites live in different wrappers (the host variant already sits inside AppShell's
// <main><Container>, so a self-wrapping component would double-wrap). Mirrors the
// centered stacks in the guest private-event screen + the help no-results block.
// Owns the [data-not-found] entrance hook; children carry --nf-i for a top-down
// stagger (see globals.css). CSS-only motion, so it runs in a Server Component.
export function NotFoundScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  footnote,
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
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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
