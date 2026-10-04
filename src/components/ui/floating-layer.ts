/**
 * THE FLOATING-LAYER CONTRACT, AS ONE MODULE (wired from
 * the `floating-surfaces` board).
 *
 * Every floating surface rides one contract: ONE RADIUS, ONE
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
 * ★ NO TRANSLUCENCY HERE YET. Will picked Card's opaque material and banked
 * the glass he liked for a dedicated Glass exploration across marketing and
 * app, so that glass arrives as one material the product wears rather than a
 * one-off. A `backdrop-filter` added to this module first would be exactly that
 * one-off, applied to every floating surface at once, so the Glass exploration
 * (ROADMAP) owns that change. Nothing refuses one: this is guidance.
 */

/**
 * THE CORNER (`radius=nested`, confirmed by `roundness=nested`, 2026-09-17):
 * a 16px panel around 12px rows, the display's (identity r2, layers=display).
 * The panel keeps the corner it ships, `--radius-float` in globals.css, so the
 * retune is that one token (the display moved it from 12 to 16 and the rows
 * came along from 8 to 12, which is the derivation below doing its job).
 *
 * Two corners derive from the same token, so the family still moves as one:
 * a tooltip's capsule, 6px tighter, so a label a line high reads as a label
 * rather than a pill (`floatingTipCorner`, the display's 10px); and a WORK
 * layer's (a dialog, a panel, a sheet), a quarter rounder, since a host works
 * inside it and it is a size up (the display's 20px). A work layer's corner is
 * spelled where its shape is (`floatingPopupShapes`, the responsive sheet
 * below) as `calc(var(--radius-float)*1.25)`, because a class must be whole in
 * the source for Tailwind to find it.
 */
export const floatingCorner = "rounded-float"

/** A tooltip's corner: see the corner above. */
export const floatingTipCorner = "rounded-[calc(var(--radius-float)_-_6px)]"

/**
 * THE ROW'S CORNER, DERIVED, NEVER TYPED. A nested corner shares
 * a centre with the one around it: inner = outer minus the gap. The gap is the
 * panel's 4px of padding, so the row is `--radius-float` minus 4px, which is
 * exactly the pair chosen. The rows before the floating wiring were
 * `rounded-md` (a step of the surface corner, 1.6px then), so the panel's arc
 * missed its rows' by six times.
 *
 * ★ A ROW'S PADDING AND ITS CORNER ARE ONE DECISION. A group body at `p-1.5`
 * with this corner nests wrongly by 2px; every rail in the family is `p-1` for
 * that reason. Change one and change the other.
 */
export const floatingRow = "rounded-[calc(var(--radius-float)_-_4px)]"

/**
 * THE GUTTER A LAYER KEEPS FROM THE GLASS (`collisionPadding`, in px): the
 * menus' own 8, so a layer opened beside a control at the edge of a phone (the
 * storage ring's popover at 375) is shifted clear of the edge, never flush to
 * it. The popover, a submenu, the responsive menu and the words of a
 * `TapTooltip` read this one number; a layer with a reason of its own names it.
 */
export const floatingGutter = 8

/**
 * TWO MATERIALS, BY WHAT A LAYER IS FOR (identity r2, layers=display, wired
 * 2026-10-03). Both opaque, both under the LAYER shadow (the light board's
 * rule: the larger of the two shadows goes under anything the page keeps
 * living behind), whose value is the ground's own.
 *
 * THE DISPLAY, for the QUICK layers, what a press opens and the next press
 * closes (a menu, a popover, a select, the Add's rows, the palette; the
 * tooltip and the toast wear it too): the camera's own screen, near-black on
 * paper and lit graphite in the room (`.surface-display` in globals.css
 * re-declares every token inside it from the ground's own `--display*` set),
 * parted from the room by its light and its edge.
 */
export const floatingDisplay =
  "surface-display bg-popover text-popover-foreground ring-1 ring-border"

/** A quick panel: the corner, the display and the light, in one. */
export const floatingDisplayPanel = `${floatingCorner} ${floatingDisplay} shadow-layer`

/** A tooltip: a capsule's corner, the display and the light. */
export const floatingTip = `${floatingTipCorner} ${floatingDisplay} shadow-layer`

/**
 * THE BODY'S OWN, for a panel that is not a quick choice (the marketing nav's
 * panel, the code card): the ground's popover ink and a hairline ring. A WORK
 * layer (`PopupContent`, the Dialog, the Sheet) stands on the same ink with no
 * ring at all, a host's room set off by its overlay (`floatingWorkSurface`).
 */
export const floatingSurface =
  "bg-popover text-popover-foreground ring-1 ring-foreground/10"

/** A body panel: the corner, the material and the light, in one. */
export const floatingPanel = `${floatingCorner} ${floatingSurface} shadow-layer`

/** A work layer's material and light; its corner is its shape's. */
export const floatingWorkSurface =
  "bg-popover text-popover-foreground shadow-layer"

/**
 * THE SCRIM UNDER A WORK LAYER (layers=display): the page dimmed by half and
 * left sharp, so the room a host works in is the one lit thing (the display's
 * overlay; a blur behind an opaque layer was a cost paid every frame for a
 * difference nobody reads through a half-black scrim).
 */
export const floatingScrim = "bg-black/50"

/**
 * THE ENTRANCE LANGUAGE for a surface that opens BESIDE a trigger or in the
 * middle of the screen: a fade, a hair of scale, and 8px of travel from the
 * side it is anchored to, all on `--ease-emphasis`.
 *
 * ★ THE LANGUAGE IS SHARED AND THE CLOCK IS NOT: one entrance LANGUAGE with
 * the frequency rule setting
 * the speed inside it, and `entrance=by-frequency` is a
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
 * THE ONE RESPONSIVE SHEET (`settings=sheet`, Will 2026-09-20: "we likely want
 * to apply this sheet concept everywhere"). A side panel at a desk and a bottom
 * sheet in a hand are the SAME surface answering the same question about reach
 * — a thumb is at the bottom of a phone, a cursor is at the side of a laptop —
 * so they are one entrance here rather than two sheets in the product.
 *
 * ★ OPT-IN, AND NAME-SCOPED UNDER A SIDE OF ITS OWN. A sheet that opts in emits
 * `data-side="responsive"`, which NONE of the four fixed-side rules above
 * match, so this constant owns its position and its entrance outright at both
 * widths with no specificity race. The default `side` is untouched, which is
 * what `marketing/chrome/mobile-menu.tsx` and the design shell keep drawing.
 *
 * ★ THE CORNER IS THE FAMILY'S TOKEN, not one of its own. A bottom sheet's top
 * edge is the only edge of it that is not the viewport's, so that edge, and
 * only that edge, takes a work layer's corner (`--radius-float` a quarter
 * rounder, see THE CORNER); a desk's panel takes it on the edge it opens from.
 * Neither draws a line where it stands (layers=display): the overlay sets it
 * off, as it does the popup's own panel and sheet.
 *
 * ★ IT STANDS ON THE KEYBOARD (door-flow: the door's sheet "feels super buggy
 * when the mobile keyboard opens to type"). The sheet writes `--kb-inset`,
 * `--vv-h` and `--vv-top` on itself only while a text field inside it holds
 * focus on a touch screen (`src/lib/use-keyboard-inset.ts`). The phone half's
 * foot sits on the keyboard's top edge and its ceiling is the visible area less
 * 12px; the desk half, which a landscape phone reaches by width, spans exactly
 * the visible band between the top of the visual viewport and the keyboard.
 * With no field focused every variable falls back to exactly the posture every
 * sheet had before: `bottom: 0`, `85svh` (always the smaller of the two
 * ceilings), and a panel from `top: 0` to `bottom: 0`.
 *
 * ★ THE LIFT GLIDES ON `bottom`, `top` AND `max-height` ALONE, together (the
 * ceiling snapping while the foot glides would drop the sheet's top edge for a
 * frame before it rose: measured on an iPhone SE), spelled as the whole
 * `transition` shorthand on purpose. A `duration-*` or `ease-*` utility here
 * would also set `--tw-duration` / `--tw-ease`, which the entrance KEYFRAMES
 * read, and retime every sheet's arrival; the shorthand leaves both alone (the
 * entrance never used a transition on this element, so nothing else is taken
 * from it).
 */
export const floatingEdgeEntranceResponsive = [
  "data-[side=responsive]:max-sm:inset-x-0 data-[side=responsive]:max-sm:top-auto data-[side=responsive]:max-sm:bottom-[var(--kb-inset,0px)] data-[side=responsive]:max-sm:h-auto data-[side=responsive]:max-sm:max-h-[min(85svh,calc(var(--vv-h,100svh)_-_12px))] data-[side=responsive]:max-sm:w-full",
  "data-[side=responsive]:[transition:bottom_200ms_var(--ease-emphasis),top_200ms_var(--ease-emphasis),max-height_200ms_var(--ease-emphasis)]",
  "data-[side=responsive]:max-sm:rounded-t-[calc(var(--radius-float)*1.25)]",
  "data-[side=responsive]:sm:top-[var(--vv-top,0px)] data-[side=responsive]:sm:bottom-[var(--kb-inset,0px)] data-[side=responsive]:sm:right-0 data-[side=responsive]:sm:h-auto data-[side=responsive]:sm:w-3/4 data-[side=responsive]:sm:max-w-md data-[side=responsive]:sm:rounded-l-[calc(var(--radius-float)*1.25)]",
  "data-[side=responsive]:max-sm:data-open:slide-in-from-bottom-10 data-[side=responsive]:max-sm:data-closed:slide-out-to-bottom-10",
  "data-[side=responsive]:sm:data-open:slide-in-from-right-10 data-[side=responsive]:sm:data-closed:slide-out-to-right-10",
].join(" ")

/**
 * THE POPUP'S SHAPES (`popups` r1, 2026-09-27): every place one Radix Dialog
 * element can stand, each scoped to its own `data-shape`, which the one table
 * (`popup-kinds.ts`) picks per kind and per width. The Dialog wears `dialog`
 * always; `PopupContent` wears whatever its kind's row says.
 *
 * ★ ONE ATTRIBUTE, SET BY THE ELEMENT FOR THE WIDTH IT IS AT, rather than a
 * pair of media-prefixed postures. A popup mounts only on the client (Radix
 * portals it after hydration), so it can read the breakpoint when it opens, and
 * every rule below is then one selector with no media query: none of them can
 * race another for a property, and `floating-layer.test.ts` refuses a rule
 * that is not scoped to a shape of its own.
 *
 * ★ EVERY SHAPE STANDS IN WHAT THE KEYBOARD LEAVES (`keyboard-dialog`: "the
 * Dialog learns the Sheet's keyboard rule"). `useKeyboardInset` writes
 * `--kb-inset`, `--vv-h` and `--vv-top` only while a text field inside holds
 * focus on a touch screen, and every fallback below is exactly the resting
 * posture: a centred shape's `top` is `var(--vv-top) + var(--vv-h) / 2`, which
 * with nothing written is `0 + 100% / 2`, the `top-1/2` the Dialog always had,
 * and with the keyboard up is the middle of the band above it (the old Dialog
 * centred in the layout viewport, so on a phone its lower half sat under the
 * keyboard: the account's password, Report a person's reason). The edge shapes
 * stand on the keyboard's top edge, as the Sheet does.
 *
 * ★ THE LIFT GLIDES ON THE SHEET'S OWN TERMS (see the responsive sheet above):
 * the whole `transition` shorthand, so the entrance keyframes keep their clock.
 *
 * The shapes, by width: a desk has `dialog`, `wide` and `panel`; a hand has
 * `dialog`, `screen`, `cover` and `sheet`.
 */
export const floatingPopupShapes = [
  // dialog: centred, sized to what it says (`data-size`), capped and scrolled.
  "data-[shape=dialog]:top-[calc(var(--vv-top,0px)_+_var(--vv-h,100%)_/_2)] data-[shape=dialog]:left-1/2 data-[shape=dialog]:w-[calc(100%_-_2rem)] data-[shape=dialog]:max-h-[calc(var(--vv-h,100%)_-_2rem)] data-[shape=dialog]:-translate-x-1/2 data-[shape=dialog]:-translate-y-1/2",
  "data-[shape=dialog]:max-w-sm data-[shape=dialog]:data-[size=md]:max-w-md data-[shape=dialog]:data-[size=lg]:max-w-xl",
  // A work layer draws no line of its own (layers=display): its corner is a
  // quarter rounder than a quick layer's, and the overlay sets it off.
  "data-[shape=dialog]:rounded-[calc(var(--radius-float)*1.25)]",
  "data-[shape=dialog]:ease-emphasis data-[shape=dialog]:duration-200 data-[shape=dialog]:data-closed:duration-150 data-[shape=dialog]:data-open:zoom-in-95 data-[shape=dialog]:data-closed:zoom-out-95",
  "data-[shape=dialog]:[transition:top_200ms_var(--ease-emphasis),max-height_200ms_var(--ease-emphasis)]",
  // wide: the dialog, wide enough for a plan's cards stacked (a desk only).
  "data-[shape=wide]:top-[calc(var(--vv-top,0px)_+_var(--vv-h,100%)_/_2)] data-[shape=wide]:left-1/2 data-[shape=wide]:w-[calc(100%_-_2rem)] data-[shape=wide]:max-w-xl data-[shape=wide]:max-h-[calc(var(--vv-h,100%)_-_4rem)] data-[shape=wide]:-translate-x-1/2 data-[shape=wide]:-translate-y-1/2",
  "data-[shape=wide]:rounded-[calc(var(--radius-float)*1.25)]",
  "data-[shape=wide]:ease-emphasis data-[shape=wide]:duration-200 data-[shape=wide]:data-closed:duration-150 data-[shape=wide]:data-open:zoom-in-95 data-[shape=wide]:data-closed:zoom-out-95",
  "data-[shape=wide]:[transition:top_200ms_var(--ease-emphasis),max-height_200ms_var(--ease-emphasis)]",
  // panel: beside the screen from its right edge (the responsive sheet's desk half).
  "data-[shape=panel]:top-[var(--vv-top,0px)] data-[shape=panel]:bottom-[var(--kb-inset,0px)] data-[shape=panel]:right-0 data-[shape=panel]:w-3/4 data-[shape=panel]:max-w-md data-[shape=panel]:rounded-l-[calc(var(--radius-float)*1.25)]",
  "data-[shape=panel]:ease-drawer data-[shape=panel]:duration-300 data-[shape=panel]:data-closed:duration-200 data-[shape=panel]:data-open:slide-in-from-right-10 data-[shape=panel]:data-closed:slide-out-to-right-10",
  "data-[shape=panel]:[transition:top_200ms_var(--ease-emphasis),bottom_200ms_var(--ease-emphasis)]",
  // screen: the whole screen, pushed in from the right like any screen a phone
  // opens under a back arrow. Opaque page ground: it is a screen, not a layer.
  "data-[shape=screen]:inset-x-0 data-[shape=screen]:top-[var(--vv-top,0px)] data-[shape=screen]:bottom-[var(--kb-inset,0px)] data-[shape=screen]:bg-background data-[shape=screen]:shadow-none",
  "data-[shape=screen]:ease-drawer data-[shape=screen]:duration-300 data-[shape=screen]:data-closed:duration-200 data-[shape=screen]:data-open:slide-in-from-right-10 data-[shape=screen]:data-closed:slide-out-to-right-10",
  "data-[shape=screen]:[transition:top_200ms_var(--ease-emphasis),bottom_200ms_var(--ease-emphasis)]",
  // cover: the whole screen, risen from the foot like any screen a phone
  // presents over what was there (a plan, met in the middle of something).
  "data-[shape=cover]:inset-x-0 data-[shape=cover]:top-[var(--vv-top,0px)] data-[shape=cover]:bottom-[var(--kb-inset,0px)] data-[shape=cover]:bg-background data-[shape=cover]:shadow-none",
  "data-[shape=cover]:ease-drawer data-[shape=cover]:duration-300 data-[shape=cover]:data-closed:duration-200 data-[shape=cover]:data-open:slide-in-from-bottom-10 data-[shape=cover]:data-closed:slide-out-to-bottom-10",
  "data-[shape=cover]:[transition:top_200ms_var(--ease-emphasis),bottom_200ms_var(--ease-emphasis)]",
  // sheet: the bottom sheet, the responsive sheet's phone half exactly.
  "data-[shape=sheet]:inset-x-0 data-[shape=sheet]:bottom-[var(--kb-inset,0px)] data-[shape=sheet]:max-h-[min(85svh,calc(var(--vv-h,100svh)_-_12px))] data-[shape=sheet]:rounded-t-[calc(var(--radius-float)*1.25)]",
  "data-[shape=sheet]:ease-drawer data-[shape=sheet]:duration-300 data-[shape=sheet]:data-closed:duration-200 data-[shape=sheet]:data-open:slide-in-from-bottom-10 data-[shape=sheet]:data-closed:slide-out-to-bottom-10",
  "data-[shape=sheet]:[transition:bottom_200ms_var(--ease-emphasis),max-height_200ms_var(--ease-emphasis)]",
].join(" ")

/**
 * THE SHEET'S FOOT WHILE THE KEYBOARD IS UP: the primary action sticks to the
 * bottom of the sheet's scrollport, on an opaque ground with a short fade above
 * it, so the button that sends what is being typed never scrolls out of reach
 * on a short phone. It reads the sheet's own `data-keyboard` through
 * `in-data-keyboard:`, so anywhere else (a desk, a sheet nobody is typing in,
 * `/login`) it is inert: the same button in the same place as before.
 *
 * Wear it on a wrapper around the primary, never the button itself (whose
 * rounded corners would show the content scrolling behind them), marked
 * `data-sheet-primary` so the keyboard hook knows where the foot begins when
 * it scrolls a field into view above it. The foot carries its own bottom
 * space (`pb-4`, on its opaque ground), because a sticky element stops at the
 * scroller's padding edge and content would show through the padding under it:
 * a sheet drops its own bottom padding while `data-keyboard="open"`. It stays
 * in the flow under `data-keyboard="tight"` (a landscape phone, where a stuck
 * foot would sit on the field itself). An `overflow: hidden` ancestor between
 * the wrapper and the sheet defeats `sticky`; use `overflow: clip` there.
 */
export const floatingKeyboardFoot = [
  "in-data-[keyboard=open]:sticky in-data-[keyboard=open]:bottom-0 in-data-[keyboard=open]:z-10 in-data-[keyboard=open]:bg-popover in-data-[keyboard=open]:pt-2 in-data-[keyboard=open]:pb-4",
  "in-data-[keyboard=open]:before:pointer-events-none in-data-[keyboard=open]:before:absolute in-data-[keyboard=open]:before:inset-x-0 in-data-[keyboard=open]:before:bottom-full in-data-[keyboard=open]:before:h-4 in-data-[keyboard=open]:before:bg-linear-to-t in-data-[keyboard=open]:before:from-popover in-data-[keyboard=open]:before:to-transparent in-data-[keyboard=open]:before:content-['']",
].join(" ")

/**
 * THE SANCTIONED "NO ENTRANCE, THE TRANSITION IS THE ENTRANCE" CASE — the hub's
 * QR mini-modal (`share=room` with his note: "clicking it opens a view
 * transition animation-style mini-modal").
 *
 * ★ THIS IS A DELIBERATE HOLE IN THE CONTRACT, CUT EXACTLY ONCE. Every other
 * surface in the family arrives by animating ITSELF. This one arrives because
 * the header's small code and the modal's big code are THE SAME OBJECT
 * continuing across a state change: the View Transitions API tweens between the
 * two boxes, and an `animate-in` declared here would run a fade underneath that
 * tween and read as a double entrance. So the entrance is empty on purpose —
 * and the surface still reads its corner, its material and its clock from the
 * contract like everything else, which is what keeps it inside the family.
 *
 * ★ REDUCED MOTION FALLS BACK TO THE STANDARD CLOCK, which is why this is a
 * constant rather than simply an omission. A view transition is never STARTED
 * under `prefers-reduced-motion` (the morph-delegate's own guard), so without
 * these the modal would appear with no animation at all — which is precisely
 * the `select` bug this module was written to stop.
 */
export const floatingTransitionEntrance = [
  "motion-reduce:ease-emphasis",
  "motion-reduce:data-open:animate-in motion-reduce:data-open:fade-in-0",
  "motion-reduce:data-closed:animate-out motion-reduce:data-closed:fade-out-0",
].join(" ")

/**
 * THE CROSS-SLIDE, for a surface whose CONTENT changes while the surface
 * stays put, the incoming piece arriving from whichever side its trigger sits
 * relative to the last one (`gallery-controls-home` r1, `bulk-toolbar=icon`,
 * the bulk bar's sliding tooltip, 2026-09-20). Radix's own `NavigationMenu`
 * computes this itself from its triggers' order; a bar of icon buttons has no
 * radix engine underneath it doing that bookkeeping, so the caller stamps its
 * own `data-motion` (`from-start` | `from-end` on the way in, `to-start` |
 * `to-end` on the way out) and this module supplies the shared LANGUAGE for
 * it, the way `floatingEntrance` does for every other panel.
 *
 * THE CONSTANT IS LIFTED FROM THE NAVIGATION MENU'S CROSS-SLIDE
 * (`navigation-menu.tsx`'s `data-[motion=...]` block, the -8 travel and the
 * 3px blur, both its own numbers already), not re-derived from the house
 * "page side by side" recipe's literal 8px (`.claude/skills/transitions-dev/
 * 08-page-side-by-side.md`) — that skill is the SOURCE for the shape
 * (content slides past its neighbour rather than swapping in place), the nav
 * is the source for the NUMBERS, and one family is wanted, not two.
 * `--ease-emphasis` is the family's own curve, not the skill's cubic-bezier.
 *
 * ★ A SECOND CONSUMER READS THIS, THE FIRST STILL SPELLS ITS OWN. The bulk
 * bar's sliding tooltip (`shared/tooltip-slide.tsx`) is the second reader;
 * `navigation-menu.tsx` is outside vocab-wiring's `owns` and keeps its inline
 * classes unchanged this round (identical VALUES, so nothing about the nav
 * itself moves) — a DRY follow-up moves it onto this constant with no visual
 * change, once a lane owns that file.
 *
 * ★ THE BASELINE IS A FADE, ALWAYS, WHICH IS ALSO REDUCED MOTION'S WHOLE
 * STORY. The direction and the blur are `motion-safe:` only (the house
 * idiom, a starting-style fade), so
 * `prefers-reduced-motion: reduce` drops the travel and the blur and keeps
 * exactly the cross-fade every state already carries — never a translate at
 * zero distance, which would leave two motion declarations racing instead of
 * one absent.
 */
export const floatingCrossSlide = [
  "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  "motion-safe:data-[motion=from-end]:slide-in-from-right-8 motion-safe:data-[motion=from-start]:slide-in-from-left-8",
  "motion-safe:data-[motion=to-end]:slide-out-to-right-8 motion-safe:data-[motion=to-start]:slide-out-to-left-8",
  "motion-safe:data-[motion^=from-]:blur-in-[3px] motion-safe:data-[motion^=to-]:blur-out-[3px]",
  "ease-emphasis",
].join(" ")

/**
 * THE THREE CLOCKS, CHOSEN BY HOW OFTEN A SURFACE IS OPENED
 * (`entrance=by-frequency`). Every exit is
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
