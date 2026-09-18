import { cn } from "@/lib/utils";

/**
 * One key cap. Server-safe and deliberately quiet: a shortcut legend is a hint,
 * never a control, so it reads at the weight of a caption rather than a button.
 */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border border-border bg-muted/60 px-1 text-[10px] leading-none font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
