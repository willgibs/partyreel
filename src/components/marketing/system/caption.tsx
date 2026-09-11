import { cn } from "@/lib/utils";

/**
 * The caption atom, in Inter: a label, a hint or a descriptor under a
 * specimen or beside a control. The mono ruling (R6, restated by Will on
 * 2026-09-02: "I don't want to use mono anywhere except where it aids in
 * tabular layouts") gives `MonoCaption` the DATA (timecodes, counts, sizes,
 * URLs, indices) and this atom everything that reads as a sentence. Same
 * size and colour as its sibling, so swapping one for the other changes the
 * face and nothing else.
 */
export function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props} />
  );
}
