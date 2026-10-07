---
track: account-moments-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/social/relation-toggle
  - src/components/social/profile-actions-menu
  - src/components/social/guest-peek
  - src/app/(guest)/u/[slug]/
  - src/app/(app)/me/
  - src/app/(app)/account/page
  - src/components/app/dashboard/page-invite-card
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/account-moments.json
  - src/app/(dev)/design/sandbox/account-moments/spec.ts
  - docs/systems/profiles-social.md
---

# lp/account-moments-wiring

**Goal.** Her own account as Will picked at account-moments r1: a block said quietly where Follow stood, a Connections row that stays turned back with names opening the person's card, and her page before it is public wearing its own head, marked private.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3135 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/account-moments.json` round 1):** block = line, tidy = stays, me-page = private, invite = today; follow is unclear to him and goes to account-moments r2 with the invitation's redesign after you (so leave Follow's landing and the invitation card's look as they are). The board (`src/app/(dev)/design/sandbox/account-moments/`) draws each pick on production's own controls: that drawing is your spec, and the consent model is never drawn away (a page is public only by her choice; `docs/systems/profiles-social.md`).

- **block = line:** on a blocked person's page, where Follow stood, a quiet well says it to her alone: she blocked them, they are not told, Unblock beside it, on every visit (`RelationToggle`, the profile menu).
- **tidy = stays:** in Account's Connections (`account/page.tsx`'s `PersonRow`), a row whose relation she flips off stays, turned back (Follow on an unfollowed row, Block on an unblocked one): one more press undoes it, with no timer, and it leaves the list when she comes back. Will's note: "How do we handle the rare case of unblocking somebody but then wanting to follow them? Can guest names be clicked here to open the mini card on screen for additional actions beyond the row action flip? That'd be my first guess as a user. Don't want to overcrowd the row actions." The card exists: `GuestPeek` (`components/social/guest-peek.tsx`, a popover at a desk and a sheet in a hand, with Follow and Open full profile); a name in Connections opens it, carrying a profile where today it carries a guest row, so Follow after an Unblock is one press there and the row keeps its one action. One component per purpose: extend `GuestPeek` by props, never a second card.
- **me-page = private:** `/me` before she has a public page wears the public page's own head (her photo and name), marked that only she can see this page, then her things (uploads, likes, follows); going public later changes who sees it, not what it is. The invitation stays today's card in its place (invite = today; r2 redraws it).
- **The Immediate line it closes:** the public page's meta row orphans its `·` at 375 on a long handle (`u/[slug]/page.tsx`): the separator travels with what follows it.

**Nearby lanes this wave (never edit their paths):** the Guests room (host-moments-wiring) renders `guest-list.tsx`, which wraps `GuestPeek`: keep its current callers' props working and say what changed.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** willg97 and hi@willgibs signed in on your port: a block from a profile page and its well on a revisit, Unblock there and from Connections, a flip and its undo in Connections, a name opening the card and Follow from it, `/me` before and after a page is claimed, both widths, a screen reader's names.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under the Handoff's calls his to overrule.

- **The well's words and place.** Built: "You blocked {name}. Neither of you can follow the other, and they aren't told.",
  under the bio where there is one, with Unblock by its side (wrapped under the words at 375, as drawn). The drawing
  wrote "Jordan" twice, a first name the page does not have; the display name stands once and "they" follows.
  Recommended: as built.
- **Where a person lands when she follows them from their look in Connections.** Built: they join Following at once
  and keep their turned-back row under Blocked until she leaves (on both lists meanwhile, each button true), and a block
  that lands takes the person's Following row (it severs the follow, as the ask says). The alternative moves the row
  out of Blocked the moment she follows. Recommended: as built (a list she is reading never loses a row but to a block
  she confirmed).
- **A look's Follow after an Unblock where they blocked her back.** Follow is block-silent (the server answers ok and
  writes nothing), so the look reads Following and a false row stands under Following until she leaves; the profile
  page hides Follow there through `isBlockedEitherWay`. The cure is a render-or-not read per Blocked row in
  `lib/db/queries/social.ts`, outside this claim. Recommended: a small follow-up lane adds it and feeds `canFollow`;
  the cost until then is one wrong row in a mutual-block corner, gone next visit.
- **Her page's head carries no handle and the sections' own line is dropped on `/me`.** `/me` shows her photo, name and
  "Joined {month year}", then "Only you can see this page."; "Only you can see the sections below." stays on the public
  page's owner mode, where the page is public. Recommended: as built.
- **A name in Connections opens the look, so her page is one tap further than the old link** ("Open full profile" is
  the look's last button). It is his ask; recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md` (in `reads`, edited as a listed edit): `/me` is her page before it is public (the
  head, the mark, the standing invitation, `OwnerNote` moved to the public page), the blocked well and the offline
  flip in the block bullet, and the ★ Connections island that ignores the server's re-render by design.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · Accounts and profiles: Profiles: Connections' look offers Follow after an Unblock where they blocked her
  back (`followUser` is block-silent: ok, nothing written), so a wrong Following row stands until she leaves; the
  profile page's `isBlockedEitherWay` read per Blocked row (`lib/db/queries/social.ts`) would hide it
  (account-moments-wiring).
- Immediate · Accounts and profiles: Profiles: the album's guest list offers Follow on a chip of someone she blocked or
  who blocked her (the same silent no-op, then the chip reads Following), and a look's Follow reads Follow again on its
  next open; `GuestList` needs `blockedIds` beside `followingIds` and the look the answer kept, as Connections keeps
  it and hands the look (`GuestPeek`'s `follow`) (account-moments-wiring).
- Upcoming · Accounts and profiles: Profiles: the owner mode's Connections chips (`/me`, `/u/<handle>`) link to pages
  where Account's names now open the look; the same look could serve them (account-moments-wiring).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work is `412031f37` and `c038b1ba8` (the well's button kept out of the status region's
  announcement) on `lp/account-moments-wiring`; the head (this manifest on top of them) is in the chat line. launch-prep moved by three record commits (`e6fa3cc8f`, `f4becf845`, `4b1abf0b2`: STATUS, the
  Orchestrator's pickup and two board manifests) that touch no path or import of mine, so no sync, per PROGRAM.md.
- **Gates, each on its own exit code, all on the tree of `c038b1ba8`** (logs in
  `../partyreel-wt/_scratch/account-moments-wiring/`): `pnpm typecheck` exit 0 (`typecheck.log`); `pnpm lint` exit 0,
  no warnings (`lint.log`); `pnpm test` exit 0, 1061 files and 13323 tests, `test:rules` inside it (`test.log`);
  `zsh scripts/build-lock.sh pnpm build` exit 0 (`build.log`); `pnpm lab:smoke --base http://localhost:3135` exit 0,
  181 checks, 0 failing (`smoke.log`; its scope reached the account-moments, customize, event-header and host-moments
  boards through `guest-peek.tsx` and `profile-actions-menu.tsx`, all 200). ★ `pnpm test` ran with
  `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key`
  exported (the component setup's own dummies): the unit project reads no `.env.local`, and without them six files
  (`inline-code`, `spec-shared`, `blog-keep-lines`, `help-mdx-compile`, `change-plan-watch`, `server-pipeline`) fail to
  import `env.ts` on the primary checkout's HEAD as well, none of them this lane's.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `docs/systems/profiles-social.md` (listed above);
  `src/app/(app)/account/page.tsx`, `page.test.tsx` and the two new `page-connections.tsx`, `.test.tsx` (inside the
  `account/page` claim by name, one directory that is the page's own); `src/app/(app)/me/page.tsx`, `page.test.tsx`;
  under `src/app/(guest)/u/[slug]/`: `page.tsx`, `page.test.tsx`, `owner-sections.tsx`, `owner-skeleton.tsx` and the
  new `blocked-well.tsx`, `profile-head.tsx` and their tests; `src/components/social/relation-toggle.tsx`, `.test.tsx`,
  `profile-actions-menu.tsx` (a comment, and prettier's one unrelated wrap), `guest-peek.tsx` and the new
  `guest-peek.test.tsx`; this file. No exceptions: `page-invite-card` is in the claim and untouched (invite = today).
- **The items:**
  - block=line: `u/[slug]/blocked-well.tsx` under a standing `role="status"` in `page.tsx`, drawn for `hasBlocked`
    alone (`page.test.tsx` pins that a viewer only THEY blocked, and a signed-out one, meet nothing); Unblock hands focus
    to `[data-profile-actions]` when it lands (`blocked-well.test.tsx`), its button's own flip sits under
    `aria-live="off"` so only the words are announced, and the menu's row stays the second way.
  - tidy=stays: `account/page-connections.tsx` (an island that keeps both lists and one answer per person; its test
    re-renders the page without the row and the row stays, turned back, one press undoes it); names open `GuestPeek`.
  - `guest-peek.tsx`: one optional prop, `follow` (the Follow the look offers while `canFollow`, where the surface keeps
    the relation); `guest-list.tsx`, `credit-look.tsx` and the Library's demo call it as before (their tests are green,
    `popup-demos.test.tsx` included), so the Guests room needs nothing.
  - me-page=private: `me/page.tsx` wears `u/[slug]/profile-head.tsx` (the head the public page now also draws), "Only
    you can see this page.", the standing invitation, then the sections; `OwnerNote` moved to the public page so `/me`
    does not say it twice, and `OwnerSections()` still takes no parameter (`owner-mode.test.ts` untouched, green).
  - The orphan `·`: `profile-head.tsx`'s meta row carries each separator inside the item it leads and clips it where the
    item starts a line; measured at 375 on `/u/partyr33l` with a long handle and a long month (no dot at either edge, a
    30-character handle breaks inside the column); it closes the ROADMAP Immediate line of the same words (the
    Orchestrator deletes it).
  - `relation-toggle.tsx`: `onSettle` (a landed flip), `srLabel` (Connections' buttons are heard as "Following Sam
    Okafor"), and a Server Function that never answers (offline) is now a refusal with one toast ("Couldn't reach
    Partyreel just now. Please try again."), where its rejection went to the page's error boundary.
- **Walked, local, signed in as willg97 on my own port (3135, a headless Chrome of my own, `signin.mjs`):** the block from
  the menu at 375 and 1440 and its well on a revisit, Unblock from the well (focus lands on More options) and from the
  menu's row and from Connections, a flip and its undo in Connections, a name opening the look (a sheet at 375, a card at
  1440, Enter opens, Escape returns focus to the name), Follow from the look after an Unblock (joins Following; the
  Blocked row stays), leaving Account and coming back (history.back: the lists are fresh), a 2.5 s-latency Follow (flips
  at once, two extra presses ignored), offline (one toast, the row as it was, no error screen), reduced motion on the well
  (opacity only), Tab with the halo on the name and the toggle, and the same on a production build (`next start` on 3135);
  dark ("the room") and light ("paper"); the accessibility tree read off Chrome (a decorative face, "Unblock
  Partyreel", "Following Partyreel", the Connections lists named by their headings, the status region); a 72-character
  name truncates in a row with no horizontal scroll. Captures are in `../partyreel-wt/_scratch/account-moments-wiring/rt/shots/`
  (pruned with the lane).
- **Test data:** none left. Every follow and block willg97 made on the operator's page (partyr33l) was undone through the
  app's own controls; reads before and after through the Supabase MCP (select only): follows 1 (`hi@willgibs.com` to
  willg, which was there), blocks 0.
- **Walks I could not drive, for the desk:** `/me` as a real handle-less account (hi@willgibs.com, the only one, holds
  a second factor, which `signin.mjs` refuses to mint around): I rendered the real page body for willg97 through a
  temporary route (deleted, never committed) at 375 and 1440, dark and light, and the unit test holds the redirect, the
  head and the invitation; a real screen reader and a real phone (the sheet is Chrome's phone emulation, names are the
  accessibility tree, not speech); the mutual-block corner (they blocked her, the third Deferred line) because only one
  other account has a page.
- Assets requested from Will: none
- Board ideas: one answer per person for every face of a relation on a page (a store the chip, the look, the row and the
  profile's Follow share, as Connections' island is for its card) would end the guest list's chip-and-look disagreement;
  plumbing more than a board, but the Orchestrator may want it as a lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Calls his to overrule:** the well's words and its place under the bio (Questions, first); Follow from the look joins
  Following and leaves the turned-back row in Blocked (second); the look offers no Follow from a Following row, whose own
  button is the Follow, and none while the block stands; `/me` shows no handle and drops the sections' own line; the
  new offline copy; the name's look in place of the old direct link.
- **Look at first:** Account at 375 after Following on a row and Unblock on a row (each stays, turned back), then the
  Blocked row's name and its look; `/u/partyr33l` as willg97 after a Block (375, then 1440, dark then paper); and `/me`
  for hi@willgibs.com, a handle-less account only he can open.
