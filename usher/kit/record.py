#!/usr/bin/env python3
"""record.py <record.json>: one lane's record applied to the snapshot docs, under their caps, through one door.

The JSON: {"orchestrator": [{"id": "...", "row": "| `id` | ... |"}], "roadmap": ["- <a future task, one line>"],
"retire_roadmap": ["substring", ...]}. Every key optional. An orchestrator row replaces the row whose first cell is `id` or
is added after the last row; ROADMAP lines land at the head of "## Now"; retire_roadmap deletes the Now lines containing
each substring (each must match exactly one). Two things are never written here: what shipped (the merge commit carries
each lane's summary; git log is the history) and STATUS (a snapshot the Orchestrator rewrites by hand).
"""
import json, sys, pathlib
if len(sys.argv) != 2: sys.exit(__doc__)
rec = json.loads(pathlib.Path(sys.argv[1]).read_text())
if rec.get("changelog"): sys.exit("record.py: there is no CHANGELOG; put the summary in the merge commit message")
if rec.get("status"): sys.exit("record.py: STATUS is a snapshot; rewrite it by hand")
def rw(p, f):
    path = pathlib.Path(p); t = path.read_text(); t2 = f(t); path.write_text(t2)
for row in rec.get("orchestrator", []):
    def f(t, row=row):
        lines = t.split("\n"); hits = [i for i, l in enumerate(lines) if l.startswith(f"| `{row['id']}` |")]
        if len(hits) > 1: sys.exit(f"orchestrator.md holds {len(hits)} rows for `{row['id']}`")
        if hits: lines[hits[0]] = row["row"]; print(f"orchestrator: `{row['id']}` replaced")
        else:
            rows = [i for i, l in enumerate(lines) if l.startswith("| `")]
            # An empty In flight table has only its header: the first row goes under the separator.
            at = (max(rows) if rows else next(i for i, l in enumerate(lines) if l.startswith("| --- |"))) + 1
            lines.insert(at, row["row"]); print(f"orchestrator: `{row['id']}` added")
        return "\n".join(lines)
    rw("docs/tracks/orchestrator.md", f)
if rec.get("roadmap") or rec.get("retire_roadmap"):
    def f(t):
        lines = t.split("\n"); now = next(i for i, l in enumerate(lines) if l.startswith("## Now"))
        for sub in rec.get("retire_roadmap", []):
            hits = [i for i, l in enumerate(lines) if l.startswith("- ") and sub in l]
            if len(hits) != 1: sys.exit(f"ROADMAP: {len(hits)} lines match {sub!r}, need exactly one")
            del lines[hits[0]]; print(f"ROADMAP: retired the line matching {sub!r}")
        first = next(i for i in range(now + 1, len(lines)) if lines[i].startswith("- "))
        for line in reversed(rec.get("roadmap", [])): lines.insert(first, line.rstrip("\n")); print("ROADMAP: line added under Now")
        return "\n".join(lines)
    rw("docs/ROADMAP.md", f)
# Counted as record-depth-policy.test.ts counts it (and `wc -l`): a trailing newline ends the last line, it adds none.
st = len(pathlib.Path("docs/STATUS.md").read_text().removesuffix("\n").split("\n"))
print(f"caps: STATUS {st} of 80 lines{' (OVER)' if st > 80 else ''}")
