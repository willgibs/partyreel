---
track: crumbs-81
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/lib/db/queries/social.ts
  - src/components/shared/legal-consent-line.tsx
  - src/proxy.ts
  - src/proxy.test.ts
  - src/app/manifest.ts
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/event-settings-sheet
  - src/components/guest/guest-account-menu.tsx
  - src/app/api/me/menu/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/env.ts
  - src/app/admin/layout.tsx
---

# lp/crumbs-81

**Goal.** Five small things a person can hit, off the parked boards: a sealed album's Guests room tells of the shots waiting, the admin login's legal links and manifest resolve, a Settings write that throws settles as a refusal, Settings' head is described for a screen reader, and the guest's account menu reaches her profile.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

From ROADMAP "Now" (provenance in git). Each fix pinned by a test that fails on the old code:
1. **A sealed album's Guests room says "Nobody has added photos yet" while sealed shots wait**, since its list counts only unsealed uploads (`guests/guests-room.tsx`, `getEventGuests` in `src/lib/db/queries/social.ts`): say shots are waiting to develop (their count, if the read can carry it cheaply), in the camera's voice.
2. **On the admin host, `/login`'s consent line (`LegalConsentLine`) links `/terms` and `/privacy` relatively, and that surface 404s both, as it does `/manifest.webmanifest`:** link the app's absolute pages (the site URL from `env.ts`) and serve or drop the manifest there (`src/proxy.ts` routes the admin host; `proxy.test.ts` pins it).
3. **A Settings write that throws (a dropped connection) leaves its row busy for good and the unsaved value shown**, since `run` in `event-settings/settings-state.tsx` has no catch: settle a throw as a refusal (the value put back, the row free, a word that it did not save).
4. **Settings' page-level head carries no description** (`event-settings-sheet.tsx` sets `aria-describedby` undefined): the event's name as a screen-reader-only description.
5. **The guest's account menu (`guest-account-menu.tsx`) has no Your profile row**, so an account reaches `/me` only through the app's own menu: add it (`/api/me/menu` can return the handle for `/u/<handle>`).

Wiring rigor: the whole gate, each fix re-walked on your port at 375 and 1440 (the admin login on its host as `proxy.test.ts` names it; a thrown write by a blocked request).

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
