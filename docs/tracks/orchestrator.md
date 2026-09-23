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
| `identity-sql-gaps` | two identity leaks closed in SQL: an unconfirmed sign-up's address out of `guests.email` and the host's grant; `get_public_profile`'s attended arm behind the album's gate | cut `ceaee403`, committed `92421d85`; running (agent `ad831a8ca1313dc19`) | Opus, :3132 | integrate (`none`); then APPLY its migration in the order its Handoff names, `get_advisors`, regenerate `types.ts` if a signature moved |

## Next, in order

1. **The reshape (Will, 2026-09-22) is done:** every docs lane merged (`pointer-sweep`, `roadmap-lean`, `docs-rules`,
   `docs-product-trim`, `systems-trim` at `daaf2dd2`, gate 123); the Orchestrator's own part, the bible's present-tense
   `why` lines and memory are in. Next from it: `identity-sql-gaps`, a fix lane for two identity leaks the systems lane
   found (an unconfirmed sign-up's address in `guests.email` inside the host's SELECT grant; `get_public_profile`'s
   attended arm admitting any signed-in viewer where the album asks for a confirmed email); the migration is the
   Orchestrator's to apply.
2. **The board recheck is done** (Will's suggestion): all four lanes merged (`recheck-mail-admin-export`,
   `recheck-help-press`, `recheck-guest-identity`, `recheck-viewer-curation` at `c6c79885`, gate 124), each reached
   question judged by his decision-outcomes rule; the overtaken mechanism retired. Every standing board is current
   with the identity and reel rounds; one alias build carries them for his desk review.
3. **The reel round's wiring**, after his desk review of the six reel boards: the approved plan
   `~/.claude/plans/great-work-however-1-dapper-twilight.md` (sections A to G; the expand migration first, the drop
   migration and the R2 sweep of stored reel files after the red-team). The sweep lane also takes the reel's lines in
   `PRD.md`, `PRICING.md` and the two content authoring guides (the Studio and panel house terms, the reel bullet).

## Waiting on Will

- **His desk review** on the alias (`c65d6ec1`, `/design/lab?key=`): the six reel boards (view, front, screen, cut,
  host, story, directly below `media-viewer`), the harnesses `/design/lab/tools/reel-live` and
  `/design/lab/tools/reel-video`, the three identity boards and the older standing boards.
- **The preview key's rotation**: a local dev log printed `DESIGN_PREVIEW_KEY` into the Orchestrator's transcript on
  2026-09-22 (in no commit; every scratchpad copy scrubbed); rotating it breaks his saved `?key=` links until he takes
  the new one from `.env.local`, so it waits for his word, ideally after his review.
