import Link from "next/link";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { cn } from "@/lib/utils";

/**
 * THE FEATURE-HERO STUB (R4 / review B21). Every feature hero used to stack TWO
 * small-caps eyebrows in the same slot — a "FEATURES" back-link over the page's
 * own "THE LIVE ALBUM" label — so the reader met two competing labels before the
 * H1. They collapse into ONE ruled line: Features · The live album. The first
 * half keeps the up-nav link, the middot is the rule, and the page half sits a
 * shade brighter so the pair reads as a breadcrumb rather than two peers.
 *
 * Shared on purpose: the stub is identical on all six feature pages, so it can
 * never drift page to page (and one entrance slot replaces two).
 */
export function FeatureHeroEyebrow({
  label,
  className,
  ...props
}: { label: string } & React.ComponentProps<"span">) {
  return (
    <Eyebrow
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
      {...props}
    >
      <Link
        href="/features"
        className="transition-colors duration-150 hover:text-foreground"
      >
        Features
      </Link>
      <span aria-hidden className="text-muted-foreground/40">
        ·
      </span>
      <span className="text-foreground/75">{label}</span>
    </Eyebrow>
  );
}
