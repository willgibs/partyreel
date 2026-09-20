---
track: guest-wiring
status: handed-off       # open -> handed-off; deleted in the merge commit that integrates it
cut: "c935f072"          # the launch-prep SHA the branch was cut from
board: guest-shape     # wiring; round two on the chrome and the welcome is another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/entry-shell.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/entry-modal.test.tsx
  - src/components/guest/entry-step-transition.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/live-gallery.css
  - src/components/guest/ghost-grid.tsx
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/gallery-empty-state.test.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/guest-upload.tsx
  - src/components/guest/guest-share.tsx
  - src/components/guest/report-dialog.tsx
  - src/components/ui/sheet.tsx
  - src/lib/guest/
  - src/lib/db/mutations/guest-media.ts
  - src/app/(guest)/e/[token]/
  - src/app/api/guests/gallery/route.ts
  - src/app/api/guests/remove/
  - src/app/api/guests/mine/
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guest-shape.json
  - docs/design/rulings.md
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/shared/masonry.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/db/types.ts
  - supabase/migrations/20260609150000_remove_my_upload.sql
  - supabase/migrations/20260920090000_remove_my_upload_by_session.sql
  - docs/systems/database-security.md
  - src/app/(dev)/design/sandbox/guest-shape/
---

# lp/guest-wiring

**Goal.** Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the sixth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `806695d1`)

- Owns: `src/components/guest/entry-shell.tsx`, `entry-modal.tsx`, `entry-modal.test.tsx`, `entry-step-transition.tsx`,
  `event-experience.tsx`, `live-gallery.tsx`, a new `live-gallery.css` (the arrival glow, a lane-owned sheet like the
  river's), `ghost-grid.tsx` (retired), `gallery-empty-state.tsx` and its test, `save-account-prompt.tsx`,
  `guest-upload.tsx` (the Save offer's placement only), `guest-share.tsx` and `report-dialog.tsx` (onto the Sheet);
  `ghost-grid.tsx` stays ON DISK with a head comment naming the guest-shape board that draws it (never deleted);
  `src/components/ui/sheet.tsx`; `src/lib/guest/`; a new `src/lib/db/mutations/guest-media.ts` (every database call of
  this lane lives there, the DRY rule); `src/app/(guest)/e/[token]/` (the page, a new `actions.ts`);
  `src/app/api/guests/gallery/route.ts`; new `src/app/api/guests/remove/route.ts` and `src/app/api/guests/mine/route.ts`;
  `docs/systems/guest-flow.md`. (`ui/floating-layer.ts` is vocab-wiring's.) The Handoff's stale list names the two
  legal lines that still say an anonymous uploader asks the host (`legal-privacy.tsx:515-520`, `legal-terms.tsx:123`). Reads: `entry-steps.ts`'s consumers,
  `enter-event-prompt.tsx` (door-wiring's, composed as today through its export), the seam's props, the sandbox
  `guest-shape/` (never edits: round two's).
- The door: welcome then gate, the sequence untouched (`entry-steps.ts`), and its SHELL UNTOUCHED too: "not this
  sheet design" withholds the shell, so it is neither rebuilt nor restyled here; its design (with the demo's welcome,
  which he also says "could be redesigned") is re-asked in guest-shape round two beside the chrome. The four guest
  dialogs take the ruled Sheet (`dialogs=stands`): Invite and Download all now, with nothing typed in them; Save and
  Report too, as ruled, with the risk written in the Handoff: the responsive Sheet's phone half has never held a
  focused input on a real iPhone (vaul's `repositionInputs` is why the door kept its engine, `entry-shell.tsx:23-33`),
  the lane checks it in the pane and on the alias, and if the keyboard covers the field the Sheet's phone half becomes
  vaul-backed as one follow-up rather than a per-dialog exception. The river replaces `GhostGrid` on the locked page
  at the empty album's depth.
- The arrival (`live=land`): `reconcile-gallery-items.ts` reports ids new since the last snapshot; `live-gallery.tsx`
  holds them for the glow's life and passes `arrivedIds` through the seam; the tile grows into ONE column under a
  glow that fades and only that column re-flows, which the glass lane's explicit column assignment makes possible
  (CSS `columns` are column-major, so a head insert would shift every tile: the ruling as drawn cannot land on them;
  until the glass lane merges, an arrival lands in the seam's `prefix` row, glowing, and the columns adopt it on the
  next natural refresh); reduced motion a plain appearance.
- Save after upload: the block above the album loses Save (`event-experience.tsx:373-378`); the after-upload card is
  the one offer, in the door's voice through `SaveEventButton` (door-wiring's wear) as today.
- A guest's own photographs, removable ("A guest can delete any photo they've personally uploaded, ever"): signed in,
  a new `removeMyUploadGuestAction` in `(guest)/e/[token]/actions.ts` calling the existing `remove_my_upload` (the
  guest arm covers claimed rows), "mine" computed server-side in the page (one admin-client read of the media ids
  whose guest row belongs to the user) and passed as `canDelete` through the seam, never in the gallery payload or its
  ETag (the fingerprint is per access, not per viewer); anonymous, the RPC `remove_my_upload_by_session(p_session_token,
  p_media_id)` APPLIED BY THE ORCHESTRATOR AT THE CUT from this spec so the lane's call typechecks against generated
  types (SECURITY DEFINER, `search_path` empty, EXECUTE revoked explicitly from `public`, `anon` and `authenticated`
  and granted to `service_role` only; its body requires `media.guest_id -> guests.session_token = p_session_token`,
  `guests.user_id IS NULL` (a claimed row belongs to the account path: a shared device's stale token never deletes a
  signed-in person's photograph), `guests.event_id = media.event_id`, the event not deleted; a rolled-back RPC check
  and `get_advisors` after, the function added to the accepted advisor set), reached through
  `POST /api/guests/remove` on the admin client behind the join limiter, idempotent on already-removed, marking
  `removed_by_uploader` so the bin and `restore_media` never see it; "mine" for an anonymous guest comes from the
  SERVER too (`POST /api/guests/mine`, the token in the body, returning the session's media ids, cached in
  `live-gallery.tsx`), never a client list, so uploads made before this lands are covered; sign-in claims the rows
  and the account path takes over. The migration is PROPOSED in the Handoff as SQL and applied by the Orchestrator.
  Never: an `anon` grant, a client-asserted mine, the token in a URL, a delete of a row with no guest.
- Tests: `entry-modal.test.tsx` on the Dialog branch; the arrival ids (pure); the remove and mine routes (a wrong
  token 403, a foreign media 404, idempotent; mine never lists another session's ids); `gallery-empty-state` green;
  the gate; `lab:smoke` whole.
- Red-team on the alias at 375 in the pane, signed out: the disposable event's door (welcome, then the gate, on the
  sheet; the desk centre at 1440), the locked page's river, a photograph arriving (a second tab uploads; the glow),
  Save absent above the album and present after the first upload, the anonymous Remove on an own upload and its
  absence on another's; the signed-in Remove is Will's.
- His to overrule: the door's shell left exactly as it is until round two; Save and Report on the Sheet before the
  iPhone check; the river on the locked page at the same depth; the glow's life; the anonymous remove being
  device-bound; the removal final for the host.

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

- **None that stopped the lane.** Every open call in the brief was taken on its recommended answer and is listed
  under "Calls his to overrule" below. One thing IS the Orchestrator's rather than Will's, and it is red on the gate:
  `src/app/(dev)/design/review/ledger.test.ts` fails at the cut with `guest-shape/dialogs: the ledger stores
  "stands", which is not one of the ask's options: expected [ 'today', 'sheet', 'inline' ] to include 'stands'`.
  Will answered `dialogs=stands` but the `dialogs` ask in `sandbox/guest-shape/spec.ts` was never badged with the
  `overtaken` `STANDS` option. Verified pre-existing (the same failure on the pristine cut, `git stash` and re-run);
  both files are outside this lane (`sandbox/guest-shape/` is a READ, "round two's"). **Recommended:** the
  `overtaken-2` desk pass badges the ask, or the Orchestrator adds the one option line.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md` "Flow": the action block is a full-width Add over a full-width `[Invite]` row;
  ★ Save is not in it (`account=after`, with where the offer went); ★ the guest's overlays wear the one responsive
  Sheet, which of the four are on it and which are not, with the iPhone-keyboard risk on Report.
- `docs/systems/guest-flow.md` "State follows `visibility`": the `password` bullet now names the ghosted RIVER
  (`GhostRiver`) instead of the ghost grid, says the frames are stand-ins, and records that `GhostGrid` stays on
  disk for the board.
- `docs/systems/guest-flow.md` "Empty state": ★ the fade lives once, in `GhostRiver`, because the locked page draws
  the same picture.
- `docs/systems/guest-flow.md` "Live gallery": two new bullets — **The ARRIVAL** (what may and may not glow, where
  the growth comes from, and that "only that column re-flows" is NOT landed) and **A guest's own photographs,
  removable ever** (the two identities, "mine" as a server read on both paths, why it is out of the ETag).
- `docs/systems/guest-flow.md` "Invariants": one new invariant — the own-photograph removal is never a client claim
  and never a client list (no `anon` grant, no token in a URL, a claimed row untouchable by the session path).

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** the arrival's ruled growth — "a new photograph grows into ONE column and only that column re-flows" needs
  `MasonryColumns`' explicit column assignment (CSS columns are column-major, so any head insert shifts every tile);
  land it on top of `glass-wiring`. The glow ships meanwhile.
- **Now:** "Download all" (`ExportDialog`) and Save (`SaveEventButton`) onto the responsive Sheet — the other two of
  `dialogs=stands`' four. Both are shared with host surfaces, so neither is in this lane's `owns`.
- **Now:** the responsive Sheet's phone half on a real iPhone — a focused input (Report's textarea) and the home
  indicator (the constant carries no `env(safe-area-inset-bottom)`, so the sheet's last row sits on the indicator).
  If either bites, make the phone half vaul-backed once in `ui/sheet.tsx` for every consumer, never a per-dialog
  exception.
- **Now:** a component pin for `LiveGallery`'s own-photograph wiring (the routes, the pure arrival ids and the
  lightbox's `canDelete` are each pinned; the component that joins them is not — it needs `use()` + Suspense +
  fetch + the Server Function stubbed).

## Handoff (replaces the chat report)

- Cut from `origin/launch-prep` at `0ad0c32d` (the seam `c935f072` is in it); the board is Will's sixth batch on
  build `806695d`. **No sync-merge commit: `origin/launch-prep` had not moved** at the handoff (still `0ad0c32d`).
  The head is the one plain commit above this manifest's own; the chat line names it.
- Gates, each on its own exit code, on the unsynced-because-unmoved tree: `design:rules` **0** · specimens **0**
  (131 specimens on 94 entries) · `typecheck` **0** · `lint` **0** (8 warnings, the baseline) · `test` **1** ·
  `build` **0** (255 pages) · `pnpm lab:smoke --base http://localhost:3132` **0** (403 checks, 0 failing).
  No `lab:demo`: this is a production lane, no board.
  ⚠ **`test` is 1 for ONE failure that was already red at the cut and is outside this lane**:
  `design/review/ledger.test.ts` on `guest-shape/dialogs` storing `stands` against an ask that never declared it
  (proved pre-existing by stashing every change and re-running; details under Questions). **2,852 pass, 1 skipped,
  265 of 266 files green**; every test this lane wrote or touched is green.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/systems/guest-flow.md` · `src/app/(dev)/design/rules/rules.generated.json` ·
  `src/app/(guest)/e/[token]/actions.ts` · `src/app/(guest)/e/[token]/page.tsx` ·
  `src/app/api/guests/mine/route.ts` + `route.test.ts` · `src/app/api/guests/remove/route.ts` + `route.test.ts` ·
  `src/components/guest/event-experience.tsx` · `gallery-empty-state.tsx` · `ghost-grid.tsx` · `guest-share.tsx` ·
  `live-gallery.css` · `live-gallery.tsx` · `report-dialog.tsx` · `src/lib/db/mutations/guest-media.ts` ·
  `src/lib/guest/arrival-glow.ts` · `src/lib/guest/reconcile-gallery-items.ts` + `.test.ts` (+ this manifest).
  **One exception, and it is a gate step's own output:** `src/app/(dev)/design/rules/rules.generated.json`, two lines,
  the regeneration `pnpm design:rules` demands after `GhostRiver` joined `gallery-empty-state.tsx`'s exports.
  `src/components/ui/sheet.tsx` was owned and NOT touched: the responsive sheet hub-wiring landed already does
  everything `dialogs=stands` asks, and the door's `desk` prop the verdict map sketched is unnecessary while the
  door's shell is withheld.
- The items, one line each:
  - `nothing=river`: KEPT. The locked page draws `GhostRiver` at the empty album's depth; `GhostGrid` retired on disk
    with a head comment naming the board that still imports it. The Library entry is `GhostRiver`, exported from
    `gallery-empty-state.tsx` as the ONE home of the ghost fade.
  - `live=land`: KEPT IN PART. The glow lands (`newArrivalIds` → `arrivedIds` → `data-arrived` → `live-gallery.css`,
    one duration in `lib/guest/arrival-glow.ts` written out as `--arrival-glow-ms` so the sheet and the state cannot
    drift). The ruled GROWTH into one column does not: CSS columns are column-major and the seam's `prefix` row moves
    the album exactly as a head insert does, so it buys nothing until the glass lane assigns columns (deferred above).
    The tile's existing mount entrance is the growth meanwhile; reduced motion is a plain appearance.
  - `account=after`: KEPT. Save leaves the block above the album; the after-upload card is the one offer, unchanged,
    still wearing door-wiring's `SaveEventButton`. Invite takes the row's full width (a 2-col grid with one button in
    it is a row with a hole in it); the demo's blank placeholder goes with it, which is the slot `demo-wiring` fills.
  - `yours` (his rule): KEPT WHOLE, both identities. Signed in → `removeMyUploadGuestAction` on the existing
    `remove_my_upload`; anonymous → `POST /api/guests/remove` on the service-role-only
    `remove_my_upload_by_session` behind the join limiter. "Mine" is a server read on both paths (`listAccountMediaIds`
    in the page RSC, `POST /api/guests/mine` for a session token), never a client claim and never in the gallery
    payload or its ETag. Every database call of the lane is in `src/lib/db/mutations/guest-media.ts`.
  - `dialogs=stands`: KEPT FOR TWO OF FOUR. Invite and Report wear `SheetContent responsive`. The door keeps vaul
    (his "not this sheet design" withholds the shell); Download all and Save live in other lanes' files (deferred).
  - `door=today` and `chrome=dock`: NOT WIRED, correctly. The welcome-then-gate sequence already ships
    (`entry-steps.ts` untouched, `entry-modal`/`entry-shell`/`entry-step-transition` untouched, their tests green);
    the dock is round two's.
- Calls his to overrule on the alias, one line each:
  - The arrival is a WHITE LIGHT, not a state colour: an inset 2px rim plus an inner wash, 2 seconds, up in 200ms and
    fading the rest. The guest's own landing keeps the green `--success` check, so the two marks stay different things.
  - An arrival lights for a photograph SOMEBODY ELSE added. A guest's own upload is excluded (it has the check);
    a held item the host approves later is not excluded, and does glow.
  - The seed render never glows, a rolled presign never glows, and a tab that slept through the evening lights the
    whole burst it wakes to rather than nothing.
  - Invite alone runs the full width of the secondary row (rather than staying half-width with a gap beside it).
  - The removal is final for the host (his own answer) and SILENT to them: no toast, no trace in the bin, no restore.
  - The anonymous removal is device-bound, and deliberately so: a shared phone's stale token can never delete a
    signed-in person's photograph (a claimed guest row is untouchable by the session path).
  - A failed removal restores the tile and says "Couldn't remove that photo." rather than leaving the gap.
  - Report's sheet puts the primary FIRST and Cancel under it (a panel's footer stacks; a dialog's row of two does not).
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them):
  - `content/help/save-an-event-and-find-your-uploads.mdx` — "This is the only place a guest can delete their own
    upload; the event page itself has no delete" is now false, and so is "If you can't (the upload is anonymous...)".
    The album itself now carries it, signed in or not.
  - `content/help/report-a-problem-as-a-guest.mdx` — "if it's your own photo ... and you have an account, you can
    also delete it yourself from your dashboard" understates it: from the album, and without an account.
  - `content/help/password-protect-your-event.mdx` — "over a ghosted grid" is now the ghosted flow.
  - ★ **Two LEGAL lines, not help, and they now UNDERSTATE a right we grant** (the brief named them; neither file is
    in this lane's `owns`, so both are left for their owner): `src/lib/constants/legal-privacy.tsx:515-520` still
    says "If you uploaded without signing in, ask the host, who can remove the item instantly" — an anonymous guest
    removes it themselves now, from the album; and `src/lib/constants/legal-terms.tsx:123` says "A signed-in guest
    can delete their own uploads from their dashboard" and "A guest who uploaded without signing in can ask the
    host" — the album carries it either way now, and the "final and the host cannot restore it" sentence beside it
    is still exactly right for both. The comment pin at `legal-privacy.tsx:514` ("anonymous uploaders ask the host")
    goes with the line.
- Assets requested from Will: none. The locked page and the empty album share the nine local `public/guest-ghost`
  WebPs that already ship.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none**. `remove_my_upload_by_session` was applied by
  the Orchestrator at the cut and is in the accepted advisor set; `get_advisors` (security) re-run at the handoff
  confirms it appears in NEITHER 0028 nor 0029 (5 and 31 findings, unchanged), which is the invariant.
  A rolled-back contract check against the real database passed eleven ways: an unknown token lists nothing, a CLAIMED
  row is invisible to the anonymous list and `not_found` to the session RPC, another session's photograph is
  `not_found`, a short token `unauthorized`, the repeat idempotent (`already_removed`), the row left `removed` +
  `removed_by_uploader` with `purge_at` derived, and the neighbour's photograph untouched.
- Look at first: **the guest album at 375 and at 1440.** (1) The row under Add photos: Invite alone, no Save — then
  add a photograph and meet the Save offer where he asked for it. (2) A photograph arriving from a second tab: the
  white rim rises and fades and the album re-flows around it (the flow of the reflow is the part `glass-wiring`
  finishes). (3) Invite and Report: a bottom sheet in a hand, a side panel at a desk — ★ **Report's textarea on a real
  iPhone is the one thing this lane could not test**, so please tap it and watch whether the keyboard covers it.
  (4) **The locked password page's river is the one surface this lane could not reach**: no password event exists and
  minting one needs a host session a lane cannot hold, so it wants the alias signed in. (5) The signed-in Remove on
  your own guest upload, in the lightbox, is yours too: a lane port never reaches OAuth. Signed out, the lightbox
  correctly shows Close / Next / Like / Save / Share and no Delete (verified locally).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). `guest-wiring` wired five of `guest-shape`'s seven verdicts and
left the door's shell exactly where his "not this sheet design" put it. The locked page lost its ghost grid for the
empty album's own flow, at one depth owned once (`GhostRiver`); the arrival became a white rim that rises and fades
over a photograph somebody else added, held for one number that the sheet and the state both read; Save left the
block above the album for the offer that waits until a guest has contributed; a guest's own photograph became
removable for ever, by account or by device session, with "mine" read on the server both ways and never in the
gallery's ETag; and Invite and Report joined the one responsive Sheet. The ruled growth into a single column, and
the other two dialogs, are named as follow-ups rather than half-built.
