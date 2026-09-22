---
track: roadmap-lean
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/ROADMAP.md
  - docs/ASSETS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/
  - src/app/
  - CLAUDE.md
---

# lp/roadmap-lean

**Goal.** Rewrite the ROADMAP and the asset requests as current, open work only: one line per task, no provenance, nothing done or moot.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: `docs/ROADMAP.md` (about 98 KB) and `docs/ASSETS.md`, current open work only.

1. ROADMAP: one line per task, present tense, under the existing bucket headings (keep `## Now` exactly: `usher/kit/record.py` writes under it; keep any heading a test reads, and run `pnpm test`); no provenance ("From `x` (2026-09-19, the lab):"), no "SHIPPED" narratives, no history; merge duplicates; drop tasks already done (check the code) and tasks the identity and reel rounds made moot. The reel round replaces the host-made, stored reel: the Studio, the mp4 export with its upload and download routes, publish and the reel-published send, reel curation, "multiple named reels", the reveal polish and "no slideshow mode" are gone or become that round's own wiring; the identity round shipped the optional email, the claim and profiles that publish nothing until chosen. Harvest still-open seams from the old queue's maps (`git show 6fd4bbbd:docs/tracks/orchestrator.md`, the sections "The app round's map" and "The overnight round's maps"): a seam still open in today's code becomes one ROADMAP line.
2. A gotcha or current fact found in the ROADMAP is not a task: list it in your Handoff under "For other homes" (the systems doc it belongs in), verbatim-ready.
3. ASSETS: the requests Will still has open (requested or parked), one row each; delivered and withdrawn rows go; no history in the columns.

HANDOFF EXTRAS: ROADMAP lines and bytes before and after; every task dropped as done or moot, one line each (what and why).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` and `pnpm lint`, each on its own exit code (docs-only: say so and skip the build).

## Questions (a recommended answer each; the Orchestrator relays them)

- none: every call took the brief's recommended answer and is listed under "Calls his to overrule".

## System-doc edits (in place, owned facts only)

- none (the facts found in the ROADMAP are under "For other homes" below, for their owners).

## Deferred (ROADMAP one-liners, bucket named)

- none: the ROADMAP is this lane's deliverable.

## Handoff (replaces the chat report)

- Work commit `0fe73905` (the ROADMAP and ASSETS rewrite); synced with `launch-prep` at `e5a86159` by the merge
  `ee77ed93` (pointer-sweep, the working-guidelines rules, the recheck lanes' manifests; no owned path touched, no
  conflict). Both pushed to `origin/lp/roadmap-lean`.
- Gates on the synced tree (`ee77ed93`), each on its own exit code: `pnpm test` exit 0 (350 files, 3,879 passed, 1
  skipped); `pnpm lint` exit 0 (0 errors, 9 warnings, none in a file this lane touched). Docs-only lane: the build is
  skipped, per the manifest's "Verify on". Logs in the lane's scratch directory (`test-synced.log`, `lint-synced.log`).
- `usher/kit/record.py` dry-run on a scratch copy of the new ROADMAP (the synced record.py): a `roadmap` line lands at
  the head of `## Now`, above the first task, and a `retire_roadmap` substring matched exactly one line; exit 0. No test
  reads a ROADMAP or ASSETS heading (`git grep` over `src/`, `scripts/`, `usher/`); `## Now`, the three overhaul and
  launch headings, the "The lab and the kit:" label (`docs/PROGRAM.md` names it) and the "Admin / operations portal"
  bucket name (`src/lib/observability/sentry.ts` names it) are kept exactly.
- Lane check, `git diff --name-only origin/launch-prep...HEAD` at the handoff commit:
  ```
  docs/ASSETS.md
  docs/ROADMAP.md
  docs/tracks/roadmap-lean.md
  ```
- HANDOFF EXTRAS, the sizes: ROADMAP 469 lines, 98,764 bytes before; 299 lines, 48,668 bytes after. Task lines 234 to
  247: the old lines bundled up to nine tasks each (the QA queue, the overnight findings) and each task now has its own
  line, while the bytes halved. ASSETS 57 lines, 16,565 bytes, 26 rows before; 42 lines, 8,692 bytes, 15 rows after.
- The items:
  - `docs/ROADMAP.md`: every line re-read against the tree (a `git grep` or a read per claim); what stays is open, in
    the present tense, with at most a one-line why; provenance, dates, round narratives and retired boards' stories are
    gone; duplicates merged (the help-sync lines by theme, the Sheet and iOS checks into one real-device pass, the
    brand pass with `markOnly` and the press kit, the share studio with the QR designs gallery, the posters and the
    invite, the Emails bucket with the guest's one-shot mail and the dormant switches, the launch analytics pick with
    `(app)`'s inert `trackAttrs`, `SUPABASE_DB_URL` into the RPC suite); the still-open seams of the old maps
    (`git show 6fd4bbbd:docs/tracks/orchestrator.md`) harvested as new lines: the four empty-state components, the
    dead `event-feed.tsx`, `event-feed-action-bar.tsx`, `trash-section.tsx`, `shared-band.tsx` and
    `sandbox/home-hero/shared.tsx`, the routes without `loading.tsx`, the export cap's copy.
  - `docs/ASSETS.md`: the open rows only, each re-read against its slot in the code (every slot exists); the `asked
    by` and `where` columns gone (provenance; delivery rides the inbox folder `<row>/`); row numbers unchanged (code
    and boards cite 1, 2, 19, 20, 21, 23 and more by number); row 2's slot re-pointed from the orphaned
    `sandbox/home-hero/shared.tsx` `FRAMES` to `STREAM_FRAMES` in `hero-stream.ts`; row 1's slot named where
    `hero-candidate-02` plays today; row 27 added (the twelve `MARKETING_IMAGES` the Higgsfield month replaces, which
    no open row named once 3, 6 and 7 left).
- Tasks dropped as DONE, one line each, what and why (the artifact that shows it):
  - The one identity-flows board: `identity-profile`, `identity-claims` and `identity-door` are on the desk; the door board asks the "Remove your email" row.
  - `next-step-band.tsx`'s real collapse: the fold ships (`busy=collapsed` in the component).
  - `PasskeysCard` on the account page: mounted (`account/page.tsx`), dark until `NEXT_PUBLIC_PASSKEYS=1` (the enable is a launch line).
  - `host-app.md`'s "three chips" sentence: gone.
  - `MasonryColumns`' explicit column assignment for the ruled one-column growth: ships (`shared/masonry.tsx`, EXPLICIT COLUMNS).
  - A component pin for `LiveGallery`'s own-photograph wiring: `live-gallery.test.tsx` (the Showing gate, `renameMine`, the drift guard).
  - The Privacy and Terms lines on an anonymous uploader: both state the current identity model.
  - The rose `--like` mark failing over a bright photograph: `like-button.tsx` wears `glass-mark-lit`.
  - The review queue's `grid-cols-3` at 375: no fixed column count in `event-feed/`.
  - The settings' Deleted card invisible until something is in it: the bin moved into the album as the Deleted lens.
  - `DemoTicket`'s dead `row` variant and contradicting comment: both variants have callers (the Library, the site-chrome sandbox) and the comment is true.
  - The approval toast covering the Add pill: the toast is gone (the waiting tile).
  - The QR swatches under the 3 px module floor: the picker's swatches size to their cell; the product's plates run 240 to 360 px.
  - The Save and Likes prompts without a Terms line: `AccountDoor` carries it.
  - `login-form.tsx`'s hand-drawn Google G: `/login` mounts `AccountDoor`.
  - A guard for a specimen `collect-specimens.mjs` cannot read: `specimens.test.ts` fails an unread entry.
  - The guest album's column-major reading order: the explicit-column engine replaced CSS columns.
  - The backdrop's served width and pool: about 1200 px, six frames (`room-frames.ts`, ASSETS row 20).
  - The backdrop's phone scroll rule: `backdrop-engine.ts` reads the section's own progress.
  - `how-partyreel-works.mdx`'s five steps: it walks the six.
  - `type-phone`'s three type calls as a board: ruled into the ladder; the board retired.
  - The throw and the halo without a production call site: the throw lights the events pages' `SectionLight` rooms, the halo the album page's live album.
  - The album page's wrong light under its demo: the album wiring moved it to the halo.
  - `glass` round two, the one material: wired (Crystal).
  - The dialog title's `leading-none`: kept on purpose, its reason written in `ui/dialog.tsx`.
  - `river-visual` pointing `river-card` at `shared/river` and deleting its sandbox: both boards retired, `shared/river` ships.
  - `FitStage`'s `swapKey` reporting a small box: the measured node sits above the keyed one (`stage.tsx`).
  - Body and label sizes onto the ladder: `body-type` wired and retired.
  - `lab:smoke` failing the legacy `/design/boom`: the redirect's landing takes the probe's 200 or 500 (`scripts/lab-smoke.mjs`).
  - `board-state.tsx`'s `history.replaceState(null, …)`: gone from the kit.
  - The board's Reload frames unreachable from a step: the board's tools ride the stage head (`step.test.tsx`).
  - `evidence(section, state)` not told tile or stage: it takes `at` (`board-page.tsx`).
  - The fourth copy of the true-size box: one `lab/true-fit.tsx`.
  - The dock's knobs overflowing a 375 dock: rows wrap (`dock.tsx`).
  - `EventCard`'s hand-rolled name size: `text-subsection`.
  - `ui/dropdown-menu.tsx`'s `SubContent` without a `Portal`: portalled.
  - The rounding board's `usePanelAwareWidth`: gone.
  - Trim every board to `LIMITS.readingWords`: `lab:smoke` fails a board over budget.
  - The two `SourceLink` copies: one in `_shell/ref.tsx`.
  - Linking the rules page's contract blocks to permalinks: the contracts left that page for their components' pages.
  - The `@supports not (mask-image)` fallback compiled away: measured, Lightning CSS keeps it (`globals.css`).
  - `effectiveAlpha` optimistic: documented as a ceiling (`glow-contrast.ts`).
  - A bloom's band snapping as it arms: the unarmed band rests (`globals.css`).
  - `useInViewOnce(0.35)` never arming a tall lamp: it takes a `viewportFraction`.
  - `BorderBeam` reading the OS scheme: the call site passes the theme (`pro-card-beam.tsx`).
  - Law 3's loader swap: `sampled-palette.ts` decodes `previewUrl` through `decodeImage`.
  - Self-serve account deletion with an operator trigger: `/account`'s delete card and `/admin/accounts/[id]`'s control.
  - The video-uploads string omitting the Event Pass: "Video uploads come with Pro and the Event Pass."
  - `?upgraded=1` never read: replaced by `WelcomeToPro`.
  - "Public" in settings against "Open" in the chip: one `VISIBILITY_LABELS`.
  - The missing-ETag error reaching a guest: the guest gets actionable copy, the operator detail goes to the console (`uploader.ts`).
  - `tiers.ts`'s comment citing a retired video limit: rewritten.
  - The open-event unfurl promising "no account": the description is "Photos and videos from the day. Add yours."
  - `lifecycle-recovery.md` against `listRecentlyDeletedMedia` on a guest's own removal: they agree (`removed_by_uploader`).
  - The floating layer's own reduced-motion gate: `floating-layer.ts` falls back to the standard clock.
  - The root 404's tint: `not-found.tsx` pins the light tint.
  - A unified per-upload limit and per-event `max_upload_bytes` at presign: `media/limits.ts` and `api/r2/presign-upload/route.ts`.
  - The share surface's systems home: `host-app.md` holds the share sheet.
  - The six feature h1s wrapping to three lines: measured by the voice wiring; the album page's is the one left (kept as Will's call).
  - `SITE_DESCRIPTION` over 160 characters: `SITE_DESCRIPTION_LINE`.
  - A help-sync after the home and hub wirings: `help-sync` merged after both.
  - The Reel Studio's missing `loading.tsx`: `reel/loading.tsx` exists (and the Studio goes in the reel wiring).
  - QA #14, the contact and careers limiters failing closed: `public-form-limit.ts`.
  - QA #22, Sentry scrubbing capability tokens: `telemetry-redaction.ts` on every event type, plus breadcrumbs.
  - QA #19, silent limiter failures: fail-open raises `captureWarning` and counts (`abuse-rate-limit-store.ts`, `unlock-rate-limit-store.ts`).
  - A venue-NAT-aware limiter for `create_guest` and `create_report`: the `join` and `report` kinds bound per IP and event with a breadth cap.
  - Hoisting `assertResendEnv` above the `sent_emails` claim: it runs first (`email/send.ts`).
  - QA #42, security headers: `next.config.ts` (`poweredByHeader: false`, HSTS, nosniff, Referrer and Permissions policies).
  - The `STYLE_IDS.every(engineSupports)` parity: `reel/engine/registry.test.ts`.
  - QA #46, CI: `.github/workflows/ci.yml`.
  - The P8 job heartbeat: `/admin/jobs` catalogs every job with its switch and a missed-run rule.
  - The admin home's card grid against its nav: the admin wiring's rail and home replaced both.
  - Four destructive grammars in the admin: one destructive sheet.
  - The notification-prefs UI: the account page's form.
  - Launch, CI on every push: `main` and `launch-prep` code pushes run it (an `lp/*` push on `[ci]`, by design).
  - Launch, `.env.example` parity: `env-example-parity.test.ts`.
  - Launch, the blur-rise heroes' h1: `PageHero`'s LCP rule keeps the h1 out of the reveal.
  - Launch, the guest unfurl and 404 for account-required events: true (above).
  - Launch, a newsletter removal control: `/account`'s switch removes the list row.
- Tasks dropped as MOOT, one line each:
  - The per-type highlight render idea: the reel round deletes it (its plan's sweep).
  - The Studio's `.dark` room, `reel-builder.tsx`'s and `style-rail.tsx`'s 6 px corners, the Studio's door to the reel guides: the Studio dies in the reel wiring.
  - The `lp/publish-bloom` publish moment and the reel-published guest send: a live reel has nothing to publish.
  - Per-vertical reels in the media batch: the per-type render is gone.
  - QA #45, two live-only columns: they are `highlight_reels.style_id`/`orientation`, dropped with the table by the reel round's drop migration.
  - The `guest-verify` board's `call:numbers` swap: the board retired (the configured limits go to "For other homes").
  - `overtaken-2`'s first-event badges: `first-event` retired.
  - The `pricing-page` phone step's broken demo: the board retired.
  - `sandbox/album-hero/hero.tsx`'s forced-h-11 CTA: the board is gone.
  - `app-door.surfaces`' rename: the board retired.
  - The catalog kit's items (`toSteps` walking a catalog first, `CatalogSpec.strip`, the catalog boards' `reading.why` budgets, the catalog template's chrome): no catalog board stands (23 boards, all `defineExploration`).
  - `Loupe`'s `CornerInset` and a kit `useArmed`: the light board retired (`CornerInset` lives in the Library's bright-edge page).
  - The `[data-lit]` specimen rule: the light board retired; the bright edge is a shipped utility.
  - The composition pass over the review wave's six boards: all six retired into wirings.
  - `src/components/admin/` owned by no manifest: the admin board wired and retired.
  - The `/design` gate captured at build on an `lp/*` alias: no push builds an `lp/*` deployment.
  - Backfilling the contact-identity ruling into `rulings.md`: the log retires in `docs-rules`.
  - The blog's cover pool "unlicensed": an image we use is one we hold the rights to; the Higgsfield month replaces the pool (ASSETS row 27).
- Tasks dropped as carried by a standing board's ask (duplicates of the desk):
  - The admin chart ramp's cast, one FAQ look, the home hero at 768 to 1023, the album page's three ambient pieces: `loose-ends` (`faq-accordion.tsx` records why `<details>` cannot ride `.mkt-acc`).
  - "Availability: Live now": `press-page`'s standing question.
  - `/contact` onto the cinema rhythm: `contact-page`.
  - Six surfaces disagreeing on what a viewer holds: `media-viewer`.
  - `/admin/reports`' count, bulk act and phone layout: `admin-triage`.
  - Per-step article screenshots: `help-center`'s `article` ask (the beacon stays as the `ArticleFeedback` line).
  - The "Watch your event highlights" video card: `reel-story` asks the reel teaser and the film's role.
- Lines dropped as not tasks (history, a standing ruling, or a call already made):
  - The app round's, the stacking round's and the overnight round's narratives; the lab-upgrade narrative; the admin and jobs rounds' narratives; the QA round's provenance.
  - The tile-size cookie against localStorage and the `glass-mark-lit` halo: calls his to overrule since 2026-09-20, not tasks.
  - Events then pricing as two card grids: a standing ruling.
  - `PageHero` owns only type: already in `design-system.md`.
  - The glow engine's born-spent bloom and tunable swell: "neither is needed today" (the line's own words).
  - `AlbumStream`'s frames prop: a cost note for the unpicked `hero-theme=arrival`.
  - The album heading stepping down if Will reads the demo and album as one section: a conditional written in `album.tsx`.
  - The backdrop plate's contrast numbers: stale (the pane runs `--bkd-brightness: 0.55` with a tint, and its comment says retune by measuring).
  - `rules.generated.json` regenerated at every record: the Orchestrator's merge step.
  - The overtaken map "empty" and its mechanism: stale (the map holds the reel round's badges); the Orchestrator's Next and `recheck-viewer-curation` retire it.
  - The spec docs' fold and their "asks" blocks: the `docs-rules` lane keeps or deletes each spec.
  - `design-system.md`'s em-dashes: `systems-trim`'s file, and docs are not user-facing copy.
  - QA #47, "teardown residue and stale doc claims": names no artifact (the Remotion residue is the launch line; stale doc claims are `systems-trim`'s).
  - The Session Replay `href` residue: ruled not worth walking every snapshot node.
  - The Cloudflare fronting and Realtime quota cross-list: the switch order and the Vercel bucket carry both.
  - ASSETS rows dropped: 6, 7, 8, 13, 17, 26 (withdrawn); 10 and 11 (superseded by 15 and 16); 18 (wired); 3 and 4 (parked for the gathering hero, which was not ruled in; nothing on the tree takes them); 9 (requested for the burst hero's portrait third; the stream shipped instead and row 12 is its portraits).
- For other homes (facts and gotchas found in the ROADMAP; verbatim-ready, each naming its home):
  - `docs/systems/auth-accounts.md`: Supabase Auth's configured rate limits (dashboard, Authentication > Rate Limits) are emails 100 an hour project-wide on the custom SMTP, OTP and magic-link verifications 150 per 5 minutes per IP, sign-ups and sign-ins 150 per 5 minutes per IP, token refreshes 150 per 5 minutes per IP, anonymous sign-ins 30 an hour per IP. A 150-guest Require-verified-emails door in one hour outruns the email limit; the door names the refusal and the switch is the host's live valve (raising it is a launch line).
  - `docs/systems/auth-accounts.md`: a Google-only host is never remembered on `/login`, because the device memory is written only where the address is known; the passkey is the answer.
  - `docs/systems/billing-caps.md`: Stripe Checkout's `consent_collection` stays off; the guest door and `/login` carry the Terms consent line.
  - `docs/systems/testing-verification.md`: ★ a `Page.captureScreenshot` with a `clip` makes Chrome recomposite at a new surface size and a backdrop-filter layer does not survive it (a clipped glass pane comes back black), so a harness that measures glass captures the viewport and crops in Node (`lab-demo.mjs` scrolls the box into the window and clips there); a HEADED Chrome capture can drop composited layers that headless keeps, so record captures are headless.
  - `docs/systems/testing-verification.md`: `MediaTile` carries `loading="lazy"`, and Blink resolves it against the TOP window even inside a same-origin iframe, so a tile used as chrome below the fold of a lab frame never loads.
  - `docs/systems/design-system.md`: nothing re-tunes `--lamp-1..5` on paper, so a media-less seam on a paper chapter would paint the dark register's five on a near-white page (latent: no production lamp sits on paper, and the fence keeps the field off light grounds).
  - `docs/systems/design-system.md`: the shimmer (the glow engine's sweep with its edge ring) is a delight moment, never a gallery arrival: a batch of a couple dozen uploads would cover the top of a gallery in shimmer.
  - `docs/systems/design-system.md` (or `marketing-content.md`): the backdrop's reading band (`READING_BAND`, `-45% 0px -45% 0px`, `shared/backdrop/photo-section.tsx`) is the site's first scroll-position readout; a second readout joins it in one place rather than defining its own.
  - `docs/design/guidance.md` (the lab's authoring notes; `docs-rules` owns it): stacking several chromes with `vh` minimums inside one `Frame` compounds against the frame's height (a `standalone` prop on the chrome is the pattern); and every board's spec is a literal `defineExploration({ ... })`, because `lab-review.mjs` scans for the literal.
  - `docs/systems/profiles-social.md` (for `systems-trim` to confirm at its merge): its `notification_prefs` paragraph says "an anonymous email-only guest receives nothing beyond the one-shot"; the guest is a typed name with an optional unconfirmed email. `database-security.md` and `uploads-and-r2.md` told the anonymous-guest model in places too (the ROADMAP line asked to true all three up to `require_verified_email` and the Unverified mark).
- For the Orchestrator at integration: return `docs/ROADMAP.md` and `docs/ASSETS.md` to `NEVER_OWNED` in
  `src/lib/track-manifests.test.ts`; a record JSON that retires an old ROADMAP line by substring will miss (every line
  was rewritten), so match against the new text (the `recheck-viewer-curation` lane names ROADMAP lines at its
  integration).
- Calls his to overrule, one line each:
  - A line whose whole content a standing board asks is dropped as a duplicate of the desk (the list above); a shipped defect that a board only shapes stays a line (the masonry dim, the export mint, the renewal link).
  - The Now head holds the cross-cutting lines (the record tool's inbox), and the three existing labels sort the rest; "The app:" lines carry a surface word (Host, Guest, Account, Profile, Admin, Exports, Media, Errors, UI, Routes) rather than new labels.
  - The overhaul buckets split their "·" lists into one sub-line per task.
  - Bundled findings split into one line per independent task, so the task-line count rose (234 to 247) while the bytes halved.
  - ASSETS rows 3, 4 and 9 dropped as slotless although their status was parked or requested; row 27 added so the twelve stills have an open row for the Higgsfield sweep.
  - The ASSETS `asked by` and `where` columns dropped; the delivery marker is the status and the inbox folder `<row>/`.
  - The catalog-era kit parts (`SpotCompare`, `CompareTwo`, `FrameRow`, `Loupe`, `TrueFit`) consolidated into one keep-or-retire line instead of three refinements with no consumer.
  - Map seams a standing board asks were not harvested (the mail button's colour, the mail wordmark, the operator templates, no unsubscribe or postal address; triage's report ids and undo; the export teaser's chip; the help palette's reach and the troubleshooting links), nor three I could not confirm from code (the host grid's two tile-action models, the personal feeds' gallery contract, the guest pages' two footers).
  - QA #44 reworded from its bare label to the concrete question (is the `preservation/` prefix backed up).
  - Runtime-only findings kept without a re-measure (the stage head at 375, the 482 px Tab cost, the profile overflow at 375, the hub header at 375, the next/image warning, the `/help/nope` title): the code under each has not changed since it was measured.
- Look at first: the ROADMAP's Now head (lines 15 to 36) and its "The app:" group (lines 113 to 172); ASSETS row 27 and the dropped slotless rows 3, 4 and 9.
