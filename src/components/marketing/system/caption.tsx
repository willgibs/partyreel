import { cn } from "@/lib/utils";

/**
 * The ONE caption atom, on the body face: a label, a hint or a descriptor
 * under a specimen or beside a control, and, since the kill-mono sweep
 * (Will, 2026-09-14: "kill mono entirely"), the data too. `MonoCaption` was
 * its sibling for timecodes, counts, sizes and URLs; it is gone, and a
 * caption that carries figures takes `tabular-nums` so a column of them
 * still lines up. Never re-introduce a second face here.
 */
export function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props} />
  );
}
