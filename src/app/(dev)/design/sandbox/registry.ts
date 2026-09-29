import type { BoardSpec, DeskFacts, Surface } from "@/components/lab/board-spec";

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

/**
 * ★ TWO BOARDS PREDATE THEIR DESK FACTS, AND THIS LIST ONLY SHRINKS.
 * `admin-triage` and `event-settings` belong to wiring lanes (triage-r2-wiring,
 * settings-wiring) that retire them at their merges, so their specs stay as
 * they were cut and their facts ride here until then (their rows were
 * touchpoints.ts's). `merge-lane.sh` deletes an entry whose folder its merge
 * removed, and registry.test.ts refuses an entry for a folder that is gone or
 * for a spec that carries its own facts. When the last one goes, delete this
 * and make `surface`, `desk` and `lives` required in `ExplorationInput`.
 */
export const PREDATES: Readonly<Record<string, DeskFacts>> = {
  "admin-triage": {
    surface: "admin",
    desk: 10,
    lives: [
      "docs/systems/admin-observability.md",
      "docs/systems/trust-safety-forensics.md",
      "src/app/admin/reports/page.tsx",
      "src/app/admin/reports/person-report-list.tsx",
      "src/components/app/report-review.tsx",
      "src/components/admin/destructive-sheet.tsx",
      "src/components/guest/report-dialog.tsx",
      "src/app/api/reports/route.ts",
      "src/lib/validation/report.ts",
      "src/lib/db/queries/reports.ts",
      "src/lib/email/templates.ts",
      "content/help/report-a-problem-as-a-guest.mdx",
    ],
  },
  "event-settings": {
    surface: "host",
    desk: 20,
    lives: [
      "docs/systems/host-app.md",
      "src/components/app/event-settings/event-settings-sheet.tsx",
      "src/components/app/event-settings-form.tsx",
      "src/components/app/event-settings/visibility-section.tsx",
      "src/components/app/event-settings/uploads-section.tsx",
      "src/components/app/event-settings/highlight-reel-card.tsx",
      "src/components/app/event-settings/profile-social-card.tsx",
      "src/components/app/event-settings/danger-zone-section.tsx",
      "src/components/app/visibility-selector.tsx",
      "src/components/app/pricing/lock-chip.tsx",
    ],
  },
};

/** A board as the desk reads it: its spec with every desk fact present. */
export type StandingBoard = BoardSpec & {
  surface: Surface;
  desk: number;
  lives: readonly string[];
  tracks?: readonly string[];
};

/**
 * A spec with its facts: its own, else the ones it predates (PREDATES). A spec
 * with neither still stands (at the foot, on the Shared shelf, redrawing
 * nothing), because one board's missing line must not take the desk down;
 * registry.test.ts is what refuses it.
 */
function standing(spec: BoardSpec): StandingBoard {
  const facts = PREDATES[spec.id];
  return {
    ...spec,
    surface: spec.surface ?? facts?.surface ?? "shared",
    desk: spec.desk ?? facts?.desk ?? Number.MAX_SAFE_INTEGER,
    lives: spec.lives ?? facts?.lives ?? [],
    tracks: spec.tracks ?? facts?.tracks,
  };
}

const MODULES = specModules();

/** Every folder that holds a spec, as found (registry.test.ts holds it to the disk). */
export const BOARD_FOLDERS: readonly string[] = MODULES.map(
  ([folder]) => folder,
).sort();

/** The exports of each folder's spec, for the test that holds a spec to one. */
export const SPEC_EXPORTS: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(MODULES.map(([folder, mod]) => [folder, Object.keys(mod)]));

/** Every spec as its folder wrote it, before PREDATES fills a gap (the tests read these). */
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
