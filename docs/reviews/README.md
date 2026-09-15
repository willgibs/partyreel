# The review ledgers

> **ROLE:** Will's answers and notes on the boards, one JSON file per board plus `_window.json` for
> a round's notes that bind every board. **BELONGS HERE:** ask ids, choices, notes, who and when.
> **NOT HERE:** the questions themselves (a board's `spec.ts` is the one home; a ledger stores ask
> ids, never the text), the rulings once they land (the bible, `docs/decisions/design-record.md`).
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
A new round is opened by the Orchestrator when it spawns it. `_window.json` holds notes whose `on`
is a board id or `null` for the whole window. The desk derives "Waiting on Will" as every ask on a
standing board with no answer in its latest round; a board whose asks are all answered shows its
ruling draft. When a board leaves the lab (its ruling landed) its ledger is deleted with it.

## The message grammar

`review <board> r<n>: <ask>=<option> "an optional note"; <ask>=<option>; note: "a board-wide note"`
