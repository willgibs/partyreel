#!/usr/bin/env python3
"""closer.py <file>: after a union merge of component-notes.ts, put back the closing brace a union prints once when two
lanes' head blocks both end on an identical `  },` line (2026-09-21, app-pricing-wiring). A key that arrives without a closer
before it gets one; the comment lines above a key belong to that key. Shared by hand-merge.sh and cost-readings.mjs (the
merge replay), so the replay runs the same code the merge runs.
"""
import re,sys
p=sys.argv[1]; lines=open(p).read().split("\n"); out=[]; fixed=0
for i,l in enumerate(lines):
    if re.match(r'^  "[^"]+": \{\s*$', l):
        k=len(out)
        while k>0:
            s=out[k-1].strip()
            if s=="" or s.startswith("//"): k-=1; continue
            if s.endswith("*/"):
                while k>0 and "/*" not in out[k-1]: k-=1
                k-=1; continue
            break
        prev=out[k-1].rstrip() if k>0 else ""
        if not (prev.endswith("},") or prev.endswith("= {")):
            out.insert(k, "  },"); fixed+=1
    out.append(l)
open(p,"w").write("\n".join(out)); print("component-notes: closers inserted", fixed)
