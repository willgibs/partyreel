import { cn } from "@/lib/utils";

/**
 * The ONE caption atom, on the body face: a label, a hint or a descriptor
 * under a specimen or beside a control, and, since the kill-mono sweep
 * (Will, 2026-09-14: "kill mono entirely"), the data too. `MonoCaption` was
 * its sibling for timecodes, counts, sizes and URLs; it is gone, and a
 * caption that carries figures takes `tabular-nums` so a column of them
 * still lines up. Never re-introduce a second face here.
 *
 * It wears the CAPTION STEP (`body-type` r1, 2026-09-20), which is the same 12
 * it wore as `text-xs` — the rung did not move, it got a name. What the name
 * buys: the step carries its own 16px leading and +0.005em, so a caption no
 * longer inherits whatever the page happened to set, and `cn()` can resolve it
 * against another step instead of stacking two sizes.
 */
export function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-caption text-muted-foreground", className)}
      {...props}
    />
  );
}
