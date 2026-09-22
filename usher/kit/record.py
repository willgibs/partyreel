#!/usr/bin/env python3
"""record.py <record.json>: one lane's record applied to the snapshot docs, under their caps, through one door.

The JSON: {"status": [{"id": "...", "state": "...", "desc": "..."}], "orchestrator": [{"id": "...", "row": "| `id` | ... |"}],
"roadmap": ["- <a future task, one line>"], "retire_roadmap": ["substring", ...]}. Every key optional. STATUS rows go through
status-row.py's rule (refined once, never added twice); an orchestrator row replaces the row whose first cell is `id` or is
added after the last row; ROADMAP lines land at the head of "## Now"; retire_roadmap deletes the Now lines containing each
substring (each must match exactly one). What shipped is not recorded here: the merge commit carries each lane's summary,
and git log is the history.
"""
import json, sys, pathlib, subprocess
if len(sys.argv) != 2: sys.exit(__doc__)
rec = json.loads(pathlib.Path(sys.argv[1]).read_text())
if rec.get("changelog"): sys.exit("record.py: there is no CHANGELOG; put the summary in the merge commit message")
KIT = pathlib.Path(__file__).resolve().parent
def rw(p, f):
    path = pathlib.Path(p); t = path.read_text(); t2 = f(t); path.write_text(t2)
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
            at = max(i for i, l in enumerate(lines) if l.startswith("| `")) + 1
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
st = len(pathlib.Path("docs/STATUS.md").read_text().split("\n"))
print(f"caps: STATUS {st} of 120 lines{' (OVER)' if st > 120 else ''}")
