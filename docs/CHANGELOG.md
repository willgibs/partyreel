# Partyreel — Changelog (shipped history)

> ROLE: the shipped-history archive — what shipped, when, with what commit + verification. Read this for "when/how did X ship," NOT to learn how the system works today.
> BELONGS HERE: dated, per-initiative shipping + verification narratives. · NOT HERE: how the system works now (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)), current state (→ [`STATUS.md`](STATUS.md)), why-decisions (→ [`adr/`](adr)).
> GROWS BY: append (newest on top). This is the ONE deliberately append-only doc — it is kept OFF the orient path, so its length never muddies a fresh agent.

Dates are when the work was shipped + verified on partyreel.com (test data is disposable). Commits are
included where recorded; the full original prose lives in git history. The foundational build (Phases
0–4 + 6) is summarized at the bottom.

---

## 2026-06-11 — V1 program PHASE 3 COMPLETE: data & delivery architecture (the doorbell gallery)

Eight slices, each shipped green + live-verified; the blind 12s poll became the hybrid doorbell.
Commits `60e9848` (S1) · `4f0c200` (S2) · `7431758` (S3) · `238c554` (S4) · `9ed17ad` (S5) ·
`3aafa50` (S6) · `2322299` (S7) · the S8 docs/fix commit.

- **S1 stable presigns:** gallery read URLs are deterministic within 30-min signing buckets
  (`signingDate` pinned; 90-min TTL) — browser image cache works across refetches. Live-verified
  byte-identical URLs across polls.
- **S2 ETag/304:** the poll route fingerprints the viewer-visible gallery (content + access +
  teaserTotal + bucket id) and answers unchanged galleries with a bare 304 BEFORE presigning.
  Red-teamed the cross-access invariant: a teaser validator with full-access cookies 200s (and the
  reverse); no-ETag early returns; content-change invalidation.
- **S3 doorbell trigger:** `notify_gallery_change()` rings the PUBLIC channel `gallery:<qr_token>`
  on approved-set changes only; realtime.send failures can never fail a media write. 5-assertion
  rolled-back contract check; advisors unchanged. Field find: `realtime.send` no-ops SILENTLY until
  the Realtime service first activates (no day-partitions before the first client subscription).
- **S4 doorbell client:** public-channel subscription + a leading-edge coalescer (~2s suppression +
  jitter + trailing flush); poll drops to 60s while live, 12s when the socket is down. Verified with
  an in-page MutationObserver: **doorbell-to-render 1.05s on a DB approve** (only the ping path
  explains it at a 60s cadence).
- **S5 upload consolidation:** one pipeline engine (`upload/server-pipeline.ts`) + 4 thin strategy
  routes; the hardened RPC layer untouched (ADR-0016). 10 pre-refactor error-path curl fixtures
  re-run post-refactor: byte-identical. Live single-PUT upload through the new pipeline (join →
  presign → R2 PUT → complete `approved`) rendered in the open live tab in **<1s**.
- **S6 streaming scaffold:** the guest RSC passes the gallery as a PROMISE; the shell streams first
  (curl-verified order: shell ~4KB → skeleton ~14KB → tiles ~85KB); `LiveGallery` owns the moved
  machinery via React 19 `use()` + `key={access}`; dashboard + event-detail get `loading.tsx`.
- **S7 code splits:** lazy lightbox (mount latch + pointerover preload, 4 call sites; the component
  file untouched so the pins import it directly), React.lazy EntryModal (forwardRef), lazy admin
  recharts.
- **S8:** revalidation map + slug/password trims, the cacheComponents deferral rationale, the perf
  after-column (steady-state poll 200/74.6KB/120-presigns/12s → **304/0B/0-presigns/60s**, p50
  509→331ms; guest DCL 776→496ms, load 1055→703ms; wire JS 567→561KB with the heavy chunks now
  interaction-deferred), and these records.
- **Phase-close adversarial review** (10 agents over the full diff): 1 confirmed finding (the
  loading.tsx files nested a second `<main>` with wrong geometry — fixed same-day), 4 refuted
  (notably: forged doorbell pings by token holders only induce cheap coalesced 304 polls — the
  capability model holds).
- 410 tests green throughout (the 47 behavior pins survived the LiveGallery extraction untouched).

## 2026-06-11 — V1 program PHASE 2 COMPLETE: the V1 system live (foundation + safety nets)

Five slices, each shipped green + live-verified; the Phase 1 spec became production reality.
Commits `329aa82` (S1) · `39089de` (S2+S3) · `adc3f0c` (S4) · `f0c24b1` (probe).

- **S1 - behavior pins:** vitest split into unit (node) + component (jsdom) projects; 47 pins
  freeze MediaLightbox (20: gesture lock, edge damp, commit/springback timing via a synthetic-clock
  shift + DOMMatrix polyfill), GuestUpload (11: one-at-a-time queue, JIT join, demo, retry) and
  LikesProvider (16: seed/replay/optimistic/revert) ahead of the Phase 4-5 decomposition. Pins
  assert behavior only - the visual flip didn't touch them. (jsdom can't drive the lightbox
  pause-on-navigate effect; that pin was dropped, covered by live device passes.)
- **S2 - token transplant + type flip:** globals.css rewritten to the mono system (paper/night,
  brand→ink alias collapsed all 88 brand usages, state colors, the rounding system, the elevation
  contract, three motion curves, `font-heading` as the five-knob @utility, sidebar tokens removed);
  Instrument Serif self-hosted via next/font; `BRAND_HEX` → ink (all 4 OG cards re-verified
  legible); icon.svg ink; the one focus-state brand usage → ring tokens; QR coral corners
  intentionally retained (scanner-safe).
- **S3 - primitive craft:** button press-scale on `--ease-emphasis` + radius-rides-height; floating
  panels → `rounded-float` + `shadow-float` (zero shadows in dark - the contract); exits-faster
  durations proven composing with tw-animate; switch/progress strong curves; skeleton shimmer;
  empty-state quiet variant; play-badge → gallery tokens; the global 0.01ms reduced-motion guard.
- **S4 - error taxonomy + boundaries:** `src/lib/errors/` (34-code superset, total fallback-copy
  map, compiler-enforced subtype assertions over every result union); `error.tsx` in all 5 route
  groups via the shared `RouteError` (never renders `error.message`) + dependency-free
  `global-error.tsx`; Sentry `SentryArea` grew `render:*`; contact + careers migrated to coded
  failure arms as proof adoption.
- **S5 - baselines + records:** `docs/perf/v1-baseline.md` (wire JS 439-567 KB/route; gallery poll
  p50 509 ms live / 74.6 KB / 120 presigns per poll at 60 items - the doorbell's comparison base;
  live TTFB/DCL/load medians) + `docs/systems/design-system.md` + this record.
- **Live verification:** mono + IS confirmed on partyreel.com (computed-style probes, both modes,
  390px); the gated `/design/boom` probe (PERMANENT lab instrument) crashed prod render →
  global-error rendered generic + digest with zero message leakage → Sentry event tagged
  `render:global`; gate red-teamed (no/wrong key 404, right key 500); `notFound()` paths still 404;
  poll-baseline seed rows deleted + storage counter verified untouched. Two intentional Sentry
  issues from the probe (`JAVASCRIPT-NEXTJS-J`/`-H`) remain unresolved (permission-gated): resolve
  from the Sentry UI.

## 2026-06-11 — V1 program PHASE 1 COMPLETE: all 10 touchpoints ratified (round 7)

Will's final numbered form + notes landed; the lab now records the COMPLETE V1 component spec.
Commit `05b28e1`.

- **Entry = V4 adaptive sheet** (the verdict that also settles the header question): public events
  keep the real-gallery backdrop, locked/empty show the ghost grid + real count; lock mark above the
  heading; the account step framed as the host's SAFETY choice in natural copy, not a capture gate.
- **Header = V1 left editorial** (no cover-image pressure on hosts). Upload combo drops the add tile:
  header Add on load, floating Add on scroll, never both; play badges mark video tiles.
- **Rounding finalized:** surfaces 2px (near-sharp), NEW `--radius-tile` 3px + 3px gaps for media
  (corners no longer open holes), actions stay 16px-at-40px height-scaled.
- **Warning state added** (amber tokens, both modes): needs-review chips wear it. Event cards get
  meta-pill icons + the REAL per-event QR top-left (tiny on purpose; taps open the share suite).
- **Lightbox:** ~30% gracious side tap zones, whisper scrims, swipe primary with tight neighbor
  slide-in. **Forms:** SYSTEM RULE - Instrument for identity moments only; functional headings in
  Inter. Demo recomposed to the final spec.
- The full decision record + remix notes live in `src/app/(dev)/design/touchpoints.ts`.
- **Phase 1 of the v0→V1 program is COMPLETE** (identity, type, component spec all locked; the lab
  stays as the standing design instrument). Next: Phase 2 (design foundation + safety nets)
  re-enters plan mode.

## 2026-06-11 — V1 program Phase 1, round 6: 8 of 10 touchpoints ratified + the cohesive demo

Will's 10-note decision round, synthesized into the lab. Commit `4378d89`.

- **Ratified** (decision config): upload = floating+tile combo w/ green check; gallery = masonry;
  buttons = the sharp-surface/round-action radius system (16px @ 40px, height-scaled action tokens,
  one knob to go pill); lightbox = floating pill (revised: NO like counts for guests, attribution on
  its own bar, edge swipe hints, designed video state); event card = stat-forward overlay (refined
  pills + QR share chip); forms = card sections refined for management, focused column for guided
  flows; empty = photographic promise (mosaic fills the field, CTA centered); qr-card = minimal ink
  AND photo-backed as presets. **Open: entry (1) and header (4)**, header pending the entry verdict.
- **Policy locked: state feedback always gets color** (mono bans BRAND color, never MEANING): success
  green tokens (light+dark), liked = rose heart (white read as unliked), error red. Specimen updated.
- **Three new entry options** (V4 adaptive sheet + ghost grid, V5 count marquee, V6 inline teaser +
  sticky bar) all tease the gallery's SHAPE and COUNT, never pixels - so password + empty events hold
  and the account incentive survives.
- **/design/demo**: the cohesive composition of current picks (event page, lightbox, brand-new event),
  hand-rebuilt per round per Will's call (deliberately not generated from localStorage).
- **Share studio** (QR/share-content configurator) filed on the ROADMAP as its own feature.
- Verified: suite green, demo + revisions walked locally, live behind the gate.

## 2026-06-10 — Design lab: the selection mechanism (picks board + copy summary)

Will's workflow ask, built into the lab. Commit `b103359`.

- Every variant card carries a **Select** control; picks persist per-browser in localStorage
  (`design-picks`, `useSyncExternalStore` per the house pattern, SSR-safe).
- The hub gains the **numbered picks board** (touchpoints 1-10 with variant number + NAME): pass the
  whole set as a screenshot, or **Copy summary** for a numbered text block that maps 1:1 onto numbered
  remix notes in a message.
- Two layers by design: localStorage = Will's WORKING picks (filled badge); `decision` config in
  `touchpoints.ts` = the RATIFIED record the agent commits once passed (outlined badge + "locked").
- Verified: select → store → board live-tested locally end to end; suite green; live on
  partyreel.com behind the gate.

## 2026-06-10 — V1 program Phase 1, round 5: the design lab + the selection round begins

Type verdict landed (Will): **base Instrument Serif locked** (0.60 calibration + 0.013em stroke;
final sizing tweaks happen in the built UI if needed). Commit `449884f`.

- **/design formalized as the standing internal design lab** (Will's call: maintain an internal
  system for prototyping, comparison, and selection): `/design/system` is the locked-system
  reference (five screens + live specimen); `touchpoints.ts` is the DECISION RECORD - Will's pick
  per touchpoint lands as `decision` config and renders as Selected badges on the index ("N of 10
  decided") and the touchpoint page. The lab is the record, not just the showroom. (This supersedes
  the Phase 8 "remove or keep the playground" question: it stays.)
- The type slate retired; the vendored weighted fork stays in `fonts-local/` unused (README notes
  how to resurrect it if real weights are ever needed).
- **Five new touchpoints** join the original five for the selection round: lightbox chrome (pinned /
  floating pill / immersive auto-hide), host event card (cover-led / compact row / stat-forward
  overlay), forms & inputs (card sections / inline rows / focused column), empty & loading states
  (typographic / iconographic / photographic promise), QR table card (minimal ink / invitation
  frame / photo-backed) - the QR cards use the app's real `StyledQr` + classic mono preset, so the
  codes actually scan.
- Verified: suite green; all 12 lab routes 200 behind the gate, retired font routes 404, keyless
  404; 13-capture pack from live. **Phase 1 exit = the 10 touchpoint picks.**

## 2026-06-10 — V1 program Phase 1, round 4: IS bigger + the weighted fork + two new registers

Will: Instrument still leads but reads small; try the multi-weight fork he found, an all-caps
condensed (MasterClass register), and Noto. Commit `799e66b`.

- **A bumped again:** `font-size-adjust` 0.58 → 0.60 (+18% over native); hero verified clip-free at
  `leading-[1.08]`. (Hosting answer recorded: next/font SELF-HOSTS the Google faces too - build-time
  download, served from our domain, zero runtime Google requests.)
- **B, the fork (the build story):** `eliheuer/instruments-serif` (OFL-1.1) ships UFO sources only.
  fontmake rejected the variable build: 51 on-curve points in the Black master labeled `line` where
  Regular has `curve`. Mechanically repaired (relabel only, geometry untouched), then built as a
  **CFF2 variable** (`-o variable-cff2`; the TTF path crashes cu2qu on the now-degenerate cubics) and
  vendored as a 22KB woff2 via `next/font/local` with license + provenance in
  `src/app/(dev)/design/fonts-local/`. Shown at weight 600 with A's exact calibration so the weight
  treatment (real vs stroke) is the only variable. Repaired glyphs verified clean at 600.
- **C/D:** Oswald all-caps condensed (new `--display-transform` knob in the swappable layer; measured
  x-ratio 0.58 → no adjust) and Noto Serif Display (measured 0.54, near-parity).
- Verified: suite green; all five options + the vendored woff2 confirmed serving live behind the gate;
  7-capture pack delivered. Standing call: if none of the new variations wins, Instrument Serif
  carries into Phase 2 as is.

## 2026-06-10 — V1 program Phase 1, round 3.5: swappable type + Instrument tuning + craft pass

Will locked Instrument Serif as the working face with two requirements: the design system must make
the face EASILY SWAPPABLE, and Instrument needed more apparent size plus a touch more weight (it ships
in 400 only). Commit `73b30bf`.

- **Swappable-face architecture:** one generic `[data-dir-display]` rule reads five variables
  (`--display-font/adjust/tracking/weight/stroke`); a face is a block of five values and nothing else.
  Swapping the brand face = changing one block. Phase 2 lifts this shape into the `@theme` type tokens.
- **Instrument tuning:** calibration bumped ABOVE Inter parity (`font-size-adjust: 0.58`; its hairline
  strokes read smaller than its metrics) + a `0.013em` text-stroke as synthetic display weight
  (uniform stem thickening beats browser faux-bold; `font-synthesis: none` so engines can't fake one).
- **Craft pass on the touchpoints** (6-agent parallel critique, confirmed findings applied): press
  feedback on every pressable, the bottom sheet enters as one unit, full-screen CTA semibold +
  safe-area padding, dropzone contrast, FAB shadow/grouping, queue-row hierarchy, gallery stagger
  demos + leading-snug, quiet-tier shape legibility, px-labeled size ramp.
- Verified: suite green; calibration + stroke confirmed via computed styles. NOTE: Vercel dropped the
  webhook for `73b30bf` (no build was created for a successfully pushed commit, first occurrence);
  re-fired by the next push.

## 2026-06-10 — V1 program Phase 1, round 3: type calibration + component touchpoints

Will's round-2 read: Instrument Serif is the favorite BUT renders visibly smaller than Inter at equal
CSS size, and the other faces didn't land. Commit `df97085`.

- **The size lesson, made systematic:** in-browser canvas metrics confirmed the gap (x-height ratio
  0.51 vs Inter's 0.55, ~8%; DM Serif runs 15% small). Every display face now carries a one-time
  `font-size-adjust: 0.55` calibration in its `.font-opt-*` block, normalizing rendered x-height to
  Inter's - so standardized heading scales need NO per-use adjustment. Phase 2 inherits this as the
  per-face calibration in the type tokens. Unsupported browsers degrade to the uncalibrated size.
- **New serif slate** in Instrument's high-contrast neighborhood: Gloock, DM Serif Display, Prata,
  Playfair Display (+ Instrument calibrated, + Inter control); the round-2 grotesks/soft serifs gone.
- **Component touchpoints** (the new explored variable): `/design/c/[touchpoint]` - guest entry
  (centered card / bottom sheet / full-screen welcome), upload moment (dropzone card / floating action
  bar / add-tile-in-grid), gallery grid (uniform / masonry / edge-to-edge), event header (left
  editorial / centered formal / cover hero), buttons (soft rect / pill / sharp + size ramp). All set
  in Instrument on the locked mono system, light/dark toggleable, phone-framed where mobile-first.
- Verified: suite green; calibration confirmed live (computed `fontSizeAdjust: 0.55`); gate re-checked
  on all 11 new routes (404 keyless/bogus, 200 keyed); 11-capture pack from live delivered.
- Exit: Will picks per-touchpoint variant numbers + the typeface (or asks for another round).

## 2026-06-10 — V1 program Phase 1, round 2: monochrome locked, type exploration

Round-1 verdict (Will): **monochrome won, both modes** - zero accent ever; light (paper, hairline) and
dark (glass, media as the light source) ship as ONE system following the device preference, light when
unretrievable. Commit `a1e1569`.

- /design restructured around the verdict: one `.mono` token sheet (light + `[data-mode="dark"]`
  variants; geometry unified to the light radius, revisit in Phase 2), a per-page light/dark/system
  toggle (`mode-shell.tsx`, `useSyncExternalStore` per the house pattern, server snapshot = light by
  construction), and **type as the explored variable**: `/design/[font]` serves six display faces
  (Fraunces, Instrument Serif, Newsreader, Space Grotesk, Geist, Inter-as-control) on identical
  screens, each with per-face optical tuning (`.font-opt-*`).
- The accent direction (Warm Celebration) retired; the upload-success motion specimen is ink-quiet.
- Verified: suite green; toggle + both modes walked locally (a dev-server route-cache restart was
  needed after the `[direction]`→`[font]` rename - prod build unaffected); live gate re-red-teamed on
  the new routes (no/wrong key + bogus slug 404; all six 200 with the key); 12-capture pack (6 faces x
  2 modes, full-page, from live) delivered.
- Exit: Will picks the typeface (+ remix notes) → Phase 2 starts from the locked mono sheet + face.

## 2026-06-10 — V1 rebuild program Phase 1: the identity exploration playground

The v0→V1 full-app refactor/redesign program kicked off (8 phases; the program plan + settled decisions
live in the session plan file; the active-state pointer is in [STATUS.md](STATUS.md)). Phase 1 shipped:
commit `36627e3`.

- A gated `(dev)/design` route group at **/design**: production 404s unless `?key=` timing-safe-matches
  the new `DESIGN_PREVIEW_KEY` env var (set in `.env.local` + Vercel; dev mode is open); `noindex`,
  linked nowhere, absent from the sitemap.
- Three complete identity hypotheses as scoped token sheets (`design.css` `.dir-*` overrides of the raw
  `@theme` vars) + per-direction display faces (Fraunces / Space Grotesk / Bricolage Grotesque, loaded
  only on /design): **A Monochrome Editorial** (light paper, serif, ZERO accent), **B Monochrome
  Night** (dark glass, zero accent, media as the light source), **C Warm Celebration** (the single
  accent exploration, golden-amber). Set composition is 2 monochrome + 1 accent per Will's mid-build
  call: brand color reads too loud next to photos; accent never rides inline iconography in ANY
  direction.
- Five identical-markup screens per direction (guest entry in a phone shell, live gallery + lightbox,
  host dashboard, marketing hero, system specimen) + LIVE motion specimens per the emil-design-eng
  craft standard (custom curves, <300ms, `@starting-style`, press feedback, reduced-motion variants).
  Real Unsplash-licensed sample photos in `public/design/` make the media-is-the-color test honest.
- Verified: full suite green; all three directions walked locally (Preview MCP, desktop + mobile);
  live gate red-teamed on partyreel.com (no/wrong/empty key, subpages, bogus direction, param-case all
  404; correct key 200 on all four pages; `noindex` meta confirmed; sitemap clean); full-page
  screenshot pack captured FROM LIVE (Playwright, 3 directions x 2 widths) and delivered.
- **No DDL, no production-surface changes.** Exit: Will picks a winner + remix notes; the choice gets
  an ADR and the winning sheet transplants into `@theme` in Phase 2.

## 2026-06-09 — Gated gallery P3: host relabel + live guest-experience preview (initiative CLOSED)

The final phase; the 3-phase gated-gallery initiative ([ADR-0017](adr/0017-gated-gallery-view-access.md)) is
complete. Commit `4bd003a`.

- The upload-framed "Allow anonymous uploads" toggle is relabeled **"Require guest accounts"** (a display
  inversion of the same `allow_anonymous_uploads` column: switch ON = accounts required = stored `false`; the
  schema + the server Pro-gate are untouched), with a reframed description for the view-gating.
- A new pure `guestExperienceSummary({visibility, accountRequired, acceptingUploads})` (unit-tested) renders a
  live "what your guests will experience" line under the access controls (re-keyed so it crossfades as the host
  flips the toggles). The dashboard event-detail access line now uses the SAME helper — one source, no drift
  (and the dashboard line now reflects the accounts gate too).
- **No DDL.** Verified: the helper matrix (Vitest); live on partyreel.com as the signed-in host (the relabel +
  reframed copy + the Free-tier upgrade lock + the live summary render, and the dashboard access line shows the
  same sentence). The inverted switch is correct-by-construction (symmetric `!field.value` / `!checked`,
  type-checked; the read side confirmed live by the summary reflecting `accountRequired`).

**Initiative complete (P1 + P2 + P3):** account creation is now the incentive to SEE — a signed-out viewer of a
gated event gets a server-enforced real-photo teaser behind a unified entry modal, the host controls access with
clear labels + a live preview, and the full set never leaves the server. Rationale + the access model: ADR-0017.

## 2026-06-09 — Gated gallery P2: the unified entry modal + first-visit welcome

P1's server-enforced gate gets its face. One `Dialog` ([`entry-modal.tsx`](systems/guest-flow.md)) drives all
guest entry with ordered steps that adapt to the event: `welcome → password? → account?`. Commit `966ee0e`.

- **Server-driven steps:** `computeEntry` (pure, unit-tested) derives the ordered steps from the access-derived
  `gateSteps` + a first-visit flag; each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`, reused as
  step bodies) advances via `router.refresh()` → the RSC re-resolves → the satisfied gate drops. No client
  step-machine.
- **Welcome** = the always-on friendly front door + a light mini-guide, shown on the first visit per device
  (`pr_welcome_<qrToken>` via `useSyncExternalStore`), even on a fully public event; suppressed for the
  owner/demo. The button reads "Continue" when a gate follows, else "View event".
- **Dismissibility fits what's behind each step** (Will's "dismiss to what?"): welcome freely dismissable to the
  page behind; password FIRM (no X / backdrop / Escape — nothing behind it but the locked event); account closes
  to the browsable teaser, re-opened by the gallery's "See all N photos" button. Shell is Radix `Dialog` ONLY (a
  swipe-away drawer would mis-signal a must-complete gate) — a deliberate reshape from the master sketch's
  Drawer-on-mobile idea.
- Removed the full-page password early-return (the modal owns it); the `none` state renders a locked backdrop
  revealing only the NAME (privacy parity with the OG metadata + the old locked screen). `<EnterEventPrompt>`
  reframed for the VIEW gate ("See all the photos"); `<PasswordGate>` lost its full-screen wrapper (now a step
  body); a `[data-entry-step]` crossfade.
- **No DDL.** Verified locally against the real prod DB (anonymous localhost = a true guest context): the welcome
  ("View event" public / "Continue" gated), the account step over the teaser + the "See all" re-open, the FIRM
  password step (no Close), the locked-backdrop name-only privacy, first-visit-fires-once. Live render confirmed
  on partyreel.com (the welcome modal renders for a signed-in non-owner first visit; no SSR/hydration crash). The
  signed-out OTP-completion inside the modal reuses the unchanged `<EnterEventPrompt>`/`<EmailSignIn>` flow (live
  since P1). Testing note: a stale service worker in the test browser profile was masking edits mid-session (the
  app ships NO service worker; cleared it) — a localhost-caching gotcha worth remembering.
- **Next:** P3 (host relabel to "Require guest accounts" + a live "what your guests will experience" preview).

## 2026-06-09 — Gated gallery P1: server-enforced gallery access + teaser (gate the VIEW)

Account-required (`allow_anonymous_uploads = false`) and password events previously gated only UPLOAD, so an
anonymous visitor could harvest the whole gallery friction-free while contributing had friction. P1 of the
gated-gallery initiative (ROADMAP "gate the gallery VIEW") flips it: account creation becomes the incentive to
SEE. A signed-out viewer of a gated event is capped SERVER-SIDE to a real-photo teaser, the rest withheld until
they qualify. Commit `4707dc4`.

- **Access model:** a pure `resolveGalleryAccess(event, {isOwner, isAuthed, isUnlocked}) -> none|teaser|full`
  (`src/lib/events/gallery-access.ts`) is the single source of truth, enforced IDENTICALLY by the RSC and the
  `/api/guests/gallery` poll via the server-only `loadGalleryForAccess`. The poll was previously UNAUTHENTICATED,
  so gating only the RSC would have been a trivial bypass (call the poll directly) — closing that was the crux.
- **Teaser** = the newest `TEASER_LIMIT` (9) approved PHOTOS + a total count for "+N more", in one
  `count:'exact'` round trip via a new self-guarded `getApprovedPhotoTeaser` admin read (photos-only; password
  requires the unlock cookie, open is public, else nothing). Withheld media NEVER leaves the server (not a CSS
  blur). **Privacy rule:** a password event stays `none` until unlocked — real teaser photos appear only after
  the password is proven. Owner + signed-in + demo bypass to `full`; `needsAccount` was removed (the teaser
  state subsumes it).
- **No DDL** (all capping is server-side TypeScript), so `get_advisors` is unchanged (the same 3 anon read RPCs).
- **Verified:** the full access matrix as Vitest unit tests; locally via curl against the real prod Supabase
  (open+anon → full/12; open+account-required anon → teaser/9 + total 12, photos only; password no-cookie →
  none/0; password+unlock → teaser/9), and the RSC payload contained exactly 9 media keys with the 3 withheld
  absent. Live on partyreel.com: the anonymous poll returned teaser/9; the signed-in test host saw the FULL
  gallery + upload panel (no teaser caption, no account gate), confirming signed-in users are NOT over-gated.
- **Next:** P2 (the unified `welcome -> password? -> account?` entry modal + the first-visit welcome, folding in
  `<PasswordGate>` + `<EnterEventPrompt>`) and P3 (host relabel to "Require guest accounts" + a live preview).

## 2026-06-09 — Likes: favorite media + a "Likes" dashboard tab (host-only counts)

Logged-in users can like any photo/video they can see; the likes collect in a new dashboard **Likes** tab
(mirroring Uploads). Anonymous guests get the like button + the SAME create-account flow as Save (a capture
lever). Commit `5152c58`.

- **DB (migration `20260609160000`):** a `media_likes` table (PK `media_id+user_id`; owner-RLS SELECT/DELETE;
  INSERT/UPDATE REVOKED so the only write path is the RPC). Three authenticated-only RPCs (lint 0029, never
  0028 — NO new anon RPC): `like_media` (access-checked idempotent insert — host OR guest OR open-album),
  `get_event_like_counts` (HOST-GATED counts), `get_my_likes` (the Likes-tab feed; re-applies the access
  predicate so a now-inaccessible like never leaks its presigned key). Unlike + heart-state are owner-RLS
  straight from the browser (mirrors save/unsave).
- **Host-only counts** (Will's call), enforced at the DATA layer: counts come ONLY from the host-gated RPC and
  show ONLY on the host management gallery as a subtle "♥ N" badge (a curation signal; also makes the data
  ready for the future sort/filter system). No count ever reaches a guest.
- **UI:** a `LikesProvider` (one per gallery — optimistic toggle + ONE shared anon→signup dialog with
  pending-intent replay) + a `LikeButton` (desktop tile hover-reveal + the lightbox control row; mobile gets it
  only in the lightbox). Wired into the guest event page, the Uploads tab, and the new Likes tab (where an
  unlike drops the tile). `GoogleIcon` extracted + shared with Save.
- **Verified:** a rolled-back contract matrix (every access arm — host/open/guest/denied — the host-gated count
  returning zero to a non-host, the leak guard); `get_advisors` (the 3 RPCs in 0029, none in 0028); the grant
  lock (`authenticated` has no INSERT). Live on partyreel.com (seeded media): host like via the lightbox → DB
  row + the Likes tab populates + the host gallery shows "♥ 1"; unlike → row deleted + tile drops. Anon→signup
  dialog + the desktop/mobile responsive split verified locally (Preview MCP).
- **Follow-up (`9256c8e`):** `MyLikesGallery` now owns its empty state, so unliking the LAST item on the Likes
  tab shows "No likes yet" INSTANTLY (unlike is a client-only delete with no server revalidation, so deciding
  empty in the component avoids a refetch + dedupes the copy). Live-verified.

---

## 2026-06-09 — Delete-own uploads from the Uploads tab (`remove_my_upload`)

The deferred follow-up to attribution P4 (the read-only Uploads hub): a per-item delete in the dashboard
"Uploads" tab (commit `b087e46`).

- **New SECURITY DEFINER `remove_my_upload(p_media_id)` RPC** (authenticated-only, lint 0029 — never 0028)
  re-checks ownership against the SAME host-arm/guest-arm predicates as `get_my_uploads` (`auth.uid()`-based,
  no client-supplied trust) then soft-removes, reusing the 30-day recovery machinery (the `set_media_purge_at`
  trigger derives `purge_at`; the cron auto-purges). Idempotent — a repeat remove never resets `removed_at`.
- **"Soft, but private to the host"** (the product call): a guest's self-deletion of an upload they made to
  someone else's event is marked `media.removed_by_uploader=true` and hidden from that host's restore path
  (excluded from `listRecentlyDeletedMedia` + refused by `restore_media`); the uploader's deletion wins. A
  host deleting their own event's upload leaves it `false` (host-restorable, like the event-gallery Remove).
  The new column is write-locked (NOT in the `authenticated (status, removed_at)` grant), so only the
  owner-context RPC sets it.
- **UI:** an opt-in Trash control in the shared lightbox (behind a confirm), wired only by the Uploads tab;
  `useOptimistic` removal + `revalidatePath`, toast on failure. The album / host / recovery lightboxes are
  unchanged (the prop is omitted there).

Verified: a rolled-back Supabase RPC contract matrix (both arms; cross-tenant → `not_found`; idempotency; bin
exclusion; `restore_media` privacy refusal; `purge_at = removed_at + 30d`) + advisors (`remove_my_upload` in
0029, anon EXECUTE denied, `has_column_privilege` on the marker = false). Live on partyreel.com (signed in as
the test host; seeded then torn down): deleted a host upload (→ `removed_by_uploader=false`, lands in that
event's Trash) AND a guest upload to another host's event (→ `removed_by_uploader=true`, excluded from that
host's bin + restore refused) through the real lightbox → confirm → action → optimistic-removal path; the
active-bytes meter freed immediately. All 321 unit tests green.

## 2026-06-09 — Attribution P4: dashboard consolidation (Events + Uploads + Trash)

The FINAL phase of the uploader-attribution + unified-identity initiative (commit `622b519`). Turns the
unified `guests.user_id` (P3) into a personal home, and CLOSES the initiative (P1 identity → P2 attribution →
P3 claim → P4 dashboard).

- **Merged "Your events" + "Saved" into one "Events" tab** — interleaved by recency (hosted by `created_at`,
  saved by `saved_at`, so a just-created OR just-saved event lands top), each card icon-differentiated
  (hosted calendar glyph vs saved bookmark) on the shared `EventCard`. Threaded `saved_at` through
  `SavedEventCardData` for the sort; preserved saved-event visibility masking + Unsave + the disabled/lock state.
- **New "Uploads" tab** — the user's own media across ALL events (host + guest) via a new authenticated
  SECURITY DEFINER `get_my_uploads(p_limit)` RPC (UNION ALL of host-arm + guest-arm, provably disjoint;
  `is_host_upload` + event/type/date make it filter-ready for a future cross-gallery filter; excludes
  soft-deleted events + non-approved/removed media; no masking — own uploads). Flat newest-first `MediaGrid`
  + lightbox (view + per-item download); a new `toMyUploadsItems` presigns per-item against each item's OWN
  event (ADR-0003); a gated event-context caption links each item to `/e/`. 200 cap + a truncation footer (no
  silent cap). Delete-own deferred (a future security-bearing RPC).
- **"Recently deleted" → "Trash"** across all user-facing copy (dashboard tab + storage-meter line, the
  per-event media section, 2 recovery emails, the bell nudge, the mutations error, + the email test). Internal
  identifiers + the `value="deleted"` tab key stay.
- Dashboard Tabs are now deep-linkable via `?tab=` (events|uploads|deleted) with instant client switching
  (`history.replaceState`, no server round-trip). Save-on-signup unchanged (verified it still lands cleanly).
- Design craft (emil-design-eng): press feedback + reduced-motion on the cards, an opacity load-fade on
  gallery photos (`complete`-checked so a cached image can't stick at opacity-0), the lightbox event caption
  fades via the house `--ease-emphasis`, crisp non-animated tab swaps.
- Live-verified on partyreel.com (staged, then torn down): the Events tab interleaved a hosted event (calendar
  glyph) + a just-saved event (bookmark glyph + unsave) by recency; the Uploads tab rendered the live RPC's
  item with the lightbox event caption "Partyreel Demo · July 9, 2026" + the Save button; the Trash tab + the
  `?tab=` deep-link survived a refresh. `get_my_uploads` advisor 0029 (never 0028); a rolled-back contract
  matrix (A/B isolation, status/removed/soft-deleted-event exclusions, `is_host_upload`, disjoint UNION ALL,
  limit/sort, grant auth/anon); typecheck/lint/test (321)/build green.

## 2026-06-09 — Attribution P3: claim anonymous uploads on sign-in

When an anonymous guest later authenticates, their prior anonymous uploads FROM THIS BROWSER silently become
theirs (the third phase of the uploader-attribution + identity initiative; commit `5123f7f`). An anonymous
upload is a `guests` row with `user_id IS NULL`; the browser still holds its `session_token` in `localStorage`
(`pr_session_{qr_token}`). On sign-in a client helper enumerates those tokens and the DB stamps them to the
new account.

- New authenticated SECURITY DEFINER `claim_anonymous_uploads(text[])` (migration `…609120000`) stamps
  `guests.user_id = auth.uid()` only where `session_token = ANY(...)` AND `user_id IS NULL` (the `IS NULL`
  guard makes it theft-proof + idempotent; ≤1000-token bound; never writes `email`). Browser-callable by
  design (mirrors `save_event`): identity is `auth.uid()` and the tokens are held capabilities, so there is no
  client-spoofable value for server-mediation to protect (cf. ADR-0016).
- `src/lib/guest/session-tokens.ts` (the shared `SESSION_PREFIX` + a pure, unit-tested
  `collectStoredSessionTokens`) + `src/lib/guest/claim-uploads.ts` (best-effort helper; module in-flight/done
  guards; no sessionStorage — the `IS NULL` filter makes a reload's re-run a silent 0-op). Mounted via
  `<ClaimUploadsOnAuth>` in the `(app)` layout (loud toast) + the guest `EventExperience` (silent), plus direct
  silent calls in the in-page sign-in handlers (`EnterEventPrompt`, the save dialog). The toast is loud only in
  the account context; silent on guest `/e/` paths so it never stacks with the "Saved" toast.
- Live-verified on partyreel.com: a real host sign-in + many reloads claimed 14 staged anonymous rows to the
  test host; an operator-owned row was NEVER touched (no theft); the success toast "We added your uploads to
  your account." renders on the dashboard (confirmed visually by Will — the auto-claim fires ~1-3s post-load
  once the data-heavy dashboard hydrates). Rolled-back contract matrix (claims the NULL row, leaves a foreign
  row, idempotent re-run, 1001-array → `program_limit_exceeded`, grant auth=true/anon=false, never writes
  email); typecheck/lint/test (321)/build green; advisor `0029` (never `0028`).

## 2026-06-08 — Security: abuse-focused rate limiter for guest write endpoints (H3b)

Closed the one deferred piece of the server-mediation remediation (commit `7bb2b53`): the now
service-role-only `create_guest` / `create_report` / `capture-email` routes had no throttle. Per Will, the
limiter is ABUSE-focused, NOT volume-focused (an event app gets heavy LEGITIMATE traffic from one NAT IP, so
a per-IP volume cap would block the core use case).

- Venue-safe design: the primary signal is cross-event BREADTH (one IP touching many DISTINCT events = a
  scraper; a venue is exactly ONE event, so it never trips) + a high per-(IP,event) backstop (runaway-bot
  guard); raw volumetric DoS stays the Vercel edge firewall's job. Deny-all `action_attempts` (HMAC hashes
  only, mirrors `unlock_attempts`) + the `action_rate` service-role RPC (the `COUNT(DISTINCT)` breadth in one
  round-trip); `abuse-rate-limit.ts` (pure, unit-tested) + the server-only store; wired into the three routes
  (`429` + `Retry-After`; fail-OPEN + Sentry on a limiter error; cron-pruned).
- Hygiene: explicit `grant execute … to service_role` for `create_media` / `create_report` /
  `capture_guest_email` (they had relied on Supabase's implicit default grant — verified working, now explicit).
- Live-verified on partyreel.com: the report backstop trips at 16 (15× `200` → `429`); 12/12 venue joins to
  ONE event all allowed (0 throttled); the six direct anon RPCs return `404`; an identity-forgery probe (body
  `user_id`) left the guest row `user_id` NULL. Rolled-back contract check (breadth = 3 distinct, backstop =
  2, no cross-IP bleed); typecheck/lint/test (317)/build green; advisors clean (`action_rate` in neither 0028
  nor 0029; new `action_attempts` deny-all INFO).

## 2026-06-08 — Security remediation: server-mediated guest RPCs (pentest H1/H2/H3)

Closed the externally-exploitable findings from the 2026-06-08 live pentest by SERVER-MEDIATING the six guest
write/password RPCs (ADR-0016; commits `2e4c909` H1, `2d63b38` H2, `b3b48e3` H3a, `1bcf61f` password UI).
Root cause: each was `anon` EXECUTE-granted, so directly PostgREST-callable, bypassing every route-level guard.

- **H1 (cost-bomb):** `create_media` + `create_media_as_host` are now service-role-only; the complete-upload
  routes call them via the admin client with the authoritative R2-HEAD size. `create_media_as_host`'s
  `auth.uid()` ownership became a trusted `p_host_id` from `getUser()`. Live-verified with two real uploads
  (host 5.7 MB + guest 10 MB through the new path); the direct anon attack now returns `42501`.
- **H2 (password oracle):** `verify_event_password` is service-role-only; the unlock route (admin client) is
  the sole caller, so the venue-NAT limiter is unbypassable (20/IP → `429`, blocking even the correct password
  once tripped). The limiter keeps fail-open but now Sentry-alerts; a client-side cooldown keeps honest-traffic
  cost off Vercel. Password minimums kept (8 accounts / 4 events) with a soft live strength meter as guidance.
- **H3 (spam/poison):** `create_guest` (now a trusted `p_user_id`; the verified email is read from `auth.users`,
  the client `p_email` dropped) / `create_report` / `capture_guest_email` (new `/api/guests/capture-email`
  route deriving the email from the verified session) are all service-role-only. Anon attacks (incl.
  `capture_guest_email` with a victim address) now return `42501`; legit join + report still work.

The anon advisor set shrank 8 → 3 (reads only); the six are service-role-only. The `415962b` CHECK remains the
floor. DEFERRED: a venue-NAT-aware per-IP rate limit for `create_guest`/`create_report` (a naive per-IP cap
would block legitimate venue crowds; it needs the unlock limiter's count-failures design) → ROADMAP; Vercel's
edge firewall is the volumetric backstop. `typecheck`/`lint`/`test (310)`/`build` green; every phase
live-red-teamed on partyreel.com.

---

## 2026-06-08 — Per-photo uploader attribution caption (uploader-attribution P2)

Phase 2 of the uploader-attribution initiative (commit `69b8b71`; builds on P1's required display names). The
media lightbox now shows **who** uploaded each photo/video: a subtle bottom-center caption — the uploader's
public **display name**, a **"Host"** badge for the host's own uploads, or **"Anonymous"** with a tap-to-open
info popover whose copy is context-aware (guests see "The host has enabled anonymous uploads for this event.";
the host sees a nudge to require accounts in Settings). Attribution is **lightbox-only** — the dense grid tiles
stay clean by construction (`MediaTile` reads only `type` + `url`).

Identity is resolved server-side by ONE shared admin-read (`getUploaderIdentities`), required because
`profiles` RLS is own-row-only so a host's normal query can't read guests' names (mirrors the `getHostAvatarUrl`
byline pattern). A pure `resolveUploaderIdentity` CASE classifies host / anonymous / named-guest. The uploader's
**email is shown on the HOST gallery only**: the host dashboard spreads it, but every guest-facing item is built
by `toGridItems`, which copies only name + flags and never email, so email-safety is by construction (not a
runtime flag) and pinned by a standing source test. No migration (reads existing tables + FKs).

Live-verified on partyreel.com (staged four identities against one real photo): the host view showed
name+"Host" (no email), named guests showed name + email, anonymous showed "Anonymous" + the host-copy popover;
the guest view showed the same minus every email, with the guest-copy popover; and an **anonymous fetch of the
SSR HTML + `/api/guests/gallery` JSON carried zero email** (item keys: `id, type, url, downloadUrl,
uploaderName, isHost, isAnonymous`). Nested Esc closes the popover first, the lightbox second. `pnpm typecheck
&& lint && test && build` green.

---

## 2026-06-08 — Identity foundation: required display names + `allow_anonymous_uploads` (uploader-attribution P1)

Phase 1 of the uploader-attribution / unified-identity initiative (commit `9238531`; ADR-0015). Every account
now always has a **public display name**: required at every signup/onboarding path (host welcome + a guest
name step), profanity-filtered via **`obscenity`** (tuned word-boundary so it does NOT block real names like
Anushka/Shitij/Dickson while still catching slurs/leetspeak/compounds), and reserved/impersonation-blocked
(`admin`, `partyreel`, etc.). The check is **authoritative**: the `authenticated` UPDATE grant on
`profiles.display_name` was revoked, so the column is service-role-write-only and the validated
`updateDisplayNameAction` (getUser → validate → profanity → admin client) is the only write path, unbypassable
by a direct API call. `handle_new_user` now leaves `display_name` NULL for ALL signups (incl. OAuth); onboarding
prefills the guarded input from `user_metadata`, so even a Google name flows through the one filter.

"Verify email to upload" was reframed as account entry: the host setting `events.require_email` was renamed +
inverted to **`allow_anonymous_uploads`** (default on; turning it off — requiring an account — stays Pro-gated),
and an account-required event shows an email-primary **"Enter event"** flow (`EnterEventPrompt`, with a secondary
password login) instead of the old verify prompt. There are no verification-only paths; an account simply proves
ownership.

Migrations `20260608093908` (column rename + `create_guest`/`get_event_by_qr_token`/`enforce_event_pro_gates`
recreated, values flipped) and `20260608093939` (display_name grant lockdown + `handle_new_user`). Verified:
typecheck/lint/test (297) /build green; `get_advisors` clean; rolled-back `create_guest` contract check (blocks
anon when an account is required, allows otherwise); live red-team on partyreel.com (profanity + reserved
rejected, short name "AJ" saved, empty disables Save, the "Allow anonymous uploads" Free-lock + upgrade hint,
guest page renders clean). Built on the security agent's baseline; the deferred anon-RPC server-mediation stays
owned by P3. P2 (lightbox attribution UI), P3 (claim anonymous uploads), P4 (dashboard consolidation) pending.

## 2026-06-08 — Per-upload limits: 10 GB ceiling + host-configurable per-event cap

Retired the per-TYPE per-file limits (50 MB photo / 2 GB + 5-min video) for ONE universal **10 GB per-upload
ceiling** across photos and videos: size is the only gate, the 5-minute duration cap is gone, and full-quality
big files stop being friction. Video stays Pro-gated; the storage cap + monthly-ingress meter are unchanged.
Restored the original "one guest can't fill the host's storage" protection as a host-configurable
**per-event cap** (`events.max_upload_bytes`, 25 MiB to 10 GB, or null = no cap), available to **every tier**
and bounding **guest** uploads only — the host's own batch uploads (`create_media_as_host`) are exempt, since
the host owns the setting. The effective guest limit min(10 GB, host cap, remaining storage) is enforced
server-side: the cap is read from the event row INSIDE the SECURITY DEFINER RPC (never client-supplied) and
re-checked on the authoritative R2-HEAD size, so it can't be spoofed. Bumped the upload presign TTL 15 min →
**2 h** (a multipart upload presigns all its parts up front, so a multi-GB transfer must finish before they
expire). Migration `20260608120000_universal_upload_ceiling_and_host_cap`: nullable column + a 25 MiB–10 GB
CHECK + an additive host column grant + CREATE-OR-REPLACE of `create_media` / `create_media_as_host` /
`get_upload_context` (`get_advisors` unchanged from baseline; types regenerated). Single-sourced as
`MAX_UPLOAD_BYTES` / `MIN_UPLOAD_CAP_BYTES` / `UPLOAD_CAP_PRESETS` in `lib/media/limits.ts`, mirrored by the SQL
`c_max_upload_bytes` (`::bigint`-cast to dodge the int4 overflow). New "Max size per upload" control in the
event-settings "Guest uploads" card (native `<select>` of presets, all tiers); marketing / FAQ / help / pricing
copy updated to "up to 10 GB."

**Megafile / cost-abuse hardening (same initiative, follow-up commit).** A presigned multipart upload didn't
bind Content-Length, so a bad actor could declare a ≤10 GB upload, get up to ~640 part URLs, over-stuff each
part, and call complete — assembling a multi-TB **orphan** in R2 that the real-time backup Worker would
replicate into the 35-day WORM bucket (`create_media`'s ceiling guards the DB/cap accounting, NOT the R2
object's existence; raising the ceiling 2 GB → 10 GB widened this). Closed at two layers: (1) **Content-Length
is now bound into every presigned PUT + UploadPart** (the route signs each part's exact size — fixed part size
for parts 1..N-1, the remainder for the last), so R2 rejects (403) any body larger than declared; (2) a
**complete-time guard** sums the real uploaded part sizes via `ListParts` and ABORTS the multipart instead of
assembling if the total exceeds the ceiling, so no oversized object is ever created (or backed up). New
`sumMultipartParts` / `abortMultipartUpload` in `r2/presign.ts`; both complete routes call the guard before
`completeMultipartUpload`.

Verified: typecheck + lint + 290 Vitest + build all green; rolled-back Supabase-MCP RPC contract checks confirm
the gates (11 GB → ceiling reject, 200 MB vs a 100 MB host cap → host-cap reject, 10 MB → accept, video on a
free host → gate reject); the megafile hardening proven against the **real R2 bucket** (signed Content-Length:
correct size → 200, oversized → 403 for both single-PUT and multipart parts; a legit 2-part multipart sums +
assembles byte-exact). **Live on partyreel.com**: the "Max size per upload" control renders + persists through
the authenticated write (DB shows the saved cap, reload reads it back), and a guest presign red-team returned
the expected results (200 MB → 422 "capped at 100 MB"; 5 MB → presigned; 11 GB → 400 schema-bound). Feature
commit `8e55910` + the hardening follow-up.

## 2026-06-08 — Avatars moved off R2 to Supabase Storage

Profile avatars now live in a **public Supabase Storage `avatars` bucket** instead of the shared R2 media
bucket, cleanly separating account metadata from the durability-critical event media + its WORM backup. Pure
backend swap: the client cropper and the `POST /api/account/avatar` validation (content-type + 512 KiB cap +
magic-byte WebP sniff) are unchanged; only the storage backend moved. New `src/lib/supabase/avatar-storage.ts`
(upload / remove / getUrl via the service-role admin client, which bypasses storage RLS, so the bucket needs
no policies); the deterministic path `<id>/avatar.webp` + `upsert` keeps the one-object-per-user zero-orphan
property. Reads are a stable public CDN URL with a `?v=<avatar_updated_at>` cache-bust (no per-render
presign); `profiles.avatar_updated_at` stays the service-role-write-only existence marker + the `?v=` version.
Removed the now-dead R2 avatar code (`r2/put.ts`, `r2/avatar-url.ts`, `avatarObjectKey`). Migration
`20260608040803` creates the bucket (512 KiB + `image/webp` as defense-in-depth); 0 avatars existed, so the
cut-over needed no backfill. Closes the ROADMAP "avatars → Supabase Storage" round + the durability doc's
queued-initiative gap. Bytes ride Supabase infra durability (not pg_dump); avatars are derivable, so by design.
Live-verified on partyreel.com (upload / replace / remove; one object held through replace; 415/413/422
validation; guest "Hosted by" byline).

## 2026-06-07 — Deletion-aware backup prune (ADR-0013, Pillar B), deployed in dry-run

Bounded the keep-all media backup: a weekly Worker cron (`0 6 * * 1`) reclaims a `partyreel-backup` object
once its source is gone, the inverse of the orphan sweep and the only job that deletes from the last-resort
backup. Layered safety: a **dual existence check** (prune only when BOTH the `media` row is gone AND the
primary R2 object is absent, so no single-source fault can wrongly prune), an app-side
**`media_table_empty` circuit-breaker** that fails closed + alerts (Sentry + a deduped email, reusing the
orphan-sweep machinery), a **36-day age gate** (one day past the Bucket Lock), a **per-run delete clamp**
(500), and **dry-run by default** (deletes nothing until `PRUNE_MODE=live`). DB-first ordering HEADs the
primary only for the confirmed-gone set, so cost stays ~$0 into tens of millions of objects. New code:
`workers/backup` `prune` branch + `prune-strategy.ts`; app `r2/prune-guard.ts` + `/api/internal/backup-prune`
+ `pruneBreakerEmail` + the shared `PRUNE_API_SECRET`. Observability is alert-only (the `/admin` job-runs
heartbeat is deferred to admin P8). Verified: `pnpm typecheck`/`lint`/`test` (290) + `build` + worker `typecheck`/tests (15), plus a LIVE
adversarial pass (endpoint auth 401/500, zod 400, breaker trip + operator email, dual-gate excludes existing
rows; the deployed Worker's cron routing + empty-primary early-out = zero deletes). Worker + app route + the
shared `PRUNE_API_SECRET` (Vercel + Cloudflare) are LIVE in dry-run ([#2](https://github.com/willgibs/partyreel/pull/2),
[#3](https://github.com/willgibs/partyreel/pull/3)). PENDING: the live-flip (`PRUNE_MODE=live`) + the
destructive drill, both post-launch (the 36-day age gate + the lock keep the delete path unreachable until then).

## 2026-06-07 — Documentation consolidation (in progress)

- **Phase 1 — system reference layer** (`be7dd8e`): added `docs/systems/` (12 per-system reference docs +
  a folder index, +1,146 lines) holding the per-system gotchas/invariants, each with a maintenance-contract
  header. Additive (no existing doc changed). Gate-verified (286 links resolve, all landmine keywords
  present) + validated by fresh subagents constrained to `docs/systems/` (3 trap tests refused+cited; a
  targeted plan navigated correctly). Master plan: the docs-consolidation initiative (keep all knowledge,
  restructure so CLAUDE.md stays lean + depth loads on demand).

## 2026-06-06 → 06-07 — Media durability (ADR-0013): all 3 pillars

- **Pillar A — orphan-sweep circuit-breaker** (`6f151c5`): the cron's orphan sweep now deletes nothing +
  alerts (Sentry + a deduped operator email) when `media` is empty or the orphan set is pathological, so a
  DB fault can't wipe the un-backed-up R2 bucket.
- **Pillar B — real-time media backup** (`workers/backup/`, 2026-06-06): a Cloudflare Worker (R2
  `object-create` → Queue → consumer + a daily reconciliation `scheduled()`) copies every `events/` object
  to a Bucket-Locked 2nd R2 bucket (WNAM, IA, ≥35-day WORM). DR-drill-verified: ~15 s replication, the lock
  blocks deletion, restore works, >100 MB multipart copy byte-identical. Workers Paid ~$5/mo, zero egress.
- **Pillar C — off-site DB backup** (2026-06-07): a nightly `pg_dump` → `partyreel-backup/db/` via
  [`db-backup.yml`](../.github/workflows/db-backup.yml), restore-verified (every table's row count matched
  prod into a throwaway Postgres 17); hardened with a post-upload byte-size verify + Node-24 opt-in.
  Findings: R2 has no native versioning/replication; Bucket Lock GA + free; R2↔R2 egress free.

## 2026-06-06 — Infrastructure ownership migration → partyr33l@gmail.com ("P3")

Every backing service moved off the founder's personal accounts to the dedicated owner account P3:
Supabase (project ref unchanged, now P3 "Partyreel Team" Pro org), Cloudflare R2 (new account, bucket
re-created), Stripe (same acct, ownership transferred), Sentry (same org, ownership transferred), Resend
(new acct, domain re-verified), Google OAuth (new client), and the in-app operator (`partyr33l@gmail.com`
= is_admin + MFA; `hi@willgibs.com` retired). Verified live (Google + email-OTP sign-in, R2 upload, Stripe
upgrade→downgrade, admin AAL2). Deferred: Vercel hosting (willgibs Hobby → P3 Pro at launch), domain + DNS
(GoDaddy → P3 Cloudflare), GitHub repo (→ P3 at sale).

## 2026-06-04 — Security hardening (ADR-0014)

- **Phase 1 — events write-grant lockdown** (migration `…163011`, `ba8c08f`): closed a live CVE — `events`
  kept Supabase's default grant, so a free host could PATCH `event_password_hash`/`custom_slug`/
  `require_email`/`qr_token`/`purge_at` to steal Pro features. Root-cause lesson: a column-level
  `revoke update(col)` is a SILENT NO-OP while a table-level grant stands (the prior column-revokes did
  nothing; `has_column_privilege` confirmed all 17 columns writable). Fix mirrors the media/profiles
  column-lock + trigger-derived `purge_at` + the `enforce_event_pro_gates` trigger +
  `events_password_requires_hash` CHECK. Verified by a 16/16 rolled-back matrix + a LIVE authenticated PATCH
  (every forbidden column → 403; a granted column → 204).
- **Phase 2 — broad white-hat sweep** (`cc5671e`/`9ba3a80`/`3cc3489`, migrations `…175656`/`…180225`):
  least-privilege grant sweep across ALL tables; closed an **upload size-spoof cap-evasion** (re-derive the
  real `file_size_bytes` from an R2 HEAD at complete — proven live: a `size_bytes:1` upload stored the real
  50 KB); a **venue-NAT-aware unlock rate-limiter** (count failures + clear-on-success; deny-all
  `unlock_attempts`; proven live: 20 wrong → 429 + Retry-After 900, correct → cleared). 15/15 rolled-back
  matrix; advisors unchanged.

## 2026-06-03 → 06-04 — Recovery / "Recently deleted" (Phases 1–5 of 6)

- **Phase 1 — cap-meter refactor** (`23bc5a0`): the cap enforces against ACTIVE bytes
  (`host_active_bytes()` = non-removed media in non-deleted events), so deleting frees cap room
  immediately; `storage_used_bytes` becomes the physical-only meter.
- **Phase 1.5 — security hotfix** (`cde3dc6`): locked `media` writes to the moderation columns only
  (the default grant let a host PATCH `file_size_bytes=0` to beat the cap).
- **Phase 2 — unified window + standby budget**: ONE 30-day window (`RECENTLY_DELETED_WINDOW_DAYS`);
  `media.purge_at` trigger-derived (un-spoofable); an 8th cron sweep `sweepStandbyBudget` bounds
  deleted-but-stored bytes to 1× the cap (oldest-first).
- **Phase 3 — restore/purge RPCs**: `restore_media`/`restore_event`/`purge_media_now` (authenticated,
  ownership-gated; capacity-gated against the BASE cap; all-or-nothing event restore; jsonb `{ok,reason}`).
- **Phase 4 — host bin UI**: a dashboard "Recently deleted" events tab + a per-event removed-media section;
  the storage meter now shows ACTIVE bytes. Live-verified (meter reads 52.5 KB active not 2.6 MB physical;
  restore-at-cap refused with the exact "Free up X" toast).
- **Phase 5 — recovery notifications + email copy**: a `recovery_clearing` bell alert
  (`RECOVERY_PURGE_NUDGE_DAYS`=7); system-removal emails point to the in-app self-serve restore.
- **Phase 6** (pre-launch test-data hard reset) deferred to the launch checkpoint.

## 2026-06-03 — 404 / not-found pages

Five audience-aware `not-found.tsx` (root + per route group) sharing one animated core
(`NotFoundScreen` + single-sourced `MarketingNotFound`); fixed a live-caught double-chrome stacking bug
(the `(marketing)/not-found.tsx` boundary renders content-only). Live-verified: all five render, every
variant 404 + `noindex`, no leak.

## 2026-06-03 — Upload thumbnail previews + custom event slug

- **Upload thumbnails** (`04ab35b`/`238bee9`): camera-roll thumbnail previews on the upload queue,
  extracted to a shared `UploadThumbnail` (guest + host), routed through `videoPosterSrc()`. Live-verified.
- **Custom event slug** (ADR-0012, Phases 1+2): Pro/Event-Pass `/e/<slug>` alias (the permanent
  `/e/<qr_token>` + QR unchanged); `set_event_slug`/`clear_event_slug` (authenticated-only, tier-gated);
  `get_event_by_qr_token` resolves slug-or-token → canonical token; `EventSlugControl` with debounced live
  availability (`check_slug_available`) + change/remove warning + suggestion chip. Live-verified; a
  corrective migration revoked an MCP-default `anon` grant (the "MCP RPCs inherit anon EXECUTE" lesson).

## 2026-06-02 — Profile photos, display names, account password

- **Profile photos + display names** (3-part, migration `…213758`): avatar upload (cropper → 512px WebP →
  `POST /api/account/avatar` → deterministic `avatars/<id>/avatar.webp`, zero orphans by construction); the
  `/account` display-name editor (dropped the email-prefix fallback + a one-time backfill); the guest
  "Hosted by" avatar+name byline. Live-verified (R2 held at exactly 1 object through replace; 415/422 on
  bad bytes).
- **Account email + password** (ADR-0011, migrations `…200420` + `…210158`): a traditional email+password
  login alongside OTP/magic-link/Google. Headline live catch: GoTrue writes a non-null bcrypt PLACEHOLDER
  for OTP/magic-link signups, so the first `has_password()` mislabeled OTP-origin hosts → fixed with a
  service-role `password_set_at` flag stamped by `mark_password_set()`. Full Chrome-MCP matrix verified
  (create → set → login; generic anti-enumeration error; CHANGE-mode re-check; OTP-origin add-password).
- **Resend custom SMTP**: auth emails route via Resend SMTP (lifts the built-in ~2/hr cap that blocked live
  OTP); per-IP auth limits raised 30 → 150 / 5 min.

## 2026-06-01 → 06-02 — Config / permissions rework (ADR-0007/0008/0009)

- **Phase 1 — 3-state access + Pro password** (`ea02f32`+`c0721bc`, ADR-0007): `is_public` → an
  `event_visibility` enum (open/password/private); Pro password gate (bcrypt via
  `set/clear_event_password`; the anon `verify_event_password`; a signed unlock cookie; password media via a
  cookie-guarded server admin-read). Phone-verified.
- **Phase 2a — video Pro-only** (`6bdd0bd`): a `tier='free'` video gate at the top of the tier-caps block
  in both upload RPCs + an advisory `video_blocked` flag. Live-verified (guest video presign → 403).
- **Phase 2b — drop guest display names** (`6d33e3b`): removed `guests.display_name` +
  `events.require_display_name`; `create_guest` → 2-arg; the just-in-time join is now field-less + silent.
- **Phase 2c — verified-email OTP** (`2b389d6`, ADR-0008): "require email" = a verified email (native OTP);
  `create_guest` derives identity from `auth.uid()`; new `guests.user_id` (account-from-guest); a shared
  `<EmailSignIn>`. Caught live: the Supabase Email-OTP length was 8 vs a 6-slot input → pinned to 6
  (`OTP_LENGTH`).
- **Phase 3 — saved events** (`7ab930f`, ADR-0009): a signed-in visitor can save any event (FREE growth
  driver); `save_event`/`get_saved_events` (authenticated-only; visibility-masked); the always-visible Save
  button + the post-upload `<SaveAccountPrompt>` (replaced the newsletter prompt). Full account-from-guest
  loop live-verified end-to-end.

## 2026-06 — One-link consolidation (ADR-0010) + host upload

- **One link per event** — Part 1 (data + routing, `37707d8`): collapsed the two-token model to
  `/e/[qr_token]`; dropped `get_public_album` + the `share_token` column + the `/a/` route (anon advisor
  list 9 → 8). Part 2 (flow redesign, `d4b0902`): header → `[Save event] [Invite]` action row → upload →
  gallery, contiguous; uploads-off = the view-only state; `needsEmailVerification` gated on
  `accepting_uploads`. Full cross-state matrix live-verified.
- **Host-side media upload** (`06554ff`): the host adds media from the event page via `create_media_as_host`
  (authenticated twin of `create_media`; counts against caps; `status='approved'`; `guest_id=NULL`). Shared
  `uploadFile` + `/api/host/r2/*`. Live-verified (new row `guest_id=NULL`, `storage_used_bytes` +103).
- **Unified guest event page** (`f073451`) + the album lightbox + per-item download (`8a4f3ae`).

## 2026-06-01 → — Admin / operations portal (R1–P7)

Served on `admin.partyreel.com` by the same app; one `requireAdmin`/`requireAdminAction` seam + free TOTP
MFA (AAL2); host-isolated cookies.
- **R1 — perimeter + auth** (`8c7a237` host-aware callback, `21a9526` #418 fix, `c44536d` QR): subdomain
  routing, the seam, lockout-proof MFA, `AdminShell`, report review moved to `/admin/reports`.
- **R2 — Sentry** (`7d997cb`): `@sentry/nextjs` app-wide, DSN-gated no-op, on-error Session Replay
  (media-blocked, text-masked), manual captures only at swallowed paths. Live-verified via a deliberate
  bad-signature webhook → issue with `area:webhook` + clean PII.
- **P3 — support & moderation inbox** (`e0903c2`): `/admin/support` + `/admin/applicants` triage +
  Reports Open/All filter.
- **P4 — accounts & billing** (`9282aa6`): read-only host browser + tier/sub/active-storage/Stripe deep-link.
- **P5 — proactive album moderation** (`d812ccc`): cross-event uploads feed + drill-in + soft-remove/restore.
- **P6 — metrics** (`53c82b3` numbers + live Stripe revenue; `7dce416`/`bb460b6` recharts charts).
- **P7 — nav dropdown + operator-alerts bell + announcements compose/publish** (`b1df0d7`). The
  blog/help/careers CMS was deferred (content stays file-based).

## 2026-05 — Marketing site build-out + polish arc

- **7-round build-out**: foundation (nav single-source, config-driven header + mobile Sheet, footer,
  JSON-LD, the `#FB4817` accent) · `/features` · `/events` (hub + 4 type pages) · `/contact` (ADR-0005) ·
  `/careers` · `/help` (the MDX content pipeline, ADR-0006) · `/blog` (+ RSS, on the generalized
  `collection.ts` core). All deployed + Chrome-tested.
- **Polish arc (5 rounds + follow-ups)**: "Use cases" → "Events"; the media-frame library +
  `/features` retrofit; the interactive demo (env-gated `NEXT_PUBLIC_DEMO_QR_TOKEN`); event landing-page
  retrofit; the home pass; the enriched `/events` hub; and the whole-app em-dash sweep + the AST guard
  (`no-em-dash-policy.test.ts`).

## Foundational build (Phases 0–4 + 6) — pre-2026-06

The v1 foundation: the Supabase-native data layer + RLS (ADR-0001), the single-app route groups
(ADR-0002), browser→R2 presigned uploads (ADR-0003), anonymous-guest capability tokens (ADR-0004), host
auth + the create flow, guest join/upload + galleries, moderation + the purge-cron lifecycle, the
storage-cap tier model + Stripe (Pro subs, Event Pass, portal), and the growth loop (SEO + guest email
capture) + link analytics + the notification center. Full detail is in git history + the ADRs.
