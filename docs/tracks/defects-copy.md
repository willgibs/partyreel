---
track: defects-copy
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "da64829f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/
  - content/blog/
  - src/components/marketing/
  - src/lib/content/
  - src/lib/constants/
  - src/app/(marketing)/(cinema)/blog/
  - src/app/(marketing)/(cinema)/help/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/marketing-content.md
---

# lp/defects-copy

**Goal.** The published words tell the truth: the claims and help text the ROADMAP names as contradicting the product or bible 20 are corrected at their source, and each closed ROADMAP line is named for retirement.

## The brief

**Why now:** these are open ROADMAP "Now" lines that state a defect against a rule already on record (the bible, the identity model, the shipped product), not a product decision. Each line is quoted below with its file references; check every one against the code before you change anything (a line can be stale), fix it at its source, and list in the Handoff the exact ROADMAP line each fix closes so the Orchestrator retires it. Where a fix would need a product or copy decision the line does not make, take the recommended answer given here, build it, and list it as his to overrule; never invent a decision the brief does not give. Everything is unprotected (Rising Tides), but this lane fixes defects: it does not redesign.

**The lines (from `docs/ROADMAP.md`'s Now list):**
1. `/blog`'s closing band promises "No app or account for your guests." (`src/app/(marketing)/(cinema)/blog/page.tsx:52`), which bible 20 refuses ("Never promise 'no account': a host may require one"); `content-policy.test.ts` misses it. Fix the line ("No app required." is the shipped wording) and teach the policy test the phrase if it can without pinning copy.
2. `/pricing` and `llms.txt` sell the public host page as paid (`comparison-table.tsx` "Public host page" off on Free, `unlock-grid.tsx` "Free hosts stay unlisted.", `plan-cards.tsx`, `pass-card.tsx`, `llms.ts`), while a handle and "Show on my profile" are free on every plan (`profile-slug-control.tsx`; no tier check in `setProfileSlug` or `setEventSocialSettings`): redraw the paid list to what is actually paid (`src/lib/constants/tiers.ts` is the single source).
3. One word for the bin: the app, its storage meter and its lifecycle emails say "Deleted"; the marketing pages and blog posts say "the Trash". Use "Deleted" in every file you own, `src/components/marketing/sections/features/album/album-copy.ts:154,169` included (the help guide already allows only "Deleted"); leave the legal documents' "recovery bin" alone (legal wording waits for counsel) and name it in the Handoff. The app's own strings are `defects-app`'s.
4. The "no expiry" durability lines (`src/lib/constants/about.ts` "Albums do not expire…", the privacy page's `media-lives.tsx` "The album stays up until you delete it.") leave out the Free plan's inactivity removal: make each true, as the help guide's rule 7 reconciles it.
5. Help: `content/help/hide-remove-and-restore.mdx` says Remove is "permanently deleted after a short grace period" beside its own 30 days in Deleted: make it one true statement from the lifecycle constant.
6. Help: `content/help/save-an-event-and-find-your-uploads.mdx` lists Uploads and Likes on the dashboard, but they live in the profile's owner mode (`src/app/(guest)/u/[slug]/owner-sections.tsx`): make the article match the code.
7. Help: ten article descriptions type a marketed number no spec component can reach in frontmatter (`hide-remove-and-restore`, `how-long-media-is-kept`, `moderate-and-curate-your-album`, `password-protect-your-event`, `what-happens-when-storage-fills-up`, `turn-off-uploads-or-cap-file-size`, `what-the-free-plan-includes`, `how-long-an-event-pass-lasts`, `pro-vs-event-pass`, `what-you-can-upload`): recommended, a test that ties each typed number in a description to its constant (so a changed constant fails the build rather than lying), falling back to taking the number out where no constant exists.
8. Stale comments in your files: `spec-shared.tsx`'s Steps header ("the mono numeral rail", "mono BY RULING"; the numerals are the UI face's tabular figures, bible 7), `help/page.tsx` ("nine categories"), `blog-tags.ts:6` ("one of each at most"; two purposes are legal).

No em-dashes; never pin copy with a test (a test may tie a number to its constant, which is a fact, not a look).

`src/lib/constants/tiers.ts` sits under your `owns` but is the single source of pricing and limits (mirrored by `public.tier_limits()`, a parity test guards it): read it, never edit it. Read `content/help/AUTHORING.md` and `content/blog/AUTHORING.md` (yours) before editing an article.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- Item 2's fourth "unlock" tile (`unlock-grid.tsx`) and the Pro card's freed bullet (`plan-cards.tsx`/`pass-card.tsx`) needed a real replacement for the false "public host page" claim; recommended and built: **Unlimited events** (`tiers.ts`'s own comment calls `MAX_EVENTS` "the free→paid wall") for the tile, **no idle cleanup** (comparison-table's own "Idle cleanup" row: Free sweeps an inactive event, paid never does) for the two cards. His to overrule.
- `content-policy.test.ts` sits at `src/lib/content-policy.test.ts`, outside this track's `owns` by strict path prefix (`src/lib/content/` needs the slash; this file is `src/lib/content-policy.test.ts`). The brief names it directly for item 1's test; built as the one lane exception (no other track's `owns` claims it either). His to overrule if it should move or be re-owned.

## System-doc edits (in place, owned facts only)

- none: `docs/systems/marketing-content.md` isn't in this track's `owns`, so no edit made even though items 2-4 touch facts it states (its "Never promise 'no account'" and "public host page" write-ups already match the fixed code; no correction needed there).

## Deferred (ROADMAP one-liners, bucket named)

- Help-sync: `content/help/your-dashboard-explained.mdx` carries the same stale `<Path>Account menu › Dashboard</Path>` breadcrumb that `save-an-event-and-find-your-uploads.mdx` had (the account menu has no Dashboard item; the logo is the door); left alone since that file has its own unrelated, already-filed help-sync line (billing) waiting for a dedicated pass, and a drive-by fix here risks colliding with it.
- Marketing: `src/components/marketing/faq-data.ts`'s "How long do you keep my photos?" answer carries a dated "R4 truth ruling A2" comment reconciling only the Event Pass exception; rule 7 (the Free-plan inactivity removal) postdates that ruling and isn't mentioned. Left as ruled rather than overridden unilaterally; worth a look now that rule 7 exists.
- Marketing: the same "no expiry" pattern items 2/4 fixed also appears, unfixed, on `/events/weddings` and `/events/trips` (`src/lib/constants/events.ts`, four lines: "no expiry clock counting down on your wedding/trip memories") with no nearby reconciliation on those pages. Out of scope here (not one of this round's eight lines, and a fresh sweep of `/events` copy is its own task); flagging so it doesn't hide.

## Handoff (replaces the chat report)

- Work commit `b90caba9`; sync-merge commit `655e28e9` (`origin/launch-prep` had moved: `guests-grant-tidy` merged at `39aa374b` after this branch's cut, touching only `supabase/migrations/`, `api/guests/capture-email/`, `migration-guards.test.ts` and four docs — zero overlap with this lane's `owns`, merge was clean). The head is in the chat line.
- Gates on the synced tree, each its own exit code: `pnpm design:rules` 0 · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 pre-existing warnings, all in files this lane never touched) · `pnpm test` 0 (350 files, 3861 passed, 1 pre-existing skip) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3133` 0 (483 checks, 0 failing). Visually verified live (Chrome, 1440) on `/pricing`, `/blog`, `/about`, `/features/album`, `/features/privacy`, `/features/curation`, and both rewritten help articles; the new copy reads clean with no overflow or wrap regressions.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 26 files under `owns` + this manifest, plus the one named exception (`src/lib/content-policy.test.ts`, above).
- The items, one line each (ROADMAP "Now" line closed, verbatim, or the finding if it was stale):
  1. Closes: `` `/blog`'s closing band promises "No app or account for your guests." (`src/app/(marketing)/(cinema)/blog/page.tsx:52`), which bible 20 refuses; `content-policy.test.ts` misses it. `` Fixed to "No app required."; added a `content-policy.test.ts` case banning the "no app ... no account" construction sitewide (comment-stripped so it doesn't flag `marketing-voice.ts`/`trust-strip.tsx`/`ask-ai.ts` quoting the retired line as history).
  2. Closes: `` Pricing: `/pricing` and `llms.txt` sell the public host page as paid (...), while a handle and "Show on my profile" are free on every plan (...): redraw the paid list. `` Confirmed free-for-everyone in `setProfileSlug`/`setEventSocialSettings` (no tier check); corrected `comparison-table.tsx` (now true/true/true), `unlock-grid.tsx`, `plan-cards.tsx`, `pass-card.tsx` and three spots in `llms.ts`.
  3. Closes (this lane's half only — see below): `` Copy: one word for the bin: ... the marketing pages and posts "the Trash", legal "recovery bin"; the help guide allows only "Deleted". `` Swept every marketing/blog/help surface (about 15 files) from "Trash" AND "recovery bin" (a second wrong word the line's own text didn't name but the code had) to "Deleted", `album-copy.ts:154,169` included. Legal's "recovery bin" untouched by design (below). `defects-app`'s app-side instances (`danger-zone-section.tsx`, `create-event-wizard.tsx`) are not in this diff; the Orchestrator should hold this line open until that track lands too, or split it.
  4. Closes: `` Copy: the "no expiry" durability lines (`about.ts` ..., `media-lives.tsx` ...) leave out the Free plan's inactivity removal ... `` Fixed both named lines per rule 7, plus the identical defect found while already in `jsonld.tsx` (item 3) and `llms.ts`/`pricing-faq-data.ts` (items 2/3): each previously asserted "never expires" then contradicted itself a sentence later describing the Free removal.
  5. Closes: `` Help: `hide-remove-and-restore.mdx` says Remove is "permanently deleted after a short grace period" beside its own 30 days in Deleted. `` Now one statement via `<RecoveryDays />`.
  6. Closes: `` Help: `save-an-event-and-find-your-uploads.mdx` lists Uploads and Likes on the dashboard, but they live in the profile's owner mode ...; the article and the code disagree. `` Confirmed in `owner-sections.tsx`'s own header comment and the dashboard page's own comment (both say the move already happened); rewrote the article's dashboard/profile split throughout (five spots said "dashboard" where the code now says profile), including the stale `<Path>Account menu › Dashboard</Path>` (no such menu item; the logo is the door).
  7. Closes: `` Help: ten article descriptions type a marketed number no spec component can reach in frontmatter (...): a test tying each to its constant. `` Built `src/lib/content/help-description-numbers.test.ts`; verified live (temporarily broke one number, confirmed the test catches it, reverted). All ten numbers were already accurate — the test is preventative, not a fix of an existing lie.
  8. Closes: `` Stale comments: `spec-shared.tsx`'s Steps header (...), `help/page.tsx` ("nine categories"), `blog-tags.ts:6` (...). `` All three corrected (tabular-figures-not-mono, ten categories, two-purposes-are-legal).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the two in Questions above (the unlock-grid/Pro-card replacement content; the content-policy.test.ts lane exception).
- Look at first: `/pricing` live (`comparison-table.tsx` + `unlock-grid.tsx`) — the actual paid/free correction (item 2) is the highest-stakes fix in this round, a real product claim was wrong; then `src/lib/content-policy.test.ts`'s new case, the one file outside strict `owns`.
