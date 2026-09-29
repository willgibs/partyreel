/**
 * WHERE EACH KIND OF POPUP OPENS, AS ONE TABLE (`popups` r1, Will
 * 2026-09-27; the carried call `one-table`).
 *
 * His note on identity-claims r1 started it: "Are we using sheets everywhere
 * now? Feels like a less common pattern for users in general, especially used
 * for everything. Many popups would benefit from a different layout/UI." The
 * board answered by KIND, never by screen: every popup in the product is one of
 * eight kinds, and each kind has one answer at a desk and one in a hand. So the
 * answer lives here, once, and a popup only ever names its kind at its call
 * site (`<PopupContent kind="confirm">`). A later answer on a kind is one row
 * below, not a dozen edits: offer the fix at its source.
 *
 * ★ A SHAPE IS A PLACE ON THE SCREEN, NOT A COMPONENT. The Dialog and the Sheet
 * are both Radix's Dialog underneath, so one element (`PopupContent`,
 * `popup.tsx`) wears any of the DIALOG shapes; its classes are the contract's
 * (`floatingPopupShapes`, `floating-layer.ts`), each scoped to its own
 * `data-shape`, so no two shapes can race each other for a property. The OWN
 * shapes are primitives of their own: a menu at its button and rows at the thumb
 * (`responsive-menu.tsx`), the code card (`app/share/code-card.tsx`) and a card
 * at a name (`social/guest-peek.tsx`). Each of those reads its row here too, and
 * falls back to `PopupContent` if its row ever names a dialog shape instead.
 *
 * ★ "A DESK" AND "A HAND" ARE THE PRODUCT'S ONE BREAKPOINT (640 px, Tailwind's
 * `sm`, the responsive Sheet's own): a landscape phone is a desk by width, as it
 * already is for every sheet, and the keyboard rule still reaches it through a
 * coarse pointer (`use-keyboard-inset.ts`).
 */

/** What a popup IS: the one word its call site says. */
export type PopupKind =
  | "list"
  | "confirm"
  | "form"
  | "choice"
  | "share"
  | "plan"
  | "settings"
  | "peek"

/**
 * The shapes one Radix Dialog element can take (`PopupContent`), by width.
 *
 *  - `dialog`: centred, sized to what it says, in the band the keyboard leaves;
 *  - `wide`: the same, wide enough for a plan's cards (a desk only);
 *  - `panel`: beside the screen from its right edge, full height (a desk only);
 *  - `screen`: the whole screen under a back arrow, the phone's Back closing it;
 *  - `cover`: the whole screen under a close, over whatever held the moment;
 *  - `sheet`: the bottom sheet, capped at 85 percent, standing on the keyboard.
 */
export type DeskDialogShape = "dialog" | "wide" | "panel"
export type HandDialogShape = "dialog" | "screen" | "cover" | "sheet"
export type DialogShape = DeskDialogShape | HandDialogShape

/**
 * The shapes that are primitives of their own: `menu` (under the button that
 * asked), `rows` (the phone's own chooser, Cancel beneath), `card` (the code
 * card, white for a scanner) and `anchored` (a card beside what was tapped).
 */
export type DeskOwnShape = "menu" | "card" | "anchored"
export type HandOwnShape = "rows" | "card"

export type DeskShape = DeskDialogShape | DeskOwnShape
export type HandShape = HandDialogShape | HandOwnShape
export type PopupShape = DeskShape | HandShape

export type PopupRow = {
  desk: DeskShape
  hand: HandShape
  /**
   * Where focus lands when it opens at a desk: `first` is Radix's own choice
   * (the first control, so a form is typed into and a question starts on its
   * safe answer); `panel` is the surface itself, for a place a host reads
   * before touching (his settings note: "Let's not open focused, so more
   * settings are visible and one tap away rather than always having to escape
   * typing in the event name input"). In a hand focus is ALWAYS the panel's,
   * the Sheet's own keyboard rule: no field raises a keyboard into a surface
   * still arriving.
   */
  deskFocus: "first" | "panel"
  /**
   * How a screen reader announces it, when it is not the Dialog's own. A confirmation is an ALERT
   * dialog: it stops the person to ask one thing and waits for the answer, so a screen reader
   * announces it as an alert and reads its question with its name (a plain `dialog` leaves the
   * question to whichever readers announce descriptions). Only a kind that asks says so; every
   * other kind is Radix's `dialog`.
   */
  role?: "alertdialog"
}

/**
 * THE TABLE. Every row is his r1 answer, each confirming the board's
 * recommendation; `docs/reviews/popups.json` is the ledger.
 */
export const POPUP_KINDS = {
  /** `lists=panel`: a place she moves through, beside the screen at a desk. */
  list: { desk: "panel", hand: "screen", deskFocus: "panel" },
  /**
   * `confirm=dialog`: "a focused confirmation over an undo is far more helpful". ★ It speaks as an
   * `alertdialog`, so anything that asks whether "a dialog is up" must look for both roles.
   */
  confirm: {
    desk: "dialog",
    hand: "dialog",
    deskFocus: "first",
    role: "alertdialog",
  },
  /** `forms=dialog`: one question with a field in it, above the keyboard. */
  form: { desk: "dialog", hand: "dialog", deskFocus: "first" },
  /** `choices=menu`: under the button that asked; at the thumb in a hand. */
  choice: { desk: "menu", hand: "rows", deskFocus: "first" },
  /** `share=card`: his code card, every share's first surface. */
  share: { desk: "card", hand: "card", deskFocus: "first" },
  /** `plans=wide`: a decision with money in it, stacked (his note). */
  plan: { desk: "wide", hand: "cover", deskFocus: "panel" },
  /** `settings=panel`: his panel at a desk, the whole screen in a hand. */
  settings: { desk: "panel", hand: "screen", deskFocus: "panel" },
  /** `peek=card`: a look beside the name at a desk, the Sheet in a hand. */
  peek: { desk: "anchored", hand: "sheet", deskFocus: "panel" },
} as const satisfies Record<PopupKind, PopupRow>

/** The desk half: the Sheet's own breakpoint, and the one `vitest.setup.ts` understands. */
export const DESK_QUERY = "(min-width: 640px)"

const DIALOG_SHAPES = new Set<PopupShape>([
  "dialog",
  "wide",
  "panel",
  "screen",
  "cover",
  "sheet",
])

/** Whether one Radix Dialog element (`PopupContent`) can wear this shape. */
export function isDialogShape(shape: PopupShape): shape is DialogShape {
  return DIALOG_SHAPES.has(shape)
}

/** The shape a kind takes at one width. */
export function shapeFor(kind: PopupKind, desk: boolean): PopupShape {
  const row: PopupRow = POPUP_KINDS[kind]
  return desk ? row.desk : row.hand
}

/**
 * A shape that is a PLACE in a hand (the whole screen), so the phone's own Back
 * closes it (`lists=panel`: "the phone's Back closing it"; the carried call
 * `stacked`: "a plan or another place replaces it in a hand, and Back returns").
 */
export function isPlaceShape(shape: PopupShape): boolean {
  return shape === "screen" || shape === "cover"
}
