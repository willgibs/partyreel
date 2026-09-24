import Link from "next/link";

import { LIST_PAGE } from "@/lib/admin/list-depth";

/**
 * The line under a bounded operator list (`list-depth.ts`): how deep it reads, and the link one
 * page deeper. Nothing at all when the list is complete, so a short inbox reads as the whole inbox.
 * `scroll={false}` keeps the operator where they were: the list grows beneath them.
 */
export function ShowMoreLine({
  shown,
  more,
  href,
}: {
  /** How many the list shows now. */
  shown: number;
  /** Whether the list holds more than it shows. */
  more: boolean;
  /** The same page one `LIST_PAGE` deeper. */
  href: string;
}) {
  if (!more) return null;
  return (
    <p className="text-caption text-muted-foreground">
      Showing the newest {shown.toLocaleString("en-US")}.{" "}
      <Link
        href={href}
        scroll={false}
        className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
      >
        Show {LIST_PAGE} more
      </Link>
    </p>
  );
}
