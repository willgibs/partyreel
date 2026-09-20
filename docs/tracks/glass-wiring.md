---
track: glass-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c935f072"          # the launch-prep SHA the branch was cut from
board: glass           # retires at this lane's merge
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/masonry.tsx
  - src/components/shared/masonry.test.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox.test.tsx
  - src/components/shared/media-lightbox.lazy.tsx
  - src/components/shared/lit-edge-contract.test.ts
  - src/components/shared/play-badge.tsx
  - src/components/shared/backdrop/photo-section.css
  - src/components/app/media-grid.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/my-likes-gallery.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/likes/like-button.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/app/(dev)/design/sandbox/glass/
  - src/app/globals.css
  - src/lib/glass.ts
  - src/lib/glass.test.ts
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/glass.json
  - docs/design/rulings.md
  - src/components/ui/floating-layer.ts
  - src/components/ui/dialog.tsx
  - src/components/shared/action-tooltip.tsx
  - src/components/admin/moderation-grid.tsx
---

# lp/glass-wiring

**Goal.** Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the sixth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `806695d1`)

- Owns, by FILE where a folder is shared: `src/components/shared/masonry.tsx` and `masonry.test.tsx`,
  `media-lightbox.tsx`, `media-lightbox.test.tsx`, `media-lightbox.lazy.tsx`, `lit-edge-contract.test.ts`;
  `src/components/app/media-grid.tsx`, `host-media-grid.tsx`, `recently-deleted-grid.tsx`, `my-uploads-gallery.tsx`,
  `my-likes-gallery.tsx`, `event-card.tsx` (the `PILL` chip: dark glass on paper); `src/components/app/event-feed/selectable-media-grid.tsx`;
  `src/components/likes/like-button.tsx`; `src/components/guest/guest-masonry.tsx`, `guest-reel-overlay.tsx`;
  `src/components/shared/play-badge.tsx`; `src/components/shared/backdrop/photo-section.css` (the marketing plate onto
  the tokens: "find a global that works everywhere"); `src/app/(dev)/design/sandbox/glass/` and its registration
  lines (the retirement; the RULINGS row shipped; the ledger is the Orchestrator's at the merge); `src/app/globals.css`
  RELEASED for one fenced block (the `--glass-*` tokens, `@utility glass`, and the veil comment at :341-347 rewritten;
  a Tailwind `@utility` compiles only in the entry sheet, the ladder's precedent); `docs/systems/design-system.md` (the
  material's facts in place). The duplicate `PILL` at `(guest)/u/[slug]/page.tsx:66` is avatar-wiring's file: one line
  as this lane's exception after its sync.
- The material: Crystal (blur 42, brightness 0.68, saturate 2, 4 percent black, a 28 percent lip and a 10 percent
  hairline as inset shadows, never a border) as `--glass-*` tokens and one `.glass` utility; the lightbox's flat
  `bg-black/90` becomes the album blurred at half brightness on its own element (`.gl-behind`'s numbers); the action
  pill, the attribution capsule (pressable, one grade), the close button, the host tile's row as ONE pane (the
  `[data-reveal-chip]` collapse becomes one width), the reel's Share and Download as the one material (Download loses
  its opaque white), the play badge, the like count, the event card's chip on paper, the marketing plate. The rose
  active mark carries its own hairline so it clears 4.5:1 over the brightest photograph (the harness re-run on the
  shipped tile). The `floating-layer` refusal of translucency on floating PANELS stands: glass is media chrome, never a
  popover.
- ONE tile: `MediaTile` grows the three marks as state (an active like, a play mark, a subtle count), the desktop hover
  actions as a per-surface prop (guest: like, download; host: like, download, hide/show; bin: restore, delete forever;
  profile feeds: none; the admin's `ModerationTile` untouched), select as a mode (the long-press and whole-tile
  select of today). On a phone a tile shows the marks and nothing else; every action lives in the lightbox
  (`viewerIsHost` and the per-surface props as today, plus the seam's `canDelete`). `MasonryColumns` hosts every
  album grid including the guest's (`GuestMasonry` becomes a thin wrapper over it, keeping the pending tiles through
  the seam's `prefix`) and moves from CSS `columns` to EXPLICIT column assignment (items distributed to `GALLERY_COLUMNS`
  columns, the balance reading like today's), which is what lets an arrival grow into one column while the others
  hold still (`live=land`) and makes the stagger honest; the marks wear a lighter blur token (`--glass-blur-mark`,
  the material's tint and edges, not its 42 px) because a blur that heavy on every tile costs a phone scroll; the
  lightbox's blurred backdrop is measured at 375 before it ships (`ui/dialog.tsx:75-77` refuses a full-viewport blur
  on phones as too costly: the Handoff carries the swipe frame time, and a lighter backdrop blur on phones if it
  fails). Exports that keep their names and props because the lab and marketing import them:
  `MasonryColumns`, `GALLERY_COLUMNS`, `CornerPlayBadge`, `GuestMasonry`, `HostMediaGrid`, `RecentlyDeletedGrid`,
  `MyUploadsGallery`, `SelectableMediaGrid`, `MediaTile`, `GridMedia`; `ActionTooltip` imported unchanged. The
  guest's Add pill stays solid: the board's carried call (`call:add-pill`, the pill drawn in the material) was not
  answered, and the pill's fate rides guest-shape round two; the record says so. The paper `PILL` duplicate on the
  profile page is avatar-wiring's file: whichever lane lands second moves it (one line, both Handoffs).
- Tests: the material's contract (`// @contract-for: src/app/globals.css`'s block through a small `lib/glass.ts`
  that names the tokens; the utility never on a floating panel), the tile's contract (a phone tile renders no control;
  a desk tile's hover set per surface; the marks as state; `canDelete` gating the trash), the lightbox's (the backdrop
  element separate from the photograph), `lit-edge-contract` updated; `pnpm lab:smoke` whole; the gate.
- Red-team on the alias at 375 in the pane, signed out: the disposable album's tiles (marks only), the lightbox (the
  blurred album behind, the pill and capsule in Crystal, the edges visible over the brightest photograph), the reel's
  controls; the host gallery's one-pane row, the bin and the event card's chip are Will's, signed in.
- His to overrule: the marketing plate joining the material; the mark's hairline; the reel's Download losing white;
  the per-surface hover sets.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`guest-shape` r1 (seven; five wire now, `chrome` goes to round two, `dialogs` follows the sheet ruling):**
- `door=today` (overrules `one`): the welcome, then the gate: two screens on a gated event stay. "To be clear, this is
  directly approving the welcome then gate, not this sheet design": the SEQUENCE is ruled, the shell is not; with
  `dialogs=stands` the shell is the one responsive Sheet the hub landed (a bottom sheet in a hand). At a desk a door is
  not a side panel: the Sheet gains a `desk` prop (`side` | `center`) so the door wears the same primitive centred.
- `nothing=river`: the river, at one depth, on both the locked page and the empty album (nine local stand-in frames,
  never the event's own; a locked page leaks exactly what it leaks today).
- `chrome=dock` with "warrants a second round": NOT wired now. Round two on `chrome` alone, drawn with Save already
  moved (his `account=after`) and the dock's two remaining actions (Add, Invite): where a guest's actions live so they
  are FOUND on landing ("one of the last places a guest's eye will reach") and REACHABLE deep in the album ("always
  accessible, no matter how deep"). The floating Add pill's fate rides this round.
- `live=land`: a new photograph grows into its column under a glow that fades, the album re-flows around it, nothing
  else moves. The tile's arrival state is the tile's (the glass lane's file); the guest's live gallery sets it.
- `yours=?` with his rule, verbatim: "A guest can delete any photo they've personally uploaded, ever." A product
  feature that does not exist today (the board's options were never / a window / a 'yours' strip): the viewer's Remove
  on a guest's own photographs, forever, under an account; on the same device session for an anonymous guest (the
  only identity there is). A SECURITY-DEFINER RPC that deletes only the caller's own media (the guest row or the
  account, never a client claim), the same purge path as a host delete, never restorable by the host (a person's
  withdrawal is theirs). His to confirm at approval: whether a guest's removal is final for the host too.
- `account=after` (overrules `one`): the account is asked once, at the door; keeping the album becomes a one-tap
  offer after a guest's first photograph lands, not a form above the album. Save leaves the chrome (round two draws
  the chrome without it).
- `dialogs=stands`: Invite, Save, Report and Download all wear the one responsive Sheet (the desk lane conceded it).

**`app-vocabulary` r1 (seven; four wire now, two stand, `gallery-controls` gets a narrow round two):**
- `empty-states=stands`: the earlier ruling (the pulse's designed empty state) decides; nothing new is wired.
- `loading=asneeded`: one shared skeleton primitive wired to exactly the routes with a real pre-paint wait (the
  dashboard, the event hub, the Studio); the dashboard's and the hub's `loading.tsx` become the one component, the
  Studio gains its first (the ROADMAP line closes).
- `tile-grammar=stands` + "If unifying components or keeping them distinct also helps, that's your call": the earlier
  ruling (glass's tiles rule) decides what a tile shows; the CALL is taken: ONE `MediaTile` for every album grid (guest,
  host, bin, profile feeds, selection) with the three marks as state, the desktop hover actions as a per-surface prop
  and select as a mode; the admin's moderation tile stays its own (a report, not an album). Owned by the glass lane,
  which rewrites every tile's marks anyway.
- `bulk-toolbar=icon` + his three notes: icons on both bars (ReviewActions and GalleryBulkBar become one `BulkBar`
  with an actions prop); tooltips open IMMEDIATELY on hover, never delayed; "every action on a photograph lives in the
  lightbox" was a MOBILE rule and the desk keeps hover controls on cards; and the side-by-side tooltip: moving across
  the bar's icons slides one tooltip panel between them (the transitions.dev "page side by side" shape), the delight of
  this lane, reduced motion a plain swap.
- `gallery-controls-home=cluster` + "Am I overriding anything with this answer, or does this work with the glass?":
  NO override, and the desk badge's reasoning was a slip: glass's `row=bar` ruled the host TILE's hover row (like,
  download, hide as one pane of the material); the cluster is the gallery's section header on paper, and wears no
  glass at all. Both hold, in different places. His crowding worry (download,
  tile size, sort, filter, select) is a narrow round two on this board: where the host gallery's five controls live (a
  View menu holding tile size, sort and filter beside the two verbs; the sticky pill row; a control sheet at 375).
- `gallery-controls-persistence=device`: localStorage, per browser, no profile column.
- `confirm-switch=primitive`: one `ConfirmSwitch` owns the glyph and the deferred-open dance; the two hand-rolled
  copies in the settings sheet's uploads section retire into it.

**`seed-avatar` r1 (seven; all wire now, with a bug fixed first and `look` re-asked in round two):**
- The BUG, before anything: "the avatar doesn't fully fill its container, and you can see horizontal edges within";
  "reveals the color underneath the photograph on the edges". Found and fixed in the production `Avatar` (the drawing
  the board reuses), with a contract test that the image covers the disc at 24, 32 and 40 with no gap.
- `look=diagonal` (overrules `orb`): two hues on a diagonal is the working version. His question ("is this the best
  that hashvatar had to offer? The preview ones ... felt much more alive and rich") is round two on `look` alone: three
  richer looks measured against the same three floors (hashvatar's own multi-stop gradient mode as it renders on its
  site, a two-throw mesh, the diagonal with a lit seam), drawn on the wired avatar.
- `the-crowd=full`, `palette=wheel`, `letter=always`: every guest full colour, all 360 degrees, the initial at every
  size in a fitted ink.
- `seed=account` + "ensure the account ID randomness leads to a variety across the color wheel": the account id is
  the seed; the generator's crowd test (a thousand ids fill every 30-degree bucket) becomes the contract on the
  production path, fed real id shapes (UUIDs), so a concentration is a red test.
- `after-upload=under`: the colour waits underneath and the photograph paints over it; `motion=none`: still, always.

**`admin` r1 (seven; all wire now):** the portal opens on the numbers (four figures, a fortnight's trend, the queue
beneath); a rail plus a command palette (the help palette's primitive if it is one); hybrid density (a table for data
on `ui/table.tsx`, a list beside the message for prose inboxes); a state's colour reaches the row (a failed run tints
its row with a leading edge: "Makes it a bit harder to miss"); every destructive act opens one sheet sized to the
damage (the responsive Sheet; only the permanent act makes you type); the health band under the bar on every page with
a chip in the bar, gone on a good day; a 44 px tool bar with a breadcrumb, a live tag, the health chip and an initial.
His three answers on badged asks (`home`, `density`, `chrome`) override app-shape's reach and are echoed there; the
desk lane had written "stands" on all three.

**`app-door` r1 (seven; all wire now, `welcome` re-asked in round two, `return` flagged):**
- `lead=code`: one email field; the same address signs in or creates the account; Google beside it; a password drops
  to a quiet link.
- `surfaces=one` + "any login components that feel similar could be unified into one object worn 4ways": one account
  object with the methods as props and one consent line, each wear passing the reason it asks (the /login page, the
  guest gate's step, the keep-the-album offer after upload, the create-account moment a like opens). The admin's
  second factor stays its own step after the object (a different purpose).
- `welcome=tour` (overrules `first`): the name, then the tour; event creation becomes the tour's closing primary CTA
  (skippable, as in the preview) so the wizard stays its own focused thing. "Could use a huge redesign to feel more
  alive" is round two on `welcome` alone: three tours drawn on the real screens.
- `page=beside`: /login with the product beside it (real photographs on the right half of a laptop, a band above the
  door in a hand).
- `existing=tell` + his note: the same single step, one line naming the address and saying we signed you into the
  account it already had; dismissible; with an action if it was a mistake ("Not you? Sign out" / "Use another email").
- `failure=paths`: the line, shorter, with the recoveries as real buttons under it; a visual redesign inside the lane.
- `return=tap` + "If this is a bad idea, please flag it": FLAGGED, in one sentence: a press that signs anyone in
  without a credential is never acceptable, and a passkey IS a credential, so the option is right exactly as far as
  passkeys reach. The lane wires it as: a passkey registered on the account page ("Sign in faster on this device"),
  offered once after a code sign-in; the /login door shows the one-press button when this device holds one, the Google
  one-press when a Google session is live, and `back`'s welcome-back line with one field otherwise. If Supabase Auth
  has no passkey factor on this tree (the doc check decides), the lane ships `back` and lists passkeys as the follow-up.

**`glass` r2 (two; the board retires at its wiring):** `material=crystal` (overrules the lane's Frost: 4 percent black,
the pane separating by its edges), `edge=double` (a 28 percent lip and a 10 percent hairline all round). The wiring
lane: the `--glass-*` token set and one `.glass` utility; the lightbox's backdrop (the album blurred at half
brightness); the tiles' three marks and the removed chips (with the rose mark carrying its own contrast: no material
saves it over a bright photograph); the host's row as one bar; dark glass on paper; the reel's controls in the one
material (round one's white on the reel is superseded by "one material everywhere", his own words); then `glass`
retires and the material lands in the Library.

## The seam, landed by the Orchestrator on `launch-prep` BEFORE the cut (additive, about forty lines, announced)

PROGRAM.md makes a change two lanes need the Orchestrator's. `MasonryColumns` gains `arrivedIds?: ReadonlySet<string>`
(writes `data-arrived` on the tile box), `canDelete?: (item) => boolean` (gating its existing per-item `onDeleteItem`)
and `prefix?: ReactNode` (one `{prefix}` before the items); `GuestMasonry`, which has no delete today, gains
`onDeleteItem` and `canDelete` and threads `onDeleteCurrent` into its `MediaLightboxLazy`, plus `arrivedIds` and
`prefix`; `MediaLightbox` gains `canDelete?` gating its existing `onDeleteCurrent` (the Trash and its confirm dialog
exist). About thirty-five lines, additive, no behaviour change; one `canDelete` pin added to the lightbox test. The
glass lane rebuilds under these names (and adopts `openId` on `MasonryColumns`, since the guest album opens by id and
the shared grid by index: a thin wrapper without it brings back the shifted-photo bug; named in Lane 1's tests); the
guest lane passes them from `live-gallery.tsx` and never opens a glass file. In the same commit: the `--info` token
pair, and the `floating-layer.test.ts` portal scan told about the coming `ui/command-palette.tsx` if a listed file may
be absent (checked against the test's own rule; otherwise admin-wiring adds the row as its one-line exception after
vocab-wiring lands). Typecheck and the tests green. (If the seam cannot land clean, `guest-wiring` is cut after
`glass-wiring` merges instead.)

## The small batch, synthesized (demo-event r1 and pricing-page r1, the same build; 15 verdicts: 9 confirm, 5 overrule, one `?` with his answer)

**`demo-event` r1 (seven; six wire, `doors` goes to round two, the welcome's design joins guest-shape round two):**
- `arrival=role` + "This welcome screen could be redesigned, but the demo welcome feels more correct for this generic
  guest welcome": the demo's own arrival (whose party this is, that you stand exactly where a guest stands, the one
  thing to try) stays the first screen behind every demo door; its DESIGN is re-asked in guest-shape round two beside
  the door's shell (one welcome, drawn for a real event and for the demo).
- `framing=tag`: a Demo mark beside the wordmark, and the guest header pins to the top so the mark is on every screen.
- `try=turn`: the same upload, then one card under the album's first row ("that is what your guests would see, and
  here is how you get one").
- `next=slot` + "we could also include a closing card below": the blanked Save slot (Save has left the chrome:
  `account=after`) becomes "Start your own" beside Invite in the first screen, AND a closing card below the album.
- `doors=pile` (overrules `named`) + "I'd be curious to see better designs of this ... labeling the QR doesn't look
  very polished in the otherwise text-free visuals": the footer's photo pile becomes the rule for every demo door on
  the marketing site (one object skinned per place, the nav panel's ticket goes) as the working version; round two on
  `doors` alone draws better, text-free designs of that one object.
- `phone=pair`: a code scanned off the laptop opens the same session; what the phone adds appears on the laptop's
  album a second later and the laptop says where it came from (one broadcast channel, the doorbell's, no stored
  bytes).
- `event=one` + his note: one party, curated once; "The app works the same across events".

**`pricing-page` r1 (eight; six wire, `fit` and `phone` go to round two):**
- `opening=plans` (overrules `fork`): the page opens on paper, the plans the opening, no dark hero chapter above the
  cards ("a paper hero makes the pro card feel more premium"). His product note is recorded verbatim (one event
  against many is not Pro's main differentiator; a wedding wants videos and storage) and changes no ruled line: the
  Pro line already leads with videos.
- `pair=pro` + his flip: Free and Pro side by side in two columns above (his words over the option's own text, which
  drew Pro alone), the Event Pass a full-width card beneath, "more beautiful".
- `size=slider` (overrules `rows`): one slider from the smallest room to the largest, the price, the stats and the
  button following the thumb; the monthly/yearly toggle stays ABOVE the slider ("more intuitive/natural").
- `pass=under` (overrules `beside`): the Pass wide beneath the pair, redesigned with the same care as the cards.
- `fit=wall` + "Would like to see a couple more explorations of this 'Find your plan size' component ... Higgsfield
  does a good job (explore https://higgsfield.ai/pricing in code and visually)": today's slider and filling wall
  stays as built (it is the `today` option); round two on `fit` draws two or three designs, one on Higgsfield's split
  (the configuration left, a designed plan card as the result in a frame right), the lane researching that page.
- `sheet=?` with his answer, verbatim: keep the tiles and the table, kill the band; the tiles above "Find your plan
  size" as a dark chapter intro (the hero now paper); the table dark, so no harsh back-to-back chapter transition
  between Find your plan and the FAQ that follows.
- `close=eight` (overrules `four`) + "reduce the count row (5-6 total?)": the folded accordion, five or six items,
  then the closing band; the JSON-LD carries the same items; the FAQ data's split with Help named in the Handoff.
- `phone=swipe` + "I think the demo is broken, so I can't actually see it live. Would like to prove it in the lab
  before passing": NOT wired. The board's `phone` step is repaired in the lab and the ask stays open on the board for
  his eye (round two carries it beside `fit`).

**Lane 7: `pricing-wiring` (Opus, the first seat that frees; the money page):** owns `src/app/(marketing)/(paper)/pricing/`
(or wherever `pricing/page.tsx` lives: the lane check names it), `src/components/marketing/sections/pricing/`
(`plan-cards.tsx`, `pass-card.tsx`, `calculator.tsx`, the unlock grid, the shared band retired on disk if the lab
draws it, the FAQ block), `pricing-faq-data.ts`, the pricing lines of `docs/systems/marketing-content.md`. Reads,
never edits: `src/lib/constants/tiers.ts` (the sizes and cadence the slider walks: the one source), `marketing-voice.ts`
(`PRO_LINE`), the checkout doors (their targets unchanged; Stripe stays TEST), `sandbox/pricing-page/` (round two's).
The chapter rhythm: paper opening, the pair and the Pass, the dark tiles chapter, "Find your plan size" as today, the
dark table, the accordion, the band. Tests: the FAQ count and the JSON-LD parity, the slider's steps equal `tiers.ts`,
the cadence toggle above the slider, `marketing-h1-policy`, `content-policy`; the gate. Red-team on the alias signed
out at 1440 and 375: the whole page, the slider, the dark chapters' transitions, the accordion, the Pass beneath.
His to overrule: the Pass's new design; the accordion's count; the tiles chapter's copy.

**Lane 8: `demo-wiring` (Sonnet, cut AFTER `guest-wiring` merges, since its items live in that lane's files):** owns,
then, `entry-modal.tsx` (the demo variant of the welcome step's copy, its design untouched until round two),
`event-experience.tsx` (the action row's "Start your own" and the closing card, the pair's "added from a phone" line),
`guest-header.tsx` (sticky, the Demo mark; avatar-wiring's before, free by then), `guest-upload.tsx` (the turn card),
the marketing demo doors (`marketing-footer.tsx`'s pile as the rule, `demo-ticket.tsx`, the nav panel's ticket
retired on disk, `live-demo.tsx`), `src/lib/demo/` if it exists, the demo lines of `guest-flow.md` and
`marketing-content.md`. The public demo event's DATA is never touched (the standing rule). Tests: the demo mark on
every guest screen of the demo, the turn card only in the demo, the pair's channel (the doorbell's, no new table).
Red-team on the alias signed out at 375 and 1440: the demo door from the home and a feature page, the arrival, the
mark, an upload's turn card, the pair with the pane and a second tab.

**Round twos from this paste (Sonnet, lab-only, as seats free):** `pricing-fit` (pricing-page round two: `fit`, with
the Higgsfield research, and `phone` with its demo repaired) and `demo-doors` (demo-event round two on `doors`
alone). Both boards keep their ids; their RULINGS rows are rewritten by the round-two lanes.

**Their reach on the boards still open (for `overtaken-2`):** `app-pricing.carry`, `pass` and `learn` (the marketing
page's new shape and the Pass's place); `first-event.limit` (a Free host's upgrade door opens on the paper plans);
`site-chrome` round two's `foot-after` (the pricing page now closes on the accordion and the band); `help-center.hub`
(the FAQ data's split); `demo-event`'s doors reach the nav panel `site-chrome` round one landed (the ticket goes).

## The ownership rules every lane follows this round

- One manifest owner per path; no two lanes' `owns` overlap, not even by a shared prefix. A second lane's single-line
  edit in another lane's file rides the lane-check exception line of its Handoff ("exceptions and why"), applied AFTER
  syncing past the owner's merge, never before. `merge-lane.sh` aborts only on real git conflicts (same or adjacent
  lines, a delete against a modify), so distinct hunks merge clean; the pre-handoff sync carries the first lane's hunks.
- `ladder-wiring` owns explicit FILES (its real footprint, about seventy: `git grep -lE
  'text-\[(7|8|9|11|13|15|17)px\]|text-\[0\.8rem\]|tracking-\[0\.14em\]' -- src ':!src/app/(dev)'`), never a prefix
  another lane sits under; a file whose only sizes are stock classes equal to a step needs no edit at all.
- The app-shape lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16,
  `text-[10px]`) and never on the announced step names: Tailwind v4 emits no utility for an undeclared `--text-working`,
  the element silently inherits, and nothing in the gate sees it. The names are a mechanical swap after a lane syncs
  past the ladder's merge, or a follow-up.
- A wiring lane never deletes, renames or breaks the props of a module the lab imports: every module
  `git grep -l "from \"@/" src/app/\(dev\)` resolves to (`filter-chips`, `trash-section`, `storage-meter`, `feed-section`,
  `empty-section-teaser`, `event-card`, `app-shell`, `feed-section-header`, `event-filter-pills`, `review-section`,
  `use-review-triage`, `recently-deleted-grid`, `event-settings/*`, `event-slug-control`, `my-uploads-gallery`,
  `lib/dashboard/filters.ts`, `media-grid`, `host-selection-provider`, `review-actions`, `gallery-actions`, `styled-qr`,
  `host-media-grid`, `export-dialog`, `download-all-button`, `selectable-media-grid`, `review-grid`, `feed-section-empty`,
  `qr-preset-picker`, `enter-event-prompt`, `gallery-empty-state`, `likes-provider`, `password-gate`, and more): a retired file stays on disk with a head comment
  naming the boards that draw it; `AppShell` and `EventCard` props stay backward compatible; `pnpm design:rules` when
  `component-notes.ts`'s AppShell contract changes.
- `docs/systems/host-app.md` is split by heading: `home-wiring` edits inside `## Dashboard landing`, `## Events & the
  create flow`, `## First-time host welcome`; `hub-wiring` inside `## QR designer`, `## Custom event link (slug)`, `## The
  event page`, `## Moderation & curation` and one Reel-card door line in `## Reel curation`; nobody touches the H1, the
  ROLE block or `## See also` (the Orchestrator rewrites the H1 at the record); edits stay inside a section body, never
  on a heading line or the blank line before the next heading; the second lane to land syncs first.
- `src/lib/single-source-policy.test.ts` refuses one UPPER_SNAKE export from two `src/lib` modules: `home-wiring`'s
  `lib/dashboard/*` and `hub-wiring`'s `lib/event/*` never both export a `SECTION_LABEL`; `voice-wiring` deletes the four
  sibling Pro lines rather than re-exporting one.
- `content/help/` and `content/blog/` belong to `voice-wiring` alone. The app-shape lanes change what several help
  articles describe (the dashboard, the event page, sharing, settings): each lists the articles it makes stale in its
  Handoff (help how-tos track shipped reality), and one `help-sync` follow-up (Sonnet) rewrites them after both land.
- Every new door a wiring lane adds (the QR and its mini-modal, the copy button, the list toggle, the menu rows, the
  cards) carries `trackAttrs` as the chrome's doors do; every new component gets its `for` line in
  `rules/component-notes.ts` and a `// @contract-for:` test, so it lands in the Library with its `new` badge
  (`pnpm design:rules`); the sheets, the mini-modal and the table read `ui/floating-layer.ts`.
- ONE responsive Sheet for the product (a side panel at a desk, a bottom sheet in a hand, on `ui/sheet.tsx` with
  `ui/drawer.tsx` retired or folded): `hub-wiring` builds it for settings and sharing, and it is the sheet
  `guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit ("apply this sheet concept
  everywhere"); its contract test is the one others reuse.

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` with the 8 known warnings, `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **A RED TEST AT THE CUT, AND IT IS NOT THIS LANE'S.** `src/app/(dev)/design/review/ledger.test.ts`
  fails on `origin/launch-prep` at `0ad0c32d`, before any lane's first edit (verified in a clean
  worktree at that SHA): `guest-shape/dialogs: the ledger stores "stands", which is not one of the
  ask's options`. The sixth batch's record wrote the reserved `stands` answer onto an ask the board
  does not declare it on, and the grammar only allows it where `sandbox/overtaken.ts` badges the ask.
  Both files are the Orchestrator's (a record doc and guest-shape's board), so this lane could not
  fix it; EVERY lane of the batch will hand off with this one failing. Recommended: the Orchestrator
  either badges `guest-shape.dialogs` in `overtaken.ts` or records the choice as `sheet` with his
  note, at the merge.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, new `## The glass material: Crystal, and the one place it lives`
  between the elevation contract and Motion: the material in numbers, the three utilities, the ground
  as its own element, the glyph's own light, dark in both themes, the floating layer's refusal
  standing, the plate's two measured local numbers, and the phone's measured frame cost.
- `docs/systems/design-system.md`, new `### The album tile: marks, and the desk's one pane` under it:
  his `tiles` rule verbatim, one tile for every album grid, the per-surface hover set, the explicit
  columns and why they are what make an arrival local, the open item as an id.
- `docs/systems/design-system.md`, three lines refined in place: the elevation contract's "no
  translucent surface" (now: no SURFACE token is, and the glass he banked exists beside them), the
  reveal-chip paragraph (the hook rides the BAR now, one width), and the glass-LAYER pattern line (a
  pane that never fades puts the filter on itself).

## Deferred (ROADMAP one-liners, bucket named)

- Now: the centred `PlayBadge` (a video poster in the dashboard's arrivals strip, the events rows,
  the operator's report and the lightbox's neighbour slot) now wears the material at the mark's blur
  where it wore a flat 50 percent ink; it reads well on every surface a lane can reach signed out,
  and the four signed-in ones want Will's eye.
- Now: `GALLERY_UNIFORM_COLUMNS` (the Reel and Review grids) is still CSS grid, which is right (a
  uniform grid has nothing to balance) — but it means the Review queue still re-flows on an arrival
  where the album no longer does. Worth one look when `host-curation` wires.

## Handoff (replaces the chat report)

- Board commit `b2887f43` (the material, the one tile, the board retired); no sync-merge commit:
  `origin/launch-prep` had not moved from the cut `0ad0c32d`, checked at the handoff.
- Gates on the tree, each on its own exit code: `design:rules` 0 · specimens 0 (131 specimens on 94
  entries) · `typecheck` 0 · `lint` 0 (8 known warnings, the baseline) · `test` **1** — 2,841 passing,
  1 skipped, and ONE failure that is red at the cut and belongs to the Orchestrator (see Questions) ·
  `build` 0 (255 pages) · `pnpm lab:smoke --base http://localhost:3131` 0 (403 checks, 0 failing) ·
  `pnpm lab:demo --board glass` 0 ("found no open step to press": the board retired in this lane).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the `owns` paths, plus four
  exceptions, each named here. (1) `src/app/(dev)/design/touchpoints.ts`, `sandbox/registry.ts`,
  `(shell)/lab/boards.ts` — the glass board's OWN registration lines, removed at its retirement (the
  retirement exception; the RULINGS row rewritten as shipped, `SandboxId` and `DESK_ORDER` entries
  gone, `RulingId` keeps it as every retired board does). (2) `rules/component-notes.ts` — two `for`
  lines for `globals.css` and `lib/glass.ts`, which the round's ownership rules require of any file a
  `@contract-for` puts in the index, inserted as their own hunk at the head so a second lane's lines
  merge clean. (3) `docs/design/library.md` and `rules/rules.generated.json` — generated by
  `pnpm design:rules`, which the gate runs. (4) `docs/tracks/glass-wiring.md` — this file.
- The items, one line each:
  - `material=crystal` + `edge=double`: the `--glass-*` tokens and `@utility glass` in `globals.css`,
    named by `lib/glass.ts` and held to it by `glass.test.ts`; blur 42, backdrop 0.68, saturate 2, 4
    percent black, a 28 percent lip and a 10 percent hairline as inset shadows. Lands in the Library
    as `src/app/globals.css` + `src/lib/glass.ts`, both with their `for` lines and the `new` badge.
  - `grades=one`: the lightbox's pill, its attribution capsule (pressable now, the same grade) and its
    close button are one class between them; a test counts exactly three panes and refuses a second
    tint or blur on any of them.
  - `behind=album`: the lightbox's flat `bg-black/90` is gone; the album is blurred at half brightness
    on `[data-lightbox-ground]`, radix's own Overlay rather than our wrapped one (whose baked
    `backdrop-blur-xs` would race ours in the same layer). The contract pins the ground separate from
    the photograph.
  - `tiles` (his own rule): a tile carries an active like, a play mark and a subtle count, and nothing
    else; on a phone that is the whole tile, at every surface, measured live (`barsVisible: 0` at 375).
  - `tile-grammar` (the Orchestrator's call): ONE `MediaTile` for every album grid. `GuestMasonry` is
    now a thin wrapper that owns only what is the guest's (the in-flight tiles through the seam's
    `prefix`, the landed check, a hover set with no moderation in it).
  - `row=bar`: the host's three verbs are one `.glass` pane, and `[data-reveal-chip]` rides the BAR, so
    one width opens instead of three chips sliding. The bin's two verbs and the guest's two wear the
    same pane, sized by the surface's own verb count.
  - `live=land`: `MasonryColumns` left CSS `columns` for explicit column elements, filled OLDEST FIRST
    into the shortest column, so a prepended photograph is the last one placed and every tile on
    screen keeps its column. Pinned as a property (23 tiles, 2/3/5/6/8 columns, nothing moves).
  - `reel=white`, superseded by his own "one material everywhere": the reel's Share AND Download are
    the one pane now, Download's opaque white gone.
  - `paper=dark`: the event card's `PILL` and its saved-event glyph are dark glass on the light
    dashboard, and the border went with them (the material carries its own edges).
  - The marketing plate (`photo-section.css`) reads the `--glass-*` tokens for blur, saturation and
    both edges; its brightness and tint stay the section's two MEASURED numbers, with the measurement
    in place and a note to retune them by measuring rather than by matching.
  - `openId` on `MasonryColumns`: the shared grid opens by id, so the guest album's thin wrapper
    cannot bring back the shifted-photo bug.
- Calls his to overrule on the alias, one line each:
  - **A glyph on glass carries its own halo** (`glass-mark-lit`), not just the rose mark: the board
    drew the lightbox's pill over the album ALREADY at half brightness, and production floats it over
    the raw photograph, where white on a near-white sky is under the floor. The halo is invisible over
    a dark photograph. If it reads as a shadow, the alternative is a darker tint and every dark
    photograph pays for it.
  - **The phone keeps the desk's ground** (no lighter blur in a hand). The brief allowed one "if it
    fails"; it did not: 16.7ms p50 AND p95 at 375 with the ground blurred, the same flat, and the same
    at twice the radius under a 6x CPU throttle. A real phone on the alias is the last word.
  - **The marketing plate keeps its own brightness and tint.** Taking the pill's pair would put a
    chapter of reading copy under 4.5:1 over the brightest photograph in that pool.
  - **The per-surface hover sets**: guest = like, save · host = like, save, hide/show · bin = restore,
    delete forever · the profile feeds = none. The Likes feed also drops the like MARK (every tile in
    it is liked, so the mark would be wallpaper) and unlikes from the lightbox.
  - **A hidden host tile keeps only its 30 percent dim on a phone.** The amber Show marker was a
    persistent chip; `tiles` empties the phone tile, so the dim is the signal and Show is one tap away
    in the viewer.
  - **The album's reading order moved with the columns.** It was column-major (newest straight down
    the left column, "flagged for live review" since Phase 4); the newest photographs now land at the
    heads of the shortest columns, which is the top row.
  - **The centred `PlayBadge` joined the material**, where it was a flat 50 percent of the gallery ink.
  - **The lightbox's Host badge went from `bg-white/15` to `/20`** so it separates inside the pane.
  - The guest's Add pill stays SOLID: the board's carried `call:add-pill` was never answered and the
    pill's fate rides `guest-shape` round two. Nothing in this lane touched it.
- The help articles this lane makes stale: none found. The tile's verbs moved, but no how-to in
  `content/help` names a tile's icons; `docs/systems/host-app.md`'s "three chips" sentence is
  `hub-wiring`'s section and is now a desk-only row — one line for `help-sync` or the Orchestrator.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the lightbox at 375 over the BRIGHTEST photograph in the album (the pill, the capsule
  and the close in Crystal, the album blurred behind, the double edge visible), then a host tile's
  one-pane row at 1440 signed in, then the bin and the event card's chip on the light dashboard —
  those three are yours, since no lane can sign in on its own port.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). Crystal landed as the product's one material: the
`--glass-*` tokens and three utilities in `globals.css`, named by `lib/glass.ts` and held to it by a
contract, worn by the lightbox's pill, capsule and close, the tiles' marks, the host's row, the reel's
two controls, the event card's chip and the marketing plate; the lightbox's flat scrim became the
album blurred at half brightness on its own element. One `MediaTile` now serves every album grid: a
phone tile carries an active like, a play mark and a count and no controls, the desk's verbs are one
declared pane per surface, and the grid left CSS columns for explicit ones filled oldest-first, so a
photograph landing live grows one column and the others hold still. The `glass` board retired.
