---
track: cost-model
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c925e48f"            # the launch-prep SHA the branch was cut from
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

- **How live is live?** Others' photos reach an open album within ~2.4 s today, and every upload makes every open
  album sync, a hidden tab with a live socket too. Recommended: within ~15 s, and a ping never syncs a hidden tab:
  about half the live album's calls, while her own uploads stay instant. Not built here (a research lane):
  `docs/PRICING.md` lever 1a.
- **Back up only originals?** Recommended yes: previews and phone copies are remade or fall back to the original; a
  sixth of the backup's bytes and two thirds of its writes go. Lever 2a.
- **The top plan.** Full, 2 TB costs us $51 to $66 a month against $39 ($32.50 yearly) once its backup and phone
  copies count; 500 GB ($12.50 to $16 against $19) and the 75 GB pass ($23 to $29 a year against $24) run thin.
  Recommended: a 1 TB top plan at $39 before launch (2 TB later is a gift, since a marketed number only moves up), or
  2 TB at $59 or more; 500 GB and the pass stay. One-way once launched, so his.
- **Supabase's spend cap.** On by default, it stops an item past its quota for the rest of the cycle: at ~1,000 hosts
  the 5M Realtime messages run out mid-month, and past 100,000 MAU new sign-ins stop. Recommended: off before launch
  traffic, with a budget alert.
- **The proxy on API routes.** Every API call runs the proxy first (`src/proxy.ts:133`, its `getUser()` at
  `src/lib/supabase/middleware.ts:48`): two invocations a call. Recommended: narrow the matcher off the routes that
  re-verify for themselves (album, r2, guests); auth-adjacent, so the Advisor reads it. Lever 1b.
- **Vercel's CDN billing at the Pro cutover.** Recommended: on demand (Flat Rate off) while the app is request-heavy
  and byte-light ($71 against the $100 tier at 1,000 hosts); revisit when transfer outweighs requests. Lever 1e.
- **The media domain at the DNS move.** Recommended: yes, for speed first (HTTP/2 and 3, the edge cache, a cacheable
  CORS answer), on Cloudflare Pro ($25 a month) with a WAF HMAC token, not a signature-checking Worker (which bills
  every request, cache hits too). Lever 4.
- **Confirmed guests' MAU.** Recommended: no change until ~70,000 MAU, then decide whether a guest confirms without an
  Auth user. Lever 3.

## System-doc edits (in place, owned facts only)

- none: `docs/PRICING.md` is this lane's own, and `docs/systems/durability-backups.md` "Cost & scaling" stays true at
  today's scale

## Deferred (ROADMAP one-liners, bucket named)

- Now: the album doorbell's coalescer to ~15 s and no ping sync from a hidden tab (`src/lib/guest/refresh-coalescer.ts`,
  `src/lib/guest/use-gallery-doorbell.ts`), once Will picks the cadence (`docs/PRICING.md` "What it costs us", 1a).
- Now: the proxy's matcher off the API routes that re-verify with `getUser()` (album, r2, guests): half their
  invocations (1b; auth-adjacent).
- Now: an album delta carries its new items' links, one call where there were two (1c).
- Now: the backup Worker copies originals only, skipping the `preview` and `phone` variants (2a).
- Now: a lean SigV4 presigner for gallery reads, ~4 µs a link against the SDK's ~170 µs (5).
- Launch checkpoint: Supabase's spend cap off with a budget alert before launch traffic; Vercel's CDN billed on demand
  at the Pro cutover (1e).
- Major overhauls: the album's live channel as one push per album (a Cloudflare Durable Object) before ~10,000
  concurrent viewers (1d).
- Major overhauls, at the DNS move: a media domain (an R2 custom domain, Cache Rules, a WAF HMAC token on Cloudflare
  Pro) (4).
- Major overhauls: the backup prune sized to the deletion rate (today at most 500 media a week, rescanning from the
  head; its cursor is already a ROADMAP line) (2b).
- Speculative: a cheaper home for the backup past ~100 TB (B2 or S3 Glacier Deep Archive), and guests confirmed
  without Auth users near 70,000 MAU (2c, 3).

## Handoff (replaces the chat report)

- Work commits `0875f8fe` (the section) and `936e816b` (the media domain's Worker comparison; the Saturday peak marked
  ≈), pushed. No sync: launch-prep moved from `c925e48f` to `fb2b7128` by record commits only (`docs/STATUS.md`,
  `docs/tracks/orchestrator.md`).
- Gates on `936e816b`, each its own exit code: `zsh scripts/build-lock.sh pnpm test` 0 (811 files, 9,579 tests);
  `pnpm typecheck` 0; `pnpm lint` 0. No build, dev server or lab crawl (a docs lane).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/PRICING.md` + this file.
- Items:
  - `docs/PRICING.md` "What it costs us" replaces "Unit economics": the prices with their links, each action by file
    and line, one party, a month at 1,000 and 100,000 hosts, what breaks first, six levers ranked, a plan at full use,
    and the tail's cold-storage call kept.
  - The annual line's "$369 a year" corrected: a full 2 TB plan costs more than it earns once its backup counts.
  - The ROLE header names the section and dates its prices.
- Verified, never believed: every price is in its page's raw text (curl and grep, 2026-10-03); the WebFetch summaries
  were only pointers. ★ One summary invented Vercel's on-demand "10M requests and 1 TB included": the raw page says
  "Included in Flat Rate CDN" and the iad1 page bills from the first unit, which the doc carries. Resend's 2.5M tier
  is read from the page's own pricing chunk. All 22 new links answer 200.
- Measured: the SDK's presign at ~170 µs of CPU and a hand SigV4 at ~4.3 µs (node 22 on this Mac,
  `_scratch/cost-model/bench/`); the guest page's first load on the alias, 21 KB of HTML and 822 KB of 54 assets
  (brotli); `pg_stat_statements` and `max_connections` 60 (Micro) through the Supabase MCP, read-only.
- The arithmetic: `/Users/gibby/local/ai/partyreel-wt/_scratch/cost-model/model.mjs` (outside the repo), every
  assumption named there and marked ≈ in the doc.
- Assets requested from Will: none.
- Board ideas: how live is live, the album's arrival cadence for others' photos (at once, ~15 s, ~30 s), each option
  with its cost a party beside it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none built. Proposed: Supabase's spend cap off with a
  budget alert; Vercel's Flat Rate CDN off at the Pro cutover; Cloudflare Pro with the media domain at the DNS move;
  the backup Worker skipping derivable variants.
- Calls his to overrule: the recommendations under Questions, and the model's assumptions (one in five active hosts
  holding a reference party, ≈20 clients connected a party, ≈100 guests confirming, parties kept a year, a ≈1 MB
  phone copy).
- Look at first: `docs/PRICING.md` "What it costs us": the one-party table, then the levers.

**For Will** (`docs/PRICING.md` "What it costs us"; prices read from each vendor's page 2026-10-03).

Five numbers:
1. **$0.025 a GB-month:** storage with its backup ($0.015 + $0.010), about three quarters of the bill a year in.
2. **~$4.90:** a 200-guest party (2,000 photos, 100 clips) in its first year ($1.30 once, $0.30 a month), against a $24 pass.
3. **~68,000 server calls and 44,100 Realtime messages a party:** the live album, where every upload wakes every open album: $0.55 of the $1.30, growing with the square of a party, and the first to hit a wall (Supabase Realtime's 10,000 connections; 100,000 hosts peak near 37,000).
4. **$0.0043 a guest who confirms an email:** free under 100,000 a month, ~$10,600 a month at 100,000 hosts.
5. **~$980 and ~$106,500 a month:** 1,000 and 100,000 active hosts a year in (one in five holding such a party), $240 and $32,500 of it not storage.

Three moves, each yours:
1. **Calm the live album:** others' photos within ~15 s, not ~2 s (hers stay instant), and no syncing from background tabs: about half its calls, a few lines. Then one push per album (a Cloudflare Durable Object) before ~10,000 viewers at once.
2. **Back up only originals, and let the prune keep up:** previews and phone copies are remade, so a sixth of the backup and two thirds of its writes go (~$6,000 a month at 100,000 hosts).
3. **Fix the top plan before launch:** full, 2 TB costs us $51 to $66 a month against $39: make it 1 TB at $39 (2 TB later is a gift), or $59 or more.

And one switch: Supabase's spend cap (on by default) goes off before launch traffic, or the doorbell stops mid-month at 1,000 hosts and sign-ins past 100,000 users.
