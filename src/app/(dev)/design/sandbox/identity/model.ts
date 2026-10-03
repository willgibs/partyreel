/**
 * WHAT ONE FRAME DRAWS, AS DATA: a system for actions and fields, a pop-out
 * for the room, a reach for the light edge, a view, a width and a ground. The
 * board builds a frame's address from these and the scene route reads them
 * back, so the two can never disagree about what a frame is.
 *
 * Pure (no React, no CSS): the spec's knobs, the board and the scene all read
 * it, and the registry hands the spec to a server page.
 *
 * ★ ROUND TWO'S PICKS ARE NOT IN HERE: the voice (camera), the layers (the
 * display) and status (lights) are settled, so every frame wears them and no
 * frame asks about them (`sheet/index.ts`).
 */

/** Actions and fields as one system: carved, drawn in line, or toned with ink where you are. */
export const SYSTEM_IDS = ["keys", "rings", "ink"] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

/** What a pop-out is made of in the room: the display as on paper, a step up, or its inverse. */
export const ROOM_IDS = ["display", "graphite", "white"] as const;
export type RoomId = (typeof ROOM_IDS)[number];

/** How far the light edge reaches: media alone, everything that floats, every dark surface. */
export const EDGE_IDS = ["media", "floating", "every"] as const;
export type EdgeId = (typeof EDGE_IDS)[number];

/** One whole identity's open parts. */
export type Choice = {
  system: SystemId;
  room: RoomId;
  edge: EdgeId;
};

/**
 * THE RECOMMENDATIONS, the identity a frame wears for any answer not yet held
 * (the kit's own rule: a staged decision is drawn in its parent's
 * recommendation until it is answered). `spec.ts` recommends the same ids,
 * and `identity.test.ts` holds the two together.
 */
export const RECOMMENDED: Choice = {
  system: "keys",
  room: "graphite",
  edge: "floating",
};

const pick = <T extends string>(all: readonly T[], v: unknown, or: T): T =>
  (all as readonly unknown[]).includes(v) ? (v as T) : or;

/** A choice read from anything (a query, the board's state), each part falling back to the recommendation. */
export function choiceOf(v: Partial<Record<keyof Choice, unknown>>): Choice {
  return {
    system: pick(SYSTEM_IDS, v.system, RECOMMENDED.system),
    room: pick(ROOM_IDS, v.room, RECOMMENDED.room),
    edge: pick(EDGE_IDS, v.edge, RECOMMENDED.edge),
  };
}

/**
 * THE VIEWS. A sheet draws every atom of one part in every state on both
 * grounds (at a desk side by side, in a hand one ground, two pages); the rest
 * are production's screens no round-13 lane rewires.
 */
export const VIEW_IDS = [
  "actions",
  "fields",
  "layers",
  "account",
  "door",
  "gate",
  "add",
  "cover",
  "menu",
] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export const viewOf = (v: unknown): ViewId => pick(VIEW_IDS, v, "account");

/** A sheet: one part's atoms, drawn on both grounds. */
export const SHEETS = ["actions", "fields", "layers"] as const;
export type SheetView = (typeof SHEETS)[number];
export const isSheet = (v: ViewId): v is SheetView =>
  (SHEETS as readonly string[]).includes(v);

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

/** A frame's address: the scene, its facts, and the lab's key. */
export function sceneSrc(
  frame: Choice & {
    view: ViewId;
    w: Width;
    ground: GroundId;
    page?: PageNo;
    id: string;
  },
  key: string | null | undefined,
): string {
  const q = new URLSearchParams({
    system: frame.system,
    room: frame.room,
    edge: frame.edge,
    view: frame.view,
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
