/**
 * WHAT ONE FRAME DRAWS, AS DATA: a voice and an option for each of the four
 * atom groups, a view, a width and a ground. The board builds a frame's
 * address from these and the scene route reads them back, so the two can
 * never disagree about what a frame is.
 *
 * Pure (no React, no CSS): the spec's knobs, the board and the scene all read
 * it, and the registry hands the spec to a server page.
 */

export const VOICE_IDS = ["instrument", "camera", "display"] as const;
export type VoiceId = (typeof VOICE_IDS)[number];

export const ACTIONS_IDS = ["keys", "rings", "corners"] as const;
export type ActionsId = (typeof ACTIONS_IDS)[number];

export const FIELDS_IDS = ["wells", "rings", "corners"] as const;
export type FieldsId = (typeof FIELDS_IDS)[number];

export const LAYERS_IDS = ["matte", "display", "corners"] as const;
export type LayersId = (typeof LAYERS_IDS)[number];

export const STATUS_IDS = ["readouts", "lights", "corners"] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** The four atom groups, in the order the board asks them. */
export const GROUPS = ["actions", "fields", "layers", "status"] as const;
export type GroupId = (typeof GROUPS)[number];

/** One whole identity: a voice and one build per group. */
export type Choice = {
  voice: VoiceId;
  actions: ActionsId;
  fields: FieldsId;
  layers: LayersId;
  status: StatusId;
};

/**
 * THE RECOMMENDATIONS, the identity a frame wears for any answer not yet held
 * (the kit's own rule: a staged decision is drawn in its parent's
 * recommendation until it is answered). `spec.ts` recommends the same ids,
 * and `identity.test.ts` holds the two together.
 */
export const RECOMMENDED: Choice = {
  voice: "camera",
  actions: "rings",
  fields: "wells",
  layers: "display",
  status: "lights",
};

const pick = <T extends string>(all: readonly T[], v: unknown, or: T): T =>
  (all as readonly unknown[]).includes(v) ? (v as T) : or;

/** A choice read from anything (a query, the board's state), each part falling back to the recommendation. */
export function choiceOf(v: Partial<Record<keyof Choice, unknown>>): Choice {
  return {
    voice: pick(VOICE_IDS, v.voice, RECOMMENDED.voice),
    actions: pick(ACTIONS_IDS, v.actions, RECOMMENDED.actions),
    fields: pick(FIELDS_IDS, v.fields, RECOMMENDED.fields),
    layers: pick(LAYERS_IDS, v.layers, RECOMMENDED.layers),
    status: pick(STATUS_IDS, v.status, RECOMMENDED.status),
  };
}

/**
 * THE VIEWS. A sheet draws every atom of one part in every state on both
 * grounds (`voice` is the sheet of every place the voice speaks); the rest are
 * production's screens nobody rewires this round.
 */
export const VIEW_IDS = [
  "voice",
  "actions",
  "fields",
  "layers",
  "status",
  "door",
  "event",
  "add",
  "account",
  "review",
] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export const viewOf = (v: unknown): ViewId => pick(VIEW_IDS, v, "voice");

/** A sheet: one part's atoms (or the voice's places), drawn on both grounds. */
export type SheetView = "voice" | GroupId;
export const isSheet = (v: ViewId): v is SheetView =>
  v === "voice" || (GROUPS as readonly string[]).includes(v);

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
    voice: frame.voice,
    actions: frame.actions,
    fields: frame.fields,
    layers: frame.layers,
    status: frame.status,
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
