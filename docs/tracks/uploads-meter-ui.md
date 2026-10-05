---
track: uploads-meter-ui
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c06cfaf0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/storage-meter
  - src/components/app/storage/storage-figures
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/queries/month-uploads.ts
  - src/lib/constants/tiers.ts
  - src/lib/billing/plan-facts.ts
---

# lp/uploads-meter-ui

**Goal.** The host sees this month's uploads against her plan's allowance in the storage ring's popover, so the allowance (Free's 300 MB a month, the pass's year, Pro's monthly) is never a surprise.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why** (ROADMAP, crumbs-64's finding): nowhere in the app says a host's uploads this month against her plan's allowance. Ladder A's allowances live in `src/lib/constants/tiers.ts`; the month's uploads are read for the signed-in host by `readHostMonthUploads` (`src/lib/db/queries/month-uploads.ts`, the service role, her `getUser()` id only).

**The work** (recommended placement, Will's to overrule):
- The storage ring's popover on the dashboard (`storage-meter.tsx`) gains one quiet line under the storage figures: "Uploads this month: 1.2 GB of 300 MB" for Free, "this pass's year" for a pass, a month for Pro. The tier's own words come from `tiers.ts`, the one home.
- It reads only on the popover's open, or with the facts the page already reads. Never a poll, never a new call on every dashboard load: the compute budget counts every call.
- Unlimited or unknown says nothing rather than a guess. A failed read omits the line, never a zero.
- A line at or past the allowance takes the warning tone and says what pauses (new uploads, hers and her guests') and when it resumes.

Marketing words stay punchy; the app's words are exact. Wiring rigor: the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **A pass holder's "this pass's year"?** Recommended and built: her line says nothing. A pass counts its year on the pass (`event_passes.uploaded_bytes`, read only by `uploads_used(host, 'event_pass')`, service-role), and the plan sheet's read carries the calendar month's ledger alone (`readHostMonthUploads` asks as `pro` for every tier), so printing it against the pass's 50 GB would be a guess, which the brief rules out ("unknown says nothing"). What would carry it sits outside this lane's paths: two of its `reads` (`month-uploads.ts`, `plan-facts.ts`) and the plan-facts route (Deferred, first line).
- **Which read feeds the line?** Recommended and built: the plan sheet's own, `/api/stripe/plan-facts` through `usePlanFacts(open)`, only while the popover is open: no new route, nothing on the dashboard's load, no poll. Its cost: a Pro host's read also retrieves her Stripe subscription, so her line takes a beat (a breathing placeholder holds its place; the last figure shows at once on the next open), and "Need more?" reads once more for the sheet. A lighter uploads-only route is the fix if the wait is felt (Deferred, second line).
- **Tone before the line?** Recommended and built: only at or past the allowance (the brief's), never a near-the-line amber. Free's allowance is three times its room and the sizes' run from half to twice theirs, so a host meets it only with real churn or a very big month and a heads-up would rarely fire; one constant in `readUploads` if Will wants one.
- **The pause's words?** Recommended and built: "New uploads, yours and your guests', are paused until November 1. Deleting doesn't lower the count." The last clause names the one fix the storage bar above it teaches that does not work here (a delete frees room, never an upload); the wait it names and the popover's own "Need more?" are the fixes that do.
- **Where?** Recommended and built (the brief's): under the storage note and above "See what's using space", through the chart's `door` slot, with no new section or hairline.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`, "The in-app pricing surface": one bullet names the popover's uploads line (where it reads and when, the plan's number, the at-the-line words) and its three silences (a failed read, an unmetered Pro, a pass).

## Deferred (ROADMAP one-liners, bucket named)

- Host: a pass holder's uploads line in the storage ring's popover (it says nothing today: a pass counts its year on the pass and no client read carries that figure): a sibling of `readHostMonthUploads` asking `uploads_used(host, 'event_pass')`, a `PlanFacts` field with its parser and the plan-facts route's answer, then `readUploads` takes the year window and says the pass's own resume (a new pass or a renewal opens a fresh allowance, never a calendar day).
- Host: a lighter read for the uploads line if a Pro host's wait is felt (`/api/stripe/plan-facts` also retrieves her Stripe subscription): `getUser()` plus `readHostMonthUploads` alone on one small route.
- Design: the Library's StorageMeter specimen draws no uploads line (its read answers 401 there, so the placeholder leaves at once): a seam for the figure and a second specimen at the allowance would draw the quiet and the paused states.

## Handoff (replaces the chat report)

- The work commits `510a3ecac` (the line, its words and both test files) and `f247f20a0` (the placeholder holds one text line, the pause's last clause, the billing-caps bullet), pushed to `origin/lp/uploads-meter-ui`; this manifest is the third and last commit, and its head is the chat line. No sync: launch-prep moved after the cut (crumbs-71's export toast, the upload-cancel cut) but nothing that landed touches an owned or read path and nothing would conflict.
- The line, as built: `readUploads`, `uploadsLine` and `uploadsPausedWords` (`src/components/app/storage/storage-figures.ts`); `UploadsLine` and the open-gated `usePlanFacts(open)` (`src/components/app/dashboard/storage-meter.tsx`); the plan's number from `uploadAllowance` and the window from `UPLOADS_WINDOW` (`tiers.ts`, so a window that is not a month reads nothing rather than say "this month"); the paused line is `used >= allowance`, the line the upload advisories read (`ladder_a.sql` 805, 901, 966).
- Pinned by behaviour (three of its rules checked red by mutation: reading on load, the line's `>=`, a pass's window let through): `storage-meter.test.tsx` (nothing asked until the popover opens and one read per open, the last figure kept at the next open, Free and Pro read against their own number, the warning at the line, nothing for a pass, an unmetered Pro, a failed read or a missing figure, the placeholder held only where a line will come) and `storage-figures.test.ts` "the uploads line" (the exact line, never a byte before it, never bytes, December turns to January 1).
- Gates on `f247f20a0` (the code tree; the manifest commit changes no code), each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (924 files, 11,372 tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3131` 0 (159 checks, none failing; scope: the boards drive-export and host-dashboard, the Library and the shell). No `lab:demo`: the lane has no board.
- Local look, on `/design/library/storage-meter` at port 3131 with the page's `fetch` answering for `/api/stripe/plan-facts` (the component and its hook are the real ones; the route is the stub): the quiet line ("240 MB of 300 MB"), the same popover reopened (the last figure at once, then the fresh one), at the line (amber figure, the sentence under it, "paused until November 1"), the breathing placeholder 16 px tall (one text line, so the figure replaces it without a jump), a failed read (the placeholder leaves, the popover 385 to 361 px, no zero anywhere), light and dark (the popover is the display panel in both). The signed-in dashboard cannot run on port 3131 (sign-in is allow-listed to 3000) and this lane may not request the alias, so the live walk is the Orchestrator's.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five owned paths (`storage-meter.tsx`, `storage-meter.test.tsx`, `storage-figures.ts`, `storage-figures.test.ts`, `billing-caps.md`) + this file; no exceptions. The boot's `git fetch` and `git worktree add` ran from the primary checkout as "Agent boot" says, and nothing else did.
- Closes the ROADMAP line "Host: nowhere in the app says a host's uploads this month against her plan's allowance" for Free and Pro; the pass's year is Deferred above.
- Assets requested from Will: none.
- Board ideas: the Plan card on `/account` (`#plan`) could say the same line beside the plan's number from the same `readUploads` (its facts are server reads, so no wait there).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: a pass says nothing for now; the plan sheet's read feeds it (a Pro host's line waits on Stripe's subscription read); at or past the allowance only, no near-the-line amber; the pause ends "Deleting doesn't lower the count."; the line sits under the storage note, above "See what's using space".
- Look at first: the popover on `hi@willgibs.com` (Free) on the alias, the line under the storage note, then willg97 (Pro): its line arrives a beat after the popover. The amber state is pinned in `storage-meter.test.tsx`; live it needs the test host's month ledger at 300 MB (a disposable account only). `lab:smoke` printed a PREMISE notice: the drive-export board's nine open asks describe `storage-meter.tsx`, which now carries one more line; re-read them before his next sitting.
