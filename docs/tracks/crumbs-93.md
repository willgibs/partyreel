---
track: crumbs-93
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8905090d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/unsent/
  - src/components/app/event-settings/
  - src/components/app/dashboard/
  - src/app/(guest)/e/[token]/card/
  # Claimed at boot (no lane runs beside this one): the fixes below reach these, each for the item named.
  - src/lib/guest/upload-refusal                          # 1: a send refused because the album paused is its own class
  - src/lib/guest/camera/                                 # 5: the spent roll's pure rule beside the other camera rules
  - src/lib/guest/event-card.ts                           # 6: the generic card's words, if the gap is theirs
  - src/lib/db/queries/events.ts                          # 4: the cards' cover read (its WHY-comment)
  - src/lib/disposable/migration-guards.test.ts           # 4: the seal's SQL guard (reshaped on purpose)
  - src/lib/db/migration-guards.test.ts                   # 4: the two cover bodies it pins, reshaped on purpose
  - src/lib/disposable/seal.ts                            # 4: its header comment said the host meets a sealed album on her dashboard
  - docs/ROADMAP.md                                       # 4: the one line (crumbs-88's) this lane settles, deleted
  - supabase/migrations/20261008090000_crumbs_93          # 4: the cards' covers and stills read the seal as a guest does
  - src/components/app/media-grid.tsx                     # 7: the one stand-in exported for the surfaces that draw a photograph
  - src/components/app/photo-img                          # 7: PhotoImg, the one <img> that hands over to that stand-in (and its test)
  - src/components/app/living-stills.tsx                  # 7: the cards' dissolving stills draw through PhotoImg
  - src/components/app/event-card.tsx                     # 7: the profile and Guest cards' cover (the same event_covers read), one swap
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/dashboard.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/dashboard.md
  - docs/systems/host-app.md
  - docs/systems/testing-verification.md
---

# lp/crumbs-93

**Goal.** Red-team 58's findings fixed at their source before milestone 40 ships: its one MEDIUM (a guest's cover deaf to the host's pause and reopen), its three LOWs and its three NITs.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The findings, each with its steps in red-team 58's ledger** (`/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-58/ledger.txt`, its lines by the words quoted; its shots in `shots/` beside it). Fix each where it starts, so the next surface never asks the same question:

1. **MEDIUM, a guest's cover deaf to the host's pause and reopen** (the guest page): with her album open, the host's Settings > What guests can add > Nothing, for now turns the album's order on its next sync, but the cover still offers Add photos and a send meets a 403 sheet with Retry; after the reopen the cover keeps "The host has closed uploads" and no Add until she reloads (checked 90 s). The cause, read by the red-team: `event-experience.tsx` passes the live word (`useLiveUploadsWord`) to the camera and the order alone, while `guest-upload.tsx`'s cover reads `uploadsOpen={event.accepting_uploads}`, the render's value. One live word feeds every reader of whether she can add (the cover, its Add, the camera, the order, anything else you find reading the render's value), with a test that pauses and reopens with the page open. A send refused because the album paused is its own class, as crumbs-90 made a spent roll's: said plainly, never a Retry that cannot succeed. Whether her refused file waits on her phone for the reopen (no-signal's keep) is a Question with your recommendation, built only if it stays small.

2. **LOW, a closed tab's kept photos stranded beside an open one** (no-signal-wiring's keep, `src/lib/guest/unsent/`): photos kept from a tab that closed are neither sent nor said while another tab of the album stays open; they go only when a page opens again. An open page adopts what a closed one left (its lock free) on its own line checks, and the stack says them.

3. **LOW, "Straight into the album" publishing a wait it never named** (`settings-rows.tsx`): switching to it says "Everyone sees it the moment it lands" while photos that reached Review after Settings opened are published with no warning, since its pending count is the page load's. The count read fresh when she switches, and the warning said whenever any wait.

4. **LOW, a Disposable's sealed shots as its dashboard cover** (THIS WEEK's card): before the develop its sealed photographs show as the card's cover, while the hub and the stage's wall hide them. One rule for every reader of a Disposable's photographs before its develop, at the read itself (claim the query at boot), with a test.

5. **NIT, the camera's refused frame** (`camera/album-camera.tsx`): for about half a second after a `roll_spent` refusal the camera shows the refused frame as free; the refusal spends it at once.

6. **NIT, the share card's double gap** (`e/[token]/card/`): the generic card draws "A Partyreel  event" with two spaces' gap.

7. **NIT, an undecodable HEIC on the stage's wall** (`dashboard/stage.tsx` or its wall): a broken image there, while the album tile names it ("Can't show here / HEIC"); one named stand-in on every surface that draws a photograph.

**No lane runs beside you.** Claim at boot any file a fix reaches outside your owns (the cover's query above all); a single line in another system's file is fine, listed in the Handoff with why.

**Record:** guest-flow.md's live-word lines, disposable-mode.md's sealed-photograph rule and dashboard.md's stage lines refined in place; anything left is a Deferred line.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does a file the album refused because the host paused wait on her phone for the reopen (no-signal's keep)?**
  Recommended: **no; built that way**. The send says plainly that the host paused uploads, offers no Retry (none could
  pass), and says her photo is still on her phone; the cover hears the pause within a round trip (a refusal asks the
  album for its word afresh) and offers Add again the moment the album says open. A camera album's shots already wait
  for that word (`album-camera.tsx`'s `LIFTABLE_REFUSALS`), the one place a shot has no other home. Why not a keep for
  the rest: a pause is the host's deliberate stop, and a kept file would go up on its own later (days, after a stop she
  meant) with no press of the guest's; the keep would need a state with no end and a word of its own in her stack; and a
  photograph in her library re-adds in two taps once Add is back. Overrule if you want her late shots to ride a reopen.
- **How do the dashboard's cards stop drawing a Disposable's sealed shots: in SQL, or in the app?** Recommended: **in
  SQL, at the read**: `event_covers` and `event_stills` drop the host's exemption, so a card reads as a guest does (the
  one rule, `disposable-mode.md`'s), proven in a rolled-back run on the live schema and shipped as
  `supabase/migrations/20261008090000_crumbs_93.sql` for the Orchestrator to apply with the merge (no signature or grant
  moves, so the build and the apply may land in either order; until it lands the cards behave as today). The app-only
  alternative (skip the cover of any album with a develop time ahead) works before any apply but also hides a visible
  earlier photograph of an album that was already running when its develop time was set.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
