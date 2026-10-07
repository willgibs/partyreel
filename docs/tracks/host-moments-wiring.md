---
track: host-moments-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/door-page
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/app/event-blocks/
  - src/lib/events/event-blocks
  - src/lib/db/mutations/event-blocks
  - src/components/app/dashboard/grace-banner
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/storage/
  - supabase/migrations/20261007020000_let_in.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-moments.json
  - src/app/(dev)/design/sandbox/host-moments/spec.ts
  - docs/systems/host-app.md
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
---

# lp/host-moments-wiring

**Goal.** Four of a host's party moments as Will picked at host-moments r1: a password's two groups said at the field, Let in that lets a declined newcomer in where he waits, the over-plan banner's number and one key, and her plan's line drawn on the size list.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/host-moments.json` round 1):** password = both, let-back = straight, banner = number, goal = line, decline = block (as built: nothing to do). The board (`src/app/(dev)/design/sandbox/host-moments/`) draws each pick on production's own page (its `scene.tsx` grafts the option's piece in place): that drawing is your spec. Its other two picks (tell, fresh-roll) are camera-wiring's.

- **password = both:** when she picks A password with anyone in or waiting, two lines where she types it, read before she types: the guests in stay in, on every phone ("31 are in and stay in"); the people at the door stop waiting on her and get in with it ("3 at the door"). They replace today's field line and the under-the-gates note (`door-page.tsx`); with no one in or waiting, nothing extra.
- **let-back = straight:** for a declined newcomer the act on the Blocked row is Let in: one press, and the album opens for him where he waits. Today `let_back_in` deletes the block and leaves him `waiting` at a gated door ("They'll be back at the door...", `src/lib/events/event-blocks.ts`). The change is in SQL (below): an expand, so milestone 38's build (which still says "back at the door") keeps its behaviour, while the new build admits. Write a Question with your recommendation for one who was IN when blocked (Ray): straight back in too, his uploads still hidden unless she turns them on ("Let back in never brings anyone's uploads back unless she turns it on" is settled). The Undo on Decline's toast and Blocked's confirm say what will happen in the same words. Will's note on this pick: "The UI design of how we present this (and guest card items in general) could definitely be polished": a guests-room board redraws the rows after you, so build the behaviour cleanly in today's rows and propose nothing more.
- **banner = number:** the dashboard's over-plan banner says the number and the date ("5.3 GB over Pro 100 GB; free it by November 5"), one key "Free 5.3 GB" opening the size list counting down that same number, See plans beside it (`grace-banner.tsx`: `storageUsed - storageCap` and `deadline` are already its props).
- **goal = line:** the size list's goal strip draws what she stores as a bar with her plan's line across it; the part past the line shrinks as she picks, ending "Fits once these go" (`goal-strip.tsx`, `storage-list-rules.ts`'s `count`); the switch goal keeps its words.

**The migration, `supabase/migrations/20261007020000_let_in.sql`:** start from `public.let_back_in` (newest in `20261003220000_deleted_counts.sql`)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users"). ★ Lock order: upload-sums' trigger opened one deadlock against a Restore or Let back in, and the storage-sums-signal lane this wave changes `remove_my_upload`'s already-removed arm to take her profiles row first; keep `let_back_in`'s lock order compatible and say so in the Handoff.

**Nearby lanes this wave (never edit their paths):** the hub's cards (event-header-wiring-2), the camera and Settings' How guests add (camera-wiring), `GuestPeek` and `guest-list.tsx` (account-moments-wiring), the storage sums' job (storage-sums-signal).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under the Handoff's calls his to overrule.

- **Ray, someone who was IN when blocked** (the brief's own question). Built: straight back in, as the lift already
  leaves him (a gate never stops someone already in; proof step 3: `let_in` 0, still in), his uploads in Deleted unless
  she turns them on. His row keeps Let back in and its confirm, because that confirm is where Will's restore switch lives
  (`restore=ask`, off by default); at Only me it says the album stays closed to him until she opens it. Recommended: as
  built. The alternative is one press for him too wherever nothing of his can come back, the confirm kept only for the
  restore.
- **The decline's toast says Let in, not Undo.** Built: its key lifts the block and lets him in, exactly as Blocked's Let
  in does, and the same toast follows ("Dev Kapoor is in." / "Their link opens the album for them now.", `letInToast`):
  undoing a decline means yes (the board's reason, which Will picked), and an "Undo" that let him in would surprise the
  host who meant "not yet". Recommended: as built. Overrule: Undo as a true undo, back at the door, waiting (today's lift,
  which this build still sends for every lift that is not a Let in).
- **The one-press row's line.** Built from the drawing with the act's own verb: "Let in: into the album, now" (the
  drawing's "Let back in:" named a key that row no longer has). Recommended: as built until guests-room r1 redraws the
  rows (Will's let-back note).

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md` (in `reads`): the door bullet says a first password names both groups at its field; At the
  door's bullet says its Let in at Only me promises no album, and that a declined newcomer's way back is Let in (the
  decline's toast and her Blocked row, `let_back_in`'s `p_let_in`), Let back in for anyone else, each Let in saying what
  its answer says (`admitted`); the Block bullet's foot names both ways back.
- `docs/systems/dashboard.md` (not in `reads`; the banner is this lane's own fact, one sentence refined in place): the
  banner says the number and the date, its one key opens the size list on that number with her plan's line drawn, See
  plans beside it, and nothing once she is no longer over.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · The host app: Host: the storage meter's door to the size list (`dashboard/storage-meter.tsx`) leaves her
  plan's name off its fit goal, so its list says "Fits your plan once these go" where the banner's says "Fits Pro 50 GB
  once these go"; pass `plan: planWithCap(tier, storageCap)` (`grace-banner.tsx`) there too (host-moments-wiring).
- Immediate · The host app: Host: the door's quick choice (`settings-rows.tsx`'s `doorConsequence`) moves to a password
  already set while people wait and says nothing of their asks ending there (`events_door_to_password`), where the steps
  page asks first; say it, and ask, as the page does (host-moments-wiring).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work is `cd5156db4` (the four picks, the migration, the tests), `4fdf71626` (a lift names
  `p_let_in` only for a Let in, so every other lift runs on either side of the migration; found by the walk, below) and
  `5b014d102` (the system docs); the head (this manifest on top) is in the chat line. launch-prep moved by the
  account-moments-wiring merge (`1fdeca5e0`), the tests' env fix (`e949f5501`) and records, none of them touching a path
  or an import of mine, so no sync, per PROGRAM.md.
- **Gates, each on its own exit code, all on the tree of `5b014d102`** (`4fdf71626` plus the two doc edits, committed
  unchanged; logs in `../partyreel-wt/_scratch/host-moments-wiring/gate/`, `exits.txt`): `pnpm typecheck` exit 0
  (`typecheck.log`); `pnpm lint` exit 0, no warnings (`lint.log`); `pnpm test` exit 0, 1057 files, 13324 tests
  (`test.log`); `zsh scripts/build-lock.sh pnpm build` exit 0 (`build.log`); `pnpm lab:smoke --base
  http://localhost:3132` exit 0, 181 checks, 0 failing (`lab-smoke.log`; its scope reached the account-moments,
  customize, event-header and host-moments boards through `event-blocks.ts` and the Guests room's actions, all 200).
  ★ `pnpm test` ran with `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key` exported, as the Orchestrator asked (this tree predates
  `e949f5501`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path is under `owns` or is this file, but two:
  `src/lib/db/queries/event-blocks.test.ts` (its expectations only: it pins the landing rule this lane owns,
  `blockedLanding` in `src/lib/events/event-blocks.ts`, through the query's read, so the rule's change reshaped three of
  its cases, each keeping its scar; no query code changed) and `docs/systems/dashboard.md` (the banner's one sentence,
  above). `src/app/(app)/dashboard/page.tsx` is in the claim and untouched: the banner needed no new prop.
- **The items:**
  - password = both: `door-page.tsx`'s `PasswordGroups` (a line a group, `passwordGroups`: "31 guests are in, and stay
    in on every phone they used. Nobody inside is asked for it." and "3 people wait at the door and stop waiting on you:
    they get in with the password, like anyone new.", each verb agreeing with its count) above the first password's
    field, read before she types and announced as it opens; it takes the place of the field's waiting line and the
    gates' inside note, which returns when the saved gate is picked back. A password already set keeps its consequence
    line (no field to say it at). `door-page.test.tsx`.
  - let-back = straight: `event-blocks.ts`'s landings `let_in` and `let_in_only_me` (a declined newcomer whose ask stands;
    `door` is now a newcomer whose ask ended), `letBackInAct`, `letInAtOnce`, `LET_IN_LINE`, `letInToast` (one set of words
    for every Let in: At the door's, Blocked's, the decline's toast; at Only me none promises the album, which also fixes
    At the door's Let in toast there, crumbs-30's case); `blocked-section.tsx`'s one-press `LetInNow` (named "Let in
    {name}" for a screen reader, holding "Letting in" while it writes), the confirm kept for the restore switch and for
    Only me; `at-the-door.tsx`'s decline toast keyed Let in (`door` handed from the room); the action and mutation carry
    `letIn` and answer `admitted` (the door's arms plus `let_in`). Tests: `event-blocks.test.ts`, `blocked-section`,
    `at-the-door`, `actions`, the mutation's (with a guard that the three names it sends are the live function's own,
    one overload, read through `testing/migrations.ts`).
  - banner = number: `grace-banner.tsx` ("5.3 GB over Pro 50 GB", "Free it by November 5, or choose a bigger plan. After
    that we'll make room for you: Deleted first, then your largest files.", the key Free 5.3 GB opening the size list on
    her cap with her plan named, See plans beside it; a bigger plan offered only where one exists; nothing when she is
    not over or has no cap). `grace-banner.test.tsx`.
  - goal = line: `goal-strip.tsx`'s `PlanLine` for her own plan's goal (what she stores as a bar, her plan's line across
    it, what stays, what still stands past the line in the alarm's colour, which is the banner's number counting down,
    and what goes hatched; "Fits Pro 50 GB once these go", then "Fits Pro 50 GB"; still under reduced motion); the switch
    goal keeps its words. `FitGoal.plan` (optional) carries the name. `storage-list.test.tsx`.
- **The migration, `supabase/migrations/20261007020000_let_in.sql`** (unapplied; file md5
  `7b035b32b3727ab4c8907fd7caee4c6d`, the new body's md5(prosrc) `7383a75e041e739347d9f61e36ad122c`): `let_back_in` gains
  `p_let_in boolean default false` by DROP + CREATE (a second overload would PGRST203 the deployed build's two names),
  its grants and comment restated; drift checked live 2026-10-07 (`let_back_in(uuid,boolean)` reads
  `1c99e15debf3ab3b520409c2aae94d4b`, 20261003220000's body). Proved on the live schema in one rolled-back
  `execute_sql`, RED then GREEN, eight steps quoted at the file's foot (the deployed build's two-name call unchanged, Let
  in at approve, someone who was in, another host / no session / anon refused, Only me, a password, Public, the grants);
  nothing persisted (read after). Pre-flighted on a throwaway Postgres 17 (Homebrew, `initdb`, the touched tables' live
  columns, the roles, an `auth.uid()` stub, the current bodies with their live ACLs; the file applied verbatim; a
  `pg_get_functiondef` diff that is exactly the new arm; a contract check of two devices counted once, a typed name's
  row, an ask a second block holds, the refusals; ACL `{postgres, service_role, authenticated}`, anon and PUBLIC
  refused): `../partyreel-wt/_scratch/host-moments-wiring/preflight/` (`functiondef.diff`, `contract.log`). **Callers:**
  `letBackIn` (`src/lib/db/mutations/event-blocks.ts`, through the typed seam `liftDb` until the types regenerate) for
  `letBackInAction` (`guests/actions.ts`), which Blocked's `LetInNow` and `LetBackInBody` and At the door's decline
  toast call; no SQL body calls it; milestone 38's build calls it by its two names. **Lock order** (for the Advisor,
  beside `20261007022000_storage_sums_signal.sql`): today's, her profiles row first then the block's media rows (only with
  the restore), then the block's row, then guests rows (the Public, list and new let-in arms; no trigger locks on
  `admission`); the new arm takes no profiles, media or event row, so storage-sums-signal's change (her row first in
  `remove_my_upload`'s already-removed arm) closes the one deadlock against this body as against today's.
  **★ Apply before this build deploys:** its Let in sends `p_let_in` (a PGRST202 without the file, said to the host as
  "Couldn't let them in."); every other lift sends today's two names and works on either side. Advisors: no delta
  expected. Then regenerate `src/lib/db/types.ts` and drop `liftDb`.
- **Walked, local, on my own port (3132, a headless Chrome of my own, `signin.mjs` as willg97), migration unapplied:**
  Settings, Who can get in on a disposable album (2 typed-name guests in, hi@willgibs.com's ask minted through
  `create_guest`): A password at 1440 and 375 (both lines above the field, the inside note gone, no horizontal scroll,
  picking the saved gate back writes nothing and brings the note back); At the door's Decline, its toast's Let in (an
  error toast before the apply: "Couldn't let them in. That didn't go through. Please try again."), Blocked's one-press
  Let in (named "Let in RT44 Hi", "Letting in" while it writes, the same error toast, the row kept), the same press twice
  on a 2.5 s network (one write), Tab to it with the halo; Let back in on someone who was in (works before the apply:
  "Ada Disposable can join again.", which is how the walk found the lift that named `p_let_in` on every call); the Only
  me confirm ("Let RT44 Hi in?" and its line) at 375. The banner and the plan line on the host-moments board's frames,
  which now draw production's own (1440 and 375, dark, reduced motion: the line's parts stop sliding). Captures:
  `../partyreel-wt/_scratch/host-moments-wiring/shots/`.
- **Test data, left for the post-apply walk and listed for deletion:** the event "host-moments-wiring (disposable)"
  (`b90fa968-c46e-4872-9bde-92420ed6e4f4`, willg97's, made by a SQL insert, the door You let each person in): Ada and
  Ben Disposable (typed names, in, no uploads) and hi@willgibs.com's ticket, waiting and blocked (account and address,
  declined from At the door). After the walk below, delete the event from its Settings (Delete event); its rows leave
  with it. Ada's block was lifted in the walk; nothing else was written anywhere.
- **Walks I could not drive, for the desk:** Let in's success (needs the apply: Blocked's Let in on RT44 Hi, then the
  decline toast's Let in on a fresh decline, expecting "RT44 Hi is in." / "Their link opens the album for them now.");
  hi@willgibs.com's own side (it holds a second factor `signin.mjs` refuses); the banner on a real over-cap dashboard (no
  signed-in test host stands in a grace: hi@willgibs.com is 9.6 MB over Free's 100 MB, inside its headroom, no grace,
  and holds that factor), so its words and its key's list were walked on the board's frames and pinned in tests; a real
  screen reader and a real phone.
- Assets requested from Will: none
- **Board ideas:** the plan line draws the whole store, so a real overrun (5% here) is a sliver past the line; a bar that
  magnifies the line's neighbourhood would make the shrink as she picks the thing she sees. The password's panel nests
  three cards deep at 375 (the gate card, the panel, the lines), so its two lines wrap to four each; a flatter panel
  would read them in two.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the migration above (apply before deploying); nothing else.
- **Calls his to overrule:** Ray straight back in with his confirm kept for the restore (Questions, first); the decline's
  toast keyed Let in (second); the one-press row's line (third); a password already set keeps its consequence line rather
  than the two groups; the banner silent once she is under her cap while the grace waits for the sweep; the plan named by
  its tier and cap ("Free 100 MB", "Event Pass 50 GB"); At the door's Let in at Only me saying the album stays closed
  (crumbs-30's case, fixed in the same words).
- **Look at first:** after the apply, the disposable album's Guests room at 375: RT44 Hi's Blocked row, Let in, one
  press, and the toast; then Settings, Who can get in, A password, with 2 in and someone waiting; the banner's frame on
  the host-moments board at 375.
