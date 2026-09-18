"use client";

import type { BoardSpec, Section } from "./board-spec";
import { BoardPage } from "./board-page";
import type { Preview } from "./exploration";

/**
 * THE WHOLE BOARD OF AN EXPLORATION, which is its previews and nothing else.
 *
 * `defineExploration` derives every section, control and state patch, so what
 * an agent still owes is the one thing only a person can write: what each
 * option LOOKS like. That arrives here as a map keyed `"<decision>.<option>"`,
 * and this turns it into the `evidence` the step asks for.
 *
 * ★ HOW THE LOOKUP WORKS. The step draws an option by calling
 * `evidence(sectionId, state)` with the option's own patch merged in. The
 * constructor names the section after the decision AND mirrors a control on it,
 * so `sectionId` IS the decision id and `state[sectionId]` IS the option id.
 * That is the whole indirection the old surface asked an agent to build a
 * state-varying section for.
 *
 * The step draws every option ONCE, on the stage, at its true size (the dock
 * round, 2026-09-18), so one node per option is the whole picture: there is no
 * second, smaller copy to keep in step. A preview may be a FUNCTION of the
 * state it is handed (`Preview`), which is how a staged decision is drawn
 * wearing the answer it waits on.
 */
export function ExplorationBoard<S extends readonly Section[]>({
  spec,
  previews,
  className,
}: {
  spec: BoardSpec<S>;
  /** One preview per `"<decision>.<option>"`. Typed exhaustively by `PreviewKey`. */
  previews: Readonly<Record<string, Preview>>;
  className?: string;
}) {
  return (
    <BoardPage
      spec={spec}
      className={className}
      evidence={(sectionId, at) => {
        const option = at[sectionId];
        const preview = option ? previews[`${sectionId}.${option}`] : null;
        return typeof preview === "function" ? preview(at) : (preview ?? null);
      }}
    />
  );
}
