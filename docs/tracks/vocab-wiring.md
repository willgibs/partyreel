---
track: vocab-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c935f072"          # the launch-prep SHA the branch was cut from
board: app-vocabulary  # wiring; round two on the gallery's controls is another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/loading.tsx
  - src/app/(app)/dashboard/[eventId]/loading.tsx
  - src/app/(app)/dashboard/[eventId]/reel/loading.tsx
  - src/components/shared/route-skeleton.tsx
  - src/components/shared/route-skeleton.test.tsx
  - src/components/app/event-feed/review-actions.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/event-feed/event-feed-action-bar.tsx
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/event-hub.test.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx
  - src/components/ui/tooltip.tsx
  - src/components/shared/action-tooltip.tsx
  - src/components/shared/tooltip-slide.tsx
  - src/components/ui/floating-layer.ts
  - src/components/ui/floating-layer.test.ts
  - src/components/providers.tsx
  - src/components/ui/confirm-switch.tsx
  - src/components/ui/confirm-switch.test.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/components/shared/tile-size-control.tsx
  - src/components/shared/tile-size-control.test.tsx
  - src/lib/shared/use-tile-size.ts
  - src/lib/shared/tile-size-cookie.ts
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/app-vocabulary.json
  - docs/design/rulings.md
  - src/components/shared/masonry.tsx
  - src/components/ui/navigation-menu.tsx
  - src/app/(marketing)/marketing.css
  - .claude/skills/transitions-dev/08-page-side-by-side.md
  - src/lib/dashboard/events-view.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/
---

# lp/vocab-wiring

**Goal.** Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the sixth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `806695d1`)

- Owns: `src/app/(app)/dashboard/loading.tsx`, `dashboard/[eventId]/loading.tsx`, a new `dashboard/[eventId]/reel/loading.tsx`,
  a new `src/components/shared/route-skeleton.tsx`; `src/components/app/event-feed/review-actions.tsx`,
  `gallery-actions.tsx`, `event-feed-action-bar.tsx`, `event-gallery.tsx`, `event-hub.test.tsx`; `src/components/ui/tooltip.tsx`,
  `src/components/shared/action-tooltip.tsx`, a new `shared/tooltip-slide.tsx`, `src/components/ui/floating-layer.ts` and
  its test (a `floatingCrossSlide` constant lifted from the navigation menu's cross-slide, both consumers reading it:
  bible 15, a surface never spells its own entrance), `src/components/providers.tsx` (the ROOT `TooltipProvider` is
  `delayDuration 200, skipDelayDuration 300` today, not 0: his "Tooltip should appear immediately on hover" is
  site-wide, so the root goes to 0 and the lightbox's `ActionTooltip` opens at once too); a new `src/components/ui/confirm-switch.tsx`,
  `src/components/app/event-settings/uploads-section.tsx` (the `mock-parity` literals stay); a new
  `src/components/shared/tile-size-control.tsx` and `src/lib/shared/use-tile-size.ts`; `docs/systems/host-app.md`
  (the gallery and settings lines in place). Reads: `sandbox/app-vocabulary/` (never edits: round two's), `masonry.tsx`
  (the `--album-column` knob, glass-wiring's file).
- The skeleton: one `RouteSkeleton` with the three shapes (the pulse, the hub, the Studio matching its real shape);
  the two `loading.tsx` files become it; the Studio gains its first.
- The bars: one `BulkBar` behind `ReviewActions` and `GalleryBulkBar` with the verbs as props, every action an icon
  with a tooltip that opens at once (the root provider at 0; `skipDelayDuration` 600 around each bar so moving across
  never re-waits) and
  SLIDES between neighbours: a bar context stamps `data-motion="from-start|from-end"` on the incoming content from the
  triggers' order, built on the house recipe he named (`.claude/skills/transitions-dev/08-page-side-by-side.md`, "our
  internal page side by side version", its `--page-slide-*` variables; the navigation menu's cross-slide is the
  precedent, the constant lifted into `floating-layer.ts`), reduced motion a fade; mounted
  behind a hydrated flag (the tiles' SSR hydration lesson), Delete's tooltip nesting its dialog trigger as the
  lightbox does; the desk keeps hover controls on cards (the tile is glass-wiring's; nothing here touches it).
- The cluster: `TileSizeControl` (three steps, 180/240/300, setting `--album-column`) with two reserved slots naming
  Sort and Filter, in the hub gallery's header cluster beside Download and Select, persisted per device in a COOKIE
  the hub page reads and paints inline (an honest first paint, the events-view toggle's precedent; the option's own
  word was localStorage, which would repaint the album after hydration on every load: his to overrule); the guest
  album's row mounts the control only when `guest-chrome` round two rules (the guest chrome is held).
- `ConfirmSwitch`: the glyph and the deferred-open dance once (the `setTimeout(0)` dismissable-layer dodge kept and
  explained); the two hand-rolled pairs in the uploads section retire into it.
- Tests (`// @contract-for:`): the skeleton's three shapes; the bar (icons with accessible names, the tooltip's motion
  attribute from order, reduced motion, the house press feedback on every icon button: `active:scale-90
  motion-reduce:active:scale-100`, bible 12); the control (three steps, the knob, persistence, the press class);
  `ConfirmSwitch` (asks on the edge it names, never on the other); `event-hub.test.tsx` green; `lab:smoke` whole;
  the gate.
- Red-team on the alias: the hub gallery's bars, cluster and the Studio's skeleton are Will's (signed in); signed out
  in the pane: nothing of this lane shows.
- His to overrule: the reserved slots' words; the slide's distance; the skeleton's shapes; the cluster's order.

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

- none: every open call was one the brief already named as "his to overrule" (below), not a genuinely new
  one-way door. Built the recommended answer in each case and listed it there for his eye on the alias.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/host-app.md`: the "Require accounts to upload" bullet now names `ConfirmSwitch` instead of
  describing the hand-rolled `setTimeout` dance directly; "Moderation & curation"'s bulk-controls paragraph
  names the shared `BulkBar` (icons, sliding tooltips) in place of the old worded description, and records
  the select-mode header-slot fix; "Album bulk-select" now describes `BulkBar`/`GalleryBulkBar` mounted in
  the section header's own action slot (never a floating bar, which retired with `event=hub` and left select
  mode with nothing there until this lane); "The album" bullet gains the tile-size cluster (`--album-column`,
  the `pr_tile_size` cookie, the persistence overrule) as its own `★` paragraph; the `loading.tsx` bullet
  names `RouteSkeleton` and its three shapes, the Studio's first.

## Deferred (ROADMAP one-liners, bucket named)

- Design system: `navigation-menu.tsx`'s cross-slide still spells `data-[motion=...]` inline; a DRY follow-up
  swaps it onto `floating-layer.ts`'s new `floatingCrossSlide` (identical values, no visual change) once a
  lane owns that file.

## Handoff (replaces the chat report)

- The wiring landed at `73d075ec`, pushed; synced (merged, never rebased) with `launch-prep` at `baf0ef15` —
  origin had moved substantially past the cut (glass-wiring, guest-wiring, door-wiring and admin-wiring all
  merged, plus their round-two/follow-up tracks) by the time this lane finished. Four merge conflicts, all in
  shared registry files other lanes also touched (`docs/design/library.md`, the components `gallery-demos.tsx`,
  `specimens.generated.json`, `rules.generated.json`); the generated three were resolved by regenerating on
  the merged tree rather than hand-merging JSON, and the one hand-authored conflict (an import list) kept
  both sides' names. One small commit rides on top of the sync (`230e6023`): the sliding tooltip's
  from-start/from-end direction, checked live in Chrome for the Handoff below but missing as a real test
  until this commit added it (`fireEvent.focus`/`.blur`, reliable in jsdom where a hand-dispatched
  PointerEvent sequence raced Radix's own state machine live) — `design:rules` regenerated for its one new
  contract title.
- Gates on the synced tree, each its own exit code, run again after that last commit: `design:rules` ok (178
  components, 94 indexed, 1268 contracts), the specimen collector ok (140 specimens on 101 entries),
  `typecheck` ok, `lint` ok (8 known warnings, 0 errors), `test` ok (283 files, 2999 passed, 1 skipped — the
  ledger's pre-existing `stands` failure at the cut is gone post-merge, not this lane's fix), `build` ok (255
  pages). `pnpm lab:smoke --base :3135` ok (430 checks, 0 failing). `pnpm lab:demo --board app-vocabulary
  --base :3135` ok (0 open steps to press: this board's asks all draw their options inline rather than
  through a pressable step sequence).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = every path this manifest owns, plus:
  - `src/app/(app)/dashboard/[eventId]/actions.ts` and `.../page.tsx` (unowned, unclaimed by any open
    manifest): one small Server Action (`setTileSizeAction`, mirroring `dashboard/actions.ts`'s
    `setEventsViewAction` byte for byte) and reading + threading the `pr_tile_size` cookie, because the
    brief's own cookie mechanism ("the hub page reads and paints inline") has no other home — `EventGallery`
    cannot read `next/headers` itself.
  - `src/components/app/event-feed/review-section.tsx` (unowned): one gating removed. It read
    `action={!selectMode ? <ReviewActions triage={triage} /> : undefined}`, which blanked the header's action
    slot the instant a host entered select mode — no visible Hide, Approve or Cancel. `ReviewActions` now
    draws both its own faces (unchanged externally), so the gate was strictly wrong once this lane's `BulkBar`
    face existed; left as found, my own Delete/Hide wiring would have shipped dead.
  - `src/app/(dev)/design/rules/component-notes.ts`, the four `gallery-demos.tsx`/`interactive-demos.tsx`
    pairs (`components/`, `patterns/`), `rules.generated.json`, `specimens.generated.json`,
    `docs/design/library.md`: the shared, additive design-registry files every lane appends to per the
    ownership rules ("every new component gets its `for` line... so it lands in the Library"), not a
    per-lane exception.
- The items, one line each:
  - `empty-states=stands`: nothing wired (the earlier ruling stands; not this board's to touch).
  - `loading=asneeded`: wired. `RouteSkeleton` (three shapes: pulse, hub, the Studio's first); the two
    existing `loading.tsx` files became it and the Studio gained its own. Lands in the Library as
    `/design/library/route-skeleton` (patterns, `new`).
  - `tile-grammar=stands`: nothing wired here (glass-wiring's file; it rewrites every tile's marks anyway).
  - `bulk-toolbar=icon`: wired. One `BulkBar` behind `ReviewActions` and `GalleryBulkBar`, icons with an
    instant sliding tooltip (`shared/tooltip-slide.tsx`, `floatingCrossSlide` lifted into
    `floating-layer.ts`), mounted behind a hydrated flag. `bulk-bar.tsx` sits outside the library's indexed
    directories (contract-only; `ReviewActions`/`GalleryBulkBar` are its real, visible callers).
  - `gallery-controls-home=cluster`: wired. `TileSizeControl` (three steps + two reserved slots) in the hub
    gallery's header, beside Download and Select. Lands as `/design/library/tile-size-control` (patterns,
    `new`).
  - `gallery-controls-persistence`: the ruled answer (`device` = localStorage) overruled to a cookie — see
    "calls his to overrule" below.
  - `confirm-switch=primitive`: wired. `ConfirmSwitch` owns the glyph and the deferred-open dance;
    `uploads-section.tsx`'s two hand-rolled pairs retired into it. Lands as `/design/library/confirm-switch`
    (components, `new`).
- Calls his to overrule on the alias, one line each:
  - `gallery-controls-persistence`: built as a cookie (`pr_tile_size`, `tile-size-cookie.ts`), not the ruled
    localStorage. A `--album-column` change reflows the whole grid's tile height, and painting the wired
    default server-side then resizing after hydration is a worse flash than the events-view toggle's own
    cards-to-rows swap that `device=localStorage` was itself weighed against; `events-view.ts`'s cookie
    pattern is the direct precedent. Still per-device, no account, no migration — the ruling's INTENT holds,
    only the mechanism changed.
  - The reserved slots' words ("Sort", "Filter"), the slide's distance (32px, the nav's own cross-slide
    value, lifted verbatim), the skeleton's three shapes (the Studio's especially — new design, not
    previously drawn in detail), and the cluster's order (Download, tile size, Select) — all named in the
    brief as his to overrule; built on the recommended answer in each case.
  - The confirm-switch glyph (`ShieldCheck`): matches the sandbox exploration's own mock exactly, never
    re-picked.
  - Two structural fixes beyond the seven asks, both gaps this lane's own wiring would otherwise have shipped
    dead: the Review room's select-mode header went empty before this lane (see the lane-check exception
    above), and the Gallery's select mode had NO bulk-bar mount point anywhere in production since the
    floating `EventFeedActionBar` retired with `event=hub` — `event-gallery.tsx`'s header now swaps to
    `GalleryBulkBar` there. Neither changes what a host can already do; both make an existing, unreachable
    path reachable.
- The help articles this lane makes stale: none. Every changed control keeps its existing label and copy
  (`Require accounts to upload`, `Review uploads before they appear`, `Add photos`, `Download all`,
  `Select`, `Deleted`); the tile-size cluster is new surface no article describes yet, not a description
  that turned wrong.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the sliding tooltip's FEEL (confirmed mechanically live — direction, the skip-delay window,
  the motion attribute — via focus-driven checks in Chrome, since the lab's specimen iframes portal radix
  content to the outer page and pointer-event dispatch raced Radix's own state machine; motion feel itself is
  never tooling-judgeable); the Studio's skeleton shape at `/dashboard/<event>/reel` mid-load; the tile-size
  cluster's real crowding at 375 on the live hub gallery (his own worry, deferred to `gallery-controls` round
  two, worth a glance regardless); the ConfirmSwitch dialog copy on both settings toggles.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `app-vocabulary` r1 wired whole: one `RouteSkeleton` (pulse,
hub, the Studio's first skeleton) replacing both existing `loading.tsx` files; the shared `BulkBar` behind
`ReviewActions` and `GalleryBulkBar` (icons, an instant sliding tooltip via the new `floatingCrossSlide` and
`tooltip-slide.tsx`, mounted behind a hydrated flag) with two structural fixes riding along (Review's
select-mode header was empty, Gallery's select mode had no bulk-bar mount at all); `ConfirmSwitch` retiring
uploads-section.tsx's two hand-rolled confirm dances; the gallery's tile-size cluster persisted in a device
cookie, overruling the board's own localStorage answer (an honest first paint). `empty-states` and
`tile-grammar` stand on earlier rulings. Calls his to overrule in the CHANGELOG. `board: app-vocabulary`
retires with this merge.
