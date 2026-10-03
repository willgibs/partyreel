---
track: cost-model
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/r2/
  - src/lib/upload/
  - src/app/api/
  - src/lib/album/
  - src/components/guest/gallery-live.tsx
  - workers/
  - vercel.json
  - next.config.ts
  - docs/systems/uploads-and-r2.md
  - docs/systems/durability-backups.md
  - docs/systems/billing-caps.md
  - src/lib/constants/tiers.ts
---

# lp/cost-model

**Goal.** A cost model of Partyreel per event and per month, from the code's real request patterns and every vendor's current prices, with the top levers ranked and their fixes, for Will to decide on.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Why.** Will, 2026-10-03: "cost optimization is always just as important as our architecture or system design itself. One wrong move sinks us or costs thousands or more at scale. One right move can literally be worth millions over the course of years with real growth... Our entire platform is literally built on top of upload/serving/displaying/downloading/etc images and videos, so this is a major call across the board. every single image action matters when we're using this many." Verified already: guest media never touches Vercel. Uploads are presigned PUTs to R2, views are presigned GETs in plain `<img>` and `<video>`, zips come from the export Worker, `next.config.ts` allows no remote image host, and `GetObjectCommand` lives only in `src/lib/r2/presign.ts`.

**Build** (research and one doc section, no code):
1. Read every vendor's current prices from its own pages, never from memory, and cite each URL and date:
   - Vercel: Hobby now, Pro at launch; function invocations, active CPU, data transfer, image optimization, OG image generation;
   - Cloudflare R2: storage, Class A and B operations, Infrequent Access for the backup bucket;
   - Cloudflare Workers and Queues;
   - Supabase Pro: compute, egress, storage;
   - Resend; Sentry.
2. Read the code for the real request patterns:
   - an upload's PUTs and RPCs per file, including multipart parts, the preview and the coming phone copy;
   - the album's polling cadence while a page is open, its 304s and its full syncs, and what each costs on Vercel and Supabase;
   - presigns per window;
   - a tile's and the viewer's GETs;
   - the export's reads;
   - the backup Worker's copies and the weekly prune;
   - the daily cron's work;
   - email sends.
3. Model three scales: one 200-guest party (five hours, 2,000 photos, 100 clips), 1,000 active hosts a month, and 100,000.
4. Rank the top levers, each with its saving, effort and risk:
   - the polling cadence or a push channel;
   - R2 Class B reads, uncacheable behind presigned links;
   - a media domain on Cloudflare with a Worker checking signatures and serving from the edge cache over HTTP/2 and 3 (needs DNS on Cloudflare, already a launch task);
   - the backup bucket's growth;
   - build-time pre-optimization of the site's own images to zero Vercel image cost;
   - anything else you find.
5. Write the model into PRICING.md as a section of its own ("What it costs us"): the one home for it, short, numbers with their sources. Put a one-page plain summary for Will in your Handoff: the five numbers that matter and the three moves you'd make, each his to decide.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `pnpm test` for the doc policies (PRICING.md's lines: no em dash, links); every price cited with its URL and the date read; every request pattern cited by file and line; your Handoff's summary under 300 words.

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
