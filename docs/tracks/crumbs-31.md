---
track: crumbs-31
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a39b0129"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/claim-handle-prompt.tsx
  - src/lib/guest/album-return.ts
  - src/lib/guest/session-tokens.ts
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/guest/door/switch-email.ts
  - src/components/app/host-media-grid.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-31

**Goal.** Build 33's red-team finds and one deferred bug: the follow moment after a keep through Google, the review peek holding Shift+Tab, a malformed id drawing each surface's not-found, the door's switch signing out this device only, a Like on liked items saying so, and the host's own Add at her gated door going through.

## The brief

Build 33's red-team finds (`../partyreel-wt/_scratch/redteam-33/ledger.txt`; grep it for the steps) and one of `crumbs-29`'s deferred bugs. Fix each at its root, with a test that fails on today's code:

- **No follow moment after the keep through Google** (MEDIUM; already on partyreel.com since `crumbs-27`).
  - Steps: signed out, type "Partyreel Fan" (a name matching the account's first word), add a photo, then Keep this event → Confirm your email → Continue with Google → partyr33l.
  - What happens: the photo is claimed, but no moment plays and no toast shows.
  - The likely cause: the album page's server render claims the ticket first (`sortTickets` → `claim_anonymous_uploads`, through the door's and the gallery's readers). The client's mount claim then moves nothing, and it spends the `pr_pending_offer` marker without playing the moment (`claim-handle-prompt.tsx`, `lib/guest/album-return.ts`, `lib/guest/session-tokens.ts`). A magic-link return should meet the same.
  - The moment should play once for a keep the server's read already claimed. Build 30's ask path, which played, must still play.
- **Shift+Tab escapes the review peek** (LOW, from `crumbs-28`'s focus trap): open the Review peek (focus lands on the dialog itself) and press Shift+Tab as the first key. Focus moves to the tile behind while the peek stays up. The likely cause: the grid's own effect focuses the dialog before the trap has a focused element to return to (`event-feed/selectable-media-grid.tsx`).
- **An id that isn't a uuid** (LOW; already on partyreel.com): `/dashboard/<x>` and its rooms answer 200 with "Something went wrong" and no title. The portal's `/admin/albums/<x>` and `/admin/accounts/<x>` answer 500. Each hit files 22P02 errors to Sentry. Check the id's shape before any read, and draw each surface's not-found, as a missing uuid already does since `crumbs-28`.
- **"Use a different email" ends every session** (LOW; read in the code; already on partyreel.com): `src/components/guest/door/switch-email.ts:16` calls `signOut()` with no scope, which is global, so an operator using it at a door loses her portal session. `(auth)/actions.ts` holds the rule that every sign-out names its scope. Name it `local`, and make a test refuse an unscoped `signOut(`, if the lint or a policy test doesn't already.
- **Like on an already-liked selection says nothing** (NIT): the selection closes with no toast (`host-media-grid.tsx`). Say what happened, in the words its other toasts use.
- **The host's own Add on her gated album's guest page never goes** (a bug, from `crumbs-29`'s Deferred). The host's upload there goes through the guest queue, and `create_guest` never counts the host as in. So at a gated door her upload never goes, proved rolled back on `55bcdbe0`:
  - approve mints her a waiting ticket her picks wait on for good;
  - invite refuses "Ask the host to let you in.";
  - closed says "This event is private.".
  - Count the host in (`create_guest`'s `v_in`, on the live body `498aba39…` from `20260930140000`), or send the owner's Add through the host routes its own note promises; your call, under Questions.

**SQL.** If you change `create_guest`, write the migration with its rolled-back proof at the file's foot, in the shape of `20260930140000_one_account_one_ticket.sql`.
- Run the proof yourself with the Supabase MCP's `execute_sql`, inside `begin; … rollback;`. Otherwise your SQL is read-only, and you never call `apply_migration`: the Orchestrator applies by protocol.
- Keep the signature and grants: partyreel.com (milestone 31) calls it.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The Google return, the hub and the portal cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk may be up:** change no word or behaviour the desk's boards describe, beyond these fixes. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. `crumbs-30` is running and owns `src/lib/auth/admin-context.ts`, the five route `error.tsx` files, the print page, `lib/guest/reconcile-album-items.ts` and `lib/events/event-blocks.ts`: don't touch them.

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
