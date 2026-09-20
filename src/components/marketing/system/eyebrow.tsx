import { cn } from "@/lib/utils";

/**
 * The section eyebrow atom (Track B system layer): Inter 500, uppercase, muted,
 * on the LABEL STEP (Will, `body-type` r1, 2026-09-20: `label=12-08`, "I think
 * the tighter spacing looks better ... leaning towards 12px for now since we're
 * a consumer product, may drop this to 11px in the future"). It wore 12 on
 * 0.14em; the size is unchanged and the tracking halves.
 *
 * ★ NO `tracking-*` HERE, AND NONE FROM A CALLER. The step carries the 0.08em,
 * and a tracking utility BEATS a step through --tw-tracking, silently — which
 * is how 38 eyebrows came to spell their own 0.14em by hand in the first place.
 * The heading face stays Urbanist (SectionShell owns that).
 */
export function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-label font-medium text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
