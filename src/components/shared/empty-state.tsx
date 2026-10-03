import type { LucideIcon } from "lucide-react";

import { Empty } from "@/components/ui/empty";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA (e.g. a <Button>) rendered below the copy. */
  action?: React.ReactNode;
  /**
   * "icon" (the default): the glyph in its lens. "quiet": the title and the
   * line alone; what makes it quiet is the missing glyph, never a lighter title.
   */
  variant?: "quiet" | "icon";
  className?: string;
};

/**
 * Neutral placeholder for empty galleries, dashboards, and lists: the one
 * empty place (`ui/empty.tsx`, identity r2's `one-empty`), never a dashed box.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "icon",
  className,
}: EmptyStateProps) {
  return (
    <Empty
      icon={variant === "icon" && Icon ? <Icon /> : undefined}
      title={title}
      line={description}
      action={action}
      className={className}
    />
  );
}
