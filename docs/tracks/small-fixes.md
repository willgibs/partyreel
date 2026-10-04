---
track: small-fixes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ee0629d7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/
  - src/lib/export/
  - src/components/app/export/
  - src/lib/avatar/
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/social/guest-list.tsx
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/lib/format/
  - src/lib/utils.ts
  - docs/systems/uploads-and-r2.md
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/small-fixes

**Goal.** Three of Will's small calls: E6 (a cancel and a dropped connection told apart, for downloads and uploads), Q2 (a date range spoken with "to"), and every name-only guest painted in her own seeded colour.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**E6, Will's answer (2026-10-04): tell a cancel and a dropped connection apart.** Today every download ends in words: "Downloading...", then "Your download is saved.", or "That download didn't finish." with Try again for only what's missing, and a cancel and a dropped connection read the same (`src/lib/export/walk.ts`, the export toast).
- A cancel is intentional: it asks to confirm first, then offers Try again.
- A network failure is never hidden: it says the connection dropped and what to do, so she neither tries in vain nor blames the app (his picture: a crowded indoor stadium, "I hate this app, it's not working").
- The same for uploads (`src/lib/upload/uploader.ts` and the words it feeds).
- Where the words render in a file another lane owns, propose the line through the Orchestrator (`src/components/ui/` is graphite-wiring's this round; arrival-wiring owns the guest album's empty and arrival files).

**Q2, Will's answer: a date range is spoken with "to".** "May 1–3, 2026" reads to a screen reader as a dash or nothing. Give every range a spoken "to" while the eye keeps the en dash (the range's one formatter is `formatEventDate` in `src/lib/utils.ts`; one accessible form wherever a range renders, no visible change).

**The name-only guest's hashvatar (the approved plan, `../partyreel-wt/_scratch/desk/round-15-plan.md`, "Your second note" item 3).** A guest who joined by name only gets no avatar colour today (`room.server.ts`: `person.userId ? seedFor(person.userId) : null`). Seed her from her own guest row, `seedFor(guests.id)`, hashed server-side like every seed (`src/lib/avatar/seed.ts`). Never her name: nobody can game the colour, and every name-only album gets its colours. Do it wherever a name-only guest is painted: the guests room, the album's credit, the guest list, and her own face on the guest page if it paints one (a file outside your list is an exception named in your Handoff).
- Say two rules aloud in `profiles-social.md`: one colour per ticket (a name-only guest returning on another device is a new row and a new colour, which only an account cures), and a claim switches the colour once (when she confirms and claims, every surface turns to her account's colour).
- No raw guest id reaches a browser that doesn't already hold it; the seed is the hash.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer and is Will's to overrule (none is a one-way door).

- **E6, where does the x ask?** Recommended, built: only where something is in flight, which is a part being prepared ("Cancel this download?", Keep going first) and between parts ("Stop after part 1 of 3?" with what stopping leaves). Never on the hidden-items question (nothing has started) and never on "Downloading…", whose x only puts the toast away because the browser owns a download already handed over. Nothing is posted to the browser or the phone's sheet while a question stands.
- **E6, what does a cancel leave behind?** Recommended, built: a first part ends the walk with "Download cancelled." (neutral, never an error) and Try again from the start; it stays 8 s where she pressed it and is held where the Worker reported it after the fact. Past part 1 she goes back to where she stood: "Stopped after part 1 of 3." with Get part 2 still the way on, never offered again after a reload (she meant it). The phone's Save does the same ("Saving cancelled.").
- **E6, how is a cancel told from a dropped connection when the Worker only sees the client leave (`stopped`)?** The Worker cannot tell her cancel in the browser's own download list from a dead line, so the page reads its own line: a zip streamed while its status polls failed (a rejected request, or two stalls in a row) reads as a dropped connection, one streamed with every poll answered reads as a cancel, and a walk from an older build that recorded neither keeps "That download didn't finish." It is a heuristic (a phone the OS froze mid-zip reads as a cancel, whose Try again is still right); the alternative is one sentence for both, which is the thing he asked to end.
- **E6, the words.** Downloads: "Your connection dropped." with "Check your signal, then try again."; an app that answered an error keeps "Couldn't start that download."; a line that stops answering mid-stream says "Your connection dropped. Check your signal." under "Downloading…". Uploads: the sentence presign and complete already said, "Your connection dropped. Check your signal and try again.", now the byte PUT's too (it said "Network error during upload."), and an error answer says "That upload didn't go through. Please try again." (it said "Upload failed (403).").
- **E6, uploads have no cancel control anywhere (the guest's pending tile, the host's batch row): add one?** Recommended: not in this lane. The uploader now takes an abort `signal` and answers `cause: "cancelled"` apart from `cause: "dropped"`, and a PUT whose bytes stop moving for 45 s is ended and said as a drop (it used to sit at its percentage for ever); a tile or row x that asks first and offers Try again is the guest album's (arrival-wiring's files) and `host-upload.tsx`'s call (a Deferred line below).
- **Hashvatar, her own header disc.** It is the one place a name-only guest still wore the plain disc, and her browser holds her ticket but never her row's id, so it costs one `/api/guests/mine` ask (`seed`) per ticket per page life, answered with the hash and nothing else. Recommended, built; the alternative is leaving it plain, which would colour her in the list and the credit and not beside her own name.
- **Hashvatar, a typed name behind an unconfirmed account.** Recommended, built: her ROW's colour, never the account's, until an email is proved (the rule's own `user_id` alone proves nothing); At the door a newcomer who has an account keeps the account's colour, and one with none wears her row's.
- **Q2, how is the range spoken?** Recommended, built: the dash stays for the eye and is hidden from a reader, with a visually hidden "to" beside it (`RangeText`: "October 3–5, 2026" reads "October 3 to 5, 2026"), the same on every surface a range renders (the guest album's head and the door's welcome, the hub's head, the event card, the dashboard's tile, table, row list, week row and stage, the readiness checklist, the settings sentence). A label takes `spokenRange`.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the upload pipeline's "a cancel and a dropped connection are told apart" bullet (the uploader's words, its 45 s / 90 s ceilings, why complete has none); the credit's face (a typed name's row colour); Download all's "a cancel asks first and a dropped connection names itself" bullet (the question, the cancel's aftermath, how `stopped` is read, the lost-line notice, the Save).
- `docs/systems/profiles-social.md`: "a name-only guest is painted too" (the colour's one hash and every place it reaches) with its two rules, one colour per ticket and a claim switches it once.
- `docs/systems/auth-accounts.md` (outside the list, one clause where the avatar rule lives): a guest with no account wears her guest row's colour, pointing at profiles-social.md.
- `docs/systems/guest-flow.md` (outside the list, one clause in the header's third state): her disc is her row's colour, asked once a ticket of `/api/guests/mine`.

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a per-tile cancel for an in-flight upload (the guest's pending tile, the host's batch row in `host-upload.tsx`) that asks first and offers Try again, passing `uploadFile`'s `signal`; no control passes one today.
- Guests: presign and complete have no client ceiling (a retry re-runs the whole upload, so a timed-out complete that had recorded its row would duplicate it); make the retry idempotent on `media_id` (`readRecordedUpload` already answers a replayed complete) so these can time out and say "Your connection dropped." too.
- Guests: carry `UploadOutcome.cause` into the queue's `QueueItem` (`use-upload-queue.ts`) so the failure sheet can draw a dropped connection apart from a refusal (its words already do).
- The lab: a Library specimen of the download toast's states (the question, a cancel, a dropped connection, a line lost mid-stream) so `lab:smoke` renders them (`export-toast.tsx`).
- Downloads: Try again is offered while the browser says it is offline; hold it until `online` fires and say so (the detail already says what to do).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/small-fixes`:** `f3fa35316` (Q2), `45950afe8` (the name-only colour everywhere but her own header), `ca38be857` (E6), `14d157081` (her own header disc), `c53986c5a` (the cancelled line, the toast's balanced detail, the docs), `7c613ae9a` (a Save stopped mid-part: the unwinding-reads race, found in my own review and pinned by a test that fails without the fix), `6d771cb64` (a refused check replaces the cancel question), then this manifest's commit, the head in the chat line. launch-prep moved while I worked (9 commits: crumbs-64's merge and three manifests): none touches a file of this lane or CLAUDE.md, and `git merge-tree` says the merge is clean, so there is no sync commit.
- **Gates on `6d771cb64`, each on its own exit code:** `pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm test` 0 (894 files, 10,848 tests) · `zsh scripts/build-lock.sh pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3137` 0 (170 checks, 0 failing; no board, so no `lab:demo`). Logs: `../partyreel-wt/_scratch/small-fixes/{typecheck,lint,test,build,smoke}-final.log` (pruned with the lane).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 64 lines): 22 under `owns` (the files listed there and the new `src/lib/format/range-text.tsx`, `src/lib/avatar/ticket-seed.server.ts`, `src/lib/upload/uploader.transport.test.ts` and their tests), this manifest, and 41 outside, each named for the brief's exception (a file outside the list for the hashvatar) or a one-line swap:
  - Q2, one render swapped each, with its test where it has one: `src/components/guest/event-experience-head.tsx`, `src/components/guest/door/welcome.tsx`, `src/components/app/event-feed/event-hub-head.tsx`, `src/components/app/event-feed/checklist.tsx`, `src/components/app/event-card.tsx`, `src/components/app/dashboard/{event-tile,events-table,events-row-list,week-row,stage}.tsx` (+ `event-tile`, `week-row`, `stage` tests), `src/components/app/event-settings/settings-rows.tsx`; and the settings sentence's date as its own part, `src/lib/events/guest-experience-summary.ts` (+ test).
  - The name-only colour, where she is painted: `src/lib/social/cards.ts` (+ new `cards.test.ts`; the list's unverified entries are seeded), `src/components/social/guest-peek.tsx` (the look's disc), `src/lib/media/uploader-identity.ts` and `uploader-faces.ts` (+ tests; the credit's `row` face owner), `src/components/app/event-blocks/credit-look.tsx` and `blocked-section.tsx` (+ tests), `src/lib/db/queries/event-blocks.ts` (+ test) and `src/lib/events/event-blocks.ts` (one comment), `src/components/shared/media-lightbox-parts/credit.test.tsx` and `src/components/social/guest-list.test.tsx` (tests of owned files), her own header: `src/components/guest/guest-header.tsx` (+ test), `guest-name-menu.tsx`, `src/app/api/guests/mine/route.ts` (+ test; the `seed` ask).
  - E6: `src/components/guest/live-gallery-save.tsx` (+ test; the foot's press calls `cancel()`, which asks, where it called `stop()`, which is the page leaving), `docs/systems/auth-accounts.md` and `docs/systems/guest-flow.md` (one clause each).
  - Reshaped on purpose, scars kept, expired reasons named in the tests: `uploader-identity.test.ts`, `uploader-faces.test.ts`, `event-blocks.test.ts` (a typed name wears no face: now only her row's colour, never a photograph, door or account's colour), `export-walk.test.ts` (the x cancelled on the press, a stopped walk was silent, every failure said "Couldn't start that download.", a stopped zip said "didn't finish").
- **The items, one line each:**
  - E6, downloads: the x asks first and a cancel says so with Try again (`export-walk.ts`, words in `lib/export/walk.ts`, tones `confirm` and `cancelled` in `export-toast.tsx`); a dropped connection names itself at the mint, at a `stopped` zip (read by the page's own line: `HandedPart.dropped`) and mid-stream (`lineLost`).
  - E6, the phone's Save: the same two rules (`take-home-save.ts`: `cancel()` asks, `stop()` is the page leaving, a dropped links ask or reads say so).
  - E6, uploads: the byte PUT's "Network error during upload." and "Upload failed (403)." are gone, a stalled PUT ends as a dropped connection after 45 s, and `uploadFile` takes an abort `signal` (`uploader.ts`, pinned by `uploader.transport.test.ts`).
  - Q2: `RangeText` (`src/lib/format/range-text.tsx`) and `spokenRange` (`src/lib/utils.ts`), swapped in at every range render above; the formatters are untouched, so every existing string test holds.
  - The name-only guest's hashvatar: `seedFor(guests.id)` in the Guests list and its look, the credit and the host's look from it, At the door, the Blocked list and her own header; the two rules are said in `profiles-social.md`.
- **Verification, local** (my own headless Chrome over CDP at 375, closed by PID, against `pnpm dev -p 3137`; a scratch page that was never committed and is deleted): `RangeText` read off the DOM, the eye "October 3–5, 2026" and a reader "October 3 to 5, 2026"; the list's chips, the credit and every toast state drawn (`../partyreel-wt/_scratch/small-fixes/shots/`: `toast-parts-375`, `toast-dropped-375`, `toast-lost-375`, `toast-cancelled-375`, `flow-offline`, `top-375`); the real engine against the public disposable album "Reel lane probe (disposable)": offline, Download all says "Your connection dropped. Check your signal, then try again." with Try again; the x asks "Cancel this download?", Keep going carries on to a real zip (written to the scratch folder, deleted), and Cancel download says "Download cancelled." with Try again and writes nothing. **Real database:** the guest album's links answer for that album (anonymous viewer, local server) gives each of 8 typed-name uploaders `[null, sha256(guests.id), null]`, equal to SQL's `encode(extensions.digest(guests.id::text,'sha256'),'hex')`, and its page's Guests section draws 6 of 6 avatars seeded.
- **Not driven here (sign-in is allow-listed to the alias, and no open event has an end date): red-team 53's.** The host's Guests room (the list's look, At the door, Blocked), the hub's and dashboard's range lines, the header's seed ask on a real ticket, and E6's two failures on the alias at 375 and 1440.
- **ROADMAP lines this retires:** "Accessibility: a range's en dash says nothing in screen readers …" (done: `RangeText`, `spokenRange`); delete it at the merge.
- **Assets requested from Will:** none.
- **Board ideas:** a Library specimen of the download toast (the Deferred line); a reconnect-aware Try again for a phone that says it is offline.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (the `seed` ask is a new mode on an existing route; no secret, no SQL).
- **Calls his to overrule, one line each:**
  - The x asks only where something is in flight, and Keep going is the first answer.
  - A cancel is neutral ("Download cancelled."), never an error, and past part 1 it stops where she stood with Get part N, not offered again after a reload.
  - A zip the client left reads as a drop when the page's own polls failed (a rejected request, or two stalls) and as a cancel when they did not.
  - The words: "Your connection dropped." / "Check your signal, then try again.", "Cancel this download?", "Stopped after part 1 of 3.".
  - No upload cancel control was added (none exists); the uploader is ready for one.
  - Her own header disc costs one `seed` ask per ticket.
  - A typed name behind an unconfirmed account wears her row's colour until proved.
  - A hidden "to" beside every range dash (the settings sentence keeps a dash in an event's NAME a dash).
- **Look at first:** the download toast at 375 (the x on "Preparing…" asks; a dropped connection says what to do on two balanced lines beside Try again); a name-only guest's colour in the Guests room (the list, its look, At the door, Blocked) and the same colour in the album's credit and the guest list; a multi-day event read with VoiceOver on the hub's head and the guest album's head.
