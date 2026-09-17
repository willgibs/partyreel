---
track: palette-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a6afec3b"
board: palette
owns:
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/sandbox/palette/
reads:
  - src/app/(dev)/design/sandbox/registry.ts
  - src/components/dev/glow-contrast.ts
  - docs/reviews/palette.json
  - docs/design/rulings.md
---

# lp/palette-wiring

**Goal.** The wiring round of the palette: Graphite becomes the site's palette and the board retires.
Will's answers, verbatim (`docs/reviews/palette.json` round 8): `palette=graphite`; `accent=none`;
`card=declared` with "If we ever need to design that glass style over photos, we can design that
custom."; `faint=in`. What each lands as is on the board's own spec and is the brief: the Graphite
card ("A 0.105 room, a 0.995 page and Apple's cool greys between them, in globals.css and
marketing.css"), both modes, the marketing site and the app: the grey ramp and every surface token;
`accent=none` keeps `--brand` the alias for `--primary` and no hue lands; `card=declared` sets
`--card` in `.dark` to the opaque value Graphite declares, so the system's one translucent surface
retires; `faint=in` adds `--faint` in globals.css and `--color-faint` in theme.css and moves the
hand-faded text sites onto it (the board counted 37; `git grep` them at boot, list every file you move
under `owns` here, one line each, and never a file under `src/components/marketing/sections/home/`,
which is the hero lane's this round: name any site there under Deferred instead). The board retires in
the same round: everything under `src/app/(dev)/design/sandbox/palette/` goes, and the board's
registration lines in `src/app/(dev)/design/sandbox/registry.ts` with it (the one exception to the
lane check; list it there, the migration wave's precedent). Not in this round: a new palette, a
marketing page redesigned around the new greys, the light board's lamps on paper (ruled off).

**What is settled, so build rather than ask.**
- The Library's tokens page reads the stylesheets, so it follows on its own; the `new` badge on the
  palette's Library mark is the Orchestrator's at the merge (propose the entry id in Handoff).
- `glow-contrast.test.ts` and every token parity test stay green; a test that pins a grey value the
  ruling changed is retuned, never deleted (a contract guards function, not a look).
- The dark room at 0.105 is the ruled cinema deepening's neighbour (`data-mkt-skin="cinema"` in
  marketing.css reads the room): keep the two in the relation the Graphite card drew.
- `touchpoints.ts`, `docs/reviews/palette.json`, `docs/ASSETS.md` and the CHANGELOG are the
  Orchestrator's at the merge.

**Binds.** The bible (`/design/library/rules`), the contracts of every component under a path you
own, and the policies; everything else is precedent. Will's rulings on the palette in
`docs/design/rulings.md` (the cool greys asked for by name; round 8's four answers).

**Verify on.** Every ground by eye at 1440 and 375: the marketing cinema pages and the paper chapters,
the app's dark and light modes (the dashboard, an event, a gallery), the footer, a menu and a dialog
(the opaque card), the faint sites before and after; `pnpm lab:smoke` (every other board still renders
on the new tokens); the gate; after the merge the Orchestrator checks the alias live.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
