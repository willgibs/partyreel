---
track: orchestrator
status: open
cut: "6fd4bbbd"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches (a new board adds only its own lines to the two board lists)
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "The reshape (Will, 2026-09-22): the docs carry rules, never history. `docs/CHANGELOG.md` is gone (the merge commit carries a lane's summary), `usher/kit/cut-lane.py` cuts manifests from a spec, and four lanes run on disjoint files: `docs-rules` retires `docs/design/rulings.md` and the Library's rulings page, `systems-trim` trims `docs/systems/`, `roadmap-lean` rewrites `docs/ROADMAP.md` and `docs/ASSETS.md`, `pointer-sweep` rewrites code comments that point at the retired docs. None changes behavior."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `systems-trim` | `docs/systems/` and `docs/SYSTEMS.md` trimmed to present-tense truth, headings untouched | cut `6fd4bbbd`, committed `45e249a4`; running (agent `a7113c2ad80271cd8`; resume by SendMessage) | Opus, :3132 | integrate (`none`) |
| `recheck-viewer-curation` | `media-viewer` and `host-curation` current (the five badges adapted or removed by the decision-outcomes judgment, the viewer asked for both origins, the Unverified credit); then the overtaken mechanism retired | cut `c2482757`, committed `1c560b16`; running (agent `a739c5d0751e54b60`; resume by SendMessage) | Opus, :3134 | integrate (board `media-viewer`, then demo `host-curation`); the lines it names in `docs/reviews/README.md`, STATUS, the ROADMAP and `usher/` (the kit's `batch-reader.mjs`, `board-card.mjs`, `review-sheet.mjs` read the map) |
| `recheck-guest-identity` | `guest-capture` and `profile-page` on the identity model and the live reel's tile; the three shipped lines that promise "on your profile" made true | cut `c2482757`, committed `1c560b16`; running (agent `ab0819cf5bf907ace`) | Opus, :3135 | integrate (board `guest-capture`, then demo `profile-page`); `guest-capture` moves below `identity-profile` in `DESK_ORDER` (after `docs-rules` frees `touchpoints.ts`) |
| `recheck-mail-admin-export` | `emails`, `admin-triage`, `export-flow` current | cut `c2482757`, committed `1c560b16`; running (agent `ad57c4e5337f4cc06`) | Sonnet, :3136 | integrate (board `emails`, then demo the other two) |
| `recheck-help-press` | `help-center`, `press-page` current (`press-page.the-facts` adapted) | cut `c2482757`, committed `1c560b16`; running (agent `adbe0278627fa617d`) | Sonnet, :3137 | integrate (board `help-center`, then demo `press-page`) |
| `docs-product-trim` | `PRD.md`, `PRICING.md` and the two content authoring guides in the present tense, checked against the code; Pro's case added | cut `adbb90e0`, committed `90c95d8d`; running (agent `a355006f4f0b11ea9`) | Opus, :3131 | integrate (`none`) |

## Next, in order

1. **The reshape (Will, 2026-09-22):** the Orchestrator's own part is done (`76dcea01`, `8f68e749`: STATUS a
   snapshot, the runbook, `docs/PROGRAM.md` and `docs/tracks/README.md` as rules, the STATUS-row tool retired,
   `usher/` without logs, the old pickup file a pointer, memory consolidated). `pointer-sweep` merged at `b314fc97` (gate
   116) and `roadmap-lean` at `7e068786` (gate 117; the lab candidates joined the ROADMAP as one bucket). `docs-rules` at `37e4eb15` (gate 118: `rulings.md` and the specs
   retired, the Library's rulings on its rules page). The bible's `why` lines are in the present tense (`fc63a199`).
   Left: `systems-trim` and `docs-product-trim` (In flight above).
2. **Recheck the open boards** (Will's suggestion): four lanes cut at `c2482757` (In flight above), on the survey's
   findings (the scratchpad's `recheck/report.md`) and his decision-outcomes judgment of 2026-09-22 (a reached question
   that still holds potential value is adapted to the current context; only one solved at its best is removed; the
   Orchestrator judges). Five boards were already current. The overtaken mechanism retires in `recheck-viewer-curation`
   (the Orchestrator's call under his word; his to overrule).
3. **The reel round's wiring**, after his desk review of the six reel boards: the approved plan
   `~/.claude/plans/great-work-however-1-dapper-twilight.md` (sections A to G; the expand migration first, the drop
   migration and the R2 sweep of stored reel files after the red-team).

## Waiting on Will

- **His desk review** on the alias (`c65d6ec1`, `/design/lab?key=`): the six reel boards (view, front, screen, cut,
  host, story, directly below `media-viewer`), the harnesses `/design/lab/tools/reel-live` and
  `/design/lab/tools/reel-video`, the three identity boards and the older standing boards.
- **The preview key's rotation**: a local dev log printed `DESIGN_PREVIEW_KEY` into the Orchestrator's transcript on
  2026-09-22 (in no commit; every scratchpad copy scrubbed); rotating it breaks his saved `?key=` links until he takes
  the new one from `.env.local`, so it waits for his word, ideally after his review.
