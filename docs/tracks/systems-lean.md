---
track: systems-lean
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "45087a69"          # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/SYSTEMS.md
  - docs/systems/architecture.md
  - docs/systems/auth-accounts.md
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - docs/systems/durability-backups.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/profiles-social.md
  - docs/systems/testing-verification.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/systems-lean

**Goal.** The system docs outside the design and guest surfaces keep only what a strong model cannot find or infer (invariants, landmines, project facts, Will's standing rulings), organized for retrieval.

## The brief

**Will's words (2026-09-24, verbatim):** "Any internal docs that offer info or guidelines you wouldn't need anyway (like a Vercel/Next.js rule your already know/get in Context7, or design rules where you can simply check current tokens or components in library/production) are redundant. Also, our history is mostly redundant." And: "as a human, I only read docs for what I don't know. Rereading something I already know is a waste of time. Additionally, I don't read every textbook in existence over again for every task - I target the relevant information. Our docs should flow similarly, where anything included offers an actual benefit, and rather than being dumped in bulk, is organized for retrieval when relevant." And: "every added line distills the rest."

**The job.** Each of your thirteen docs keeps only what a strong model cannot find or infer:
- the invariants and don't-reverts: why a thing is the way it is, where the code alone would invite a "fix" that breaks it;
- the ★ landmines;
- the facts specific to this project;
- Will's standing rulings, as current rules without dates.

**What goes:**
- platform knowledge that current docs give;
- what one read of the code shows: tables of values, file lists, function-by-function walkthroughs;
- history: dates, incident narratives, status words (BUILT, SHIPPED, "was", "used to");
- a fact whose home is another doc (point there once).

When unsure, keep an invariant and cut an explanation. These docs guard against regressions, so a cut invariant costs more than a long line.

**Organize for retrieval.** Each doc opens with the questions it answers. Its sections follow the task that would send someone there. `docs/SYSTEMS.md` stays the index: one line per doc saying when to open it.

**Pointers.** Code comments and other docs cite these files, sometimes by section (`git grep -n "<name>.md"`). Keep a section's name where something cites it, or list each pointer to change in your Handoff, since you own only these docs.

**Found by the docs lane:**
- `admin-observability.md`, "What binds the admin's design (Will, 2026-09-18 and 2026-09-20)": his rulings stay as current rules; the dates go.
- `database-security.md`: "Postgres integer literals are int4" is platform knowledge.
- `testing-verification.md`, "Dev-server CSS (localhost only)": keep the project-specific ★ (worktrees on one port serve each other's CSS) and trim the Turbopack mechanics.
- `durability-backups.md` and `trust-safety-forensics.md`: the status words and dated incident quotes in their headings go.

**Not in this lane:**
- `design-system.md`, `marketing-content.md` and `host-app.md`: the next pass, after the Library changes land.
- `guest-flow.md`: the held reel lane owns it.

**Hand off with:**
- a table per doc: words before and after;
- the kinds of line cut, one example each;
- the invariants and ★ lines kept, counted;
- the pointers to change outside the lane.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` green (the docs tests read these files); every link in a changed doc resolves; the Handoff's before-and-after table.

## Questions (a recommended answer each; the Orchestrator relays them)

- none

## System-doc edits (in place, owned facts only)

- The lane's own thirteen docs (the table below); no system doc outside the lane was touched.

## Deferred (ROADMAP one-liners, bucket named)

- none (the docs point at the ROADMAP lines that already hold their deferred work: the scans' pagination cursor, `crons.disabledAt`, the `admin_actions` log, the analytics vendor, the prune's next cost step)

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/systems-lean`:** the work `690567f0` (the twelve docs and the index) and `9db2f0e8` (two trims); the syncs `3e8ca3d4` (`origin/launch-prep` at `fbc1e512`: brand-kit merged, album-columns cut, CLAUDE.md's docs guidance) and `e5e51ad8` (at `7336788a`: the refresh wave's specs, the Handoff template's board-ideas line). The branch was cut at `45087a69` and fast-forwarded to `91e3696b` before any work (CLAUDE.md, a read, had changed).
- **Gates on the synced tree (`e5e51ad8`), each on its own exit code:** `pnpm typecheck` 0, `pnpm lint` 0 (8 warnings, none in a changed file: only markdown changed), `pnpm test` 0 (434 files, 4,776 passed, 1 skipped), `pnpm build` 0.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the thirteen owned docs, plus this file at the handoff commit. No exception.
- **Links:** every relative link in the thirteen docs resolves (91 checked by script: each `](target)` joined to its file's directory and tested for existence).

**Words and landmines, before and after** (`wc -w`; ★ counts every star; the SYSTEMS.md star is a mention in prose):

| doc | words before | after | kept | ★ before → after |
| --- | --- | --- | --- | --- |
| SYSTEMS.md | 834 | 544 | 65% | 0 → 1 |
| architecture.md | 1,501 | 897 | 59% | 1 → 1 |
| auth-accounts.md | 3,069 | 1,657 | 53% | 12 → 9 |
| billing-caps.md | 3,257 | 2,060 | 63% | 6 → 7 |
| database-security.md | 5,301 | 2,825 | 53% | 22 → 20 |
| durability-backups.md | 1,951 | 1,247 | 63% | 2 → 5 |
| lifecycle-recovery.md | 2,208 | 1,382 | 62% | 8 → 7 |
| notifications-analytics-growth.md | 1,122 | 848 | 75% | 0 → 0 |
| profiles-social.md | 2,549 | 1,332 | 52% | 3 → 3 |
| testing-verification.md | 4,949 | 2,276 | 45% | 16 → 10 |
| trust-safety-forensics.md | 1,403 | 1,168 | 83% | 4 → 4 |
| uploads-and-r2.md | 3,372 | 1,880 | 55% | 6 → 6 |
| admin-observability.md | 4,031 | 2,090 | 51% | 12 → 12 |
| **total** | **35,547** | **20,206** | **57%** | **92 → 84 landmines** |

(`690567f0`'s message says 20,331; the table is the measured figure after `9db2f0e8`.)

**The 92 landmines, accounted for.** 77 keep their own star in place; 1 moved with its fact (the Plan card, auth →
billing); 12 merged into a star that says the same thing (8 of testing's into two blocks, the hidden document and the
untrustworthy screenshot; the guest cookie into "a READ capability only"; the forms' swallow into their fail-closed
star; lifecycle's per-row isolation into admin's; the transition trigger's hold skip into trust-safety's "discreet and
immutable"); 2 were demoted to plain lines in auth (the door's "a confirmed email, not an account" wording and the
failure ladder's `suppress`: copy and UX rules, not silent breakages). 4 lines the old docs already called a landmine
or gotcha in words gained the star (the orphan breaker, the prune's dry-run landmine, the R2 billing donut, the
Realtime no-op). 77 + 1 + 2 blocks + 4 = 84. Every other invariant survives as a bold-led rule line with its reason
(246 such lines across the thirteen docs).

**The kinds of line cut, one example each:**
- Platform knowledge: "Postgres integer literals are int4 … force `2::bigint * 1024 * 1024 * 1024`" (database-security; CLAUDE.md and the Postgres docs hold it). Also the Stripe webhook's `req.text()`, Supabase identity linking, `getAuthenticatorAssuranceLevel()` mechanics, Vercel Analytics quotas.
- What one read of the code shows: every "Where it lives" file list, and walkthroughs such as billing's `activeNowPasses` / `passChainExpiry` / `passWindowForPurchase` / … list or the viewer's swipe-track internals (its header carries them).
- Value tables: admin's thirteen-row jobs table (`jobs/catalog.ts` is its source), durability's failure-points table, the purge cron's twelve sweep names.
- History: "(GitHub Actions run 35717761607, 2026-09-22: "Failed to resolve latest Supabase CLI release…")", "verified 2026-09-23", "QA #36", "DR-drilled", "applied after milestone 27", and the live-dropped `allow_anonymous_uploads` twin.
- Status words: "(BUILT — ships in dry-run)", "(draft — counsel signs before launch)", "(Will handoff — pre-launch …)".
- Picks stated as law: admin's "seven shape rules bind every surface" (the 44px bar, the 232px rail, …), whose invariants stay as rules; "`gate`'s sentence is Will's, verbatim, and changes only by his ruling".
- A fact with a home elsewhere: billing's Stripe MCP runbook (the catalog, both portal configurations, the ten env values, the cutover are PRICING.md's; billing keeps only how to verify), the guest cookie's mechanics (guest-flow.md), the `profiles` column list auth-accounts repeated (database-security.md).

**Pointers outside the lane:**
- Numbered pointers into items no doc numbers (comments only; the mandate sweep's re-grep of "ruling" finds most): `src/app/api/stripe/checkout/route.ts:98`, `src/lib/stripe/entitlement.ts:4` and `entitlement.test.ts:5` ("billing-caps.md ruling 1": now "One plan at a time for Pro; passes stack"); `src/lib/billing/passes.ts:13` ("ruling 1, preserved": the Event Pass ledger bullet); `src/lib/r2/keys.test.ts:120` ("ruling 3": "Reel artifact bytes are exempt from the cap"); `src/lib/constants/tiers.ts:181` ("decision 3"); "profiles-social.md point 2–6" in `attended-events-visibility.tsx:16`, `component-notes.ts:71`, `queries/social.ts:99`, `u/[slug]/page.tsx:255`, `profile-actions-menu.tsx:44`, `sandbox/profile-page/profile.tsx:413`, `notification-prefs-form.tsx:18`, `social/notification-prefs.ts:2`; "trust-safety-forensics.md A3-lite / decision 1 / decision 2" in `forensics/capture.ts:2`, `forensics/request-facts.ts:2,8`, `upload/device-id.ts:2`, `forensics/preserve.ts:2`, `legal-privacy.tsx:169`.
- `docs/ROADMAP.md:342` cites "trust-safety-forensics.md C2": the section is "NCMEC registration". `docs/ROADMAP.md:61` (three headings carry a date) retires: the headings are now "Building a surface", "Pillar B: the media backup" / "The deletion-aware prune", "The CSAM incident runbook" and "NCMEC registration", and no anchor cited the old ones.
- `workers/backup/README.md:22` and `workers/backup/src/index.ts:20` say avatars "move to Supabase Storage in a separate initiative": they already live there.
- Resolve with no change: the migrations' "→ Workflow", "Set-returning functions and the row cap" and "(database-security.md, Gotchas)"; `workers/backup/src/index.ts:296` "Cost & scaling" (the section now exists) and `:76` "scale note"; the Worker files' "Pillar B"; `stream-probe/page.tsx:31` "the streaming contract"; `queries/storage.ts:19` "no plan change leaves a host storing"; `webhook/route.ts:164` "extends, never resets"; `comparison-table.tsx:30` "unmarketed" (billing now says the ingress bound is never marketed). The applied migration `20260708120000_profiles_social_foundation.sql:27` ("4 anon capability RPCs") stays history.

- Assets requested from Will: none.
- Board ideas: none (the pointer sweep above is comment work for the mandate sweep, not a board).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

**Calls his to overrule:**
- The admin's seven shape rules are gone as rules; the invariants inside them stay (a surface needs its NAV entry, one tone map, the destructive sheet's server re-check, the palette never acts, one read per request, a heartbeat never a count, no delta on paid subscribers).
- billing-caps.md's Stripe MCP runbook is cut to "Verifying billing": PRICING.md is the one home for the setup and the cutover.
- The two demoted auth stars, and the four normalized ones, above.
- Three lines were added where a code comment already pointed and the doc was silent: durability's "Cost & scaling", billing's "the ingress bound is never marketed", trust-safety's "the privacy policy and the Terms disclose this capture, so a new column changes their words".

**Look at first:** database-security.md (the most-cited doc: its RPC inventory keeps every name, because migration checks assert the grants "sit where database-security.md says"), then testing-verification.md (the deepest consolidation: 16 stars into 10).
