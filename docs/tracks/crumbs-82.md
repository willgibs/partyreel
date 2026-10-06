---
track: crumbs-82
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9d64fe3f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - docs/systems/dashboard.md
  - src/app/(app)/account/page.tsx
  - src/components/social/follow-button
  - src/components/app/drive/
  - src/app/admin/layout.tsx
  - src/app/admin/not-found
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - src/app/(dev)/design/sandbox/host-dashboard/spec.ts
---

# lp/crumbs-82

**Goal.** host-dashboard r4's chooser as Will picked it, two small crumbs, and the Drive re-walk's small findings.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3139 is yours; 3000 is Will's desk.

1. **host-dashboard r4's chooser = words** (Will, desk 3; details = built needs nothing): "The stage's own words: the stage's first words say why its event leads (Your newest, Latest photos); pressing them turns the stage into the four rules, its picture showing each" (lands: where the rule's control lives on the stage, how it opens at a desk and a phone, and how the stage moves when it changes). Wire it from the board's drawing (`src/app/(dev)/design/sandbox/host-dashboard/`), production's own pieces, the stage's live read untouched.
2. **`/account` sets no trail** while `/account/profile` does (`SetCrumbs`): a one-step `Partyreel > Account`.
3. **`FollowButton`'s `slug` prop** is taken and unread (`components/social/follow-button.tsx`): drop it and its callers' (`/u/[slug]`, the guest list, the moment card, the claims review); a caller outside your owns is a one-line exception named in your Handoff.

4. **The Drive re-walk's small findings** (ledger `/Users/gibby/local/ai/partyreel-wt/_scratch/drive-rewalk/ledger.txt`): Google shows Drive's permission as an unticked box, so a first Continue comes back as needs-permission (the app recovers in place); the promise screen could say to tick it ("Google asks you to choose an account and to allow this next" says nothing of the box). The Disconnect confirm says "deletes its key to it", the one delete word on a Drive surface: say Partyreel forgets its key. Account's "Sent" and the dashboard tiles' "In your Drive" count sends made through an earlier connection, while Your events' list shows those albums with no state: make them agree (recommended: count only sends of the current connection, the rest as history). The strip moves in coarse steps (one unchanged answer drops it to the 15 s beat; a timed report never showed): keep the 5 s beat while a send is sending or checking.
5. **`/admin/jobs` as a non-admin** answers the 404 page but its tab title reads "Jobs · Partyreel Ops" once loaded: a non-admin's 404 names no admin page.

Not yours: `src/lib/drive/` and `workers/drive/` (capture-time owns them; if a fix needs them, propose it). Each pinned by a test that fails on the old code. Wiring rigor: the whole gate; the dashboard needs port 3000's sign-in: walk what your port reaches and list the rest for the Orchestrator's desk walk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

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
