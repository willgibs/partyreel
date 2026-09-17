# Partyreel — What's next

> ROLE: what MIGHT be next — the curated upcoming work + the buckets where deferred work accrues.
> BELONGS HERE: directly-upcoming tasks · the major-overhaul buckets · the launch checkpoint. · NOT HERE: how the system works (→ [`systems/`](systems)), the build history (→ [`CHANGELOG.md`](CHANGELOG.md)), current state (→ [`STATUS.md`](STATUS.md)), the comprehensive/speculative backlog (tracked outside these docs).
> GROWS BY: prune (delete a line when it ships or is dropped) + append one-liners under the right bucket.

**Provisional + non-binding.** Everything here is a CANDIDATE that may change — it is **not a spec, not an
invariant**, and **must not constrain current implementation** (don't bend today's feature to fit a line
below). An item is only "real" once it's **picked up into its own plan** (we re-plan per task, the house
pattern). The load-bearing "what exists / don't-revert" layer is [`systems/`](systems); this file is just
the shortlist of what could come next.

**Where deferred work goes (the one rule):** when you defer something, add it as a **one-liner under the
matching overhaul bucket or the launch checkpoint** below — never an inline "Deferred:" note elsewhere.
When that overhaul finally runs, its whole accrued task log is already sitting here.

**Picking up a task:** the working loop lives in [`CLAUDE.md`](../CLAUDE.md) (orient → doc-check →
plan → build → test → verify live → record); your role + branch rules are CLAUDE.md "Sessions &
roles" + [`PROGRAM.md`](PROGRAM.md).

## Now (concrete, pick-up-able; one line each, the provenance in git)

The lab and the kit:
- The lab: the spec docs of retired boards (`docs/specs/palette.md`, then `type-scale.md` once its wiring lands) still read as standing proposals; at Round 3's planning, fold what is still true into `docs/systems/design-system.md` and delete them with their slugs in `_data/docs.test.ts`.
- The lab: `library/rules/[id]/page.tsx` links `docs/tracks/<id>.md` for any status whose track is not a standing board without checking the manifest exists, so the rule page 404s the next time a ruled board retires; make that branch read the track states the desk already reads.
- The lab: ten boards under `(dev)` still fade `text-muted-foreground/N` by hand (`git grep 'text-muted-foreground/'`); move them onto `text-faint` as each board is next touched.
- The lab: `catalog.tsx` prints a card's `lands` only when the card is walked alone or picked, so a keep-any gallery never shows what keeping one lands as; widen the guard or give the gallery walk the solo walk's line (media-kit round seven).
- The lab: a step's option tiles always draw inside a 1440 canvas (`FitStage mode="desktop"` in `step.tsx`), so a specimen narrower than the canvas lands as a thumbnail beside empty ground; the tile could take the canvas width its board declares (media-kit round seven).
- The lab: the true-size box belongs in `src/components/lab` (a specimen at 1:1 inside a step's zoomed tile), built from brand-voice's copy, the only one of three whose reads SETTLE (`Stage` resolves its scale a pass after the box mounts and no ResizeObserver reports an ancestor's zoom, so type-scale's and rounding's copies measure 1 on mount and never compensate); the three board copies and floating-surfaces' enlarged loupe delete with the move.
- The lab: a board whose option tile IS the specimen needs a declared way to say so (`--lab-tile-min`, `--lab-tile-h` and the phone column count) instead of a `:has()` rule in its own sheet (rounding round seven).
- The lab: a one-at-a-time catalog step has no config strip, so a reviewer at 375 cannot switch Canvas from the walk (`?canvas=phone` does it); `CatalogSpec.strip`, mirroring `Ask.strip`, is the fix (light round seven).
- The lab: a staged step reached by its own URL before its prerequisite is held numbers itself past the end ("step 43 of 42"); the walk should redirect to the first open step instead (light round seven).
- The lab: the step's option tiles scale their evidence (`FitStage fit="zoom"` in `step.tsx`), so a board judging SIZE has to undo it; offer a tile that draws at 1:1 and retire `sandbox/type-scale/true-scale.tsx` into it (type-scale round seven).
- Every catalog board's `reading.why` and declared budget over-state the template's cost since the stepped review deleted the index, the "Rule on:" rows and the review panel (the boards read 1,141 to 1,662 on that tree); each board's own round rewrites its declaration.
- The review card at 375 as a bottom sheet that keeps the question and the picked option in view while the evidence scrolls.
- Evidence the asks still owe: a left-aligned lockup and a hero with no count on `home-hero`; the arriving tile, the settled no-script frame and the voice line on `album-hero`; a proportion control and the no-photographs guest screen on `river-visual`.
- A measured-width wrap for the dock's knobs (a four-option switch with full labels overflows a 375 dock).
- `lab-review`'s scanner assumes a literal `defineBoard({`: keep every spec a literal or teach the scanner the wrapper.
- Lift `height="measured"` on `Frame` and `useAnchorAfterSettle` out of `sandbox/brand-voice/frames.tsx` into the kit.
- `SpotCompare` writes its own "What differs" line per spot with no way to shorten or suppress it (about 250 words of a two-dozen-spot board's budget); take an optional `differs` per spot.
- `CompareTwo`'s grid squeezes a fixed-width child, so a pair of `Frame`s laid out through it overlaps (712px columns under 1440px frames): document that a frame belongs in a `FrameRow`, or give `Compare` a `max-content` column mode.
- `Frame`'s `onApproach` cannot fire for a frame clipped out of a horizontal scroll row (the IntersectionObserver reports it as not intersecting): a row of frames takes the approach on the ROW, and the kit could carry that rather than each board.
- The production `EventCard`'s event name is a hand-rolled `font-heading text-xl` no type hook reaches, so the type-scale wiring sweep is four headings, not three.
- The board template's own chrome is about 1,000 to 1,300 words on a catalog board (the Answer prints every ask's context, look and because; the index reprints every lede; `answer.tsx`'s BoardMeta prints every idea's rationale, the departures and the assets unfolded; the Rule-on panel repeats the asks): fold what repeats behind disclosures like the card's own, so a catalog can meet 1,200 with its own words (the light board measured about 990 words of template in 2,889).
- A `Frame` seeds its state from the parent's FIRST render, before `useBoardState` reads the URL, and the correcting `lab:set` lands before the frame has hydrated (a board opened at `?ground=cinema` painted every card on the app's dark); the floating-surfaces board rides the frame's src for that state, and the kit could carry the fix.
- The lab dock renders every declared control as a pill row, so a catalog of thirteen costs thirty-nine pills across Pick, A and B; a select above about eight options gives the dock back a screen (`ControlKnobs` in `board-state.tsx`).
- ★ `ui/dropdown-menu.tsx` renders `SubContent` with no `Portal` while `Content` carries `overflow-y-auto`, so every nested submenu in the product paints nothing (the account menu's theme picker is the call site, on every host page): a wiring-round fix, with the floating-surfaces catalog's kept card.
- Fold the gallery's `RefSection` into the shell's `Section` (one anchor shape).
- Delete `_desk/sample-spec.ts` and the desk's dry run once every standing board carries a spec.
- Index the kit as a component family in the collector and delete `kit/notes.ts`; retire the panel half of the rounding board's `usePanelAwareWidth`.
- `pnpm design:specimens` beside `design:rules`, so `specimens.generated.json` regenerates by name.
- Delete the "asks, one word each" blocks from the four `docs/specs/*.md` (the registry carries the boards' asks).
- The collector's id collision: a contract target whose stem matches a library component renames both files.
- `// @policy:` on the remaining tree-reading tests so `/design/library/policies` lists every line the gate holds.
- CI caches only the pnpm store; cache `.next/cache` too if the wall time bites.
- A `design.partyreel.com` mapping rewrites the two route prefixes and `_data/legacy-routes.ts` in one place.
- Trim every standing board to `LIMITS.readingWords` (`pnpm lab:smoke` prints what each weighs; a board that declares a catalog fails the smoke over budget, a paper prints its weight until it is rebuilt).
- Mount `ItemVerdictRow` with `LIBRARY_VERDICTS` on a Library entry's page so a scroll through the components fills `docs/reviews/_library.json` (the ledger, the reader and the desk's "Redesigns you asked for" are landed; Round 3 of the revamp).

Marketing:
- Site-wide: the ~35 `bg-muted/N` sites become sections carrying `.surface-mat`, which ships declared and unworn since the palette's wiring (`88d0bec0`); the palette spec called the sweep mechanical.
- Site-wide: an a11y pass on `--faint` (3.21:1 on the page, 2.92:1 on the mat); a few of the 40 sites it inherited read closer to body copy than to a caption.
- The home hero (`hero-stream.ts`, shipped `0c58ff76`) is solved at two breakpoints, so between 768 and 1023 it wears the phone's card size and measure on a tablet-width screen: correct, not composed; a third breakpoint when anyone judges it there (`Geo` takes one without a structural change). The hero stays unlit until the light board's home-arc wiring.
- Events then pricing on the home are both card grids; Will named chapter 3 the model, so it stays until he wants it varied.
- The events manifest fill: the conference and trip stills are borrowed; real photographs are the fix, never a third scrim.
- The five remaining feature pages, one ground-up round each in nav order, the album page as the model (the brief: `git show 0f52503:docs/tracks/marketing-feature-pages.md`).
- The album's ambient pieces (the phone's screen cycle, the Live | Review photograph, the lightbox pill), a focused round judged on Will's screen.
- The design lab on its own subdomain: one repository, a second Vercel project on the same code (architecture, not a saving: 2.5 MB marginal).
- Admin as its own app on its own subdomain: a separately deployable surface with a closed blast radius (not a saving: 1.5 MB marginal).
- Fold the two `SourceLink` copies into one; link each contract block on the rules page to its component's permalink.
- App polish the gallery surfaced: `empty-state.tsx`'s comment vs its default, `action-tooltip.tsx`'s claimed delay, `ui/drawer` and `ui/tabs` unused, `ui/select` and `ui/sheet` one call site each.
- The rounding sitting is Will's on `/design/lab/rounding` (the `rounded-*` scale derives from `--radius`; `--radius-tile` and `--radius-float` are separate tokens; the sharp-surface / round-action contrast is the affordance to replace).
- The composition pass: once the six boards are ruled, one board stacks the ruled blocks on the home arc and the dashboard beside today, and the wiring rounds cut from that.
- The engine's `@supports not (mask-image)` fallback is compiled away by Lightning CSS: accept and say so in the comment, or drop the rule.
- The hero's warm-up (the lamp arriving neutral and warming into the wall) is built and pulled; pick it up when Will can judge the swap on a visible screen.
- The lit surface (`[data-lit]`) rides the `light` board; never un-apply it from the moment-12 specimens to re-judge them.
- The spill placement rounds: the ground picks the sibling (ink takes the beam, paper takes spill in the paper register); law 3 on real media is a loader swap to `decodeImage` on `previewUrl`; open engine defects: `effectiveAlpha` is optimistic, a bloom's band snaps as it arms, `useInViewOnce(0.35)` never arms a lamp taller than about 2.86 viewports, `BorderBeam` reads the OS scheme rather than `resolvedTheme`.
- The QR-to-album handoff wants its own ground-up visual round; the pour (photographs leaving one object and landing in another) is parked for a real "photos dump here" moment.
- The `/design` gate on an `lp/*` alias is captured at build time: push again before concluding anything about the env.
- No production surface carries `forced-colors` or `@media print` but the spill engine; copy its pattern.
- Help deep links from the app (settings to its article, the Studio to the reel guides); self-serve account deletion (then the help article and the privacy policy's "Delete your account" choice); a newsletter unsubscribe path.
- Product gaps the help catalog documents honestly: the video-uploads wrapper string omits the Event Pass; `?upgraded=1` is never read; "Public" in settings vs "Open" in the header chip; the restore toast never reads `mediaStillRemoved`; the ops-only missing-ETag error can reach a guest; the privacy FAQ overstates the event-level Report; `tiers.ts`'s comment cites a retired video limit; the guest 404 says the event "may have ended"; the open-event unfurl promises "no account" when the event requires one; `lifecycle-recovery.md` vs `listRecentlyDeletedMedia` on a guest's self-deleted upload.
- The EXIF "for the common formats" clause's two remaining sites: `never-rides-along.tsx` and `feature-pages.ts`.
- Stripe Checkout `consent_collection` stays off (the guest door and `/login` carry the consent line); print styles for the legal pages; the faq accordion onto the `.mkt-acc` recipe; the floating layer's own reduced-motion gate.
- The blog's cover pool is unlicensed for recognizable people (all twelve `MARKETING_IMAGES`); replace before launch.
- Inline code as a muted plate in the help centre and the blog; a "Watch your event highlights" video card linking `/reel` on another page.
- `/press` grows into the partnerships kit; post-launch event types (`/events/birthdays`, `/events/memorials`); the media batch (per-vertical reels, honest trip and conference subjects; the stock stand-ins Will replaces).
- `/contact` onto the cinema rhythm (the last `(paper)` page; the identity revisit rides with it); the footer's Claude assistant link drops to ChatGPT-only if first impressions warrant.
- The blog's follow-ons: real `/blog/page/[n]` routes; a "Start here" strip past ~40 posts; the featured card's eyebrow as the post's purpose; a founder-voice post needs a ruling; the `compared` posts re-verified on each refresh.
- ★ `PageHero` owns only the plain type lockup, a stage slot and a backdrop; a hero whose object sits beside the lockup or a form stays bespoke.
- A mobile pass of its own over the whole marketing site (every round to date was judged at desktop).
- The root 404's browser tint (`theme-color` light over a dark page); the design-system doc's em-dashes go when it is next rewritten.

The app:
- The admin chart ramp (`--chart-1..5`, both modes) is still chroma 0 beside Graphite's cool greys; a cast on five greys is a ruling, not a wiring round's value.
- ★ The aurora is dark-ground only (Will, 2026-09-17: "No light ground usage is a decision for now"): the app's light mode owes its own answer for lit surfaces before the dark versus light work starts.
- Cross-gallery sort and filter for the Uploads hub (`get_my_uploads` is filter-ready; add a like-count sort).
- Zip-export follow-ons: an async build-to-R2 job past the cap; a custom `export.partyreel.com`.
- Preview-variant follow-ons: a server-side backfill for pre-feature media; preview bytes on the storage meter; the moderation feed's preview; AVIF if quality demands.
- A unified per-upload size limit and per-event `max_upload_bytes`, enforced at presign ([`systems/uploads-and-r2.md`](systems/uploads-and-r2.md)).
- HEIC/HEIF/AVIF and WebM metadata strip (the client-side strip fails open on item-based ISOBMFF and EBML); the JPEG MPF secondary-image Exif scrub.
- Forensic capture follow-ons, all gated: the pre-strip client-side EXIF capture (counsel-gated), proactive hashing at scale, widening the CSAM scanner past proxied traffic ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
- Bulk Restore-all and Empty-bin for the recovery bins; immediate hard-purge for egregious content in `/admin/albums`.
- File-picker upload e2e reconfirm on a real device; the arrival choreography fine-tune on a real gated event, one round after the V1 phases.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **QA hardening — the remaining fix queue** (the ~590-agent adversarial round of 2026-07-28/29;
  Q1-Q4 + the write spine shipped as milestone-1.5 — [`systems/host-app.md`](systems/host-app.md) +
  [`CHANGELOG.md`](CHANGELOG.md); this list IS the remaining queue). Roughly in the intended order:
  - **Abuse + jobs + observability:** #13 a `presign` abuse kind (pure TS, `action_attempts` is
    kind-generic; needs `Retry-After`/429 vocabulary the pipeline lacks today) · #14 the contact + careers
    limiter, fail-CLOSED (unauthenticated + unthrottled today: each call = one service-role insert + one
    Resend send, and ~3,000 requests drain the monthly quota, after which the orphan-sweep and prune
    breaker alerts cannot send) · #15 the purge cron + backup Worker have NO `/admin` surface and NO kill
    switch (the P8 mandate; `/admin/exports` + `/admin/reels` are the byte-identical template, and
    NOTHING persists a job run today — no heartbeat table exists) · #27 per-ROW isolation inside the
    sweep loops (isolation is per-sweep today, so one bad address aborts the rest of that sweep's
    accounts) · #37/#38 persist the pagination cursor for the backup reconcile + orphan sweep (both are
    function-local `let`s, so both restart at bucket head every run and nothing past the per-run cap is
    ever examined) · #39 POST id batches (supabase-js renders `.in()` into the URL; several sites can
    reach ~1000-2000 UUIDs) · #22 scrub Sentry (guest capability tokens ride the URL PATH, and
    `beforeSend` is error-events-only, so breadcrumbs/transactions/`extra` bypass the current scrubber)
    · #19 limiter failures are SILENT (fail-open is BY DESIGN — the token/session is the real gate,
    documented in `src/lib/security/abuse-rate-limit.ts` — but a limiter error today produces no
    Sentry/`captureError` signal, so a silently-dead limiter looks identical to a healthy one; add the
    observability, in both the abuse store and the unlock limiter) · a venue-NAT-aware per-IP limiter
    for `create_guest`/`create_report` (a naive per-IP cap blocks legit venue crowds; reuse the unlock
    limiter's count-failures design)
    · quick wins: hoist `assertResendEnv` ABOVE the `sent_emails` claim (a throw currently leaves the
    claim row, permanently suppressing that dedupeKey), #42 security headers (`poweredByHeader` is still
    on), a `STYLE_IDS.every(engineSupports)` catalog↔engine parity assertion.
  - **Infrastructure debt:** #46 CI (typecheck/lint/test/build on push — the 2026-07 Actions-minutes
    blocker is over: the daily DB-backup Action has been running green since the August reset, so
    minutes exist; validate a CI workflow now) · #45 recover the two live-only columns into a migration
    file (committed migrations can no longer rebuild the schema) · #44 preservation-prefix backup truth ·
    #47 teardown residue + stale doc claims.
  - **Carried-forward live verification:** #11 the >90-min presign-roll soak + #12 upload retry (fixed
    in code at milestone-1.5, never verified live; the two soak traps are in
    [`systems/testing-verification.md`](systems/testing-verification.md)). · **Follow-ons the `ops-hardening` track logged (2026-09-02):** a report-only CSP, then an enforced
  one (a per-request nonce through the streaming render plus an inventory of every inline style; its own
  project) · `X-Frame-Options` / CSP `frame-ancestors`, a one-line add once the CSP question is settled ·
  Session Replay records DOM snapshots and an `href` in them can still carry `/e/<qr_token>` (the replay
  scrub covers custom frames only; walking every snapshot node is more than it buys) · a dedicated
  `JOB_API_SECRET` instead of reusing `PRUNE_API_SECRET` as the internal-jobs bearer (cleaner naming; three
  homes plus a Worker secret plus a GitHub secret is why it was not done). · **From the `account-deletion` track (2026-09-02):** sweep the app routes for the JSX landmine it found
  on `/privacy` (a text node that contains an HTML entity loses its own leading space, so a bolded lead-in
  glues to the next word; the prerendered surface is clean as of `26341a7`, the dynamic app routes were not
  scanned, and no lint or test catches it) · a `deletion_requested_by` column so an operator-triggered
  deletion is distinguishable from a self-serve one after the fact.
- **Notification system** — the announcements overhaul · new bell signals (link-activity "new since last
  seen" deltas; billing `past_due` alerts, needs a denormalized flag on `profiles`) · a durable per-item
  feed + real-time push · per-item announcement un-read toggling · **the reel-published guest send** (R3
  ruled NO email until R5 and shipped only the seam: `setReelGuestVisibleAction` is the single publish
  hook — audience/transport design lands here, and late joiners see the card meanwhile, no catch-up mail).
  Build the foundational features first so
  we know what needs notifying. Extension point: [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).
- **Admin / operations portal** — **P8 backend-ops & observability (the priority piece):** every backend
  job (the cron sweeps, the media-backup Worker + DLQ, the **weekly backup prune**, the DB backup)
  manageable + health-surfaced in `/admin` with zero silent failures (a missing nightly backup pages,
  never passes quietly). The prune currently ships **alert-only** (breaker trips page via Sentry + a
  deduped email); a job-runs heartbeat that ALSO catches "a job silently stopped running" lands here.
  (At very large scale, the prune+reconcile per-run bucket scans can move to a merge-join / deletion
  tombstone / shared copy-state index — see [`systems/durability-backups.md`](systems/durability-backups.md).)
  Also: an operator-action audit log · per-announcement edit + read receipts · live-Stripe subscription
  health on the account detail. See [`systems/admin-observability.md`](systems/admin-observability.md). **The MFA enrolment secret** (`src/components/admin/mfa-enroll.tsx:122`) is a bare `<code>`, so preflight still sets it in a mono stack (kill-mono, 2026-09-14; outside that lane): `font-sans`, or the muted plate the other admin codes took.
- **Vercel / Next.js optimization** — ~~the 12s guest-gallery poll~~ SHIPPED Phase 3 (doorbell +
  ETag/304 + stable presigns → [`systems/guest-flow.md`](systems/guest-flow.md)) · **dashboard
  Suspense streaming DEFERRED post-launch** (P5 S1, three live strandings: completions die inside
  radix TabsContent regardless of child shape, and even outside-radix boundaries displayed but
  never client-hydrated on this page while the guest page's identical shape works; revisit in the
  PPR/cacheComponents era - the permanent `/design/lab/tools/stream-probe` + the blocking page + loading.tsx
  are the baseline) · front Vercel
  with Cloudflare at launch (DNS already migrating there) · Vercel Spend-Management hard cap + alerts ·
  revisit the `proxy.ts` per-request `getUser` matcher scope · a large-gallery presigned-read strategy
  (per-media proxy/pagination beyond the Phase-3 stable buckets) · Realtime concurrent-connection quota
  (one socket per open guest tab) at launch scale · `cacheComponents`/"use cache" adoption post-launch
  (deferral rationale → [`systems/architecture.md`](systems/architecture.md)) · the **`(app)` dashboard
  first-load latency** (~1-3s to hydrate, observed 2026-06-09 — the layout fans out `getUser` +
  notifications + profile + avatar, then the page adds events + storage; Phase 5 streams/parallelizes
  the chain; Phase 3 added the interim `loading.tsx` skeletons).
- **Emails** — a transactional-email automation system + the guest "email me the album" auto-send (reuses
  `sendOnce`). See [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md).
- **The support-automation arc** — AI-default first responses keyed on `contact_submissions.topic` (the
  structured intake shipped 2026-08-28; the neutralized copy already permits automation) + auto-routing
  rules in `/admin/support`; published language must keep committing to outcomes only (the
  promise-neutralization doctrine, [`systems/marketing-content.md`](systems/marketing-content.md)).
- **The AI-SEO content arc** (its own round; the llms layer shipped at milestone-4) — the blog half
  SHIPPED in the library round (2026-09: 23 posts, question-shaped `faq` blocks + FAQPage on hubs
  and comparisons, incumbents named and rivals category-level per Will's 2026-08-28 ruling; category
  pages stay brand-nameless); still open: `.md` mirrors of key pages (the llms spec's optional convention) · the
  `/u/[slug]` sitemap/robots decision (profiles-social.md says indexable; needs a slug feed) · WebSite
  SearchAction (needs a real `?q=` route) · AI-referral analytics (UA-tagged hits on /llms.txt).
- **Billing follow-ons** — pricing **grandfathering** when the first price change happens (the policy is
  ruled + recorded in [`PRICING.md`](PRICING.md) "Grandfathering"; the build is `planForPriceId` mapping
  MULTIPLE historical Price IDs per plan, newest = the public offer) · a full [`PRD.md`](PRD.md) refresh
  to the shipped product (this consolidation pass fixed only the misleading era claims) · **per-pass dashboard management**
  (choose WHICH stacked pass a renewal extends, per-pass expiry rows in the storage meter; v1 renews the
  soonest-expiring, billing-caps.md) · the `authenticated` role holds a latent table-level **TRUNCATE grant on
  `profiles`** (unreachable via PostgREST, found 2026-08-27; sweep table grants and revoke in the next
  security pass).
- **Share studio (QR + share-content configurator)** — (Will, 2026-06-11, from the V1 design lab's QR-card
  round) an in-app generator for polished share outputs so hosts never build their own: card presets
  (minimal-ink + photo-backed won the lab round), per-common-event-type curated stock cover images +
  generic sets (hosts rarely have a cover BEFORE the event), toggles for link/date/cover, mobile/story
  vs printable formats, multiple file types, drag-and-drop element placement as the stretch goal. Doubles
  as a growth lever (every output carries the QR) and keeps hosts on-site. Slots into the V1 program
  around Phases 5-6; needs its own planning round. **Foundation shipped:** the QR DESIGNER ("Customize",
  preset styles) now lives prominently in the event-page Share dialog (3b, 2026-06-21) — deliberately a fun,
  core, growth-loop feature, NOT tucked into settings; the share studio is its evolution into a full
  share-OUTPUT configurator (cards, covers, formats) on top of that QR styling.
- **Highlight reel — SHIPPED end-to-end through milestone-2** (curation + the canvas engine + the
  14-style catalog + Studio + guest surfacing/download; current truth
  [`systems/host-app.md`](systems/host-app.md) + [`systems/guest-flow.md`](systems/guest-flow.md);
  settled scope in [`systems/host-app.md`](systems/host-app.md), the reel section, guest-flow.md/0024). **Deferred follow-ons:**
  Pro motion video (real video playing in the live player + trim; R2 CORS work) · multiple named
  reels · the reveal-moment polish · dropping the legacy `highlight_reels.theme` column (the R8
  destructive batch) · concise per-knob motion-tuner descriptions · the short-feed scroll-spy
  hand-off tune (with Will) · a future auto-scoring "best clips" worker (`highlight_score` /
  `reel_eligible` stay dead scaffold for it).
- **User profiles + social discovery — P1-P3 LIVE since milestone-2** (`/u/[slug]` profiles, the
  follow/block graph, the Guests feed section + guest list, the dashboard Following chip; the
  consent/privacy one-way-door is RULED in [`systems/profiles-social.md`](systems/profiles-social.md),
  do not re-litigate; current truth [`systems/profiles-social.md`](systems/profiles-social.md)).
  **Still ahead:** P4 (v2) the social feed (DEPENDS on the Notification overhaul above) + discovery ·
  the notification-prefs UI (R5 owns sends; storage + defaults shipped) · guest-list
  sort-by-upload-count (the contribution-encouragement idea, Will 2026-06-21). NOT launch-gating.

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

**The clean launch point** (ruled 2026-09-02, with no date: "launch when everything's done"): every
published claim is true, every promised path exists, every backend job is operable from `/admin`, and
the switches below flip in a known order with nothing else pending. The agent-doable half runs as
tracks ([`tracks/`](tracks); the wave plan in [`STATUS.md`](STATUS.md)): the help catalog's nine gaps
closed or ruled, the EXIF claim corrected on its seven sites, the guest unfurl and 404 true for
account-required events, self-serve account deletion with an operator trigger, a newsletter removal
control, the contact and careers limiters failing closed, security headers on, Sentry scrubbing
capability tokens, every job with a kill switch and a heartbeat on `/admin/jobs`, CI on every push,
`.env.example` parity, legal pages that print, the `LEGAL_PARTY` flip rehearsed, the blur-rise heroes
with a visible h1, the root 404 tint, the marketing site at phone widths, the demo event on curated
media. **The `[human]` switches, in order:** counsel sign-off, the DMCA agent, the `privacy@` and
`help@` mailboxes → `LEGAL_PARTY` and both documents effective → Stripe live (the 4 products and 8
prices, the live webhook and portal with six-price switching verified, the 10 env values, one
real-card smoke) → Vercel Pro (the analytics vendor, the Spend cap, Cloudflare fronting and CSAM
scanning at the DNS move, the Realtime quota) → secrets Sensitive, leaked-password protection, the
Sentry alert rule, one DB-backup test-restore → the test-data reset, the demo token repointed,
`PRUNE_MODE=live` → the program teardown.

- Enable leaked-password protection (HaveIBeenPwned) `[human]` — no longer Pro-gated (checked 2026-09-02),
  so it can flip any time; the long-standing advisor WARN.
- Pick the web-analytics vendor at the Vercel Hobby → Pro cutover `[eng+human]` — Hobby collects free
  (pageviews only, hard caps); Pro activates the wired custom-event taxonomy but bills usage. Will's
  pricing research (2026-08-28): PostHog gives 1M events/mo free (likely covering launch traffic
  entirely), then $0.00005/event ($50/M) vs Vercel's ~$30/M; past ~15M events/mo PostHog's volume
  tiers ($0.0000295/event) undercut Vercel. So the call is cost vs features (PostHog adds funnels +
  session replay, strongest once the app opens) with observed marketing traffic in hand; other
  candidates: Cloudflare WA (free, shallow) / self-host Umami / GA4 (free, consent banner + ad-block
  losses; the move if Google Ads enter). The swap is one file (`src/lib/analytics/web.ts`); see
  [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).
- Counsel sign-off gate (trust-safety-forensics.md D2) `[human]` — before launch counsel signs: (1) the privacy-policy +
  ToS forensic-capture disclosure language (IP/UA/geo/device UUID per upload), (2) the CSAM incident
  runbook ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)) + NCMEC registration,
  (3) the retention schedule (media-lifetime rows, 1-year preservation), (4) the pre-strip EXIF capture
  go/no-go. The 8-item checklist is in the T1 options-doc (`git show 44090827:docs/decisions/t1-forensic-csam-policy.md`).
- NCMEC CyberTipline ESP registration `[human]` — register before launch (prep note in
  [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)); if denied, we still report actively.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]` — free; scans only proxied traffic
  (cannot see presigned R2 media — state that plainly), per trust-safety-forensics.md C2.
- Stripe test → live cutover `[eng+human]` — re-create the 4 products and 8 prices in live (three Pro
  products carrying six recurring prices, monthly and annual each; the Event Pass product carrying the two
  one-time prices), named WITHOUT the em-dash the test products carry today (those names render in
  Checkout and the portal), + swap the 10 env values (code unchanged); the runbook is
  [`PRICING.md`](PRICING.md) "Stripe setup" (corrected 2026-09-02 by the `legal-billing-truth` track).
- Verify the Stripe Billing Portal permits switching between the six Pro prices (monthly and annual) `[human]` — now
  LOAD-BEARING, not cosmetic: per host-app.md 1b a Pro host changing storage size is routed to the
  portal (checkout refuses the second subscription it used to create silently). If the portal's
  product config does not allow the swap, a paying host has no self-serve way to resize. The default
  portal configuration (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`) enables `subscription_update` with
  `default_allowed_updates: ["price"]` and `proration_behavior: always_invoice`, but the API returns no
  `products` list, so the actual switch set is unverified from the API side (2026-09-02): a dashboard look,
  or a portal session opened as a Pro host.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (currently 3× the storage cap, billing-caps.md) before
  Pro launch `[eng]` — confirm the multiplier holds at real scale.
- Legal go-live `[human]` — the documents are written (v1.0, 2026-09-01, incl. the forensic-capture
  paragraph and the Sentry replay line); after counsel signs the gate above: (1) fill `LEGAL_PARTY` in
  [`src/lib/constants/legal.ts`](../src/lib/constants/legal.ts) (entity, state, address, DMCA agent)
  and flip both documents' `status` to `effective` with an `effectiveDate` (`legal.test.ts` refuses a
  bracketed placeholder once effective, so the fill cannot be skipped; the 2026-09-02 rehearsal showed the
  flip also needs one line of that test, whose pending status-line assertion reads the live meta: the diff is
  in `docs/tracks/legal-billing-truth.md` until the milestone prunes it, then in git); (2) register the DMCA
  designated agent with the Copyright Office ($6, renewed every 3 years) so the Terms' safe-harbor
  section is true; (3) create the `privacy@partyreel.com` mailbox both documents name, routed to the
  support inbox.
- Swap the demo event to curated media `[eng+content]` — repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated
  event with catchy approved media.
- Committed automated RPC integration suite `[eng]` — replace the per-change rolled-back MCP checks. BLOCKED
  on a direct pg connection: it needs `SUPABASE_DB_URL` (the SESSION string on port 5432, never the 6543
  transaction pooler) in the three secret places, a `postgres` devDependency, and a third vitest project
  with a distinct include that skips cleanly when the var is unset, so `pnpm test` stays green for agents
  without it; every test runs BEGIN, exercises the RPC under `set local role`, asserts, ROLLBACKs, then
  re-asserts row counts. The fully isolated alternative is the Supabase CLI plus the Docker local stack,
  pre-wired in `supabase/config.toml` (db 54322): pick it only if production-DB test traffic ever becomes
  uncomfortable. Full detail: `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
- Confirm the Sentry email-alert rule fires `[human]`.
- Pre-launch test-data hard reset ("Recovery Phase 6") `[eng]` — the deletion-aware prune has shipped (in
  dry-run), so the "reset ≥35 d before launch so test objects age out of the Bucket Lock" timing
  constraint is gone.
- Flip the backup prune to live `[human]` — set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` +
  redeploy once the primary is populated (it ships in dry-run, deleting nothing). Also set the shared
  `PRUNE_API_SECRET` (Vercel + `wrangler secret put`). See [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]` — the elevation program runs on the `launch-prep`
  integration branch (see [`../CLAUDE.md`](../CLAUDE.md) Git); when the program ends, decide the standing
  post-program workflow (straight-to-main speed vs branches/PR previews once real users arrive).
- **Elevation-program teardown** `[eng]` — when the program's final milestone merges: re-enable Vercel SSO
  deployment protection (`ssoProtection: all_except_custom_domains`), delete the temporary Stripe TEST
  webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint, recreated in the
  2026-08-05 P3 migration — it must NOT survive into the live-mode cutover), remove the preview origin from
  the R2 `partyreel` bucket CORS + the Supabase auth redirect allow-list, remove the 3 branch-scoped
  Vercel env vars (`NEXT_PUBLIC_SITE_URL`/`STRIPE_WEBHOOK_SECRET`/`DESIGN_PREVIEW_KEY` @launch-prep),
  delete the `launch-prep` branch +
  `lp/*` remnants, decide the post-program fate of the `lp/*` build gate (`vercel.json`
  `ignoreCommand` → [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs), part of
  the "revisit the git workflow" item above), and revert CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account (console) `[human]` — the Lambda render path was torn down 2026-07-08
  (canvas + on-device client-encode is the only reel path now); the sub-account under `partyr33l@gmail.com`
  (the `remotion-lambda-role`/`remotion-user` IAM + the deployed Remotion site/function) has no remaining use.
- Toggle critical secrets to Vercel "Sensitive" `[human]` — pre-launch all env vars are non-sensitive (so
  values stay swappable); at launch flip the critical ones (the Supabase service-role key, Stripe + webhook,
  `CRON_SECRET`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`) to Sensitive.
- Self-serve account deletion with its operator path `[eng]` — gating; the `account-deletion` track
  ([`tracks/account-deletion.md`](tracks/account-deletion.md)).
- The four QA items that are launch truth, cross-listed from the QA bucket `[eng]` — #42 security
  headers, #22 Sentry scrubbing capability tokens, #19 limiter observability plus the contact and careers
  limiters failing closed (the `ops-hardening` track), and the guest unfurl and 404 true for
  account-required events (the `product-truth` track).
- CI on every push `[eng]` — the `ci-workflow` track; a program prerequisite for the wider fan-out.
- The blur-rise heroes' foreground LCP read (the h1 at `opacity: 0` until hydration; the "Now" item)
  `[eng]` — the `marketing-followons` track, as a named entrance register with the h1 visible at paint.
- Cloudflare fronting at the DNS move and the Realtime concurrent-connection quota `[human]` —
  cross-listed from the Vercel / Next.js bucket so they are not forgotten at the cutover.
- One DB-backup test-restore `[human]` — prove the backup restores before it is the only copy.
- The `help@partyreel.com` mailbox `[human]` — the help center and the documents name it; confirm the
  receipt path once it exists.
- `.env.example` parity with `env.ts`, pinned by a test `[eng]` — the `legal-billing-truth` track.
- The marketing site tuned at phone widths, judged on Will's phone `[eng+human]` — gating; the
  `marketing-mobile` track.
- A per-account throttle on the deletion request `[eng]` — beyond Supabase Auth's own OTP limits it is
  unlimited; it needs a live session plus a password or an emailed code, so the exposure is a borrowed
  session rather than a stranger, but the throttle is cheap insurance (the `account-deletion` track's note).
- Submit the apex to the HSTS preload list `[human]` — a one-way door for the domain and every future
  subdomain (`max-age` already meets the list's requirement; the header ships without `preload` on purpose).
- `SUPABASE_DB_URL` into `.env.local` `[human, 15 minutes]` — unblocks the committed RPC integration
  suite above.

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
