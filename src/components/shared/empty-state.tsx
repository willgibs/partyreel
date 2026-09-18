import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA (e.g. a <Button>) rendered below the copy. */
  action?: React.ReactNode;
  /**
   * "quiet" (default): typographic, no icon chip - the V1 mono treatment.
   * "icon": the legacy icon-in-a-circle treatment, kept for surfaces that
   * lean on the pictogram (existing call sites pass `icon` and get it).
   */
  variant?: "quiet" | "icon";
  className?: string;
};

/** Neutral placeholder for empty galleries, dashboards, and lists. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "icon",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {variant === "icon" && Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1.5">
        <h3
          className={cn(
            // An empty state's title is a heading in BOTH variants, so both
            // wear the ladder's `subsection` step, the app's quiet middle. The
            // icon variant's used to stay Inter at a stock 14px as "a label",
            // but it names the state from inside an h3, and every heading is on
            // the ladder (Will, 2026-09-18: no one-off sizes). The quiet
            // variant keeps the lighter weight it was drawn with.
            "font-heading text-subsection",
            variant === "quiet" && "font-normal",
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
