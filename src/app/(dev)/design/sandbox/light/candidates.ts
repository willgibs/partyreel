/**
 * THE LIGHT BOARD'S CANDIDATES AS PASTES (round two, 2026-09-14; cut to the
 * two blocks still open at round eight, 2026-09-17).
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
 *    slot Tailwind already reserved for it), and the bright edge writes its
 *    shadow on a pseudo-element, which has no ring to lose.
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
  label: "Light: the thin bright edge (photos, players, the QR card)",
  what: "Every media tile, player canvas and QR card gains a hairline and a one pixel top highlight, drawn above the image. Nothing else on the page changes.",
  pages:
    "/ (the film strip), /features/qr, /features/album (three plates), an event page (the host gallery)",
  css: `/* THE THIN BRIGHT EDGE (light board, round eight).
   Not elevation: material. A hairline and a one pixel lip on a face that is
   catching light. Three kinds of surface: a photo, a player, the QR card.

   ON A PSEUDO-ELEMENT, NEVER ON THE ELEMENT. An inset box-shadow paints above
   an element's own background and BELOW its children, and a media tile's child
   is an image covering the whole box: the edge would be drawn and then painted
   over, which is exactly what round seven's card showed.

   contain: paint makes each surface the containing block for its own
   pseudo-element WITHOUT changing how the surface itself is positioned (some of
   these are absolutely positioned already, so position: relative is not safe
   to hand out). Every one of them clips its own overflow today, which is the
   only other thing paint containment does. The wiring round replaces all three
   selectors with one data-lit attribute. */

[data-media-tile],
.bg-gallery,
.bg-card:has(.bg-white) {
  contain: paint;
}

[data-media-tile]::after,
.bg-gallery::after,
.bg-card:has(.bg-white)::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    ${LIT_DARK};
}

/* On paper the lip reads off the BOTTOM edge: lit from above still, read off
   the far edge instead of the near one. .bg-gallery is deliberately absent:
   it is a dark screen on every ground, so it keeps the dark form. */
.surface-paper [data-media-tile]::after,
.surface-paper .bg-card:has(.bg-white)::after {
  box-shadow:
    ${LIT_PAPER};
}`,
};

export const LIGHT_CANDIDATES = [SHADOW_FAMILY, LIT_FACE] as const;
