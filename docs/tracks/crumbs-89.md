---
track: crumbs-89
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "cb44675e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/door-page
  - src/components/ui/dormant
  - src/app/(app)/dashboard/[eventId]/guests/invited-section
  - src/app/(app)/dashboard/[eventId]/actions
  - src/lib/db/mutations/event-doors
  - src/lib/event/door/
  - supabase/migrations/20261007140000_email_first_memory.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-89

**Goal.** Milestone 39's last MEDIUM closed at its source: a host's names-only door comes back on every path when a gate that forced "An email first" is left, and Settings' rows stay true after a load.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**Why this lane, now:** red-team 57b walked milestone 39's build (`cd38cf21a`) and found one MEDIUM, in crumbs-87's item 1 (its ledger: `../partyreel-wt/_scratch/redteam-57b/ledger.txt`, the W1 lines; crumbs-87's Handoff and Q1: `git show a7991bc30^2:docs/tracks/crumbs-87.md`). Milestone 39 waits on it, so the MEDIUM comes first and the rest only where it shares a cause; a re-walk of exactly your items follows your merge.

**The items, in order:**
1. **The MEDIUM (red-team 57b):** a names-only album with a guest in by name; Private > You let each person in ("An email first" forced on); back to Public. Within one page visit the switch comes back off with its toast; across a load it does not (7 of 12 trials): a hard load with the sheet open (`?room=settings&setting=door`: a reload, a restored tab, a pasted link), the first save after the load, Close without leaving, and the phone's full-screen door page (where only Back caught up). The album then stays Public with `require_verified_email` true and the name-only guest meets "Confirm your email to see everything". The restore (`settings-state.tsx`'s effect over `settings-state-email.ts`'s device note) waits for the hub's row to show the door change, and after a load the row never sees the saves. Fix it at the source so it holds on every one of those paths and on another device: crumbs-87's Q1 named the complete answer, the database remembering her choice (the first Immediate line under The host app: a column the gate's hold sets when `set_event_door` turns the step on from off, given back by one `before update of gate` trigger, `email_restored` in `set_event_door`'s answer for the toast), then the device note goes. If the database route proves wrong, say why under Questions and take the next most robust (the save's own answer, never the hub's row).
2. **The door page says it before the move** (the second Immediate line under The host app): a move onto "You let each person in" or the invite list turns An email first on for everyone, and the line before the move says nothing of it; say what it does to people already in, as the password's two groups do (`door-page.tsx`'s `consequenceOf`).
3. **Settings' rows after a load (red-team 57b, LOW, the MEDIUM's own cause):** after a hard load with the sheet open, the rows never see the saves (the Guests room's invite list sticks on "Saving… 0 on the list" while the database holds the address, until the room is reopened). Find why the hub's row stops taking the saves after a load and fix it there, so every setting reads true after its save on any path.
4. **A dead tap band (red-team 57b, LOW, crumbs-87's item 8):** an awake setting's hidden summary line in `ui/dormant.tsx` still catches taps in a 12 px band, so tapping the "A photo first" label (and "Max size") does nothing at 1440 and 375; the halo's room must not cost the label its tap.

**The migration, `supabase/migrations/20261007140000_email_first_memory.sql`:** start from `set_event_door`'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**Walk your own items antagonistically,** each on every path 57b names (a hard load with the sheet open, a reload mid-hold, Close without leaving, 375's full-screen page and Back, another browser as the second device), reading `events.require_verified_email` by read-only SQL after each, and a name-only guest's own view after each; then the password's first set while held. Test data disposable and named "crumbs-89 (disposable)".

**Nearby lanes (never edit their paths):** crumbs-88 (handed off, merging after milestone 39: `event-page.tsx`, the hub's badge and cover link, Create, the dashboard's stage, the reel; and six system docs, `host-app.md` among them, so a stale line in a doc you do not own goes in your Handoff for the Orchestrator); the boards after-party r1 and no-signal r1 (their sandbox folders).

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
- Calls his to overrule, one line each
- Look at first: ...
