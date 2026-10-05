---
track: crumbs-72
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ac0a001d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/camera-settings
  - src/app/api/host/r2/presign-upload/
  - src/components/guest/upload-step.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/reel/engine/player-live.tsx
  - src/components/app/event-settings/event-page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-72

**Goal.** Four ROADMAP crumbs: Settings' develop time never loses a typed time; the host's early storage refusal carries the meter's numbers; a newcomer behind A photo first hears what waits; the reel's dead viewer path goes.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours; 3000 and 3132 are not.

**The fixes**, each pinned by a test that fails on the old code:
1. **Settings' develop time** (`camera-settings.tsx`) saves only on blur or Return, so Escape or Back drops a typed time, and a phone's picker may never blur it. Lift the date field's beat and close-save (`event-page.tsx`) into one hook both use. Its real-iPhone check is the Orchestrator's to stage; say what to press.
2. **The host's early storage refusal** (`get_host_upload_context`'s `at_storage_cap`, `src/app/api/host/r2/presign-upload/route.ts`) says a bare "Storage is full for your plan". Carry the meter's numbers there too (`roomRefusalWords`, as the guest path does).
3. **Behind "A photo first",** a newcomer (`teaser`) over an album whose photos wait reads "Nothing here yet. Add the first photo and the album opens." (`upload-step.tsx`), because `waitingOnArrival` needs `access === "full"` (`src/app/(guest)/e/[token]/page.tsx`, a read). Say what waits there too.
4. **Code hygiene:** the reel no longer opens the photo viewer, so `src/components/shared/media-lightbox.tsx`'s `ViewerOrigin` kind "reel" with its `startAt` prop, and `src/lib/reel/engine/player-live.tsx`'s `moment()` with `LiveReelMoment`, have no caller outside their tests. Remove them with their tests.

Wiring rigor: the whole gate. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under the Handoff's calls his to overrule.

- **A close that finds a time it must not write: say nothing, or say so?** Closing the panel now saves a typed develop time that is plainly meant (ahead, within reach); a half-typed year, a past time (a blur would ask Develop now's question, a close cannot) and a blank write nothing, silently. Recommended: silent (Escape is a leave, and the field's own words said what was wrong while she was in it); the alternative is a toast on a close that drops one ("Your develop time wasn't saved").
- **The beat for a two-part picker.** The develop time takes the date's 350 ms rest for a picker's choice (one hook, one rule), so on a desktop Chrome calendar a day picked and then a time picked saves the day with the old time first (two saves, both plainly meant), and a pick that rests on a past time asks Develop now's question at the beat. Recommended: the shared beat; the alternative is a longer rest for the time (slower on a phone, which is the case it exists for). Its field is also no longer disabled while a save is on its way: a field that went dead as the beat's save went out would close an open picker mid-pick.
- **The host's early storage refusal has no numbers to carry.** `get_host_upload_context`'s `at_storage_cap` is a bare flag (it knows neither the file's size nor what Deleted holds), and a full account is exactly what the meter refuses next (`host_room_used` at its cap and 10% leaves no room for any file). Recommended and built: the host's route no longer refuses on it, so the meter's refusal (the room this file needs and the one way to make it, `roomRefusalWords`) is always the one she reads; the month's early refusal stays (one sentence both say alike). The trade: the meter fails OPEN, so in a meter outage a full account's file is presigned and refused at its complete in `createMediaAsHost`'s bare sentence (Deferred below). The alternatives: a migration adding the room's numbers to the context (then the TS re-derives the meter's arithmetic with the file's size, a second opinion about the same bytes), or the early branch calling the meter itself.
- **What the door says at the teaser over an album that waits.** The page reads whether photos wait (`waitingOnArrival`) only at full access, and this lane reads that page, so the door cannot tell an empty album from one whose photos wait. Recommended and built: over an album that waits and shows nothing, behind A photo first, the step says how uploads wait in the wait's own rule, the host unnamed ("Uploads develop all at once Saturday at 9 am. Add yours and the album opens."), in place of "Nothing here yet. Add the first photo and the album opens." For an album that waits, that also replaces the first-photo line when it is truly empty. The alternative is a one-line change to the page's guard (`access !== "none"`) plus a read per teaser view, which stops the false line but says nothing of what waits.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the presign meter's bullet says the host's route lets a full account go on to the meter's refusal, and why.
- `docs/systems/guest-flow.md`: the door's upload-step bullet says what its words say over an album that waits.
- `docs/systems/disposable-mode.md`: the develop time's guard bullet says when it is finished (leaving, Return, a picker at rest, the close), what a close writes, and where its state stands.
- `docs/systems/host-app.md`: the date field's bullet says the close saves a finished date and that the develop time shares the one hook.

## Deferred (ROADMAP one-liners, bucket named)

- Host app: `createMediaAsHost`'s cap refusal (`lib/db/mutations/host-media.ts`) is the same bare "Storage is full for your plan. Free up space or upgrade." a meter outage (fail OPEN) now reaches at the complete; carry `roomRefusalWords` there if the complete can read the room's numbers cheaply.
- Guests: the entry sheet's announced description says the wait's rule without its time (the modal holds no wait clock, and a clock there would run on pages with nothing waiting) where the upload step's visible line adds it after hydration; give the sheet's copy the time only if a screen reader's missing "Saturday at 9 am" proves to matter.

## Handoff (replaces the chat report)

- **Commits, pushed** (`origin/lp/crumbs-72`): the reel's dead viewer path `93b7bf573`; the host presign `77ad6f701`; the door over a waiting album `a1bfab190`, its doc `f8622178d`; the develop time `844b747ee`, its docs `b7ebb317f`, a last test `5d3a9d531`. launch-prep had not moved since the cut (`git log HEAD..origin/launch-prep` empty at the handoff), so there is no sync commit. The code head is `5d3a9d531`; this manifest follows it alone.
- **Gates on that tree, each on its own exit code, all at `5d3a9d531`:** `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (925 files, 11,408 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (152 checks, 0 failing; scope: boards `event-header` and `identity`, the Library, the shell). Logs: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-72/{typecheck,lint,test,build,smoke}.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD` before this manifest): every line is under an `owns` prefix or a `docs/systems/` file listed above, but for these, each the test or the caller of an owned file: `src/components/shared/media-lightbox.test.tsx` and `src/lib/reel/engine/player-live.test.tsx` (the manifest's own "with their tests": one test removed from each); `src/components/guest/upload-step.test.tsx` (the new sentence's tests); `src/components/guest/entry-modal.tsx` (the one caller that holds the page's wait facts at the door: an import, a `waitWords` read of `keepHeld` and `keepDevelopsAt`, and the clock handed to the step and to the sheet's announced description, so the eye and a screen reader read one sentence) with `src/components/guest/entry-modal.test.tsx` (its one wiring test).
- **The items, one line each:**
  1. Settings' develop time never loses a typed time: the date field's beat and close-save are lifted into one hook, `useFinishedFields` (`camera-settings-finish.ts`), that both fields use; `event-page.test.tsx`'s 23 tests pass unchanged on it; the develop time is finished on leaving, Return, a picker at rest (350 ms) or the close, judged as a blur judges it, and a style switch that clears the time drops its draft (`camera-settings.tsx`, `camera-settings.test.tsx`: 17 new tests replace the old "closing writes nothing" one; 8 of them failed on the old code when measured (the beat, the close-save and the field's disabled state; a ninth was added after), and the 3 style-switch tests fail with the drop removed).
  2. The host's full-account refusal reads the meter's numbers (`presign-upload/route.ts`; `route.test.ts`: 7 tests, 6 fail on the old route).
  3. Behind A photo first, a newcomer over an album that waits hears how it waits (`upload-step.tsx`, `entry-modal.tsx`; 4 tests fail on the old code).
  4. The reel's dead viewer path is gone: `ViewerOrigin`'s "reel" kind, `startAt` (and the session's id only it read), `moment()` and `LiveReelMoment`, with their two tests.
- **Verified in a real browser** (Chromium, the Library's Settings demo on `:3131`, real key presses, a programmatic Back so the field is never blurred, as Escape or Back leaves it): a develop time typed digit by digit and closed saved once on the close; a year left at 0202 and closed saved nothing and nothing on the beat; a three-notch change with no key saved once after the rest, the field focused and enabled throughout; a typed time with Live pressed (no blur) and the page closed left the album Live without the time; the date typed to 2027 saved nothing on the beat and 2027-10-12 on the close.
- **Assets requested from Will:** none.
- **Board ideas:** Guests: a teaser at A photo first could meet the contact sheet's tease over the cover (how many shots are developing, a yes or a count the page already reads at full access), the way a full-access guest does, so the door says more than the rule.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** a close that drops a time it must not write says nothing; the develop time's field is never disabled by a save; the time takes the date's 350 ms beat; a full host account is refused by the meter, not the context, so a meter outage lets one file's PUT go to be refused at its complete; the door's rule replaces "the first photo" over any album that waits behind A photo first; the entry sheet's announced rule is without its time.
- **Look at first (the Orchestrator's real-iPhone check):** on a real iPhone, in Safari, signed in as the host, open an event's Settings, What guests can add, and press Disposable. (1) Press the Develop time field, pick a new time in the picker and touch nothing else: within about half a second "Develops ..." under the field should say the time you picked, and the field must not grey out or the picker close by itself. If it only says it once you tap away, the phone's picker reports no change until it closes, which is the case the close-save below still covers. (2) Pick another time and press the panel's Back arrow (or swipe back) at once, then open Settings again: the time you picked stands. (3) Spin the wheel through several times and stop on one: it should save once, the one you stopped on. (4) Type or pick a year in the past or a time already gone and leave: the field says why or asks Develop now's question, and Back writes nothing. On a desktop Chrome calendar, pick a day and then a time in its popup: both should stick (the day saves first with the old time).
