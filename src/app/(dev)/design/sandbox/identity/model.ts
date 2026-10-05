/**
 * WHAT ONE FRAME DRAWS, AS DATA: the mix of seven traits and the light
 * edge's reach, a place, a moment, a width and a ground. The board builds a
 * frame's address from these and the scene route reads them back, so the two
 * can never disagree about what a frame is.
 *
 * Pure (no React, no CSS): the spec's knobs, the board and the scene all read
 * it, and the registry hands the spec to a server page.
 *
 * ★ THE MIX IS SEVEN TRAITS (Will, identity r3: "a configurator ... where I
 * can mix and match across and tweak finely"). r3's three systems are taken
 * apart into the traits each was made of, so a field, a button, a focus mark,
 * a chosen thing, a press, a working state and a toggle are each picked on
 * their own and every frame wears the whole mix (`sheet/index.ts`).
 *
 * ★ WHAT IS SETTLED IS NOT IN HERE: the voice (camera), the layers (the
 * display), status (lights) and the material are production's own since
 * `identity-wiring`, and the room's pop-out (graphite) is drawn as wired
 * (`sheet/room.ts`) while `graphite-wiring` lands it.
 */

/** What holds a value: a well sunk in the page, a ring drawn in line, a quiet tone. */
export const FIELD_IDS = ["well", "ring", "tone"] as const;
export type FieldId = (typeof FIELD_IDS)[number];

/** What you press: a bevelled key, a pill drawn in line, a tone that is ink to act. */
export const BUTTON_IDS = ["key", "pill", "ink"] as const;
export type ButtonId = (typeof BUTTON_IDS)[number];

/**
 * The one focus mark on everything: two new marks first, then rings' closing
 * outline and ink's cursor, and r3's corners last, kept only as the fallback.
 */
export const FOCUS_IDS = [
  "halo",
  "lit",
  "outline",
  "cursor",
  "corners",
] as const;
export type FocusId = (typeof FOCUS_IDS)[number];

/** A chosen thing among others: risen lighter, a still lighter step, an ink pill, a tone frame. */
export const SELECTED_IDS = ["raised", "lighter", "ink", "frame"] as const;
export type SelectedId = (typeof SELECTED_IDS)[number];

/** What a press feels like: it sinks, it shrinks, it blinks to ink. */
export const PRESS_IDS = ["sink", "shrink", "blink"] as const;
export type PressId = (typeof PRESS_IDS)[number];

/** What working looks like: three lights breathing, an arc running round, a track filling. */
export const LOADING_IDS = ["dots", "arc", "track"] as const;
export type LoadingId = (typeof LOADING_IDS)[number];

/** Switches, checks, radios and sliders: wells that fill with ink, circles, a tone that turns to ink. */
export const TOGGLES_IDS = ["wells", "circles", "tone"] as const;
export type TogglesId = (typeof TOGGLES_IDS)[number];

/** How far the light edge reaches: media alone, everything that floats, every dark surface. */
export const EDGE_IDS = ["media", "floating", "every"] as const;
export type EdgeId = (typeof EDGE_IDS)[number];

/** The whole mix: one answer per trait, and the edge. */
export type Choice = {
  field: FieldId;
  button: ButtonId;
  focus: FocusId;
  selected: SelectedId;
  press: PressId;
  loading: LoadingId;
  toggles: TogglesId;
  edge: EdgeId;
};

/** The trait asks, in the order the walk takes them: each is drawn wearing the picks before it. */
export const TRAITS = [
  "field",
  "button",
  "focus",
  "selected",
  "press",
  "loading",
  "toggles",
] as const;
export type Trait = (typeof TRAITS)[number];
export type AskId = keyof Choice;

/** Every ask's options, by ask, for the readers that go through them all. */
export const OPTIONS: { readonly [A in AskId]: readonly Choice[A][] } = {
  field: FIELD_IDS,
  button: BUTTON_IDS,
  focus: FOCUS_IDS,
  selected: SELECTED_IDS,
  press: PRESS_IDS,
  loading: LOADING_IDS,
  toggles: TOGGLES_IDS,
  edge: EDGE_IDS,
};

/**
 * THE RECOMMENDATIONS, the mix a frame wears for any answer not yet held (the
 * kit's own rule: a step is drawn wearing the board's decided answers, and an
 * undecided one is its recommendation). His leanings, from r3: keys and wells
 * the foundation, never the viewfinder's corners for focus, a lighter surface
 * for what is chosen. `spec.ts` recommends the same ids, and
 * `identity.test.ts` holds the two together.
 */
export const RECOMMENDED: Choice = {
  field: "well",
  button: "key",
  focus: "halo",
  selected: "raised",
  press: "sink",
  loading: "track",
  toggles: "wells",
  edge: "floating",
};

const pick = <T extends string>(all: readonly T[], v: unknown, or: T): T =>
  (all as readonly unknown[]).includes(v) ? (v as T) : or;

/** A choice read from anything (a query, the board's state), each part falling back to the recommendation. */
export function choiceOf(v: Partial<Record<AskId, unknown>>): Choice {
  return {
    field: pick(FIELD_IDS, v.field, RECOMMENDED.field),
    button: pick(BUTTON_IDS, v.button, RECOMMENDED.button),
    focus: pick(FOCUS_IDS, v.focus, RECOMMENDED.focus),
    selected: pick(SELECTED_IDS, v.selected, RECOMMENDED.selected),
    press: pick(PRESS_IDS, v.press, RECOMMENDED.press),
    loading: pick(LOADING_IDS, v.loading, RECOMMENDED.loading),
    toggles: pick(TOGGLES_IDS, v.toggles, RECOMMENDED.toggles),
    edge: pick(EDGE_IDS, v.edge, RECOMMENDED.edge),
  };
}

/**
 * THE VIEWS: the real screens every trait is drawn on (Settings' panel over
 * the hub, Create's steps, the guest's Add, the door's steps, Account), the
 * edge's other screens (the dashboard's Display popover, a delete confirm,
 * toasts over the album, the reel's Style menu, the account menu, a
 * tooltip, and a new host's dashboard for a carried call's case), and two
 * sheets of every atom in every state.
 */
export const VIEW_IDS = [
  "settings",
  "create",
  "add",
  "door",
  "account",
  "dashboard",
  "confirm",
  "toasts",
  "style",
  "menu",
  "tooltip",
  "start",
  "actions",
  "fields",
] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export const viewOf = (v: unknown): ViewId => pick(VIEW_IDS, v, "settings");

/** A sheet: one part's atoms in every state, drawn on both grounds at a desk. */
export const SHEETS = ["actions", "fields"] as const;
export type SheetView = (typeof SHEETS)[number];
export const isSheet = (v: ViewId): v is SheetView =>
  (SHEETS as readonly string[]).includes(v);

/**
 * THE MOMENT A SCREEN IS CAUGHT IN: the trait being asked (a field typed in,
 * a key held down, a key working, a gate chosen), `edge`, the screen with its
 * layer open, or `rest`, the instant before a press (a press is judged beside
 * the key at rest: a still cannot show the move). Each screen pins the moment
 * where it really happens on it, the same in every option, so two frames
 * differ by the option alone.
 */
export const MOMENT_IDS = [...TRAITS, "edge", "rest"] as const;
export type MomentId = (typeof MOMENT_IDS)[number];
export const momentOf = (v: unknown): MomentId => pick(MOMENT_IDS, v, "field");

export type Width = 1440 | 375;
export const widthOf = (v: unknown): Width =>
  v === "375" || v === 375 ? 375 : 1440;

/** The two grounds: paper (the light theme) and the room (the dark one). */
export const GROUND_IDS = ["room", "paper"] as const;
export type GroundId = (typeof GROUND_IDS)[number];
export const groundOf = (v: unknown): GroundId => pick(GROUND_IDS, v, "room");

/** A phone draws a sheet as two pages, each a real screen. */
export type PageNo = 1 | 2;
export const pageOf = (v: unknown): PageNo => (v === "2" || v === 2 ? 2 : 1);

/** The scene route every frame loads (`scene/page.tsx`). */
export const SCENE_ROUTE = "/design/sandbox/identity/scene";

/** Everything one frame is. */
export type FrameFacts = Choice & {
  view: ViewId;
  moment: MomentId;
  w: Width;
  ground: GroundId;
  page?: PageNo;
  id: string;
};

/** A frame's address: the scene, its facts, and the lab's key. */
export function sceneSrc(
  frame: FrameFacts,
  key: string | null | undefined,
): string {
  const q = new URLSearchParams({
    field: frame.field,
    button: frame.button,
    focus: frame.focus,
    selected: frame.selected,
    press: frame.press,
    loading: frame.loading,
    toggles: frame.toggles,
    edge: frame.edge,
    view: frame.view,
    moment: frame.moment,
    w: String(frame.w),
    ground: frame.ground,
    page: String(frame.page ?? 1),
    id: frame.id,
  });
  if (key) q.set("key", key);
  return `${SCENE_ROUTE}?${q.toString()}`;
}

/** The message a scene posts its reading in (`scene/reading.ts`). */
export const READING_MESSAGE = "identity:reading";

export type Reading = {
  type: typeof READING_MESSAGE;
  id: string;
  text: string;
};

export const isReading = (v: unknown): v is Reading =>
  typeof v === "object" &&
  v !== null &&
  (v as Reading).type === READING_MESSAGE &&
  typeof (v as Reading).id === "string" &&
  typeof (v as Reading).text === "string";
