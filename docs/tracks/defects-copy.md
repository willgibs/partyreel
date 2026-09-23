---
track: defects-copy
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
