import Link from "next/link";

import { tableRowVariants } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * A LIST BESIDE THE MESSAGE (`density=hybrid`, Will 2026-09-20: "a table for
 * data, a pane for prose").
 *
 * The two inboxes are the half of the portal a table would ruin. An account row
 * is five numbers and belongs in one; a support row is a paragraph somebody
 * wrote, and truncating it to a line makes the table useless for the one thing
 * the inbox is opened for. Nine messages as cards cost about 1,400 pixels and
 * you still could not see the ninth; nine of them as a list beside the one you
 * are reading costs one screen.
 *
 * ★ THE SELECTION IS A URL, NOT STATE. `?id=` means a message is linkable,
 * survives a refresh and a triage write's `revalidatePath`, and needs no client
 * component at all: the whole pane is two server-rendered columns and a set of
 * links. It is also what lets the empty case be honest, because "no message
 * chosen" is simply the absence of a parameter.
 *
 * ★ BELOW `lg` IT STACKS, and choosing a row scrolls to the reading pane rather
 * than replacing the list. Two columns at 900px would be two unreadable
 * columns, and an operator on a phone is reading one message, not triaging
 * nine.
 */

export type InboxPaneItem = {
  id: string;
  /** The row's href, so the page keeps whatever filter it is under. */
  href: string;
  /** Who wrote in. */
  who: string;
  /** The one line that is the point of the message. */
  subject: string;
  /** The first words of the body, truncated by the row. */
  preview: string;
  /** How long it has waited, already in words. */
  waited: string;
  /** Unanswered, in progress, closed: whatever the surface's own chip says. */
  badge?: React.ReactNode;
};

export function InboxPane({
  items,
  selectedId,
  emptyList,
  emptyDetail,
  children,
}: {
  items: InboxPaneItem[];
  selectedId: string | null;
  /** What to say when there is nothing in the list at all. */
  emptyList: string;
  /** What to say when there is a list but nothing is chosen. */
  emptyDetail: string;
  /** The reading pane for the selected item, built by the page. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-float border bg-card lg:flex-row">
      <ul
        data-slot="inbox-list"
        className="w-full shrink-0 border-b lg:max-h-[32rem] lg:w-80 lg:overflow-y-auto lg:border-r lg:border-b-0"
      >
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-working text-muted-foreground">
            {emptyList}
          </li>
        ) : (
          items.map((item) => {
            const current = item.id === selectedId;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={current ? "true" : undefined}
                  data-selected={current}
                  className={cn(
                    tableRowVariants({ interactive: true }),
                    "block px-3 py-2.5 text-working",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{item.who}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-caption text-muted-foreground tabular-nums">
                      {item.badge}
                      {item.waited}
                    </span>
                  </span>
                  <span className="block truncate">{item.subject}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {item.preview}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <div
        data-slot="inbox-detail"
        className="min-w-0 flex-1 p-5 lg:max-h-[32rem] lg:overflow-y-auto"
      >
        {children ?? (
          <p className="text-working text-muted-foreground">{emptyDetail}</p>
        )}
      </div>
    </div>
  );
}
