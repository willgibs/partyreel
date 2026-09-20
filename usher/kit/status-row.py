#!/usr/bin/env python3
"""status-row.py <id> <state> [--desc <desc>]: the STATUS row for one id, refined in place or added once, never twice.

Born 2026-09-20: a record script ADDED a `body-type` row while one already stood, and STATUS carried two rows for
one board for an hour. Every record script now goes through this: find the row by its first cell, replace its
state cell (the third), keep its description unless --desc; add the row after the last board row only if none exists.
"""
import sys, pathlib
p = pathlib.Path("docs/STATUS.md")
args = sys.argv[1:]
if len(args) < 2: sys.exit(__doc__)
rid, state = args[0], args[1]
desc = args[args.index("--desc") + 1] if "--desc" in args else None
lines = p.read_text().split("\n")
hits = [i for i, l in enumerate(lines) if l.startswith(f"| `{rid}` |")]
if len(hits) > 1: sys.exit(f"STATUS holds {len(hits)} rows for `{rid}`: fold them by hand first")
if hits:
    cells = lines[hits[0]].split(" | ")
    if desc: cells[1] = desc
    cells[2] = state + (" |" if cells[2].rstrip().endswith("|") else "")
    lines[hits[0]] = " | ".join(cells); verb = "refined"
else:
    if not desc: sys.exit(f"no row for `{rid}`: pass --desc to add one")
    last = max(i for i, l in enumerate(lines) if l.startswith("| `"))
    lines.insert(last + 1, f"| `{rid}` | {desc} | {state} |"); verb = "added"
p.write_text("\n".join(lines)); print(f"STATUS: `{rid}` {verb}")
