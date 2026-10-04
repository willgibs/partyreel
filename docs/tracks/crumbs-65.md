---
track: crumbs-65
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b8e1c833"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/export/
  - src/components/app/export/
  - src/lib/upload/
  - src/components/guest/camera/
  - src/components/guest/reel/
  - src/components/guest/guest-header.tsx
  - src/components/app/event-feed/reel-card.tsx
  - src/components/app/dashboard/display-menu.tsx
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-65

**Goal.** Red-team 53's findings before milestone 36, fixed and proven on a local production build: a download whose line drops after the mint, the drop line overwritten while offline, the Reel card's words at 375, and the NITs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only (Vercel's Hobby Active CPU, 2026-10-04: 3h 56m of 4h used; past it every function pauses).** Nothing of yours requests the launch-prep alias, partyreel.com or any *.vercel.app. Signed-in walks run on a local production build at port 3000, built with `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (`docs/systems/testing-verification.md`), but port 3000 is Will's desk: build your own at your port only for anonymous checks, and for a signed-in walk ask nothing, write it as the Handoff's "Look at first" for the Orchestrator's local red-team. R2's CORS lists localhost 3000 and 3131 to 3139.

**Red-team 53** (build 53, stopped mid-walk for the CPU limit; ledger `../partyreel-wt/_scratch/redteam-53/ledger.txt`, read the MEDIUM, LOW and NIT lines whole):
- **MEDIUM, downloads (guest and host):** when the line drops after the mint, `check()` gives up and the walk posts its form anyway, so the page becomes Chrome's error page (`chrome-error://chromewebdata/`) and "Your connection dropped" is never shown. A walk whose check failed on the network never posts; it says the dropped connection and what to do, with Try again, in the toast (`src/lib/export/walk.ts`, `src/components/app/export/`).
- **LOW:** while still offline, the drop line turns into "Your download is starting." because `heard(null)` resets `lineLost`. A line that is still down keeps its words until it is truly back.
- **LOW:** at 375 the Reel card hides "Guests get it later" (`reel-card.tsx`; the card's `title` holds the sentence). Make it readable at a phone's width without widening the tile (the doors' redraw owns that), or say less where it fits.
- **NITs:**
  - the Display menu's Reset drops focus to the body (keep it on the menu);
  - the dock's Style key's open fill loses to hover (the open state wins);
  - a name-only guest's header disc flashes uncoloured before its seed lands (remember the seed per ticket so a later load paints at once; the first load fades in, never flashes);
  - the camera never says a dropped connection (its upload failure takes the uploader's dropped-connection words);
  - one wording for the drop everywhere: "Your connection dropped. Check your signal, then try again." (the uploader says "and try again").
- Each fix pinned by a test that fails on the old code.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule (the same lines stand under the Handoff's calls).

- **Is the Reel card's second line hidden on a phone?** Recommended: no, and nothing new is drawn. Measured in a
  top-level 375 viewport the line reads whole at rest ("Guests get it later" is 100px of the 149px it has; 122px at 320
  and 118px in the tile at its narrowest are computed from the card's padding). What hides every card's second line is
  the pill the row condenses to when it sticks, by design (the Review count's amber badge is the one thing it keeps: it
  needs action), and red-team 53's 375 frame was an iframe, where the row's observer reads stuck until the row is
  scrolled into view (reproduced in my own tab: all five cards `display: none` in an iframe, whole at top level).
  Built: the pill keeps the words for a reader (`sr-only`, not `display: none`; all three card kinds). Overrule if the
  pill should draw a mark.
- **The camera says the sentence where it counted.** A shot that failed for want of a line reads "Your connection
  dropped. Check your signal, then try again." with Retry, where "2 shots didn't send." stood (an answered error keeps
  the count). Recommended: the sentence alone (cause and act; two balanced lines at 375, the shutter moves 4px once).
  Overrule: keep the count and put the sentence under it.
- **A first load's disc waits for its colour.** Not drawn (its place held) for up to 2 s, then it fades in over 300 ms,
  coloured, or plain where none comes; a later load paints it at once. Recommended: wait, never plain-then-coloured.
  Overrule: show the plain disc and cross-fade.
- **One more local-storage value.** `pr_guest_seed_<album>` keeps her colour (public by construction) bound to the
  ticket by a hash of it, never the ticket (a capability); a sign-out leaves it, unreachable by any other ticket.
  `/privacy`'s inventory is generic ("a few values set by our pages"): no copy change now; the launch-time legal pass
  may name it.
- **A check that never reached the Worker never posts.** The old fall-through for "an older Worker's CORS failure" is
  retired: the Worker deploys before any app that names `/check`, so a failed fetch to it is the line's. Overrule only
  if an app can meet a Worker older than `/check`.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the E6 bullet (one sentence for the drop, the camera says it too, a test holds the
  wording), the Download all check bullet (an answered error still lets the zip go; a check that never reached the
  Worker never posts; the walk never posts into a line the browser says is down) and the cancel bullet (a line still
  down keeps its words and the walk keeps listening).

## Deferred (ROADMAP one-liners, bucket named)

- Host: the Display quiet line's Reset (`events-section.tsx`) drops the focus to the body as the menu's did; hand it to
  the Display button on its press (one line, in a file this lane did not own).
- Guests: the camera reads a shot's dropped connection by `UPLOAD_WORDS.dropped` because the queue keeps only the
  message; read `QueueItem`'s cause instead once the ROADMAP's "carry `UploadOutcome.cause` into the queue" lands.
- Host (reel): the hub's reel before the develop says nothing of the develop; its dock could say "Guests get it at the
  develop." (the prop is `live-reel-view.tsx`'s, the wiring `hub-reel.tsx`'s, the time the card's `developsAt`), which
  answers red-team 53's "her reel over the hub says nothing of it" at every width.
- Docs: `profiles-social.md`'s line on her own header's disc gains that the answer is kept per ticket
  (`pr_guest_seed_<album>`, hash-bound) and a first load holds the disc back and fades it in.
- Design: the ROADMAP's Library specimen of the download toast's states is also the only way a red-team can see "a line
  lost mid-stream" on a local build: a localhost app's mint never asks the Worker to report (`reportAddressFor`), so
  its listening is walked only by the walk's tests.

## Handoff (replaces the chat report)

- **Commits**, both on `origin/lp/crumbs-65`: the work `85646c131`, and `7a3984811` (two comments made exact). launch-prep
  moved only by two record commits (`984fa0acb`, `288e67275`: `docs/tracks/limits-watch.md` and `orchestrator.md`), so no
  sync commit. The head is in the chat line.
- **Gates**, each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (901 files, 11,005 tests), all on
  `7a3984811` (`../partyreel-wt/_scratch/crumbs-65/{typecheck,lint,test}.log`); `zsh scripts/build-lock.sh pnpm build` 0 and
  `pnpm lab:smoke --base http://localhost:3132 --production` 0 (160 checks, 0 failing; scope the Library, the desk and
  boards event-header, host-dashboard and identity, which import `export-walk.ts`) on `85646c131` (`build.log`,
  `smoke.log`); `7a3984811` changes two comments (`git diff 85646c131 7a3984811 --stat`). The smoke's PREMISE line:
  drive-export's nine open asks describe `uploads-and-r2.md`; this lane touched only the E6 sentence and the Download
  all check and cancel bullets, none about Drive.
- **Red first**: every new or reshaped test fails on the old source (that file's source swapped for `origin/launch-prep`'s,
  then restored): export-walk 8, uploader wording 6, guest-header 4, reel-card 4, live-reel-view 3, camera 1,
  display-menu 1.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 19 files besides this one, 15 of them under `owns`
  (`docs/systems/uploads-and-r2.md`; `display-menu.tsx`, `reel-card.tsx` and `guest-header.tsx`; `src/lib/export/walk.ts`;
  and the walk's, camera's, reel view's and uploader's files under their directories). Four exceptions, each for its
  reason: `content/help/an-upload-wont-finish.mdx` (one line: it quotes the sentence the uploader now words differently,
  and `help-ui-labels.test.ts` binds the two), and the tests beside three owned files, `display-menu.test.tsx` (new),
  `reel-card.test.tsx` and `guest-header.test.tsx` (the owns name a file, its test is its pin).
- **The items**
  1. MEDIUM, downloads (guest and host, one engine): a check whose last try never reached the Worker (rejected, or hung
     past its ceilings) is a dropped connection and never posts (`checkEnded`, `CheckVerdict.dropped` in `lib/export/walk.ts`;
     `check()`, `sayDropped` and the offline guard before the post in `export-walk.ts`). Real Chrome, my own headless, the
     real mint route and Worker, the Worker's host failed at the network layer: the old walker ends on
     `chrome-error://chromewebdata/` with the toast gone (`walk1-old.log`); the new one says "Your connection dropped. /
     Check your signal, then try again." with Try again, posts nothing, leaves the page where it was, and Try again takes
     a fresh mint and downloads a 3-photo zip, 629,148 B, into the scratch folder (`walk1-new.log`,
     `shots/walk1-new-dead.png`).
  2. LOW, the drop un-said while still offline: `listen()` no longer gives up while `lineLost`, and `heard(null)` no longer
     says her line works; pinned by two walk tests (not walkable on a local build: no reports from a localhost app).
  3. LOW, the Reel card at 375: measured whole at rest; the pill keeps its words for a reader (`valueClass`,
     `reel-card.tsx`); production build at 375: pill 124x36, the value `sr-only`.
  4. NIT, Reset: the press hands the focus to the menu's panel first. Real Chrome by keyboard and by mouse: the focus
     stays in the dialog, the next Tab walks Layout from the top, Escape still closes (`walk3.log`); the old file ends on
     BODY.
  5. NIT, the dock's fills: a pressed key carries no hover, and an open menu's key is left out of the hover rule itself
     (`KEY_HOVER`, `MENU_KEY_HOVER`); the production build's CSS under a real hover in the Browser pane's Chromium: open
     0.18 (the old classes, 0.12), pressed 0.18, a key at rest 0.12; pinned on the compiled rule.
  6. NIT, the header disc: kept per ticket and fades in (`guest-header.tsx`). Real Chrome with the ask held 1.2 s: first
     load `waiting` at opacity 0, the colour lands and it fades 0 to 1 in about 200 ms, never visible plain; a later load
     is `colour` at 1.0 from its first sample with no ask and no console problem (`walk2.log`).
  7. NIT, the camera: the one sentence with Retry when a shot failed for want of a line (`album-camera.tsx`,
     `camera-screen.tsx`, balanced in `camera.css`); at 375 it takes two lines and the shutter moves 4px.
  8. NIT, one wording: `UPLOAD_WORDS.dropped` says "then try again", and a test holds it to the downloads' title and detail.
- Assets requested from Will: none
- Board ideas: the hub reel's dock saying "Guests get it at the develop." before the develop (the Deferred line above); a
  lab frame reads the cards row as stuck until it is scrolled in view (an IntersectionObserver in an iframe), so a board
  that draws the hub's row at a phone width in a frame hides every card's second line.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: the five Questions above, one line each (the Reel pill keeps words for a reader only; the camera
  says the sentence in place of the count; a first load's disc waits up to 2 s; `pr_guest_seed_<album>` is one more local
  value; a check that never reached the Worker never posts).
- Look at first (signed in, the local build at port 3000; nothing of mine touched Vercel):
  1. Downloads, guest (Select, then Save) and host (Download): let the mint answer, then fail the Worker's host before its
     check answers (CDP offline, or block `*.workers.dev`): the toast says "Your connection dropped." with "Check your
     signal, then try again." and Try again, the page stays (never `chrome-error://`), and Try again after the line is
     back downloads. Also open the x's question ("Cancel this download?"), go offline, then Keep going: the same toast.
  2. A phone's hub at a top-level 375 viewport (resize it, never an iframe) on a Disposable album with a develop ahead and
     two shots: the Reel card reads "Highlight reel / Guests get it later" whole; scroll until the band sticks and every
     card is a pill (the words kept for a reader only).
  3. Display menu by keyboard: Tab to Reset, Enter: the focus stays in the menu, the next Tab is Layout.
  4. The reel's dock: click Style and leave the pointer on it: its fill stays at the open 18%, not the hover's 12%.
  5. A name-only guest's header: the first load of an album fades the disc in coloured; a reload paints it at once and
     does not ask `/api/guests/mine`.
  6. A camera album: take a shot and cut the line: the hint says the one sentence with Retry; the line back re-sends it.
  7. Not walkable locally: a line still down while a zip streams (a localhost app never asks the Worker to report); the walk's
     two tests carry it.
