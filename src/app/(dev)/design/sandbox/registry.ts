import type {
  BoardSpec,
  DeskFacts,
  Surface,
} from "@/components/lab/board-spec";

/**
 * THE BOARD REGISTRY: every standing board, found by its folder.
 *
 * ★ A BOARD IS ONE FOLDER AND NOTHING ELSE NAMES IT (the lab revamp,
 * 2026-09-29). Every `sandbox/<id>/spec.ts` is found by the bundler
 * (Turbopack's `require.context`, on the server and in the browser) or by
 * Vite under vitest (`import.meta.glob`), so adding a board is adding its
 * folder and retiring one is deleting it. No list here, beside the route or in
 * the kit is edited by a lane, so two boards cut in parallel never touch one
 * file. The three hand-kept lists this replaces (this file's imports,
 * `(shell)/lab/boards.ts`'s map and `touchpoints.ts`'s rows and `DESK_ORDER`)
 * collided on every merge, and `merge-lane.sh` carried a resolver for them.
 *
 * ★ SERVER-SAFE BY CONSTRUCTION. A spec is pure data (registry.test.ts refuses
 * one that imports React, a stylesheet or its own board), so this module never
 * drags a board's components into a server page, a node test or the browser;
 * the components are found the same way beside the route that renders them
 * (`(shell)/lab/[board]/board-components.ts`).
 *
 * ★ THE DESK'S ORDER IS EACH SPEC'S OWN `desk` NUMBER, lower first, by
 * leverage (`DeskFacts`), a tie read in id order: the desk, the board-to-board
 * paging and every walk read `BOARDS` in that one order.
 */

type SpecModule = Record<string, unknown>;
type Context = { keys(): string[]; (key: string): SpecModule };
// Turbopack's own `require.context` (1 to 3 arguments, the directory and the
// filter literal), declared here because Node's types do not know it.
declare const require: {
  context(dir: string, deep: boolean, filter: RegExp): Context;
};

/**
 * Every spec module by its folder. ★ TWO FINDERS, ONE PATTERN. Turbopack
 * resolves `require.context` statically and Vite rewrites `import.meta.glob`
 * statically, each ignoring the other's call, so the branch not taken is never
 * run where it could not be (vitest sets `VITEST`; a Next bundle never does).
 */
function specModules(): [folder: string, mod: SpecModule][] {
  if (process.env.VITEST) {
    const found = (
      import.meta as unknown as {
        glob(pattern: string, o: { eager: true }): Record<string, SpecModule>;
      }
    ).glob("./*/spec.ts", { eager: true });
    return Object.entries(found).map(([key, mod]) => [folderOf(key), mod]);
  }
  const ctx = require.context("./", true, /^\.\/[a-z0-9-]+\/spec\.ts$/);
  return ctx.keys().map((key) => [folderOf(key), ctx(key)]);
}

/** `./locked-door/spec.ts` is the folder `locked-door`. */
const folderOf = (key: string): string => key.split("/")[1] ?? key;

const isSpec = (v: unknown): v is BoardSpec =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as BoardSpec).id === "string" &&
  Array.isArray((v as BoardSpec).asks);

/** A board as the desk reads it: its spec with every desk fact present. */
export type StandingBoard = BoardSpec & {
  surface: Surface;
  desk: number;
  lives: readonly string[];
  tracks?: readonly string[];
};

/**
 * A spec with its facts. `defineExploration` requires them, so a spec without
 * one is a type error; one that reaches here anyway still stands (at the foot,
 * on the Shared shelf, redrawing nothing), because one board's missing line
 * must not take the desk down, and registry.test.ts is what refuses it.
 */
function standing(spec: BoardSpec): StandingBoard {
  return {
    ...spec,
    surface: spec.surface ?? "shared",
    desk: spec.desk ?? Number.MAX_SAFE_INTEGER,
    lives: spec.lives ?? [],
    tracks: spec.tracks,
  };
}

const MODULES = specModules();

/** Every folder that holds a spec, as found (registry.test.ts holds it to the disk). */
export const BOARD_FOLDERS: readonly string[] = MODULES.map(
  ([folder]) => folder,
).sort();

/** The exports of each folder's spec, for the test that holds a spec to one. */
export const SPEC_EXPORTS: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(
    MODULES.map(([folder, mod]) => [folder, Object.keys(mod)]),
  );

/** Every spec as its folder wrote it, before `standing` fills a gap (the tests read these). */
export const SPECS: readonly BoardSpec[] = MODULES.flatMap(([, mod]) =>
  Object.values(mod).filter(isSpec),
);

export const BOARDS: readonly StandingBoard[] = SPECS.map(standing).sort(
  (a, b) => a.desk - b.desk || a.id.localeCompare(b.id),
);

export function boardSpec(id: string): StandingBoard | undefined {
  return BOARDS.find((b) => b.id === id);
}

/**
 * The one line the sidebar, the search and a board's card say about it: its
 * opening's, else what its round changed. Derived, so a board says it once.
 */
export function boardNote(b: BoardSpec): string {
  return b.opening?.about ?? b.round.changed;
}
