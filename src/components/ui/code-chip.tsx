import * as React from "react"
import { QrCode } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * THE CODE AS A CHIP (`event-header` r1, `host=shared`): where a bar has no room for a scannable
 * code (the hub's sticky band once the head has scrolled away), the code stands as its glyph on the
 * same white it always stands on, and a press opens the real one.
 *
 * ★ NEVER A SHRUNKEN CODE. Under the module floor a code cannot scan (`module-floor.ts`), and
 * `StyledQr` refuses to draw one that small, so a thumbnail that looked like a code would be a code
 * that does not work. The glyph says "the code is here"; the card it opens is the code.
 *
 * ★ ITS NAME SAYS WHAT IT OPENS (the caller's `aria-label`, "Show the code for Maya & Jay"), and a
 * corner mark rides on it as `children` (the door's glyph, outside the white).
 *
 * The bar's own height (`h-9`, the stuck room pills'), so the chip sits in a row of pills as one.
 */
function CodeChip({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="code-chip"
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-950 shadow-layer ring-1 ring-black/10 outline-none",
        "transition-transform duration-150 ease-emphasis hover:scale-[1.04] active:scale-[0.97]",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        className
      )}
      {...props}
    >
      <QrCode className="size-4.5" aria-hidden />
      {children}
    </button>
  )
}

export { CodeChip }
