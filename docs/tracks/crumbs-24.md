---
track: crumbs-24
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "54664129"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/claim-uploads.ts
  - src/lib/guest/claim-uploads.test.tsx
  - src/lib/guest/claim-ask.ts
  - src/lib/guest/claim-ask.test.tsx
  - src/components/shared/claim-ask.tsx
  - src/components/shared/claim-ask.test.tsx
  - src/lib/guest/confirm-beat.ts
  - src/lib/guest/confirm-beat.test.tsx
  - src/lib/guest/use-confirm-return.ts
  - src/lib/guest/use-confirm-return.test.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/events/event-blocks.ts
  - src/lib/events/event-blocks.test.ts
  - src/lib/db/queries/event-blocks.ts
  - src/lib/db/queries/event-blocks.test.ts
  - src/components/app/event-blocks/block-confirm.tsx
  - src/components/app/event-blocks/blocked-section.tsx
  - src/components/app/event-blocks/blocked-section.test.tsx
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/reel-page.test.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/lib/reel/defaults-action.ts
  - src/lib/reel/defaults-action.test.ts
  - src/lib/history-entry.ts
  - src/lib/refresh-then-write-policy.test.ts
  - src/lib/db/migration-guards.test.ts
  - supabase/migrations/20260930100000_the_join_waits_for_the_door.sql
  - supabase/migrations/20260930110000_claims_say_another_address.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
---

# lp/crumbs-24

**Goal.** Six follow-ups the last three lanes deferred: the claim's new calls on the typed client, a keep confirmed with another address saying where its photos wait, a yes to the shared-phone ask playing the follow moment, Let back in's promise true at a password, the ask minted in a password's instant, and the hub's reel switch never reloading the page.

## The brief

Six follow-ups the last three lanes filed, each fixed at its root with a test that fails on today's code where a test can hold it:

- **The claim's two new calls on the typed client.** `claim_ticket_asks` and `claim_asked_uploads` are in `types.ts` now (`shared-claims`, applied at 20260930010219), so `byName` in `src/lib/guest/claim-uploads.ts` goes.
- **A keep confirmed with another address.** A guest who typed dana@work at the door and confirms the keep with Google as dana@gmail leaves her photos waiting under dana@work, unasked, while the told name ("You're on as ...") plays over photos that stay Unverified. `shared-claims` recommended keeping its rule (an address waits for its owner) and giving the keep a line saying where the photos wait. Build that, in the product's voice.
- **A yes to the shared-phone ask** that moves this album's own uploads plays the follow moment (it toasts today).
- **Let back in's promise at a password.** Let back in, on a newcomer declined at a door that has since become a password, promises "They'll be able to open <event> and add photos again", where she meets the password like anyone new: `BlockedPerson.atDoor` reads waiting rows, which the password ended (`crumbs-21`). Make the promise what will happen.
- **An ask minted in a password's instant.** `create_guest` reads the door with no lock the host's move waits on, so an ask minted in the instant a door becomes a password stays waiting at the password until the door moves again (`crumbs-21`'s trigger ends only the asks that stood when it fired). Close it at its root: a lock that orders the two, or a re-read.
- **The hub's reel switch reloads the page.** `settings-state.tsx` refreshes the router after the reel switch, and a tap on the page's back arrow or on a row inside the refresh's round trip (about 190 ms) reloads the page: a native `replace` on an entry the hub pushed discards the pending refresh (the matrix is in `lib/history-entry.ts`'s header, `crumbs-22`). Write first and refresh after, or hold the address write until the refresh's transition settles.

A SQL change is a migration:
- write it and prove it rolled back on the live schema through the Supabase MCP (read-only otherwise);
- hold its shape in `migration-guards.test.ts`;
- never apply it: the Orchestrator applies by protocol;
- new objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md).

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- the reel switch's race driven in a real Next runtime (the matrix's method).

The signed-in host, the keep and the shared-phone ask cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start. A path you need beyond them (the keep's component, your migration's file): add it to `owns` in your manifest before editing, or name a one-line exception. Never a path another live manifest owns.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door; each is built as recommended and is Will's to overrule.

- **What the keep says when her photos stay with the address she typed.** *Recommended and built:* one toast after the
  door closes, "Your 3 photos here were added with another email." / "They stay with the email you added with your
  name. Sign in with that email to keep them." (one photo in the singular; "Your uploads from other events are in your
  account." after it when the claim moved some elsewhere). The address is never named: the phone does not hold it past
  the visit, and the server never answers it. The told name is not said, and the account is not named from the typed
  name, since her photos here did not move. Alternative: name the address while this visit still holds it, or keep
  telling the name beside the line.
- **Her yes to the shared-phone ask plays the follow moment** on the album whose own uploads it moved, with no confirm
  door opened on that album (her answer confirms those very photos), and no toast there. Alternative: only after a
  door opened on this album, toasting otherwise.
- **Let back in's four landings** (`BlockedPerson.lands`, from a row past the door and the door as it stands): in ("They'll
  be able to open X and add photos again."), door ("They'll be back at the door, and you can let them in from there."),
  password ("They'll need the password to get in, like anyone new." / toast "Wren can come in with the password."),
  out, a newcomer where nobody new gets in ("X takes nobody new right now, so they'll stay out until you change who can
  get in." / "Wren is no longer blocked."). *Recommended:* as built; someone who was in keeps the "in" words at Only me
  (true the moment it reopens; Deferred). Alternative: a fifth landing for Only me.
- **The reel switch.** *Recommended and built:* neither of the brief's two ways but the one every other Settings save
  already takes: the switch's save revalidates the hub in its own answer (`setReelDefaults`, the switch only), and
  nothing refreshes the router after it. Measured on the real components under `next dev`: today a back-arrow tap 340
  to 360 ms after the click reloaded the page and 380 to 520 ms dropped the switch's value; with this, 15 delays of 15
  (0 to 520 ms) never reloaded and the value always landed. Alternative: keep the refresh and hold the panel's address
  writes until it settles (every tap after a switch then waits the round trip).
- **The two-tap residual every Settings save shares.** A tap that moves the address during a save's round trip is safe
  (Next replays the save), but a second tap within about 40 ms of the save's answer reloads the page and one within
  about 120 ms drops its data (measured, 8 of 8 and 3 of 3). *Recommended:* accept it for now (two taps inside a window
  nobody can see) and keep it as a Deferred line. Alternative: hold the panel's page moves while a save is in flight
  (every back arrow after a change waits for the save, 0.3 to 1 s on a phone).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the held door's bullet (both mints of an ask read the door under the event row's share
  lock); the claim bullet (the ask read's address entries, the keep's words, her yes's follow moment); THE RETURN (the
  moment for her yes, and a full-reload return that moved nothing here reporting its beat).
- `docs/systems/host-app.md`: the `?room=` bullet (nothing in a sheet refreshes the router; the reel switch's save
  re-renders the hub); At the door (`BlockedPerson.lands`).
- `docs/systems/database-security.md`: the claims-by-ticket line (the address entries, WHETHER never WHAT) and a lock
  bullet beside the capacity lock (a mint of an ask reads the door `for share`).
- `docs/systems/reel.md`, one line (an exception: not in `reads`, but the one home of `setReelDefaults`' revalidation,
  which this lane changed): the switch revalidates the hub.

## Deferred (ROADMAP one-liners, bucket named)

- Host: every Settings save revalidates the hub, and a tap that moves the address during its round trip followed by a
  second within about 40 ms of its answer reloads the page (within about 120 ms, the save's data is dropped): Next
  replays an interrupted revalidating action with a refresh, which the second tap meets (measured, the matrix in
  `lib/history-entry.ts`); hold the panel's page moves while a save is in flight if it is ever met (from `crumbs-24`).
- Host: Let back in on someone who was in, while the album is Only me, still promises "They'll be able to open X and
  add photos again", true only once the host opens it (from `crumbs-24`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-24`:** `597b8852` (the two migrations and their guards, a checkpoint after the
  session cut-off), `15d287d7` (the TypeScript items), `86f48e72` (the sync: `git merge origin/launch-prep` at
  `60a2359a`, crumbs-23 having landed in this lane's reads, the three system docs; clean), `298a7161` (the system
  docs); the head is this manifest's commit.
- **Gates on the synced tree, `298a7161`, each on its own exit code** (logs in `_scratch/crumbs-24/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0 (no warning); `pnpm test` 0 (643 files, 7661 tests); `zsh scripts/build-lock.sh
  pnpm build` 0; `pnpm lab:smoke --base http://localhost:3135` 0 (135 checks, 0 failing; scope `event-ready`, the
  Library and the shell; its PREMISE lines name three boards, disposable-mode, event-ready and locked-door, whose
  asks describe docs this change touched: the edits are the lock, the address line, the landing and the switch's
  save, which none of those asks is about). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path in `owns` or this file, plus the three
  system docs in `reads` and one line of `docs/systems/reel.md` (the exception above). `block-confirm.tsx` was owned
  and untouched: Let back in lives in `blocked-section.tsx`.
- **The items**, each red on the code before it and green here:
  1. **The claim's calls on the typed client:** `byName` gone; `claim-uploads.test.tsx` pins the generated argument
     names (`expectTypeOf`) and no cast of the client (red: 1).
  2. **The keep confirmed with another address:** migration `20260930110000_claims_say_another_address.sql` (the ask
     read also answers each held ticket typed under an address that is not hers, one entry a ticket, `kind` address, no
     name, never the address; rolled back on the live schema, red on today's body, green with the file, the proof and
     its rows in its foot); `claimLeftForAnotherAddress` (claim-uploads.ts), the words (`leftForAddressWords`,
     confirm-beat.ts), the page asking before it speaks (event-experience.tsx), and a Google return that moved nothing
     here now reporting its beat (use-confirm-return.ts). Red: claim-uploads 3, confirm-beat 2, use-confirm-return 1,
     the guard.
  3. **Her yes plays the follow moment:** `claimAskedUploads` claims the album's own tickets first and tells every
     listener (`asked`); use-confirm-return.ts plays the moment for it; claim-ask.tsx toasts only where no moment says it.
     Red: claim-uploads 3, use-confirm-return 1, claim-ask 2.
  4. **Let back in at a password:** `atDoor` became `lands` (`blockedLanding`, event-blocks.ts), read from a row past the
     door and the door as it stands (queries/event-blocks.ts); blocked-section.tsx says it before and after. Red: 14.
  5. **The ask minted in a password's instant:** migration `20260930100000_the_join_waits_for_the_door.sql`
     (create_guest and ask_to_join read the door `for share`). Two real sessions on a throwaway postgres@17 cluster
     (`_scratch/crumbs-24/race.sh`), red on today's bodies (the password did not wait and her ask stood; the join read
     `approve` at once; Public admitted 0) and green on the file (the move waited 2.0 s and ended the ask; the join
     waited and met the password; Public admitted 1; two joins never waited on each other); rolled back on the live
     schema, every door's answer as before, the lock red on today's bodies and green with the file. The table and the
     proof's rows are in its foot. `migration-guards.test.ts` pins the lock first in both bodies and that no other body
     mints a waiting ticket.
  6. **The reel switch:** `setReelDefaults` revalidates the hub for the switch, and `settings-state.tsx` no longer
     refreshes the router; `refresh-then-write-policy.test.ts` pins the hub's sheets free of router refreshes (red: 1);
     the reel page (red: 1) and the action (red: 1) pinned. Driven in a real Next runtime (the matrix's method, the
     real `EventShareProvider`, `SettingsProvider` and `ReelPage` on a scratch route, never committed:
     `_scratch/crumbs-24/refresh-race-measurements.md`): today reloads and drops, this lane none in 15 of 15; the
     matrix in `lib/history-entry.ts`'s header refined with what was measured.
- **Proposed migrations** (to apply by protocol, in either order; each an expand in both directions; its header holds
  the drift read, the expected md5 and ACL after, and the advisor delta, none): `20260930100000_the_join_waits_for_the_door.sql`
  (create_guest `07269a40eaee60154233f3ab1e2f382e`, ask_to_join `153bed5352a29089551a46859e177620`, both
  {postgres, service_role}); `20260930110000_claims_say_another_address.sql` (claim_ticket_asks
  `1e3729e8ae77869ad2e497284e2c5b11`, {postgres, authenticated, service_role}). Nothing to regenerate in `types.ts`.
  Worker, Vercel, Stripe, env: none.
- **For the next build's red-team** (none of these reaches localhost):
  1. The keep with another address: on a names-only album, signed out, type a name and address A, add a photo, and at
     the keep confirm with Google (or a code) as address B: the toast says the photo was added with another email and
     how to keep it, no "You're on as", the photo stays Unverified; then sign in as A on that phone: it is claimed.
  2. The ask's yes: on one browser type "Dee" (no address) on an album and add a photo, then sign in there as an account
     named otherwise: "1 photo was added on this phone as Dee" -> It's mine plays the follow moment in the album's slot,
     with no toast.
  3. Let back in at a password: at letting each person in, a confirmed newcomer asks; decline her; set a password; in
     Guests, Blocked, Let back in reads "They'll need the password to get in, like anyone new." and toasts "<name> can
     come in with the password."; she meets the password step.
  4. The reel switch: in the hub's Settings, flip Show the reel and at once tap the back arrow, and again with a row:
     no reload, the Reel card follows.
  5. After the apply: `get_advisors` unchanged; a join at letting each person in still waits and one at the list still
     asks (the rolled-back proof's steps).
- **Assets requested from Will:** none.
- **Board ideas:** the keep confirmed with another address could offer that address's own door in place while the
  visit still holds it ("Use the email you added"), so she keeps her photos in one step rather than by signing in again.
- **Calls his to overrule:** the other-address words, and telling no name and naming no account there; her yes playing
  the moment with no door opened on the album; the four landings and their words (was-in at Only me kept "in"); the
  reel switch saved like every other setting rather than either of the brief's two ways; the two-tap residual accepted
  for now; the join's lock `for share` (a join waits at most the length of the host's move).
- **Look at first:** the two migrations' feet (the two-session table, the rolled-back proofs); `leftForAddressWords` in
  `src/lib/guest/confirm-beat.ts`; the refined matrix in `src/lib/history-entry.ts`'s header.
