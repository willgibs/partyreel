import { cn } from "@/lib/utils";

/**
 * The mono caption atom (Track B system layer): Geist Mono for DATA only, the
 * documented utility exception to the two-typeface rule. The mono ruling (R6,
 * restated by Will on 2026-09-02: "I don't want to use mono anywhere except
 * where it aids in tabular layouts") confines it to timecodes, counts, sizes,
 * URLs, step indices and style-and-duration lines; every label, hint and
 * descriptor is `Caption` (Inter, same size and colour). Swept site by site in
 * the library phase, 2026-09-11. Counts/stats use StatBand instead.
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
