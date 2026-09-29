#!/usr/bin/env python3
"""predates-sweep.py [registry.ts] [sandbox dir]: drops each PREDATES entry whose board folder is gone.

PREDATES (sandbox/registry.ts) holds the desk facts of the two boards whose specs were cut before the lab revamp gave a
board its own folder; each entry goes when its board retires, which is a folder deletion. merge-lane.sh runs this after
a merge so the retirement needs no hand edit (registry.test.ts refuses a stale entry); negative.sh feeds it a copy.
Prints what it dropped; writes only when it drops something. Transitional: nothing to do once PREDATES is empty.
"""
import os, re, sys

reg = sys.argv[1] if len(sys.argv) > 1 else "src/app/(dev)/design/sandbox/registry.ts"
sandbox = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(reg)
s = open(reg).read() if os.path.exists(reg) else ""
i = s.find("export const PREDATES")
if i < 0:
    print(reg, "PREDATES: none"); sys.exit(0)
j = s.index("\n};", i)
block = s[i:j]
gone = [m for m in re.finditer(r'\n  "([a-z0-9-]+)": \{.*?\n  \},', block, re.S) if not os.path.exists(os.path.join(sandbox, m.group(1), "spec.ts"))]
for m in reversed(gone):
    block = block[:m.start()] + block[m.end():]
if gone:
    open(reg, "w").write(s[:i] + block + s[j:])
print(reg, "PREDATES dropped:", ", ".join(m.group(1) for m in gone) or "nothing")
