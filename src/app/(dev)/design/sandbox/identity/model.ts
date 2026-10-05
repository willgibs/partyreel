/**
 * WHAT ONE FRAME DRAWS, AS DATA: a set (one whole system of fields, buttons,
 * chosen things and toggles), a working state, a place, a moment, a width and
 * a ground. The board builds a frame's address from these and the scene route
 * reads them back, so the two can never disagree about what a frame is.
 *
 * Pure (no React, no CSS): the spec's knobs, the board and the scene all read
 * it, and the registry hands the spec to a server page.
 *
 * ★ ROUND FIVE ASKS IN SETS (Will, r4: "it was a bad idea to go per-atom
 * questions when rethinking those components ... I can select a polished set
 * that works best together rather than pick & choose across styles"). A set is
 * ONE answer for the field, the button family, what is chosen and the toggles,
 * drawn by one hand (`sheet/sets/`), so a frame wears a set whole and never a
 * mix of two.
 *
 * ★ WHAT IS SETTLED IS NOT IN HERE: focus is the halo, a press shrinks, and
 * every pop-out takes the bright edge (his r4 picks, drawn from r4's own option
 * code while `identity-wiring` lands them: `sheet/settled.ts`); the voice, the
 * display, graphite and status as lights are production's own.
 */

/**
 * THE SETS, each named by its principle: keys and wells finished (relief),
 * lit edges (light), ink and tone (value), and the house's own mix (sunk where
 * you type, flat where you press, lifted where it floats).
 */
export const SET_IDS = ["keys", "lit", "tone", "house"] as const;
export type SetId = (typeof SET_IDS)[number];

/**
 * WHAT A KEY SHOWS WHILE IT WORKS: his arc, refined; the words saying what it
 * does beside it; a light running round the key's own edge; and the key held
 * down until the work lands.
 */
export const LOADING_IDS = ["arc", "words", "edge", "held"] as const;
export type LoadingId = (typeof LOADING_IDS)[number];

/** The whole of what a frame wears. */
export type Choice = {
  set: SetId;
  loading: LoadingId;
};

/** The asks, in the order the walk takes them: the loading step is drawn wearing the set before it. */
export const ASKS = ["set", "loading"] as const;
export type AskId = (typeof ASKS)[number];

/** Every ask's options, by ask, for the readers that go through them all. */
export const OPTIONS: { readonly [A in AskId]: readonly Choice[A][] } = {
  set: SET_IDS,
  loading: LOADING_IDS,
};

/**
 * THE RECOMMENDATIONS, what a frame wears for an answer not yet held (the
 * kit's own rule: a step is drawn wearing the board's decided answers, and an
 * undecided one is its recommendation). `spec.ts` recommends the same ids, and
 * `identity.test.ts` holds the two together.
 */
export const RECOMMENDED: Choice = {
  set: "house",
  loading: "words",
};

const pick = <T extends string>(all: readonly T[], v: unknown, or: T): T =>
  (all as readonly unknown[]).includes(v) ? (v as T) : or;

/** A choice read from anything (a query, the board's state), each part falling back to the recommendation. */
export function choiceOf(v: Partial<Record<AskId, unknown>>): Choice {
  return {
    set: pick(SET_IDS, v.set, RECOMMENDED.set),
    loading: pick(LOADING_IDS, v.loading, RECOMMENDED.loading),
  };
}

/**
 * THE VIEWS: the real screens a set is judged on (Settings' door with its
 * two dates, Account's billing row, Create's foot, the guest's door, the
 * album's toolbar, Settings' first page), the working screen the loading ask
 * draws, and two sheets of every atom in every state.
 */
export const VIEW_IDS = [
  "door",
  "dates",
  "account",
  "create",
  "gate",
  "album",
  "rows",
  "working",
  "actions",
  "fields",
] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export const viewOf = (v: unknown): ViewId => pick(VIEW_IDS, v, "door");

/**
 * A sheet: one part's atoms in every state (or the loading ask's three, each
 * moving and still), drawn on both grounds at a desk.
 */
export const SHEETS = ["actions", "fields", "working"] as const;
export type SheetView = (typeof SHEETS)[number];
export const isSheet = (v: ViewId): v is SheetView =>
  (SHEETS as readonly string[]).includes(v);

/**
 * THE MOMENT A SCREEN IS CAUGHT IN: `use`, the set's own (each screen in use
 * as a person meets it: a field typed in, a key working, a gate chosen), or
 * `working`, the loading ask's (each screen's working parts held at once).
 * Each screen pins its moment where it really happens on it, the same in
 * every option, so two frames differ by the option alone.
 */
export const MOMENT_IDS = ["use", "working"] as const;
export type MomentId = (typeof MOMENT_IDS)[number];
export const momentOf = (v: unknown): MomentId => pick(MOMENT_IDS, v, "use");

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
    set: frame.set,
    loading: frame.loading,
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
