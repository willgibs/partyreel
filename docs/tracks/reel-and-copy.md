---
track: reel-and-copy
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery
  - src/components/guest/event-experience
  - src/components/guest/identify-step
  - src/lib/format/
  - src/lib/reel/defaults-action
  - src/components/guest/reel/live-reel-view
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/reel.md
  - docs/systems/guest-flow.md
---

# lp/reel-and-copy

**Goal.** Three small fixes from build 10's red-team: the album's count reads right at one, Settings leaves the reel's look and hold on the platform default when the host picks the default, and a reel view that never picked its own look follows the host's Set for everyone live.

## The brief

1. **"1 photo & videos"** (build 9 and 10's red-teams): the album's count label reads that way at one item in four places: `live-gallery.tsx` (about line 376), `event-experience.tsx`'s stats line (about 903) and the locked page's "... inside" (about 950), and `identify-step.tsx` (about 200, "... is/are waiting"). One helper beside `formatCount` in `src/lib/format/` answers the phrase once for all four, worded as the claims card already words a count of either type: one reads "1 photo or video" (never "photo", which lies when the one item is a video), more read "N photos & videos" with `formatCount`. Pin every form.

2. **Settings stores the default as a value** (build 9 and 10's red-teams): choosing the default hold (3 s) or the default look (Cinematic, stored `classic`) writes `3` or `'classic'` instead of NULL, so the event stops following the platform's default if it ever changes. `setReelDefaults` (`src/lib/reel/defaults-action.ts`) writes NULL when the chosen value is the platform default (`DEFAULT_HOLD_SEC`, the default look in `@/lib/reel/defaults`), each column on its own, as NULL already means "the default" (`resolveHoldSec`). Pin both columns.

3. **Set for everyone never reaches a screen already open** (build 10's red-team; the recommended answer, built, his to overrule): `live-reel-view.tsx` reads the event's look and hold once when the view opens (about lines 227 to 230), so a venue screen that never picked a look kept playing Cinematic after the host set Kinetic for everyone, though its next poll carried the new values, and the toast "Everyone sees this look now" promises otherwise. A view that never picked its own look or hold follows the event's live: the next poll's values take effect at the next hold, with no reload; a device's own pick still wins and is kept. Pin it with the view's tests.

Put the `reel.md` and `guest-flow.md` lines these change in your Handoff for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Brief item 3 (Set for everyone reaching a screen already open): recommended answer built. A
  view/screen that picked neither its own style nor hold now follows `live.reel`'s next poll answer
  (`readStyleId` / the new `readOwnHoldSec`, both null), taking effect at the next hold with no
  reload; a device's own pick is never touched. The alternative I did not build: reload the page the
  instant a poll carries a new default, which would cut whatever is on screen mid-hold and, on
  `?reel=screen`, flash a loading state on a wall nobody is meant to be driving. His to overrule.

## System-doc edits (in place, owned facts only)

- none: `reel.md` and `guest-flow.md` are `reads` for this lane (never edited here); the lines they
  need are below, in the Handoff, for the Orchestrator.

## Deferred (ROADMAP one-liners, bucket named)

- Host: `host-media-grid.tsx`'s bulk toasts ("Liked N photo(s)", and `event-feed/use-review-triage.ts`'s
  "Approved N photo(s)") read "photo" for a selection that can hold a video, the same lying-singular
  `formatMediaCount` (this lane) fixes on the guest side — spotted in passing, not confirmed a bug
  worth fixing (the host may already read "photo" loosely there) nor built, and `host-media-grid.tsx`
  is `album-fixes`'s own path (from `reel-and-copy`).

## Handoff (replaces the chat report)

- Work commit `8fa943c4` on `lp/reel-and-copy`, pushed. No sync commit: this branch booted from
  `origin/launch-prep` at `97f78ae8` (Agent boot's own checkout, later than the manifest's `cut`),
  and a re-fetch right before committing showed `origin/launch-prep` still at that same sha.
- Gates, all on `8fa943c4`'s tree (nothing changed after): `pnpm typecheck` clean; `pnpm lint` 0
  errors (6 pre-existing warnings in 4 files this lane never touched: 5 `no-unused-vars`, 1 React
  Compiler memoization skip note); `pnpm test` 5405 passed / 5405, 482 files, 0 failed (a scoped
  re-run of just the 6 touched test files: 123 passed / 123); `zsh scripts/build-lock.sh pnpm build`
  exit 0; `pnpm lab:smoke --base http://localhost:3133` 272 checks, 0 failing. A live curl of the
  demo event's guest page (`GET /e/$NEXT_PUBLIC_DEMO_QR_TOKEN`, 9 approved items) confirmed
  `formatMediaCount` renders in real SSR output: `9 photos &amp; videos`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` lists exactly the 6 owned files (12
  with their test files) plus one exception: `src/lib/guest/reel-prefs.ts` (+ its test file), not
  under any `owns` prefix in flight (checked `album-fixes.md` and `owner-album.md`, neither claims
  it). Why: `live-reel-view.tsx`'s brief-3 fix needs to know whether THIS device has its own stored
  hold, the same signal `readStyleId` already gives for style by returning null; reel-prefs.ts got
  one small addition, `readOwnHoldSec(qrToken): number | null`, mirroring that shape, plus a
  one-line refactor of `readHoldSec` to call it (its own signature and behavior are unchanged, and
  its existing tests pass untouched).
- The items:
  - The album's count reads "1 photo or video" at one item, "N photos & videos" otherwise, through
    one new `formatMediaCount` (`src/lib/format/count.ts`, beside `formatCount`), replacing the
    hand-rolled "photo"/"photos" + "& videos" splice at all five spots that shared the bug:
    `live-gallery.tsx`'s header count AND its teaser CTA (that CTA is a fifth spot beyond the
    brief's four, sharing the exact same bug — fixed too, since it sits right beside the header in a
    file this lane owns), `event-experience.tsx`'s stats line and its locked page's "... inside"
    tease, and `identify-step.tsx`'s door title ("... is/are waiting").
  - `setReelDefaults` (`src/lib/reel/defaults-action.ts`) now writes NULL, not the matching literal,
    when a host's pick equals the platform's own default (`DEFAULT_HOLD_SEC`, `DEFAULT_STYLE_ID`),
    each column checked and written on its own.
  - `live-reel-view.tsx`: a view/screen with no style or hold pick of its own now follows
    `live.reel`'s next poll answer (adjusted during render, React's own pattern for state derived
    from a changing prop — not a `useEffect`, which tripped `react-hooks/set-state-in-effect` for
    this exact shape on the first pass); a device's own pick is never touched. See Questions.
- Doc lines for the Orchestrator (this lane's `reads`, never edited here):
  - `docs/systems/reel.md`, under "The defaults and the lever", the `setReelDefaults` bullet ("is
    the one write, shared by the view's Set for everyone and Settings: it re-verifies the owner and
    revalidates nothing, so the reel keeps playing.") — append: "A pick that lands on the platform's
    own default (`DEFAULT_HOLD_SEC`, `DEFAULT_STYLE_ID`) is stored as NULL, not the matching value,
    so the event keeps following the platform default if it ever moves."
  - `docs/systems/reel.md`, under "The tile, the view and the screen", the "owner's extras" bullet
    (ends "...and 'Everyone sees this look' once they match; Close goes back...") — insert before
    "Close goes back": "A view or screen that has picked neither for itself follows the event's live
    look and hold as a poll updates them, taking effect at the next hold with no reload; a device's
    own pick is never overridden."
  - `docs/systems/guest-flow.md`, under "ONE TRUE COUNT, EXACT AND LIVE...", the sentence "...the
    CTA says the same number, 'See all N photos & videos' ... and so does the door (its `mediaTotal`
    is the header's live count)." — append a clause: "(a lone item reads 'N photo or video' instead,
    through `formatMediaCount`, never a lying 'photo')."
- Assets requested from Will: none.
- Board ideas: none beyond the Deferred line above.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: brief item 3's shape (follow live at the next hold, own pick always wins)
  — see Questions above for the alternative not built.
- Look at first: the Questions entry (brief item 3's one real judgment call) and its test,
  `live-reel-view.test.tsx`'s new `describe("a view already open follows the event going live...")`.
