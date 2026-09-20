import Link from "next/link";

import { tableRowVariants } from "@/components/ui/table";
import { waitedLabel, type QueueItem } from "@/lib/admin/queue";
import { cn } from "@/lib/utils";

/**
 * WHAT IS WAITING ON YOU, worst first (`home=kpi`, Will 2026-09-20: the same
 * queue the console option drew, sitting under the figures).
 *
 * Five columns, in the order an operator reads them: what KIND of thing it is,
 * what it is, how long it has waited, and the one thing to do about it. The
 * nine-card grid this replaces answered "where do I click", which the rail and
 * the palette now answer twice over; nothing in it could say that a failed
 * purge outranks a press enquiry.
 *
 * ★ IT SHARES THE TABLE'S ROW TREATMENT RATHER THAN OWNING A SECOND ONE. These
 * are `<li>`s and not `<tr>`s (a queue is a list of different kinds of thing,
 * not a grid of one kind), but a failed job has to tint the same way here as it
 * does on /admin/jobs, so the tone rules come from `tableRowVariants` and the
 * row simply says which tone it is.
 */
export function QueueList({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-float border bg-card px-4 py-8 text-center">
        <p className="text-working font-medium">Nothing is waiting on you</p>
        <p className="mt-1 text-caption text-muted-foreground">
          Every inbox is clear and every backend job is healthy.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-float border bg-card">
      {items.map((item) => (
        <li
          key={item.id}
          data-tone={item.tone}
          className={cn(
            tableRowVariants(),
            "flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-working",
          )}
        >
          <span className="w-20 shrink-0 text-caption text-muted-foreground">
            {item.kindLabel}
          </span>
          <span className="min-w-0 flex-1 basis-48">
            <span className="font-medium">{item.what}</span>
            <span className="ml-2 text-muted-foreground">{item.detail}</span>
          </span>
          <span className="w-14 shrink-0 text-right text-caption text-muted-foreground tabular-nums">
            {waitedLabel(item.waitedMs)}
          </span>
          <Link
            href={item.action.href}
            className="w-36 shrink-0 text-right text-caption font-medium underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
          >
            {item.action.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
