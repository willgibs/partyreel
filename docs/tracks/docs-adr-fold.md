---
track: docs-adr-fold
status: handed-off
cut: "44090827"          # Round 2 of the revamp, the docs diet (2026-09-16)
board: none
owns:
  - docs/adr/
  - docs/systems/
  - docs/SYSTEMS.md
  - docs/PRICING.md
  - docs/specs/reel-v1.md
  - docs/perf/
  - docs/decisions/t1-
  - docs/decisions/t2p5-marketing-ia.md
  - docs/decisions/rpc-suite-blocked.md
reads:
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - docs/design/README.md
  - docs/PROGRAM.md
  - docs/CHANGELOG.md
---

# lp/docs-adr-fold

**Goal.** Fold the 25 architecture decision records into the system docs and delete the directory, so
the repo has one home for every fact (Will, 2026-09-16: "we're over-indexing the importance of archival
documentation"; docs handle "anything active"; history is "highly limited to very recent work" and
"the git history holds the rest"). For each ADR: every invariant that is STILL TRUE becomes one
dateless line under the owning system doc's invariants (or its existing section), in the doc's own
voice, with no provenance clause; a fact the doc already states gets no second line; a decision that a
later change superseded gets nothing (the CHANGELOG and git hold it). The mapping: 0001, 0004, 0014,
0016 → `database-security.md`; 0002 → `architecture.md`; 0003, 0018 → `uploads-and-r2.md`; 0005,
0006 → `marketing-content.md`; 0007, 0008, 0010, 0015, 0017, 0022 → `guest-flow.md`; 0009 →
`notifications.md`; 0011 → `auth-accounts.md`; 0012, 0024 and 0023's reel rulings → `host-app.md`;
0013 → `durability-backups.md`; 0019 → `profiles-social.md`; 0020 → `trust-safety-forensics.md`;
0021, 0025 and 0023's billing rulings → `billing-caps.md` and `docs/PRICING.md`. Then sweep every
"(ADR-00xx)" and `adr/` citation inside your lane (`docs/systems/`, `docs/SYSTEMS.md` loses its ADR
column, `docs/PRICING.md`) to the plain fact or a link to the system doc's section; delete
`docs/adr/` whole (the root `README.md`'s ADR row is the Orchestrator's, dropped at the merge). The same treatment for the rest of your lane: the five
`docs/decisions/t1-*` and `t2p5-marketing-ia.md` tombstones and `rpc-suite-blocked.md` (its two
still-useful lines go in Handoff as ROADMAP one-liners, since the ROADMAP is the Orchestrator's);
`docs/specs/reel-v1.md` (its settled scope and style catalog fold into `host-app.md`'s reel section,
compressed; the file goes); `docs/perf/v1-baseline.md` (one Handoff line gives the Orchestrator the
ROADMAP pointer `git show <your cut>:docs/perf/v1-baseline.md`; the file goes). Not in this round: the
narrative strip of the four heavy system docs (a second lane, after you) and `docs/decisions/design-record.md`
(code still reads it; it leaves with the Library's record pages).

**Binds.** The doc contract in CLAUDE.md "Keeping the docs healthy" (every fact one home; edit in
place; nothing under docs/ is history). ★ NEVER rename or delete a heading in `design-system.md` or
`marketing-content.md`: `touchpoints.ts` anchors these by slug and `docs.test.ts` refuses a missing one
(`#the-identity-achromatic-media-is-the-color`, `#the-shipped-light`, `#light-spill-beam-and-the-lamp-set`,
`#type-the-heading-face-the-tiered-scale`, `#rounding-sharp-surfaces-round-actions`,
`#the-floating-layer-contract`, `#elevation-contract-one-depth-technique-per-mode`,
`#the-arrival-choreography-phase-45-ratified-calm-700ms`), and `docs.test.ts` pins the ★ landmine
blocks' shape (a ★ opens a bullet; a ★ mid-sentence is prose). `docs.ts` reads `design-system.md`,
`marketing-content.md` and `docs/specs/*.md` by path: the six board specs stay. No em-dashes in any
line you write. Keep every edit surgical: the `lab-catalog` and `lab-sweep` tracks run beside you and
may refine a system-doc line for a fact in their lanes, and the Orchestrator reconciles at the merge.

**Verify on.** `pnpm test` green (the doc readers: `docs.test.ts`, `links.test.ts`,
`legacy-routes.test.ts`); `grep -rn "ADR-00\|adr/\|reel-v1\|perf/v1-baseline\|decisions/t1\|rpc-suite" docs README.md`
empty except a `git show` pointer; the Library's doctrine pages for the two design docs render on a dev
server (`/design/library/doctrine/design-system`, `.../marketing-content`) with their anchors intact.

**Discipline on this machine.** Four agents at once is the ceiling: one process at a time; a dev server
only for the render check, on a port of your own, killed by PORT (`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`),
never an unscoped `pkill`; never `[preview]` or `[ci]` in a commit message; stage files explicitly;
the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit.

**Questions.**

1. **The root `README.md` line 24 ("Understand a key technical decision → `docs/adr/`") now points at a
   deleted directory, but `README.md` is not in `owns` and the goal calls that row the Orchestrator's.**
   Answer taken: leave it, and drop or repoint it in the merge commit. The "Verify on" grep therefore
   still reports that one line; everything else it covers is clean. Recommended replacement row:
   "Understand a system + its invariants → `docs/SYSTEMS.md`", since the ADR row's question is now
   answered by the system docs.
2. **Two of 0008's facts belong to `auth-accounts.md`, not `guest-flow.md`.** The OTP mechanics (code
   first, the magic link as fallback, the iPhone-PWA reason, `<EmailSignIn>` owning no navigation) and
   the Supabase template prerequisites answer "how does anyone sign in", which is auth-accounts' own
   question, and guest-flow already points there. Answer taken: the one-home rule outranks the
   per-ADR mapping; the guest-specific half of 0008 stayed in guest-flow.
3. **`docs.ts` still filters out `reel-v1.md` and `docs.test.ts` still names it.** Both are in `src/`,
   outside this lane, and both still pass with the file gone. Answer taken: left alone; a lab lane or
   the Orchestrator can drop the dead filter, the comment above it, and the test title.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

Read each by eye against code; every line is a fold of a deleted record, never a new claim.

- **`database-security.md`** ADDED: ★ every SECURITY DEFINER function pins `set search_path = ''` and
  fully-qualifies object names, no dynamic SQL (Invariants, first bullet); the trigger-only functions
  keep EXECUTE revoked and still fire because a trigger runs as the table owner (the service-role-only
  advisor bullet); migrations are immutable history and the filename IS the applied version (Workflow).
  SWEPT: 15 citations to the plain fact; the See-also's three ADR links.
- **`architecture.md`** ADDED: the `(app)` layout's `getUser()` is convenience routing and not the
  boundary, plus the add-a-route rule; one domain is the growth loop, so the root layout stays minimal
  and each group carries its own chrome. SWEPT: the heading's ADR suffix, the blockquote's `adr/`
  pointer, three inline citations, the See-also list.
- **`uploads-and-r2.md`** ADDED: `create_media*` re-checks the key's `events/<event_id>/%` prefix and
  raises `bad_key` (the `create_media*`-is-the-only-write-path invariant); the export zip's store
  method, the `client-zip` judgment, synchronous streaming for zero temp storage, and tokens that are
  not single-use by design (Gotchas). REFINED: the belt-and-braces CHECK now names its `[0, 10 GiB]`
  bounds instead of a commit hash. SWEPT: 11 citations.
- **`marketing-content.md`**: ADDED (Gotchas, two bullets): a public form's row is authoritative and
  its email best effort (`sendOnce`, `dedupeKey` = the row id, `replyTo` = the submitter), no anon
  surface, the `website` honeypot returns success without storing, `SUPPORT_EMAIL` displays while
  `CONTACT_NOTIFY_EMAIL` routes, Resend Inbound deliberately unused; the MDX pipeline is in-repo by
  choice (publishing is a deploy), `@next/mdx` rejected for being unable to list by frontmatter,
  `blockJS` stays on so numbers ride spec components, never MDX untrusted input, one in-repo `slugify`
  and no `rehype-slug`. NO heading was touched; both doctrine anchors verified live. SWEPT: 4 citations.
- **`guest-flow.md`** ADDED: a link and an event password are BEARER credentials, with what follows
  (Invariants); `set_event_password` is the only path INTO `visibility='password'` and `clear` reverts
  only FROM it, and the unlock cookie fails closed with no secret; the `guests` table deliberately has
  no unique `(event_id, user_id)`; Supabase anonymous sign-ins stay OFF and the account layer augments
  rather than replaces; why guests are meant to take the mp4 away. SWEPT: 10 citations, two `##`
  headings lost their ADR suffix (nothing anchors guest-flow headings).
- **`auth-accounts.md`**: ADDED (Gotchas): ownership is proven before a password is ever written and
  `signUp({email,password})` is avoided, with no recovery template and no `type:'recovery'` branch,
  plus the accepted magic-link-loses-intent edge; the OTP leads with the CODE and why, and
  `<EmailSignIn>` owns no navigation. EXTENDED the dashboard-lockstep bullet: both templates must carry
  `{{ .Token }}`, "Allow new user signups" stays ON, and the apex `/auth/callback**` allow-list entry.
  SWEPT: 4 citations.
- **`notifications-analytics-growth.md`** ADDED: `saved_events` is PK'd on the pair with both FKs
  cascading, and saving stays free because it is the reason a visitor makes an account; why
  `album_view` stays in the enum although only `qr_scan` is recorded. ★ CORRECTED A STALE FACT: the
  guest email capture still described `capture_guest_email` as an anon capability RPC called from the
  browser; it has been service-role-only since the 2026-06-08 server-mediation, reached through
  `/api/guests/capture-email`, which derives the address from the caller's own verified session (that
  derivation is what closed the victim-poisoning vector). Verified against
  `src/app/api/guests/capture-email/route.ts` and `save-event-button.tsx`.
- **`host-app.md`** ADDED: slugs are mutable with NO redirects, a change or removal frees the old
  string immediately, soft-delete frees it too, a 32-hex slug is refused, and why `/e/<slug>` beat a
  top-level vanity path; THE PRODUCT SHAPE at the head of the reel section (the "wow in between"
  positioning, curated randomness rather than a timeline, the NO MUSIC ruling, free generation with
  full-quality export and the watermark as the lever, the NO end-card ruling, video's self-bounding
  Pro gate with its stills-from-previews and clips-from-originals rule, and the style catalog's one
  source in `engine/style-registry.ts`). PRUNED a stale line: "DEFERRED: guest-facing reel surfacing +
  download" shipped at milestone-2. SWEPT: 11 citations, one heading suffix.
- **`billing-caps.md`** ADDED: ★ reel artifact bytes are exempt from storage metering, why, and the
  one-artifact-per-event bound that makes the exemption safe (pinned by `src/lib/r2/keys.test.ts`), with
  the instruction to re-decide BEFORE per-event reels ever become plural; why cap-stacking for Pro was
  rejected and the narrower rule the gate really enforces (no move may COLLAPSE a cap, which is why a
  live pass may start Pro); why a plan switch routes to the billing portal and the launch consequence
  that follows. EXTENDED the parity invariant with `max_reel_seconds` and the server-side re-derivation.
  SWEPT: 7 citations.
- **`PRICING.md`** ADDED: the ingress meter is a MULTIPLIER of the effective cap so the bound scales
  with revenue, unmarketed and tunable, with admin visibility and a manual override; a marketed number
  can only ever move UP, which is what picks every figure; why 30s and 60s; why the renewal holds at
  $15. SWEPT: 8 citations.
- **`durability-backups.md`** ADDED: the RPO and RTO the three pillars buy, and that Pillar A is what
  protects objects while rows are transiently wrong. SWEPT: the title's ADR suffix, the See-also link.
- **`profiles-social.md`** ADDED: why the guest list has ONE key rather than two (Will's reasoning),
  and the legitimate-interest posture that follows for `/privacy` and the ToS; the four ruled consent
  tiers R5 has to send within. SWEPT: 5 citations.
- **`trust-safety-forensics.md`** ADDED: the hold and preservation machinery serves EVERY abuse
  report, not only the CSAM case; the EXIF gate keeps its "cuts against the marketed strip" reason.
  SWEPT: 4 citations, one heading suffix.
- **`lifecycle-recovery.md`**, **`admin-observability.md`**, **`testing-verification.md`**,
  **`design-system.md`** carry citation sweeps only. `design-system.md` line 905 now reads
  `git show 44090827:docs/perf/v1-baseline.md` instead of a path into a deleted file, and its
  blockquote points at `design-record.md` rather than `adr/`; `testing-verification.md` states the
  isolated-world LCP caveat as a fact rather than a cross-reference. No heading in `design-system.md`
  was touched.
- **`SYSTEMS.md`**: the ADR column is now gone (a three-column router again), the blockquote and the
  intro line no longer promise ADR links, and the reel paragraph names host-app as the home of the
  settled product shape.

## Deferred (ROADMAP one-liners, bucket named)

- **Launch checkpoint** (replaces the dead link in the existing "Committed automated RPC integration
  suite" bullet): the suite is blocked on a direct pg connection. It needs `SUPABASE_DB_URL` (the
  SESSION/direct string on port 5432, never the 6543 transaction pooler) in the three secret places, a
  `postgres` devDependency, and a third vitest project with a DISTINCT include that skips cleanly when
  the var is unset, so `pnpm test` stays green for agents without it; every test runs BEGIN, exercises
  the RPC under `set local role`, asserts, ROLLBACKs, then re-asserts row counts. Full detail:
  `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
- **Launch checkpoint** (same bullet, the alternative): the fully isolated path is the Supabase CLI plus
  the Docker local stack, already pre-wired in `supabase/config.toml` (db 54322, `major_version = 17`);
  pick it only if production-DB test traffic ever becomes uncomfortable.
- **Wherever perf work sits** (optional): the V1 perf baseline and its repeatable method are at
  `git show 44090827:docs/perf/v1-baseline.md`. `design-system.md` already carries this pointer, so a
  ROADMAP line is a convenience rather than a need.

## Handoff (replaces the chat report)

- Head is this manifest commit, sitting on `b00c9a9d` (the last content commit); pushed; synced with `origin/launch-prep` at `e8ce341e`
  (it had moved by one, the 2026-09-16 rulings entry; merged, not rebased).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 warnings, all pre-existing in `src/`),
  test ok (2155 in 223 files), build ok (257 pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 51 paths, every one inside `owns`
  (25 `docs/adr/*`, 6 `docs/decisions/*` deletions, `docs/specs/reel-v1.md`, `docs/perf/v1-baseline.md`,
  16 `docs/systems/*`, `docs/SYSTEMS.md`, `docs/PRICING.md`) plus this file. No exceptions.
- Render check: both doctrine pages 200 on a dev server at :3103, all seven live anchors present in the
  rendered HTML, `#the-floating-layer-contract` still absent as `PENDING_ANCHORS` requires, and the two
  new marketing-content bullets render. Server killed by port.

**The fold, ADR by ADR.**

- **0001 Supabase-native data layer**: kept as `database-security.md` Workflow: "Migrations are
  immutable history: never edit one that has been applied, add a new one." Everything else already
  stated (SQL migrations + RLS + generated types, no ORM, all access via `src/lib/db/*`, generated
  types never hand-edited); the tier-limits-live-in-two-places consequence already lives in CLAUDE.md's
  DRY table and in `billing-caps.md`.
- **0002 one app, route groups**: kept as two `architecture.md` bullets (the gate is routing, not the
  boundary, with the add-a-route rule; one domain is the growth loop and the root layout stays minimal).
  The group listing and the login-in-`(auth)` loop were already stated.
- **0003 browser to R2 presigned**: kept as the key-prefix re-check inside `create_media*`. The
  checksum config, the CORS and ETag requirements, never-expose-keys and `force-dynamic` were already
  stated; "storage accounting cannot see the bytes" is superseded by the R2-HEAD authority.
- **0004 capability tokens**: kept as the ★ `search_path` pin, the trigger-only revoke that still
  fires, and the bearer-credential invariant in `guest-flow.md`. The RPC inventory, the accepted anon
  advisors and "the token IS the authorization" were already stated; the two-token split is superseded
  by 0010.
- **0005 marketing forms**: kept as one `marketing-content.md` Gotchas bullet (row authoritative,
  email best effort, no anon surface, honeypot, display versus routing, no Resend Inbound).
- **0006 MDX pipeline**: kept as one Gotchas bullet (in-repo by choice, `@next/mdx` rejected,
  `blockJS` on, never MDX untrusted input, one `slugify`). The loader, the schema gate and the
  component set were already stated; the `prose-help` dark-mode note lives in `globals.css`.
- **0007 visibility and password**: kept as the state-transition rule on the two password RPCs and the
  cookie's fail-closed posture. The 3-state machine, the open-only anon gate, the admin-read arm and
  the hash never leaving the DB were already stated.
- **0008 account-from-guest**: kept in `guest-flow.md` as the absent unique pair and anonymous
  sign-ins staying off; the OTP mechanics and the Supabase template prerequisites went to
  `auth-accounts.md` (Question 2). The page-level gate is superseded by the entry modal.
- **0009 saved events**: kept as the PK and both cascades, and saving staying free. The two RPCs,
  their masking and their advisor placement were already stated.
- **0010 one link per event**: kept as why `album_view` stays in the `link_hit_kind` enum. One link,
  the dropped `share_token` and the view-only state were already stated; the `/a/` 404 is history.
- **0011 email and password**: kept as the prove-ownership-first rule with no `signUp`, no recovery
  template, and the accepted magic-link edge. `has_password`, the browser-side `updateUser`, the
  generic error and identity linking were already stated.
- **0012 custom slug**: kept as mutable-with-no-redirects, the freeing on change and on soft-delete,
  the 32-hex refusal, and the URL-shape choice. The column lock, the RPCs, the resolver and the live
  availability UX were already stated.
- **0013 durability**: kept as the RPO and RTO. All three pillars, the breaker, the lock, the prune
  and the cost gotcha were already stated; the deferred two-phase quarantine was not carried (the
  breaker covers the catastrophic case, and git holds the idea).
- **0014 data-layer posture**: nothing new: the size authority, the column-lock lesson and the
  venue-safe limiter were already stated, and the function scan folded with 0004. Non-authoritative
  `duration_seconds`/`width`/`height` was already in `uploads-and-r2.md`.
- **0015 display names, `allow_anonymous_uploads`**: nothing new: `auth-accounts.md` and
  `guest-flow.md` already carry the guarded write path, the profanity filter and the inverted toggle.
- **0016 server-mediation**: nothing new beyond naming the CHECK's bounds; this fold is what surfaced
  the stale `capture_guest_email` line (see the system-doc list).
- **0017 gated gallery**: nothing new: the three access levels, the teaser cap, the poll parity, the
  privacy rule and the dismissal table were already stated. The "Radix Dialog, never a drawer" decision
  is SUPERSEDED by the Vaul entry shell, so it was not carried.
- **0018 download all**: kept as the store-method, `client-zip`, sync-streaming and replay bullet.
  The Worker, the signed manifest, the single authz oracle and the caps were already stated.
- **0019 social privacy**: kept as the one-key reasoning, the legitimate-interest posture and the four
  consent tiers. The ruled model itself was already stated.
- **0020 forensics and CSAM**: kept as "serves every abuse report" and the EXIF gate's second reason.
  Capture scope, retention, the hold invariants, the runbook and the NCMEC prep were already stated.
- **0021 pricing numbers**: kept as the multiplier posture, the only-moves-up rule, the 30/60
  reasoning and the renewal's $15 reasoning in `PRICING.md`, plus `max_reel_seconds` in the parity
  invariant. The numbers themselves were already in `tiers.ts` and the tables.
- **0022 reel guest surfacing**: kept as why guests download (`guest-flow.md`) and the NO end-card
  ruling (`host-app.md`). The publish switch, the two placements, the download ladder and the anon
  allow-list were already stated; the tampered-encode acceptance is already in `host-app.md`.
- **0023 QA rulings**: kept as the reel-bytes metering exemption with its bound, the rejected
  cap-stacking, and the portal routing with its launch consequence. Ruling 2 (locked events gate
  uploads) was already stated in both `uploads-and-r2.md` and `database-security.md`; ruling 4 is
  superseded by 0024.
- **0024 studio-first composition**: nothing new: the feed/Studio split, the exclusive Studio, the
  mode-based picker, likes-as-signal-never-membership, the three-chip row and Studio-only reorder were
  all already stated as invariants.
- **0025 event pass economics**: nothing new: the ledger, stacking, the prorated credit, the renewal
  windows and the single-writer recompute were already stated. The "supersedes the banked-term
  fallback" clause left with the record it pointed at.
- **`docs/specs/reel-v1.md`**: its settled product shape folded into `host-app.md` as THE PRODUCT
  SHAPE (positioning, curated randomness, no music, the tier model's reasoning, video's self-bounding
  gate) plus the catalog's two families pointed at `engine/style-registry.ts`. The 14 style ids were
  NOT copied: code is their single source. The Lambda-era sections were historical.

**The citations left OUTSIDE this lane, for the Orchestrator's sweep at the merge.** Every `(ADR-00xx)`
in `src/` is a code comment, and there are 325 of them across 176 files, so what is useful here is the
MAPPING rather than a line list. Each number now means:

| Was | Now means |
| --- | --- |
| 0001, 0004, 0014, 0016 | `systems/database-security.md` (Invariants / the advisor model / Gotchas) |
| 0002 | `systems/architecture.md` "Route groups" |
| 0003, 0018 | `systems/uploads-and-r2.md` (Invariants / Gotchas) |
| 0005, 0006 | `systems/marketing-content.md` "Gotchas" |
| 0007, 0008, 0010, 0015, 0017, 0022 | `systems/guest-flow.md` (the visibility section / Invariants / Joining + identity / the guest reel) |
| 0009 | `systems/notifications-analytics-growth.md` ("Saved events", "Link analytics") |
| 0011 | `systems/auth-accounts.md` "Gotchas" |
| 0012, 0024, 0023's reel ruling | `systems/host-app.md` ("Custom event link", the reel section) |
| 0013 | `systems/durability-backups.md` |
| 0019 | `systems/profiles-social.md` |
| 0020 | `systems/trust-safety-forensics.md` |
| 0021, 0025, 0023's billing rulings | `systems/billing-caps.md` + `PRICING.md` |

The named, non-comment ones worth fixing by hand:

- `README.md:24`: the ADR row (Question 1).
- `docs/ROADMAP.md`: 11 lines: `84` (ADR-0023 link), `167` (ADR-0019), `174` (ADR-0025), `190`
  (`specs/reel-v1.md` link + ADR-0022/0024), `198` (ADR-0019 link), `235` (ADR-0020 D2), `239`
  (`decisions/t1-forensic-csam-policy.md` git pointer, still valid as a pointer), `243` (ADR-0020 C2),
  `250` (ADR-0023 1b, which is now `billing-caps.md`'s portal-routing bullet), `257` (ADR-0021, now
  `PRICING.md`'s multiplier bullet), `273` (`decisions/rpc-suite-blocked.md` link, now a dead link,
  replaced by the Deferred lines above).
- `docs/decisions/design-record.md`: 4 lines (`395`, `399`, `401`, `404`); explicitly out of this
  round, so left as is.
- `src/app/globals.css:5`: "see docs/perf/v1-baseline.md section 5" is now a dead path; the live
  pointer is `git show 44090827:docs/perf/v1-baseline.md`.
- `src/lib/reel/engine/constants.ts:2`: "(see docs/specs/reel-v1.md)" now means `host-app.md`'s reel
  section.
- `src/lib/r2/keys.test.ts:128`: the describe string "ADR-0023: one artifact per event, unmetered"
  now means `billing-caps.md`'s reel-bytes exemption; the test itself is the pin that bullet cites.
- `src/app/(dev)/design/_data/docs.ts:354,366` and `docs.test.ts:277`: the dead `reel-v1.md` filter
  (Question 3).

**Look at first:** the `notifications-analytics-growth.md` capture-email correction (the one place a
fold changed a claim rather than adding one), then `host-app.md`'s new PRODUCT SHAPE block (the only
fold that carries a whole deleted file), then `billing-caps.md`'s reel-bytes exemption.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The 25 architecture decision records were read
against their owning system docs and folded: roughly thirty still-true invariants became dateless lines
in the doc's own voice, the facts a doc already stated got no second line, and the superseded ones (the
two-token split, the Radix-only entry gate, ruling 4's composite, the banked-term fallback) were left to
git. `docs/adr/` went whole, with the five t1 and t2p5 tombstones, `rpc-suite-blocked.md`, the reel-v1
spec whose product shape now opens host-app's reel section, and the v1 perf baseline, now reachable by
`git show`. Ninety-odd citations were swept inside the lane, SYSTEMS.md lost its ADR column, and one
stale claim fell out of the fold: the guest email capture had been server-mediated since June while the
doc still called it an anon RPC.
