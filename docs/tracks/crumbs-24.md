---
track: crumbs-24
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "54664129"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/claim-uploads.ts
  - src/lib/guest/claim-uploads.test.tsx
  - src/lib/guest/claim-ask.ts
  - src/lib/guest/claim-ask.test.tsx
  - src/components/shared/claim-ask.tsx
  - src/components/shared/claim-ask.test.tsx
  - src/lib/guest/confirm-beat.ts
  - src/lib/guest/confirm-beat.test.tsx
  - src/lib/guest/use-confirm-return.ts
  - src/lib/guest/use-confirm-return.test.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/events/event-blocks.ts
  - src/lib/events/event-blocks.test.ts
  - src/lib/db/queries/event-blocks.ts
  - src/lib/db/queries/event-blocks.test.ts
  - src/components/app/event-blocks/block-confirm.tsx
  - src/components/app/event-blocks/blocked-section.tsx
  - src/components/app/event-blocks/blocked-section.test.tsx
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/reel-page.test.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/lib/reel/defaults-action.ts
  - src/lib/reel/defaults-action.test.ts
  - src/lib/history-entry.ts
  - src/lib/refresh-then-write-policy.test.ts
  - src/lib/db/migration-guards.test.ts
  - supabase/migrations/20260930100000_the_join_waits_for_the_door.sql
  - supabase/migrations/20260930110000_claims_say_another_address.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
---

# lp/crumbs-24

**Goal.** Six follow-ups the last three lanes deferred: the claim's new calls on the typed client, a keep confirmed with another address saying where its photos wait, a yes to the shared-phone ask playing the follow moment, Let back in's promise true at a password, the ask minted in a password's instant, and the hub's reel switch never reloading the page.

## The brief

Six follow-ups the last three lanes filed, each fixed at its root with a test that fails on today's code where a test can hold it:

- **The claim's two new calls on the typed client.** `claim_ticket_asks` and `claim_asked_uploads` are in `types.ts` now (`shared-claims`, applied at 20260930010219), so `byName` in `src/lib/guest/claim-uploads.ts` goes.
- **A keep confirmed with another address.** A guest who typed dana@work at the door and confirms the keep with Google as dana@gmail leaves her photos waiting under dana@work, unasked, while the told name ("You're on as ...") plays over photos that stay Unverified. `shared-claims` recommended keeping its rule (an address waits for its owner) and giving the keep a line saying where the photos wait. Build that, in the product's voice.
- **A yes to the shared-phone ask** that moves this album's own uploads plays the follow moment (it toasts today).
- **Let back in's promise at a password.** Let back in, on a newcomer declined at a door that has since become a password, promises "They'll be able to open <event> and add photos again", where she meets the password like anyone new: `BlockedPerson.atDoor` reads waiting rows, which the password ended (`crumbs-21`). Make the promise what will happen.
- **An ask minted in a password's instant.** `create_guest` reads the door with no lock the host's move waits on, so an ask minted in the instant a door becomes a password stays waiting at the password until the door moves again (`crumbs-21`'s trigger ends only the asks that stood when it fired). Close it at its root: a lock that orders the two, or a re-read.
- **The hub's reel switch reloads the page.** `settings-state.tsx` refreshes the router after the reel switch, and a tap on the page's back arrow or on a row inside the refresh's round trip (about 190 ms) reloads the page: a native `replace` on an entry the hub pushed discards the pending refresh (the matrix is in `lib/history-entry.ts`'s header, `crumbs-22`). Write first and refresh after, or hold the address write until the refresh's transition settles.

A SQL change is a migration:
- write it and prove it rolled back on the live schema through the Supabase MCP (read-only otherwise);
- hold its shape in `migration-guards.test.ts`;
- never apply it: the Orchestrator applies by protocol;
- new objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md).

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- the reel switch's race driven in a real Next runtime (the matrix's method).

The signed-in host, the keep and the shared-phone ask cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start. A path you need beyond them (the keep's component, your migration's file): add it to `owns` in your manifest before editing, or name a one-line exception. Never a path another live manifest owns.

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
