import re, sys, os, subprocess
CUT=sys.argv[1]
R="/Users/gibby/local/ai/partyreel"; os.chdir(R)
plan=open("/Users/gibby/.claude/plans/you-are-the-new-tender-globe.md").read()
def section(head_re):
    m=re.search(r"(^## "+head_re+r".*?)(?=^## |\Z)", plan, re.S|re.M)
    assert m, head_re
    return m.group(1).strip()
rules=section(r"The ownership rules every manifest follows")
def files(cmd):
    return [l for l in subprocess.run(cmd,shell=True,capture_output=True,text=True).stdout.split("\n") if l]
dash_components=[f"src/components/app/dashboard/{f}" for f in os.listdir("src/components/app/dashboard") if f!="events-empty-teaser.tsx"]
social=[f"src/components/social/{f}" for f in os.listdir("src/components/social") if f!="guest-list.tsx"]
OWNS={
"voice-wiring":[
 "src/lib/constants/marketing-voice.ts","src/lib/constants/site.ts","src/lib/constants/feature-pages.ts","src/lib/constants/features.ts",
 "src/lib/constants/press.ts","src/lib/constants/careers.ts","src/lib/constants/events.ts","src/lib/constants/events.test.ts",
 "src/lib/content/help.ts","src/lib/content/llms.ts","src/lib/og/marketing-og-card.tsx","src/app/opengraph-image.tsx",
 "src/app/(marketing)/(cinema)/events/opengraph-image.tsx","src/app/(marketing)/(cinema)/events/[slug]/opengraph-image.tsx",
 "src/app/(marketing)/(cinema)/events/page.tsx","src/app/(marketing)/(cinema)/blog/page.tsx",
 "src/components/marketing/sections/home/trust-strip.tsx","src/components/marketing/sections/home/no-app.tsx",
 "src/components/marketing/sections/reel/guest-share-section.tsx","src/components/marketing/sections/features/qr/entry-flow.tsx",
 "src/components/marketing/sections/features/qr/print-shop.tsx","src/components/marketing/sections/features/album/entry-phone.tsx",
 "src/components/marketing/sections/features/album/album-copy.ts","src/components/marketing/sections/features/album/how-much-fits.tsx",
 "src/components/marketing/sections/how-it-works/guest-pictures.tsx","src/components/marketing/chrome/marketing-footer.tsx",
 "src/components/marketing/jsonld.tsx","src/components/marketing/faq-data.ts","src/components/marketing/sections/pricing/plan-cards.tsx",
 "src/components/marketing/sections/home/pricing-teaser.tsx","src/components/marketing/mock-parity.test.ts",
 "src/components/guest/entry-modal.tsx","src/components/guest/enter-event-prompt.tsx","src/components/guest/gallery-empty-state.tsx",
 "src/components/guest/gallery-empty-state.test.tsx","src/components/guest/save-event-button.tsx","src/components/likes/likes-provider.tsx",
 "src/components/app/welcome-flow.tsx","src/components/app/dashboard/events-empty-teaser.tsx","src/app/(dev)/design/sandbox/voice/",
 "content/help/","content/blog/"],
"home-wiring":[
 "src/app/(app)/dashboard/page.tsx","src/app/(app)/dashboard/loading.tsx","src/app/(app)/dashboard/actions.ts","src/app/(app)/dashboard/upgraded-toast.tsx",
 *dash_components,"src/lib/dashboard/","src/lib/db/queries/profile.ts","src/lib/db/queries/pulse.ts","src/app/(app)/layout.tsx",
 "src/components/app/user-menu.tsx","src/components/app/manage-billing-button.tsx","src/components/app/checkout-button.tsx",
 "src/app/(app)/account/","src/app/(guest)/u/",*social,"src/components/ui/table.tsx","src/components/ui/toggle-group.tsx"],
"hub-wiring":[
 "src/app/(app)/dashboard/[eventId]/","src/lib/event/","src/components/app/host-command-strip.tsx","src/components/app/event-feed/",
 "src/components/app/share/","src/components/app/event-share-dialog.tsx","src/components/app/event-qr.tsx","src/components/app/copy-share-link.tsx",
 "src/components/app/qr-designer-dialog.tsx","src/components/app/qr-preset-picker.tsx","src/components/app/styled-qr.tsx",
 "src/components/app/event-settings/","src/components/app/event-slug-control.tsx","src/components/app/recently-deleted-grid.tsx",
 "src/components/shared/app-shell.tsx","src/components/shared/crumbs.tsx","src/components/ui/sheet.tsx","src/components/ui/floating-layer.ts",
 "src/components/ui/floating-layer.test.ts"],
"glass-material":["src/app/(dev)/design/sandbox/glass/"],
"overtaken":["src/app/(dev)/design/(shell)/lab/_desk/","src/app/(dev)/design/(shell)/lab/[board]/","src/components/lab/","src/app/(dev)/design/sandbox/overtaken.ts","src/app/(dev)/design/sandbox/overtaken.test.ts"],
}
# the ladder's files: the grep minus the other lanes' files and prefixes, minus depicted and button files
grep=files("git grep -lE 'text-\\[(7|8|9|11|13|15|17)px\\]|text-\\[0\\.8rem\\]|tracking-\\[0\\.14em\\]' -- src ':!src/app/(dev)'")
others=[p for k,v in OWNS.items() for p in v]
depicted={"src/components/marketing/sections/how-it-works/host-pictures.tsx","src/components/marketing/sections/features/album/visibility-frames.tsx",
 "src/components/marketing/sections/features/privacy/access-switch.tsx","src/components/marketing/sections/features/guests/profiles-section.tsx",
 "src/components/marketing/press/press-sheet.tsx","src/components/marketing/help/help-emblems.tsx","src/components/marketing/sections/features/curation/review-switch.tsx"}
yaml=None
_orch=open("docs/tracks/orchestrator.md").read()
_fm=_orch.split("---")[1]
orch_owns=[l.strip()[2:].strip() for l in _fm.split("\n") if l.strip().startswith("- ") and ("src/" in l or "docs/" in l or "scripts/" in l or ".github" in l)]
def owned_by_other(f):
    return any(f==p or (p.endswith("/") and f.startswith(p)) for p in others+orch_owns) or f.startswith("src/components/dev/")
ladder=[f for f in grep if not owned_by_other(f) and f not in depicted and f!="src/components/ui/button.tsx" and not f.startswith("src/app/admin/") and not f.startswith("src/components/reel/")]
OWNS["ladder-wiring"]=["src/app/theme.css","src/app/globals.css","src/lib/utils.ts","src/lib/type-ladder-policy.test.ts",
 "src/components/marketing/system/eyebrow.tsx","src/components/marketing/system/caption.tsx","src/app/admin/","src/components/reel/",
 "src/lib/reel/engine/player.tsx","src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx",*sorted(set(ladder))]
# collision check
allp=[(k,p) for k,v in OWNS.items() for p in v]
for i,(k1,p1) in enumerate(allp):
    for k2,p2 in allp[i+1:]:
        if k1!=k2 and (p1==p2 or (p1.endswith("/") and p2.startswith(p1)) or (p2.endswith("/") and p1.startswith(p2))):
            print("OVERLAP", k1, p1, k2, p2)
READS={
"voice-wiring":["src/app/(dev)/design/rules/bible.ts","docs/reviews/voice.json","docs/design/rulings.md","src/components/marketing/system/page-hero.tsx","src/lib/constants/tiers.ts","src/components/app/create-event-wizard.tsx","src/app/(guest)/e/[token]/not-found.tsx"],
"ladder-wiring":["docs/reviews/body-type.json","docs/design/rulings.md","src/app/(dev)/design/sandbox/body-type/","src/components/ui/button.tsx","docs/systems/design-system.md"],
"home-wiring":["src/components/shared/app-shell.tsx","docs/reviews/app-shape.json","src/app/(dev)/design/sandbox/app-shape/","src/lib/constants/tiers.ts","docs/systems/billing-caps.md","docs/systems/profiles-social.md","src/components/app/event-share-dialog.tsx","src/lib/event/","src/components/app/dashboard/events-empty-teaser.tsx","src/components/social/guest-list.tsx"],
"hub-wiring":["src/components/social/guest-list.tsx","src/components/app/host-media-grid.tsx","src/components/shared/masonry.tsx","src/components/shared/media-lightbox.tsx","src/components/app/reel-panel.tsx","src/components/reel/","src/components/app/export/","src/lib/constants/tiers.ts","docs/reviews/app-shape.json","src/app/(dev)/design/sandbox/app-shape/","src/components/marketing/system/morph-delegate.tsx","src/app/(app)/layout.tsx","docs/systems/host-app.md"],
"overtaken":["scripts/lab-review.mjs","docs/reviews/README.md","docs/reviews/","docs/design/rulings.md","src/app/(dev)/design/touchpoints.ts","src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/review/ledger.ts","src/app/(dev)/design/review/status.ts"],
"glass-material":["docs/reviews/glass.json","docs/design/rulings.md","src/components/shared/media-lightbox.tsx","src/components/app/host-media-grid.tsx","src/components/guest/guest-reel-overlay.tsx","src/components/ui/floating-layer.ts","src/components/guest/guest-bar.tsx","src/components/likes/like-button.tsx","src/components/guest/guest-masonry.tsx"],
}
BOARD={"overtaken":"none            # lab infrastructure: the overtaken mechanism and the judgment lines; no board of its own","voice-wiring":"voice           # retires at this lane's merge","ladder-wiring":"body-type       # six rungs wired here; the buttons rung is round two's, another lane","home-wiring":"app-shape       # wiring; the board itself is round two's, another lane","hub-wiring":"app-shape       # wiring; the board itself is round two's, another lane","glass-material":"glass           # round two on the same board id"}
LANE_SECTION={"overtaken":r"Lane 10: `overtaken`","voice-wiring":r"Lane 1: `voice-wiring`","ladder-wiring":r"Lane 2: `ladder-wiring`","home-wiring":r"Lane 7: `home-wiring`","hub-wiring":r"Lane 8: `hub-wiring`","glass-material":r"Lane 3: `glass-material`"}
VERDICTS=section(r"The verdict map")
CONTEXT=section(r"Context")
for track in (sys.argv[2].split(",") if len(sys.argv)>2 else ["voice-wiring","ladder-wiring","home-wiring","hub-wiring","glass-material","overtaken"]):
    body=section(LANE_SECTION[track])
    goal=body.split("\n",1)[1].strip()
    owns="\n".join(f"  - {p}" for p in OWNS[track]); reads="\n".join(f"  - {p}" for p in READS[track])
    doc=f"""---
track: {track}
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "{CUT}"          # the launch-prep SHA the branch was cut from
board: {BOARD[track]}
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
{owns}
reads:                  # single-sources you depend on: never duplicate, never edit
{reads}
---

# lp/{track}

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

{goal}

## The verdict map (every answer of the batch; this lane wires only its own board's)

{VERDICTS.split(chr(10),1)[1].strip()}

## The ownership rules every lane follows this round

{rules.split(chr(10),1)[1].strip()}

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` with the 8 known warnings, `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
"""
    open(f"docs/tracks/{track}.md","w").write(doc)
    print(track, "owns", len(OWNS[track]), "lines", len(doc.split("\n")))
