import type { ComponentType } from "react";

/**
 * THE BOARDS' CLIENT COMPONENTS, found by their folders the way their specs are
 * (`sandbox/registry.ts`): every `sandbox/<id>/board.tsx`, whose one export is
 * the board (registry.test.ts holds each to one). Nothing lists a board here,
 * so adding one is its folder and retiring one is deleting it.
 *
 * ★ READ ON THE SERVER, BY THE ROUTE THAT RENDERS ONE. The board route draws the
 * board it names, so a board reaches the browser as that route's client
 * reference, exactly as it did when this was a hand-kept map (measured
 * 2026-09-29: the same chunks load either way).
 */

type BoardModule = Record<string, unknown>;
type Context = { keys(): string[]; (key: string): BoardModule };
// Turbopack's own `require.context`; Node's types do not know it.
declare const require: {
  context(dir: string, deep: boolean, filter: RegExp): Context;
};

const boards = require.context(
  "../../../sandbox",
  true,
  /^\.\/[a-z0-9-]+\/board\.tsx$/,
);

/**
 * Every folder's board, by its folder: the one export of its board.tsx. A map
 * built once rather than a function called in render, so the route reads a
 * component that exists before it renders (react-hooks/static-components).
 */
export const BOARD_COMPONENTS: Readonly<Record<string, ComponentType>> =
  Object.fromEntries(
    boards.keys().flatMap((key) => {
      const exported = Object.values(boards(key));
      return exported.length === 1
        ? [[key.split("/")[1], exported[0] as ComponentType]]
        : [];
    }),
  );
