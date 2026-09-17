"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Answer, BoardMeta, BoardSection } from "./answer";
import { BoardPageProvider, useBoardPage } from "./board-page-context";
import type { BoardSpec, BoardState } from "./board-spec";
import { ControlKnobs, useBoardState } from "./board-state";
import { BoardDock } from "./dock";
import { Notes } from "./notes";
import { Step } from "./step";
import { Walk } from "./walk";

/**
 * THE BOARD PAGE TEMPLATE (the Library x Lab round, 2026-09-15).
 *
 * A board is two files: a `spec.ts` that is pure data and a `board.tsx` that is
 * the evidence, a function of the declared state. This renders the first and
 * calls the second, in ONE fixed order, for every board:
 *
 *   the dock · the Answer · the sections · the meta · the context
 *
 * ★ AND IN SESSION MODE IT RENDERS THE STEP AND NOTHING ELSE (the stepped
 * review, 2026-09-16). A review is a form now: one context and its question
 * alone on the screen, with the evidence the step needs drawn BY the step
 * through this same `evidence(section, state, api)`. The sections are not
 * mounted at all, so a reviewer answering a question about the composer is not
 * also scrolling past the other eleven sections, the dock, the index and two
 * restatements of the ask he is being asked. "Open the whole board" in the
 * step's spine drops `?session=` and everything below comes back.
 *
 * ★ THE ORDER IS THE POINT, AND IT IS NOT NEGOTIABLE PER BOARD. Every board
 * before the template opened with three paragraphs of how it got here, then its
 * index, then seventeen thousand pixels of evidence, with the thing being asked
 * at the very bottom. A reviewer's first screen has to be the question, the
 * answer, the case, and the words he can reply with; the argument is evidence
 * FOR an answer and belongs under it; the history belongs at the end, collapsed.
 * A board cannot put prose before its first section, because the place a board
 * would put that prose is exactly where the answer goes.
 *
 * ★ THE DENSITY DISCIPLINE IS IN THE SPEC, NOT IN A REVIEW. `LIMITS` in
 * board-spec.ts caps every string the template renders above the fold, and
 * `registry.test.ts` fails a spec that exceeds one. A limit is a cheap, boring
 * guard against the one failure mode every long board has: the author knows too
 * much and the reviewer reads none of it.
 *
 * ★ THE STATE IS ALSO ON THE ROOT, AS DATA ATTRIBUTES. Every declared control
 * becomes `data-<id>="<option>"` on the board's root, so a board's own sheet can
 * select on it (`[data-motion="rest"] .lamp { animation: none }`) instead of
 * inventing a second board-wide flag that React has to thread through every
 * part. It is also how Rest stays narrow: the board's sheet decides exactly what
 * freezes, and a blanket `animation: none` would stop the marketing reveal
 * grammar on the real sections, whose pre-animation state is opacity 0.
 *
 * ★ AND THE STATE IS DECLARED, WHICH IS WHAT MAKES THE REST WORK. The dock's
 * knobs, the URL a review note is pasted with, the walk's steps and the evidence
 * itself all read one `spec.controls`; a board holding its switches in ad-hoc
 * `useState` can have none of those and every board before this one had none.
 */
export function BoardPage({
  spec,
  dock,
  evidence,
  className,
}: {
  spec: BoardSpec;
  /** The board's own dock cluster: an Apply, a Replay, a reload. */
  dock?: (state: BoardState, api: BoardApi) => React.ReactNode;
  /** One section's evidence. Called per section, in declaration order. */
  evidence: (
    sectionId: string,
    state: BoardState,
    api: BoardApi,
  ) => React.ReactNode;
  className?: string;
}) {
  const { state, setState, controls } = useBoardState(spec);
  const outer = useBoardPage();
  const api: BoardApi = { setState, spec };
  const session = outer?.review;

  if (session)
    return (
      <div
        data-board={spec.id}
        {...Object.fromEntries(
          controls.map((c) => [`data-${c.id}`, state[c.id] ?? c.default]),
        )}
        className={cn("flex flex-col", className)}
      >
        <Step
          boardId={spec.id}
          steps={session.steps}
          param={session.param}
          transcribed={session.transcribed}
          build={session.build}
          board={{
            controls,
            state,
            // The step draws a section in a state of its OWN (an option's
            // tile), which is not the board's: `evidence` takes the state it
            // is handed rather than closing over the live one.
            evidence: (sectionId, at) => evidence(sectionId, at, api),
            setState,
          }}
        />
      </div>
    );

  return (
    <BoardPageProvider
      value={{
        id: spec.id,
        title: spec.title,
        // The sections come from the spec so the dock's menu cannot drift from
        // what is rendered; the neighbours come from the route, which is the
        // only thing that knows the registry order.
        sections: spec.sections.map((s) => ({ id: s.id, label: s.title })),
        prev: outer?.prev,
        next: outer?.next,
        review: outer?.review,
      }}
    >
      <div
        data-board={spec.id}
        {...Object.fromEntries(
          controls.map((c) => [`data-${c.id}`, state[c.id] ?? c.default]),
        )}
        className={cn("flex flex-col gap-10 pb-4", className)}
      >
        <BoardDock
          label={`${spec.title}: the board's controls`}
          aside={
            <>
              {dock?.(state, api)}
              <Walk spec={spec} setState={setState} />
            </>
          }
        >
          <ControlKnobs controls={controls} state={state} setState={setState} />
        </BoardDock>

        <Answer spec={spec} />

        {spec.sections.map((section, i) => (
          <BoardSection
            key={section.id}
            boardId={spec.id}
            n={i + 1}
            section={section}
          >
            {evidence(section.id, state, api)}
            <Notes
              spec={spec}
              section={section.id}
              state={state}
              setState={setState}
            />
          </BoardSection>
        ))}

        <BoardMeta spec={spec} />

        <History spec={spec} />
      </div>
    </BoardPageProvider>
  );
}

export type BoardApi = {
  setState: (patch: Record<string, string>) => void;
  spec: BoardSpec;
};

/**
 * How the board got here, and what every earlier round changed. Collapsed,
 * because it is the one part of a board that is for the AUTHOR of the next
 * round rather than for the reviewer of this one, and a reviewer who reads it
 * first reads the board through the last round's eyes.
 */
function History({ spec }: { spec: BoardSpec }) {
  const [open, setOpen] = useState(false);
  const rounds = spec.history ?? [];
  if (!spec.context && rounds.length === 0) return null;
  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? "Hide how it got here" : "How it got here"}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {spec.context ? <p>{spec.context}</p> : null}
          {rounds.map((r) => (
            <p key={r.n}>
              <span className="font-medium text-foreground">
                Round {r.n}, {r.date}:{" "}
              </span>
              {r.changed}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
