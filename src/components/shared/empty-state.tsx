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
            "text-sm font-medium",
            variant === "quiet" && "font-heading text-lg font-normal",
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
