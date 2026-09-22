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
| `docs-rules` | the rulings log distilled into the rules it became, then retired with its Library page; the specs and the `RULINGS` registry kept to current rules | cut `6fd4bbbd`, committed `45e249a4`; running (agent `a381b34df5d5373d6`; resume by SendMessage) | Opus, :3131 | integrate (`none`); place its "For other homes" lines; its memory candidates into memory |
| `systems-trim` | `docs/systems/` and `docs/SYSTEMS.md` trimmed to present-tense truth, headings untouched | cut `6fd4bbbd`, committed `45e249a4`; running (agent `a7113c2ad80271cd8`; resume by SendMessage) | Opus, :3132 | integrate (`none`) |
| `roadmap-lean` | `docs/ROADMAP.md` and `docs/ASSETS.md` as current open work only | cut `6fd4bbbd`, committed `45e249a4`; running (agent `abe20689a44c608c4`; resume by SendMessage) | Opus, :3133 | integrate (`none`); return `docs/ROADMAP.md` and `docs/ASSETS.md` to `NEVER_OWNED` in `src/lib/track-manifests.test.ts`; place its "For other homes" lines |

## Next, in order

1. **The reshape (Will, 2026-09-22):** the Orchestrator's own part is done (`76dcea01`, `8f68e749`: STATUS a
   snapshot, the runbook, `docs/PROGRAM.md` and `docs/tracks/README.md` as rules, the STATUS-row tool retired,
   `usher/` without logs, the old pickup file a pointer, memory consolidated). Left: integrate the four lanes one at a
   time as each hands off (gate 116 onward, board `none`); after `roadmap-lean`, the lab candidates from the retired
   `usher/atlas/gaps.md` (kept in the scratchpad as `lab-candidates.md`) join the ROADMAP as one bucket.
2. **Recheck the open boards** (Will's suggestion for after the reshape). The survey is in (the scratchpad's
   `recheck/report.md`, every claim with its file and ask id): nine older boards carry stale asks, five are current
   (`site-chrome`, `privacy-hero`, `album-motion`, `contact-page`, `loose-ends`), none retires. Four lanes, cut once
   `pointer-sweep` (twelve of the specs, `overtaken.ts`) and `docs-rules` (`touchpoints.ts`) have merged:
   `recheck-viewer-curation` (Opus: `media-viewer`, `host-curation`; the five badges folded, the viewer asked for
   both origins, a tile and the reel; the Unverified credit and the host never seeing an address);
   `recheck-guest-identity` (Opus: `guest-capture`, `profile-page`; the door's optional email and opt-in profiles;
   what the identity boards already ask dropped; plus the three shipped lines that promise "on your profile" against
   the ruling, `src/components/auth/account-door.tsx:116`, `src/components/guest/follow-moment-card.tsx:81`,
   `src/components/guest/save-account-prompt.tsx:147`); `recheck-mail-admin-export` (Sonnet: `emails`,
   `admin-triage`, `export-flow`); `recheck-help-press` (Sonnet: `help-center`, `press-page`, whose `the-facts`
   badge folds too). At the record: `guest-capture` moves below `identity-profile` on the desk. Retiring the
   overtaken mechanism itself (the file, its test, the badge and its dock button) is Will's call (the ROADMAP names
   it his): asked in the report, recommended yes, since reshape-or-remove leaves it nothing to answer.
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
