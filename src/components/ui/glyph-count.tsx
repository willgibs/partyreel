"use client"

import * as React from "react"

import { TapTooltip } from "@/components/ui/tooltip"
import { formatCount } from "@/lib/format/count"
import { cn } from "@/lib/utils"

/**
 * THE GLYPH COUNT (`event-header` r1's carried call `glyphs`, from Will's note on the code's mark:
 * "the mark keeps the header from getting too crowded with text where icons will likely work 99% of
 * the time, and we could add tooltips to clarify"): an icon and a number, its words on a cursor's
 * hover, on a keyboard's focus and on a tap. The glance is the glyph; the words are there for anyone
 * who asks, on every input.
 *
 * ★ A TAP ANSWERS TOO. The tooltip primitive refuses a tap on purpose (`ui/tooltip`: a finger's
 * focus opens nothing), so a phone would be left with a glyph it cannot ask about. It wears
 * `TapTooltip`, the one press model: a tap toggles the words open and shut, Enter and Space do the
 * same, and a cursor's click keeps them open. Its hydration rule and its gutter at the glass are
 * the primitive's too.
 *
 * ★ ITS OWN BUTTON, NAMED BY ITS WORDS. A screen reader hears "214 photos and videos", never a
 * bare "214"; the visible number and its glyph are the button's face and say nothing twice.
 *
 * ★ ITS NUMBER IS A HOOK, `data-n`, the contract's (identity's lab sheets style
 * `[data-slot="glyph-count"] [data-n]`; a rule that names a hook the atom does not draw reaches
 * nothing, and says nothing). The glyph has none of its own: it is the button's `svg`. Listed with the
 * head's other hooks in `design-system.md`.
 *
 * ★ A READOUT BESIDE ITS GLYPH (identity r2: voice=camera, status=lights): the number is what a
 * camera prints, on the house's `label` step, semibold, in tabular figures, in the ground's ink, and
 * the glyph beside it sits a step back in the muted grey, so the count is what the eye lands on. On
 * a photograph (`data-surface="photo"`, the contract's hook) both are white. Focus is a ring round
 * the whole count, the light's own shape.
 */
function GlyphCount({
  icon,
  count,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /**
   * The glyph, as an element (`<Images />`): an element crosses from a server page to this client
   * atom where a component would not, and the atom sizes it.
   */
  icon: React.ReactNode
  /** The number the glyph stands beside (formatted here, grouped as the site groups). */
  count: number
  /** Its words, the whole sentence ("214 photos and videos"): the tooltip and the button's name. */
  label: string
}) {
  return (
    <TapTooltip words={label} side="bottom">
      <button
        type="button"
        data-slot="glyph-count"
        aria-label={label}
        className={cn(
          "relative inline-flex shrink-0 items-center gap-1.5 rounded-full tabular-nums outline-none",
          "focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-foreground focus-visible:outline-solid",
          // A finger's target past the glyph, without growing the line it sits in.
          "before:absolute before:-inset-x-1.5 before:-inset-y-2 before:content-['']",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className="flex shrink-0 text-muted-foreground in-data-[surface=photo]:text-white [&_svg]:size-3.5 [&_svg]:shrink-0"
        >
          {icon}
        </span>
        <span
          aria-hidden
          data-n=""
          className="text-label font-semibold text-foreground uppercase tabular-nums in-data-[surface=photo]:text-white"
        >
          {formatCount(count)}
        </span>
      </button>
    </TapTooltip>
  )
}

export { GlyphCount }
