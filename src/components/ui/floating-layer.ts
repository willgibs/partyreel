/**
 * THE FLOATING-LAYER CONTRACT, AS ONE MODULE (bible 15, wired 2026-09-17 from
 * the `floating-surfaces` board's rulings).
 *
 * Bible 15 says every floating surface rides one contract: ONE RADIUS, ONE
 * ENTRANCE, ONE LIGHT. Until this file it was a sentence with `enforcedBy:
 * "review"` under it, and the family drifted exactly as you would expect: the
 * nav shipped `rounded-lg` and a stock shadow (fixed in the 2026-08-28 nav
 * round), `select` shipped `rounded-md border` with no entrance at all, and
 * three panels carried three hand-typed clocks. A rule that lives in nine
 * className strings is a rule nobody can hold.
 *
 * So the contract is a MODULE every floating primitive imports, and
 * `floating-layer.test.ts` refuses a primitive that spells the corner, the
 * entrance or a clock for itself. Retune one line here and the whole layer
 * moves, which is what Will asked for on the corner ("let's go with your pick
 * for now. We can always adjust later once we start implementing everything
 * into the app", 2026-09-17).
 *
 * ★ NO TRANSLUCENCY LIVES HERE, ON PURPOSE. Will picked Card and said of the
 * glass he liked: "I prefer not to create a one-off instance of glass here.
 * Rather, let's bank a near-term agent for a dedicated Glass exploration across
 * marketing and app so it feels more infused to our product." A
 * `backdrop-filter` added to this module would be that one-off, applied to
 * every surface at once. The Glass exploration owns that change.
 */

/**
 * THE CORNER (`radius=nested`, confirmed by `roundness=nested`, 2026-09-17):
 * an 8px panel around 4px rows. The panel keeps the corner it ships,
 * `--radius-float` in globals.css, so the retune is that one token.
 */
export const floatingCorner = "rounded-float"

/**
 * THE ROW'S CORNER, DERIVED, NEVER TYPED. Bible 9 asks a nested corner to share
 * a centre with the one around it: inner = outer minus the gap. The gap is the
 * panel's 4px of padding, so the row is `--radius-float` minus 4px = 4px, which
 * is exactly the pair Will ruled. Today's rows are `rounded-md` (1.6px, off the
 * SHARP general-UI family), so the panel's arc misses its rows' by six times.
 *
 * ★ A ROW'S PADDING AND ITS CORNER ARE ONE DECISION. A group body at `p-1.5`
 * with this corner nests wrongly by 2px; every rail in the family is `p-1` for
 * that reason. Change one and change the other.
 */
export const floatingRow = "rounded-[calc(var(--radius-float)_-_4px)]"

/**
 * THE MATERIAL: opaque popover ink, a hairline ring, and the LAYER shadow (the
 * light board's ruling, 2026-09-17: the larger of the two shadows goes under
 * anything the page keeps living behind). `src/lib/elevation-policy.test.ts`
 * owns the shadow half and this module never re-declares it.
 */
export const floatingSurface =
  "bg-popover text-popover-foreground ring-1 ring-foreground/10"

/** A panel: the corner, the material and the light, in one. */
export const floatingPanel = `${floatingCorner} ${floatingSurface} shadow-layer`

/**
 * THE ENTRANCE LANGUAGE for a surface that opens BESIDE a trigger or in the
 * middle of the screen: a fade, a hair of scale, and 8px of travel from the
 * side it is anchored to, all on `--ease-emphasis`.
 *
 * ★ THE LANGUAGE IS SHARED AND THE CLOCK IS NOT, which is how bible 15 and
 * bible 12 stop disagreeing. Read 15 as one entrance LANGUAGE with 12 setting
 * the speed inside it, and `entrance=by-frequency` (Will, 2026-09-17) is a
 * choice of clock per surface rather than a stray entrance. Every surface still
 * arrives the same WAY; the ones a host opens fifty times a night simply get
 * there sooner.
 *
 * ★ THE TOOLTIP HAS THREE OPEN STATES AND `open` IS THE RARE ONE. Radix writes
 * `delayed-open` when the group delay ran and `instant-open` when it did not (a
 * keyboard focus, or a second tooltip inside the skip-delay window), so a
 * language that lists only `open` leaves a focused tooltip arriving with no
 * animation at all: measured here, `animation-name: none`. All three are
 * listed, and the two the other surfaces never take cost nothing, because
 * Tailwind emits one rule per candidate and shares it.
 */
export const floatingEntrance = [
  "ease-emphasis",
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
  "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
  "data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:zoom-in-95",
  "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
  "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
].join(" ")

/**
 * THE ENTRANCE LANGUAGE for a surface that travels in from an EDGE of the
 * viewport: the same fade, no scale (a full-height panel that scales reads as a
 * zoom of the page), a long slide from its own side, on `--ease-drawer`. A
 * sheet is a different KIND of arrival, not a different dialect of the same
 * one, which is why it is a second constant rather than a variant of the first.
 */
export const floatingEdgeEntrance = [
  "ease-drawer",
  "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  "data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=bottom]:data-closed:slide-out-to-bottom-10",
  "data-[side=top]:data-open:slide-in-from-top-10 data-[side=top]:data-closed:slide-out-to-top-10",
  "data-[side=left]:data-open:slide-in-from-left-10 data-[side=left]:data-closed:slide-out-to-left-10",
  "data-[side=right]:data-open:slide-in-from-right-10 data-[side=right]:data-closed:slide-out-to-right-10",
].join(" ")

/**
 * THE THREE CLOCKS, CHOSEN BY HOW OFTEN A SURFACE IS OPENED (bible 12's
 * frequency law; `entrance=by-frequency`, Will 2026-09-17). Every exit is
 * faster than its entrance, which is the house rule the whole site already
 * keeps. Which surface takes which, and why, is written at each call site, so
 * the reason lives where the decision is read.
 */
export const floatingClock = {
  /**
   * Opened dozens of times an hour, often by accident: the tooltip, every
   * dropdown menu and its submenu, the select. Rule 12's "high-frequency
   * instant": at 175ms a host flipping through four events waits a fifth of a
   * second, four times, for furniture they already know the shape of.
   */
  instant: "duration-[90ms] data-closed:duration-[70ms]",
  /**
   * Opened a few times a session, and worth a beat: a popover you asked for,
   * a dialog that wants a decision, the marketing nav's panel. Rule 12's
   * "occasional standard, under 300ms". This is the beat Will kept for the
   * dialog when he chose by-frequency.
   */
  standard: "duration-200 data-closed:duration-150",
  /**
   * A whole surface crossing the screen from an edge. Rare, and the one place
   * in the family where the motion itself is the affordance: the distance is
   * what says "this came from over there, and it goes back".
   */
  edge: "duration-300 data-closed:duration-200",
} as const
