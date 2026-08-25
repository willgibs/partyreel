import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The recurring chevron CTA (24-learn-more-hover, marketing.css chapter 2):
 * a Link wearing the mkt-learn hooks with the same spread-arrow chevron
 * DemoCtaLink ships, for every "see more" link on the marketing surfaces.
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
      <span className="mkt-learn-chevron inline-flex" aria-hidden>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path className="mkt-learn-arm mkt-learn-arm-top" d="M6 4L10 8" />
          <path className="mkt-learn-arm mkt-learn-arm-bot" d="M10 8L6 12" />
        </svg>
      </span>
    </Link>
  );
}
