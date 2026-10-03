---
track: take-home-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery
  - src/components/guest/guest-action-dock
  - src/components/app/export/
  - src/lib/export/
  - src/lib/media/share-save
  - src/lib/media/preview-size
  - src/components/shared/media-lightbox-parts/actions
  - src/lib/upload/
  - src/lib/r2/
  - src/lib/guest/use-upload-queue
  - src/app/api/r2/
  - src/app/api/export/
  - src/app/api/guests/mine/
  - src/app/api/album/
  - src/app/api/events/
  - src/lib/lifecycle/
  - workers/export/
  - supabase/migrations/20261003110000_
  - src/lib/media-cost-policy
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/take-home/
  - docs/reviews/take-home.json
  - docs/systems/database-security.md
  - docs/systems/durability-backups.md
  - next.config.ts
---

# lp/take-home-wiring

**Goal.** Wire take-home's picks: Select, then Save for a guest (no one-tap Download all), Save into Photos at phone size with each choice's size shown, the host's two downloads (Originals, Phone size), and the phone-size copy (2048 px) every new photo gets, known by every purge and listing.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (take-home r1, his desk on build 45, 2026-10-03), in full:**
- guest=select.
- save=light: "However, let's subtly preview the file size beside images versus files options so they can clearly see that saving to files seems to be a more \"high quality\" download if needed, such as deciding the optimized photos into images may not fully cut it. otherwise it's easy to assume it's the same quality and only a path selection, with no way to get higher quality."
- host=two.
- And the same night: the phone-size copy never counts against a host's storage. His cost rule is "every single image action matters": guest media must never be billed by Vercel.

**Build:**
1. **Select, then Save** (`select`) replaces the guest's Download all: a bar (Cancel, count, Yours, All), tile checks, the shutter turned to Save.
2. **Save** (`light`) puts her picks into Photos at phone size through the share sheet. The originals stay a zip in Files, and each choice shows its size ("24 photos · 15 MB" beside "Originals · 72 MB"), so Files reads as the full-quality path.
3. **The host's Download** (`two`) opens a panel: Originals to keep, Phone size to post tonight. Each is pictured by the album, with its size.
4. **The phone-size copy:**
   - a 2048 px JPEG of every new photo, made in the browser at upload as the preview is (`src/lib/upload/preview.ts`): a third key variant `phone` in `src/lib/r2/keys.ts`, minted at presign and pinned at complete;
   - capped at 4 MB and at half its original's bytes, checked at complete;
   - never counted against storage, like the preview;
   - best-effort: a photo without one falls back to its original everywhere.
   - Videos stay as taken. No backfill: every photo today is test data.
5. **One migration** in `supabase/migrations/20261003110000_*.sql`, which you write and never apply:
   - `media.phone_key` and `media.phone_bytes`;
   - `create_media`'s DROP and CREATE (every overload) with two defaulted arguments, so old callers still work, and its grants restated exactly.
   - The Orchestrator's Advisor reads it before it is applied.
6. **The export Worker** (`workers/export/`) accepts the `phone` key: `isValidExportKey` pins original and preview today. The Orchestrator deploys it.
7. ★ **Every reader of the stored copies learns the third key.** About 31 files list `original_key` and `preview_key`: purge, reclaim, expired events, account deletion, the bin, `guests/mine`, the links routes, `grid-items.ts`. Find every one. Then add a guard test that refuses any purge or listing reading `preview_key` without `phone_key`, so nothing is ever orphaned in R2.
8. **The media-cost guard** (`src/lib/media-cost-policy.test.ts`) refuses three things:
   - `images.remotePatterns` or `domains` in `next.config`;
   - any `next/image` fed a presigned or user URL;
   - any route that streams R2 bytes through a function (`GetObjectCommand` stays in `src/lib/r2/presign.ts`).

**Constraints:**
- Uploads stay a presigned PUT straight to R2, and downloads presigned GETs. Nothing passes through Vercel.
- `use-upload-queue.ts` keeps its API (twelve files import it).
- Red first.
- `wait-wiring` owns `event-experience.tsx`, `guest-upload.tsx` and `event-gallery.tsx`. Any line you need there is an accepted exception: one line, listed in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board take-home` at 1440 and 375; Vitest red first for the phone variant at presign and complete (its two caps), the guard over every reader of the stored copies, the cost guard, Select and Save's sizes, the host panel; a rolled-back MCP check of the migration; measured on your dev server in a headless Chrome of your own (uploads stood in at the network, as `disposable-camera` did): a 12 MP photo's phone copy's bytes and time to make at 375 with 4x CPU, and the share call stubbed (24 phone-size JPEGs handed over, the sizes shown); captures in your Handoff.

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

## Where I am

- Done, pushed: the phone-size copy end to end (browser generation, presign/complete caps, migration
  `20261003110000_phone_copy.sql` proved rolled back red 8/8 green 9/9), every purge reading `phone_key`, the
  stored-copies and media-cost guards, the export's two sizes and `save` step (guest and host), the Worker's
  `phone` key, the Save engine (`take-home-save.ts`), guest Select then Save (`live-gallery*`, the dock), the host's
  two-set panel (`take-home-panel.tsx`). Commits 794b1cb6 (server) and 00c12452 (client); full `pnpm test` green
  on 794b1cb6 (9,687), typecheck and lint green on 00c12452.
- Measured on :3133 in a headless Chrome of the lane's own (scratch `/Users/gibby/local/ai/partyreel-wt/_scratch/
  take-home-wiring/`): a 12 MP photo's phone copy 601,592 B of 3,671,488 B, 282 to 299 ms at 375 with 4x CPU
  (`measure-phone.json`); her Save of 24 picks with the sheet stubbed: 24 phone-size JPEGs (14,438,208 B) handed
  over inside the tap, and on a slow network the Ready tap (`measure-save*.json`, `save-*.png`).
- Remains: the real uploader's phone copy through the guest Add with the network stood in (`measure-upload.mjs`,
  the picked file not yet reaching the presign), the host panel captured at 1440 and 375, `uploads-and-r2.md` edited
  in place, the full gate (build, lab:smoke, lab:demo --board take-home at 1440 and 375), then the Handoff.
- Running: the dev server on :3133 (`pnpm dev -p 3133` in the worktree; kill by port before a build).
