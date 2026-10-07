---
track: calls-desk
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3ec66b8f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/calls.json
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/calls/
  - scripts/lab-review.mjs
  - usher/kit/calls.py
  - src/lib/calls/
reads:                  # single-sources you depend on: never duplicate, never edit
  - usher/kit/README.md
  - docs/PROGRAM.md
---

# lp/calls-desk

**Goal.** The calls lab moved into the lab's desk, where Will sits: the few decisions built in that he cannot see by using the product, each answered in a press, its answer riding the one message he already pastes, and a door that keeps the list from ever running away again.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**Will's word (2026-10-07), the brief's point:** the calls doc had become a decision log, every choice and its alternative appended, days of reading. Its purpose: as the program works on its own, the calls hold only the important choices where his view of the product may differ, the ones that slip into systems invisibly (how an Event Pass renews, when the get-ready checklist disappears). Never a design, experience or wording call: he walks production and the marketing site and critiques what he sees, and most design passes through the lab anyway. If it stays, it must be used correctly (never the runaway append the old STATUS and ROADMAP had), and "probably just build it into the lab for easier handling". The Orchestrator reshaped the content at `3ec66b8fe`: `docs/calls.md` now holds the open questions (X1, X2, X3, X5, X6, X9 to X17) and 16 built calls by theme, and the runbook's "The calls lab" states the test, the cap of 30 and the same-day exit.

**What to build:**
1. **One home the lab can render:** `docs/calls.json` (beside `docs/reviews/`), the content of `docs/calls.md` at `3ec66b8fe` migrated word for word: each entry an id (kept, never reused), its kind (a question, or a call built and his to change), its theme, its title, its body (a call three lines at most) and its "Change it if", a question's recommended answer and alternatives, and a call's home (the `docs/systems/` doc that holds the fact, so a kept call can leave). A test holds the fields, unique ids and the cap of 30. Never edit `docs/calls.md` (the Orchestrator deletes it at your record).
2. **The Calls place on the desk** (`/design/lab`), beside the boards Will sits: open questions first, then calls by theme, each readable at a glance at 1440 and 375 and answered in a press: a call Keep (the default, sending nothing) or Change with his note; a question its recommended answer, an alternative, or his own note. Quiet, never dev-tool-ish, in the desk's own furniture.
3. **One message a sitting:** the answers ride the desk's existing message (`review-message.ts` composes, `scripts/lab-review.mjs` parses, `lab-review.test.ts` round-trips), one `calls:` line in the grammar's style; `pnpm lab:review` validates it and prints the routing list (each answered question's pick, each change with its note, each kept call that may now leave), writing nothing to `docs/calls.json` itself (the record does, through item 4). The grammar's one statement lives in `docs/reviews/README.md`, which no lane edits: write its new line in your Handoff for the Orchestrator to place.
4. **The record's door:** `usher/kit/calls.py` (add, retire), the only writer the record uses: it refuses an entry missing a field, a call past three lines, a duplicate or reused id, and the 31st entry, so a design call or a runaway append cannot get in.
5. **Retired ids cited in code and docs** (`calls lab's H1` in the create-wizard board's spec, `BE3` in `root-folder.test.ts`, `X7` in `capture-time.ts`, and any other): point each at the system doc line that holds the fact; list any outside your owns as an exception.

**At your record (the Orchestrator's):** `docs/calls.md` deleted; `track-manifests.test.ts`'s never-owned line moved to `docs/calls.json`; the runbook's bullet, the pickup and STATUS pointed at the lab's Calls place; your grammar line into `docs/reviews/README.md`. Say each in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
