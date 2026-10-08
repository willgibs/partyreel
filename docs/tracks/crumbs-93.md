---
track: crumbs-93
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/lib/db/queries/events.ts                          # 4: the cards' cover read (its WHY-comment)
  - src/lib/disposable/migration-guards.test.ts           # 4: the seal's SQL guard (reshaped on purpose)
  - src/lib/db/migration-guards.test.ts                   # 4: the two cover bodies it pins, reshaped on purpose
  - src/lib/disposable/seal.ts                            # 4: its header comment said the host meets a sealed album on her dashboard
  - supabase/migrations/20261008090000_crumbs_93          # 4: the cards' covers and stills read the seal as a guest does
  - src/components/app/media-grid.tsx                     # 7: the one stand-in exported for the surfaces that draw a photograph
  - src/components/app/photo-img                          # 7: PhotoImg, the one <img> that hands over to that stand-in (and its test)
  - src/components/app/living-stills.tsx                  # 7: the cards' dissolving stills draw through PhotoImg
  - src/components/app/event-card.tsx                     # 7: the profile and Guest cards' cover (the same event_covers read), one swap
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

- `guest-flow.md`: the view-only state's bullet now holds the one live word (`uploadsOpen`, every reader, the slot that stays
  mounted, the refusal's ask and the `paused` class, no wait on the phone); the keep's bullet says the adoption also runs
  on the open page's own line checks (locks required, never its own page's copies).
- `disposable-mode.md`: the seal's rule for the host's dashboard (no surface that draws a photograph takes the exemption:
  the cards' covers and stills carry the predicate with none, the counts stay hers) and the camera's refusal spending the roll.
- `dashboard.md`: the stage's seal lines (cards included) and `PhotoImg`, the one image of every surface that draws a photograph.
- `host-app.md`: Settings' "Straight into the album" note reads the album's live count.
- `docs/ROADMAP.md` is never a lane's: its crumbs-88 line (the three SQL homes exempt from the seal, "Host: her dashboard's
  tile covers and stills...") is settled here (covers and stills held to the guests' view, the count hers by rule), for the
  Orchestrator to delete with the merge.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Media / host and guest surfaces: `PhotoImg` (crumbs-93) is the one image of the dashboard, the profile and Guest cards and
  the cover cycle; the hub's own stills (`event-feed/event-cards-row.tsx`'s face, `hub-develop.tsx`,
  `selectable-media-grid.tsx`), the reel's clip tray and order, and the lightbox's filmstrip still draw a bare `<img>` of a
  stored photograph, broken where a browser cannot decode an un-previewed original (a HEIC from a desktop Chrome): adopt it
  there.
- Brand / OG cards: the marketing OG images (`lib/og/marketing-og-card.tsx`, `app/opengraph-image.tsx`, the blog and events
  ones) draw a title as one Satori text node, whose gap after a long word opens by that word's own kerning (36 px against 23
  on the share card, measured); crumbs-93's `e/[token]/card/title.tsx` (`CardTitle`) is the fix, to move to `lib/og/` and use
  there.
- Host / Settings: a photograph that reaches Review in the round trip between the picker's last live count and the press
  still publishes unsaid; `updateEventAction` could return how many `approveAllPending` approved and Settings say it in a
  toast.
- Guest / uploads: a reopen reaches a quiet open page on its next version poll (up to a minute, 50 s measured), and the
  cover's Add returns then; the doorbell could ring on `accepting_uploads` flips (a trigger, so a migration) for an
  immediate Add.

## Handoff (replaces the chat report)

- **Work, pushed to `origin/lp/crumbs-93`** (`git log origin/launch-prep..HEAD`): `dfcb73946` (1), `0642be0d0` (2), `0dbd74662` (3), `c47b2b229` (5), `8fa98057f` (4), `baafc246c` (6), `f6c67e9ad` and `0a14b2961` (7), `53cfbc29d` the record, `46f7181c9` and `8ae8d88e5` the manifest. launch-prep moved once since the cut, by a record commit only (`5dd2dabea`, `tracks/orchestrator.md`), so no sync; the head is in the chat line.
- **Gates on `8ae8d88e5`**, each its own exit code (logs in `_scratch/crumbs-93/gate-*.log`, pruned with the lane): `pnpm typecheck` 0; `pnpm lint` 0 (whole repo, no warning); `pnpm test` 0 (1129 files, 14,477 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (172 checks, 0 failing; scope: the Library and the boards that import `event-card.tsx`, `settings-rows.tsx`, `media-grid.tsx`). No `lab:demo` (`board: none`). My dev server on 3131 and my headless Chrome (driver on 9393) are stopped.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 43 paths, every one inside `owns` or this file, but the four system docs it names under System-doc edits (`guest-flow.md`, `disposable-mode.md`, `dashboard.md`, `host-app.md`: facts of this lane's own changes, refined in place). `docs/ROADMAP.md` is untouched (never a lane's); see Calls below.
- **The items**
  1. MEDIUM, the cover deaf to pause and reopen (`dfcb73946`): one `uploadsOpen` (the live word, `event-experience.tsx`) feeds the cover's Add, the shutter, the empty album's and a clip's Add, the door's upload step, the camera, the order, the last-removal rule and the picks the held door kept; `GuestUpload` (camera, Add sheet, failure sheet) stays mounted once it has stood; a send refused as closed asks the album for its word afresh; `uploads_closed` is the ladder's own class `paused` (`upload-refusal.ts`): "<Host> has paused uploads for now. It is still on your phone, so try it again once uploads reopen." and no Retry. Pinned: `event-experience.camera.test.tsx` (pause and reopen with the page open across every reader, the slot standing, the refusal's single ask, the camera's own, a page that renders paused), `failure-sheet.test.tsx`, `upload-step.test.tsx`; each fails on the old read (mutation-checked). **Walked live at 375** (event "crumbs-93 (disposable) walk"): host pause at 04:43:44, the open page's Add gone and the closed line up at 04:43:48.7 (4.3 s, no reload); reopen at 04:43:58, Add back at 04:44:48.5 (the quiet page's minute poll, 50 s, no reload; the red-team saw it stuck past 90 s); with the version poll blocked, a send right after a pause got the sheet above 0.5 s after the press and the cover turned closed 1.1 s after it (the refusal's ask), the failure sheet standing through the flip.
  2. LOW, a closed tab's kept photos (`0642be0d0`): `use-keep.ts` adopts what a closed page left on the open page's own line checks (`online`, her return, the line's 20 s cadence while shown; local reads only, no request), taking only records no live page's lock holds, never without a lock table, never its own page's copies; the queue sends them under the same ids and the stack says them. 8 new cases in `use-keep.test.tsx` (mutation-checked). **Walked live:** two tabs of one device, the first offline with 2 kept (IndexedDB n=2, its lock held), closed; the open tab asked presign within 6 s, the album gained exactly those 2 (SQL: 2 rows for that guest, 6 approved), IndexedDB n=0, lock gone.
  3. LOW, "Straight into the album" (`0dbd74662`): `SettingsProvider` reads the album's live Review count (`useHubCounts`; the prop is the first paint's and the fallback off the hub), so the picker says "The 1 photo under review appears at once." for a photograph that landed after the sheet opened; `settings-review-count.test.tsx` (5 cases; 3 fail on the old prop). **Walked live at 1440:** sheet opened with nothing waiting, a guest's photo landed pending, the picker read the 1-photo line, choosing it turned Review off and published it.
  4. LOW, sealed shots on the cards (`8fa98057f`): `supabase/migrations/20261008090000_crumbs_93.sql` drops the host's exemption from `event_covers` and `event_stills` (counts stay hers); both SQL guards reshaped on purpose (`src/lib/db/migration-guards.test.ts`, `src/lib/disposable/migration-guards.test.ts`: no `auth.uid()` in either body). **Proved on the live schema inside `begin; ... rollback;`** (proof in the file's header; drift md5s equal the repo's: covers `4539afa0...`, stills `fa2b913d...`): as willg97, RED answered the sealed `8672494e` (preview and original) for "crumbs-81 sealed (disposable)" and the sealed newest for the mixed album "RT57 Disposable"; GREEN the first is absent from covers and stills and the second covers with its newest UNSEALED photograph (`144d38fe`); the service role (own claims) reads exactly what it did, a stranger reads `{}`, null and empty inputs `{}`, grants identical before and after (authenticated, service_role, postgres: EXECUTE). **Not yet applied**, so today /dashboard's card for 0732b206 still draws `8672494e` and `66e27fe2` (read off the page).
  5. NIT, the camera's refused frame (`c47b2b229`): `rollView`'s `refused` (a `roll_spent` refusal of a shot taken or sent since the last read began) spends the roll until a read answers; `roll-view.test.ts` and `album-camera.test.tsx` (a held read; mutation-checked). **Walked live (before/after, two pages of one device, the roll spent from the other):** without the fix the camera read "Frame 1 of 3" with a live shutter for ~415 ms after the 409 (+1494 to +1909 ms), with it the camera goes "sending 1" to the roll's end with no live state between (+1181, +1525 ms).
  6. NIT, the card's double gap (`baafc246c`): no double space; Satori lays words out from unkerned advances and draws each word kerned, so the gap after a long word opened by its kerning (measured 34 px after "Partyreel" against 25 after "A"; with tracking off it grows with the word, 23 px after one letter to 36 after the nine of "Partyreel"). `e/[token]/card/title.tsx` (`CardTitle`) draws each word as a row of single-letter tiles with an explicit margin: 22 and 27 px, the difference being side bearings; three lines then cut (checked on a 34-letter word and five wide words). `title.test.tsx`; `card.test.tsx` reads the title's `data-card-title`.
  7. NIT, the stage's undecodable HEIC (`f6c67e9ad`, `0a14b2961`): `PhotoImg` (`components/app/photo-img.tsx`) is the one `<img>` of the stage's wall and lead chip, a tile, a row, the table, the pill, the week's face, the cover cycle (`LivingStills`) and the profile and Guest cards, handing over to the album tile's own `TileStandIn` (now exported) in the box the image filled; decorative copies stay plain. `photo-img.test.tsx`, `stage.test.tsx`. **Walked live at 1440:** a HEIC uploaded from desktop Chrome (no preview, `original.heic`) led the stage as "Can't show here / HEIC", on 4 of 4 reloads.
- **Assets requested from Will:** none.
- **Board ideas:** the Deferred lines (PhotoImg beyond the dashboard; the marketing OG cards' kerning gap; a doorbell on `accepting_uploads` flips; the Settings press's round trip) each name their bucket and area.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** one migration, `supabase/migrations/20261008090000_crumbs_93.sql`, to apply with the merge (two `create or replace`, grants restated verbatim, no signature or type change, so no `types.ts` regeneration and either order with the build). None else.
- **Calls for Will:** none. Two things for the Orchestrator: delete ROADMAP's crumbs-88 line ("Host: her dashboard's tile covers and stills (`event_covers`, `event_stills`) and the stage's \"in the album\" count...") with the merge, since this lane settles it (covers and stills held to the guests' view, the count hers by rule); and relay Questions 1 and 2 above (built as recommended).
- **Test data** (named so, soft-deleted at the walk's end; their 12 media rows' R2 objects go with the purge): events `c8d28954-6458-4293-a859-dd42277827bd` "crumbs-93 (disposable) walk" and `5341e437-2690-46ff-8e8c-d9f81d97c565` "crumbs-93 (disposable) cam", host willg97 (32 live events, the baseline, before and after). No fixture of anyone else's was changed.
- **Look at first:** after the apply, willg97's /dashboard: the card for "crumbs-81 sealed (disposable)" wears its date face, never a photograph (and the Deleted tab's covers the same). Then a guest page open on any album while Settings > What guests can add > "Nothing, for now" is pressed and then "Photos and videos": the cover's Add leaves within a poll and returns within the minute with no reload.
