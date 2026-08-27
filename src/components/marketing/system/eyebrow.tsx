import { cn } from "@/lib/utils";

/**
 * The section eyebrow atom (Track B system layer): Inter 500, uppercase, tracked,
 * muted. Small labels get positive tracking per the design system's small-type
 * rule; the heading face stays Urbanist (SectionShell owns that).
 */
export function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
