---
track: crumbs-16
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8cb5f21a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/share/event-share-provider.tsx
  - src/components/app/share/event-share-provider.test.tsx
  - src/app/(app)/account/email-section.tsx
  - src/app/(app)/account/email-section.test.tsx
  - src/components/marketing/help/help-search-signal.ts
  - src/components/lab/board-state.tsx
  - src/components/lab/step.tsx
  - src/components/lab/step.test.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx
  - src/lib/history-state-policy.test.ts
  - content/help/report-a-problem-as-a-guest.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/testing-verification.md
---

# lp/crumbs-16

**Goal.** Fix build 23's HIGH bug at its root (a history call hands Next its own internal state, so Settings rows never open their page in the panel and a page's back arrow never returns), sweep every call with that shape and hold it with a policy test; and apply triage-r2-wiring's relayed help article.

## The brief

**BUG-1 (build 23's live red-team, HIGH).** On the live dashboard a Settings row never opens its page inside the panel, and a page's back arrow never returns to the four rows: the URL gains or loses `&setting=<page>`, but the panel stays where it was (only a deep link or a reload reaches a page). The root cause, confirmed in the code: `replaceSettingsPage` (`src/components/app/share/event-share-provider.tsx`, near line 203) hands `window.history.replaceState` the current `window.history.state`, which carries Next's own `__NA` flag (Next copied it onto the entry `openSheet` pushed). Next 16.2.6 patches both history calls (`node_modules/next/dist/client/components/app-router.js`, near lines 255 and 271): given data with `__NA` or `_N` it treats the call as its own and returns early, without `applyUrlFromHistoryPushReplace`, so `useSearchParams` never sees the new URL. The provider's test stand-in fires on every `replaceState`, which is why no test saw it.

- Fix it at the root: hand Next a fresh state holding only what is ours (the sheet's marker as a field, exactly when the entry carried it, so `closeSheet`'s Back still knows the entry is ours) and let Next copy its own internals, as it already does for `openSheet`. Leave a WHY-comment on what handing it the whole state did.
- Rebuild the stand-in so it models Next's real patch (an early return on `__NA` or `_N`, the URL applied otherwise): the test fails on today's code and passes on the fix, and keeps its scar.
- Sweep every other call that hands `replaceState` or `pushState` the current `window.history.state`: today `src/app/(app)/account/email-section.tsx` (the `email_change` hint), `src/components/marketing/help/help-search-signal.ts`, and the lab's `src/components/lab/board-state.tsx`, `src/components/lab/step.tsx` (two) and `src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx`. For each, judge whether a `useSearchParams` or `usePathname` reader needs the change, or whether Next's stale copy of the URL could bring a removed parameter back on its next navigation; fix the ones where it matters, and say in a WHY-comment why any that stays is safe.
- Hold the shape with a policy test beside the repo's `src/lib/*-policy.test.ts` family: it refuses handing `window.history.state` to either call, with an allow-list for any reasoned exception that survives the sweep.
- Doc-check Next 16's guidance on the native history API and shallow routing in `node_modules/next/dist/docs/` first (AGENTS.md: this Next differs from your training data).
- Verify in a real Next runtime, because the unit stand-in cannot prove Next's patch. A signed-in host dashboard cannot run on localhost (`docs/systems/testing-verification.md`), so drive the provider where it renders under `next dev` (a Library specimen that mounts it, or a small harness of your own under `src/app/(dev)/`): a row into its page and the back arrow out, a deep link in and out, and the sheet's Back and close exactly as today. The live check rides the next build's red-team.

**The relayed help article.** `triage-r2-wiring`'s Handoff relayed a rewrite of `content/help/report-a-problem-as-a-guest.mdx` that was never applied: production's copy still says "Reports are anonymous" and "Nothing is removed the instant a report arrives", which the triage rebuild made false (a photo's own Report, five kinds, a confirmed email, the instant hide on the worst kind). The whole new article is `/Users/gibby/local/ai/partyreel-wt/_scratch/triage-r2-wiring/report-a-problem-as-a-guest.mdx` (outside the repo; read it there), checked then against the help tests. Apply it, run the help tests and the policies that landed since (`crumbs-14`'s capitalized-phrase guard among them), fix only what they name, and check each claim against what shipped (`git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md`). Help tracks shipped reality; marketing and legal words are not yours.

**Not yours:** NIT-1 (one extra welcome step after the shut door's ask) waits for the next crumbs lane with the red-team's other findings; the door routes are `crumbs-15`'s.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
