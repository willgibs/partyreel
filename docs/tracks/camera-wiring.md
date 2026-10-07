---
track: camera-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/camera/
  - src/lib/guest/camera/
  - src/lib/disposable/roll
  - src/lib/disposable/shot
  - src/components/app/event-settings/camera-settings
  - supabase/migrations/20261007021000_reshoots.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-moments.json
  - docs/reviews/guest-moments.json
  - src/app/(dev)/design/sandbox/host-moments/spec.ts
  - src/app/(dev)/design/sandbox/guest-moments/spec.ts
  - docs/systems/disposable-mode.md
  - docs/systems/database-security.md
---

# lp/camera-wiring

**Goal.** The album camera's roll as Will picked across two boards: a develop time added mid-party says its fresh rolls first, a guest meets her fresh roll once, a flat 3 re-shoots counted where she takes one back, and the reel's newest frame offering Take it back.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06):** host-moments r1's tell = line and fresh-roll = panel (`docs/reviews/host-moments.json`); guest-moments r1's limit = three and where = reel (`docs/reviews/guest-moments.json`). Each board draws its picks on production's own camera and Settings (`src/app/(dev)/design/sandbox/host-moments/`, `.../guest-moments/`): those drawings are your spec. The camera and Settings' camera page are yours alone this wave.

- **tell = line (the host):** when Maya adds a develop time to a camera that shows every shot at once, Settings says the consequence before it saves, in the pattern Settings already uses for a change that reaches people: every roll starts again at its size, developing at the time she chose; Start fresh rolls, or keep it as it is. (A develop time mid-party starts a new period: `events.sealed_from`, stamped by `events_reveal_stamp()`, and every count keys on it.)
- **fresh-roll = panel (her guests):** once, the first time a guest opens the camera on a fresh roll, a panel over the finder in the roll-done panel's shape (`camera-panels.tsx`): a fresh roll, why (the host set a develop time), when it develops, and Start shooting. Decide how "the first time" is known (her period against the one she last saw: a device's memory is enough, since a second sight costs nothing) and say it in a Question.
- **limit = three:** a flat 3 re-shoots at any roll size (Will's word since customize r1): a roll of 24 takes at most 27 shots in all. Today `ROLL_RETAKES = 3` means three rolls' worth (72), enforced in SQL by `public.create_media` (`c_roll_retakes`, `v_taken >= roll_size * c_roll_retakes`), advised by `get_upload_context` and `get_upload_gate` (taken and ceiling), said only in Settings' camera line ("up to 72 shots in all", pinned in `camera-settings.test.tsx`) and met unsaid. Now: the server's ceiling is the roll plus 3; the camera counts where she takes one back ("2 re-shoots left"), and the roll's end says when they are spent; Settings' line says it plainly. `roll.ts`'s parity test with the SQL stays the guard.
- **where = reel:** a press on the reel's newest frame opens that shot with Take it back and Keep it (a two-key sheet, since a mis-press there must not delete: the board's carried call BM1); Your shots keeps its X with no question. Will's note: "Both are probably the best option. That way, if they naturally go to remove an image from their uploads, it inherently frees up a slot for them as well": both doors take a shot back, free its frame and spend one of her 3.

**The migration, `supabase/migrations/20261007021000_reshoots.sql`:** start from `public.create_media` (newest in `20261005200000_capture_time.sql`), and `get_upload_context` and `get_upload_gate` where they advise the ceiling (newest in `20261005181000_billing_integrity.sql`)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users"). Milestone 38's camera reads the ceiling from the server where it can (`roll-view.ts`), so name what its Settings line says meanwhile.

**Nearby lanes this wave (never edit their paths):** the album and its arrivals, the upload stack and the reel's curtain (album-moments-wiring, which owns `event-experience.tsx`: a line you need there is an exception listed with why in your Handoff), Settings' door page (host-moments-wiring), Create's Disposable card (create-wizard-wiring).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** a Disposable on your port: a guest's camera shooting, taking one back from the reel and from Your shots, the count, the roll's end at 27 of 24; the host adding a develop time mid-party (the line, both answers), then the guest's fresh-roll panel once and never twice; a refused shot past the ceiling with the server's words.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **How is "the first time" on a fresh roll known?** Built: the gate's roll names the period it counts in (`period`,
  `events.sealed_from` in epoch ms, migration `20261007021000`), and her device keeps the period she last held shots on
  (`pr_roll:<qrToken>`, `src/lib/guest/camera/fresh-roll.ts`). A roll read on another period lays the panel over the
  finder, and the kept period moves as it shows: said once, never twice; a guest who never shot here keeps nothing, so
  her first roll is never called fresh; a second device may say it once more. Recommended: as built (keying on the
  develop time alone, client-side, misses Develop now followed by a new time, and a camera started again).
- **Does the fresh-rolls line ask where nobody has shot yet?** Built: yes, on every running camera, since Settings holds
  no count of the guests' rolls (a ticket with no name is in none of its numbers) and the line is true either way.
  Recommended: as built. Overrule: ask only while the door counts guests in (`counts.in`), missing nameless tickets.
- **Where does it ask?** Built: wherever a develop time comes ahead on a running camera (`events_reveal_stamp`'s own
  condition): Customize's At a develop time, the Disposable style chosen from a camera mix, and a new time typed for a
  camera that has developed (a close, which cannot ask, writes nothing of it). From approval with photos held, one line
  says both ("2 photos under review join the roll, approved"). Recommended: as built.
- **Which frame is the take-back's door?** Built: the reel's newest frame while it holds this visit's newest shot, on an
  album that keeps shots out of sight (a develop time, or approval); an earlier visit's frames are glass (the reel never
  knew their pictures) and Your shots' X takes those back; on an album that shows each shot the reel stays one door,
  since a shot in the album is taken back from the album. Recommended: as built.
- **A shot still on its way?** Built: the sheet opens at once, its Take it back waiting, said ("Sending… You can take it
  back once it lands."), and live the moment it lands. Recommended: as built.
- **Once her 3 are spent?** Built: both doors still take a shot back (hers to withdraw) and say it frees no frame (the
  sheet's line; Your shots' foot: "Your 3 re-shoots are used, so removing a shot won't free its frame."). Recommended:
  as built.
- **The server's words past the ceiling?** Built: "You've used all 3 re-shoots on your roll." (it said "You've used every
  retake this roll allows."), formatted from `c_roll_reshoots`, so the camera says one word for one idea. Recommended:
  as built; it moved the literal in three tests outside the lane (the lane check).
- **What the count says when the ceiling binds first** (the host removed some of her shots): built, what she can still
  take, the frames left or the room under the ceiling, whichever ends first; a freed frame past it stays empty.
  Recommended: as built.
- **Settings' words:** "A roll of 24 shots each, plus 3 re-shoots: taking one back frees its frame for another." (one
  shot: "One shot each, plus 3 re-shoots: taking it back frees the frame for another."). Recommended: as built.
- **An open camera when the develop time is added:** built, it reads her roll again the moment its album turns to a
  develop and says the fresh roll then, over the finder, the shutter waiting. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`: the ceiling is the roll plus 3 (`ROLL_RESHOOTS`) and its refusal's words; the gate's
  `period`; the count as what she can still take and her re-shoots counted where she takes one back; the two doors;
  the fresh roll said once; Settings' fresh-rolls question wherever a develop time comes ahead on a running camera.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming › Marketing and content: Help: `content/help/the-disposable-camera.mdx` says "A roll allows only so many
  retakes"; name the 3 re-shoots and the reel's newest frame (Take it back, Keep it), in `lib/guest/camera/words.ts`'s
  words.
- Before launch › The guest's album: the privacy notice's local-storage inventory (`lib/constants/legal-privacy.tsx`'s
  comment) names neither `pr_develop:<eventId>` nor `pr_roll:<qrToken>` (the period a device last held shots on); its
  paragraph's "small flags" covers both in words.

## Handoff (replaces the chat report)

- **Commits:** the work `1ceffba76` and `965fe8d61` (a test alone: the phone's Back on the newest shot's sheet), then
  this manifest alone, pushed to `lp/camera-wiring`; no sync: launch-prep moved only by records and the vitest env fix
  (`e6fa3cc8f`..`e949f5501`: docs, `vitest.config.ts`, `vitest.setup.ts`), none in this lane's owns or reads.
- **Gates** (base `156e30906`), each on its own exit code, logs in `../partyreel-wt/_scratch/camera-wiring/`: on
  `965fe8d61`, `pnpm typecheck` 0, `pnpm lint` 0 and `pnpm test` 0 (1,059 files, 13,357 tests; `gate2-*.log`); on
  `1ceffba76` (the same app code: the later commit adds a test alone), the same three 0 (13,356 tests; `gate-*.log`),
  `zsh scripts/build-lock.sh pnpm build` 0 and `pnpm lab:smoke --base http://localhost:3133` 0 (204 checks; its scope:
  the Library, the shell and the eight boards that import a changed file). Every `pnpm test` ran with
  `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key`
  exported, the Orchestrator's note for this Mac until the vitest fix is synced. A first smoke 404'd every lab route on a
  dev server started after the build; `rm -rf .next/dev` and a restart cleared it (testing-verification's stale cache).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, `docs/systems/disposable-mode.md`
  (Record subtractively) and this file, plus these exceptions:
  - `src/lib/disposable/migration-guards.test.ts`: it pins `create_media`'s ceiling line and both reads' roll answer
    word for word, which this migration moves (the roll plus `c_roll_reshoots`, the gate's `period`); reshaped, scar kept.
  - `src/lib/upload/capture-time-migration.test.ts`: it pinned `create_media`'s winning file to capture-time's; this
    file replaces the body in place, so the pin is "that file or a later one", as its neighbours pin.
  - `src/app/api/r2/presign-upload/route.test.ts`, `route.burst.test.ts`, `src/lib/db/mutations/guest.test.ts`: the
    ceiling's sentence typed out, now "You've used all 3 re-shoots on your roll." (one literal each, two in guest).
  - `src/app/api/r2/presign-upload/route.ts`: one comment line said "a period takes three rolls' worth".
  - `src/app/(dev)/design/sandbox/guest-moments/camera.tsx`: it imported `ROLL_RETAKES`, renamed `ROLL_RESHOOTS` with
    its new meaning; the board's `rolls` (today) option now carries its own number (two rolls past hers).
- **The items:**
  - tell = line: a develop time onto a running camera asks Start fresh rolls or Keep it as it is in Settings' consequence
    line ("Every guest's roll starts again: 24 fresh shots each, developing together tomorrow at 9 am. What's in the
    album now stays in view."), at Customize's At a develop time, the Disposable style from a mix and a new time for a
    developed camera (`camera-settings-fresh-rolls.ts`).
  - fresh-roll = panel: `FreshRollPanel` over the finder, once (`fresh-roll.ts`, the gate's `period`), the shutter
    waiting for Start shooting; an open camera reads her roll again when its album turns to a develop.
  - limit = three: the server's ceiling the roll plus 3 (`create_media`, both reads); `roll-view.ts` counts what she can
    still take and her re-shoots; Your shots' head ("6 of 24 · 2 re-shoots left") and foot, the sheet's line, the
    camera's line after a take-back, the roll's end once spent ("Your 3 re-shoots are used."); Settings' line ("A roll
    of 24 shots each, plus 3 re-shoots: taking one back frees its frame for another.").
  - where = reel: the reel's newest frame is a door of its own (`camera-reel.tsx`), opening `TakeBackPanel` over the
    picture with Take it back and Keep it (Keep it focused, Escape and Back keep it, a shot on its way waits, a failure
    says so with its retry); Your shots keeps its X.
- **The migration** `supabase/migrations/20261007021000_reshoots.sql`, md5 `16624fa3533352b77c069424721f59f1`, for the
  Orchestrator to apply by the protocol (never applied here). Callers: `create_media` by `createMedia`
  (`src/lib/db/mutations/guest.ts`) from the guest complete route; `get_upload_context` by `getUploadContext` (same
  file) from the presign and complete routes; `get_upload_gate` by `getUploadGate` (`src/lib/db/queries/guest-gate.ts`)
  from `gallery-access.server.ts` and `/api/guests/mine` (the camera's roll). Its header names what milestone 38 and the
  alias meet meanwhile (an expand; their camera stops at 27 by the server's ceiling, their Settings line says "up to 72
  shots in all" until this build ships). Drift read clean on 2026-10-07 (live hashes = repo); the rolled-back proof on
  the live schema RED 2/7, GREEN 7/7, nothing persisted after (no fixture user or album, the old hashes standing); the
  pre-flight on a throwaway Postgres 17 cluster GREEN, the deployed build's paths probed under `anon`, `authenticated`
  and `service_role` (`_scratch/camera-wiring/preflight/`, `defs.diff` the before-and-after `pg_get_functiondef`).
  Expected after apply: advisors unchanged at 27/4/36, `types.ts` unchanged.
- **The walk** (local, port 3133, the walk's own headless Chrome with a fake camera; captures in
  `_scratch/camera-wiring/rt/`): a guest shooting on a Disposable, taking one back from the reel (Keep it, then Take it
  back, the frame freed and counted by the server) and from Your shots, the roll's end, a take-back at the end, a shot
  on a throttled line (the sheet waiting, ready in about 4 s), a take-back on a blocked route (its words, then its
  retry); the host adding a develop time mid-party in Settings (both answers, the period moved in the database), a new
  time on the developed album in the room (both answers); her open camera hearing it and saying the fresh roll, then
  never twice; the roll's end past her 3 (on a roll of 2: 5 taken, Your shots' foot, the ceiling with a frame free) at
  375 and 1440; Tab with the halo and the screen reader's names. ★ The migrated server's two answers were stood in for
  that walk (`rt/shim.js`: the ceiling the roll plus 3, and a period), since it is not applied; the counts were the live
  server's.
- **Walks for the desk, once the migration is applied:** a shot past the ceiling refused in the server's words ("You've
  used all 3 re-shoots on your roll.") on the presign and on a raced complete; the fresh-roll panel from the real
  `period` (a develop time added while a guest's camera is open, and on her next open); 27 of 24 on a real roll of 24;
  the halo painted (headless paints none: its box-shadow was read instead); a real phone's thumb on the newest frame.
- **Test data:** the three albums "camera-wiring (disposable) A/B/C" (`afef73fb…`, `dfd94d55…`, `37dce844…`, willg97's)
  soft-deleted at 2026-10-07 03:45Z with their guests and shots; the purge takes them.
- **Assets requested from Will:** none.
- **Board ideas:** the reel's newest frame as a door is invisible until pressed (sealed glass like every frame): a board
  on whether it shows her shot or a mark while it is a door; one verb for the act (the sheet's Take it back beside Your
  shots' "Remove this shot" and Settings' "taking one back").
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the migration above; nothing else.
- **Calls his to overrule:** the Questions above, each built as recommended.
- **Look at first:** `supabase/migrations/20261007021000_reshoots.sql`, then `src/components/guest/camera/album-camera.tsx`
  (the newest frame's sheet and the fresh roll) and `src/lib/guest/camera/roll-view.ts` (what a take-back spends).
