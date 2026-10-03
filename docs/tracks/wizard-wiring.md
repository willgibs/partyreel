---
track: wizard-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard
  - src/app/(app)/dashboard/new/
  - src/components/app/qr-preset-picker
  - src/lib/events/readiness
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/create-wizard/
  - docs/reviews/create-wizard.json
  - docs/systems/host-app.md
---

# lp/wizard-wiring

**Goal.** Wire Create as the room in Will's layout with create-wizard r2's picks (flow=carry, look=places, beat=develop), its add step left to create-wizard r3.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers.**

create-wizard r2, his desk on build 45, 2026-10-03, in full:
- flow=carry.
- add=? "These are all presented well already. This is really tough for me to decide, so let's run a second exploration so I can pick from an even more polished option set. Really important we can cleanly (yet beautifully) nail the distinction for hosts here, without overcomplicating or decision paralysis." (create-wizard r3 explores it after you merge.)
- look=places.
- beat=develop: "This is a beautiful screen and allows everything to breathe, with lots of our aurora identity infused. The steps beneath could be designed better, while remaining somewhat minimal."

Round 12's settled layout, his words: "Always keep the question up top so users aren't searching for the spot of the new one in a centered group each time." "The name screen, for example, would be 'Name your event' up top, input center, continue bottom." "Love the subtle steppers up top now." On lit: "This screen presents more cleanly with less going on (first win), but also keeps hosts in the event flow"; See it as a guest is "a final payoff, not mid-point distraction".

**Build:**
1. **Create as the room:** subtle steppers on top, the question just under them in one place, the answer's space in the centre, one button at the foot, from the board's drawings.
2. **flow=carry:** each answer rises into the head, above hairline steppers that press back.
3. **look=places:** the code where guests meet it, with four swatches re-dressing the code card and the room's screen.
4. **beat=develop:** the sample develops into her code; Print and Share stand as rounds; Settings' steps beneath are redesigned and kept minimal.
5. **The add step waits** for create-wizard r3's wiring, along with any create-time capture or develop fields. Production's Create keeps Name, Style and Ready meanwhile. The board's night slider belongs to the add step.

**Constraints:**
- `identity-wiring` merges first: sync onto it.
- `rooms-wiring` owns `host-app.md`: list your doc lines in your Handoff for the record.
- Red first.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board create-wizard` at 1440 and 375 (its PREMISE moves: report what its drawings no longer match); Vitest red first for each screen's question in one place, Back, the carry, the swatches, the develop beat and the at-cap door; captures of every screen at 1440 and 375, paper and room, in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommendation is built; each is his to overrule.

- **Settings' steps under the code** (his develop note: "designed better, while remaining somewhat minimal"):
  Settings' own rail laid flat, its numbered marks ticked once ready on its own joining line (green between two
  done), the checklist's one line under it, each mark named for a screen reader as Settings names its row.
  Recommended: it reads as the steps Get it ready opens onto. Overrule: each step named under its mark (rise's
  rail), or one line naming what guests still need.
- **While Create runs** (under a second, usually): the beat lands at once on the sample she styled, breathing, the
  foot saying "Creating your event…", nothing saying live before the event exists; a refused or dropped Create
  takes her back to the look, her name and look kept. Recommended: immediate, and honest about the wait.
  Overrule: hold the look, Create event pressed, until the event exists.
- **The link on the look step's pictures** reads `partyreel.com/e/…`, since no link exists before Create.
  Recommended. Overrule: a slug from her name, as the board drew it (no new event has one).
- **The room's light**: the Aurora's field at the floor on the name and the look (`SectionLight`'s own register,
  never the board's stand-in gradient), dimmed on the beat for the code's own bloom, which ignites as the code
  turns real; the door at the cap unlit. Recommended. Overrule: the board's brighter seam, a register of its own.
- **A phone's own Back**: the steps take no history entry (as the card did), so it leaves Create; the head's Back,
  her name in the head and a done hairline walk the screens. Recommended: no Back can reach the look after the
  event exists. Overrule: a same-URL entry a screen, taken back at the beat.

## System-doc edits (in place, owned facts only)

`host-app.md` is rooms-wiring's this round, so these are its "Events and the create flow" lines for the record,
none placed:

- Replaces "The sole create path is the `/dashboard/new` wizard": **The sole create path is `/dashboard/new`**
  (`create-event-wizard.tsx`, its screens in `create-event-wizard/`), a room of its own, dark in both themes, in
  Will's layout (the steppers, the question in one place, the answer in the centre, one button at the foot): the
  name, the code's look, then the beat. It creates once, at commit (an abandoned Create leaves no row), through
  the non-redirecting `createEventInWizard`, which returns the id and token so the beat can draw the real code.
  Only the name is required; everything else is edited in Settings (below). `enforce_event_limit` guards
  `MAX_EVENTS` in SQL. ★ So the look step's codes are samples and say so in one word on the pictured code: they
  encode the stand-in link (`previewJoinUrl`, as long as a real one, naming nobody's album), which a test-scan
  meets as a 404.
- New: ★ **The room is `fixed` over the (app) shell, and the shell's bar steps aside in CSS** (`data-app-room` on
  the room, `group-has-[[data-app-room]]/shell:hidden` on the header: the wide page's own way of asking), so
  nothing of the app stands around Create or waits in the tab order behind it. It stands on a phone's keyboard
  (`useKeyboardInset` lifts its foot), and the route waits in its own room (`RouteSkeleton`'s `room`), never
  the dashboard's paper skeleton.
- New: ★ **The carry (`carry.ts`) photographs the leaving screen and flies her name between the field and the head**
  on the Web Animations API, measured off both (the field's invisible mirror, `[data-room-name-text]`), the
  arriving screen live from its first frame; a new change finishes a running one (`settle`), and reduced motion
  (or no `animate`) cuts. Back exists on the look alone: never on the name, never once the event exists.
- Replaces the beat's line: ★ **The beat happens once in an event's life, by construction**: only Create event
  reaches it. It lands at once on the sample she styled while the event is made (nothing says live before it is;
  a refused or rejected Create returns to the look, her name and look kept), develops into the real code (what
  mounts with the event arrives on `@starting-style`, the code's bloom igniting with it), then Print and Share as
  rounds, Settings' five laid flat (`settingsSteps`) over the checklist's line, room beside them past the
  dashboard's threshold (`newEventFacts` with the route's `storageUsedPct`), and Get it ready into Settings' first
  step; the room's close leaves for the event. The custom link belongs to the share sheet.
- In the cap line: "...the wizard renders the refusal (the plan's number, the event holding the slot, Delete, Pro)
  in the room, unlit, instead of its screens...".

## Deferred (ROADMAP one-liners, bucket named)

- Host: the hub and the dashboard say the account's storage percent inline; `storageUsedPct`
  (`lib/events/readiness.ts`) is its one home now (from wizard-wiring).
- Host: Settings' rail maps its steps to the checklist's items itself (`settings-rows.tsx`'s `GROUPS` and
  `STEP_ITEM`); `SETTINGS_STEP_ITEMS` in readiness is the map the beat reads, and Settings could read it too (from
  wizard-wiring).
- Lab: a Library specimen of Create's room whole over a stand-in create (the wizard's `create` prop is the seam, the
  review room's precedent), so `lab:demo` holds the carry and the develop that localhost cannot reach signed in
  (from wizard-wiring).
- Marketing: how-it-works' Create picture (`host-pictures.tsx`'s `CreatePicture`) still draws a Details, Design,
  Share rail Create has not had since first-event (from wizard-wiring).

## Handoff (replaces the chat report)

Logs and captures: `/Users/gibby/local/ai/partyreel-wt/_scratch/wizard-wiring/` (below, `_scratch/`).

- **Commits, pushed:** `c3547436` (the work), `fd9edeb2` (a dropped connection never leaves the beat developing),
  `740d7fc3` (the corners' hairline on paper), then this manifest alone. Cut from `c925e48f`. **No sync commit:**
  launch-prep moved to `6b3d132e` with records alone (cost-model's PRICING.md and the pickup); nothing in this
  lane's `reads`, no path in common (`comm -12` of the two `git diff --name-only` lists is empty). ★
  **identity-wiring had not merged** (its branch still at the cut, `c925e48f`), so the sync onto it is owed when it
  lands; its owns and this lane's paths share nothing, and the room wears `Button` and `Input` unchanged (identity
  r2 leaves actions and fields to r3).
- **Gates on `740d7fc3`'s tree, each on its own exit code:** `zsh scripts/build-lock.sh pnpm typecheck` 0
  (`gate-typecheck.log`), `pnpm lint` 0 (`gate-lint.log`, 0 warnings), `pnpm test` 0, 814 files and 9,625 tests
  (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`; the room's rules read in the built
  sheet, its entrances inside `prefers-reduced-motion: no-preference`), `pnpm lab:smoke --base
  http://localhost:3135` 0, 151 checks (`gate-smoke.log`; scope create-wizard, event-header, host-dashboard,
  identity, the-wait), `pnpm lab:demo --board create-wizard` 0 with no open step (`gate-demo.log`: add is held for
  r3), so each of its four steps was pressed with `--only` at 1440 and with `--width 375`: 8 steps, 0 failing
  (`gate-demo-steps.log`). **Red first:** the lane's tests as first written, 82, ran 49 red against production before a
  line of it changed (`red-first.log`); two more joined with the code they pin (the room's wait, a dropped connection).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, plus this file): every path under `owns` but four,
  each with why:
  - `src/components/shared/app-shell.tsx`: one class on the header (`group-has-[[data-app-room]]/shell:hidden`), the
    shell's own way a page asks in CSS, so the app's bar steps aside for the room;
  - `src/components/shared/route-skeleton.tsx`: a `room` shape (an import, the union's member, one branch), because
    `route-skeleton.test.tsx` holds every (app) `loading.tsx` to it and the nearest wait above `/dashboard/new` was
    the dashboard's paper skeleton cut to the dark room a beat later;
  - `src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx`: the picker entry's `for`, `test` and
    `lede`, true to the corners (`library-picker-1440.png`);
  - `content/help/create-your-first-event.mdx`: the three steps' words true to the room (its question, the look on
    samples, Print and Share, the five steps, the close), its description and date.
- **The items:**
  1. **The room** (`create-event-wizard/room.tsx`, `create-room.css`): the whole screen, dark in both themes
     (`[color-scheme:dark]`, the browser's bar `#040405` from `page.tsx`'s `viewport`), the steppers, the question
     in one place, the centre, one button at the foot; it stands on a phone's keyboard; the Aurora's field at the
     floor; its own wait (`loading.tsx`).
  2. **flow=carry** (`carry.ts`): her name flies from the field's words to the head's line and back (measured,
     finished by the next change, cut under reduced motion); the head carries her name from the look on; Back, the
     name and a done hairline go back; never on the name or the beat. Focus moves to each screen's question (the
     field on the way back).
  3. **look=places** (`look-step.tsx`, `qr-preset-picker.tsx`): the code card on her phone and the room's screen,
     both re-dressed by four corner swatches (a radio group, the arrows choosing); "Sample" on the pictured code.
  4. **beat=develop** (`beat.tsx`): the sample while Create runs, then her code, the bloom, Print and Share as
     rounds, Settings' five laid flat, room past 85% (the carried `room`, the route reading `getHostStorageSummary`,
     a failed read filed as `create_room_storage` and left out), Get it ready; the close to the event (the carried
     `close`); a refused or rejected Create back to the look.
  5. **The door** (`cap-door.tsx`) in the room, unlit: the plan's number up top, the events holding it with Delete it
     in the centre, See Pro alone at the foot; the snapshot at mount kept.
  6. **Readiness** (`readiness.ts`): `settingsSteps` and `SETTINGS_STEP_ITEMS`, `storageUsedPct`, `newEventFacts`'
     storage; 6 tests added (22 in `readiness.test.ts`).
  7. **Tests:** `room.test.tsx` 20, `create-event-wizard.test.tsx` 12, `create-flow.test.tsx` 20 (three reshaped on
     purpose, each naming its scar: the looks a radio group, Sample in one word, Go to your event in the close), `page.test.tsx` 6 (new), `qr-preset-picker.test.tsx` 4 (new).
  8. **The add step waits** for create-wizard r3: three hairlines meanwhile, `STEPS` the one list it joins.
- **Seen in a headless Chrome of my own** (`_scratch/cdp.mjs`, `flow.sh`) on the production component through a
  scratch harness over a stand-in `create` (`_scratch/harness-page/`, never committed): every screen at 375 and
  1440, room and paper (`shots/final/1-name` to `9-door`, `-375-`/`-1440-`, `-dark`/`-light`: the room dark in a
  light session too), the carry in flight (`carry-up-mid-1440-dark.png`, `carry-down-mid-1440-dark.png`; landed: no
  flight left, the head visible, focus on the question), the beat under reduced motion standing whole
  (`beat-375-dark-reduced.png`), a 667-tall phone fitting without a scroll. Signed-in, a phone's real keyboard and
  the real action are the alias's (below).
- **PREMISE, what the board's drawings no longer match:** four hairlines (production three until the add step
  joins); the pictured code card's "All" (production's card and picture say Everything); the pictures' slug
  `partyreel.com/e/maya-jay` (production `partyreel.com/e/…`); no Sample on the look's pictures (production says it
  on the pictured code); the beat's five bare ticks beside its line (production lays Settings' rail flat over it);
  the light's gradient stand-in (production the Aurora's field and the code's bloom); the drawn keyboard
  (production stands on the phone's); the flow's change into how guests add (production's Continue goes to the
  look). Board frames for comparison: `_scratch/shots/board/`.
- **For the round's red-team on the alias:** New event lands in the room at once, no app bar; on a phone Continue
  rides on the keyboard; the carry, Back, the name, a hairline; Create event develops into the real code (scan it:
  the album; scan a sample: a 404 the word Sample explains); Print, Share; Get it ready on Settings' door page; the
  close to the event; a Free host at the cap meets the door (Delete it, See Pro); an account past 85% sees room and
  See plans; reduced motion; a light session.
- Assets requested from Will: the room's screen at a party · 16:9, 1000 x 563 (twice the 500 px picture), one still,
  JPEG · replaces marketing still `party-dj` in `create-event-wizard/look-step.tsx`.
- Board ideas: the profile setup (`profile-setup-wizard.tsx`) is still a card of three steps beside a Create that is
  now a room: is a host's first page setup a room too?; the beat's Share could open the code card (Copy link,
  Share, Everything), one door with the hub's Invite.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the words ("Name your event", "Pick the code's look", "Change it any time from Share",
  "<name> is live", "Creating your event…"); the field's placeholder "Maya & Jay's Wedding" at the name's size;
  Go to your event in the close (the carried `close`); room on the beat with See plans (the carried `room`); the
  carry's 520 ms flight and the develop's about 1.2 s (a once-an-event beat over the 300 ms ceiling, as the
  arrival is); the picker as four corners in the Library too; the help article rewritten to the room.
- Look at first: `_scratch/shots/final/7-beat-375-dark.png`, `carry-up-mid-1440-dark.png`,
  `5-look-dots-375-light.png`.
