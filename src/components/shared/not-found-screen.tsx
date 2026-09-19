import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { ErrorDigest } from "@/components/shared/error-digest";
import { cn } from "@/lib/utils";

type NotFoundScreenBase = {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  /** CTA row — pass <Button asChild><Link/></Button> elements. */
  actions: ReactNode;
  /**
   * The quiet line to a human (Will, `ways-out=guided`, 2026-09-19): "a dead end
   * is exactly where somebody wants a human, and today only the marketing pages
   * offer one". Its own stagger child, BELOW the actions, so it never competes
   * with them for attention. Pass a <HelpLine/>; the surface picks the words.
   */
  help?: ReactNode;
  /** Optional secondary line under the actions (e.g. a demo link). */
  footnote?: ReactNode;
  /**
   * The crash's correlation code (Will, `code=always`, 2026-09-19). A 404 passes
   * nothing, because it throws nothing to correlate; only the render-crash
   * boundaries pass one, and only then does <ErrorDigest/> render.
   */
  digest?: string;
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

/**
 * EXACTLY ONE OF `icon` AND `visual`, by construction (Will, `picture=today`
 * with his note, 2026-09-19: "it does look weird beneath the content. It may
 * look better as a replacement for the icon above. The page has one visual
 * image plus the image trail behind"). A screen drawing both would say the same
 * sentence twice, which is the note's whole complaint, so the union refuses it
 * at the type level rather than at review.
 */
type NotFoundScreenProps = NotFoundScreenBase &
  ({ icon: LucideIcon; visual?: never } | { visual: ReactNode; icon?: never });

/** The dead-link title's step, per half of the site. */
const TITLE_STEP = {
  marketing: "text-prose",
  app: "text-page",
} as const;

// Shared "dead end" hero for EVERY failure page (Will, `grammar=shared`,
// 2026-09-19: one primitive, per-surface words). Nine call sites now: the root
// 404 and the two marketing group 404s (through MarketingNotFound), the host
// app's 404, the guest's bad-link 404 and its private lock, the admin portal's
// 404 and the admin host's refused path (through AdminNotFoundScreen), and
// every render crash (through RouteError and MarketingRouteError).
// Presentational + content-only: NO Container or page chrome, because the call
// sites live in different wrappers (the host variant already sits inside
// AppShell's <main><Container>, so a self-wrapping component would double-wrap).
// Owns the [data-not-found] entrance hook; children carry --nf-i for a top-down
// stagger (see globals.css). CSS-only motion, so it runs in a Server Component.
//
// ★ NO SENTRY IN HERE, EVER. RouteError keeps its own captureError effect and
// stays the crash wrapper. Move reporting down into this primitive and every
// real 404 files an issue, which is the one thing the failure grammar must not
// do (failure-grammar.test.tsx scans this file's source for it).
//
// ★ ITS TITLE IS ON THE LADDER NOW, AND IT USED TO BE THE ONE H1 THAT WAS NOT.
// It shipped in Inter 600 at a hand-rolled 30/36 while every other h1 on the
// site wore the heading face; Will ruled it onto the set (2026-09-17). The
// `surface` prop is the whole of the difference between the two halves, so the
// call sites still share ONE component and one dead-end grammar.
export function NotFoundScreen({
  icon: Icon,
  visual,
  eyebrow,
  title,
  description,
  actions,
  help,
  footnote,
  digest,
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
      {/* Stagger slot 0, whichever of the two arrives: the icon circle, or a
          picture standing in its place. The wrapper is the stagger child either
          way, so a visual enters on exactly the beat the circle did. */}
      {visual ? (
        <div style={{ "--nf-i": 0 } as CSSProperties}>{visual}</div>
      ) : (
        <div
          style={{ "--nf-i": 0 } as CSSProperties}
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {Icon ? <Icon className="size-6" aria-hidden /> : null}
        </div>
      )}
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
      {/* Guarded rather than always drawn: a screen that offers nothing to press
          would otherwise pay the column's 20px gap for an empty row. */}
      {actions && (
        <div
          style={{ "--nf-i": 2 } as CSSProperties}
          className="flex flex-col gap-3 sm:flex-row"
        >
          {actions}
        </div>
      )}
      {help && <div style={{ "--nf-i": 3 } as CSSProperties}>{help}</div>}
      {footnote && (
        <div style={{ "--nf-i": 4 } as CSSProperties} className="text-sm">
          {footnote}
        </div>
      )}
      {digest && (
        <div style={{ "--nf-i": 5 } as CSSProperties}>
          <ErrorDigest digest={digest} />
        </div>
      )}
    </div>
  );
}

/**
 * THE QUIET LINE, single-sourced (Will, `ways-out=guided`, 2026-09-19). The
 * sentence is the same on every surface; only the destination and the words
 * inside the link change, so a call site passes those and nothing else. The
 * full stop sits OUTSIDE the link, where a full stop belongs.
 *
 * `href` is optional because the operations portal's line takes no link: no
 * runbook page exists to point at yet, and his `ways-out` overrule named the
 * portal as the one surface where an extra pointer might be "a devtool
 * answering a question nobody asked it". A bare line renders as muted text,
 * which is what an operator gets until a runbook ships.
 */
export function HelpLine({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      Still stuck?{" "}
      {href ? (
        <Link
          href={href}
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-foreground"
        >
          {children}
        </Link>
      ) : (
        children
      )}
      .
    </p>
  );
}
