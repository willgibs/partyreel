import * as React from "react"
import { Check, ImageUp } from "lucide-react"

import { formatCount } from "@/lib/format/count"
import { cn } from "@/lib/utils"

import "./shutter.css"

/**
 * THE SHUTTER (`event-header` r1, `stays=shutter`): the album's one round Add, standing at the foot's
 * centre once the head has scrolled away, in the album's light; while her photographs go, its ring is
 * their progress. A camera's gesture: the least over the photographs, and the thumb's reach.
 *
 * ★ THE CONTRACT'S HOOKS (identity r2 styles exactly these): `data-slot="shutter"`, `data-state`
 * `idle`, `sending` or `done`, and the run's progress in `--progress` (0 to 1). Nothing else of its
 * look is anyone's to reach for.
 *
 * ★ THE STATES ARE THE CALLER'S, THE LOOK IS THE ATOM'S. `sending` while a run goes (the light fills
 * round as `progress` grows, the count of files still on their way on its shoulder), `done` for the
 * beat after a run lands (the ring whole, a check on the face), then `idle` again. It never guesses
 * a state from its props, so a page can hold `done` exactly as long as it wants it seen.
 *
 * ★ STILL A BUTTON IN EVERY STATE: pressing it while files go adds more (the queue takes them in
 * turn), so `sending` never disables it. Its name is the caller's `aria-label`, which says the count
 * too ("Add photos, 3 sending"): the ring is a picture, and the words carry it for anyone who cannot
 * see it.
 *
 * Its light is the album's own hues (`hues`, three oklch hue angles: the door's lamp, `door-light.ts`),
 * in the ground's register (`shutter.css`). The face is the ink (`primary`), so on paper it is the
 * page's darkest point and in the room its brightest.
 */
type ShutterState = "idle" | "sending" | "done"

/** The house light the atom wears where nobody hands it the album's (the door's own first three). */
const HOUSE: readonly number[] = [25, 85, 155]

function Shutter({
  state = "idle",
  progress = 0,
  count = 0,
  hues = HOUSE,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  state?: ShutterState
  /** The run's progress, 0 to 1 (read while `sending`; `done` is always whole). */
  progress?: number
  /** Files still on their way, worn on the shoulder while `sending`. */
  count?: number
  /** The album's light: hue angles, the first three read. */
  hues?: readonly number[]
}) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  const h = hues.length >= 3 ? hues : HOUSE
  return (
    <button
      type="button"
      data-slot="shutter"
      data-state={state}
      style={
        {
          "--progress": p,
          "--shutter-h1": h[0],
          "--shutter-h2": h[1],
          "--shutter-h3": h[2],
          ...style,
        } as React.CSSProperties
      }
      // ★ THE HOUSE'S FOCUS AND PRESS (identity r4): the halo stands beyond the
      // shutter's own light and the whole control gives under the finger, its
      // light with it (`shutter.css` names how far, and the give).
      className={cn(
        "shutter group/shutter relative isolate inline-flex size-16 shrink-0 items-center justify-center rounded-full outline-none focus-halo press-shrink",
        className
      )}
      {...props}
    >
      <span aria-hidden className="shutter-glow" />
      <span aria-hidden className="shutter-ring">
        <span className="shutter-track" />
        <span className="shutter-fill" />
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-layer",
          "transition-transform duration-150 ease-emphasis group-hover/shutter:scale-[1.03]",
          "motion-reduce:transition-none motion-reduce:group-hover/shutter:scale-100"
        )}
      >
        {state === "done" ? (
          <Check className="size-6" strokeWidth={2.5} />
        ) : (
          (children ?? <ImageUp className="size-6" />)
        )}
      </span>
      {state === "sending" && count > 0 && (
        <span
          aria-hidden
          data-slot="shutter-count"
          className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-micro font-semibold text-background tabular-nums ring-2 ring-background"
        >
          {formatCount(count)}
        </span>
      )}
    </button>
  )
}

export { Shutter, type ShutterState }
