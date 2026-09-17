"use client";

import type { ReactNode } from "react";

import type { BoardSpec, Section } from "./board-spec";
import { BoardPage } from "./board-page";

/**
 * THE WHOLE BOARD OF AN EXPLORATION, which is its previews and nothing else.
 *
 * `defineExploration` derives every section, control and state patch, so what
 * an agent still owes is the one thing only a person can write: what each
 * option LOOKS like. That arrives here as a map keyed `"<decision>.<option>"`,
 * and this turns it into the `evidence` the step asks for.
 *
 * ★ HOW THE LOOKUP WORKS. The step draws a tile by calling
 * `evidence(sectionId, state)` with the option's own patch merged in. The
 * constructor names the section after the decision AND mirrors a control on it,
 * so `sectionId` IS the decision id and `state[sectionId]` IS the option id.
 * That is the whole indirection the old surface asked an agent to build a
 * state-varying section for.
 *
 * The same map answers the stage the step pins above the options: it is handed
 * the chosen option's patch, so the winner is drawn full size by the same node
 * that drew its tile, small. That is on purpose for now, and it is also the
 * limit: `evidence(sectionId, state)` is NOT told whether it is drawing a tile
 * or the stage, so a separate, larger stage node cannot be offered without the
 * `at` argument the ROADMAP already asks for. One map, two sizes, until then.
 */
export function ExplorationBoard<S extends readonly Section[]>({
  spec,
  previews,
  className,
}: {
  spec: BoardSpec<S>;
  /** One node per `"<decision>.<option>"`. Typed exhaustively by `PreviewKey`. */
  previews: Readonly<Record<string, ReactNode>>;
  className?: string;
}) {
  return (
    <BoardPage
      spec={spec}
      className={className}
      evidence={(sectionId, at) => {
        const option = at[sectionId];
        return option ? (previews[`${sectionId}.${option}`] ?? null) : null;
      }}
    />
  );
}
