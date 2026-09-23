---
track: upload-owner
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
