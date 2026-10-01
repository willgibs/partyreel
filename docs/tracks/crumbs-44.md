---
track: crumbs-44
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "59f3110b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/u/[slug]/
  - src/lib/db/queries/social.ts
  - src/components/social/follow-button.tsx
  - src/components/app/event-card.tsx
  - src/app/(app)/account/profile/
  - src/lib/validation/report.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-44

**Goal.** A person's page that paints at once and reads as one: event cards on their preview derivatives, a video-only card's own face, one toggle for follow and block, the menu clear of the name at 375, loading screens for the profile, /account and /welcome, the setup's small follow-ons, and the report's person arm under test.

## The brief

A person's page (`/u/<handle>`, its owner mode, and the setup at `/account/profile`) has seven ROADMAP lines; each is its line there (find it by the words quoted), fixed at its root with a test that fails on today's code, or retired with the evidence that it is already true:

- **Cards that paint at once:** "the event cards presign the cover's original (`queries/social.ts` reads `original_key`: 1920 wide, multi-megabyte, `loading=\"lazy\"`), so a card paints black for seconds where the preview derivative the dashboard's cards read lands at once". Read the preview the way the dashboard's cards do (`readCoverUrls`), the original only where no preview exists.
- **A video-only card's face:** "an attended card whose guest added only video draws `EventCard`'s lock fallback (`href: null`); it deserves its own empty face".
- **One toggle:** "three hand-rolled toggles do one job (`FollowButton`, the profile menu's block, the Connections card's buttons); one control, one contract". One component with its states in the Library, each caller on it.
- **The menu at 375:** "the overflow menu opens over the person's own name at 375".
- **Loading screens:** "`/account`, `/welcome` and `/u/[slug]` carry no `loading.tsx` (the profile awaits an RPC and two presign rounds before it paints)". Each in the app's own loading grammar (the dashboard's `loading.tsx` is the model).
- **The setup's small follow-ons** (from `profile-setup`): "a chosen event that can never appear (its album is not open) says so on its picker tile; the user menu's handle-less \"Your profile\" and event settings' \"Claim your handle to publish the page\" open `/account/profile` directly rather than through Account's door; the invitation's button carries its reason rather than repeating its title".
- **The report's person arm in tests:** "`src/lib/validation/report.test.ts` has no person-arm cases (both subjects, neither, a cross-subject `media_id`)".

One more line is a product question, never a guess: "a confirmed account with no handle has no page, so the owner mode's likes and connections are unreachable for it ... an account that declines one still needs a home for them that needs no handle". Write it under Questions with its options and your recommended answer, and build nothing for it unless the answer is small and reversible (say which).

What a person's page shows of others follows `profiles-social.md`'s consent rules: a door only to a page its owner published, a face only where it already shows, never an address, every picture presigned server-side.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, a public profile signed out at 375 and 1440 (a handle with event cards: the cards' first paint, the overflow menu), and the Library's toggle specimen in every state.

The owner mode and `/account` cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** six boards (`locked-door`, `event-ready`, `privacy-hero`, `disposable-mode`, `demo-framing`, `about-press`); none describes a person's page. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Handed-off lanes merge after you were cut, so leave their files alone: `crumbs-43` changed `components/social/guest-list.tsx`, `components/likes/`, the photo viewer and `lib/history-entry.ts`; `crumbs-42` the dashboard and the hub's rooms; `crumbs-41` the admin portal and billing. Two lanes run beside you:
- `strip-gaps` owns the EXIF strip and the privacy claims' copy;
- `export-ends` owns the album download (`components/app/export/`, `api/export/`, `lib/export/`, the Worker, `/admin/exports`).

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
