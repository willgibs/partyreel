---
track: demo-framing
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7550bd0d"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/cinema-hero-card.tsx
  - src/lib/demo.ts
  - docs/systems/marketing-content.md
---

# lp/demo-framing

**Goal.** Draw `demo-framing` round 1: the story the demo tells, on the home hero's link card and the demo album it opens, so Will lands the framing before the demo event is made or renamed to match.

## The brief

**His note** (2026-09-29): "I don't love our working title of 'Mia & Theo', it feels kind of weird for a demo name. Before we create a dedicated demo event for the home hero (or even just modify our current demo), let's land on the best framing of it."

**Where it stands:**
- The home hero's object is the link card (hero-card r2's `guests` pick, `sections/home/cinema-hero-card.tsx`): the address `partyreel.com/e/<slug>` with the domain faint and the slug in ink, its code, four prints each credited to a guest's face, and a count of the rest (34 guests). Its content is one constant, `OBJECT_EVENT` and `OBJECT_PRINTS` in `hero-stream.ts`: the slug `mia-and-theo` and a wedding's four photographs, one a toast marked as a video.
- Pressing it opens the demo (the modal at a desk, a new tab on a phone). The demo is one event, "Partyreel Demo" at `/e/partyreel-demo`, opened by its token (`src/lib/demo.ts`), with 9 photographs and 3 named guests. It matches neither the card's wedding nor its 34.
- The card's printed address must open the event the card opens: a homepage address that 404s, or a slug any host could claim, is not acceptable. The demo event takes the chosen slug, which the unique index then holds for good.
- Every image is generated in one Higgsfield month before launch, so the framing names what ASSETS rows 33 (the card's four photographs) and 34 (its four guest faces) and the demo album will show.

**Round one's asks**, each with a recommended answer, drawn on the card:
1. `story`: what party the demo is. The widest good set:
   - a wedding (the event that buys an Event Pass);
   - a milestone birthday;
   - a weekend away with friends;
   - a family reunion;
   - a work party;
   - any better idea you find.

   Draw each on the card with its slug and its four prints, and as the head of the demo album it opens.
2. `names`, after `story`: who the demo names.
   - couples' first names (today's, the kind he flagged);
   - the host's own voice ("Our wedding");
   - an occasion with no names ("Saturday at the lake");
   - a family name ("The Parkers' 40th");
   - a playful or brand-forward line, if one earns its place.
3. `demo`: which event the card opens.
   - one demo everywhere: today's, renamed to the story and its album re-seeded to match;
   - a dedicated hero event with its own album, while the general demo stays;
   - the card as an illustration whose press opens the general demo, so the printed address must then be the demo's own.
4. Anything else the framing must settle (the chip's count, the guests' names or initials, whether the card carries a date) as carried calls.

**Draw it where it lives:**
- The card at 1440 and 375 on the hero's own stage. Draw a mock of `LinkCard` over its real pieces, labelled as a mock, since the production card reads one constant.
- Beside each story, the demo album's head: its title and its first row.
- Use stand-in photographs from the fixtures or the band's stills, each named as a stand-in.

**A new board:** register after `disposable-mode` in `registry.ts`, `boards.ts`, and `touchpoints.ts`' `RULINGS` and `DESK_ORDER` (a new board's named exceptions). `disposable-mode` is a board that stays this batch, whereas `export-flow`, `help-center` and `emails` retire with their wiring.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- `story`, on the board: what party is the demo? Recommended: a milestone birthday, a 30th (the party nearly
  everyone throws, big enough to need every guest's photos; the band and /events/weddings keep weddings in view).
  Considered and left out as narrower versions of the five or dated: a summer party, a surprise party, New Year's
  Eve, an engagement party, a festival weekend, the brand's own launch party.
- `names`, on the board after `story`: what is it called? Recommended: the occasion, no names (at the 30th "The big
  3-0" at `the-big-30`, its host named once in the byline and the welcome).
- `demo`, on the board: which event does the card open? Recommended: one demo, renamed to the party (today's event
  keeps its token and takes the party's name, slug and album; every door then opens the party the card shows).
- Not on the board, the gap until the wiring: the home prints `partyreel.com/e/mia-and-theo`, and no event holds it
  (the live `events.custom_slug` column, read 2026-09-29, holds only `partyreel-demo` and `testing`), so the home's one
  printed address 404s and any account on any plan could claim it. Recommended: leave it to the wiring (no real users
  before launch); a stopgap would be one write of the demo's slug to `mia-and-theo`, which frees `partyreel-demo`.
- Not on the board, the old address at the rename: `/e/partyreel-demo` frees the moment the demo takes the party's
  slug, and `RESERVED_SLUGS` (and `set_event_slug`'s `= any(array[…])`) matches whole slugs only. Recommended: reserve
  `partyreel-demo` in the same wiring (the list and a migration restating `set_event_slug`); the family is Deferred.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte; the demo's and the card's facts move with the wiring.

## Deferred (ROADMAP one-liners, bucket named)

- Security: `RESERVED_SLUGS` and `set_event_slug` refuse whole slugs only, so `partyreel-demo` (free once the demo is
  renamed), `partyreel-support` or `official-partyreel` are open to any account on any plan; refusing any slug that
  contains `partyreel` in both (the parity `tiers-sql.test.ts` holds) closes the family (from `demo-framing`).

## Handoff (replaces the chat report)

- Work commits `6f01702e` (the board) and `1958c61f` (each stand-in named, the doors' frame titled); sync `e10cfe38`
  (merge of origin/launch-prep at `f6bacfda`: wave B's retirements beside this board's lines, and help-wiring's lines in
  `marketing-content.md`, one of the reads, none touching the demo or the card; `git merge-tree` clean). Pushed.
- Gates on the synced tree `e10cfe38`, each on its own exit code (logs in `../partyreel-wt/_scratch/demo-framing/`):
  `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0 with 4 warnings, none in a touched file (`gate-lint.log`:
  `review-session.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`); `pnpm test` 0, 551 files, 6271 tests
  (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base
  http://localhost:3132` 0, 197 checks, demo-framing 652 words of 1200 (`gate-smoke.log`); `pnpm lab:demo --board
  demo-framing --base http://localhost:3132` 0: story ok (5 options, up to 2.16%), names ok (5, 0.29%), demo ok (3,
  0.54%) (`gate-demo.log`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the seven files under
  `src/app/(dev)/design/sandbox/demo-framing/` + `sandbox/registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts`
  (the brief's named exceptions: a new board's lines, directly after `disposable-mode` in each list) + this file.
- `story`: five parties on the home's real first screen (`hero.tsx`: production's header, lamp, band and block from
  `hero-stream.ts`' own exports, the object slot holding `MockLinkCard`, LinkCard's pieces with its content as props)
  at 1440 and 375, beside the demo album's first screen at 375 (`album.tsx`: the Demo mark, the title, the byline,
  the stats, the host's line, the actions, the reel tile, the first rows laid by `layoutRows`); each print's stand-in
  named under the frames with what the month makes in its place.
- The wedding is today's card: its prints and slug read from `OBJECT_PRINTS` and `OBJECT_EVENT`, and a pixel diff of
  its card against production's first screen at 1440 and 375 differs only inside the photographs' resampling
  (`_scratch/demo-framing/shots/card-compare.png`).
- `names`: five kinds drawn in the picked party at 375: the card, its caption reading whether the slug sets whole in
  its column (`ninas-lake-weekend` is cut on a phone, 136 px of type in 120); the demo's welcome (`RoleStep` quoted in
  the door's lit sheet, where "You're a guest at My 30th" stops reading); the album's head; the tab's line under them.
- `demo`: three roads at 375: the card, what pressing it opens, every other door; the hero event's card carries its
  own code (the short `/demo` door stays the general demo's), and the pictured card prints `partyreel-demo` and opens
  today's album as it stands (read off the live row: Will's account, July 9, 2026, 9 from 3 guests).
- Six carried calls on the board: `count`, `guests`, `date`, `host`, `line`, `band`.
- Verified in headless Chrome over CDP (the scripts and captures in `_scratch/demo-framing/`): 1440 and 375, light and
  dark, reduced motion (the band at rest) and motion allowed (only the shown option's band runs, a hidden one holds
  still: `motion.mjs`); malformed state (`?story=bogus&names=<script>&demo=../..`) falls back to today; no console
  error or warning on the board page or its three steps (`console.mjs`).
- Assets requested from Will (each respecifies a parked or open row once he picks; the board lists the four for every
  party):
  - ASSETS row 33 for the picked party · four photographs of its card, at the 30th: 30 in balloons over the door; the
    cake, thirty candles lit; the dance floor at midnight; the toast, filmed (a 4 to 6 s clip with its poster) · 4:5
    masters at 960x1200, one grade, legible at 68 px wide, none of the band's twelve · replaces party-balloons,
    reception-table, party-dj and wedding-toast on the card (today `OBJECT_PRINTS`' wedding-petals, wedding-rings,
    reception-table, wedding-toast).
  - ASSETS row 34 for the picked party · its four guests' portraits (at the 30th: Ruby, Jules, Ali, Dev) · 256x256
    squares, one grade, a face legible at 19 px (26 at a desk) · replaces `OBJECT_PRINTS`' seeded avatars.
  - ASSETS row 5, the demo album · about 48 photographs and 4 clips of the one party, the card's four among them,
    credited to its 24 named guests and its host (the carried call `count`: +20 on the card) · photographs 1600 px on
    the long edge in a phone's shapes (4:5, 1:1, 3:2), clips H.264 under 20 s with posters, one grade · replaces the
    seed's nine test fixtures (`scripts/seed-demo-event.mjs <folder> --name … --guests …`).
- Board ideas: a party per event type: every demo door opens the one demo whatever its page (the /events objects, the
  footer, the nav's pane), so /events/conferences opens a 30th; each type page opening a party of its own kind is a
  board once the one demo lands.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none from this lane. The pick's wiring (orchestrator.md,
  wave B) needs: the demo event renamed and re-slugged (the unique index then holds the slug), a demo host account of
  its own if `host` stands, the album re-seeded, `OBJECT_EVENT` and `OBJECT_PRINTS` to match (one home for the slug in
  `lib/demo.ts` that the card prints and the seed sets), `partyreel-demo` reserved; no env change under `one` (the
  token stays), a second demo token and door under `hero`.
- Calls his to overrule, one line each:
  - `count`: the chip is the album's own guests less the four (24 at the 30th, +20), and the seed makes it true.
  - `guests`: faces only, each a guest the album credits; the initial stands in until row 34 lands.
  - `date`: none on the card or the byline, so the demo never ages; today's July 9, 2026 goes.
  - `host`: the party's own host on a demo account of its own, not Will's.
  - `line`: the host's own words under the title; the Demo mark and the welcome say it is a demo.
  - `band`: the band stays every kind of party; the card is the one party you open.
- Look at first: the gap until the wiring (the home's printed address, which nobody holds), then the `names` step,
  where the welcome's sentence and the card's measured slug decide more than taste.
