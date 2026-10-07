---
track: presence-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "3569b33b"            # the launch-prep SHA the branch was cut from
board: presence
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/presence/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - docs/systems/profiles-social.md
  - docs/systems/guest-flow.md
  - src/lib/avatar/gradient.ts
---

# lp/presence-r1

**Goal.** Board presence r1, desk 6: the guest row (her party's faces, the newest ringed in light) and the hashvatar wherever they earn a place, in Aperture, inside the guest rules for who sees whose face.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen); nothing depends on a timeline; never dev-tool-ish; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

**The vision you draw in (brand r2, `docs/reviews/brand.json` round 2: take = aperture; its board `src/app/(dev)/design/sandbox/brand/`, the Aperture take's deck in `afterglow/`):** Afterglow's light, never paint, colour from the photographs, then the event's seed, then the house; drawn only as a Ring (round the Add, and the icon), a Seam (where a photograph or a section ends) or a Bloom (behind a screen's one live subject), one to a screen, still until something happens; a status a point and its word. Aperture's answer to paper: the light never touches a light page; it lives in pieces of the room the page holds (the shutter's puck, one lit plate a screen, the foot's slab), as bright as in the room, with Ink's printed rule where paper meets a photograph; the house ember where there is no photograph and no seed; production's gallery white. brand-marks r1 and signature r1 are on the desk (the marks, tokens and status set; where the light lives in the app): draw on today's tokens and never ask what they ask.

**This board's question (the round-15 plan's presence r1):** Will loved event-header's old `faces` option, the avatar row with the newest ringed in light ("love it… explore ways to include it anywhere"), with transitions.dev's avatar-group hover (`.agents/skills/transitions-dev/11-avatar-group-hover.md`). Draw the guest row wherever it earns a place, and the hashvatar (`src/lib/avatar/gradient.ts`) as the atmosphere of screens without media, in Aperture's palette. Privacy is the frame: who sees whose face follows the guest rules in the app (`docs/systems/profiles-social.md`, `guest-flow.md`); on the marketing site fixtures only, never a real face or name; draw from what the product holds; "who's here now" is a Question in your Handoff with its Realtime cost, never assumed.

**Never asked here:** the Guests room's person rows and the person's card (a guests-room board after host-moments-wiring), the marks and tokens (brand-marks r1), where the light lives (signature r1).

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/presence/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `presence`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Who is here now (the brief's question, with its Realtime cost).** Should a face ever mean "has the album open right
  now"? It would be Supabase Realtime Presence on the album's own broadcast channel (`gallery:<qr_token>`, the
  doorbell's): each visible tab tracks itself, and every join and leave reaches every open tab, billed as one message
  plus one a listener ($2.50 a million past Pro's 5M a cycle, the spend cap off; the 500 peak connections are the
  doorbell's own, `docs/PRICING.md`). A hidden tab already leaves its channel (album-calm), so each tab switch is a
  leave and a join: a 100-guest wedding with about 40 tabs open and 20 switches each is about 0.2M messages (about
  $0.50), 300 guests with about 150 open about 1.8M (about $4.50); it grows with guests times open tabs. It also
  publishes something new, who is watching, which no guest rule consents to (a guest is listed only by an upload).
  Recommended: no; the ring marks who added last, read from the album's own photographs at no new read (the board's
  carried call `here-now`); a host's opt-in after launch if anyone asks. Built that way: no presence anywhere.
- **Scope: five asks, the colour first.** colour (asked first: every other frame wears it), album, hover (staged after
  album), hub, atmosphere. How the newest is ringed is carried, not asked (taken: lands; overrule: the white ring held
  a quarter hour, as he first loved it): the creative director's pass found Aperture's "still until something happens"
  already decides it, and a held ring and a landing differ in time, which stills cannot show. The marketing site's row
  waits for the marketing round (carried `marketing`). Recommended and built.
- **The atmosphere's home.** The creative director advised moving `atmosphere` to signature r2 (it is light, not faces,
  and a party's seed means something only if signature's `create` lights her code in it). Kept here, last, because the
  brief asks for the hashvatar as the light of screens without media, and Will answers signature (desk place 8) just
  before this board (10). Recommended: keep it here; if he picks anything but `dark` at signature's `create`, the
  house is the honest answer. Built that way.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte, and nothing the board met contradicted a system doc.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Before launch · Marketing and content: the guest row on the marketing site, from fixtures only (ASSETS row 41's
  portraits where a face needs a photograph), drawn in the marketing round (presence r1's carried `marketing`).
- Upcoming · The lab and the kit: at 375, once an option is picked, a step's dock wraps "Not clear to me" onto a row of
  its own under the note field (presence r1's creative director, seen on every board).

## Handoff (replaces the chat report)

- Commits on `lp/presence-r1`, pushed: `ea3d5515d` (the first draw), `8b3713c42` (the ring's sheet apart, so a helper
  per question could draw in parallel), `cfc3eaa60` (each question drawn to its best by a helper: album and pointer,
  ring, colour, hub and seed), `c98b5d178` (the creative director's refinement); this manifest's commit is the head.
  No sync: launch-prep moved (guests-room r1, create-wizard r5, crumbs-87, records) but none of this lane's reads
  changed and the lane touches one folder; the `GuestList` the `foot` option draws gained an optional `blockedIds`,
  unused here.
- Gates on `c98b5d178`, each on its own exit code (logs in `../partyreel-wt/_scratch/presence-r1/`): `pnpm typecheck` 0
  (`typecheck.log`), `pnpm lint` 0 (`lint.log`), the board's own tests `registry.test.ts` 0 (48 passed,
  `registry.log`), `pnpm test:rules` 0 (85 files, 1475 tests, `test-rules.log`), `pnpm lab:smoke --base
  http://localhost:3134` 0 (7 checks, 0 failing; the board 909 words of 1200, `lab-smoke.log`), `pnpm lab:demo --board
  presence --base http://localhost:3134` 0 (5 steps, 0 failing, every option drawn at 1440 by 900 and 375 by 812,
  `lab-demo.log`; hover's comb and settled draw one still picture, by design: they differ in motion, read moving). A
  board's light gate (no full test run, no build).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/presence/` (16 files)
  + this file.
- colour (first): how a face with no photograph is coloured, everywhere (one colour a person): today's wheel, one warm
  arc (wine through coral to pale apricot, never olive, a quarter less chroma), or lit (recommended: her hue as light
  falling across a disc of the room, deeper and quieter than paint, the same on a photograph and on paper); drawn as the
  row closer, on the cover, in the bar on paper, all 38 as the list opens them, and Priya's face at 80px.
- album: where her party's faces stand on a guest's album: today's list at the album's end (production's `GuestList`),
  under the cover's byline (recommended: the newest faces, the newest ringed, "38 guests"; also drawn on a bright
  photograph and at the door, where the count stands alone, the privacy frame), or beside the album's count in its bar.
- hover (after album): how the row answers a pointer at a desk: still (today), transitions.dev's comb as published
  (recommended: the face lifts to the front, its neighbours less, springing back past rest, and "38 guests" turns to its
  name), or the comb settled (no overshoot, the same name); three loupes at twice the size, one playing a pointer's walk.
- hub: where Maya's guests' faces stand on her hub: today's people glyph, the cover's line (recommended: her newest faces
  at the line's own height, then the count, beside her strip), or the Guests door's glyph (three faces, the waiting count
  on their shoulder); drawn closer (the line, the doors at rest and folded) and whole.
- atmosphere: what lights a new party's cover before its first photograph: the house ember (today), the party's seed as
  a lamp (recommended: its light pooled behind the name on a guest's album; on the hub the room dark and the Seam alone
  in the seed's light), or the seed's colour edge to edge; the seed follows the colour answer.
- For the wiring lane (drawn, not built): the row's faces, newest first, can come from the album's own newest
  photographs' credits (`AlbumLinkTuple`'s `who` faces already ride the wire: a typed name's row colour, an account's
  face, a blocked person's plain disc, the host's flag), so the row costs no new read and keeps the guest rules by
  construction; the count stays the one count (`getEventGuests`). `AvatarGroup` cannot carry a ring outside a face
  (the face clips): the row's slot (`row.tsx`) is the shape a wiring would give it.
- Assets requested from Will: none new (ASSETS row 41's twenty guest portraits, requested, would replace a few of this
  board's seeded faces by name).
- Board ideas: presence r2, the row where this round did not reach (a photograph's credit in the viewer, the reel's
  closing credits, the host's dashboard stage on the party's day) · a person's seed as the light of her own page before
  her first photograph, after account-moments r2's invitation.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule (the board's carried calls): `newest` (lands, over the held white ring), `order` (the newest
  first, six at a phone and eight at a desk), `here-now` (added last, never who is watching), `empty` (nothing until the
  first face; five empty seats on her hub as the overrule), `marketing` (waits for its round, fixtures only); and the
  lane's: `atmosphere` kept here rather than at signature r2, and hover's recommendation the comb as published (the
  creative director's), the settled comb its overrule.
- Look at first: the colour step's crowd frame (`?session=presence.colour`, lit beside the wheel at all 38), then the
  album's cover option at a phone (`?session=presence.album`, with the door's count-alone frame), then the hover's
  playing loupe (`?session=presence.hover&album=cover`).
