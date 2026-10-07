import { z } from "zod";

import file from "../../../docs/calls.json";

import { answersFor, type CallKind } from "./answers";

/**
 * THE CALLS, READ SIDE (calls-desk; Will, 2026-10-07: the calls doc "had become a decision log", and "probably just
 * build it into the lab for easier handling"). `docs/calls.json` holds only the decisions built into Partyreel that he
 * cannot see by using it, where his view may differ: the open questions first, then the calls by theme. The desk's
 * Calls place draws them and he answers in a press; the answers ride the desk's one message, `pnpm lab:review` prints
 * where each goes, and the record retires each answered entry the same day through `usher/kit/calls.py`, the file's
 * only writer, which refuses whatever these rules refuse.
 *
 * ★ READ AT IMPORT AND CHECKED THERE. The file is small and static between records, so it rides the build like a
 * board's spec does (no tracing for the alias, no read per request); a file that breaks a rule stops the desk with its
 * reason rather than drawing half of it. `calls.test.ts` holds the same file to the same rules first, with what this
 * cannot see from a browser (that each call's home exists).
 */

/** The most entries the file holds: an answer leaves before another enters. */
export const CALLS_CAP = 30;
/** A line, as the docs wrap one: 120 characters. */
export const LINE = 120;
/** How many lines each field may run: a call's body three, its "Change it if" one. */
export const LINES = {
  title: 1,
  body: 3,
  changeIf: 1,
  recommended: 3,
  alternative: 2,
} as const;
/** A question offers at most this many other ways besides its recommendation and his own words. */
export const MAX_ALTERNATIVES = 4;
/** One to three capitals and a number: X18, CH1. Kept for good, and never used again once retired. */
export const CALL_ID = /^[A-Z]{1,3}[0-9]{1,3}$/;
/** Where a call's fact lives, so a kept call can leave the list. */
const HOME = /^docs\/systems\/[a-z0-9-]+\.md$/;

/** Words that fit `lines` of the docs' measure, one line with no space at its ends. */
const words = (lines: number) =>
  z
    .string()
    .min(1)
    .max(lines * LINE, {
      error: `runs past ${lines} line${lines === 1 ? "" : "s"} (${lines * LINE} characters)`,
    })
    .refine((s) => s === s.trim() && !s.includes("\n"), {
      error: "is one line with no space at its ends",
    });

const id = z.string().regex(CALL_ID);

const QuestionSchema = z.strictObject({
  id,
  kind: z.literal("question"),
  theme: z.string().min(1),
  title: words(LINES.title),
  body: words(LINES.body),
  /** What the record would build: the answer one press sends. */
  recommended: words(LINES.recommended),
  /** The other ways, each one press: `alt1` is the first. */
  alternatives: z
    .array(words(LINES.alternative))
    .max(MAX_ALTERNATIVES)
    .refine((xs) => new Set(xs).size === xs.length, {
      error: "lists an alternative twice",
    }),
});

const CallSchema = z.strictObject({
  id,
  kind: z.literal("call"),
  theme: z.string().min(1),
  title: words(LINES.title),
  /** A call is three lines at most: the runbook's test, held here and at the door. */
  body: words(LINES.body),
  /** When he would want it otherwise, last. */
  changeIf: words(LINES.changeIf),
  /** The `docs/systems/` doc that holds the fact. */
  home: z.string().regex(HOME),
});

const EntrySchema = z.discriminatedUnion("kind", [QuestionSchema, CallSchema]);

export const CallsFileSchema = z
  .strictObject({
    /** The themes, in the order the desk draws the calls. */
    themes: z.array(words(LINES.title)).min(1),
    entries: z.array(EntrySchema).max(CALLS_CAP, {
      error: `holds at most ${CALLS_CAP}: an answer leaves before another enters`,
    }),
    /** Every id ever used and answered since: never used again. */
    retired: z.array(id),
  })
  .superRefine((f, ctx) => {
    const say = (message: string) => ctx.addIssue({ code: "custom", message });
    if (new Set(f.themes).size !== f.themes.length)
      say("a theme is listed twice");
    if (new Set(f.retired).size !== f.retired.length)
      say("an id is retired twice");
    const seen = new Set<string>();
    for (const e of f.entries) {
      if (seen.has(e.id)) say(`${e.id} is open twice`);
      seen.add(e.id);
      if (f.retired.includes(e.id))
        say(
          `${e.id} was used before (it is retired), and an id is never used again`,
        );
      if (!f.themes.includes(e.theme))
        say(`${e.id}'s theme "${e.theme}" is not one the file lists`);
    }
    // Questions first, in the record's own order; then the calls, grouped in the themes' order.
    const rank = f.entries.map((e) =>
      e.kind === "question" ? -1 : f.themes.indexOf(e.theme),
    );
    if (rank.some((r, i) => i > 0 && r < rank[i - 1]))
      say(
        "the questions come first, then the calls grouped in the themes' order",
      );
  });

export type CallEntry = z.infer<typeof EntrySchema>;
export type QuestionEntry = z.infer<typeof QuestionSchema>;
export type BuiltCall = z.infer<typeof CallSchema>;
export type CallsFile = z.infer<typeof CallsFileSchema>;

/** The file as the record left it, checked as it is read. */
export const CALLS: CallsFile = CallsFileSchema.parse(file);

/** What the composer needs of an open entry: its kind, the answers it takes, and where it stands in the list. */
export type OpenCall = {
  kind: CallKind;
  answers: readonly string[];
  at: number;
};

/** The open entry an id names, as the composer reads it; undefined once it has left (answered and retired). */
export function openCall(
  id: string,
  calls: CallsFile = CALLS,
): OpenCall | undefined {
  const at = calls.entries.findIndex((e) => e.id === id);
  if (at < 0) return undefined;
  const entry = calls.entries[at];
  return { kind: entry.kind, answers: answersFor(entry), at };
}

/** The calls of each theme in the themes' order, a theme with none left out. */
export function callsByTheme(
  calls: CallsFile = CALLS,
): { theme: string; calls: BuiltCall[] }[] {
  return calls.themes
    .map((theme) => ({
      theme,
      calls: calls.entries.filter(
        (e): e is BuiltCall => e.kind === "call" && e.theme === theme,
      ),
    }))
    .filter((t) => t.calls.length > 0);
}

/** The open questions, in the record's order. */
export const questionsOf = (calls: CallsFile = CALLS): QuestionEntry[] =>
  calls.entries.filter((e): e is QuestionEntry => e.kind === "question");
