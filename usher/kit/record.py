#!/usr/bin/env python3
"""record.py <record.json>: one lane's record applied to the four record docs, under their caps, through one door.

The JSON: {"changelog": "<the bullet, markdown, no trailing Next>", "status": [{"id": "...", "state": "...", "desc": "..."}],
"orchestrator": [{"id": "...", "row": "| `id` | ... |"}], "roadmap": ["- From `x` (date): ..."], "retire_roadmap": ["substring", ...]}
Every key optional. STATUS rows go through status-row.py's rule (refined once, never added twice); an orchestrator row
replaces the row whose first cell is `id` or is added before the queue row; ROADMAP lines land at the head of "## Now";
retire_roadmap deletes the Now lines containing each substring (each must match exactly one). Then the caps are printed:
the CHANGELOG's first entry at most 160 lines (over 150 it says to open a new entry at the next record) and STATUS at
most 120. Born 2026-09-20 after a day of ad hoc record scripts, one of which doubled a STATUS row.
"""
import json, sys, pathlib, re, subprocess
if len(sys.argv) != 2: sys.exit(__doc__)
rec = json.loads(pathlib.Path(sys.argv[1]).read_text())
KIT = pathlib.Path(__file__).resolve().parent
NEXT = "**Next.**"
def rw(p, f):
    path = pathlib.Path(p); t = path.read_text(); t2 = f(t); path.write_text(t2)
if rec.get("changelog"):
    def f(t):
        i = t.index(NEXT); return t[:i] + rec["changelog"].rstrip("\n") + "\n\n" + t[i:]
    rw("docs/CHANGELOG.md", f); print("CHANGELOG: bullet added before the first entry's Next")
for row in rec.get("status", []):
    args = [sys.executable, str(KIT / "status-row.py"), row["id"], row["state"]] + (["--desc", row["desc"]] if row.get("desc") else [])
    r = subprocess.run(args, capture_output=True, text=True); print(r.stdout.strip() or r.stderr.strip())
    if r.returncode: sys.exit(r.returncode)
for row in rec.get("orchestrator", []):
    def f(t, row=row):
        lines = t.split("\n"); hits = [i for i, l in enumerate(lines) if l.startswith(f"| `{row['id']}` |")]
        if len(hits) > 1: sys.exit(f"orchestrator.md holds {len(hits)} rows for `{row['id']}`")
        if hits: lines[hits[0]] = row["row"]; print(f"orchestrator: `{row['id']}` replaced")
        else:
            q = next((i for i, l in enumerate(lines) if l.startswith("| ") and " running" in l and "|" in l[2:] and l.count("|") >= 4 and "`" in l and "cut as seats free" in l), None)
            at = q if q is not None else max(i for i, l in enumerate(lines) if l.startswith("| `")) + 1
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
cl = pathlib.Path("docs/CHANGELOG.md").read_text().split("\n")
heads = [i for i, l in enumerate(cl) if l.startswith("## ")]
entry = (heads[1] - heads[0]) if len(heads) > 1 else len(cl) - heads[0]
st = len(pathlib.Path("docs/STATUS.md").read_text().split("\n"))
print(f"caps: CHANGELOG first entry {entry} of 160 lines{' (OVER: trim now)' if entry > 160 else ' (open a new entry at the next record)' if entry > 150 else ''}; STATUS {st} of 120{' (OVER)' if st > 120 else ''}")
