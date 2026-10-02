/**
 * WHAT ONE FRAME DRAWS, AS DATA: a family, a view and a width. The board
 * builds a frame's address from these and the scene route reads them back, so
 * the two can never disagree about what a frame is.
 */

export const FAMILY_IDS = [
  "today",
  "editorial",
  "soft",
  "crystal",
  "viewfinder",
] as const;

export type FamilyId = (typeof FAMILY_IDS)[number];

export const familyOf = (v: unknown): FamilyId =>
  (FAMILY_IDS as readonly unknown[]).includes(v) ? (v as FamilyId) : "today";

/**
 * THE VIEWS. The specimen is one sheet at a desk and four phone pages in a
 * hand (its four groups, a page each, so nothing on it is below a phone's
 * fold); the three screens are production's.
 */
export const VIEW_IDS = [
  "specimen",
  "actions",
  "fields",
  "surfaces",
  "status",
  "hub",
  "settings",
  "add",
] as const;

export type ViewId = (typeof VIEW_IDS)[number];

export const viewOf = (v: unknown): ViewId =>
  (VIEW_IDS as readonly unknown[]).includes(v) ? (v as ViewId) : "specimen";

/** The specimen's four groups, in the order a sheet reads them. */
export const GROUPS = ["actions", "fields", "surfaces", "status"] as const;
export type GroupId = (typeof GROUPS)[number];

export type Width = 1440 | 375;

export const widthOf = (v: unknown): Width => (v === "375" ? 375 : 1440);

/** The scene route every frame loads (`scene/page.tsx`). */
export const SCENE_ROUTE = "/design/sandbox/identity/scene";

/** A frame's address: the scene, its three facts, and the lab's key. */
export function sceneSrc(
  frame: { family: FamilyId; view: ViewId; w: Width; id: string },
  key: string | null | undefined,
): string {
  const q = new URLSearchParams({
    family: frame.family,
    view: frame.view,
    w: String(frame.w),
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
