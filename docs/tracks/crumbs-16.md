---
track: crumbs-16
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # added at boot (2026-09-29): the one stand-in every history test reads, so the drift guard has one home
  - src/lib/test-utils/next-history.ts
  - src/lib/test-utils/next-history.test.tsx
  # added while building (2026-09-29): the lab's URL write had no test of its own; its first-commit order is the whole point
  - src/components/lab/board-state.test.tsx
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

Each recommended answer is BUILT and his to overrule; none is a one-way door.

- **No call in the sweep stays an exception: the lab's four writes tell Next too.** The brief left room for a
  reasoned exception; measured under `next dev` on the real lab, none holds. `useLabState()` is Next's
  `useSearchParams` and it feeds `CopyLink` and every sticky link, so a `session` or card the writes never told Next
  about left Copy link naming the last URL Next had seen; and `router.refresh()` rewrote the bar to that stale URL
  (walk the desk two steps, refresh: the bar returned to the first). `replaceState(null, ...)` costs no server round
  trip (no `_rsc` request) and, written after Next's patch, leaves `__NA` and the tree on the entry (Back through it
  did not reload). The policy test's allow-list stays empty. The overrule: keep the lab's writes router-silent, one
  allow-list entry each with its why, and `CopyLink` reading the address at the click.
- **Three writes run on a page's first commit, so each waits one microtask** (the account's email hint, the catalog's
  card, and `board-state`'s `setState` when a step lands). A child's effect runs before its parent's and Next installs
  its patch in the Router's effect, so a `null` handed from a mount effect meets the browser's own `replaceState` and
  empties the entry's `__NA` and tree (measured: `history.state` was `null` after loading
  `/design/lab/locked-door?session=...`; Next's `onPopState` ignores a later Back onto such an entry, and Next never
  heard the URL). That is what lab-tides saw and answered by keeping the entry's own state, which is the bug itself. A microtask runs after
  the whole flush of the commit's effects. The stand-in's router installs its patch after its children's effects, so
  the order is under test. The overrule: a helper that senses the patch (the history function no longer reading
  `[native code]`) and writes at once when it is there.
- **A `router.refresh()` drops the sheet's marker, and the provider now remembers what it pushed.** Measured on the
  real router: Next's refresh rewrites the entry with `__NA` and the tree alone, and Settings refreshes (the reel
  switch), so closing the panel afterwards took the bookmark path (`replaceState`) and left a duplicate dashboard entry
  behind ("Back" once appears to do nothing). It is outside the brief's letter (the sheet's close "exactly as today"),
  in the same file and the same verification; built: `pushedRef`, forgotten when the sheet closes however it closed,
  and the marker put back on a page's replace. A reload drops the marker too (Next's first commit rewrites the
  entry without it) and a new page remembers nothing, so a panel reloaded onto still closes by replace; not answered
  here (Deferred). The overrule: marker only, and a ROADMAP line.
- **A refresh followed by a URL-applying write within about 20ms makes Next reload the page; accepted.** Measured on an
  entry the provider pushed, under `next dev`: `router.refresh()` then a settings page's replace in the same tick or
  20ms later hard-navigates onto the same URL (3 of 3); 60ms later, the other order, a deep-linked entry and a server
  render slowed to 1.2s do not (the window is the refresh's first commit, not its round trip). `openSheet`'s push does
  the same (3 of 3) and always did, so this is Next's, not the fix's: before this lane the page's replace was silent to
  Next and never met it, and now it can. No product code refreshes and moves the panel in one handler (the reel switch
  refreshes after an awaited action, and `host-album.tsx` says nothing refreshes the hub), so a tap has to land inside
  a few tens of milliseconds after a refresh begins. Built: accepted, with a WHY-comment in the provider naming the
  edge. The overrule: open and close a page through `router.replace` (Next orders its own actions; it costs a server
  round trip per page, which the panel would wait for).
- **The relayed article says "we may write to the address you confirmed"; nothing writes to a reporter today.** Ask for
  proof's mail waits behind `ops_flags.report_proof_mail_enabled`, seeded OFF (his yes flips it). Built: the sentence
  stays in the form's own words ("We'll write only if we need more from you", `report-dialog.tsx`), so the article
  never says more than the shipped form does. The overrule: drop the sentence until the switch is on.
- **A video's form is titled "Report this video".** The relay says "photo" throughout; built: the article says the form
  is titled for what is reported (a photo, or the event from the page's foot) and to open "the photo or video", which
  holds for a video too.

## System-doc edits (in place, owned facts only)

- `host-app.md`, the two places' bullet (a one-line exception, it is in `reads`): "the marker is a FIELD on the state
  Next merges ... replacing the state wholesale turns Back into a full reload" becomes the rule the policy test
  holds (a fresh object or `null`, never `window.history.state`, and why), the mount-effect microtask, and a close that
  goes Back when the marker is ours or this page pushed the entry (a refresh drops the marker, and so does a reload,
  after which a panel closes like a bookmark's).

## Deferred (ROADMAP one-liners, bucket named)

- Help: the host's article `reporting-and-safety.mdx` still describes the pre-triage report (its line 33: the form
  "covers the event as a whole", "Reports are anonymous"; its line 39: "nothing is taken down automatically the
  moment one arrives", against a confirmed child-abuse report that hides at once; and its "never reaches your Deleted"
  against `hide-remove-and-restore.mdx` line 42, "It shows in Deleted"): a photo has its own Report now, and the guest
  article this lane applied links to it (from `crumbs-16`).
- Host hub: a double tap on Settings (and, by the same code, Share) pushes two entries (`openSheet` never checks the
  sheet is already open), so the first close goes Back to the panel still open and the second closes it (measured under `next dev`);
  and a reload drops the sheet's marker, so a panel reloaded onto closes by replace and leaves one duplicate entry:
  both want the fact "this entry is ours" to outlive what holds it today (from `crumbs-16`).
- Guest: Next reloads the page when a `router.refresh()` is followed within ~20ms by a write that applies a URL on an
  entry the client pushed (measured on the provider's `openSheet`); no caller was audited for a handler that refreshes
  and writes the address together, and `guest/event-experience.tsx` refreshes the most (from `crumbs-16`).
- Popups: `ui/popup-back.ts` keeps a marker on the entry that a `router.refresh()` rewrites away, so, by reading, a
  phone's place-shaped popup closed after a refresh skips its `history.back()` and leaves a dead entry; the provider's
  `pushedRef` is the shape of the fix (not driven at phone width) (from `crumbs-16`).
- Lab: `lab:demo --board demo-framing` fails `demo-framing.names` with "Page.navigate did not answer in 60000ms" on this
  lane's tree AND with the base's own lab files (the other boards press fine); not looked into (from `crumbs-16`).
- Lab: `CopyLink` builds from the six lab params, so a board's own switches (`?welcome=gate&was=dom`) never ride the
  copied link though the address bar holds them, against `board-state.tsx`'s "the URL is the share format" (from
  `crumbs-16`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/crumbs-16`:** `daa95533` owns widened and the questions · `d1175c97` the fix, the sweep, the
  stand-in, the policy test, the relayed article and host-app.md's bullet · `cd3b596f` the provider's header names what
  a reload and a refresh-then-write do (measured) · `66abfefc` three comments say only what was measured · and this
  manifest. **No sync:** launch-prep moved (crumbs-15
  `7bc20d9e` and records) but nothing in my owns or in a read's code; `docs/systems/host-app.md` took crumbs-15's one
  line in a region I did not touch, and `git merge-tree` of my head against `origin/launch-prep` is clean.
- **Gates, each on its own exit code, on `cd3b596f`** (logs in `../partyreel-wt/_scratch/crumbs-16/gate3-*.log`):
  typecheck 0; lint 0 (no warnings); `pnpm format --check` 0; test 0 (603 files, 7,007 tests); `build-lock.sh pnpm
  build` 0; `lab:smoke --base http://localhost:3133` 0 (scope all: the lab's shell or kit changed; 171 checks). No
  board, so the gate's `lab:demo` step does not apply; run anyway on the boards whose walks this lane's write moves:
  disposable-mode (8 steps), locked-door (4) and press-page (1) press 13 of 13 ok (`labdemo.log`, `labdemo3.log`);
  demo-framing.names times out on `Page.navigate` here and on the base's own lab files alike (Deferred). `66abfefc`
  (comment-only edits to `help-search-signal.ts`, the policy header and `next-history.ts`) followed the gate: format,
  typecheck, lint and the 28 test files of the areas it touches re-ran on it (292 tests, green).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths + this file, and one exception,
  `docs/systems/host-app.md` (the two places' bullet, refined in place; it is in `reads`, listed above).
- **Items** (the runtime evidence is `../partyreel-wt/_scratch/crumbs-16/runtime-before.md`):
  - **BUG-1 at its root** (`event-share-provider.tsx`): a page's replace hands Next a fresh object holding the marker
    exactly when the entry is ours, with the WHY-comment on what handing it the whole state did. Under `next dev`
    before: the bar gained `&setting=door`, `useSearchParams` stayed on `room=settings`, the page stayed on the rows,
    the back arrow never returned, a refresh put the old address back. After: a row into its page, the back arrow out,
    a deep link in and out, the browser's Back closing the whole panel from a page and Forward bringing it back, no
    reload, the close as today.
  - **The stand-in is Next's patch** (`src/lib/test-utils/next-history.ts`): the early return on `__NA` or `_N`, the
    URL applied otherwise, the router's own copy of the address, both kinds of commit (a refresh drops custom state),
    and `<NextRouterStandIn>`, whose effect installs the patch after its children's as Next's Router does.
    `next-history.test.tsx` reads Next's `app-router.js`, `segment-cache/navigation.js` and `refresh-reducer.js` and
    fails when the ported code changes.
  - **The provider's test on it** (`event-share-provider.test.tsx`): four tests fail on today's code
    (`provider-test-before-fix.log`) and pass on the fix (`provider-test-after-fix.log`); its scar (the stand-in that
    fired on every call) is in the file's header.
  - **A refresh drops the sheet's marker** (found by the runtime pass, fixed): the provider remembers what it pushed
    (`pushedRef`), so closing after the reel switch's refresh goes Back instead of leaving a dead entry; tested.
  - **The sweep, all seven calls, none an exception:** `email-section.tsx` (its hint came back on the refresh a
    finished change makes), `help-search-signal.ts`, the lab's `board-state.tsx`, `step.tsx` (two) and
    `review-session.tsx` (the shell's `useSearchParams` feeds `CopyLink` and the sticky links; on the real desk a
    refresh returned the bar to the first step; fixed and held on a production build too).
  - **Three of them write from a mount effect, so each waits one microtask** (the email hint, the catalog's card,
    `board-state`'s `setState` when a step lands): a plain `null` from there met the browser's own `replaceState` and
    emptied the entry's `__NA` and tree (`history.state` was `null` after loading a board). Each is pinned inside
    `<NextRouterStandIn>` and fails on the old code and on a plain `null` (`email-section.test.tsx`, `step.test.tsx`,
    and the new `board-state.test.tsx`). lab-tides' comment that kept the entry's state is corrected.
  - **The policy** (`src/lib/history-state-policy.test.ts`, 31 tests): refuses `window.history.state`, a spread, a
    clone or an alias handed to either call; an empty `ALLOWED` that cannot outlive its reasons; on the original tree
    it names exactly the seven calls above.
  - **The relayed article** (`content/help/report-a-problem-as-a-guest.mdx`): applied from the relay, each claim
    checked against `report-dialog.tsx`, `kinds.ts`, the viewer's capsule (`media-lightbox-parts/actions.tsx`),
    `/api/reports` and `reporter.server.ts` (the alert), two lines made to hold for a video; the help tests and the
    policies since (crumbs-14's capitalized-phrase guard among them) pass (`help-tests.log`: 57 files, 551 tests).
  - `docs/systems/host-app.md`: the two places' bullet says what the policy holds, the microtask, the marker's
    fate across a refresh and a reload.
- **Assets requested from Will:** none.
- **Board ideas:** the lab's `CopyLink` drops a board's own switches (Deferred); nothing else.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule, one line each** (the Questions above hold the reasons):
  - the lab's four writes tell Next (no exception); the overrule keeps them router-silent behind allow-list entries.
  - three first-commit writes wait a microtask; the overrule is a helper that senses the patch.
  - the provider remembers what it pushed (outside the brief's letter, same file); the overrule is marker only.
  - a refresh then a URL-applying write within ~20ms reloads the page (Next's; `openSheet` always could); accepted.
  - the article keeps "we may write to the address you confirmed" in the form's own words (the mail is OFF).
  - the article says "titled for what you're reporting" and "photo or video".
- **Look at first:** the live walk on the next build's red-team, as a signed-in host on a disposable event: (1) Settings,
  tap "Who can get in": the page opens in the panel and the address gains `&setting=door`; the back arrow returns to
  the four rows; the same for the other three; (2) on a page, reload: it lands on the page; the browser's Back closes
  the whole panel, Forward brings the page back; (3) the Guests room's door link (`?room=settings&setting=door`):
  straight onto the page, the back arrow to the rows, the X leaves `/dashboard/<id>` alone in the address; (4) turn the
  highlight reel's switch, close the panel, press the browser's Back once: it leaves the album (no duplicate entry);
  (5) account: change the email, tap the mailed link (`/account?email_change=half`): the address loses the parameter,
  and stays clean through the second code's refresh; (6) from a marketing page, Resources then Search: `/help?search`
  opens the palette and the address loses `?search`, and a refresh keeps it gone.
