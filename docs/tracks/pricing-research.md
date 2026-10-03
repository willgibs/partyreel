---
track: pricing-research
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c25f9af"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/research/pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/PRD.md
  - src/lib/constants/tiers.ts
---

# lp/pricing-research

**Goal.** Context for Will's pricing decision, so it is made once: what the market charges for what Partyreel does, what a host compares us to, fresh ideas, and each ladder supported or knocked down, all redone with Deleted counted in storage (his decision today).

## The brief

**Will's words (2026-10-03):** "I'll revisit the pricing ladder later. Really want to put time into thinking about this one so we aren't flip-flopping later on. If you can think of any more ideas, feel free to. If you'd like to add any more context to support or knock down an option. Please defer both questions. Will also review the 'what it costs' doc." The two questions he deferred: which ladder (A, B or C, in `../partyreel-wt/_scratch/cost-atlas/ladders.md`; A recommended, with the Advisor's 1 TB at $109), and the Event Pass renewal ($15 or $19).

**Settled since:**
- the pass counts its uploads over its year;
- Deleted counts in storage (`trash-in-storage` is building it), so a plan's worst month loses the bin's doubling and the re-delete guard is gone;
- published limits, never hidden ones;
- "no guest limit" and "unlimited events" kept.

**Research, every price read from the vendor's own page today and dated (read the raw page: a WebFetch summary once invented a price):**
1. **The market for event photo sharing:** QR guest-upload apps, wedding photo-sharing apps, disposable-camera apps and live photo walls. Find their prices, how they charge (per event, a subscription, by guests, by storage, by retention), their limits and what they leave out. At least eight, named, with links.
2. **What a host compares us to:**
   - consumer cloud storage (Google One, iCloud+, Dropbox) per GB;
   - photographers' client galleries (Pixieset, Pic-Time, ShootProof, SmugMug) and their storage tiers.
   Say plainly where pricing by storage invites a per-GB comparison we lose, and how a plan's name and table can sell the event instead.
3. **Each ladder (A, B, C) supported and knocked down,** against the market and against Will's brief: a first tier that holds one big event or several small; each step a host's next natural use; no paying host costing more than she pays. Recompute every worst month and margin with Deleted inside the cap (PRICING.md's method; `../partyreel-wt/_scratch/cost-atlas/model.mjs` and `ladders.mjs` may be copied into your scratch and changed there).
4. **New ideas worth his time,** each with its case and its risk: a per-event price beside the subscription, retention as the paid axis (keep forever), video as the premium, storage add-ons, annual-only Pro, a first-event discount, and what a host who exports and cancels does to each.
5. **The renewal at $15 or $19,** with the market's own renewal and archive prices.

Write it for Will in `../partyreel-wt/_scratch/pricing-research/`: a summary under 800 words, plain, to read in one sitting, then the detail and the sources. Read-only: no code, no service, no Stripe, no repo doc but your own manifest (your `owns` is a claim you never write to: everything goes to your scratch). Your chat report stays one line.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `pnpm test` green on your tree (the manifest policies read your file); every price with its URL and the date read; every recomputed number reproducible from your scratch scripts; the summary and the detail named in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

Will's two deferred questions, and two the research raised. The case for each is `summary.md` (797 words) and
`detail.md` in `../partyreel-wt/_scratch/pricing-research/`.

- **The ladder: A, B or C?** Recommended **A, with Pro 1 TB at $99** (not the Advisor's $109). With Deleted inside the
  cap every plan of every ladder keeps rule 2 by at least 1.20x before the levers, and A's thinnest Pro plan rises from
  1.02x to 1.38x; the 1 TB holds 1.50x yearly at $99, so $109 is no longer needed for cost (detail section 3).
  Against the market: A's $29 pass is the floor for a wedding kept a year (median $49), B's $49 pass its middle, C
  sits above it (detail sections 1 and 3).
- **The renewal: $15 or $19?** Recommended **$19, its year carrying the pass's own uploads row** (50 GB over its year):
  1.45x at its worst against $15's 1.14x (1.56x and 1.23x with 25 GB of uploads). Once sold, it binds every holder who
  renews, so it must outlast vendor drift: $15 absorbs a 14% rise in our costs, $19 a 45% one. The market's one
  published renewal is GuestPix's $49 a year (detail section 5).
- **New: the first Pro step yearly-only ($90 a year, no month)?** Recommended. In every ladder, and on the site today,
  one month of the first Pro step is the cheapest way to run one event ($9 against A's $29 pass): never a loss ($1.58
  against $8.38), but $19.48 of pass revenue gone each time and a subscription to remember to cancel with no refunds.
  Yearly-only, her cheapest month is Pro 200 GB at $29, the pass's own price; planners and venues keep monthly (detail
  section 4).
- **New: sell the event, not the GB, on the pricing page?** Recommended, as a board: Pro's slider stops named by use (a
  season of parties, a planner's year, a venue's year) with the GB in the row; each card led by the events it holds;
  the table's rows the market cannot match together (no guest limit, no upload window, video of any length to 10 GB a
  file); "one payment, no subscription" on the pass. GB for GB we cost 9x to 19x consumer cloud (detail section 2).

## System-doc edits (in place, owned facts only)

- None: a research lane; everything is in the scratch folder, and the ladder Will picks is wired by a later lane.

## Deferred (ROADMAP one-liners, bucket named)

- None from this lane: the picked ladder's wiring is already cost-atlas's "Billing follow-ons" line.

## Handoff (replaces the chat report)

- Commits on `lp/pricing-research` (the manifest only; the work lives in the scratch folder, never the repo):
  `697493e2` and `f6cf7eb2` (milestone notes) and this handoff, on `e9b006e4`. No sync: launch-prep moved only by
  record commits (`83c1eefb`, `25769e93`, `9d5be0bf`), none touching a read or an owned path. The head is in the chat
  line.
- Gates: `pnpm test` exit 0 on `f6cf7eb2` (875 files, 10,476 tests; `../partyreel-wt/_scratch/pricing-research/test.log`),
  through `scripts/build-lock.sh`. The lane changes no code, so typecheck, lint and build were not run (the manifest's
  Verify on names `pnpm test`). After this handoff edit, the seven test files that read manifests again
  (`track-manifests`, `single-source-policy`, and `design/_data`'s `tracks`, `docs`, `links`, `legacy-routes`,
  `catalog`): exit 0, 121 tests (`../partyreel-wt/_scratch/pricing-research/manifest-tests.log`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/pricing-research.md` only.
- `summary.md`: for Will, 797 words (`wc -w`): the market, the comparisons, Deleted inside, the ladders, the
  recommendation, the host who downloads and leaves, the ideas, the renewal.
- `detail.md`: (1) sixteen rivals and the two free albums, each price pinned to `pages/<name>.rendered.txt:line`, what
  the market charges for and what it leaves out; (2) a GB a month against cloud storage and photographers' galleries,
  where we lose and how the name and table sell the event; (3) every ladder recomputed with Deleted inside, for and
  against; (4) the eight ideas with case, risk and the exporter; (5) the renewal; (6) what to watch (Apple's iOS 27
  albums).
- `sources.md`: the 44 pages (`pages.tsv`; `render-all.sh` re-reads them; ShootProof read raw where a headless browser
  met a bot check), read 2026-10-03; no price taken from a search result or a summary.
- The numbers: `node ladders.mjs` reproduces cost-atlas's `ladders.out.txt` byte for byte (`ladders.repro.txt`);
  `deleted-inside.mjs` → `deleted-inside.out.md` (the ladders, passes, renewal, headroom, exporter, quoted figures);
  `market.mjs` → `market.out.md` (a GB a month, the market's median); `verify-refs.py` → `verify-refs.out.txt` prints
  every `file:line` the write-up cites.
- Found on the way: Apple's iOS 27 shared albums (full resolution, guests on the web without an account, a free
  temporary album for 30 days and 5,000 items, kept albums on the owner's iCloud) are the new free floor
  (`pages/apple-*.rendered.txt`).
- Assets requested from Will: none.
- Board ideas: the pricing page selling the event (the fourth question above); gift a pass (a parent or the wedding
  party pays; Wedibox sells gifts); printed QR cards at checkout (WeddingSnap's $39.99 becomes "from $74.99" with print).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: A with Pro 1 TB at $99; the renewal at $19 with the pass's uploads row; the first Pro step
  yearly-only; no storage add-ons, no one-time "forever", no video tier; a first-event discount aimed at the second event.
- Look at first: `../partyreel-wt/_scratch/pricing-research/summary.md`, then `detail.md` section 4 (the host who
  downloads and leaves).
