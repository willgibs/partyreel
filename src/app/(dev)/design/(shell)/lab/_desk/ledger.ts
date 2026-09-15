import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Ledger, LedgerNote } from "./queue";

/**
 * THE LEDGER READER (the Library x Lab round, 2026-09-15): docs/reviews/, as
 * data, at request time. The desk derives "Waiting on you" from the specs
 * minus these answers, so it has to read them; it never writes them. Will's
 * decision the same day: the lab composes a message he pastes into chat and
 * `pnpm lab:review` appends here, so nothing in this app has a write path to
 * the repo.
 *
 * This is the LOCAL reader the lab-desk manifest asks for. The rules track's
 * `design/review/status.ts` is the intended home once it lands; when it does,
 * this file is deleted and the desk imports that instead. Keep the derivation
 * itself in `queue.ts` (pure, no node): only the file access lives here.
 *
 * A malformed or half-written ledger must never take the desk down, so every
 * file is parsed defensively and a bad one is skipped.
 */

const DIR = ["docs", "reviews"];

function parse(raw: string, fallbackBoard: string): Ledger | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const board = typeof o.board === "string" ? o.board : fallbackBoard;
  const rounds = Array.isArray(o.rounds) ? o.rounds : [];
  return {
    board,
    rounds: rounds.flatMap((r) => {
      if (!r || typeof r !== "object") return [];
      const round = r as Record<string, unknown>;
      const n = Number(round.n);
      if (!Number.isFinite(n)) return [];
      const answers = Array.isArray(round.answers) ? round.answers : [];
      const notes = Array.isArray(round.notes) ? round.notes : [];
      return [
        {
          n,
          opened: typeof round.opened === "string" ? round.opened : "",
          answers: answers.flatMap((a) => {
            const x = (a ?? {}) as Record<string, unknown>;
            if (typeof x.ask !== "string" || typeof x.choice !== "string")
              return [];
            return [
              {
                ask: x.ask,
                choice: x.choice,
                note: typeof x.note === "string" ? x.note : undefined,
                by: typeof x.by === "string" ? x.by : "Will",
                at: typeof x.at === "string" ? x.at : "",
              },
            ];
          }),
          notes: notes.flatMap((nt) => {
            const x = (nt ?? {}) as Record<string, unknown>;
            if (typeof x.text !== "string") return [];
            return [
              {
                on: typeof x.on === "string" ? x.on : null,
                text: x.text,
                by: typeof x.by === "string" ? x.by : "Will",
                at: typeof x.at === "string" ? x.at : "",
              },
            ];
          }),
        },
      ];
    }),
  };
}

/** Every board's ledger, by board id. `_window.json` is not a board and is excluded. */
export function readLedgers(): Map<string, Ledger> {
  const dir = join(process.cwd(), ...DIR);
  const out = new Map<string, Ledger>();
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
  } catch {
    return out;
  }
  for (const f of files) {
    let raw = "";
    try {
      raw = readFileSync(join(dir, f), "utf8");
    } catch {
      continue;
    }
    const ledger = parse(raw, f.replace(/\.json$/, ""));
    if (ledger) out.set(ledger.board, ledger);
  }
  return out;
}

/**
 * The window's notes: the round's notes that bind every board (`on: null`) and
 * the ones aimed at a single board. Read from the LAST round in the file, the
 * one the Orchestrator opened for this window.
 */
export function readWindowNotes(): { round: number; notes: LedgerNote[] } {
  let raw = "";
  try {
    raw = readFileSync(join(process.cwd(), ...DIR, "_window.json"), "utf8");
  } catch {
    return { round: 0, notes: [] };
  }
  const ledger = parse(raw, "_window");
  const round = ledger?.rounds.at(-1);
  return { round: round?.n ?? 0, notes: round?.notes ?? [] };
}
