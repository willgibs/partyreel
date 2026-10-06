#!/usr/bin/env python3
"""record.py <record.json>: one lane's record applied to the snapshot docs, under their caps, through one door.

The JSON: {"orchestrator": [{"id": "...", "row": "| `id` | ... |"}],
           "roadmap": [{"bucket": "immediate", "area": "Uploads, media and exports", "line": "- <a task, one line>"}],
           "move_roadmap": [{"match": "substring", "bucket": "upcoming", "area": "..."}],
           "retire_roadmap": ["substring", ...]}. Every key optional.
An orchestrator row replaces the row whose first cell is `id` or is added after the last row. ★ A ROADMAP line is PLACED,
never appended to a pile (Will, 2026-10-06: append-only is what made "Now" unclear): it names one of the five buckets and
an area, and lands at the end of that area (the area's heading made in the buckets' foundation-upward order when it is
new); Launch is a checklist, so a launch line needs no area. `move_roadmap` carries a line (with its sub-lines) to another
bucket and area; `retire_roadmap` deletes the line containing each substring, nested or not (each must match exactly one),
and an area or the Landing section a retirement empties goes with it. Immediate holds at most 40 lines: a record that would
pass it is refused whole, so a line moves down before another lands. Two things are never written here: what shipped (the
merge commit carries each lane's summary; git log is the history) and STATUS (a snapshot rewritten by hand).
"""
import json, re, sys, pathlib

BUCKETS = {"immediate": "## Immediate", "upcoming": "## Upcoming", "before-launch": "## Before launch",
           "launch": "## Launch", "after-launch": "## After launch"}
AREAS = ["Platform, data and cost", "Security and abuse", "Billing and pricing", "Uploads, media and exports",
         "The guest's album", "Accounts and profiles", "The host app", "Admin and operations",
         "Design system and accessibility", "Marketing and content", "The lab and the kit", "Code hygiene"]
IMMEDIATE_CAP = 40

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


def bucket_span(lines, key):
    """The bucket's heading index and the index of the next `## ` heading (or the end)."""
    head = BUCKETS[key]
    a = next((i for i, l in enumerate(lines) if l == head or l.startswith(head + " ")), None)
    if a is None: sys.exit(f"ROADMAP: no {head!r} heading")
    b = next((i for i in range(a + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    return a, b


def block_end(lines, i):
    """A bullet and the deeper-indented lines that follow it."""
    j = i + 1
    while j < len(lines) and re.match(r"^\s{2,}\S", lines[j]): j += 1
    return j


def place(lines, key, area, block):
    a, b = bucket_span(lines, key)
    if key == "launch":
        # A checklist in its order: a new line lands at the end of its own list, before the gated-from-elsewhere tail.
        tail = next((i for i in range(a, b) if lines[i].startswith("### ")), b)
        at = tail
        while at > a + 1 and not lines[at - 1].strip(): at -= 1
        lines[at:at] = block; return
    if area not in AREAS: sys.exit(f"ROADMAP: area {area!r} is not one of {AREAS}")
    h = next((i for i in range(a, b) if lines[i] == f"### {area}"), None)
    if h is None:
        # A new area takes its place in the foundation-upward order.
        later = [i for i in range(a, b) if lines[i].startswith("### ") and lines[i][4:] in AREAS
                 and AREAS.index(lines[i][4:]) > AREAS.index(area)]
        at = later[0] if later else b
        while at > a + 1 and not lines[at - 1].strip() and not later: at -= 1
        lines[at:at] = ([""] if lines[at - 1].strip() else []) + [f"### {area}", ""] + block + [""]
        return
    end = next((i for i in range(h + 1, b) if lines[i].startswith("### ")), b)
    at = end
    while at > h + 1 and not lines[at - 1].strip(): at -= 1
    lines[at:at] = block


def tidy(lines):
    """An area heading, or the Landing section, left with no line goes with its blank lines."""
    out = []
    for i, l in enumerate(lines):
        out.append(l)
    changed = True
    while changed:
        changed = False
        for i, l in enumerate(out):
            if l.startswith("### ") or l.startswith("## Landing"):
                j = i + 1
                while j < len(out) and not out[j].strip(): j += 1
                if j >= len(out) or out[j].startswith("## ") or (l.startswith("### ") and out[j].startswith("### ")):
                    del out[i:j]; changed = True; break
    # A removed heading leaves its neighbours' blank lines doubled: one blank line between blocks.
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).split("\n")


if rec.get("roadmap") or rec.get("retire_roadmap") or rec.get("move_roadmap"):
    for x in rec.get("roadmap", []):
        if not isinstance(x, dict) or x.get("bucket") not in BUCKETS or not str(x.get("line", "")).startswith("- ") \
                or (x["bucket"] != "launch" and x.get("area") not in AREAS):
            sys.exit("record.py: a ROADMAP line is placed, never appended: "
                     '{"bucket": "immediate|upcoming|before-launch|launch|after-launch", "area": "<one of the areas>", '
                     f'"line": "- ..."}}; the areas: {AREAS}')
    path = pathlib.Path("docs/ROADMAP.md")
    lines = path.read_text().split("\n")
    for sub in rec.get("retire_roadmap", []):
        hits = [i for i, l in enumerate(lines) if re.match(r"^\s*- ", l) and sub in l]
        if len(hits) != 1: sys.exit(f"ROADMAP: {len(hits)} lines match {sub!r}, need exactly one")
        del lines[hits[0]:block_end(lines, hits[0])]; print(f"ROADMAP: retired the line matching {sub!r}")
    for mv in rec.get("move_roadmap", []):
        hits = [i for i, l in enumerate(lines) if re.match(r"^- ", l) and mv["match"] in l]
        if len(hits) != 1: sys.exit(f"ROADMAP: {len(hits)} lines match {mv['match']!r}, need exactly one")
        e = block_end(lines, hits[0]); block = lines[hits[0]:e]; del lines[hits[0]:e]
        place(lines, mv["bucket"], mv.get("area"), block); print(f"ROADMAP: moved {mv['match']!r} to {mv['bucket']}")
    for x in rec.get("roadmap", []):
        place(lines, x["bucket"], x.get("area"), [x["line"].rstrip("\n")])
        print(f"ROADMAP: placed under {x['bucket']}{', ' + x['area'] if x.get('area') else ''}")
    lines = tidy(lines)
    a, b = bucket_span(lines, "immediate")
    n = sum(1 for l in lines[a:b] if l.startswith("- "))
    if n > IMMEDIATE_CAP:
        sys.exit(f"ROADMAP: Immediate would hold {n} lines, past its {IMMEDIATE_CAP}: move one to Upcoming first "
                 '(move_roadmap), and nothing was written')
    path.write_text("\n".join(lines))
    print(f"caps: Immediate {n} of {IMMEDIATE_CAP} lines")
# Counted as record-depth-policy.test.ts counts it (and `wc -l`): a trailing newline ends the last line, it adds none.
status = pathlib.Path("docs/STATUS.md")
if status.exists():
    st = len(status.read_text().removesuffix("\n").split("\n"))
    print(f"caps: STATUS {st} of 80 lines{' (OVER)' if st > 80 else ''}")
