import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The inline link inside legal text. One class string, hoisted, so the two
 * content modules never carry their own copy of it. External hrefs (mailto,
 * https) fall back to a plain anchor.
 */
export const LEGAL_INLINE_LINK =
  "underline underline-offset-2 text-foreground/80 transition-colors duration-150 hover:text-foreground";

export function LegalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(LEGAL_INLINE_LINK, className);
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}
