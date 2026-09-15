"use client";

import { cn } from "@/lib/utils";

import type { BoardSpec, BoardState, Note } from "./board-spec";

/**
 * THE BUILDER'S NOTES ON A SECTION, EACH CARRYING THE STATE IT WAS WRITTEN IN.
 *
 * ★ A NOTE WITHOUT ITS STATE IS A NOTE ABOUT SOMETHING THE READER CANNOT SEE.
 * "The corner opens a hole here" is true at canvas 375 with candidate D and
 * false at 1440 with today, and a reader who arrives in the wrong state
 * concludes the note is wrong rather than that he is looking at the wrong
 * thing. So a note declares the state, the panel says so when the board is not
 * in it, and one press puts the board there.
 *
 * These are the AI's notes, and they are labelled as such. Will's live in the
 * ledger (`docs/reviews/`), which the lab reads and never writes.
 */
export function Notes({
  spec,
  section,
  state,
  setState,
  className,
}: {
  spec: BoardSpec;
  section: string;
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  className?: string;
}) {
  const notes = (spec.notes ?? []).filter((n) => n.section === section);
  if (notes.length === 0) return null;
  return (
    <ul className={cn("flex max-w-2xl flex-col gap-2", className)}>
      {notes.map((n, i) => (
        <NoteRow key={i} note={n} state={state} setState={setState} />
      ))}
    </ul>
  );
}

function NoteRow({
  note,
  state,
  setState,
}: {
  note: Note;
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
}) {
  const want = note.state ?? {};
  const pairs = Object.entries(want) as [string, string][];
  const matches = pairs.every(([k, v]) => state[k] === v);
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Note: </span>
        {note.text}
      </p>
      {pairs.length > 0 && !matches ? (
        <button
          type="button"
          onClick={() => setState(want as Record<string, string>)}
          className="self-start rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Written at {pairs.map(([k, v]) => `${k} ${v}`).join(", ")}. Go there.
        </button>
      ) : null}
    </li>
  );
}
