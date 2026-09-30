---
track: crumbs-23
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2049e1ea"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-rows.tsx
  - src/components/shared/album-window.tsx
  - src/components/app/media-grid.tsx
  - src/components/ui/popup.tsx
  - src/components/app/event-settings/door-page.tsx
  - src/app/(dev)/design/gallery/specimen.tsx
  # added by the lane, each with its reason:
  - src/app/(dev)/design/gallery/specimen.test.tsx   # the Library head's class contract (new)
  - src/components/ui/popup.test.tsx                 # the layer that takes no tap while it arrives
  - src/components/guest/gallery-rows.test.tsx       # (new) what the wiring hands the rows
  - src/components/guest/use-arrival-gate.ts         # (new) the gate: link, decode, let in, glow
  - src/components/guest/use-arrival-gate.test.tsx   # (new)
  - src/components/guest/live-gallery.tsx            # hands the rows the arrivals and the way to ask for their links (two props)
  - src/components/guest/live-gallery.test.tsx       # its seam test reads the arrivals now
  - src/lib/adopt-typed-value.ts                    # (new) text typed before hydration is handed to the field's own onChange
  - src/lib/adopt-typed-value.test.tsx               # (new) a server-rendered form, typed into, then hydrated
  - src/components/ui/input.tsx                      # the primitive adopts through the hook
  - src/components/ui/textarea.tsx                   # the same
  - src/app/(app)/dashboard/[eventId]/guests/invited-section.tsx  # a bare <input> over its own state: the hook
  - src/lib/early-press.ts                           # (new) the inline recorder's source, the freshness rule
  - src/lib/early-press.test.tsx                     # (new)
  - src/components/auth/early-press-button.tsx       # (new) the button that answers the tap it missed
  - src/components/auth/early-press-button.test.tsx  # (new) server HTML, a click, then hydration
  - src/components/auth/account-door.tsx             # Continue with Google is that button
  - src/components/auth/account-door.test.tsx        # pins it
  - src/app/(auth)/layout.tsx                        # (new) the ~200-byte recorder, an inline <script> as the sign-in HTML parses (not the root layout: perf-404 owns it)
  - src/app/(auth)/layout.test.tsx                   # (new)
  # the door menu's invite line (the migration, its count, its words, the menu and the steps page):
  - supabase/migrations/20260929233000_door_counts_listed.sql  # (new) event_door_waiting_listed + event_door_counts' `waiting_listed` key
  - src/lib/db/queries/event-doors.ts                # DoorCounts.waitingListed, read defensively
  - src/lib/db/queries/event-doors.test.ts
  - src/lib/event/door/words.ts                      # listedWouldComeInLine: the menu's own words, one home
  - src/lib/event/door/words.test.ts
  - src/components/app/event-settings/settings-rows.tsx       # the menu's line (the door menu lives here, not in door-page.tsx)
  - src/components/app/event-settings/settings-rows.test.tsx  # (new)
  - src/components/app/event-settings/door-page.test.tsx
  - src/components/app/event-settings/testing/host-event.ts   # NO_COUNTS gains the key
  - src/app/(dev)/design/sandbox/event-ready/fixtures.ts      # ONE-LINE EXCEPTION: a board's DoorCounts literal gains `waitingListed: 0` (no lane owns event-ready)
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/crumbs-23

**Goal.** Build 26's red-team finds: a live pushed arrival landing without its fade, a double tap at a phone never landing inside the sheet it opened, the door menu's invite list saying it lets in whom it names, the first keystroke or click after a load never lost, and the Library's album-stream page held to its width.

## The brief

Build 26's red-team (`../partyreel-wt/_scratch/redteam-26/ledger.txt`) found these; each is fixed at its root with a test that fails on today's code where a test can hold it:

- **A live pushed arrival still fades.** `crumbs-18`'s `data-instant` shows a photograph at once only when it is complete at mount, but nothing fetches or decodes an arrival before the album pushes it, so a live arrival on the guest album mounted with `complete:false` and a 0.3 s opacity fade, against the album's `arrival=push` (only its glow fades). The marketing stage pre-decodes and there every arrival was instant. Decode an arrival before it mounts where the album pushes it (`gallery-rows.tsx`, `album-window.tsx`), so it lands complete; one that fails to decode, or takes long, still mounts and fades.
- **A double tap at 375 lands inside the sheet it opened.** The sheet fades in under the finger, so the second tap hits a row: on the hub's Settings card it opened the "This event" page (on the Share door it would land near "Save link"). A layer a tap opened takes no tap until it has settled, at the popup's one home (`ui/popup.tsx`), so every sheet holds it.
- **The door menu doesn't preview the invite list's effect.** Public's line says it lets in the person waiting; the invite list's says nothing, even when the list names her and choosing it lets her in (`crumbs-17`'s admit). Say it when it would, in the menu's own words.
- **The first keystroke or click after a page load is often lost** on the alias: the new event's name, the Guests room's Invited field, and Continue with Google. Find why (a controlled input reset at hydration, a handler attached late, a remount), and fix it at its root. `crumbs-20`'s `ClientForm` answers only a submit before hydration. Measure it on your dev server with a slowed load.
- **The Library's album-stream page scrolls sideways at 1440** (2,019 px wide, 579 px of sideways scroll): the specimen caption in `src/app/(dev)/design/gallery/specimen.tsx` (`max-w-[24ch] truncate sm:max-w-none` inside a `shrink-0` span) runs 1,089 and 1,607 px wide on that page, and the tabs' screen-reader labels spill past the specimen's clip.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- each driven on your dev server where localhost reaches it.

The signed-in hub and the guest album's live push cannot run there, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception. Never a path `crumbs-22` owns (its manifest).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **A tap on a control that needs its script, made before the page could hear it: keep it, or only cue it?** Continue with Google's first tap on a cold phone reached nothing (React replays no press made before its own script runs). **Recommended, built: keep it**: a ~200-byte recorder remembers a tap on a `data-early-press` control and the button answers it once at its own hydration, only if it is under 5s old (a tap that waited longer is the person's to make again). The other two answers: a real link to a server route that starts the sign-in (works with no script at all, but changes the auth path and cannot be walked on localhost, a one-way door I did not walk), or a waiting cue on the button (the tap stays lost).
2. **Does choosing the invite list ask first, as Public does?** **Recommended, built: no.** The menu says who it lets in as a note under the row, and the steps page as a line on the row before it is chosen, with no extra tap: the host named those people. (Public asks because it lets in everyone.)
3. **How long may an arrival wait to land complete?** **Recommended, built: 2s, and at most 12 at once**, then it mounts and fades as it always did; the guest album only (the host's album is a ROADMAP line below).
4. **Should every text field adopt what was typed before the page hydrated?** **Recommended, built: yes**, in the `Input` and `Textarea` primitives and the Invited field, so a browser's autofill and form restore, which arrive the same way, are kept too.
5. **A layer that is arriving, or leaving, takes no tap, a confirm's included.** **Recommended, built: yes to both**, for every popup, so a confirm's "Delete" can never be a double tap's second. A harness that clicks a sheet within about 300ms of opening it is swallowed too: wait for it.

## System-doc edits (in place, owned facts only)

Five `docs/systems/` files, each fact refined in its one home (none of them is under `owns`; they are the lane check's listed exception):
- `architecture.md`: Host-page hydration gains two facts, typed text adopted (never overwritten) and a tap kept for the controls that ask, with where the recorder stands and why `next/script`'s inline `beforeInteractive` is after that window.
- `design-system.md`: the popup bullet gains "a layer a tap opened takes no tap until it has settled" (`arriving`, read off `getAnimations`); the tile bullet points at the arrival gate.
- `guest-flow.md`: the ARRIVAL bullet gains the gate (link, decode, let in; its wait, its cap, what it never holds, the glow lit at landing).
- `host-app.md`: the door section gains the menu's and the steps page's "who the list would let in" line and where its count comes from.
- `database-security.md`: Gotchas gains "a read that asks the invite list's match is a SECURITY DEFINER body" (`event_door_lists_account` reads `auth.users`).

## Deferred (ROADMAP one-liners, bucket named)

- Host: the host's album lands a live arrival the way the guest's did before `use-arrival-gate.ts` (no link at push, so a shimmer and a fade); the same gate over `HostMediaGrid`, beside folding `useArrivedIds` onto `useArrivalMarks` (the line above it already says the second).
- Guests: a guest's own upload draws its object URL until the link lands, then the presigned preview (`MediaTile`'s `sameObject` is false across the two), which resets its landing to the shimmer and fades it in a second time; unmeasured, read it on the alias with a real upload.
- Auth: about 32 files draw a bare `<input>`; any that is controlled and drawn open on the server loses text typed before hydration as `Input` no longer does: route them through `useAdoptTypedValue`, beginning with the ones on pages a person lands on and types into at once.
- Database: `event_door_admit_listed` and `event_door_waiting_listed` spell one predicate twice (the migration's proof holds them equal); one set-returning helper both read would keep the rule once, with a parity guard in `migration-guards.test.ts`.
- The lab and the kit: the Library draws only the older Dialog and Sheet, never a `PopupContent`, so the popup's arrival guard had no specimen to drive and was walked on a scratch page; a specimen (a card that opens a `settings` popup with rows that count their taps) lets `lab:demo` hold it.

## Handoff (replaces the chat report)

- **Commits, pushed** (`git log origin/lp/crumbs-23`): work `bc0845e2` (Library head, popup), `ab96799e` (arrival gate), `8e387932` (typed text, early press), `a1f95193` (door lines and the migration), `2f773305` (cap of twelve, the docs), `0c20cb36` (a header note), `7cde1108` (the recorder in `(auth)/layout.tsx`, the layer roles from their one home: crumbs-22's relay), `14215c13` (the race fix below); syncs `61d7d7be` (shared-claims landed at 6e53b319, types e958a1bf) and `688e8c5d` (crumbs-22 landed at 9c4897ad). launch-prep has moved once since, by records alone (crumbs-24's cut and two pickups: its owns overlap none of mine), so no third sync.
- **Gates on the synced tree, head `14215c13`, each on its own exit code** (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-23/final-*.log`): typecheck 0; lint 0; test 0 (643 files, 7,623 tests); build 0; `lab:smoke` 0 (136 checks, scope: the Library, the shell and the `event-ready` board, whose fixture this lane touched by a line; its three PREMISE lines name the boards whose asks describe `guest-flow.md` and `host-app.md`, which this lane refined: disposable-mode, event-ready, locked-door). The full gate also caught a real race in this lane's own new hook, fixed at `14215c13` (a later offer of typed text could put the old text back over a character typed in the first frame after hydration; the test is red on the old hook 3 of 3, and green 5 runs after).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every file is under `owns`, this manifest, or the five `docs/systems/` files above. Exceptions: `src/app/(dev)/design/sandbox/event-ready/fixtures.ts` is one line (a board's `DoorCounts` literal gains `waitingListed: 0`; no live lane owns that board); the recorder was first written into the root layout and moved to `src/app/(auth)/layout.tsx` when `perf-404` (live, owns `src/app/layout.tsx`) made `track-manifests.test.ts` refuse the overlap. Also `src/components/app/event-settings/settings-rows.tsx`, not `door-page.tsx`, is where the six-door menu lives; both are owned.
- **The items, each red on today's code and green on this:**
  1. **A live arrival fades** (`ab96799e`, `2f773305`): worse than the brief supposed, a delta brings no link (`url: ""`), so the tile drew a shimmer and only then an `<img>`. `use-arrival-gate.ts` (in `GalleryRows`) holds each arrival out of the rows until its link has landed and its photograph is decoded (`decodeTileImage`, at the tile's own address `tileImageSrc`), then lets it in; 2s at most, 12 at once, a failed decode at once, reduced motion and the seed and a filter's toggle never held, the glow lit at landing. Tests: `use-arrival-gate.test.tsx` (18), `gallery-rows.test.tsx` (2 red on the old wiring), `live-gallery.test.tsx`. **Driven in Chrome** on a scratch page that simulates the provider (a link minted only when asked, a foreign-origin URL; probe `_scratch/crumbs-23/arrival-probe.mjs`): gate off, the tile mounts with no `<img>` and the `<img>` arrives `complete:false, instant:false`; gate on, in the dev server and again in a production build, the tile mounts about 180ms after the delta with `complete:true`, `naturalWidth 900`, `data-instant`, `data-entering`, `data-arrived`, no transition; a burst of five all so; at 900ms of network latency it mounts at 1.07s the same way; at 2.6s the wait runs out and it mounts as it always did (production: `complete:false`, opacity 0 with the transition, 1 by +1.5s; in `next dev` that path leaves a blank tile, an artifact of React's second ref pass calling `abortUnfinishedImages`, which production does not run).
  2. **A double tap lands in the sheet it opened** (`bc0845e2`, `7cde1108`): `ui/popup.tsx` swallows a click inside a layer, and refuses the scrim's outside press, while a CSS animation of its own runs (`arriving`, off `getAnimations`; a transition, a never-ending loop and an engine with none never count). Tests: `popup.test.tsx` (4 red). **Driven** with real touch and mouse events (`doubletap-probe.mjs`) on a scratch page: the old code hit `card` then `row-1` at a 120ms double tap, and at a desk the second click **closed** the panel it had opened; now `card` only, the panel stays, and a third tap after the entrance reaches the row.
  3. **The door menu's invite line** (`a1f95193`): `waiting_listed` from a new SQL read (below), `listedWouldComeInLine` (`lib/event/door/words.ts`) said in the menu (`settings-rows.tsx`'s `doorConsequence`) and on the steps page's invite row; only where it would let someone in. Tests: `settings-rows.test.tsx` (3 red), `words.test.ts`, `event-doors.test.ts`, `door-page.test.tsx`. The signed-in menu cannot be driven on localhost: named under Look at first.
  4. **The first keystroke and the first tap after a load** (`8e387932`, `7cde1108`, `14215c13`): measured with the page's scripts held at the network (CDP `Fetch` on `Script`; `prehydration-probe.mjs`, `google-replay-probe.mjs`, `invited-enter-probe.mjs`). *Text:* `/login`'s email typed "typed.before@example.com" before hydration, scripts released: empty in the same frame and for good, the same node still focused (the `""` the first render writes back); `lib/adopt-typed-value.ts` hands the DOM's text to the field's own `onChange` at its mount (and again after the commit's effects, since react-hook-form subscribes in an effect that runs after the field's own), in `Input`, `Textarea` and the Invited field: the text and the focus kept and a later keystroke appending, in dev and in a production build; on Invited, Enter after a pre-hydration address did nothing (state `""`), now "1 added". Tests: `adopt-typed-value.test.tsx` (10, a server-rendered form typed into then hydrated, useState, react-hook-form as the wizard is, a textarea, a bare input; 3 red on the old primitives). *Tap:* React replays no press made before its script runs; `lib/early-press.ts`'s ~200-byte inline recorder (`(auth)/layout.tsx`, a plain `<script>`) and `EarlyPressButton` answer the tap once at hydration if under 5s old: Chrome, the press before hydration reaches `signInWithOAuth` once (the navigation blocked on the way out), a 6.5s-old press is dropped, a real press after is answered once. Tests: `early-press.test.tsx`, `early-press-button.test.tsx` (server HTML, a click, then `hydrateRoot`), `account-door.test.tsx` (red on the old door), `(auth)/layout.test.tsx`.
  5. **The Library's album-stream page at 1440** (`bc0845e2`): the caption's span was `shrink-0`; it shrinks and truncates with its text on the title, and the specimen is the containing block of its own `sr-only` labels. Measured (`overflow-probe.mjs`): scrollWidth 1779 vs clientWidth 1440 before (headless), 1440 = 1440 after, also 1100 and 375. Tests: `specimen.test.tsx` (3 red, class contracts: jsdom has no layout).
- **Assets requested from Will:** none.
- **Board ideas:** a Library specimen for `PopupContent` (Deferred, last line); the host album's arrival (Deferred, first line).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** one migration, none else: `supabase/migrations/20260929233000_door_counts_listed.sql` (`event_door_waiting_listed(uuid)`, SECURITY DEFINER, service role only, and `event_door_counts` carried verbatim but for a `waiting_listed` key). An expand in both directions (the answer only grows a key; the code reads it as 0 before the apply), so either order of apply and deploy is safe. **Apply by protocol**: drift read (measured 2026-09-29: live `event_door_counts` md5 `cf63de76a327667cc373c3767f4523e5`, INVOKER, `{postgres, service_role}`, the helper absent); its rolled-back proof was held on the live schema before any apply, 7 of 7 (grants as anon and as the host, the key at zero, the list naming some, an account of two devices counted once, a block holding, and `set_event_door(invite)` letting in exactly what the read said), afterwards the event, the counts body and the accounts read as before; after the apply the query in its header reads the helper `6a33e98ae4637424f7f2a2d5aef257b3` (DEFINER) and the counts `2d6cd38de9d2af4215c702bcddce9ac2` (INVOKER); `get_advisors` expected delta none; regenerate `src/lib/db/types.ts` (the helper joins the Functions, nothing calls it from TypeScript). `src/lib/db/migration-guards.test.ts` (crumbs-24's file) is untouched: the db and forensics guards pass with it on the merged tree.
- **Calls his to overrule:** Questions 1 to 5 above, and: the wait is 2s and the cap 12; a press is kept for 5s; the recorder is on the sign-in pages only (any other page that draws an opted-in control open on the server adds it to its layout); the guard's window is the entrance's own length (300ms for a sheet, 200ms for a desk dialog), never a number of its own.
- **Look at first** (the steps the next build's red-team runs, since the signed-in hub and the guest album's live push do not run on localhost), each on the alias, apply the migration first for the door step:
  1. *Hub, real touches at 375*: a double tap on the Settings card (two taps within 250ms) opens Settings on its four rows, one history entry; two quick taps on the code card's "Everything" open the Share sheet without landing near "Save link"; at a desk a double click on the Settings card leaves the panel open. A harness click inside about 300ms of a layer opening is now swallowed: wait for it to settle, then click.
  2. *The door menu*: an approve-door event, a confirmed newcomer waiting, her address then listed at Guests: Settings > Who can get in shows "Lets in the 1 person waiting at the door who is on your list." beside Public's "Lets in the 1 person waiting at the door."; an unlisted waiting newcomer shows no such line; the steps page's invite row says it before it is chosen; choosing the list lets her in and the toast counts her.
  3. *The guest album's live push* (C18-6's setup: the receiver album in an iframe on the hub, the hub's Add photos, a MutationObserver on new `<img>`): the arriving tile's `<img>` at insertion reads `complete: true`, `data-instant`, the tile `data-entering` and `data-arrived`, no opacity transition, and it appears a beat after the count moves (its link and photograph first), not with it; with the receiver tab hidden then shown, a burst arrives at most twelve held.
  4. *The first keystroke or click*: three loads of `/dashboard/new` typing the name at once; the Guests room loaded and an address typed at once, Enter reads "1 added"; `/login` loaded and Continue with Google tapped at once opens the chooser on that tap (a tap left more than 5s does not).
  5. *The Library at 1440*: `/design/library/album-stream?key=fiesta` reads scrollWidth = clientWidth.
