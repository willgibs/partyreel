---
track: claims-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: identity-claims
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-claims/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-claims.json
  - docs/reviews/guest-capture.json
  - src/components/app/dashboard/claims-card.tsx
  - src/app/(app)/dashboard/claims-actions.ts
  - src/lib/db/queries/claims.ts
  - src/lib/guest/claim-uploads.ts
  - src/components/guest/follow-moment-card.tsx
---

# lp/claims-r2

**Goal.** Draw `identity-claims` round 2: the claim batch Will's notes lean to (one event at a time, each decision kept and confirmed inside the batch, each claimed event entered or followed up as you go), with `pointer` asked again in words that fit it.

## The brief

**His r1 answers** (`docs/reviews/identity-claims.json`): `ticket=banner` (a slim banner above the feed with Review), `pass=cards` (one event at a time, each with its own small preview; deciding advances), `confirm=dialog`, `after=profile`, and `pointer=?`.

His notes:
- On `ticket`: "This allows users to handle when they'd like to, rather than filling the screen with a tall card immediately... This question also conflicts with the next, where if we're handling multiple events on a screen here but the next question suggests each claim leads to its own confirmation page, we need a consensus - batch handling with in-batch confirmations, or separate handling? Likely batch, with an action to 'enter'/follow up on each claimed event as you go."
- On `pointer`: "How is this handled with the previous batch of claimable events? For example, I have 4 claimable events - am I visiting a separate follow up confirmation page for each event I claim?"
- On `pass`: "One at a time gracefully forces the handling of each to continue, rather than allowing them to stack endlessly."
- On `confirm`: "Popping up a modal is a very clear way to ensure confirmation. A second in-flow click more easily allows users to think the action was performed without confirmation."

**Production today is one batch** (`src/components/app/dashboard/claims-card.tsx`, `src/app/(app)/dashboard/claims-actions.ts`, `src/lib/db/queries/claims.ts`):
- four events are four rows in one card, with Claim / Not mine per row and Claim all;
- one Finish is one server action: `claim_guest_rows_by_email`, then `disown_guest_rows_by_email` for the rest;
- one dialog covers the leftovers, and one toast follows;
- there is no page per event;
- the device-token path (`claim_anonymous_uploads`, `src/lib/guest/claim-uploads.ts`) claims silently at the album's confirm.

`pointer` asked how she learns that rows wait at other events when she confirms at one album. Production says nothing today: `follow-moment-card.tsx` names only this event.

**This round draws the batch he leans to**, on his r1 picks (banner, cards, dialog and the profile toast, drawn as settled):
- what a decision does as you make it: kept in the batch and undoable until Finish, or saved at once;
- where a deletion's confirmation sits inside the batch: his dialog at the card that says Not mine, or once at Finish;
- the follow-up on each event as you go: "enter" the claimed event's album, or follow its host. This carries `guest-capture`'s follow note: "needs to work within any multi-claim handling. Follow doesn't have to be pushed as hard as a feature relative to uploads/verifications/etc."

Rewrite `pointer` so it cannot read as a page per event.

**Out of this round:**
- Where the banner's review opens (a side sheet in r1's drawing) is the new `popups` board's question, being drawn now. Draw it as r1 did, and ask nothing about the surface.
- `profile-setup` is wiring `after=profile`'s toast line now.

The board's `touchpoints.ts` rows are yours, and nothing else in that file; `node usher/kit/board-card.mjs --desk` lists every open ask.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built on its recommendation and drawn on the board as a carried call (`spec.ts` `carried`), his to overrule:

- **Where does an event go once she decides it?** Into a list under the card with its follow-up, while the next card comes up: four events are four taps, never a stop (or a page) per event. Overrule: the card turns to "Yours now" with its follow-up and a Next. (`decided-list`)
- **What happens to an event she never reaches?** It waits: only a Not mine deletes, and the banner keeps counting it (today's Finish reads an untouched row as not mine, `claims-card.tsx:98-100`, `:119`). Overrule: closing the review asks before deleting what is left. (`unreached`)
- **What does a password event's card show?** No photos, as its date is already withheld (QA #40, `20260924020000_row_cap_host.sql:229-230`): a lock and the count. Overrule: the card asks for that event's password first. (`gated-photos`)
- **Does the door's "You're in" point to the waiting events?** No: it is a held beat that masks the refresh (`use-success-hold.ts:33` `minBeatMs = 900`, never dismissable), so round one's door frame drew a Review button nobody can press; a door confirm meets the banner instead. Overrule: the beat waits for her with the line and a Continue, which is `identity-door`'s to draw. (`door-beat`)
- **Is a toast still a way to point?** No: `guest-door` is making the confirm return one beat with no stacked toasts, so round one's `pointer.toast` is gone. Overrule: a toast replaces the moment card's line. (`no-toast`)
- **How are the brief's three batch questions asked?** `save` first; `confirm` and `next` staged behind it (`after: { ask: "save" }`) and drawn in the world of his answer, since a dialog belongs where its deletion happens and a follow-up needs a written claim. `save`'s own two options are each drawn with their natural dialog (Finish's at the end, as-you-go's at the card), which their option lines say. Overrule: one ask bundling when a choice saves with where its dialog sits.

## System-doc edits (in place, owned facts only)

- none (a board ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits.** Work `9698395e` (the board and its touchpoints row), pushed to `origin/lp/claims-r2`; this manifest is the commit after it. No sync: launch-prep moved (`89095cff` mine-none, record `96f46a3f`) but touched none of this lane's `reads`, and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (PROGRAM.md "Sync").
- **Gates on `9698395e`**, each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/claims-r2/`: `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0, six warnings all in files this lane never touched (`lint.log`); `pnpm test` 0, 484 files and 5478 tests (`test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build.log`); `pnpm lab:smoke --base http://localhost:3137` 0, 260 checks, identity-claims at 626 of 1200 words (`smoke.log`); `pnpm lab:demo --board identity-claims --base http://localhost:3137` 0, four steps drawn and none failing or sharing a picture (`demo.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `src/app/(dev)/design/sandbox/identity-claims/` (batch.ts, board.tsx, fixtures.ts, ground.tsx, identity-claims.css, review.tsx, scene.tsx, screens.ts, spec.ts, world.tsx; parts.tsx deleted), this manifest, and one exception: `src/app/(dev)/design/touchpoints.ts`, the board's own `identity-claims` row only (asks, why, lives, note, variants), as the brief grants.
- **Items.**
  - Round 2 of `identity-claims` (`spec.ts`): four asks on round one's picks drawn as ground (the banner, one card at a time with its own photos, the dialog, the page toast): `save` (kept until Finish, today, or written as she decides; recommends as she decides), `confirm` after `save` (the dialog at the card, recommended, or once at the end, today), `next` after `save` (Open album, Follow its host, or both with a quieter Follow, recommended), and `pointer` rewritten (her dashboard's banner only, one line landing on her dashboard's one review, recommended, or the same review opened over the album). Round one's five asks leave `asks` (the ledger keeps them); `history` holds round one.
  - One pure reducer plays every frame (`batch.ts`): the RPCs' own semantics (a claim has no undo RPC, a disown detaches the address, `save=once` is today's two RPCs with one event id each), and each frame stays live after its script, its caption re-read off the frame after every press (`scene.tsx` `Remeasure`).
  - Priya and four waiting events in the RPC's own order (`fixtures.ts`): three hers, one not; Ana's 30th a password event (no date, no photos), Quiz Night's host with no page (so `host` leaves its row empty, drawn).
  - The dashboard ground is production's today (`ground.tsx`): the wide page, "Dashboard" and New event, the storage line, `EventCard`'s real `guest` variant, the lens and view toggle; round one drew an older one. After a finished review the ticket's slot shows `identity-profile`'s `prompt=claim` invitation, quoted as that board drew it.
  - Verified: the board at 375 and 1440, light and dark, captured frame by frame; the step at a 1440 and a 375 reviewer screen; presses driven in headless Chrome (claim, Not mine, Go back, Delete, Undo, Finish, Delete and finish, Done) against every mode pairing; the one animation (`identity-claims.css`, the next card and a settled Guest card arriving, 200 ms) is off under reduced motion, and a frame's opening picture never animates.
- **Assets requested from Will:** none (the twelve marketing stills).
- **Board ideas.**
  - The moment card will carry two "other events" sentences once `guest-door`'s one beat lands (its uploads from other events, already added, "said once") and `pointer`'s line (rows waiting to be decided): the wiring should keep "added" and "waiting" apart, or fold both into one line.
  - Once the review is done, the finish toast's page line (`after=profile`) and the page invitation card (`prompt=claim`) point to the same page in the same beat (drawn in `next`'s done frame at 1440, behind the sheet): one of the two could stand down.
  - The door's "You're in" (a held beat of about a second) has been drawn as a place for a button twice (this board's round one `pointer`, `identity-profile`'s `prompt.follow`): a line in the lab's traps (`src/components/lab/traps.ts`) would stop the next board.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. For the wiring: `save=once` needs no SQL (`claim_guest_rows_by_email` and `disown_guest_rows_by_email` already take an id list); `pass=cards`' photos need a read the ticket lacks today (a few preview keys per claimable event, presigned on the server, none for a password event).
- **Calls his to overrule:** the six Questions above; the fixture's four events (his own example count) with a password event and a pageless host in them; `pointer`'s third option (the review opened over the album) in place of round one's toast.
- **Look at first:** the `save` step, both options, then `confirm` and `next` in the world he picks; `pointer` at 1440, where "over the album" and "on her dashboard" part at a glance (at 375 the sheet covers most of either page).
