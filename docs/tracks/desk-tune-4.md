---
track: desk-tune-4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8fef7143"            # the launch-prep SHA the branch was cut from
board: the-wait
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/the-wait/
  - src/components/ui/glyph-count
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-action-dock.tsx
  - src/components/app/event-feed/reel-card.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/app/(dev)/design/sandbox/identity/
---

# lp/desk-tune-4

**Goal.** Make the-wait's drawings true to production again before Will's sitting on build 45 (crumbs-52 moved two things they show, and three older slips), and let identity's voice and status sheets reach production's glyph-count number.

## The brief

**Why.** The pre-sitting desk pass (2026-10-03) re-read every board whose production moved since its cut. Four hold; the-wait moved, both from `crumbs-52` (merged `1cc96371`). A board must never show Will a product that no longer exists. Every question on it still stands: only drawings and a few words change, and no option's idea moves.

**The-wait's edits** (line numbers as read at `ece3f8a1`; confirm each):
1. **The camera album's Add.** The board draws `<ImageUp /> Add photos` on every cover (`album.tsx:164`) and a dock with no `camera` (`album.tsx:236`), while its developing album is the album's camera. Production now says "Take photos" with the Camera glyph on a camera album's cover Add (`event-experience.tsx:680-687`, `:1359`), and the shutter does too (`guest-action-dock.tsx:121`, `:177`, its `camera` prop, passed at `event-experience.tsx:1611`; an empty camera album says "Take the first photo"). Give the board's `GuestPage` a `camera` prop that draws the camera's words and glyph and passes `camera` to the dock, and set it wherever a camera album is drawn: `guest.tsx`'s WaitPage for developing, the 9 am frames in `arrival.tsx`, and `NameFrame` and `TwiceWait` in `words.tsx`. In `spec.ts:63`, "(the cover, Add photos, her uploads' round, the shutter)" becomes words true of both albums, as "(the cover and its Add, Take photos on the camera's album, her uploads' round, the shutter)".
2. **The hub's Reel card.** `host.tsx:140` draws a developing album's card as "Premieres at 9 am"; production says "Live at the develop" until the develop time (`reel-card.tsx:292`). Draw production's words; the held half's "Off until 2 photos" was never production's either (`reel-card.tsx:424`, "Starts at 2 photos").
3. **Three older slips, cheap now:** `host.tsx:148` draws the Settings card as "Reviewed"/"Disposable" where production shows the door ("Public", `page.tsx:330`); the name ask's `disposable` option (`spec.ts:402`) says "As built:" where Settings calls it "The album's camera" (`camera-settings.tsx:159`), so drop "As built:"; the cover beat in `words.tsx:287` leaves out her uploads' round, which the board's own carried call `round` says production shows.

**Identity's sheets and the glyph count.** `sandbox/identity/sheet/voice.ts:112-114` and `sheet/status.ts:152-153` style `[data-slot="glyph-count"] [data-n]`, but production's number span (`src/components/ui/glyph-count.tsx:103`) carries no `data-n`, so on the board and at the wiring those rules reach nothing. Add `data-n` to production's number span (an attribute only, no visual change; a test pins it), so identity's drawings show its voice on the real atom. Never edit identity's folder (its sheets already ask for the hook).

Nothing else on either board moves: no option, recommendation, ask or desk place.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/the-wait/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `the-wait`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3132`; `pnpm lab:demo --board the-wait --base http://localhost:3132` and `--width 375`, and `pnpm lab:demo --board identity --base http://localhost:3132` (the glyph count reaches its drawings); a Vitest pin for `data-n`; before and after captures of each changed frame in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- The held album's Reel card on the hub: production draws a card with nothing in it as the counting card (dashed, its
  two pips from `sm`, `reel-card.tsx`'s `CountingCard`), and the rooms row here draws every card in the one plain shell,
  so the held half now says production's words ("Starts at 2 photos") in that shell. Recommended: leave the shell, since
  the row is `event-header`'s and no ask here is about a card's look. Built so; his to overrule.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the event head's hook table names the glyph count's number, `data-n`, in the atom's
  one row (the hook identity's voice and status sheets style; a rename moves both).

## Deferred (ROADMAP one-liners, bucket named)

- Now, Design: the-wait's hub quote draws the held album's Reel card in the plain shell where production's counting card
  is dashed with its two pips from `sm` (`reel-card.tsx`); draw both when a board next asks the hub's cards (from
  `desk-tune-4`).

## Handoff (replaces the chat report)

Scratch artifacts below live in `/Users/gibby/local/ai/partyreel-wt/_scratch/desk-tune-4/` (`S/`), pruned with the lane.

- Commits, pushed to `origin/lp/desk-tune-4`: the work `31dde69b`; the sync `699fa3dc` (launch-prep had moved: lab-frame's
  Frame, merged `0d69c92b`; the merge was clean and the design-system.md row survived); this manifest alone is the handoff
  commit. The gates ran on `699fa3dc`; typecheck, lint and test were also green on `31dde69b` before the sync (800 files,
  9462 tests).
- Gates on the synced tree `699fa3dc`, each on its own exit code: `pnpm typecheck` 0 (`S/typecheck-2.log`); `pnpm lint`
  0, no warning (`S/lint-2.log`); `pnpm test` 0, 801 files and 9469 tests (`S/test-2.log`);
  `zsh scripts/build-lock.sh pnpm build` 0 (`S/build.log`); `pnpm lab:smoke --base http://localhost:3132` 0, 151 checks and
  0 failing, the-wait's reading 853 words of 1200 (`S/smoke.log`); `pnpm lab:demo --board the-wait` 0, 6 steps and 0
  failing, at the 1440 window (`S/gate-demo-the-wait.log`), at `--width 375` (`S/gate-demo-the-wait-375.log`) and wearing
  `screen=1440` (`S/gate-demo-the-wait-s1440.log`); `--board identity` 0, 5 steps and 0 failing
  (`S/gate-demo-identity.log`); and, since they draw the real glyph count, `--board event-header,take-home` 0, 6 steps and
  0 failing (`S/gate-demo-glyph-boards.log`).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `the-wait/`'s `album.tsx`, `arrival.tsx`, `guest.tsx`,
  `host.tsx`, `spec.ts` and `words.tsx`; `src/components/ui/glyph-count.tsx` and its `.test.tsx`;
  `docs/systems/design-system.md` (listed under System-doc edits); this file. No exception.
- The items:
  1. `album.tsx`: `GuestPage` takes `camera`: the cover's Add says "Take photos" with the Camera glyph, as
     `event-experience.tsx` words it, and the real dock gets its own `camera` (the shutter's words and glyph). No frame is
     an empty album, so an empty camera album's "Take the first photo" is never drawn.
  2. `camera` is set on the developing album wherever it is drawn: `guest.tsx`'s `WaitPage`, the three 9 am pages of
     `arrival.tsx` (the develop leaves the album a camera's: `event.capture` does not change), `NameFrame`'s cover and
     morning and `TwiceWait` in `words.tsx`.
  3. `host.tsx`: the Reel card says "Live at the develop" on the developing album and "Starts at 2 photos" on the held
     one (`REEL_MINIMUM`); the Settings card says the door, "Public" (`doorLabel`, the hub page's own function).
  4. `words.tsx`: the name's cover frame draws her uploads' round (6, waiting to develop) beside the Add, as the carried
     call `round` says production does.
  5. `spec.ts`: the context reads "(the cover and its Add, Take photos on the camera's album, her uploads' round, the
     shutter)"; the `disposable` option drops "As built:" (the name step reads 150 words, from 152).
  6. `ui/glyph-count.tsx`: the number's span carries `data-n=""`, an attribute only (identity's own stand-in writes it the
     same way); `glyph-count.test.tsx` pins it (red on the old atom, "expected to have a length of 1 but got +0", green
     with it); the design-system.md row names it.
- Before and after, every changed frame: the BEFORE is the base's board and atom (`540d6baf`, put back into the tree from
  git) captured on the synced tree and the same warm server as the AFTER, so a pair differs by this lane's edits alone.
  Composites (before left, after right, the changed region) and a browsable `index.html`:
  `S/compare/control-vs-after2_w1440/` (the 375 frames: 61, 38 changed, 23 identical) and
  `S/compare/control-vs-after2_s1440/` (the 1440 frames: 61, 44 changed, 17 identical); the raw frames are
  `S/control/{w1440,s1440}` and `S/after2/{w1440,s1440}`. The changed frames are the ones the items reach (35 of 38 and
  42 of 44): every developing album's cover Add and shutter (the model step's "developing, 10:40 pm", the wait step's
  "developing, scrolled" and "taking one back", the arrival step's 9 am, the name step's cover and morning, the both
  step's Priya's album) and every hub's rooms row (the cover step's nine, the both step's host frames, the hub behind
  Settings at 1440). The rest are three Settings frames at 375 (40, 76 and 78 px, antialiasing on the switches' rounded edges, nothing
  visible) and two at 1440 (2 and 32 px of edge pixels): two captures of the unchanged base differ the same way
  (`S/compare/before-vs-control_w1440`: 13 frames, 1 to 431 px). The held frames, Create's cards and the premiere are
  identical.
- The glyph count reaches identity's sheets: the real atom answers `[data-slot="glyph-count"] [data-n]` (5 of 5 on the
  Library's page, 0 before), and with the identity board's own stylesheet injected its number takes the voice's readout
  (11.5px, 600, 1.15px tracking, uppercase; 14px, 400, normal before): `S/data-n-probe.txt`. Identity's own frames draw
  its stand-in, which already wore the hook, so its demo is unchanged. lab:smoke's PREMISE line (identity's five open
  asks describe design-system.md and `ui/`, which this change touched) re-read: the sheets already style the hook, so no
  ask's premise moves.
- Assets requested from Will: none
- Board ideas: the Reel card's words are written by hand in three drawings (`event-header/doors.tsx` and the help center's
  desk screens say "Live for guests", `the-wait/host.tsx` the rest); `reel-card.tsx` could export its value words as one
  pure function of (state, have, of, developing), as `doorLabel` and `reviewCardFace` already do for two of the row's other
  cards, so the next word change reaches every drawing. And the ROADMAP's identity stand-ins line: the glyph count's
  blocker is gone, the real atom carries the hook.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: the held hub's Reel card is plain, not dashed with pips (the question above); the name's cover
  frame now carries her round, as the carried call `round` says; `TwiceWait` (approval plus a develop) is drawn as the
  camera album, like every other frame of the wedding's developing album.
- Look at first: the model step's "developing, 10:40 pm" (Take photos with the camera, her round beside it), the wait
  step's "developing, scrolled" (the shutter wears the camera), then the cover step's three hubs ("Live at the develop";
  "Starts at 2 photos" on the held one; "Public") and the name step's cover.
