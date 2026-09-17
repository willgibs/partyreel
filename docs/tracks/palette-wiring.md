---
track: palette-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a6afec3b"
board: palette
owns:
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/sandbox/palette/      # deleted: the board retires with its ruling
  # the 30 files whose hand-faded second grey moved onto --faint (40 sites)
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/blog/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/blog/blog-list.tsx
  - src/app/(marketing)/(cinema)/careers/page.tsx
  - src/app/(marketing)/(cinema)/help/page.tsx
  - src/app/(marketing)/(paper)/contact/page.tsx
  - src/components/app/host-upload.tsx
  - src/components/auth/email-sign-in.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/ghost-grid.tsx
  - src/components/lab/item-verdict.tsx
  - src/components/lab/step.tsx
  - src/components/marketing/legal/legal-blocks.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/matrix-mark.tsx
  - src/components/marketing/press/press-sheet.tsx
  - src/components/marketing/sections/careers/role-listings.tsx
  - src/components/marketing/sections/events/type-directory.tsx
  - src/components/marketing/sections/features/album/getting-in-stage.tsx
  - src/components/marketing/sections/features/album/how-much-fits.tsx
  - src/components/marketing/sections/features/album/quality-section.tsx
  - src/components/marketing/sections/features/album/stays-section.tsx
  - src/components/marketing/sections/features/shared/ghost-grid.tsx
  - src/components/marketing/sections/pricing/calculator.tsx
  - src/components/marketing/sections/pricing/pass-card.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/components/marketing/sections/pricing/unlock-grid.tsx
  - src/components/reel/style-rail.tsx
  - src/components/shared/route-error.tsx
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
custom."; `faint=in`. What each lands as is on the board's own spec and was the brief: the Graphite
card ("A 0.105 room, a 0.995 page and Apple's cool greys between them, in globals.css and
marketing.css"), both modes, the marketing site and the app: the grey ramp and every surface token;
`accent=none` keeps `--brand` the alias for `--primary` and no hue lands; `card=declared` sets
`--card` in `.dark` to the opaque value Graphite declares, so the system's one translucent surface
retires; `faint=in` adds `--faint` in globals.css and `--color-faint` in theme.css and moves the
hand-faded text sites onto it. The board retires in the same round.

**What was settled, so it was built rather than asked.**
- The Library's tokens page reads the stylesheets, so a retuned VALUE follows on its own; a NEW
  token does not, because that page reads a hardcoded list of token NAMES. `--faint` was added to
  its Ink group. Proposed Library entry id for the `new` badge at the merge: `foundations#ink`.
- `glow-contrast.test.ts` and the token parity tests stay green; the three tests a changed grey
  reached were retuned, never deleted.
- The dark room at 0.105 is the cinema deepening's neighbour: the Graphite card draws them as ONE
  value, so the override in marketing.css is deleted and the room IS cinema.
- `docs/reviews/palette.json`, `docs/ASSETS.md` and the CHANGELOG are the Orchestrator's at the
  merge. `touchpoints.ts` was released to this lane for the palette's own entry (see the lane check).

**Binds.** The bible (`/design/library/rules`), the contracts of every component under a path owned,
and the policies. Will's rulings on the palette in `docs/design/rulings.md` (the cool greys asked for
by name; round 8's four answers).

**Verified on.** Every ground by eye at 1440 and 375 in the browser pane against `PORT=3132 pnpm dev`:
the cinema home and its hero, the pricing page's paper chapter, `/contact`, the footer slab on a
paper page (read off `getComputedStyle`, not assumed), the app's light mode (the dashboard specimen)
and dark mode (the Library's Foundations swatches, the floating-surfaces board), a menu (the
floating-surfaces menus on the room, the marketing mobile menu at 375), a dialog (the guest
lightbox), and the faint sites on both a white card and an ink card. `pnpm lab:smoke`: every other
board still renders on the new tokens.

## Questions (what the goal left open; a recommended answer each)

- **Bible 1 still says `status: "under exploration: palette"` (`rules/bible.ts:83`), and the
  exploration is over.** It is one of the files this lane may not touch, and it now costs a route:
  the rule page resolves a status's track against the STANDING boards, so with the palette retired
  it falls through to "read its manifest at docs/tracks/palette.md", which was deleted at the
  board's own merge, and `pnpm lab:smoke` reports `/design/lab/tracks/palette` 404.
  **Recommended:** delete the `status` line on bible 1 (`BibleStatus` documents "Absent reads as
  ruled"), and retune its `why`, which still says "The palette exploration writes the ramp and the
  accent" in the present tense. One line plus a clause, and the smoke goes green. Carried on
  without it, because the bible is Will's.
- **The rule page will 404 again the next time a ruled board retires.**
  `library/rules/[id]/page.tsx` links `docs/tracks/<id>.md` for any status whose track is not a
  standing board, without checking that the manifest exists. **Recommended:** a follow-up makes that
  branch check the track states the desk already reads. Not done here, because it would paper over
  the stale bible line above, which is the real finding this round surfaced.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, four facts refined where they live: the identity section's ramp
  (four registers, hue 286 as Apple's grey rather than their blue at 258, the third text step with
  its measured ratios); bible 1's paragraph (from "under exploration" to what the ruling fixed, and
  that the accent stayed off); the always-dark paragraph (the well at 0.065 split from the slab at
  0.165, and that `bg-gallery` on a leaf now paints two registers too deep); the elevation contract
  (the five-step dark ladder, and the translucent-card note replaced by the ruling that the system
  has no translucent surface at all).
- `docs/systems/marketing-content.md`: the browser-chrome hex follows the room (`#040405`).

## Deferred (ROADMAP one-liners, bucket named)

- **Design / Now:** the ~35 `bg-muted/N` sites become sections carrying `.surface-mat`. The class
  ships declared and unworn; the board's own spec calls the sweep mechanical rather than part of the
  ruling.
- **Design / Next:** the admin chart ramp (`--chart-1..5`, both modes) is still chroma 0 beside cool
  greys. A cast on five greys nobody ruled would be a value invented in a wiring round.
- **Design / Next:** an a11y pass on `--faint`. It measures 3.21:1 on the page and 2.92:1 on the
  mat; a few of the 40 sites it inherited read closer to body copy than to a caption.
- **Lab / Next:** ten lab boards under `(dev)` still fade `text-muted-foreground/N` by hand. They
  are other lanes' this round; `git grep 'text-muted-foreground/'` finds them.
- Nothing under `src/components/marketing/sections/home/` was touched: `git grep` found no
  hand-faded site there, so the hero lane is owed nothing.

## Handoff (replaces the chat report)

- Head `<sha>`, pushed; synced with `launch-prep` at `78a54014` (it had moved by one commit, the
  same rules-artifact regeneration this lane had already made; merged clean at `7949eebc`).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 9 pre-existing warnings), test ok
  (2,117; down from 2,176 because `registers.test.ts` retired with its board), build ok (258 static
  pages). `pnpm lab:smoke`: 246 checks, 3 failing, all three explained: the two glow boards over the
  reading budget (deliberate, STATUS says so) and `/design/lab/tracks/palette` 404, which is the
  bible-1 line under Questions.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 67 files. Owned paths and this file,
  plus these exceptions:
  - `src/app/(dev)/design/touchpoints.ts`, `(shell)/lab/boards.ts`, `sandbox/registry.ts` — the
    board's three registration lines, released to this lane for the palette's own entry (the
    migration wave's precedent). The retirement is ATOMIC: `BOARD_COMPONENTS` is
    `Record<SandboxId, BoardEntry>` and `SandboxId` lives in touchpoints, so no two of the four
    edits can be split without a red tree or a 404 the smoke catches.
  - `src/app/(dev)/design/touchpoints.test.ts` — eleven standing boards, not twelve.
  - `src/app/(dev)/design/_data/links.test.ts`, `_data/catalog.test.ts` — two examples named the
    palette and both read the STANDING list (parseRef's URL form, the lab search index); each now
    names a board that stands. The `board:palette` case stays, because that form never validated.
  - `src/app/(dev)/design/rules/rules.generated.json`, `docs/design/library.md` — generated; the
    merge regenerates them. They carry two things: the 12 to 11 standing-board count, and the
    artifact drift `a6afec3b` left (fixed on `launch-prep` at `78a54014` in parallel, merged clean).
  - `src/app/layout.tsx`, `not-found.tsx`, `(marketing)/(cinema)/layout.tsx`, `(paper)/layout.tsx` —
    the four `themeColor` hexes ARE the room and the page in sRGB, and `<meta name="theme-color">`
    is parsed before any stylesheet, so they cannot be a var().
  - `(marketing)/(cinema)/about/page.tsx`, `marketing/legal/legal-document.tsx` — one stale `#040404`
    in a comment each.
  - `src/components/lab/stage.tsx` — the lab stage stands outside the marketing wrappers, so its
    cinema ground is a literal copy of the room.
  - `src/components/marketing/chrome/marketing-footer.tsx` + `footer-contract.test.ts` — the slab
    stopped being the media well, so the header's five measured ratios were wrong and the contract
    pinned `var(--gallery-*)` on ten lines, which is pinning a look. The contract now pins what it
    is for: every token the leaf needs is re-declared on the class, none derived from the well.
  - `src/components/dev/glow-contrast.test.ts`, `(marketing)/marketing-css-policy.test.ts` — grey
    values a ruling changed, retuned, never deleted.
  - `src/app/(dev)/design/(shell)/library/foundations/page.tsx` — one line, so the new token has a
    swatch.
  - `docs/systems/design-system.md`, `docs/systems/marketing-content.md` — see System-doc edits.
- The items, one line each:
  - `palette=graphite`: shipped. The ramp and every surface token in both modes, the marketing site
    and the app; it lands as the Library's Foundations page, which renders it from the live vars.
  - `accent=none`: shipped as no change of value and one of record. `--brand` stays the alias for
    `--primary`, no hue landed anywhere, and the paste printed no accent block.
  - `card=declared`: shipped. `--card` in `.dark` is opaque; the system's one translucent surface is
    gone, and design-system.md says so where it used to describe the glass.
  - `faint=in`: shipped. `--faint` in four registers, `--color-faint` in theme.css, 40 sites off
    their five alphas, and a swatch in the Library.
  - the board: retired. The twelve palettes, the registers, the catalog, the specimens and the paste
    leave `sandbox/`; the RULINGS row stays as the record (`ruled: 2026-09-17`,
    `shipped: Graphite`).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: **bible 1's `status` line.** It is the only thing between this tree and a green lab
  smoke, it is one deletion, and it is the one file the lane could not touch.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). Graphite became the site's palette in both modes:
a Pearl page at 0.995 with a card the same white, one Graphite room at 0.105 for the app and every
cinema chapter, Apple's cool greys at hue 286 between them, and no accent anywhere. The dark card
went opaque, so the system's one translucent surface retired by ruling rather than by accident, and
the cinema deepening in marketing.css went with it because the room is cinema now. `--faint` landed
as the third text step in all four registers and took the 40 hand-faded sites off their five alphas.
The one unforeseen split: the media well dropped to 0.065 and the footer slab lifted to 0.165, so
`.surface-ink` writes its values out instead of deriving them. The board retired into its ruling.
