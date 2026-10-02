"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCount } from "@/lib/format/count"
import { useHydrated } from "@/lib/shared/use-hydrated"
import { cn } from "@/lib/utils"

/**
 * THE GLYPH COUNT (`event-header` r1's carried call `glyphs`, from Will's note on the code's mark:
 * "the mark keeps the header from getting too crowded with text where icons will likely work 99% of
 * the time, and we could add tooltips to clarify"): an icon and a number, its words on a cursor's
 * hover, on a keyboard's focus and on a tap. The glance is the glyph; the words are there for anyone
 * who asks, on every input.
 *
 * ★ A TAP ANSWERS TOO. The tooltip primitive refuses a tap on purpose (`ui/tooltip`: a finger's
 * focus opens nothing), so a phone would be left with a glyph it cannot ask about. The press is
 * answered here, as the code's corner mark answers it (`event-code-door.tsx`): a tap toggles the
 * words open and shut, Enter and Space do the same, and a cursor's click keeps them open.
 *
 * ★ ITS OWN BUTTON, NAMED BY ITS WORDS. A screen reader hears "214 photos and videos", never a
 * bare "214"; the visible number and its glyph are the button's face and say nothing twice.
 *
 * ★ THE RICH TOOLTIP MOUNTS ONLY AFTER HYDRATION (`architecture.md`: radix tooltips on an SSR'd
 * surface left the host page unhydrated in production): the server's paint carries the browser's
 * own `title`, and the swap is an ordinary later render.
 *
 * It takes its ink from where it stands (`currentColor`), so the same atom reads on paper, in the
 * room and on a photograph (`data-surface="photo"`).
 */
function GlyphCount({
  icon,
  count,
  label,
  className,
  onPointerDown,
  onClick,
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
  const hydrated = useHydrated()
  const [open, setOpen] = React.useState(false)
  // How the press began, and whether the words stood open then: a tap's own pointerleave reaches
  // the tooltip before its click does.
  const press = React.useRef<{ touch: boolean; wasOpen: boolean } | null>(null)

  const face = (
    <button
      type="button"
      data-slot="glyph-count"
      aria-label={label}
      title={hydrated ? undefined : label}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        press.current = {
          touch: event.pointerType !== "mouse",
          wasOpen: open,
        }
        // Radix closes an open tooltip on any press of its trigger; the click below decides instead.
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)
        // Radix's own click closes the tooltip; this one owns what a press does.
        event.preventDefault()
        const began = press.current
        press.current = null
        if (began?.touch) setOpen(!began.wasOpen)
        // A keyboard's Enter or Space toggles, as a tap does; a cursor's click keeps it.
        else if (event.detail === 0) setOpen((o) => !o)
        else setOpen(true)
      }}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-sm tabular-nums outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // A finger's target past the glyph, without growing the line it sits in.
        "before:absolute before:-inset-x-1.5 before:-inset-y-2 before:content-['']",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex shrink-0 [&_svg]:size-3.5 [&_svg]:shrink-0"
      >
        {icon}
      </span>
      <span aria-hidden>{formatCount(count)}</span>
    </button>
  )

  if (!hydrated) return face
  // ★ ITS OWN PROVIDER, at the root's own timing (`providers.tsx`): an atom drawn wherever a head is,
  // never one that throws where a surface (or a test of one) stands outside the app's providers.
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{face}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-60 text-pretty">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { GlyphCount }
