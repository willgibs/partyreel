---
track: crumbs-26
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "47b15b80"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/session-tokens.ts
  - src/lib/guest/use-upload-queue.ts
  - src/components/ui/popup.tsx
  - src/lib/history-entry.ts
  - src/components/admin/report-queue.tsx
  - src/components/app/event-settings/door-page.tsx
  # added by the lane, each with its reason:
  - src/lib/guest/session-owner.ts                  # the owner rule: a name-only row is the device's ticket only while nobody is signed in
  - src/lib/guest/session-owner.server.ts           # the check that applies it, and asks the claim before refusing a ticket that may be hers
  - src/lib/guest/session-owner.test.ts             # the rule's own pins, the name-only case reshaped
  - src/app/api/r2/presign-upload/route.test.ts     # its name-only case pinned the bug ("for anyone, signed out or signed in")
  - src/app/api/r2/complete-upload/route.test.ts    # the same case at completion
  - src/components/ui/popup.test.tsx                # item 2's test
  - src/lib/history-entry.test.tsx                  # item 3's test
  - src/components/admin/report-queue.test.tsx      # item 4's test
  - src/components/app/event-settings/door-page.test.tsx  # item 5's test
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
  - docs/systems/design-system.md
---

# lp/crumbs-26

**Goal.** Build 27's red-team finds: a signed-in account's uploads never filed under another guest's ticket on a shared phone (MEDIUM, first), a double tap's second press never landing in an arriving sheet, the title kept after a Back that follows a refresh, a reopened report on a deleted photo never called the whole album, and the door page able to return to the saved door.

## The brief

Build 27's red-team (`../partyreel-wt/_scratch/redteam-27/ledger.txt`) found these; each is fixed at its root with a test that fails on today's code:

1. **MEDIUM, first: a signed-in account's uploads are filed under another guest's ticket.** On one browser, visitor "Sam Partyreel" joined album ER and added nothing. partyr33l then signed in and added a photo at ER, and at EB, where she had just answered Not mine for Dana, added another. Media `30b98e02` was filed under Sam's row and `06fb3be8` under Dana's. Her own photo read "Sam Partyreel · Unverified" with Report and no Delete, and she was then asked "1 photo was added on this phone as Sam Partyreel. Is it yours?" about her own photo.
   - Since `shared-claims`, sign-in rightly leaves other people's tickets on the phone, but the upload path still uses any name-only ticket the device holds for that album.
   - A signed-in account uploads only through a ticket that is its own: one it holds, or one it just claimed. Otherwise it mints its own at the door, and another person's ticket is never used for it.
   - Read `whose_ticket` (`20260929234000_shared_phone_claims.sql`), `session-tokens.ts`, `device-tickets` and the upload queue.
   - A SQL change is a migration: prove it rolled back on the live schema, hold it in `migration-guards.test.ts`, and never apply it. The Orchestrator applies by protocol, and new objects in `public` grant `anon` and `authenticated` nothing by default.
2. **LOW: a double tap's second press lands in the arriving Share sheet.** At 375, on the hub's code card, a double tap on "Everything": the second click is swallowed, but its mousedown focuses the sheet's "Custom link" input beside Save link, which on a phone raises the keyboard (2 of 3 runs). `ui/popup.tsx` guards `onClickCapture` alone, so guard the press itself (pointerdown and mousedown) while the layer arrives.
3. **LOW: Back after a refresh drops the page's `<title>`.** Open the demo reel (or the hub's Settings sheet), run `router.refresh()` (or flip the reel switch), then close: the `<title>` element is removed, `document.title` is empty, and the tab shows the raw URL until a reload. The reel goes Back after a refresh since `crumbs-19`, the hub since `crumbs-18` (`lib/history-entry.ts`).
4. **LOW: a reopened report on a deleted photo says "The whole album".** Dismiss a report on a photo, delete the photo permanently, Undo the dismissal: the sweep tile's fact line reads "The whole album · …" beside its own "The photo was deleted." art, where the peek rightly says "A photo". `report-queue.tsx` falls back to "The whole album" whenever the uploader is null.
5. **NIT: the door page cannot return to the saved door.** After picking "A password" unsaved, clicking the saved "You let each person in" does not re-select it, so the page shows a door that is not saved until a reload.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- items 2 to 5 driven where localhost reaches them.

The shared phone, the hub and the portal need a signed-in session localhost cannot give, so name their steps for the next build's red-team in your Handoff, bug 1 first, in the red-team's own steps.

**Paths:** your owns are a start (the ticket's other readers, a migration's file): add each to `owns` in your manifest before editing, or name a one-line exception. Never a path `crumbs-25` owns (its manifest).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: no one-way door met; the five calls built are under "Calls his to overrule".

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the Invariants' owner rule ("a signed-in account writes only through a row of its own",
  the claim asked then and there, `getUser()` local with no session) and the upload act's SOMEBODY ELSE'S TICKET line.
- `docs/systems/uploads-and-r2.md`: the guest/host asymmetries line, the same rule in one clause.
- `docs/systems/design-system.md`: "A layer a tap opened takes no tap until it has settled" now swallows the press too.
- `docs/systems/host-app.md`: the two places' bullet, the head a Back can find empty and the refresh that repairs it.

## Deferred (ROADMAP one-liners, bucket named)

- Now: a signed-in account's Yours (the album's filter and the export's `ownMediaIds`), the door's standing and A photo
  first still read the name-only ticket a shared phone holds for the album until her own replaces it at her first upload
  there; read it as the upload now does (her own row, or one the claim takes) (crumbs-26's finding, read side only).
- Now: the queue's silent join that lands WAITING (a gated album, after another guest's ticket went down) sends the file
  on and fails it "This event is private."; hand her to the door's ask instead (`acquireTicket`, pre-existing for an
  account's ticket too, reachable more now).

## Handoff (replaces the chat report)

- **Commits.** Work `6b0d1678` (every item, its tests, the four docs), pushed to `origin/lp/crumbs-26`; launch-prep had
  not moved (`47b15b80` is HEAD's ancestor; no sync commit). The head is this manifest's commit.
- **Gates on `6b0d1678`, each its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-26/`): `pnpm typecheck` 0
  (`gate-typecheck-6b0d1678.log`), `pnpm lint` 0 (`gate-lint-6b0d1678.log`), `pnpm test` 0, 644 files / 7700 tests
  (`gate-test-6b0d1678.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build-6b0d1678.log`),
  `pnpm lab:smoke --base http://localhost:3132` 0, 140 checks, 0 failing (`gate-labsmoke-6b0d1678.log`; `/boom` is its
  own deliberate 500). No board, so no `lab:demo`.
- **Red on launch-prep, green here** (`red-run.log`: the new tests over launch-prep's code, 14 failing across all seven
  files; the same files green in the gate): session-owner (4), presign route (1), complete route (1), door page (1),
  history-entry (4), popup (2), report queue (1).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the six starting owns but `session-tokens.ts`
  (untouched), the nine the lane added under `owns` (each with its reason), this manifest, and the four `docs/systems/`
  files above. No exception.
- **1 (MEDIUM), a signed-in account never uploads through another guest's ticket.** `session-owner.ts`: a name-only row is
  the device's ticket only while nobody is signed in. `session-owner.server.ts`: `getUser()` for every row that can be
  somebody's (auth-js answers locally with no session, so the signed-out crowd still pays no round trip); a name-only row
  and a signed-in account ask `claim_anonymous_uploads` about that one ticket, as her, and read the row again: taken (her
  own name or address, `whose_ticket`), she writes through it; left, `session_other_account`, and the queue's existing
  recovery puts the ticket down and mints her own (silently when confirmed, at the door otherwise). Presign, complete,
  rename and attach all ask it; the queue's comments say the refusal's new meaning. No SQL, so no migration. Not
  drivable on localhost (sign-in); the red-team steps are below.
- **2 (LOW), the press as well as the click.** `popup.tsx`: pointerdown and mousedown inside a layer still arriving are
  prevented and stopped, and the click that press ends in is swallowed however late the finger lifts (a key's click,
  `detail` 0, is exempt). Driven in real Chrome (`item2-drive.log`): a double click whose second press met the
  StorageList screen arriving (a 375 same-origin iframe of the Library): launch-prep let that press's pointerdown and
  mousedown reach their target unprevented; this lane's stops the pointerdown, no mousedown fires at all, and the click
  is swallowed. The Share sheet's field itself is the hub's (the red-team step below).
- **3 (LOW), the head after a Back that follows a refresh.** Root cause measured (`item3-drive.log`): a native push at an
  address leaves Next's tree behind, a refresh while the place stands is answered for the place's address, and Next
  leaves the page's cached head empty (`abortRemainingPendingTasks`), so the Back emptied the whole head (title,
  viewport, theme colour, OG, icons) until a reload. `history-entry.ts` now watches the head as a place pushed at an
  address goes and asks the router's refresh once when the title is gone, and only then. Driven on the demo album under
  `next dev` and on this lane's own `next start`: the reel's Close and the browser's Back after a refresh bring the head
  back (production: gone ~0.4 s, then back); without a refresh nothing is asked (no extra RSC request).
- **4 (LOW), the reopened report's tile.** `report-queue.tsx`: with no uploader the tile's line says what the report is
  on in the peek's words ("A photo", "The whole album" only for an album's own). The portal cannot be signed in locally
  and the Library's queue has no gone item; the component test holds it, and the Library's album reports still read
  "The whole album".
- **5 (NIT), the saved door.** `door-page.tsx`: picking the saved door back lets go of an unsaved password. Driven in the
  Library's "The door, in steps" (Private, letting each person in): A password, then You let each person in: the saved
  door is checked again and the password box is gone.
- **For build 28's red-team, bug 1 first** (disposable albums by willg97, each names-only and Public; restore by deleting
  them; SQL reads `guests` and `media` by id):
  1. Signed out, 0 tickets on the browser: album A, type "Sam Partyreel" and Continue, add nothing; album B, type "Dana",
     add one photo. Sign in as partyr33l (chooser); answer Dana's ask Not mine.
  2. At A, signed in, add one photo: its `media.guest_id` is a NEW row with `user_id` partyr33l and `verified_at` set,
     never Sam's (Sam's keeps `display_name` "Sam Partyreel", `user_id` null); her viewer credit is her own with Delete;
     a reload asks nothing about it; `pr_session_<A>` now holds her token. The same at B: Dana's row keeps its one photo.
  3. The claim then and there: signed out, at album C type her own first name ("Partyreel") and add a photo (ticket T);
     sign in as partyr33l in ANOTHER tab only, then in the first tab (no reload) add at C: T's row is now hers
     (`user_id`, `verified_at`), both photos on it, and no second row was minted.
  4. A block holds: willg97 blocks partyr33l at album D; signed out, type "X" at D and add; sign in as partyr33l and add
     at D: refused ("This event is private."), nothing filed under X.
  5. Bug 2: at 375 (a same-origin iframe of the hub), double tap the code card's "Everything", three runs: the Share
     sheet opens once, `document.activeElement` is never the Custom link field, and a capture logger sees no mousedown
     reach it.
  6. Bug 3: demo album, open the reel, `window.next.router.refresh()`, Close: the `<title>` and the viewport meta are back
     within about half a second; again with the browser's Back; the hub's Settings with a `router.refresh()` while open,
     then X: the same. Without a refresh, Close fetches nothing.
  7. Bug 4: dismiss a report on a photo, delete the photo permanently from the host's Deleted, Undo the dismissal: the
     sweep tile's line reads "A photo · <album> · <time>".
  8. Bug 5: an album letting each person in with no password: Settings, Who can get in, "A password" unsaved, then "You
     let each person in": it is checked again and the password box is gone; `events` unchanged.
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - Her first upload at an album whose phone holds another guest's name-only ticket puts that ticket down and mints
    her own, so a question she put away unanswered about it does not come back (a yes or a Not mine given first is
    unaffected, and her sign-out would put it down anyway); keeping it would take a second store beside the tickets.
  - The claim runs then and there inside the write routes (presign, complete, rename, attach) for a name-only ticket and a
    signed-in account; it changes exactly what her sign-in's claim would (her profile's name over the typed one, her
    confirmed address), and a ticket it leaves is refused like an account's.
  - The head's repair is a router refresh after the Back, only when the head is already gone (about 0.4 s without it in
    production); the refresh-then-write hazard in `history-entry.ts`'s header applies to that round trip too. When Next
    fixes the traversal it simply never fires.
  - `useOwnedEntry` reads the router off Next's own `AppRouterContext` (an internal path, pinned against
    `navigation.js`), not `useRouter()`, which throws where there is no router (the Library, every popup test).
  - A press that began while a layer arrived takes its click with it even when the entrance ends before the finger
    lifts; a keyboard's click never does.
- **Look at first:** `src/lib/guest/session-owner.server.ts` (the claim inside the owner check), then
  `src/lib/history-entry.ts` (`watchHead` and the header's new paragraph).
