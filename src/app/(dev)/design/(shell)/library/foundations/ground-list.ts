/**
 * THE BRAND KIT'S GROUNDS AND THE DISPLAY'S TOKENS, as data (the grounds' own list was four and short of `--signal`
 * and `--display*` when identity r2 wired `layers=display`, 2026-10-03). Pure and node-safe so
 * `ground-list.test.ts` can hold every row against `globals.css`: the page draws what this says, and the test says
 * what the stylesheet declares, so the kit cannot fall behind the next ground the way it did the fifth.
 */

export type Ground = {
  id: "paper" | "room" | "slab" | "mat" | "display";
  name: string;
  /** What a reader writes to wear it: the selector the stylesheet declares. */
  selector: string;
  /**
   * The classes the tile wears, so it reads that ground's real tokens. The paper and the room are each their
   * own root and never nested (globals.css: a `.dark` inside `.surface-paper` is a half-dark subtree). The mat is
   * declared on top of the paper block it sits beside, as it is worn.
   */
  wears: string;
  /** Where it stands, in a line. */
  worn: string;
};

export const GROUNDS: readonly Ground[] = [
  {
    id: "paper",
    name: "Paper",
    selector: ".surface-paper",
    wears: "surface-paper",
    worn: "The page in light: a silver body, the card a step whiter. Marketing's paper chapters wear it inside the dark room.",
  },
  {
    id: "room",
    name: "The room",
    selector: ".dark",
    wears: "dark",
    worn: "The page in dark: one near-black room for the app and every cinema chapter, the card a step lighter.",
  },
  {
    id: "slab",
    name: "The slab",
    selector: ".surface-ink",
    wears: "surface-ink",
    worn: "An always-dark leaf on paper, a step above the room. The footer wears it.",
  },
  {
    id: "mat",
    name: "The mat",
    selector: ".surface-mat",
    wears: "surface-paper surface-mat",
    worn: "A set-apart band on paper, a step below the body. Declared, worn nowhere yet.",
  },
  {
    id: "display",
    name: "The display",
    selector: ".surface-display",
    wears: "surface-display",
    worn: "The camera's screen: menus, selects, popovers, tooltips and toasts, near-black on paper and lit graphite in the room.",
  },
];

/**
 * The display's own tokens, declared per ground (the paper set and `.dark`, each in whole; a layer reaches them by
 * wearing `.surface-display`, never as a utility: none is generated). In the order a part reads them.
 */
export const DISPLAY_TOKENS: readonly { name: string; token: string }[] = [
  { name: "Step", token: "--display-step" },
  { name: "Foreground", token: "--display-foreground" },
  { name: "Muted", token: "--display-muted" },
  { name: "Faint", token: "--display-faint" },
  { name: "Edge", token: "--display-edge" },
  { name: "Input", token: "--display-input" },
  { name: "Cursor", token: "--display-cursor" },
  { name: "Light", token: "--display-light" },
];

/** The display itself: the screen's ground, which every other display token is read against. */
export const DISPLAY_GROUND = "--display";
