/**
 * THE STATES A FAMILY DRAWS, AS SELECTORS: the real pseudo-class and the
 * specimen's pinned twin in one `:is()`, so the rule that answers a cursor in
 * a screen is the very rule the specimen pins open (`data-demo="hover"`). A
 * specimen state is therefore never a picture of a state: it is the state.
 *
 * `:is()` takes the weight of its heaviest argument, and a pseudo-class and
 * an attribute weigh the same, so pinning a state never outranks the real one.
 */
export const HOVER = ':is(:hover,[data-demo~="hover"])';
export const PRESS = ':is(:active,[data-demo~="press"])';
export const FOCUS = ':is(:focus-visible,[data-demo~="focus"])';

/** Every floating panel the product opens, by the hook its primitive writes. */
export const PANELS = [
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dropdown-menu-sub-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="select-content"]',
  '[data-slot="responsive-menu"]',
  '[data-slot="responsive-menu-rows"] > *',
  '[data-slot="popup-content"]',
  '[data-slot="command-palette-content"]',
].join(",");

/** A row inside a panel. */
export const ROWS = [
  '[data-slot="dropdown-menu-item"]',
  '[data-slot="dropdown-menu-checkbox-item"]',
  '[data-slot="dropdown-menu-radio-item"]',
  '[data-slot="dropdown-menu-sub-trigger"]',
  '[data-slot="select-item"]',
  '[data-slot="responsive-menu-item"]',
].join(",");

const ROW_ON_LIST = [
  '[data-slot="dropdown-menu-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="dropdown-menu-checkbox-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="dropdown-menu-radio-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="select-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="responsive-menu-item"]:is(:hover,:focus-visible,[data-demo~="hover"])',
];

/** A highlighted row: a pointer over it, the keyboard on it, or pinned. */
export const ROW_ON = ROW_ON_LIST.join(",");

/** Something inside a highlighted row (its glyph, its hint). */
export const rowOnThen = (inside: string): string =>
  ROW_ON_LIST.map((s) => `${s} ${inside}`).join(",");

/** Every text field: a line, a box of lines, a choice, a code's one cell. */
export const FIELDS = [
  '[data-slot="input"]',
  '[data-slot="textarea"]',
  '[data-slot="select-trigger"]',
].join(",");

/**
 * EVERY SURFACE THAT ENDS IN THE HOUSE RING: production's `ring-1
 * ring-foreground/10`, the hairline where a card, Settings' cards and the
 * hub's checklist end (the elevation contract's "ring"). A family that ends a
 * surface its own way says it once here; wired, the ring is one utility.
 *
 * ★ A FLOATING PANEL WEARS THE SAME RING (`floatingPanel`), and two classes
 * outweigh a panel's one `data-slot`, so a layer would end like a card
 * whatever its own rule said: the panels are kept out of it by name.
 */
export const RINGED =
  '.ring-1.ring-foreground\\/10:not([data-slot]):not([data-slot="responsive-menu-rows"] > *)';

/** A list of selectors, each with a suffix. */
export const each = (list: string, suffix: string): string =>
  list
    .split(",")
    .map((s) => `${s.trim()}${suffix}`)
    .join(",");
