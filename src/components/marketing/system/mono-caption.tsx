import { cn } from "@/lib/utils";

/**
 * The mono caption atom (Track B system layer): Geist Mono for timecodes, credits,
 * and factual captions — the documented utility exception to the two-typeface rule.
 * Counts/stats use StatBand instead (tabular-nums + the count motion).
 */
export function MonoCaption({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-mono text-xs tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
