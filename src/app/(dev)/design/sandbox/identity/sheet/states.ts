/**
 * THE STATES AN ATOM DRAWS, AS SELECTORS: the real pseudo-class and the
 * specimen's pinned twin in one `:is()`, so the rule that answers a cursor on a
 * screen is the very rule the specimen pins open (`data-demo="hover"`). A
 * pinned state is therefore never a picture of a state: it is the state.
 *
 * `:is()` takes the weight of its heaviest argument, and a pseudo-class and an
 * attribute weigh the same, so pinning a state never outranks the real one.
 *
 * The three states production has no pseudo-class for are its own ARIA: off is
 * `disabled` (or Radix's `data-disabled`), loading is `aria-busy="true"` and an
 * error is `aria-invalid="true"`, which is what a wired atom would set.
 */
export const HOVER = ':is(:hover,[data-demo~="hover"])';
export const PRESS = ':is(:active,[data-demo~="press"])';
export const FOCUS = ':is(:focus-visible,[data-demo~="focus"])';
export const OFF = ":is(:disabled,[data-disabled])";
export const BUSY = '[aria-busy="true"]';
export const ERROR = '[aria-invalid="true"]';
/** At rest: not off, not busy (a hover must not light an atom that cannot be pressed). */
export const LIVE = ':not(:disabled,[data-disabled],[aria-busy="true"])';

/**
 * EVERY BUTTON, INCLUDING THE ONES A TRIGGER WEARS. A `Button` inside a Radix
 * trigger or close (`DropdownMenuTrigger asChild`, `TooltipTrigger asChild`,
 * `PopupClose asChild`) has its `data-slot` overwritten by the trigger's own,
 * since the slot hands its props to the child last; its `data-variant` and
 * `data-size` survive. So a button is what carries both, a toggle's item
 * excepted (it carries both too, and is a chip or a segment, not a button).
 */
export const BTN = '[data-variant][data-size]:not([data-slot^="toggle-group"])';

/** A button by its variant (production's six and the head's two: `on-photo`, `glass`). */
export const btn = (...variants: string[]): string =>
  `${BTN}:is(${variants.map((v) => `[data-variant="${v}"]`).join(",")})`;

/** The icon-only sizes: a dial, whatever the family draws it as. */
export const ICON =
  ':is([data-size="icon"],[data-size="icon-xs"],[data-size="icon-sm"],[data-size="icon-lg"])';

/** A chip: an item of an outline toggle group (a filter, a pick of many). */
export const CHIP =
  '[data-slot="toggle-group"][data-variant="outline"] > [data-slot="toggle-group-item"]';
/** The chips' group. */
export const CHIPS = '[data-slot="toggle-group"][data-variant="outline"]';

/** A segmented control: any other toggle group (one of a few, side by side). */
export const SEGMENTS =
  '[data-slot="toggle-group"]:not([data-variant="outline"])';
export const SEGMENT = `${SEGMENTS} > [data-slot="toggle-group-item"]`;
/** A chip or a segment that is chosen. */
export const ON =
  ':is([data-state="on"],[aria-pressed="true"],[aria-checked="true"])';

/** Every text field: a line, a box of lines, a choice. */
export const FIELDS = [
  '[data-slot="input"]',
  '[data-slot="textarea"]',
  '[data-slot="select-trigger"]',
].join(",");

/** A list of selectors, each with a suffix (`each(FIELDS, FOCUS)`). */
export const each = (list: string, suffix: string): string =>
  list
    .split(",")
    .map((s) => `${s.trim()}${suffix}`)
    .join(",");

/** The quick layers: what opens dozens of times an hour and closes on the next press. */
export const QUICK = [
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dropdown-menu-sub-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="select-content"]',
  '[data-slot="responsive-menu"]',
  '[data-slot="responsive-menu-rows"] > *',
  '[data-slot="command-palette-content"]',
].join(",");

/** The work layers: a dialog, a panel, a screen, a sheet (what a host works inside). */
export const WORK = [
  '[data-slot="popup-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="sheet-content"]',
].join(",");

/** A row inside a quick layer. */
export const ROWS = [
  '[data-slot="dropdown-menu-item"]',
  '[data-slot="dropdown-menu-checkbox-item"]',
  '[data-slot="dropdown-menu-radio-item"]',
  '[data-slot="dropdown-menu-sub-trigger"]',
  '[data-slot="select-item"]',
  '[data-slot="responsive-menu-item"]',
].join(",");

/** A highlighted row: a pointer over it, the keyboard on it, or pinned. */
export const ROW_ON = [
  '[data-slot="dropdown-menu-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="dropdown-menu-checkbox-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="dropdown-menu-radio-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="dropdown-menu-sub-trigger"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="select-item"]:is([data-highlighted],[data-demo~="hover"])',
  '[data-slot="responsive-menu-item"]:is(:hover,:focus-visible,[data-demo~="hover"])',
].join(",");

/** Every overlay a work layer dims the page with. */
export const OVERLAYS = [
  '[data-slot="popup-overlay"]',
  '[data-slot="dialog-overlay"]',
  '[data-slot="sheet-overlay"]',
].join(",");

/**
 * EVERY SURFACE THAT ENDS IN THE HOUSE RING: production's `ring-1
 * ring-foreground/10`, where a card, Settings' cards and the room's panels end
 * (the elevation contract's "ring"). A floating panel wears the same ring
 * (`floatingPanel`), and two classes outweigh a panel's one `data-slot`, so the
 * panels are kept out of it by name.
 */
export const RINGED =
  '.ring-1.ring-foreground\\/10:not([data-slot]):not([data-slot="responsive-menu-rows"] > *)';

/** A card: the atom, and every surface that ends where a card ends. */
export const CARDS = `[data-slot="card"], ${RINGED}`;

/** A toast, as sonner draws it (its own attributes are the only guaranteed hook). */
export const TOAST = "[data-sonner-toaster] [data-sonner-toast]";

/** A container standing on a photograph (the atom contract's hook). */
export const PHOTO = '[data-surface="photo"]';
