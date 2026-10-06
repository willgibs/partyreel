import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * THE CODE ON ITS WHITE MAT (`event-header` r1, `host=shared`: "the code on its white mat"): a real,
 * scannable code is always drawn on white with its quiet zone, wherever it stands, on paper, in the
 * room or on a photograph, because a code that scans is the code's whole job (`module-floor.ts`, the
 * help article's "never inverted or on a photo"). The mat is that rule as an object.
 *
 * ★ A BUTTON, BECAUSE A MAT IS ALWAYS A DOOR. The hub's code opens its card (and grows into it,
 * `event-share-provider.tsx`'s morph); a mat that opened nothing would be a picture of a code, and
 * that is a different object (`QrRiverPlate`). Its name says what it opens; the caller sets it.
 *
 * ★ DIMMED IS THE CODE'S, NEVER THE MAT'S: where a guest who scans it meets a door that takes no
 * photo (paused, Only me), the modules fade and the white stays, so the mat still reads as the code's
 * place on the page. The words for why live on the caller's corner mark, beside the mat (`children`
 * of the caller, never inside: a mark on the modules or the quiet zone would break the scan).
 *
 * ★ A CARD OF WHITE (identity r2, layers=display): the mat wears the flat card's softer corner (`2xl`)
 * and the LIFT, the small shadow of one object standing on another, rather than a layer's.
 *
 * Its focus and press are the house's (identity r4: `focus-halo`, `press-shrink`), the press a large
 * card's give (0.98), landing at once and letting go on the 150ms below; the hover's grow is held
 * still under reduced motion.
 */
function CodeMat({
  className,
  dimmed = false,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  /** The code's door takes no photo right now: the modules fade, the mat stays white. */
  dimmed?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="code-mat"
      data-dimmed={dimmed ? "" : undefined}
      className={cn(
        "group/code-mat relative block shrink-0 rounded-2xl bg-white p-2 text-neutral-950 shadow-lift outline-none",
        "transition-transform duration-150 ease-emphasis hover:scale-[1.02]",
        "focus-halo press-shrink [--press-scale:0.98]",
        "motion-reduce:transition-none motion-reduce:hover:scale-100",
        className
      )}
      {...props}
    >
      <span
        data-code-dim={dimmed ? "" : undefined}
        className={cn(
          "block transition-opacity duration-200 motion-reduce:transition-none",
          dimmed && "opacity-25"
        )}
      >
        {children}
      </span>
    </button>
  )
}

export { CodeMat }
