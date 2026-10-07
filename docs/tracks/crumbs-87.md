---
track: crumbs-87
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3dde5801"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/event-settings-sheet
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/card/
  - src/components/app/dashboard/
  - src/components/app/event-card
  - src/components/app/event-feed/review-section
  - src/components/app/event-feed/hub-develop
  - src/app/(app)/dashboard/[eventId]/guests/invited-section
  - src/lib/db/queries/social
  - src/components/social/guest-list
  - src/components/social/guest-peek
  - src/app/(app)/account/page-connections
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
---

# lp/crumbs-87

**Goal.** Small things a person can hit, from the gap audit and the last merges, fixed at their source.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, in order (each an Immediate line in `docs/ROADMAP.md`; the Orchestrator retires each at your record):**
1. **The door's email gate (MEDIUM, the gap audit):** with "An email first" off, Private > You let each person in, then Public, leaves `require_verified_email` on (`settings-state.tsx`'s `saveDoor` keeps it and nothing restores her choice), so a name-only guest already in meets "Confirm your email to see everything". Restore her own choice when the door leaves the state that forced it, and say it as the row does.
2. **The shared link's words:** `/e/[token]` always unfurls as "Add photos to <name>" and "Add yours." even with uploads closed; say what the album is in its state (adding open, or the album to look through), and let the card (`card/route.tsx`) follow.
3. **The dashboard's tally** at 1440 says "Nothing needs you" under a stage whose live event reads 105 to review: the week's count includes the stage's own event.
4. **The waiting amber, retired:** the dashboard's marks (`marks.tsx`, `events-row-list.tsx`, `event-card.tsx`) and Review's own count (`review-section.tsx`) wear `--needs-you` (globals.css, tally) as the hub's badges do; one token, never a second red.
5. **A Disposable's hub outside the party's zone** says the develop in the party's zone above the held card's time in the reader's clock, unlabelled (`hub-develop.tsx`): one clock, or both named.
6. **The Guests room on a Public album** shows the INVITED list and its paste box, which let nobody in and send nothing there (`invited-section.tsx`): show it only where the invite list is the door, or say what it does.
7. **Follow where a block stands:** Connections' look offers Follow after an Unblock where they blocked her back, and the album's guest list offers Follow on a chip of someone she blocked or who blocked her (`followUser` is block-silent, so the chip then lies); read the block either way (`social.ts`'s `isBlockedEitherWay`) where a Follow is offered, `GuestList` taking `blockedIds` beside `followingIds`.
8. **Settings' sheet clips the focus halo** (its overflow-hidden box) on the door switches, the Max size select, the Cinematic card and "3 seconds", at 375 and 1440 (red-team 56b, LOW).

**Nearby lanes running (never edit their paths):** album-moments-wiring (the guest album, arrivals, the upload stack, the reel's curtain, `event-experience*`), storage-sums-signal (the purge sweep, /admin/jobs, `src/lib/db/queries/storage-sums*`). If an item needs a line in their files, list it as an exception in your Handoff.

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
