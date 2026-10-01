---
track: crumbs-38
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3925f9f0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/my-uploads.ts
  - src/lib/db/queries/my-likes.ts
  - src/lib/db/mutations/my-uploads.ts
  - src/app/(guest)/u/[slug]/owner-sections.tsx
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/lib/media/uploader-identity.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
---

# lp/crumbs-38

**Goal.** Four ROADMAP lines on a person's own record: the upload approval toast's server half, the host's "added your uploads" toast across a reload, My uploads and My likes past 200 with a cursor, and the viewer's credit taking a face and a door from a resolved uploader identity.

## The brief

Four lines the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The approval toast's server half** (guest): "so an upload approved after the visit that made it is told on the next visit (the queue lives in memory)".
- **"The host added your uploads" across a reload** (guests): the toast "ends with the visit (the upload queue lives in memory); the tracker's own-rows read (`/api/guests/mine` `{statuses: true}`) could carry it across a reload or a return". This and the line above are one question, what she is told on her return, so answer them as one: what she is told, once, and how it is marked told.
- **My uploads and My likes past 200** (profile): they "stop at 200 with an honest note (`get_my_uploads`, `get_my_likes`); a cursor and a load-more". Keyset, never offset; PostgREST's 1,000-row cut is a trap (CLAUDE.md).
- **The viewer's credit** (identity): it "takes a face and a door from an `uploaderFace` (`avatarUrl`, `seed` from `seedFor`, `href` `/u/<slug>`) that `getUploaderIdentities` and the item mappers do not resolve yet; `src/components/shared/media-lightbox-parts/credit.tsx` is the seam (today every credit draws the plain disc and none is a door)". ★ What a guest may learn of another guest is `profiles-social.md`'s consent line: a door only to a page its owner published, a face only where the album already shows one, never an address, and presigned server-side like every other picture.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition; a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: another lane writes migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- on localhost, drive what runs there.

The signed-in surfaces cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `disposable-mode` describes the guest page (the camera, the wall, the peek, the viewer's Save and Share) and `locked-door` the door. Change no word or behaviour their asks describe, and leave `entry-modal.tsx` and the door untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Three lanes run beside you, so don't touch their files:
- `crumbs-36` owns `lib/lifecycle/inactivity.ts`, the pricing sections, the marketing copy files, `host-add-provider.tsx`, `host-upload.tsx`, `report-queue.tsx` and `lib/admin/reports.ts`;
- `crumbs-37` owns the album's sync (`lib/events/album-sync.ts`, `album-state.ts`), the purge cron and the admin album drill-in;
- `crumbs-39` owns a hygiene sweep (dead components, comments, `ui/dialog.tsx`, the portal's content links).

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
