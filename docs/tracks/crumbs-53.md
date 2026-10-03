---
track: crumbs-53
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4ff5c0ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/how-partyreel-works.mdx
  - content/help/day-of-checklist-for-hosts.mdx
  - content/help/share-the-album-after-the-event.mdx
  - content/help/turn-off-uploads-or-cap-file-size.mdx
  - content/help/print-or-display-your-qr.mdx
  - src/lib/constants/how-it-works
  - src/components/marketing/sections/features/album/album-copy
  - src/components/marketing/sections/features/album/getting-in-stage
  - docs/systems/reel.md
  - src/components/guest/foreign-ticket
  - src/lib/disposable/develop-words
  - src/components/app/event-settings/camera-settings
  - src/components/guest/upload-tracker
  - src/components/marketing/sections/features/album/everywhere
  - src/components/app/pricing/gated-sites
  - src/components/shared/route-skeleton
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/dashboard.md
  - content/help/AUTHORING.md
---

# lp/crumbs-53

**Goal.** The next words and small homes made true after round 12: five help articles and three marketing lines still placing the reel at the album's top or the guest on a welcome screen, reel.md's retired tile, the welcome's cookie in its tests, one home for the develop time's words, and the hero fill's and the pulse's last names in code.

## The brief

**Why.** ROADMAP lines from `crumbs-51` and `door-reveal` (quoted there; retire each you finish by naming it in your Handoff, never by editing the ROADMAP):
1. **Help:** `how-partyreel-works.mdx` (:40), `day-of-checklist-for-hosts.mdx` (:53), `share-the-album-after-the-event.mdx` (:29) and `turn-off-uploads-or-cap-file-size.mdx` (:41) still play the reel "at the top" of the album, where the cover's round play button opens it (and the shutter's right-hand round deep in the album); `print-or-display-your-qr.mdx` (:50) has guests land on a "welcome screen", the doorway's page.
2. **Marketing:** `how-it-works.ts` (:130), `album-copy.ts` (:37) and `getting-in-stage.tsx` (:21) say a guest lands on "a welcome screen" that asks for a name; the welcome is the doorway's page and the name rises over it as a sheet (after the email where verification is on). Find each file by its name if a path above is off.
3. **Docs:** `reel.md` still draws the retired tile (:4, :9, :17, :50, :74, :144, :171, :187) and links Settings' `highlight-reel-card.tsx` (:152), now `event-settings/reel-page.tsx`; the reel's face is the album's cover (`guest-flow.md`'s album head).
4. **Tests:** `foreign-ticket.test.tsx` pins the welcome by the legacy `pr_welcome_<qr>` localStorage key; the flag is a cookie since `door-reveal`, so its five assertions read `document.cookie` (and `forgetWelcome`'s legacy put-down stays only if a test proves a reader).
5. **One home for the develop time's words:** the host's (`camera-settings.tsx`'s `DEVELOPS`) and the guest's (`upload-tracker.ts`'s `developTimeWords`) say one format twice; one formatter in `src/lib/disposable/` (a new `develop-words` file) holds both, under a test.
6. **Code hygiene:** the retired hero fill and the pulse live on in `everywhere-peek.test.tsx` (:239), `everywhere-section.tsx` (:14), `gated-sites.test.ts` (:94, :139) and `route-skeleton.test.tsx` (:45) (the dashboard page's own two at `dashboard/page.tsx` :109 and :295 are named in your Handoff, not edited: name the words they should say).

No product behaviour changes; words only where a test can hold them. Will's standard: far less text, never a tool's voice.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; each changed help article read on your dev server at 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- **`developTimeWords` lived outside `owns`.** It was in `src/lib/guest/upload-tracker.ts` (`owns` names the component, `src/components/guest/upload-tracker`). Recommended, built: that file's formatter and function become one re-export of `lib/disposable/develop-words.ts`, so `save-account-prompt.tsx` and the two tests keep their import; the lane check's one exception.
- **Does the camera's from-now wording join the formatter?** `lib/guest/camera/words.ts`'s `developsWhen` ("at 9 am", "Saturday at 9 am", "Oct 14 at 9 am") is the third way the develop time is said, with its own tests. Recommended: yes, as a second export of `develop-words.ts` that `words.ts` re-exports, in a change that owns `lib/guest/camera/words*`; not built here (outside `owns`, and the relative register is the camera's own pick).
- **Does `forgetWelcome`'s legacy `pr_welcome_<qr>` localStorage put-down stay?** Recommended: no, delete it. Nothing reads that key (`useWelcomeSeen` reads the cookie alone; `use-welcome-seen.test.tsx` :84 pins the old key as meaning nothing), and before launch there is no stored key to put down. Not built (`use-welcome-seen.ts` is outside `owns`; its pins in `use-welcome-seen.test.tsx` and `device-tickets.test.tsx` go with it); `foreign-ticket.test.tsx` no longer writes or reads the key.
- **Rename `RouteSkeleton`'s `pulse` variant to `dashboard`?** Recommended: yes, as its own small change: it reaches `dashboard/loading.tsx`, the Library's `interactive-demos.tsx` (:22) and `gallery-demos.tsx` (:364) and `dashboard-skeleton.tsx` (:7), all outside `owns`. Built here: the test's title only (it walks every shape, so it now says "every shape").
- **`how-it-works.ts` carried a fourth stale line** (:158, the clip step: "The reel plays at the top of the album"). Recommended, built: "Open the reel from the album's cover."

## System-doc edits (in place, owned facts only)

- `docs/systems/reel.md`: the retired tile is the cover's play button (and the shutter's right-hand round) at the model, the payload's minimum, the take's stills, the cover's face, the host's card line, the lever and the creator's one door (the view's Make your own); the retired band's step is the dashboard's item; Settings' reel is `event-settings/reel-page.tsx`, a page that saves each choice as it is made.

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: `device-tickets.test.tsx` pins the welcome by the legacy `pr_welcome_<qr>` localStorage key too (:47-48, :88-89, :130, :136, :144), which holds only while `forgetWelcome` still puts that key down; the cookie is the flag, so it reads `document.cookie` as `foreign-ticket.test.tsx` now does, and `use-welcome-seen.ts`'s legacy put-down (`LEGACY_PREFIX`, `forgetWelcome`'s and `forgetAllWelcomes`' `localStorage` removals, the `storedKeysWithPrefixes` import, and `use-welcome-seen.test.tsx` :104 and :115) has no reader to keep it (from `crumbs-53`).
- Code hygiene: the dashboard's last "pulse" names: `dashboard/page.tsx` (:109 and :295 say "the pulse" for the stage's last hour; :222's `pulse_door_waiting` seam), `lib/dashboard/stage.ts`'s and `stage.tsx`'s `pulse`, `RouteSkeleton`'s `pulse` variant (`route-skeleton.tsx`, `dashboard/loading.tsx`, the Library's `interactive-demos.tsx` and `gallery-demos.tsx`, `dashboard-skeleton.tsx`), `next-step.ts`'s comments and `guest-flow.md` (:808) (from `crumbs-53`).
- Marketing: two blog posts (`highlight-reel-renders-on-your-phone.mdx` :30, `scanned-a-qr-code-where-your-photos-go.mdx` :72) and `sections/reel/live-section.tsx` (:22, :98) still place the reel "at the top of the album", where the cover's play button opens it (from `crumbs-53`).
- Code hygiene: `LiveReelView`'s `creatorAsked` and `onCreatorAskSpent` have no caller since the tile's line went (`live-reel-view.tsx` :168-170 and :560-578; held only by `live-reel-view.test.tsx` :358-380 and a stub in `live-reel.test.tsx` :66-81) (from `crumbs-53`).

## Handoff (replaces the chat report)

- The work commit `6dd4c73a` and the sync commit `fc41730c` (origin/launch-prep `c418312c`: disposable-camera and the-wait had merged; one auto-merge in `src/lib/guest/upload-tracker.ts`, no conflict), pushed to `origin/lp/crumbs-53`; launch-prep had not moved again at the push (0 behind); the head, this manifest's commit, is in the chat line.
- Gates on the synced tree `fc41730c`, each on its own exit code (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-53/`): `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0, no warnings (`gate-lint.log`); `pnpm test` 0, 798 files and 9430 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3133 --timeout 90000` 0, "150 checks, 0 failing" (`gate-smoke.log`). Before the sync the same typecheck, lint and test were 0 on `6dd4c73a` (790 files, 9343 tests). No `lab:demo` (no board). The smoke's PREMISE line names the-wait and identity as importers of `camera-settings.tsx`: its words are byte for byte what they were (the host's sentence reads the shared formatter and prints the same).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 20 owned paths + this file, and one exception, `src/lib/guest/upload-tracker.ts` (where `developTimeWords` lived; `owns` names the component, not this file): its formatter and function replaced by one re-export of `develop-words`, so `save-account-prompt.tsx` and the two tests keep their import (the first Question).
- The items, one line each:
  1. Help: `how-partyreel-works.mdx` (:40), `day-of-checklist-for-hosts.mdx` (:53), `share-the-album-after-the-event.mdx` (:29) and `turn-off-uploads-or-cap-file-size.mdx` (:41) say the reel is one tap from the album's cover; `print-or-display-your-qr.mdx` (:50) has guests meet the event's welcome; `updated` is 2026-10-02 on the three that were older. Each read on my dev server at a true 375 (DevTools device emulation: layout width 375, no horizontal overflow, no console warning or error): `_scratch/crumbs-53/shots/help-*-375-passage.png`.
  2. Marketing: `how-it-works.ts` :130 ("The welcome names the event. Say what to call you, add a first photo, and the album opens.") and, beyond the named line, :158 (the clip step opens the reel "from the album's cover"); `album-copy.ts` :37 ("land on the event's welcome"); `getting-in-stage.tsx` :21 (a comment: the phone's second screen is "the welcome"). Read on `/how-it-works` with Guest pressed at 375 and `/features/album` at 375 and 1440 (the subhead is still two rows at 1440).
  3. Docs: `reel.md` draws no retired tile or band (what still says "tile" is the demo's photo tiles, :56, and the code's own names `tileStills` and `reel-tile.ts`, :76-77), links `event-settings/reel-page.tsx`, and every relative link in it resolves (checked by script).
  4. Tests: `foreign-ticket.test.tsx` seeds the welcome as the cookie and its five assertions, with the sign-out key loop's two, read `document.cookie` (`seeWelcome`, `welcomeSeen`, `clearCookies`: cookies outlive `localStorage.clear()`). Mutation-checked, each restored after: `forgetWelcome` keeping the cookie fails the add-email test, `forgetAllWelcomes` keeping them fails both sign-out tests, the name step's put-down forgetting the welcome fails the name-step test.
  5. One home for the develop time's words: `src/lib/disposable/develop-words.ts` (`developTimeWords`) with `develop-words.test.ts` (the format, the instant however the wire spells it, nothing for an unreadable time, and a scan that neither side builds a formatter of its own). `camera-settings.tsx` (its `DEVELOPS` is gone; an unreadable time now draws nothing where it threw) and `upload-tracker.tsx` read it; the two sentences are pinned whole in `camera-settings.test.tsx` ("Develops ...", "Developed ...") and `upload-tracker.test.tsx` ("when it develops, ..."). Mutation-checked, each restored after: a formatter of its own in Settings, the tracker's words dropped, the weekday lost: each fails a test.
  6. Hygiene: `everywhere-peek.test.tsx` :239, `everywhere-section.tsx` :14, `gated-sites.test.ts` :94 and :139, `route-skeleton.test.tsx` :45 no longer say the hero fill or the pulse. The dashboard page's words: `dashboard/page.tsx` :109 and :295 should say "the stage's last hour" where they say "the pulse" (`lib/dashboard/stage.ts`'s `pulse` is that count, drawn as "N in the last hour"); :222's `pulse_door_waiting` seam is a name Sentry groups by, so its rename to match its `dashboard_*` siblings is the page's lane's call.
  7. ROADMAP lines this retires, by their openings: "Help: `how-partyreel-works.mdx` (:40)"; "Marketing: `how-it-works.ts` (:130)"; "Code hygiene: `foreign-ticket.test.tsx` pins the welcome"; "Code hygiene: the develop time is said in two homes". It trims "Docs: `reel.md` still draws the retired tile" to `guest-flow.md`'s header (:4), and "Code hygiene: the retired hero fill and the pulse" to `dashboard/page.tsx` (:109, :295) and `docs/ASSETS.md` row 22. The disposable-camera line on the develop time's "third way" can say `lib/disposable/develop-words.ts` exists.
- Assets requested from Will: none
- Board ideas: the door's pictures (`entry-phone.tsx`, `how-it-works/guest-pictures.tsx`'s `DoorPicture`) and the guest's "Step inside" and "Add your photos" tell a door of welcome, name and a first photo, the welcome a card on a phone and the steps after it one held sheet; the product's welcome is the doorway's page (a door standing open on the cover), each step rises over it as its own sheet, and the first photo is the host's "A photo first", off by default: a pass to redraw both from the doorway.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each:
  - The reel is "one tap from the album's cover" in the four help articles and "Open the reel from the album's cover" on the site; the shutter's twin deep in the album goes unsaid there (crumbs-51 named it only where the reel is the subject).
  - The site says "Say what to call you, add a first photo" and "the event's welcome", never "a sheet" (the product's word, not the site's); the first-photo claim is left as it was (the host's switch, off by default; see the board idea).
  - `reel.md` says "the dashboard's item" where it said "the band's step" (the band went with host-dashboard r1), and drops "since `header-wiring`".
  - The legacy welcome put-down stays in code and `RouteSkeleton`'s `pulse` variant keeps its name, both named for their own small changes (the Questions).
- Look at first: `/help/how-partyreel-works` (step 6) and `/how-it-works` with Guest pressed ("Step inside", "Make your clip"), each at 375.
