---
track: crumbs-44
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "59f3110b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/u/[slug]/
  - src/lib/db/queries/social.ts
  - src/lib/db/queries/social.test.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/components/social/follow-button.tsx
  - src/components/social/follow-button.test.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/social/relation-toggle.test.tsx
  - src/components/social/profile-actions-menu.tsx
  - src/components/social/profile-actions-menu.test.tsx
  - src/components/social/connection-buttons.tsx
  - src/components/social/attended-events-visibility.tsx
  - src/components/social/attended-events-visibility.test.tsx
  - src/components/social/profile-setup-wizard.test.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/user-menu.tsx
  - src/components/app/user-menu.test.tsx
  - src/components/app/event-settings/event-page.tsx
  - src/components/app/dashboard/page-invite-card.tsx
  - src/components/app/dashboard/page-invite-card.test.tsx
  - src/components/shared/route-skeleton.tsx
  - src/components/shared/route-skeleton.test.tsx
  - src/app/(app)/account/page.tsx
  - src/app/(app)/account/loading.tsx
  - src/app/(app)/account/social-actions.ts
  - src/app/(app)/account/profile/
  - src/app/(app)/welcome/loading.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/components/interactive-demos.tsx
  - src/app/(dev)/design/(shell)/library/patterns/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/patterns/interactive-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json
  - src/lib/validation/report.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-44

**Goal.** A person's page that paints at once and reads as one: event cards on their preview derivatives, a video-only card's own face, one toggle for follow and block, the menu clear of the name at 375, loading screens for the profile, /account and /welcome, the setup's small follow-ons, and the report's person arm under test.

## The brief

A person's page (`/u/<handle>`, its owner mode, and the setup at `/account/profile`) has seven ROADMAP lines; each is its line there (find it by the words quoted), fixed at its root with a test that fails on today's code, or retired with the evidence that it is already true:

- **Cards that paint at once:** "the event cards presign the cover's original (`queries/social.ts` reads `original_key`: 1920 wide, multi-megabyte, `loading=\"lazy\"`), so a card paints black for seconds where the preview derivative the dashboard's cards read lands at once". Read the preview the way the dashboard's cards do (`readCoverUrls`), the original only where no preview exists.
- **A video-only card's face:** "an attended card whose guest added only video draws `EventCard`'s lock fallback (`href: null`); it deserves its own empty face".
- **One toggle:** "three hand-rolled toggles do one job (`FollowButton`, the profile menu's block, the Connections card's buttons); one control, one contract". One component with its states in the Library, each caller on it.
- **The menu at 375:** "the overflow menu opens over the person's own name at 375".
- **Loading screens:** "`/account`, `/welcome` and `/u/[slug]` carry no `loading.tsx` (the profile awaits an RPC and two presign rounds before it paints)". Each in the app's own loading grammar (the dashboard's `loading.tsx` is the model).
- **The setup's small follow-ons** (from `profile-setup`): "a chosen event that can never appear (its album is not open) says so on its picker tile; the user menu's handle-less \"Your profile\" and event settings' \"Claim your handle to publish the page\" open `/account/profile` directly rather than through Account's door; the invitation's button carries its reason rather than repeating its title".
- **The report's person arm in tests:** "`src/lib/validation/report.test.ts` has no person-arm cases (both subjects, neither, a cross-subject `media_id`)".

One more line is a product question, never a guess: "a confirmed account with no handle has no page, so the owner mode's likes and connections are unreachable for it ... an account that declines one still needs a home for them that needs no handle". Write it under Questions with its options and your recommended answer, and build nothing for it unless the answer is small and reversible (say which).

What a person's page shows of others follows `profiles-social.md`'s consent rules: a door only to a page its owner published, a face only where it already shows, never an address, every picture presigned server-side.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, a public profile signed out at 375 and 1440 (a handle with event cards: the cards' first paint, the overflow menu), and the Library's toggle specimen in every state.

The owner mode and `/account` cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** six boards (`locked-door`, `event-ready`, `privacy-hero`, `disposable-mode`, `demo-framing`, `about-press`); none describes a person's page. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Handed-off lanes merge after you were cut, so leave their files alone: `crumbs-43` changed `components/social/guest-list.tsx`, `components/likes/`, the photo viewer and `lib/history-entry.ts`; `crumbs-42` the dashboard and the hub's rooms; `crumbs-41` the admin portal and billing. Two lanes run beside you:
- `strip-gaps` owns the EXIF strip and the privacy claims' copy;
- `export-ends` owns the album download (`components/app/export/`, `api/export/`, `lib/export/`, the Worker, `/admin/exports`).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does a confirmed account with no handle keep its likes?** (the brief's product question; nothing built) The
  owner mode's feeds live on `/u/<handle>`, so without a handle "Your likes" (and the uploads as one feed) has no home;
  Connections already lives on Account and the uploads reach the dashboard as Guest cards. Options:
  - **A: `/me`, the owner mode at an address that needs no handle** (`OwnerSections` takes no identity, so it is
    private by construction), redirecting to `/u/<handle>` once one exists, its head the setup's invitation; the user
    menu's handle-less Your profile would open it instead of the setup. Gain: one home for the private half whatever she
    chooses. Cost: a new address and a door that changes again.
  - **B: the dashboard's Guest side grows a Likes band.** Gain: no new address. Cost: reverses "your own likes are not
    a hosting job" (`owner-sections.tsx`).
  - **C: an Activity card on Account.** Cost: a settings page carrying a gallery.
  - **D: leave it**: the invitation keeps a page one guided step away. Cost: an account that declines has hearts it can
    never list.
  **Recommended: A.** Small and reversible (one page, one redirect, the existing sections), but it is a new address in
  the product and moves the door this lane just pointed at the setup, so it waits for his word.
- **`/u/[slug]`'s loading screen: kept none (built), against the brief's line.** profiles-social.md's ★ and
  `owner-mode.test.ts` hold that a loading file flushes its skeleton before the page decides a dead handle, and the
  line's reason went stale at `eba8ee1a` (the two presign rounds stream behind the grid's own boundary). What was left
  of the wait is fixed at its root: the shell asks for the viewer beside the RPC, through the request's one `getUser()`
  that `isFollowing` reuses (a signed-in visit asked the auth server twice, the first before the follow reads could
  start; an anonymous one asks nothing). Options: **A, keep none** (built; a tap on a name waits one round trip, two
  signed in, with no feedback) or **B, an identity-row `loading.tsx`** (a tap answers at once; a dead handle paints the
  row's skeleton for a beat before "There's nobody at this address", and the skeleton must pick the page's `GuestHeader`
  or the not-found's session-less `GuestBar`). **Recommended: A**, and the tap's feedback from the links' own pending
  state (Board ideas), which answers at the source without the flash.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: the picker's tile at an album that is not open says it cannot show (`albumOpen`);
  an attended card has no link, never a lock, and a party of video alone wears its own face; the setup's handle-less
  doors open `/account/profile` itself; every face of a follow or a block is one control on one contract
  (`relation-toggle.tsx`), the four Server Functions revalidating every profile and Account.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Media: `event_covers` is photo only, so a party of video alone has no picture on any card (the dashboard's, the
  picker's, the profile's, which now says "all video") though each video carries its frame-grab preview; a previewed
  video as the fallback cover, photos first, is one migration.
- Now · Design: `DropdownMenuContent` takes no collision padding, so a menu pushed against the viewport touches the
  glass (the profile's did at 375); the sub-menu's and the responsive menu's 8px as the panel's default keeps every menu
  off the edge.
- Now · Routes: `/welcome` builds every Guest card, covers presigned, only to count them (`getMyGuestEventCards().length`),
  and asks the auth server again beside the layout's cached `getRequestAuth`; a count read and the cached viewer would
  shorten the wait its new skeleton covers.
- Now · Profile: the cards' covers presign afresh on every visit (`readCoverUrls` takes no `stable`), so a return visit
  re-downloads each 17 KB preview the dashboard's stills serve from cache.
- Now · Code hygiene: `FollowButton`'s `slug` is taken and unread (a relation needs no handle); its callers in the guest
  list, the peek, the moment card and the claims review can drop it.

## Handoff (replaces the chat report)

Logs and captures: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-44/` (below, `_scratch/`).

- **Commits, pushed:** `a0dfc418` (owns at boot), `3b70ed3f` (the work), and this manifest. **No sync commit:**
  launch-prep moved to `f7f99c54` (two kit notes and `migration-versions.test.ts`), none in this lane's code or reads; a
  trial `git merge --no-commit origin/launch-prep` went clean and was aborted, as did trial merges of `lp/crumbs-41`,
  `lp/crumbs-42` and `lp/crumbs-43` into this head (all automatic).
- **Gates on `3b70ed3f`, each on its own exit code:** typecheck 0, lint 0, test 0 (696 files, 8,372 tests), build 0,
  `pnpm lab:smoke --base http://localhost:3133` 0 (141 checks, 0 failing): `_scratch/{typecheck,lint,test,build,lab-smoke}.log`.
  The lab crawl's PREMISE names `event-ready` (its five asks draw `EventCard`): they still hold, since every card it
  draws is linked and names no face, which draws exactly what it drew (the lock only for an unlinked card, the photo
  face for a linked one); `locked-door` imports `user-menu.tsx`, whose only change is the handle-less door's address.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + `docs/systems/profiles-social.md`
  (the facts above). `specimens.generated.json` is crumbs-41's too: a trial merge auto-resolves; if a merge leaves it
  stale, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` regenerates it.
- **Red on today's code:** `_scratch/red-on-today.log` (today's sources restored under the lane's tests: 12 failing
  across five files, the toggle's module absent; the doors and the invitation 4 failing) and `_scratch/report-mutation.log`.
- **Cards that paint at once: retired, already true.** `bfd74371` (rowcap-host) put the profile's covers on
  `readCoverUrls`, a day after the line was written; `/u/willg` signed out paints `photo/<id>/preview.webp`, 640x360,
  17,384 bytes, where the original is 1920x1080 and 253,072 (captured at 375 and 1440: `_scratch/profile-willg-{375,1440}.png`).
  `social.test.ts` now pins the attended arm's preview beside the hosted arm's.
- **A video-only card's face:** `EventCard` takes `empty` (`photo`, `video`, `locked`), its default the old one, and a
  profile's attended party whose gates all held with no photograph wears `video` (lucide `Film`), never the lock
  (`getPublicProfileAttendedCoverUrls` returns `{ covers, videoOnly }`; `party-cards.ts` maps both kinds, pure and
  tested). An event a gate dropped in a race keeps the plain face.
- **One toggle:** `components/social/relation-toggle.tsx`, its states at `/design/library/relation-toggle` (every
  state driven in headless Chrome: rest, mid-flip `aria-busy`, landed, the ask, blocked, a refusal springing back with
  its toast; `_scratch/library-relation-*.png`). The profile's Follow (`FollowButton`, same props for its five callers),
  the menu's Block row and Account's Connections rows are on it; `connection-buttons.tsx`, Account's
  `unfollowAction`/`unblockAction` and every hand-called `router.refresh()` are gone.
- **The menu at 375:** it never opened over the name on the page (headless Chrome with the actions forced on for an
  anonymous viewer, never committed: down at 375x812, 375x667 and 1440), but at a phone its end-aligned panel was pushed
  to the screen's edge, under Follow (left 0, its trigger at 115). It now hangs from the trigger's start there (left
  115, 36px to spare) and keeps 8px off the glass: `_scratch/menu-{before,after}-375x812.png`.
- **Loading screens:** `account/loading.tsx` and `welcome/loading.tsx` on two new RouteSkeleton shapes (the real Card,
  each page's own width; the Library's `route-skeleton` entry draws all four: `_scratch/library-skeletons-1440-bottom.png`);
  `/u/[slug]` keeps none (Questions) and its shell waits one round trip less signed in.
- **The setup's follow-ons:** the user menu's handle-less Your profile and event settings' claim line open
  `/account/profile`; the invitation's button reads "Choose what shows" over "Nothing shows until you finish."; a tile
  chosen at an album that is not public reads "Can't show: the album isn't public" (read after its name).
- **The report's person arm:** seven cases in `report.test.ts` (a bare person, a reason, a malformed id, both subjects,
  neither, a cross-subject `media_id`, no reporter); with each refine removed in turn, its case goes red.
- **For the next build's red-team (signed in, the alias):**
  1. willg97 on `/u/partyr33l` at 375 and 1440: Follow flips at once and stays on reload; Following flips back; the ⋯
     menu opens under its own trigger, off the edge; Block asks, then Follow leaves in the same round trip and the row
     reads Unblock; Unblock brings Follow back; no success toast anywhere.
  2. willg97's `/account` Connections: a Following row's button and a Blocked row's Unblock each take the row out of its
     list in one round trip, with no toast; offline, the press springs back and says why.
  3. The user menu → Account paints the Account skeleton, then the page; a nameless account's first visit to `/welcome`
     paints the name step's skeleton (an account only Will can make).
  4. hi@willgibs.com (no handle): the user menu's Your profile and its event settings' claim line open the setup; its
     dashboard's invitation (where it shows) reads "Choose what shows".
  5. willg97's `/account` picker: a tile chosen at a password or private album says it cannot show.
  6. A chosen attended party of video alone (a confirmed guest's one video at a fresh open event, chosen in the picker)
     wears the film face on that person's page, never the lock.
- **Assets requested from Will:** none.
- **Board ideas:** a profile door that answers its own tap (`useLinkStatus` on the links into `/u/<handle>`, the guest
  list's, the peek's, Connections'), the feedback a route skeleton would give `/u/[slug]` without a dead handle's flash.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - Follow says its state once on ("Following"); Block names its act in both states ("Block", "Unblock") and carries no
    pressed state, so Account's Connections rows read "Following" (was "Unfollow") and "Unblock".
  - No success toast on any face (the menu's "Blocked Maya.", Connections' "Unfollowed Maya." are gone): the control,
    or the list a row leaves, shows the result.
  - A Connections row still leaves its list in the same round trip rather than staying to undo in place.
  - The invitation: "Choose what shows" over "Nothing shows until you finish." (it read "Set up your page" twice).
  - The picker's line: "Can't show: the album isn't public", the tile still lifted, since the choice stays hers.
  - The all-video face is lucide `Film` on the gallery ground, glyph only, as the photo and lock faces are.
  - At a phone the profile menu hangs from its trigger's start; Account's skeleton draws three cards, the welcome's the
    name step.
- **Look at first:** `/design/library/relation-toggle` (press each); then `_scratch/menu-before-375x812.png` against
  `menu-after-375x812.png`; then the first Question.
