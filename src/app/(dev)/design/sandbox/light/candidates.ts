/**
 * THE LIGHT BOARD'S CANDIDATES AS PASTES (round two, 2026-09-14).
 *
 * Round one argued the doctrine on a stage. This file is the other half: each
 * candidate as the EXACT CSS block the ruling would land, so the same text the
 * board prints is the text the board hands the whole site through
 * setCandidateCss. One source, so a value can never drift between the stage,
 * the paste and the walk.
 *
 * ── THE TWO RULES THESE BLOCKS OBEY ──
 *
 * 1. REAL SELECTORS ONLY. `:root, .surface-paper` and `.dark, .surface-ink`
 *    are the ground scopes globals.css itself declares in that order (an ink
 *    leaf inside a paper chapter has to win, which is why the ink selector
 *    comes second here too). Everything else keys off a primitive's own
 *    shipped hook: `[data-slot="dialog-content"]`, `[data-media-tile]`,
 *    `.bg-gallery`. Nothing here is a stage-local class.
 *
 * 2. ★ NEVER OVERWRITE box-shadow WHERE A RING LIVES. Half the surfaces in
 *    this app carry `ring-1 ring-foreground/5`, and Tailwind composes the ring
 *    and the shadow into ONE box-shadow declaration through --tw-ring-shadow
 *    and --tw-shadow. A block that writes `box-shadow:` on a ringed element
 *    silently deletes its ring, which on a walk reads as "the candidate
 *    removed the hairlines". So a shadow candidate writes --tw-shadow (the
 *    slot Tailwind already reserved for it) and the lit face, which has no
 *    slot of its own, re-states var(--tw-ring-shadow) as its first layer.
 *
 * A candidate block is unlayered CSS rendered after every stylesheet, and an
 * unlayered declaration outranks every @layer, so none of this needs
 * !important to beat a utility.
 */

export type LightCandidate = {
  /** The label the tuner panel shows while it is applied. */
  label: string;
  /** The one line that says what walking with it on should show. */
  what: string;
  /** Where to walk with it on. */
  pages: string;
  css: string;
};

/* ────────────────────────────  THE SHADOW FAMILY  ───────────────────────── */

/**
 * ★ LIFT ON A LIGHT GROUND IS TODAY'S SHIPPED VALUE, TO THE BYTE. Round one's
 * board proposed 0.10 / 0.14 on light, which quietly re-tuned every paper card
 * on the site for no reason anyone had asked for. The finding was never that
 * the light values are wrong: it is that DARK has no ramp at all, because 6
 * percent of black over oklch(0.11) is arithmetically invisible. So the
 * proposal is purely additive: not one shipped alpha changes, dark gains the
 * ramp it never had, and the family gains its second size. What it adds is
 * named surface by surface rather than through the shipped token, which is
 * the difference between a proposal and a side effect.
 */
export const SHADOW_FAMILY: LightCandidate = {
  label: "Light: the shadow family (lift + float)",
  what: "The menus, dialogs, sheets and toasts gain the float; the dashboard's event cards and the host's gallery tiles gain the lift. No other surface moves, and no alpha on paper changes.",
  pages:
    "/dashboard (the event cards, a menu), /pricing, /help, an event page (the host gallery)",
  css: `/* THE SHADOW FAMILY (light board, the separate job).
   One geometry, two sizes, one alpha ramp per ground.
   LIFT separates two objects of the same lightness that overlap.
   FLOAT detaches a layer from content that keeps living behind it.
   A flat surface takes neither, in either mode. */

:root,
.surface-paper {
  /* Today's --shadow-float, unchanged: paper is already tuned. */
  --shadow-lift:
    0 2px 4px -1px oklch(0 0 0 / 0.06), 0 4px 8px -2px oklch(0 0 0 / 0.1);
  /* The same geometry at double the offsets. */
  --shadow-layer:
    0 4px 8px -2px oklch(0 0 0 / 0.09), 0 8px 16px -4px oklch(0 0 0 / 0.13);
  /* The bridge until the sweep re-points the call sites. On a light ground the
     old token and the new one are the same bytes, so this alias changes
     nothing and nothing breaks in between. */
  --shadow-float: var(--shadow-lift);
}

/* The ink leaf second, so it wins inside a paper chapter (globals.css orders
   these the same way, and for the same reason). */
.dark,
.surface-ink {
  --shadow-lift:
    0 2px 4px -1px oklch(0 0 0 / 0.45), 0 4px 8px -2px oklch(0 0 0 / 0.55);
  --shadow-layer:
    0 4px 8px -2px oklch(0 0 0 / 0.5), 0 8px 16px -4px oklch(0 0 0 / 0.62);
  /* THE ZERO IS RE-STATED, NOT INHERITED, AND IT IS LOAD-BEARING. globals.css
     zeroes --shadow-float on both dark grounds by contract (ui/sheet.tsx names
     it at its call site) and 26 files read the token; aliasing it to lift in
     dark would hand a shadow to every one of them, flat surfaces included,
     which is wider than this proposal claims and wider than the doctrine
     sanctions. It has to be written HERE because :root and .dark are the same
     element at the same specificity, so the alias three rules up would
     otherwise win on source order and reach the dark root anyway. The
     surfaces that do take a shadow in dark are named one by one below. */
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* The layers that detach take the larger size. --tw-shadow, never box-shadow:
   every one of these also carries ring-1, and the two share one declaration. */
[data-slot="dialog-content"],
[data-slot="sheet-content"],
[data-slot="popover-content"],
[data-slot="dropdown-menu-content"],
[data-slot="dropdown-menu-sub-content"],
[data-slot="select-content"],
[data-slot="tooltip-content"],
[data-slot="navigation-menu-viewport"] {
  --tw-shadow: var(--shadow-layer);
}

/* Sonner owns its own sheet and no ring, so the toast takes the property. */
[data-sonner-toast] {
  box-shadow: var(--shadow-layer);
}

/* THE REAL CARD, which is what makes this a proposal about the app and not
   about the primitives: the dashboard's event cards (and the host gallery's
   static tiles) are photographs sitting on a ground of their own lightness,
   with no surface step and no hairline between them and the page. That is
   LIFT's case exactly. [data-media-tile][data-static] is the host pair
   globals.css already uses to opt these surfaces out of the guest arrival
   fade; the wrapper carries no ring and no shadow utility, so it takes the
   property itself, and the tile radius is re-stated so the shadow follows the
   card's corner rather than a square box. The wiring round gives them a hook
   of their own. */
[data-media-tile][data-static] {
  border-radius: var(--radius-tile);
  box-shadow: var(--shadow-lift);
}`,
};

/* ──────────────────────────────  THE LIT FACE  ──────────────────────────── */

/**
 * THE LIT FACE ON THE THREE SURFACES THE DOCTRINE NAMES.
 *
 * ★ THE FACE'S OWN GROUND DECIDES, NOT THE PAGE'S. A media tile sits on the
 * page, so on paper its lip moves to the bottom edge. `.bg-gallery` does not:
 * the gallery canvas is the one surface declared identical in light and dark
 * (globals.css, "media-first, theme-independent"), so it is a dark screen even
 * on a paper page and it keeps the dark form on every ground. That distinction
 * is the whole reason the cue is called material rather than elevation.
 *
 * The plate is reached through `:has` because it has no hook of its own: it is
 * the card that holds a white printable face (the marketing QR plate and the
 * /features/qr hero plate are both exactly that). The wiring round replaces
 * all three selectors with one `data-lit` attribute.
 */
const LIT_DARK = `inset 0 0 0 1px color-mix(in oklab, var(--foreground) 9%, transparent),
    inset 0 1px 0 color-mix(in oklab, var(--foreground) 6%, transparent)`;
const LIT_PAPER = `inset 0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent),
    inset 0 -1px 0 color-mix(in oklab, var(--foreground) 7%, transparent)`;

/**
 * ★ THE GUEST PAGE IS NOT WALKABLE, AND IT IS NOT THIS BLOCK'S FAULT. Round
 * three's cold walk followed this line to `/e/<demo token>` and found 18 real
 * media tiles and NO candidate: the tuner island that renders an applied block
 * mounts in `(app)`, `(marketing)/(cinema)`, `(marketing)/(paper)` and
 * `(dev)/design`, and the `(guest)` group has none, so no board's candidate can
 * reach a guest page at all. The page was dropped from this line rather than
 * left as an instruction that leads a reviewer to a surface where the proposal
 * provably does not land, which is the "control that does nothing visible"
 * stumble this round exists to remove. Do NOT add it back without first giving
 * `(guest)/layout.tsx` the island: that file is production and outside this
 * track's lane, so it is flagged to the Orchestrator in the Handoff instead.
 * The guest gallery is still the cue's best real surface, which is why the ask
 * says "adopt, adapt or drop" on the three named surfaces and not on a page.
 */
export const LIT_FACE: LightCandidate = {
  label: "Light: the lit face (media frames, screens, plates)",
  what: "Every media tile, player and QR plate gains a hairline and a lip. Nothing else on the page changes.",
  pages:
    "/ (the film strip), /features/qr, /features/album (three plates), an event page (the host gallery)",
  css: `/* THE LIT FACE (light board, the separate job).
   Not elevation: material. An inset hairline and a lip on a face that is
   catching light. Three surfaces: a media frame, a screen, a plate.
   var(--tw-ring-shadow) is re-stated first so the hairline ring survives. */

[data-media-tile],
.bg-gallery,
.bg-card:has(.bg-white) {
  box-shadow:
    var(--tw-ring-shadow, 0 0 #0000),
    ${LIT_DARK};
}

/* On paper the lip reads off the BOTTOM edge: lit from above still, read off
   the far edge instead of the near one. .bg-gallery is deliberately absent:
   it is a dark screen on every ground, so it keeps the dark form. */
.surface-paper [data-media-tile],
.surface-paper .bg-card:has(.bg-white) {
  box-shadow:
    var(--tw-ring-shadow, 0 0 #0000),
    ${LIT_PAPER};
}`,
};

/* ────────────────────────────────  THE AURORA  ──────────────────────────── */

/**
 * THE AURORA AS A PASTE. The board proves the placement on a stage; the paste
 * carries the two halves a ruling actually decides, the REGISTER and the
 * CLOCK, because the placement is markup (a chapter mounts a lamp at each of
 * its boundaries) and markup is the wiring round's.
 *
 * ★ IT REACHES EXACTLY THE RIGHT LAMPS, BY ACCIDENT OF THE ENGINE. An inline
 * style beats any sheet, so this block reaches only lamps that do NOT tune
 * themselves inline. The footer seam passes one var (its cadence) and takes
 * the rest from the engine, so it moves; the QR hero's bloom hard-codes its
 * base and reach inline, so it does not. That split is the doctrine's own:
 * FILL takes the field's register, MARK keeps its own.
 *
 * ★ THE CLOCK IS A SIBLING TOKEN, NEVER A RE-TUNE OF --spill-cadence. The
 * cadence is a lamp's property and the evidence block rules its number, so the aurora
 * takes a MULTIPLE of it (three laps, the board's own ratio) under a name of
 * its own. Writing 33s into --spill-cadence would be the opposite ruling: it
 * would slow every shipped lamp, the footer seam that is the board's model
 * first, and it would fight the two cadence knobs, which write that same token.
 * Nothing on the site consumes the sibling yet, because the aurora's mounts
 * are markup and markup is the wiring round's; the register below is the half
 * of the ruling a paste can carry, and the clock row in the evidence is where the
 * ratio is judged.
 */
export const AURORA_REGISTER: LightCandidate = {
  label: "Light: the aurora register",
  what: "Every ambient lamp drops to the field's register, so the page reads as a room with a temperature rather than as things glowing. The lamp's clock is untouched: the aurora's is a sibling token, three laps of it.",
  pages: "/ (the footer seam, the film strip), /pricing, /help, /contact",
  css: `/* THE AURORA'S REGISTER (light board, the composer).
   A low base with a band near zero, and a clock several times slower than a
   lamp's, because a field the size of a chapter moving at a lamp's clock
   reads as a screensaver. Reaches the ambient lamps and leaves the moments
   alone: a bloom tunes itself inline and an inline style wins. */

:root {
  /* The lamp's clock keeps its token and its number, whichever the cadence ruling picks.
     The aurora gains a SIBLING, a multiple of it: 33s against today's 11s,
     24s against the engine's ruled 8s. Re-pointing --spill-cadence itself
     would slow every shipped lamp, which is a different ruling entirely. */
  --aurora-cadence: calc(var(--spill-cadence) * 3);
}

[data-glw] {
  --glw-base: 0.3;
  --glw-strength: 0.13;
  --glw-blur: 38px;
}

/* Paper needs MORE opacity for the same presence, not less: a tint at l 0.88
   against a near-white page has far less contrast with its ground than the
   same tint has against oklch(0.11). */
.surface-paper [data-glw] {
  --glw-base: 0.52;
  --glw-strength: 0.24;
}`,
};

/* ───────────────────────────────  THE PAPER FIVE  ───────────────────────── */

/**
 * THE HAND-TUNED PAPER FIVE.
 *
 * globals.css declares --lamp-1..5 once, at the dark register (l 0.72), and
 * NOTHING overrides them on paper: a media-less lamp on a paper chapter is
 * lighting a near-white page with a colour picked for a near-black room, and
 * that is the "dirty rather than lit" failure the sampled paper register was
 * invented to fix (sampled-palette.ts, SPILL_REGISTER.paper). The sampled path
 * fixed it for lamps WITH media; the house five never got the same treatment,
 * and design-system.md says so itself ("a hand-tuned paper five is still an
 * open design task"). This is that task.
 *
 * Why hand-tuned rather than one flat l 0.88 / c 0.08 row: the failure is per
 * hue and it is predictable. 85 amber goes dirty against white long before the
 * others, so it wants more lightness and less chroma; 155 green is muddier
 * still; 255 blue and 305 violet stay clean and can carry the chroma that
 * makes the light read as light at all. The five HUES are untouched, exactly,
 * which is the part that is the identity.
 */
export const PAPER_FIVE_VALUES = [
  "oklch(0.88 0.085 25)",
  "oklch(0.905 0.07 85)",
  "oklch(0.895 0.065 155)",
  "oklch(0.87 0.085 255)",
  "oklch(0.87 0.09 305)",
] as const;

/** The flat row the proposal replaces: SPILL_REGISTER.paper applied to the
 *  five house hues, which is what the sampled path would produce for them. */
export const PAPER_FLAT_VALUES = [
  "oklch(0.88 0.08 25)",
  "oklch(0.88 0.08 85)",
  "oklch(0.88 0.08 155)",
  "oklch(0.88 0.08 255)",
  "oklch(0.88 0.08 305)",
] as const;

export const PAPER_FIVE: LightCandidate = {
  label: "Light: the paper five",
  what: "Every lamp on a paper chapter is re-lit for a near-white page. The clearest look is the footer seam where the paper chapter meets the ink slab.",
  pages:
    "/ (the paper chapter: the album, curation, privacy), /pricing, /help, /contact",
  css: `/* THE PAPER FIVE (light board, the evidence).
   globals.css declares the lamp set once, at the dark register, and nothing
   re-declares it on paper: a house lamp on a near-white page is wearing a
   colour chosen for a near-black room. Same five hues, hand-tuned per hue,
   because the failure is per hue: 85 and 155 go dirty against white long
   before 255 and 305 do. */

.surface-paper {
  --lamp-1: ${PAPER_FIVE_VALUES[0]};
  --lamp-2: ${PAPER_FIVE_VALUES[1]};
  --lamp-3: ${PAPER_FIVE_VALUES[2]};
  --lamp-4: ${PAPER_FIVE_VALUES[3]};
  --lamp-5: ${PAPER_FIVE_VALUES[4]};
}`,
};

/* ────────────────────  THE ENGINE'S ONE LINE (round three)  ─────────────── */

/**
 * NOT AN "APPLY" CANDIDATE, AND DELIBERATELY SO: nothing on the site uses the
 * transform drive today, so applying this block to the running site would
 * change nothing visible, and a button that does nothing is worse than no
 * button. It is here because the evidence block's drive row proposes that the FIELD take
 * that drive, and the drive arrives with a law 4 defect that has never been
 * seen precisely because no shipped lamp uses it.
 *
 * glw-drift-x runs `translate: 32% 0` to `-32% 0`, and the animation lives in
 * the no-preference block, so the state a reduced-motion visitor gets is the
 * unanimated one: translate 0, the comet parked dead centre at full
 * --glw-strength. That is the same inversion the mask drive had fixed when its
 * resting mask-position was moved to its own from-keyframe. One line puts the
 * cheap drive back inside law 4.
 */
export const ENGINE_DRIVE_FIX = `/* THE TRANSFORM DRIVE'S REST STATE (light board, the evidence).
   Law 4: the base is how a reduced-motion arrival still arrives, band away.
   glw-drift-x's own from-keyframe, declared OUTSIDE the no-preference block,
   exactly as [data-glw-drive="mask"] already declares mask-position: 150% 0.
   Without it the drive's rest state is translate 0, which is the middle of
   its travel: the comet parked dead centre at full strength, forever, for
   every visitor who asked for less motion. No shipped lamp uses this drive
   today, which is the only reason the defect has never been seen. */

[data-glw-drive="transform"] [data-glw-band] {
  translate: 32% 0;
}`;

export const LIGHT_CANDIDATES = [
  SHADOW_FAMILY,
  LIT_FACE,
  AURORA_REGISTER,
  PAPER_FIVE,
] as const;
