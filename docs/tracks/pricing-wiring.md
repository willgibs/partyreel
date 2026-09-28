---
track: pricing-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "661f41dc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/tiers
  - supabase/migrations/20260928130000_free_shift.sql
  - src/components/app/pricing/
  - src/components/marketing/sections/pricing/
  - src/components/app/event-settings-form
  - src/lib/validation/event
  - docs/PRICING.md
  - content/help/what-the-free-plan-includes.mdx
  - content/help/pro-vs-event-pass.mdx
  - content/help/password-protect-your-event.mdx
  - content/help/custom-event-link.mdx
  - content/help/reel-styles-length-and-layout.mdx
  - content/help/what-you-can-upload.mdx
  - src/app/(dev)/design/sandbox/host-storage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-storage.json
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - docs/PRD.md
---

# lp/pricing-wiring

**Goal.** Build Will's pricing decisions: host-storage's `prices=sizes` on a monthly/yearly toggle with a yearly discount tag, estimates from an iPhone's default camera settings said as such, and his free/pro shift (Free at 100 MB with nearly Pro's experience; Pro defined by videos, storage, unlimited events and no reel watermark); then retire host-storage.

## The brief

**His answers.**
- **`prices=sizes`** (`docs/reviews/host-storage.json`, r2). His note: "it feels really weird how we're including monthly AND yearly pricing at the same time in each card ... Would make much more sense to follow the common/expected pattern of a monthly/yearly toggle up top (users know there's always savings for annual, we could include a discount tag beside yearly) so each card can focus on the plan/storage, not comparing monthly vs yearly within each."
  - Build the plan sheet's six prices (`src/components/app/pricing/pro-price-list.tsx`, the `sizes` drawing in `src/app/(dev)/design/sandbox/host-storage/`) as three size cards under one Monthly / Yearly toggle, the saving tagged beside Yearly (computed from `tiers.ts`' prices, never typed).
  - Keep what `storage-wiring` built on these rows: the inline refusal flip, "Keep Pro 500 GB", the Pro head.
- **The estimates**, the same note: "We also need a cleaner way to present estimated images/videos per plan, so it's not just a random claim ... iPhone is probably our most commonly expected upload device and camera, most users probably haven't changed default settings on those either. Would likely be most fair 'average'."
  - Research Apple's own published figures for today's default capture (the Photos format and resolution, and Settings > Camera > Record Video's default and its per-minute size).
  - Set `AVG_PHOTO_BYTES` and `VIDEO_BYTES_PER_MIN` in `tiers.ts` from them, with the source in a comment.
  - Every estimate says its basis ("at an iPhone's default camera settings"), on /pricing, the plan sheet and the blog's capacity components alike (they all read `friendlyCapacity`).
- **His free/pro shift** (event-safety's `choose`, `git show 69afdbc5:docs/reviews/event-safety.json`): "shift a few more pro features on free, so the free plan feels very close to the same pro experience, minus a few core blockers that more clearly define what a pro upgrade includes (videos, more storage, unlimited events, no reel watermarks) rather than the less important stuff (reel clip time, event gating, etc) ... free should become much more restrictive on storage (like 100mb)." The calls he may overrule, as the Orchestrator set them:
  - Free's cap 2 GB to 100 MB, about 30 photos at iPhone defaults. Starting low is the reversible direction.
  - Free's monthly upload meter (unmarketed, never refunds) follows the paid rule, 3× the cap: 300 MB, down from a flat 20 GB.
  - Free gains the password, the custom link and 60-second reels (`MAX_REEL_SECONDS`).
  - `GATED_EVENT_SETTINGS` empties, and the lock machinery stays for videos.
  - Pro keeps videos, storage past Free, unlimited events and no reel watermark. Event Pass keeps its reason (one event, videos, 75 GB, no subscription); keep every page's three-plan story true.
  - **Flag:** a custom link on Free lets throwaway accounts hold good slugs. Add a guard: a slug frees when its event is deleted, plus reserved words. Say what else you'd want under Questions.

**The migration** (write it; the Orchestrator applies it):
- `supabase/migrations/20260928130000_free_shift.sql` replaces `public.tier_limits()` alone, from its newest definition, keeping the Vitest parity test green.
- Never replace `create_media` or any guest-path function: `safety-wiring` owns those this batch.
- A rolled-back check: a free host's upload past 100 MB refused, and one under it allowed.

**The sweep:** every "2 GB", "photos only" or plan-feature claim on /pricing, the FAQ, the help, feature pages, the blog and structured data (`jsonld.tsx`) reads the new line. Lab boards that import the facts follow on their own. Guard the over-cap grace path at 100 MB, since a downgrade now lands far over it. `docs/PRICING.md` and `billing-caps.md` are refined in place: `PRICING.md` is owned; `billing-caps.md` is a system-doc edit listed in your Handoff.

**Stripe:** no product or price changes; Free has no price. Never trust the client for tier: the webhook stays the only writer of `profiles.tier` and `storage_cap_bytes`.

**Neighbours:**
- `safety-wiring` holds `src/lib/db/mutations/social.ts`. If a gate there must move, name a one-line exception.
- `voice-wiring`, `export-wiring` and `hero-wiring` come after you: take nothing of the guest voice, the export flow or the home hero.
- Add any other path to `owns` before editing it.

**Then retire `host-storage`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Verify:**
- Vitest for the toggle, the saving, the estimates and the tier numbers (parity).
- The plan sheet and /pricing at 1440 and 375.
- `pnpm lab:smoke` whole.
- Build 16's red-team walks the page and the sheet short of Stripe.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
