---
track: help-refresh
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: help-center
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/contact-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
---

# lp/help-refresh

**Goal.** Refresh `help-center`'s three stale asks (the hub as the page really is, the article after the lit door and the keep step, a help link where Will's notes allow one) and `contact-page`'s two (the real form as today, the receipt without a modal), fixing one false claim in `contact-page.topic`.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**help-center:**
- `hub` (misdrawn from the start): `sheet`, "as today", puts the index straight under the hero. Since `49e010ff` (08-27) the real page has a row of ten category buttons in the hero, then "Start here", the filmstrip, then the index, so today is already close to `hybrid`. Redraw today accurately and reframe the question on it.
- `article`: crumbs-3 `4fb763b0` and crumbs-4 `2d2bd7f8` rewrote `how-guests-join-and-upload.mdx` to match the lit door and the keep step ("You can change it anytime.", the confirm step's words, a callout for the keep). The board still shows "Nobody has to prove a name" and a four-box code screen, where production has six boxes under "Check your email". Redraw the steps from the current article and the screens from the door as it ships, adding the keep step.
- `from-product` (reached): `contextual` draws a help link on a failed photo tile, which production never shows and Will's note rules out (no notices inside media cards; "notify the user where they are without real interruption"). Put it on the failure sheet under voice-guest `failed=exact`'s line (Retry both), or on her uploads' not-added row (its words are voice-guest round 2's; draw today's). The guest menu drawing predates door-flow `c0b113cd`: production has the "Save this event for later" card and says "Log in", not "Sign in", and Report sits at the album's foot, not in the header.
- **Untouched:** `who-first`, `feedback`, `dead-end`, `search`.

**contact-page:**
- `page` (misdrawn since round 1, `dbd046a6`): `desk`, "as today", shows the light hero over a generic text column, but the real page opens on the stationery form and its facts. Redraw `desk` with the real form, so it differs from `chapter` only in the hero.
- `receipt` (reached): drop `modal`. Will's no-interruption note argues against it, and no popup kind fits a receipt (`welcome-to-pro.tsx` is an explicit exception in `popup-kinds.test.ts`). Keep card, email and reference, with `card` still recommended.
- `topic`: fix the `optional` option's claim that the press and careers doors pre-pick a topic; only help articles do (`?about=`). The question and options are otherwise untouched.
- **Untouched:** `reach`, `urgency`, `beside`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`help-center`, `contact-page`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board help-center --base http://localhost:<port>`; `pnpm lab:demo --board contact-page --base http://localhost:<port>`, each pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **hub's recommendation moves from `hybrid` to `strip` (today).** Round one's case for doors was that a phone guest
  should not scroll a full index first; the real page already puts search, four questions, the guest line and ten
  doors above it. Recommended: keep the ten small doors; `hybrid` and `doors` stay as the two roads (spec `hub`).
- **hub's `sheet` id is retired for `strip`.** It meant "as today" but drew a page /help stopped being on 08-27; an
  answer given on build 12's stale drawing as `sheet` transcribes as `strip`. `doors` and `hybrid` keep their ids.
- **The keep stays the article's closing callout, not a seventh step.** The brief's "adding the keep step" is drawn as
  the door's keep screen beside that callout (`screen` only); on the board as the carried call `keep-callout`.
  Recommended: as drawn.
- **`contextual` draws both of the brief's places**, the failure sheet ("Still not going? What stops an upload", to
  an-upload-wont-finish) and her uploads' refused row ("Why?", to a-photo-is-missing-from-the-album), since its
  `lands` already named "other error surfaces". Recommended: both.
- **Two help articles fixed outside `owns`** (production bytes; see the Handoff's exception). Recommended: keep;
  the alternative is reverting them, which leaves `help-ui-labels.test.ts` red until a content lane rewrites them.

## System-doc edits (in place, owned facts only)

- none (`marketing-content.md` is a read; the label test's lab loophole is a Deferred line instead)

## Deferred (ROADMAP one-liners, bucket named)

- Now · Help-sync, the guest door (refines the line naming `how-guests-join-and-upload`'s tile, which crumbs-3/4
  already removed): that article skips the chooser (How do you want to join?: Continue as guest, Create account, Log
  in) door-flow put before the name, and puts Retry all "under" the failure list where the sheet puts it above;
  `an-upload-wont-finish` still heads "It's stuck or dimmed" and its bullets assume a tile (this lane kept only its
  labels and lead true).
- Now · Tests: `help-ui-labels.test.ts` reads `src/app/(dev)/` as shipped source, so a lab board quoting a retired
  string masks a stale help label (help-center's old stub hid "Tap to retry" in two articles); skipping `\(dev\)\/`
  masks nothing else today (probed on this tree).
- Now · Contact: a sent note gets the card and a toast saying the same thanks (`contact-form.tsx` `onSubmit`); the
  `receipt` ask's context now names it.
- Now · ROADMAP's "Two standing boards draw the retired literal" line: help-center's half is done
  (`who-first.tsx` draws "No app required.").

## Handoff (replaces the chat report)

- **Work commit** `72985077` on `lp/help-refresh`, pushed. **No sync**: launch-prep moved to `9427c912` with
  flow-refresh, triage-refresh, storage-r2 and voice-r2 and their records, none in this lane's reads; a trial
  `git merge --no-commit origin/launch-prep` auto-merged `touchpoints.ts` clean and was aborted.
- **Gates on `72985077`**, each its own exit code, logs in `partyreel-wt/_scratch/help-refresh/`: `pnpm typecheck` 0
  (`gate-typecheck.log`); `pnpm lint` 0, five warnings all outside the lane (`review-session.tsx`, `contact-form.tsx`,
  `album-fill-grid.tsx`, `review-switch.tsx`; `gate-lint.log`); `pnpm test` 0, 510 files and 5738 tests
  (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base
  http://localhost:3137` 0, 231 checks (`gate-smoke.log`); `pnpm lab:demo --board help-center` 0, 7 steps
  (`gate-demo-help.log`); `pnpm lab:demo --board contact-page` 0, 6 steps (`gate-demo-contact.log`). Heavy steps ran
  one at a time through the lock with memory read first. **Re-run, nothing lost**: the first `pnpm test` was red
  (below, fixed); one pre-commit `lab:demo --board help-center` stalled at `feedback` on a cold compile, then ran
  clean twice.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the two owned board folders, `touchpoints.ts`
  (this lane's help-center row only: `asks`, `lives`, `note`, as the brief grants) and, as the exception,
  `content/help/an-upload-wont-finish.mdx` and `content/help/a-photo-is-missing-from-the-album.mdx`. Why: both quoted
  the retired dimmed tile's `<UiLabel>Tap to retry</UiLabel>`, and the only source string left for it was this
  board's own stale failed-tile stub; redrawing `from-product` removed it and `help-ui-labels.test.ts` went red.
  Each now points at the failure sheet (Retry; Not now, then add it again), with `updated` bumped and the lead fixed
  where it said "tap the dimmed tile". No live lane owns `content/help/`.
- **help-center `hub`**: "as today" (`strip`) is /help from `help/page.tsx` (the quick questions and guest line under
  the search, the ten-door strip straddling the cut, Start here, the numbers, every guide in order, the dark close);
  `hybrid` and `doors` put round one's four big doors in the strip's place, with and without the index. Question,
  context, options and recommendation reframed on it (`spec.ts`, `hub.tsx`); `who-first.tsx`'s `Hero` gained two
  props only the hub passes, so who-first's own tiles draw what they drew.
- **help-center `article`**: the guest how-to verbatim at its 09-27 state on the article page's real stage (back link,
  search pill, emblem, the paper In short), the round-one `Path` gone; `screen` pictures the lit door from its own
  pieces in 375px documents (`door-screens.tsx`: six boxes under "Check your email", "You can change it anytime.",
  the keep's Sent and Keep this photo beside its callout). Overrule now names the staleness this board itself showed.
- **help-center `from-product`**: her name menu as shipped (the "Save this event for later" card, Change name, Log
  in), Report at the album's foot, the failure sheet in voice-guest's picked `failed=exact` words, her uploads with a
  "Not in the album" row in today's words; `menu` adds one Help center row, `contextual` the two links. No photo tile
  carries a notice anywhere.
- **help-center fixtures** follow the catalog at this base (every guide's title per category, Highlight reel, the
  clip fact, four quick links, the Start-here trio); the palette's index in the untouched asks reads them, closed.
- **contact-page `page`**: `desk` is the light hero over the real form chapter (`page.tsx`'s grid and blurb), shared
  with `chapter`, so the two differ in the hero alone. **`receipt`**: `modal` dropped; `card` is the shipped success
  state exactly (`min-h-72`, the chevron link) on the page's paper skin; context, because, overrule and lands
  rewritten without the modal. **`topic`**: `optional` says only a help article's Contact us pre-picks a topic.
- **Safety, no drawing change**: the live `ContactForm` in `page`, `reach` and `beside` no longer sends a real note
  from the lab (`stopSubmits`, capture phase): an empty Send in the preview shows no validation where /contact shows
  four, so the form's handler never runs.
- **Heights** measured against the real iframes for every redrawn tile (`board.tsx` in both folders), under
  who-first's tallest hero for the hub.
- **Verified** at 1440 and 375 with reduced motion emulated, headless captures of every redrawn option against
  production's own /help, the guest article and /contact.
- Assets requested from Will: none.
- Board ideas: (1) `door-screens.tsx`'s `Shot` (a 375px document per phone screen, scaled, without `dark`) as a lab
  kit piece for any board picturing a phone inside a desk frame, for the lab revamp; (2) contact-page's `reach`,
  `topic`, `urgency` and `beside` draw /contact in the lab's theme (dark in a dark lab) where the page is paper, and
  `reach`'s routed column quotes an older blurb ("Pick a topic, say what's going on, and that's it.").
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: hub recommends `strip` (today); the keep stays a callout; `contextual` links on both the sheet
  and the refused row; the two help articles' one-line fixes; `receipt` drawn on paper.
- Look at first: `help-center.hub` at 375 (the whole page, the index's real length, the strip as today) and
  `help-center.article`'s `screen` (the lit door's own screens beside the six steps and the keep).
