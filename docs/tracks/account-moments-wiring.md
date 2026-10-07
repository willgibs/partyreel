---
track: account-moments-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/social/relation-toggle
  - src/components/social/profile-actions-menu
  - src/components/social/guest-peek
  - src/app/(guest)/u/[slug]/
  - src/app/(app)/me/
  - src/app/(app)/account/page
  - src/components/app/dashboard/page-invite-card
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/account-moments.json
  - src/app/(dev)/design/sandbox/account-moments/spec.ts
  - docs/systems/profiles-social.md
---

# lp/account-moments-wiring

**Goal.** Her own account as Will picked at account-moments r1: a block said quietly where Follow stood, a Connections row that stays turned back with names opening the person's card, and her page before it is public wearing its own head, marked private.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3135 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/account-moments.json` round 1):** block = line, tidy = stays, me-page = private, invite = today; follow is unclear to him and goes to account-moments r2 with the invitation's redesign after you (so leave Follow's landing and the invitation card's look as they are). The board (`src/app/(dev)/design/sandbox/account-moments/`) draws each pick on production's own controls: that drawing is your spec, and the consent model is never drawn away (a page is public only by her choice; `docs/systems/profiles-social.md`).

- **block = line:** on a blocked person's page, where Follow stood, a quiet well says it to her alone: she blocked them, they are not told, Unblock beside it, on every visit (`RelationToggle`, the profile menu).
- **tidy = stays:** in Account's Connections (`account/page.tsx`'s `PersonRow`), a row whose relation she flips off stays, turned back (Follow on an unfollowed row, Block on an unblocked one): one more press undoes it, with no timer, and it leaves the list when she comes back. Will's note: "How do we handle the rare case of unblocking somebody but then wanting to follow them? Can guest names be clicked here to open the mini card on screen for additional actions beyond the row action flip? That'd be my first guess as a user. Don't want to overcrowd the row actions." The card exists: `GuestPeek` (`components/social/guest-peek.tsx`, a popover at a desk and a sheet in a hand, with Follow and Open full profile); a name in Connections opens it, carrying a profile where today it carries a guest row, so Follow after an Unblock is one press there and the row keeps its one action. One component per purpose: extend `GuestPeek` by props, never a second card.
- **me-page = private:** `/me` before she has a public page wears the public page's own head (her photo and name), marked that only she can see this page, then her things (uploads, likes, follows); going public later changes who sees it, not what it is. The invitation stays today's card in its place (invite = today; r2 redraws it).
- **The Immediate line it closes:** the public page's meta row orphans its `·` at 375 on a long handle (`u/[slug]/page.tsx`): the separator travels with what follows it.

**Nearby lanes this wave (never edit their paths):** the Guests room (host-moments-wiring) renders `guest-list.tsx`, which wraps `GuestPeek`: keep its current callers' props working and say what changed.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** willg97 and hi@willgibs signed in on your port: a block from a profile page and its well on a revisit, Unblock there and from Connections, a flip and its undo in Connections, a name opening the card and Follow from it, `/me` before and after a page is claimed, both widths, a screen reader's names.

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
