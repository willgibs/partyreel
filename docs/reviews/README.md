# The review ledgers

> **ROLE:** Will's answers and notes on the boards, one JSON file per board plus `_window.json` for
> a round's notes that bind every board and `_library.json` for his verdicts on Library entries.
> **BELONGS HERE:** ask ids, choices (an option id, or `null` for "not clear to me"), catalog item
> verdicts (`keep | refine | kill`), Library entry verdicts (`keep | redesign | retire`), notes, who and when.
> **NOT HERE:** the questions themselves (a board's `spec.ts` is the one home; a ledger stores ask
> ids, never the text), the rulings once they land (the bible, `docs/design/rulings.md`).
> **GROWS BY:** Will answers on the board (the panel composes one message he pastes into chat); the
> Orchestrator runs `pnpm lab:review "<the line>"` which validates every ask and option against the
> board's spec and appends here; the Orchestrator's own notes carry `by: "ai:orchestrator"`. The
> lab never writes this directory itself (Will's decision, 2026-09-15). Never owned by a track.

## The shape

```json
{
  "board": "palette",
  "rounds": [
    {
      "n": 4,
      "opened": "2026-09-15",
      "answers": [
        { "ask": "model", "choice": "registers", "note": "a hair lifter", "by": "Will", "at": "2026-09-15T14:02:00Z" }
      ],
      "notes": [
        { "on": null, "text": "Read the whole board before the desk shows it answered.", "by": "ai:orchestrator", "at": "2026-09-15T14:05:00Z" }
      ]
    }
  ]
}
```

One answer per ask per round; answering again in the same round overwrites (git keeps the first).
A `choice` of `null` is Will's "this question is not clear to me" (`<ask>=? "why"` in the grammar;
the note is required): the ask stays open on the desk, flagged as waiting on a clearer question,
and the board rewrites it before he is asked again (the clarity round, 2026-09-15).
A new round is opened by the Orchestrator when it spawns it. `_window.json` holds notes whose `on`
is a board id or `null` for the whole window. The desk derives "Waiting on Will" as every ask on a
standing board with no answer in its latest round; a board whose asks are all answered shows its
ruling draft. When a board leaves the lab (its ruling landed) its ledger is deleted with it.

## The message grammar

`review <board> r<n>: <ask>=<option> "an optional note"; item:<id>=<verdict> "an optional note"; note: "a board-wide note"`

Paste as you go: the review card's spine and the desk carry "Copy so far", which composes every answer,
verdict and note held at that moment, one line per board; a later paste of the same ask or item
overwrites, so a sitting can land in batches. A multi-line paste is transcribed through stdin
(`printf '%s\n' "<the lines>" | node scripts/lab-review.mjs`) or as one argument to `node` directly:
`pnpm lab:review` flattens the newlines inside an argument into spaces.

`review <board> r<n>: <ask>=? "what was unclear"` records "not clear to me" (the note is required).
An option is its id (one token); the board's spec carries the label and the meaning a reviewer reads.

`item:<id>=keep|refine|kill` rules on ONE card of a board's catalog (the revamp, 2026-09-16), where
`<id>` is a candidate id from the board's spec. The `item:` prefix keeps the two namespaces apart: an
ask id and a candidate id are both one token and a board may use the same word for both. A board that
declares no `catalog` has no items, and a ruling on one is refused. One verdict per item per round;
ruling again in the same round overwrites, exactly as answering an ask again does, and a round gains
`items: [{ item, verdict, note?, by, at }]` beside its `answers`.

`review library: <entry-id>=keep|redesign|retire "an optional note"` rules on a LIBRARY entry and
lands in `_library.json`, whose shape is `{ "entries": [{ entry, verdict, note?, by, at }] }` with no
rounds: the Library is not explored in rounds, so there is one ruling per entry and the newest
overwrites. An `<entry-id>` is a component id from `rules.generated.json`, which is the last segment
of its `/design/library` URL. The desk reads the `redesign` and `retire` ones as "Redesigns you asked
for", which is the queue the Orchestrator cuts tracks from.
