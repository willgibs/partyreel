---
track: guests-room-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2dd9fe79"            # the launch-prep SHA the branch was cut from
board: guests-room
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guests-room/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - src/app/(app)/dashboard/[eventId]/guests/guests-room.tsx
  - src/components/social/guest-peek.tsx
  - src/components/app/event-blocks/blocked-section.tsx
---

# lp/guests-room-r1

**Goal.** Board guests-room r1: the hub's Guests room and a person's card, polished from Will's note: how each person stands (at the door, in, blocked, invited) and what can be done for them, beautiful and never crowded.

## The brief

**The round's direction (Will, standing):** attention earned, never yelled (PRD.md: the one thing that needs her may draw the eye, beautiful and inviting, while nothing crowds a screen); delight where it costs nothing in clarity; never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk. A signed-in look runs on your own port through `usher/kit/redteam/signin.mjs` (testing-verification.md).

**From Will's note on host-moments r1's Let in (2026-10-06):** "The UI design of how we present this (and guest card items in general) could definitely be polished." Production now wires his picks (host-moments-wiring): Let in is one press for a declined newcomer, the decline's toast keys Let in, Blocked keeps Let back in with its confirm for someone who was in; account-moments-wiring made names in Account's Connections open `GuestPeek`, the person's card, which the Guests room's names also open. Draw the Guests room whole on production as it is now: its head and At the door, the people in, Blocked, the invite list where it is the door, and a person's card from a name, at 375 and 1440, in the room and on paper.

**Asks you shape (each one decision, real contenders):** how a person stands in a row (what a row shows and how its one act reads, at the door, in and blocked), and the person's card (what it carries and how its acts are offered) are the likely two; ask what the drawing shows is open, never what is settled (Let in is one press; a decline is a block; Follow and Block rules are profiles-social.md's).

**Nearest standing asks (ask nothing they ask):** account-moments r2 (what a follow says when it lands, the invitation on her page); presence (the guest row of faces on the hub, not yet cut: never the Guests room's list); signature r1 (where the light lives).

**The method:** a helper per option, one fresh-eyes pass, a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/guests-room/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `guests-room`, its title, `surface`, `desk: 42` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **How should each person read in the Guests room (the board's `rows`)?** Recommended: `list`, one calm row for
  everyone: face, name, one line of how they stand and its act on the same line at 375; the door's count in the tally,
  Let in the room's one solid key, Decline a quiet ✕ beside it; the guests ordered by photos (eight, then a page of
  24); Invited's not-yet first, the joined folded under their faces; Blocked an unlit card. The address stays in sight,
  which guest-flow.md's "the host sees a confirmed guest's address" leans on. Drawn beside it: `faces` (the party as
  faces throughout) and `mixed` (rows where she acts, the guests as a sheet of faces). Overrule: `mixed`.
- **What should open when she presses a name (`card`, staged after `rows`)?** Recommended: `standing`, the photos
  card plus how they stand tonight and its act, opened from every name, so the door's Decline leaves its row for the
  card (Will's Connections note: names open the card "for additional actions beyond the row action flip ... Don't
  want to overcrowd the row actions"). Overrule: `photos`, the popups r1 look built (who they are, four of their
  photos, Follow and their page), opened from the guests alone, Decline staying on the row.
- **Where does a person's card open at a desk?** Recommended: beside the room's panel, over the hub, its top at the
  name (the board's carried `card-beside`): under the name it covered the rows it belongs to.
- **In the calm list, who comes first among the guests?** Recommended: who added most (carried `guests-order`,
  ROADMAP's sort by upload count); production lists by name.
- **What heads the people who added photos?** Recommended: GUESTS and their count (carried `guests-head`); today they
  have no head.
- **For the wiring, whichever is picked:** the candidates need reads the list does not carry: a guest's approved photo
  count (list's column, the card's PHOTOS), four presigned photographs gated like the album (ROADMAP's look strip),
  the first approved upload's time (`standing`'s "In since"), an album view of one guest's photos (See all), and the
  room passing a viewer id and keeping the follow state (a Follow on a guest's card in the room; today none).

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; host-app.md's room and profiles-social.md's look change with the
  wiring of the picks)

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · The guest's album: an album tile shows no keyboard focus: its open button's `focus-halo halo-inset` is
  an inset shadow, painted under the button's own photograph (`shared/album-tile.tsx`); carry the halo on an overlay
  that wears `data-halo` while the button holds the keyboard's focus, as the guests-room board's strip `Tile` does
  (guests-room r1's photos helper, `/design/album-scale`).
- Upcoming · Profiles and social: production's look (`social/guest-peek.tsx`) sets the face inside the sheet's title,
  so a screen reader hears "P Priya Shah", and in a hand hangs its line and address under the face; one head grid
  with the face `aria-hidden` (the board's `card-parts.tsx`) is the fix any card pick's wiring carries.

## Handoff (replaces the chat report)

- Work commits `3f57930fa` (the board's first draw), `91f23af96` (each option refined by its own helper, then the
  fresh-eyes pass), `1b24fedd1` (the three calls carried), `c7260ac71` (today's guests retyped, the privacy guard),
  `10312acf7` (the empty stylesheet dropped); sync `19c165314` (a merge of origin/launch-prep at `6ad8473c7`: crumbs-87
  landed in two of this lane's reads, `guest-list.tsx`'s `blockedIds` and `guest-peek.tsx`'s note); then this
  manifest's commit, all pushed to `lp/guests-room-r1`. launch-prep has not moved since the sync.
- Gates on `10312acf7` (the synced tree), each its own exit code, logs in `../partyreel-wt/_scratch/guests-room-r1/gate-*.log`:
  `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); the board's own test (`vitest run
  src/app/(dev)/design/sandbox/registry.test.ts`) 0, 52 tests; `pnpm test:rules` 0, 85 files, 1473 tests;
  `pnpm lab:smoke --base http://localhost:3132` 0 (4 checks, 0 failing; the board 557 words of 1200);
  `pnpm lab:demo --board guests-room --base http://localhost:3132` 0 (2 steps, 0 failing: `rows` 4 options of 4
  frames, `card` 3 options of 4 frames, every one drawn and differing at a desk and a phone). `test:rules` first
  failed on `social.guest-identity.test.ts` (only the room's own file may hand `GuestList` an address or Block): the
  board's today had passed them; `c7260ac71` retypes the list instead, the guard untouched.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/guests-room/` (acts.ts,
  board.tsx, card-parts.tsx, card-photos.tsx, card-standing.tsx, card.tsx, chrome.tsx, fixtures.ts, knobs.ts,
  people.tsx, room-faces.tsx, room-list.tsx, room-mixed.tsx, scene.tsx, spec.ts, today-cards.tsx, today.tsx) + this
  file; no exceptions.
- `rows` (each person, in the room; recommended `list`): `today` (production's room, its parts production's own but
  the guests' list, retyped class for class: door rows with their keys under three lines, the guests one row of faces opening a second panel, every address with
  a remove, Blocked saying Let in twice); `list` (above); `faces` (the door as cards side by side, the guests a contact
  sheet of faces, the invites as empty seats whose remove is a press in, the blocked as quiet cards); `mixed` (the
  door, Invited and Blocked as `list`'s rows, the guests as `faces`' sheet, the two halves the other options' own
  sections). Four frames each: opened, the guests, the invite list, the foot; a press answers and writes nothing (an
  answered row leaves, the tally counts down).
- `card` (a person's card, after `rows`; recommended `standing`): `today` (production's `GuestPeek` as the room hands
  it: no Follow, Open full profile its loudest key, a door or Blocked name opening nothing); `photos` (who they are as
  one block, PHOTOS with its count and See all over four tiles, Follow and their page a quiet pair, Block last; door
  and Blocked names stay words); `standing` (the same card plus a light and its words for how they stand tonight, and
  that standing's act: Decline and Let in at the door with what a decline is, the way back in Blocked with where it
  takes them; the door's rows keep Let in alone). Four frames: Priya (a page, 24 photos), Aunt Rosa (a typed name), a
  door name, a blocked name; at a desk the card opens beside the panel.
- The method: a helper per option (list `a279ecc895bae5646`, faces `aae80a9a67d2d6207`, photos `a3a3bda1acd63833c`,
  standing `afb0ded36f2f26c34`), one fresh-eyes pass (`aa8d701e76c3afd85`). Its P1s and P2s all applied (the photos
  option's words matched to its drawing, a frame for the guests, the Connections quote whole, the door frames
  captioned, `list`'s act truthful; the `mixed` option drawn, the card beside the panel, presses that answer,
  `standing` taking Decline into the card, the folds paging, the two cards' shared parts aligned, one question per
  ask). Of its polish notes, two kept on purpose: `standing`'s door light stays the tally (a person waiting is the
  tally's own signal), and Chris's Let in is solid in his card (its one act) while quiet on the row; the seeded faces
  stay, the asset ask below.
- Assets requested from Will: `guest portraits · 12 square portraits, candid, warm party light, varied ages, 512px JPG
  · stand-ins for 12 of the 31 guests' avatar photos (the rest keep their seeded faces) · replaces the seeded initials
  on those guests in fixtures.ts`.
- Board ideas:
  - A guest let in who adds nothing is on no list (guest-flow.md's one definition), so after Let in she leaves the room
    until a photo lands: should the room hold "let in, nothing added yet"?
  - An album view of one guest's photos, which a card's See all needs: there is no filter by uploader (View's Yours is
    a guest's own).
  - presence r1 (running) and this board's sheet draw the same people as faces: one face size and caption rule for both.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the reads the candidates need are queries, under
  Questions).
- Calls his to overrule: `guests-order`, `card-beside`, `guests-head` (each drawn above the board's sections); in the
  options' own drawings, `list`'s Decline as a quiet ✕ (its costs say a block in a dismiss's shape), its hints as
  footnotes under each card, Blocked's time as the night's ("9:12 PM") rather than its date, and At the door's count in
  the tally in every candidate.
- Look at first: `rows` at her phone, `list` beside `mixed` on the guests frame; then `card=standing`'s door frame at
  her laptop (the card beside the panel, the row keeping Let in alone).
