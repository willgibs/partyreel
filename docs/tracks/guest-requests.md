---
track: guest-requests
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e7ac98fe"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/components/guest/door/welcome
  - src/components/guest/guest-upload
  - src/components/guest/gallery-live
  - src/components/app/event-feed/host-album
  - src/lib/events/album-sync
  - src/components/guest/camera/
  - supabase/migrations/20261006030000_sync_accepting.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/chrome/chrome-link.tsx
  - docs/systems/database-security.md
  - supabase/migrations/20261005200000_capture_time.sql
---

# lp/guest-requests

**Goal.** Requests a guest's page never needed: the demo's links prefetch the marketing home only on intent, the first poll stops re-asking every link the seed answered, and the camera learns a closed album from the sync instead of asking.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk.

**Cost is designed like the architecture (Will):** we scale by events, not users, so a request saved on every guest's page compounds. Three ROADMAP lines, each quoted whole (read the code each names first):
- Guests: the demo fetches the marketing home on sight (six requests a load) from its three "Start your own" links (`event-experience.tsx` twice, `door/welcome.tsx`, `guest-upload.tsx`'s turn card); draw them through `ChromeLink` with `prefetchOnIntent`.
- Guests and host: on an event whose `attr_version` is above 0, the first poll after a page opens re-asks every link the seed answered (a `/api/album/guest/media` call of up to a window's ids), since those asks go out at the link store's attribution 0; set `store.links.setAttr(seed.sync.attr)` where the store is built (`gallery-live.tsx`'s initializer, likely `host-album.tsx`'s `createHubAlbum`); the compute model's test event has `attr_version` 0, so seed one whose attribution moved.
- Guests: the album's sync carries no `accepting_uploads`, so the camera asks a closed album again by itself (10 s, 20, 40, then each minute); carry it in the sync (a migration and the sync's reader) and the asking goes.

Each change pinned by a test that fails on the old code, and each measured: the requests a guest's page makes before and after, read in a headless Chrome of your own (CDP Network) on your port, and `pnpm compute:model` before and after (seed a test event whose attribution moved, as the second line says; a disposable test event of your own on willg97, deleted through its Settings at the end). The third needs a migration: `album_changes_since` was last defined by `supabase/migrations/20261005200000_capture_time.sql` (start from that body verbatim), the expand milestone 38's build and milestone 37's live build both survive (a deployed build's call still resolves: database-security.md's proof with no fixtures), named in its header with a rolled-back proof at its foot; the Orchestrator has the Advisor read it before the apply, and a typed seam stands until the types regenerate. The camera stops asking a closed album by itself, and still learns when the host reopens it.

`src/components/guest/live-gallery.tsx`, `gallery-order.ts`, `gallery-access.server.ts` and the guest page are event-zone's this round: if the seed's attribution must be read there, write it under Questions with the fewest lines and the Orchestrator sequences it. Docs: `docs/systems/guest-flow.md` is event-zone's and `uploads-and-r2.md` crumbs-83's: write the lines they need under your Handoff's proposed doc lines.

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
