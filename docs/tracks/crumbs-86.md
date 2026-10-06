---
track: crumbs-86
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "567e8710"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/mutations/event-passes.ts
  - src/lib/db/mutations/event-passes.test.ts
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(guest)/u/[slug]/not-found.tsx
  - src/app/(app)/not-found.tsx
  - src/app/admin/not-found.tsx
  - src/app/group-not-found.lazy.test.tsx
  - src/components/app/create-event-wizard/add-step.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/components/app/event-settings/delete-event-row.tsx
  - src/app/api/host/r2/complete-upload/
  - src/app/(as-guest)/dashboard/[eventId]/as-guest/page.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/components/app/share/as-guest-view.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/components/app/event-blocks/blocked-section.tsx
  - src/lib/constants/tiers.ts
  - src/lib/constants/events.test.ts
  - src/lib/content/blog-keep-lines.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-86

**Goal.** Ten small things a person or a maintainer can meet, from the ROADMAP's "Now": the 404s' one noindex, the host's own capture clock, See it as a guest's zone and first words, Create's and the camera's leftover seeding, billing's typed seam, two Library specimens, the lifecycle comments and Blocked's truncated address. Production code, the whole gate; no migration.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**The work (each line retired from the ROADMAP in your Handoff, quoted there by its first words):**
1. Code hygiene: drop billing-orphans' `orphansDb` seam (`src/lib/db/mutations/event-passes.ts`) now that `src/lib/db/types.ts` carries `adopt_pass_credit_orphans`.
2. Guests: the guest link's own 404 (`(guest)/e/[token]/not-found.tsx`) and the other groups' 404s still set their own robots metadata; the root's and the cinema's dropped theirs for Next's one noindex (the cinema's is marketing-crumbs' lane, running beside you: never touch `src/app/(marketing)/`).
3. Host: Create's add step (`create-event-wizard/add-step.tsx`) and Settings' camera (`event-settings/camera-settings.tsx`) still seed `patchForStyle` with `developToKeep`; `patchForStyle` now takes `{ zone: hostPartyZone(...) }` itself, so each drops the seeding.
4. Uploads: the host's complete route (`api/host/r2/complete-upload`) does not read `captured_wall`, so a host's own zoneless Exif clock stays read in her browser's zone; extend its schema as the guest's (`api/r2/complete-upload`). ★ No migration in this lane: if it needs SQL, stop that line and say so in your Handoff (upload-sums holds `create_media_as_host` this round).
5. Guests: See it as a guest says develop times in the host's own clock: its page (`(as-guest)/dashboard/[eventId]/as-guest/page.tsx`) could hand `AsGuestView` the party's zone for words, as the guest page does.
6. Host: See it as a guest says "the first photo" until its live source reports what waits; `readAsGuest` (`as-guest.server.ts`) can ask `albumWaits` as the guest page does and hand `waitingOnArrival` to `AsGuestView`, so its first byte says the Add's words.
7. Library: the Button page shows no working specimen (`library/components/gallery-demos.tsx`): add one beside Disabled (`working` with `workingLabel="Saving"`).
8. UI: the same file's tooltip specimen comment says the root provider's delay is 200 ms; it is 0.
9. Code hygiene: comments in `constants/tiers.ts` (the anti-abuse why), `event-settings/delete-event-row.tsx`, `constants/events.test.ts`, `content/blog-keep-lines.test.ts` and `app/group-not-found.lazy.test.tsx` still say events have "no end date" in the lifecycle sense; say "never expires", since Settings' end date only says when. (In `tiers.ts`, comments only: it is the pricing single source under a parity test.)
10. Host: Blocked's address column truncates a short address to "r." at 1440 in the Guests room's panel (`event-blocks/blocked-section.tsx`'s `truncate` beside the since-line).

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; each surface you change at 375 and 1440 in your own headless Chrome on a local production build at 3000, signed in as a test host through `usher/kit/redteam/signin.mjs` where it needs a host (a host upload with a zoneless Exif photograph from `node usher/kit/media-gen.mjs` for line 4).

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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
