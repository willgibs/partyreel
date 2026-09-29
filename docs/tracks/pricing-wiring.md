---
track: pricing-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/lib/constants/tier-limits-parity.test.ts
  - src/lib/constants/reserved-slugs
  - src/lib/lifecycle/sweeps/over-capacity
  - src/lib/content-policy.test.ts
  - src/lib/billing/storage-guard
  - src/lib/stripe/provision.ts
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(app)/account/page.tsx
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/components/marketing/sections/home/pricing-teaser.tsx
  - src/components/marketing/sections/home/privacy.tsx
  - src/components/marketing/sections/features/privacy/access-switch.tsx
  - src/components/marketing/sections/features/album/how-much-fits.tsx
  - src/components/marketing/mdx/spec-shared.tsx
  - src/lib/content/llms
  - src/lib/content/help.ts
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/legal.ts
  - content/help/storage-plans-and-limits.mdx
  - content/help/how-partyreel-works.mdx
  - content/help/upgrade-downgrade-or-cancel.mdx
  - content/help/send-the-event-link.mdx
  - content/help/create-your-first-event.mdx
  - content/help/share-the-album-after-the-event.mdx
  - content/help/who-can-see-your-event.mdx
  - content/help/event-settings-explained.mdx
  - content/help/AUTHORING.md
  - content/blog/how-much-storage-for-event-photos.mdx
  - content/blog/wedding-album-password.mdx
  - content/blog/birthday-party-photo-sharing.mdx
  - content/blog/qr-code-for-wedding-photos.mdx
  - content/blog/corporate-event-photo-sharing-pricing.mdx
  - content/blog/group-trip-photo-sharing.mdx
  - content/blog/highlight-reel-renders-on-your-phone.mdx
  - content/blog/AUTHORING.md
  - src/lib/events/gallery-reel.test.ts
  - src/lib/events/gallery-access.server.test.ts
  - src/app/(marketing)/(cinema)/how-it-works/page.tsx
  - content/help/your-public-profile-following-and-blocking.mdx
  - src/components/social/profile-slug-control.tsx
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

- **The estimate's two numbers.** Built: 3.5 MB a photo and 65 MB a minute (`tiers.ts`, sources in the comment). Apple
  prints no size for the 24 MP default photo, so 3.5 MB sits between its two published HEIF brackets (a 48 MP HEIF Max
  is about 5 MB; a 12 MP HEIF about a tenth of a 12 MP ProRAW's 25 MB), toward the larger; 65 MB is Record Video's line
  for the 1080p HD at 30 fps default on current iPhones (the Apple guide no longer prints it; MacRumors quotes the same
  screen). Free reads 29 photos. Recommended: keep. His 10-second check: Settings > Camera > Record Video on his phone;
  if its footer says 60 MB for 1080p at 30 fps, one constant moves.
- **What an upload really stores.** The basis is the camera's capture, as he asked; iOS Safari's picker can hand a web
  page a JPEG of a HEIC (or a recompressed video), so a stored photo may weigh more than 3.5 MB. Recommended: keep the
  capture basis and measure once on the alias (a Deferred line below); retune only if a real upload stores 1.3x or more.
- **The migration went past `tier_limits()` alone.** The paid gates on the password and the custom link lived inside
  `set_event_password` and `set_event_slug` (`if v_tier = 'free' then raise`), so Free could not "gain" either without
  replacing both (host-authenticated, not guest-path, not safety-wiring's). Built: both replaced, byte-for-byte minus
  the gate. Recommended: apply as written.
- **The slug guard, and what else.** Built: `set_event_slug` refuses `RESERVED_SLUGS` in SQL (a host can call it past the
  server action, and a throwaway account can now hold one), the list grew by the site's other route words and a few a
  phishing page would wear (`official`, `security`, `verify`, `payments`, `refund`, ...), and `restore_event` keeps a
  custom link only while it is still free (it used to fail outright on the unique index once another event took it).
  What else, recommended NOT built now: an operator release from /admin on a report (a Deferred line); no Free-only
  length floor or expiry (either re-gates what he freed; the Free inactivity sweep already frees an idle free event's
  link when it moves the event to Deleted, so a squat costs a sign-in every six months).
- **The /pricing line.** Its h1 was the golden line "Start free, upgrade when you host again", which Free at 100 MB makes
  untrue for most first events. Built: "Start free, upgrade for video and more room." (`GOLDEN_LINES.pricing` stays in
  marketing-voice.ts as history). His to overrule, with the Free card's "The full experience, for a small event." and
  the home teaser's "a small first event".
- **The tag's words and place.** Built: "2 months free" (the words /pricing's own toggle uses; computed), sitting beside
  the Monthly / Yearly control rather than inside its Yearly half, where the two outgrew half a 320px phone
  (`shots/lib-prices-375.png`). Recommended: keep; a percentage ("Save 16%") is the alternative.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: ingress derived on every tier; the setters' paid gates mirror `GATED_EVENT_SETTINGS`
  (empty) with `tiers-sql.test.ts`, and `set_event_slug` refuses the reserved words; a Pro host's three sizes under one
  toggle; ★ an estimate always carries its camera (`formatCapacity`'s default basis); "its card flips".
- `docs/systems/lifecycle-recovery.md`: ★ the over-cap sweep's candidates start at the smallest plan's cap, derived.
- `docs/systems/host-app.md`: a custom link on any plan; the reserved words refused in SQL; a restore keeps a slug only
  while it is still free (`custom_slug_released`); the downgrade clause dropped.
- `docs/systems/reel.md`: the clip's levers are its mark alone (60 s on every tier).
- `docs/systems/database-security.md` (a reads doc; its one line was this lane's fact): a paid gate on an event setting
  lives in its setter RPC, mirroring `GATED_EVENT_SETTINGS`, none today.
- Proposed for the Orchestrator, not edited (`docs/PRD.md` is a read): "The one mark is on a free event's clips, beside
  their shorter length" drops "beside their shorter length"; the pass "with video and every paid control" becomes "with
  video and clips with no mark"; the upgrade triggers become "video, outgrowing Free's 100 MB, and a second event".

## Deferred (ROADMAP one-liners, bucket named)

- Host: a restore that came back without its custom link (`restore_event`'s `custom_slug_released`) could say so in its
  toast; `restoreEvent` in `db/mutations/media.ts` drops the flag today (from `pricing-wiring`).
- Admin: an operator release for a squatted custom link, from a report on `/e/<slug>`, now that a free account can hold
  one (from `pricing-wiring`).
- Billing follow-ons: measure one iPhone photo and one 10 s video uploaded at the camera's defaults on the alias
  (`media.file_size_bytes`); if the browser stores a JPEG or a recompressed video, retune `AVG_PHOTO_BYTES` /
  `VIDEO_BYTES_PER_MIN` to what we store (from `pricing-wiring`).
- Marketing: /pricing's table, /reel's clip table and pro-vs-event-pass all carry a clip-length row that now reads 60 on
  every plan; it could fold into the mark's row (from `pricing-wiring`).
- Code hygiene: `components/lab/scene.tsx`'s header still lists `host-storage` among the boards drawing a Scene, and the
  Library's `composition-demos.tsx` calls its fixture "the host-storage board's videographer" (from `pricing-wiring`).
- (Retire, not add: ROADMAP's "The lab and the kit: `host-storage`'s plan quote ... still say 'You are on Pro already'"
  went with the board.)

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/pricing-wiring`:** the work `a2076912`; the retirement `596a9cff` (one commit: the folder and
  its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`); two syncs, both merges: `f1d96960` (at `1b394476`: the
  three lab registration files conflicted, event-settings' lines kept and host-storage's removed) and `560c3453` (at
  `2d3f8a30`, after voice-wiring merged: `registry.ts` and `touchpoints.ts` conflicted, both boards' retirements kept;
  `album-copy.ts` auto-merged); owns updates `8af9df38`, `2d59aced`, `347d593f`; this handoff commit on top.
- **Gates on the synced tree, sha `560c3453`, each on its own exit code:** `pnpm typecheck` 0
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/sync2-typecheck.log`); `pnpm lint` 0, 4 warnings, none in a file this lane touched (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/sync2-lint.log`);
  `pnpm test` 0, 522 files / 5898 tests (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/sync2-test.log`); `zsh scripts/build-lock.sh pnpm build` 0
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/sync2-build.log`); `pnpm lab:smoke --base http://localhost:3132` 199 checks, 0 failing (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/sync2-smoke.log`).
  No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 95 paths): owned paths and this file, plus the
  named exceptions: `registry.ts`, `boards.ts`, `touchpoints.ts` (the retirement, named by the brief);
  `src/components/marketing/sections/features/album/album-copy.ts` (one line in the file voice-wiring owned: the
  "Password protection comes with Pro and Event Pass" fact, which the shift makes false); the five system docs above.
- **The migration** `supabase/migrations/20260928130000_free_shift.sql`, rolled back twice on the live schema through
  the Supabase MCP (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/proof-result.txt`): 16/16 (tier_limits' numbers, `monthly_ingress_cap('free')` = 300 MB, a free
  host's 50 MB and 105 MB uploads allowed, 120 MB refused "Storage capacity exceeded", the 300 MB meter refusing at 290
  + 20, a password and a link set on Free, "Support" and "official" refused, both restore paths, grants), then 6/6
  adversarial (another host's event refused for both setters and the restore, "  SUPPORT  " refused, anon 42501 on
  both). After: live `tier_limits('free')` still 2 GB, nothing persisted.
- **Items:**
  - `tiers.ts`: Free 100 MB (`MEGABYTE`), ingress derived on every tier (300 MB for Free), `MAX_REEL_SECONDS` 60
    everywhere, `GATED_EVENT_SETTINGS` empty with `isSettingLocked` reading it, the estimate constants from Apple's
    figures, `ESTIMATE_BASIS` / `ESTIMATE_BASIS_NOTE`, `formatCapacity` carrying the basis unless `basis: false`.
  - The plan sheet: a Pro host's three size cards under one Monthly / Yearly toggle (`cadence-toggle.tsx`, opening on
    her billing), the saving tag computed (`cadence.ts`, "2 months free"), a bar of her bytes in every size, "Switch to
    yearly" on her size's other billing, her plan in ink, the refusal flip / "Keep Pro 500 GB" / the Pro head kept, the
    fit line at the billing on show (`proFitLine`'s interval), one basis note under the cards; the shared card grammar
    in `plan-card.tsx`; Pro's third benefit line "Clips with no watermark"; the receipt's likewise.
  - The over-cap sweep's floor is `Math.min` of the plans' caps (a typed 2 GB would skip every lapsed host between
    100 MB and 2 GB), with a regression test.
  - SQL pins (`tiers-sql.test.ts`): each setter refuses Free exactly when its setting is gated; `set_event_slug`'s array
    is `RESERVED_SLUGS`; the restore's release. The parity canary moved to 100 MB.
  - /pricing: the pair (Free lists the password and link, two minuses; Pro "Everything in Free" then his four), the
    pass card, the unlock grid of his four ("Pro brings all four. An Event Pass brings the first three to one event."),
    the table (password and link on Free), the calculator (Free's cap the ladder's first stop; the live line with its
    basis; "None" for a photos-only plan's video), the FAQ and its JSON-LD, the line, the CtaBand, the metadata, the
    basis note under the plans.
  - Elsewhere: the home teaser and privacy claim, /features/privacy's plan note, /features/album (the password fact,
    the basis under the strip), how-it-works' close, llms.txt (and its test's derived fence), the help facts strip, the
    storage meter and Plan card (the shared estimate, no video on Free), the Terms (1.8), fifteen help articles, five
    posts and both authoring guides (`<EstimateBasis />`, `basis="off"`); the content fence's ingress numbers derived.
  - Retired `host-storage`.
- **Verified locally at 1440 and 375:** /pricing (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-wiring/shots/plans-375.png`, `plans-1440.png`, `unlock-375.png`,
  `fit-375.png`, `pricing-1440.png`), the plan sheet's Pro list in the Library's StorageList entry
  (`lib-prices-1440.png`, `lib-prices-375.png`, `lib-prices-yearly-1440.png`, `lib-prices-flipped-375.png`,
  `lib-prices-light-375.png`; on the re-synced tree `final-lib-prices-375.png`, `final-plans-1440.png`); every other
  surface above read off the rendered HTML. The Free host's sheet is unit-
  tested only (no Library entry mounts it); the live walk of the page and both sheets is Build 16's red-team.
- **Assets requested from Will:** none.
- **Board ideas:** /pricing's own cadence toggle types "Yearly, 2 months free" inside its half and wraps at 375; the
  sheet's computed tag beside the control could be its shape too. The Free card now lists six lines to Pro's five; the
  pair's balance may want a look.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** apply `20260928130000_free_shift.sql` (four
  functions, no table, no column; grants restated as they stand live; types unchanged, so no regeneration is needed;
  `get_advisors` should read as today). No live Free account is over 100 MB (two, the largest 26 KB), so no grace email
  fires. No Stripe, Vercel, Worker or env change.
- **Calls his to overrule:** the estimates (3.5 MB, 65 MB; Free 29 photos); the /pricing line; the Free card's tagline
  and footnote; the home teaser's words; the unlock grid's four and its subhead; the pass card's "No subscription, and no
  inactivity sweep"; the tag beside the toggle; ink for her exact plan only; the reserved-word additions; the Terms 1.8
  wording; Pro's "Clips with no watermark".
- **Look at first:** the migration's reach past `tier_limits()` (Questions, third) and its proof; then the Library's
  StorageList entry at 375 for the toggle; then /pricing at 375.
