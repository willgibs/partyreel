---
track: upload-owner
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a760b998"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/r2/presign-upload/
  - src/app/api/r2/complete-upload/
  - src/lib/upload/
  - src/lib/guest/
  - src/components/guest/
  - src/app/api/guests/
  - src/app/(auth)/actions.ts
  - src/components/app/user-menu.tsx
  - src/components/auth/account-door.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - src/lib/db/mutations/guest.ts
  - src/lib/supabase/admin.ts
---

# lp/upload-owner

**Goal.** A guests row that carries an account's `user_id` uploads only for that signed-in account: today a browser that kept a confirmed guest's ticket credits the next person's uploads (another account, or anyone signed out) to the confirmed guest, verified address and all, and past Require verified emails. The upload routes refuse such a ticket, the client re-joins as the viewer it now is and retries the file, and sign-out clears the device's tickets.

## The brief

**Why this lane exists (the Orchestrator's alias red-team, 2026-09-23).** On ONE browser: hi@willgibs (a confirmed account) uploaded to `guest-view-menu QA` last round, so the browser kept that event's guest ticket in localStorage (`pr_session_<qr_token>`, the row `54268c08…`, `user_id` = hi@willgibs, `verified_at` set). hi@willgibs signed out through the account menu; partyr33l signed in on the same browser and added a photo to that event: the photo landed on hi@willgibs's row and is credited to hi@willgibs, verified address and all (the host's viewer and Guests room show hi@willgibs.com under it). Clearing that localStorage key and uploading again minted partyr33l its own row, as it should. The same stale ticket lets a SIGNED-OUT visitor on that browser upload as the confirmed person, past Require verified emails (`create_media` checks the ROW's `verified_at`). partyreel.com has the same behaviour today.

**Why it matters now.** Will's safety model rests on a confirmed address meaning the person (his words, 2026-09-22: "If I'm a verified guest on 'fakeemail@domain.com' but the host only sees a verified badge, it implies far more safety than it should"), and the block he asked for on 2026-09-23 keys on the confirmed account. A photo credited to the wrong confirmed person breaks both: a host would block the wrong guest. The view path is already safe: `get_upload_gate` reads a session token only for rows with `user_id` null, and `remove_my_upload_by_session` never touches a claimed row. The upload path is the gap: the presign and complete routes resolve the body's `session_token` to its row and never compare that row's `user_id` with the signed-in user.

**The rule to land.** A guests row that carries a `user_id` writes only for that signed-in account. A name-only row (no `user_id`) stays the device's ticket, as today.
- `POST /api/r2/presign-upload` and `POST /api/r2/complete-upload`: read the token's row `user_id` on the server (the service-role client; never returned to the browser), compare with `getUser()`; when the row has a `user_id` and the caller is signed out or signed in as someone else, refuse with a distinct code (say `session_other_account`, its own wording branch, never a substring the existing error mapping already matches). Both routes, since a presign can outlive a sign-out.
- The client (`src/lib/upload/`, the guest page): on that code, drop the stored token for the event (the `pr_session_` and `pr_guest_name_` keys) and join afresh as the viewer it now is (a signed-in account mints its own row; a signed-out visitor meets the door, or the verified gate), then retry the pending file, so no photo is lost and nothing is credited to the previous owner.
- Hygiene at sign-out: the account sign-out (`user-menu.tsx`, `(auth)/actions.ts`) and the guest name menu's sign-out clear every `pr_session_*` and `pr_guest_name_*` key on the device and expire every `pr_guest_*` cookie, so the next person on a shared phone starts clean. (The server rule above is the guarantee; this is courtesy.)
- Tests (function, never look): the two routes refuse a claimed row's token for a signed-out caller and for another account, and accept it for its owner and accept a name-only row's token for anyone; the client's recovery path drops the token and re-joins; the sign-out clears the keys. `docs/systems/guest-flow.md`: one invariant line beside the existing "a guest row with `user_id` set is untouchable by the session path" (deletes) saying uploads are held to the same owner.

**For the Orchestrator's red-team on the alias (write it in your Handoff's Look at first):** on one browser, account A uploads to a names-mode event; A signs out; account B signs in and uploads there (lands as B, B's own row); B signs out; a signed-out upload there meets the door, never A's or B's name.

**Boundaries.** No SQL change is expected (the routes read the row with the service-role client); if you find one is needed, write the file and say so, never `apply_migration`. The alias red-team, the milestone and any config are the Orchestrator's.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none open: every call below was taken on the brief's recommended answer or its spirit, and each is his to overrule
  (listed under the Handoff).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: Invariants gains the brief's line beside the delete invariant ("UPLOADS ARE HELD TO
  THE SAME OWNER", `checkSessionOwner`, 403 `session_other_account`, the deleted-account row, a name-only row stays
  the device's ticket); "The upload act" says the queue reads TWO codes and gains "SOMEBODY ELSE'S TICKET" (the
  client's recovery); the cookie paragraph and the header's Sign out say every sign-out puts down every ticket on
  the device (`leaveAllGuestSessions`, `forgetGuestTickets` + `signOutAction`, `{ all: true }`); the rename
  fallback list gains `session_other_account`. `leaveGuestSession` (removed) is no longer named.
- `docs/systems/database-security.md`: the `guests` cookie line names `{ all: true }` and `signOutAction` as
  expiries.
- `docs/systems/uploads-and-r2.md`: the guest auth-placement clause names the strategies' `checkSessionOwner` at
  presign AND complete.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the next person on a shared phone skips the welcome, and with it the legal consent line
  (`pr_welcome_<qr>` survives every sign-out and the ticket drop); decide whether it goes with the tickets.
- Now: promote this lane's pins to contract lines (the queue's recovery, both sign-outs, the name step's and the
  add-email dialog's `session_other_account`) in a lane that may regenerate `rules.generated.json` and
  `docs/design/library.md`.

## Handoff (replaces the chat report)

- **Commits, pushed:** work `7923c68d`; sync `140523a4` (merge of `origin/launch-prep` at `1bd0adf7`: milestone 27
  and its records, docs only, no conflict). The head is in the chat line.
- **Gates on the synced tree** (logs in the scratchpad `upload-owner/gate/`): `pnpm design:rules` 0 (no artifact
  drift) · `collect-specimens.mjs` 0 (no drift) · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none in a touched
  file) · `pnpm test` 0 (381 files, 4218 passed, 1 skipped) · `pnpm build` 0 (259 pages, no warnings) ·
  `pnpm lab:smoke --base http://localhost:3131` 0 (519 checks, 0 failing).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path is under `owns` (the two upload
  routes, `src/lib/upload/`, `src/lib/guest/`, `src/components/guest/`, `src/app/api/guests/`,
  `src/app/(auth)/actions.ts`, `src/components/app/user-menu.tsx`) plus this file, with two listed exceptions:
  (1) the three system docs above (the brief asked for the guest-flow line; the other two keep facts true that
  this lane changed); (2) `src/lib/errors/codes.ts` +3 (the code in `ErrorCode` and its fallback copy, which the
  total `Record` requires together, wrapped to two lines by prettier) and `src/lib/errors/codes.test.ts` +4 (the
  presign, complete, rename and attach mirrors), because the taxonomy's own contract says a route's new code joins
  `ErrorCode` + `FALLBACK_MESSAGES` + that route's mirror, and no open lane owns `src/lib/errors/`.
  `src/components/auth/account-door.tsx` is owned and untouched (see the calls).
- **Items:**
  - The rule: `lib/guest/session-owner.ts` (pure: the code, the sentence, `sessionBelongsTo`) and
    `session-owner.server.ts` (`checkSessionOwner`: `guests.user_id, verified_at` by token on the service-role
    client, never returned; `getUser()` only when the row has an account; a read error throws). Presign asks it
    under the lock and closed uploads and above the identity gate; complete under the lock and above the identity
    gate (errorStatus 403). Refusal: 403 `session_other_account`, "Someone else added photos from this device. Try
    again to add yours." No SQL change.
  - The same rule on the rename and attach-address routes (`/api/guests/name`, `/api/guests/email`), after the
    input parse and before the RPC.
  - A confirmed row whose account was deleted (the FK nulls `user_id`, keeps `verified_at`, which `create_media`
    reads) writes for nobody. No such row exists today (read-only count: 0 of 46).
  - The queue (`use-upload-queue.ts`): on the code, the ticket goes down (`dropGuestTicket`: token, name, address
    flag, the prefill when it is that name, the cookie AWAITED so it cannot land after the re-join's fresh one), the
    SAME file is re-queued, a confirmed viewer joins silently (once per chain), anyone else is handed to the door
    (`onDoorNeeded`, `event-experience.tsx` refreshes) and the files wait `queued` until the door's join hands a
    ticket down (a resume effect keyed on `sessionToken`); a join nobody at the door could fix fails in place, and
    Retry with no ticket joins first.
  - Found and fixed (same file): the runner read its ticket ONCE per run, so the verified silent re-join after a
    mid-run `verification_required` re-sent the refused file on the spent ticket and failed the run it was written
    to save; it now reads the ticket per file (pinned: `use-upload-queue.test.tsx`, a mutation back to the old read
    fails 2 of its 7 tests).
  - The two other doors: the name step treats the code like a dead token (drops the ticket, then the fresh join
    under the typed name, no refusal shown); the add-email dialog drops the ticket and closes, and the door asks.
  - Sign-out hygiene: the guest page's account menu calls `leaveAllGuestSessions` (every `pr_session_*`,
    `pr_guest_name_*` with the prefill, `pr_guest_email_attached_*`, then `POST /api/guests/leave` `{ all: true }`,
    now accepted and expiring exactly the `pr_guest_*` names the request carried), on `/u/[slug]` too; the app's
    account menu clears the device half in its form's `onSubmit` (React runs it before the action) and
    `signOutAction` expires every `pr_guest_*` cookie on its own response (`lib/guest/session-cookie-family.ts`,
    split out of `session-cookie.ts` without the `server-only` guard, since the menu's component tests load
    `(auth)/actions.ts` for real).
  - Tests (plain, no contract lines): `session-owner.test.ts`, the two upload routes' `route.test.ts` (the REAL
    route, pipeline and owner check; the row and the caller are the dials), `leave/route.test.ts`,
    `session-cookie-family.test.ts`, `sign-out-hygiene.test.ts`, `device-tickets.test.tsx`,
    `use-upload-queue.test.tsx`, `components/guest/foreign-ticket.test.tsx`, and new cases in the name and email
    route tests. A mutation of the rule to "always true" fails 9 tests across three files.
  - Local verification against the real database (`pnpm dev -p 3131`): curl with the red-team's own claimed ticket
    (row `54268c08`, signed out): presign 403, rename 403, attach 403 `session_other_account`; a name-only ticket
    presigns 200; a dead one 401. The Browser pane walk on `Gallery width (disposable)` with a confirmed row's
    ticket and its name seeded: Add → presign 403 → leave 200 → the header back to "Start for free", the door on
    "What should we call you?" with an EMPTY field → the name → `POST /api/guests` 200 → the same file's presign
    200 on the new ticket → the R2 PUT fails on localhost CORS (the known local limit; the rest is the alias). The
    guest page renders at 1440 and in a 375-wide same-origin iframe.
  - Test data: one name-only row, "Owner Check (local)", on `Gallery width (disposable)`, with no upload (makes
    nobody a guest).
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The rule covers the rename and attach-address routes too (the brief's "writes"), not only the two upload routes.
  - A confirmed row whose account was deleted writes for nobody (same hole by another road).
  - Ladder position: under the lock and closed uploads, above the identity gate.
  - An unconfirmed signed-in account goes to the door's name step, not a silent join (the route refuses a nameless
    unconfirmed mint).
  - The account door's "Not you? Sign out and use another email" does NOT clear the device's tickets: there they
    are the holder's own, unclaimed because the gate holds the claim, and clearing them would strand their photos.
  - Sign-out also clears the address flags and the `pr_guest_name_last` prefill (the flag describes a row the device
    no longer holds; the prefill sits under the brief's `pr_guest_name_*`).
  - The ticket drop clears the prefill only when it equals the dropped name.
  - The owner read lives in `src/lib/guest/`, not `src/lib/db/` (not this lane's; `forensics/capture.ts` is the
    precedent).
  - `leaveGuestSession` removed (its one caller now puts down every ticket).
  - Retry with no ticket now joins first, which also un-sticks a Retry after a mid-run verification flip (it used to
    sit `queued` forever; now it goes to the door and resumes after the confirmation).
- **Look at first** (the Orchestrator's alias red-team, ONE browser): account A uploads to a names-mode event; A signs
  out (once through the guest page's account menu, once through the app's); account B signs in and uploads there:
  it lands as B, on B's own row, B's address under it in the host's viewer and Guests room; B signs out; a signed-out
  upload there meets the door with an empty name field and neither A's nor B's name in the header, never A's or
  B's row. Then the guarantee without the courtesy: as B, restore A's `pr_session_<qr>` in DevTools and add a photo:
  the Network panel shows presign 403 `session_other_account` → leave → `POST /api/guests` → presign 200, and the
  photo lands as B. And on a Require-verified-emails event, a signed-out curl presign with a confirmed row's ticket
  answers 403.
