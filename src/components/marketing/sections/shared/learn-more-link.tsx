import Link from "next/link";

import { cn } from "@/lib/utils";

import { LearnChevron } from "./learn-chevron";

/**
 * The recurring chevron CTA (24-learn-more-hover, marketing.css chapter 2):
 * a Link wearing the mkt-learn hooks with the spread-arrow chevron atom
 * (`LearnChevron`, which DemoCtaLink wears too), for every "see more" link on
 * the marketing surfaces.
 * Pure CSS motion; hover-only by design (the rest state carries everything).
 */
export function LearnMoreLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
        className,
      )}
    >
      {children}
      <LearnChevron />
    </Link>
  );
}
