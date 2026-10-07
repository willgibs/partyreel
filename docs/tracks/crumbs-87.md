---
track: crumbs-87
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "3dde5801"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/event-settings-sheet
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/card/
  - src/components/app/dashboard/
  - src/components/app/event-card
  - src/components/app/event-feed/review-section
  - src/components/app/event-feed/hub-develop
  - src/app/(app)/dashboard/[eventId]/guests/invited-section
  - src/lib/db/queries/social
  - src/components/social/guest-list
  - src/components/social/guest-peek
  - src/app/(app)/account/page-connections
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
---

# lp/crumbs-87

**Goal.** Small things a person can hit, from the gap audit and the last merges, fixed at their source.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, in order (each an Immediate line in `docs/ROADMAP.md`; the Orchestrator retires each at your record):**
1. **The door's email gate (MEDIUM, the gap audit):** with "An email first" off, Private > You let each person in, then Public, leaves `require_verified_email` on (`settings-state.tsx`'s `saveDoor` keeps it and nothing restores her choice), so a name-only guest already in meets "Confirm your email to see everything". Restore her own choice when the door leaves the state that forced it, and say it as the row does.
2. **The shared link's words:** `/e/[token]` always unfurls as "Add photos to <name>" and "Add yours." even with uploads closed; say what the album is in its state (adding open, or the album to look through), and let the card (`card/route.tsx`) follow.
3. **The dashboard's tally** at 1440 says "Nothing needs you" under a stage whose live event reads 105 to review: the week's count includes the stage's own event.
4. **The waiting amber, retired:** the dashboard's marks (`marks.tsx`, `events-row-list.tsx`, `event-card.tsx`) and Review's own count (`review-section.tsx`) wear `--needs-you` (globals.css, tally) as the hub's badges do; one token, never a second red.
5. **A Disposable's hub outside the party's zone** says the develop in the party's zone above the held card's time in the reader's clock, unlabelled (`hub-develop.tsx`): one clock, or both named.
6. **The Guests room on a Public album** shows the INVITED list and its paste box, which let nobody in and send nothing there (`invited-section.tsx`): show it only where the invite list is the door, or say what it does.
7. **Follow where a block stands:** Connections' look offers Follow after an Unblock where they blocked her back, and the album's guest list offers Follow on a chip of someone she blocked or who blocked her (`followUser` is block-silent, so the chip then lies); read the block either way (`social.ts`'s `isBlockedEitherWay`) where a Follow is offered, `GuestList` taking `blockedIds` beside `followingIds`.
8. **Settings' sheet clips the focus halo** (its overflow-hidden box) on the door switches, the Max size select, the Cinematic card and "3 seconds", at 375 and 1440 (red-team 56b, LOW).

**Nearby lanes running (never edit their paths):** album-moments-wiring (the guest album, arrivals, the upload stack, the reel's curtain, `event-experience*`), storage-sums-signal (the purge sweep, /admin/jobs, `src/lib/db/queries/storage-sums*`). If an item needs a line in their files, list it as an exception in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1 · Item 1: where her own choice lives between a gate's hold and its leave.** Built: the provider notes on this device
  that a gate turned "An email first" on from off (`settings-state-email.ts`: `localStorage`, beside the page's own note for a
  browser that refuses storage), and when the ROW (never the optimistic overlay) shows the door has left that gate it writes
  the switch back off and toasts "An email first is off again. It was only on while you let each person in." (the invite
  list's own words for that gate). It covers every way a door leaves (a pick, a first password's own save, another device's
  change reaching the row); her own word on the switch ends the note. Recommended: take it as the working version. It is
  device-bound: a gate held on a phone and let go on a laptop gives today's behaviour (the switch stays on, live, one tap
  from off), never a wrong one. The complete answer is the database remembering (a column the gate's hold sets when it turns
  the step on from off, given back by one `before update of gate` trigger on `events` so the door's pick and the password's
  first set reach it on every device, and `email_restored` in `set_event_door`'s answer for the toast). Not built: it adds a
  column to `Tables<"events">` and replaces `set_event_door`, whose body `migration-guards.test.ts` pins in a dozen places,
  so it is a migration lane's, with the Advisor (Deferred).
- **Q2 · Item 2: the unfurl's words, and where the state rides.** Built: an open album that takes photos is "Add photos to
  <name>" and "Photos and videos from the day. Add yours." as before; one whose host closed uploads is "Photos from <name>"
  and "Photos and videos from the day. Take a look."; a link to one photograph keeps "A photo from <name>" and follows the
  state in its line. The card's foot is "See the photos & videos on Partyreel" at the plain address (true of every album)
  and "Add your photos & videos on Partyreel" at `?add`, which the page names only for an open album that takes photos; the
  flag is honoured only where a name is (a private, unknown or `?private` card is the generic one, whatever the address
  says). The state rides the address, never a read of the card's own: the route stays one answer per address, and a host who
  closes uploads is never answered by the edge's hour of the old invitation. Recommended: take it. His to overrule: the four
  sentences.
- **Q3 · Item 3: the tally.** Built: "THIS WEEK" counts the week's whole set, the stage's own event among it where it is one
  of the week's parties (walked: "2 of 4 need you" under a stage reading Review 2, which the old rule counted as "1 of 3");
  a stage that is not the week's (a far party, an undated album busy today) that still asks takes the zero's "Nothing else
  needs you". The brief says the week's count "includes the stage's own event" and the ROADMAP line says it "leaves it out":
  I read the first as the fix. Recommended: take it.
- **Q4 · Item 4: the stage's figures.** Built: the stage's waiting figures (at the door, to review) stay the stage's white
  and carry the status dot beside their label, since `--needs-you` is a badge's ground under white figures and a deeper red
  set as type thins out over the lead photograph's light. The brief names the dashboard's marks, rows and card chip and
  Review's count; the stage's amber was the same status. Recommended: take it.
- **Q5 · Item 6: INVITED on a door that is not the list.** Built: a list nobody is on, under a door that is not the invite
  list, draws the house's dormant line (what it does, that it sends nothing, the way to the door's page) and no field; a list
  that already holds addresses stays awake under any door (hers to see and to remove), and an address she removes never
  folds the section under her hand. Recommended: take it (Will's own dormant note, "never hidden", decided between hiding it
  and new words over a live field).
- **Q6 · Item 7: what a Follow is offered on.** Built: `getBlockedAmong(viewerId, ids)` (the batch form of
  `isBlockedEitherWay`: two indexed reads of the viewer's own relations, answering only the ids asked about and never which
  side blocked) feeds `GuestList`'s `blockedIds` for the chip, the look and the faces row's panel; `getMyBlocks` says per
  Blocked row `followBarred`. No Follow across a block either way. Recommended: take it. Not built (the ROADMAP line's second
  half): a look's Follow reads Follow again on its next open in the album's guest list (Deferred).
- **Q7 · Lane exceptions, each droppable alone.** Recommended: take all four. (a) 8c6404f8c, item 8: the halo is cut by the
  Dormant primitive's fold box (measured below), so the fix is `ui/dormant.tsx` and its test; no owned path can move it.
  (b) 8b2e3c9a3, item 5: one line in `event-feed/event-hub-head-cover.tsx` (its `ContactSheet`'s clock), where the manifest
  names `hub-develop.tsx`, which plays the develop and says no clock. (c) f2cbfa874, item 7: a new
  `(guest)/e/[token]/page.guest-list.test.tsx` beside the album page pins what it asks of `getBlockedAmong`, of whom. (d)
  311f3438c, item 4: "amber" in four comments and a Library note (`lib/dashboard/stage.ts`, `attention.ts`,
  `events-view.ts`, `library/compositions/gallery-demos.tsx`); words only.

## System-doc edits (in place, owned facts only)

- none (the lane owns no `docs/systems/` doc). Lines these changes made stale, for whoever owns them:
  `design-system.md` "A count that needs her is one token" (the dashboard's marks, rows, card chip, Review's count and the
  stage's dot wear it too); `dashboard.md` "This week" (its tally counts the stage's own event where it is the week's);
  `guest-flow.md` "open → the full experience" and "The link's image" (the title and line follow `accepting_uploads`; the
  card's `?add` flag); `host-app.md` "An email first" (a gate that lets go gives her names-only back, device-bound), "The
  Guests room's Invited" (a list nobody is on, under another door, sleeps) and "A setting with no effect right now" (the
  fold's box leaves a halo's room); `profiles-social.md` "A person's block shapes the follow graph only" and Connections
  (`getBlockedAmong`, `followBarred`); `disposable-mode.md` "The wait's clock" (the hub's held card says both clocks, as its
  line does).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- The host app: Settings: the gate's hold remembers her choice in the database (a column set when `set_event_door` turns the
  step on from off, given back by one `before update of gate` trigger on `events`, answered as `email_restored`), so every
  device and the password's first set get it and `settings-state-email.ts`'s device note goes (crumbs-87's Q1).
- The host app: Settings' door page: a move onto "You let each person in" or the invite list turns An email first on for
  everyone, so a name-only guest already in meets "Confirm your email to see everything" (walked: a guest on a phone), while
  the door's inside note says "A gate stops newcomers; everyone in keeps adding" and the line before the move says nothing of
  it (`door-page.tsx`'s `consequenceOf` and `data-door-inside`).
- Accounts and profiles: a look's Follow in the album's guest list reads Follow again on its next open (the look remounts its
  own button); one answer per person for every face of a relation on a page, as Connections' island keeps for its card.
- Design system: the site's pictures of the app still draw Review's count in the amber pill
  (`marketing/sections/how-it-works/host-pictures.tsx`, `features/curation/review-queue-demo.tsx`); the app's is
  `--needs-you` now (the marketing visuals' phase).
- Help: `content/help/share-the-album-after-the-event.mdx`'s keepsake step can say the link then unfurls as "Photos from
  <name>", not "Add photos to <name>".

## Handoff (replaces the chat report)

- Work, all pushed (the head is in the chat line): d55e20404 (4), 4dbda0dab (3), 650f402dc (2), ad06433b5 and 150445706 (6),
  f2cbfa874 (7), 8b2e3c9a3 (5), 38b1ef7be and 4cae34f63 (1), 8c6404f8c (8), 311f3438c (comment words). No sync commit:
  launch-prep moved (album-moments-wiring, storage-sums-signal and brand-marks-r1 merged, tip 2dd9fe797), but none of its 123
  changed paths is one of this lane's (the two lists have no path in common) and `git merge-tree --write-tree HEAD
  origin/launch-prep` is clean; the Orchestrator's merge gate is the integration check.
- Gates on 150445706, each on its own exit code (logs in `../partyreel-wt/_scratch/crumbs-87/gate2-*.log`): typecheck 0; lint
  0; test 0 (1069 files, 13,503 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3131` 0 (151 checks, 0 failing; scope: the Library, and the boards account-moments and customize, which
  import `event-card.tsx` and `settings-state-email.ts`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 30 owned paths + this file, plus the 8 exceptions of Q7:
  `ui/dormant.tsx`, `ui/dormant.test.tsx`, `event-feed/event-hub-head-cover.tsx`, `(guest)/e/[token]/page.guest-list.test.tsx`,
  `lib/dashboard/{stage,attention,events-view}.ts`, `library/compositions/gallery-demos.tsx`.
- 1 ("Settings: a host's names-only door is undone by an email gate"): `settings-state.tsx` + `settings-state-email.ts`;
  `settings-state.test.tsx` (each rule fails without it; the gate-to-gate move is driven with the database's own answers).
  Walked live at 1440 and 375 on a local build (event 9fef9ec9): names only, a name-only guest in, approve (the guest then met
  "Confirm your email to see everything", the screen the audit named), Public: the switch back off, the toast, the guest's
  album whole again, the database's `require_verified_email` false; and through a reload, the invite list's wording, a step on
  by her own hand (left on, nothing said), and out to Only people already in. The password's path and another device's change
  are pinned with a row the test moves, not walked (a password is never typed). ★ The walk caught a bug my first tests could not
  (a move from one gate to another answers `emailHeld: false`, which dropped the note): fixed in 4cae34f63 with a test that
  uses the database's real answers.
- 2 ("Share: an album's link always unfurls as 'Add photos to <name>'"): `card/words.ts`, `page.tsx`, `card/route.tsx`;
  `card/card.test.tsx` (the old "an open door names the event's own card" is reshaped, its reason expired and said). Walked:
  `curl` of `/e/<qr>` as an unfurler on a local build, uploads open then closed through Settings (title, description, og and
  twitter image each follow), a `?photo=<id>` link closed, and the cards fetched and looked at (`?add` and plain; `?private&add`
  and an unknown token's `?add` are byte-identical generic cards).
- 3 ("Dashboard: at 1440 'THIS WEEK · Nothing needs you'"): `week-row.tsx` (`weekTally`), `home-body.tsx`; tests in
  `week-row.test.tsx` and `home-body.test.tsx` (the same count whichever rule leads). Walked at 1440 and 375, signed in, a
  review event on the stage: "2 of 4 need you". The audit's own state (a quiet week under a stage that asks) is pinned, not
  walked: another lane's 105-to-review event stands in the week.
- 4 ("Design: the dashboard's waiting marks ... still wear the waiting amber"): `marks.tsx`, `events-row-list.tsx`,
  `event-card.tsx`, `review-section.tsx`, `stage.tsx`; `needs-you.test.tsx`, `review-section.test.tsx`, `stage.test.tsx`.
  Walked: the stage's and a week card's dots, the List layout's pills and the Table's dots all compute the hub badge's exact
  colour, and Review's "2 waiting" pill is the same pixel value as the hub's Review badge (1440 and 375, and the dashboard
  under a dark scheme); the card chip is pinned by test, and the Library's specimen draws it (crawled by lab:smoke, not looked at).
- 5 ("Hub: a Disposable's hub read outside the party's zone"): `event-hub-head-cover.tsx` (Q7b); `hub-develop.gallery.test.tsx`
  (fails without the zone). Walked, party in New York: from New York "tomorrow at 9 am" in the line and the card; from
  Kiritimati the line says "Thu, Oct 8 at 9 am in New York" and the card "All at once Thu, Oct 8 at 9 am in New York, Fri 3 am
  yours" (1440 and 375, no sideways scroll).
- 6 ("Guests: on a Public album the room shows the INVITED list"): `invited-section.tsx`, `invited-section.test.tsx`. Walked at
  1440 and 375: the line on a Public album, its link to the door page, the invite list chosen, "Manage in Guests" landing on
  the awake section, an address added and removed.
- 7 ("Profiles: Connections' look offers Follow after an Unblock where they blocked her back" and "the album's guest list offers
  Follow on a chip of someone she blocked"): `queries/social.ts`, `guest-list.tsx`, `guest-peek.tsx`, `page-connections.tsx`,
  `page.tsx`; `social.test.ts`, `guest-list.test.tsx`, `page-connections.test.tsx`, `page.guest-list.test.tsx` (each fails
  without the fix). Walked: willg97 blocked the operator's public profile, Connections' Blocked row's look offered no Follow,
  after Unblock it offered one (nobody blocked back), so `getMyBlocks`' new admin read ran on the real `user_blocks`; block
  removed, `user_blocks` back to 0 rows. ★ Not drivable: a Follow chip needs a second signed-in account with a handle (hi@willgibs.com
  has none and `signin.mjs` refuses its second factor; the operator is never signed in), so "they blocked her back" and the
  chip across a block are pinned, not walked.
- 8 ("Settings: the sheet's overflow-hidden box clips the focus halo"): `ui/dormant.tsx` (Q7a), `ui/dormant.test.tsx`. A probe
  of every focusable control on the four Settings pages against its nearest clipping ancestor (`../partyreel-wt/_scratch/crumbs-87/rt/roomprobe.js`):
  before, 14 under 8px (the door's two switches at 0px right, the Max size select at 0 on every side, the reel's four looks
  at the edges they touch, the seven hold steps at 3px bottom); after, 0 at 1440 and at 375, no page scrolls sideways at 375,
  and the switch's halo is whole on a capture (`rt/shots/07` before, `08` after, `09` at 375).
- Assets requested from Will: none
- Board ideas: the door page's step 3 could say before a move what a gate does to guests already in by name (a consequence
  line with their count, as the password's two groups do); a board's question, or a crumb.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (Q1's column is a proposal for a later lane, not applied
  and not in this branch).
- Test data (willg97@gmail.com), all through the product's own UI, all deleted: events `9fef9ec9-0305-42ec-90c0-e653e7cf7831`
  "crumbs-87 (disposable) door", `6f784403-00f3-4220-926d-461bb42e9fba` "... review", `436fd4cf-4b32-4649-b714-8cfcd381d46c` "...
  camera" are in Deleted (purge 2026-11-06), with the two name-only guests and three photographs they hold. Restored: the
  dashboard's Display (Gallery, nothing set), the block of the operator's page (lifted), the invite-list address (added and
  removed). One slip: a click aimed at the Display menu pressed the dashboard link of another lane's event "Gallery width
  (disposable)" and opened its hub read-only (it stamps its Last opened; nothing else of it was touched). The ledger and the
  captures: `../partyreel-wt/_scratch/crumbs-87/ledger.md`, `.../rt/shots/`.
- Calls his to overrule: the four unfurl sentences and the card's two feet (Q2); the stage's figures white with a dot, not red
  type (Q4); "Nothing else needs you" (Q3); the device-bound note until the database remembers (Q1); the quiet line over the
  invite list (Q5).
- Look at first: `settings-state.tsx`'s restore effect and `settings-state-email.ts` (Q1, the only logic that writes a setting
  of hers on its own), then `ui/dormant.tsx` (a primitive every dormant setting rides: it moved nothing in the layout, and its
  fold box now stands 12px outside its content), then `card/words.ts`.
