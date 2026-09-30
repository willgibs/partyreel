---
track: shared-claims
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2049e1ea"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/claim-uploads
  - src/lib/guest/claim-ask
  - src/lib/guest/session-tokens
  - src/lib/guest/use-stored-name.ts
  - src/lib/guest/device-tickets.test.tsx
  - src/components/shared/claim-ask
  - src/components/shared/claim-uploads-on-auth.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/db/migration-guards.test.ts
  - supabase/migrations/20260929234000_shared_phone_claims.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
---

# lp/shared-claims

**Goal.** On a shared phone, an anonymous guest's photos are claimed only by whoever they can belong to, and a claim never erases what the guest typed.

## The brief

**Build 26's red-team (LOW, pre-existing, `../partyreel-wt/_scratch/redteam-26/ledger.txt`):** on one browser, an anonymous visitor typed a name and an unproved address and added photos to an album. When another person, `partyr33l`, then signed in on the same browser, `claimAnonymousUploads` (`src/lib/guest/claim-uploads.ts`, which calls the `claim_anonymous_uploads` RPC) claimed that guest row for her account:
- she had never opened that album;
- the claim erased the visitor's typed name and address;
- the real owner can never claim those photos now.

The claim does this by design today: every guest ticket the browser holds becomes the signed-in account's. A party's shared phone makes it ordinary rather than rare.

**Settle whose a ticket is before claiming it, at the root:**
- a ticket that names someone else is never claimed;
- a claim never erases what the guest typed;
- the owner can still claim her photos later from her own account.

**The recommended answer, which you build and which is Will's to overrule** (write it under your Questions; it is not a one-way door):
- claim silently only what can be hers: a ticket whose typed address is her own, or one that carries no address and no name at odds with hers;
- ask once, in plain words, before claiming a ticket typed under another name ("3 photos were added on this phone as Dana. Are they yours?");
- leave a ticket that names another address alone, for its owner.

Read every caller of the claim, and every door a guest ticket is minted or claimed through (the account door, the email confirm, the guest's entry), and hold the rule in one home.

A SQL change is a migration:
- write it and prove it rolled back on the live schema through the Supabase MCP (read-only otherwise);
- hold its shape in `migration-guards.test.ts`;
- never apply it: the Orchestrator applies by protocol;
- new objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md), so a function revokes from `public` and grants exactly.

**Verify:**
- the gate;
- the claim's tests red on today's code and green on yours;
- the rolled-back proof.

Localhost cannot sign in, so name the shared-phone walk for the next build's red-team in your Handoff: two accounts on one browser, one anonymous visit between them.

**Paths:** your owns are a start. The claim's callers and your migration's file: add each to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door; each is built as recommended and is Will's to overrule.

- **Whose a shared phone's ticket is.** Built as the brief recommends, as one rule (`whose_ticket`): a typed address
  settles it (hers only when it is her own confirmed address; any other waits for its owner's claims review, and no
  answer on the phone can take it); with none, a ticket under no name or under hers is claimed in silence, and one
  under another name is asked about. *Recommended detail:* two names are at odds when their first words differ, case
  and marks aside ("Dana" and "dana smith" agree; "Will" and "William" ask: a question costs a tap, a wrong silent claim
  costs somebody her photos), and hers is her profile's name, else the one her sign-up carried (the door's typed
  `door_name`, Google's), so a new account on somebody else's phone is not nameless to the rule. Overrule: let a first
  word that starts the other agree (Will/William, but also Dan/Dana), or ask a nameless account about every named ticket.
- **The keep confirmed with another address.** A guest who typed dana@work at the door and confirms the keep with
  Google as dana@gmail holds a ticket that names another address, so nothing moves and nothing is asked: the photos
  wait under dana@work for that address's account, and the told name ("You're on as ...") still plays over photos that
  stay Unverified. *Recommended:* keep the brief's rule (an address is the one claim number with a safe home, and a
  wrong yes would close it) and give the keep a line saying where they wait (Deferred). Alternative: ask about it too,
  never showing the address ("1 photo was added on this phone as Dana, under another email. Is it yours?").
- **The ask's shape.** *Recommended and built:* one confirm dialog per typed name ("3 photos were added on this phone
  as Dana" / "Are they yours? If they are, they join your account." / Not mine, They're mine), asked on the (app)
  layout and the album page once no door, sheet or menu is up; Not mine remembered on the phone for that account on
  those albums; a question closed unanswered asked again on a later visit; no album name or preview (a gated album's
  name is not the phone's to show). Alternative: list the phone's asked tickets in the dashboard's claims review as
  cards, not a question.
- **"A claim never erases what the guest typed", read as: never another guest's.** *Recommended and built:* a claim
  takes only a ticket whose typed words agree with the account or that she vouched for, so a stranger's name and address
  stay on their row; on a ticket that is hers the claim still puts the account's name and confirmed address where the
  typed ones were (one row never carries two names). Alternative: keep the typed name on a claimed row (inert).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`, the "Claiming anonymous uploads on sign-in" bullet: the rule, the ask, the answer's
  memory and a deleted account's rows (crumbs-23 owns the file: this one bullet is the exception, the claim's own fact).
- `docs/systems/database-security.md`: the authenticated-only list gains `claim_ticket_asks` / `claim_asked_uploads`
  and their line its reason (`whose_ticket`), the service-role predicates gain `whose_ticket`, and `0029` reads 35.
- `docs/systems/auth-accounts.md`: confirming claims the uploads on this device that can be hers; a stranger's typed
  name never names her profile.

## Deferred (ROADMAP one-liners, bucket named)

- (seams) The claim's two new calls move onto the typed client once `types.ts` regenerates after `20260929234000`
  (`byName` in `src/lib/guest/claim-uploads.ts` goes).
- (guest capture) The keep confirmed with another address says where her photos wait, and the told name waits for a
  claim that moved her photos here (the second Question).
- (guest capture) A yes to the shared-phone ask that moves this album's own uploads plays the follow moment (it toasts
  today).

## Handoff (replaces the chat report)

- **The work commit `8fc1f364`, pushed; launch-prep had not moved** (`aa3b37c2`, `git merge-base --is-ancestor`), so no
  sync commit; the head is in the chat line.
- **Gates on `8fc1f364`**, each its own exit code, through `scripts/build-lock.sh`: typecheck 0, lint 0 (no warnings),
  test 0 (629 files, 7472 tests), build 0, `pnpm lab:smoke --base http://localhost:3133` 0 (142 checks, 0 failing).
  Logs: `../partyreel-wt/_scratch/shared-claims/final-{typecheck,lint,test,build,lab-smoke}.txt`. No board, so no
  lab:demo.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths and this file, plus the three
  system docs above (Record subtractively; guest-flow.md's one bullet is the exception named there).
  `src/components/guest/event-experience.tsx` is crumbs-22's, so the album page mounts the ask from its own
  `page.tsx` instead (owned here), beside `EventExperience`.
- **The rolled-back proof, red then green, on the live schema** (one `execute_sql` each, `begin ... rollback`):
  today's function reproduces the find (P's sign-in took both tickets, erased the visitor's typed name and W's address,
  W's claims review listed 0: `_scratch/shared-claims/proof-today-red.txt`); the file's nine steps hold (`setup`,
  `grants`, `the shared phone`, `the answer`, `sam`, `new accounts`, `unconfirmed`, `the block`, `bounds`), quoted at
  the migration's foot and in `proof-mine-green.txt`; afterwards the live claim read `fc760d57...` and no function,
  account, block or upload of the check remained. The bodies' hashes inside the check match the file's, hashed
  locally (the file's apply protocol, step 2).
- **The claim's tests, red on today's code and green on this one**: `migration-guards` "shared phones" 11 of 12 red
  without the migration, 12 green with it (`guards-red-green.txt`); the client's (`claim-uploads`, `claim-ask`,
  `components/shared/claim-ask`, `session-tokens`, `device-tickets`) 4 red plus 3 files unresolvable on today's code,
  then 6 red on the claim alone once the store existed, then 44 green (`client-red-stage0.txt`,
  `client-red-stage1.txt`, `client-green.txt`).
- Items:
  - `supabase/migrations/20260929234000_shared_phone_claims.sql`: `whose_ticket` (the rule), `claim_anonymous_uploads`
    taking only 'mine' (signature, answer and grants unchanged; its body's diff is the three clauses:
    `_scratch/shared-claims/claim-body.diff`), `claim_ticket_asks` and `claim_asked_uploads`.
  - `src/lib/guest/claim-uploads.ts`: after every claim, the ask read (never awaited) and `claimAskedUploads`, the yes
    for the account that was asked.
  - `src/lib/guest/claim-ask.ts`: the queue, the answer's memory (`pr_not_mine_<qr>`, account ids, never a token) and
    the words.
  - `src/components/shared/claim-ask.tsx`: the question, the popups' `confirm` kind, waiting for a calm moment;
    mounted by `claim-uploads-on-auth.tsx` (the (app) layout) and `src/app/(guest)/e/[token]/page.tsx` (never the
    demo or the host). Looked at locally on a throwaway page (not committed): 1440 and 375, dark and light, the long
    name wrapping, `alertdialog` named by the title and described by the question, focus on Not mine at a desk; the
    real album page drew nothing extra and logged no error, its door read as a layer the ask waits for.
  - `src/lib/guest/session-tokens.ts`: `collectStoredTickets`, the tickets with their albums (the token list reads it).
  - `src/lib/guest/use-stored-name.ts`: putting a ticket down (and the sign-out) forgets its answers too.
  - A hardening: a proved row whose account was deleted is claimed by no one who signs in next on that phone.
- Assets requested from Will: none.
- Board ideas: none.
- **Proposed migrations:** `20260929234000_shared_phone_claims.sql`, by its header's protocol: the drift read
  (`claim_anonymous_uploads` `fc760d575b691bac9cf3e14b4f9aaf39`, none of the three new functions), the rolled-back
  check at its foot, apply verbatim, the four hashes and ACLs it names, advisors 18 / 4 / 35 (0029 gains exactly
  `claim_ticket_asks` and `claim_asked_uploads`), then regenerate `types.ts`. An expand: the deployed build keeps
  working and fails closed (it claims only what can be hers and never asks), so apply and push go in either order.
- Calls his to overrule:
  - First words must match exactly (Will and William ask).
  - An account with no name anywhere (a new account by email code at /login, the like door or the keep, holding no
    ticket at the album on screen) still takes name-only tickets in silence, the newest naming its profile, as today:
    the rule has no name of hers to hold them against.
  - Only a confirmed account is asked; an unconfirmed session takes only an address-less ticket its name agrees with.
  - The ask shows no album name and no preview.
  - Closed unanswered, it asks again on a later visit; only Not mine is remembered.
  - A yes toasts the claim's own line and refreshes the page; it does not play the album's follow moment.
  - The ask waits while any dialog, sheet or menu is up.
- **The shared-phone walk for the next build's red-team** (localhost cannot sign in): on one browser, signed out, at a
  names-only disposable album A: Continue as guest, name "RT Visitor", Email willg97@gmail.com, one photo, Maybe later;
  at a second names-only album B: name "Dana", no address, one photo. Then sign in as partyr33l through the chooser
  (`/login?next=/dashboard`): SQL shows A's row still `user_id` null, "RT Visitor", `pending_email` willg97's, and B's
  unclaimed; once no layer is up the dashboard asks "1 photo was added on this phone as Dana. Is it yours?"; Not mine
  moves nothing and a reload asks nothing (`pr_not_mine_<B>` holds her id). A third ticket typed "RT Mine" at A on a
  fresh visit and answered They're mine lands on her account with "We added your uploads to your account." and a Guest
  card; a ticket typed with partyr33l@gmail.com goes to her in silence; signing in through `/login?next=/e/<A>`, the
  question waits until the album's door has closed. Then sign out (the phone's tickets and answers go) and sign in as
  willg97: his claims review lists A's row "Added as RT Visitor", and Claim brings it to him. Expect the question in
  every walk that types a guest name on the red-team's browser before a sign-in.
- **Look at first:** the migration's header (the rule and its three readers), then
  `src/components/shared/claim-ask.tsx`, then the Questions.
