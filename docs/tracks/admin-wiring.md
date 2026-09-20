---
track: admin-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c935f072"          # the launch-prep SHA the branch was cut from
board: admin           # retires at this lane's merge (the fixtures survive as a Library demo)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/page.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/error.tsx
  - src/app/admin/not-found.tsx
  - src/app/admin/accounts/
  - src/app/admin/albums/
  - src/app/admin/applicants/
  - src/app/admin/announcements/
  - src/app/admin/exports/
  - src/app/admin/forensics/
  - src/app/admin/jobs/
  - src/app/admin/metrics/
  - src/app/admin/reels/
  - src/app/admin/security/
  - src/app/admin/support/
  - src/components/admin/admin-shell.tsx
  - src/components/admin/admin-nav.tsx
  - src/components/admin/operator-alerts.tsx
  - src/components/admin/applicants-list.tsx
  - src/components/admin/announcement-compose.tsx
  - src/components/admin/announcement-list.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/admin/admin-bar.tsx
  - src/components/admin/admin-rail.tsx
  - src/components/admin/health-band.tsx
  - src/components/admin/admin-palette.tsx
  - src/components/admin/inbox-pane.tsx
  - src/components/admin/destructive-sheet.tsx
  - src/components/admin/queue-list.tsx
  - src/components/admin/sparkline.tsx
  - src/components/admin/metric-card.tsx
  - src/components/admin/metrics-charts.tsx
  - src/components/admin/metrics-charts.lazy.tsx
  - src/components/admin/support-list.tsx
  - src/lib/admin/
  - src/lib/jobs/health-summary.ts
  - src/lib/db/queries/metrics.ts
  - src/components/ui/table.tsx
  - src/components/ui/table.test.tsx
  - src/components/ui/command-palette.tsx
  - src/components/ui/command-palette.test.tsx
  - src/components/ui/badge.tsx
  - src/app/(dev)/design/sandbox/admin/
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/admin.json
  - docs/design/rulings.md
  - src/app/admin/reports/
  - src/components/app/report-review.tsx
  - src/components/admin/triage-status-control.tsx
  - src/lib/moderation/
  - src/components/ui/sheet.tsx
  - src/app/(dev)/design/sandbox/help-center/
  - src/lib/content/help-search-rank.ts
  - src/app/(dev)/design/sandbox/admin-triage/spec.ts
---

# lp/admin-wiring

**Goal.** Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the sixth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `806695d1`)

- Owns, EXPLICITLY (the manifest test treats a prefix as covering everything under it, so no `src/app/admin/` or
  `src/components/admin/` prefix): `src/app/admin/page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, and the
  folders `accounts/`, `albums/`, `applicants/`, `announcements/`, `exports/`, `forensics/`, `jobs/`, `metrics/`,
  `reels/`, `security/`, `support/` (never `reports/`, admin-triage's); in `src/components/admin/` the files
  `admin-shell.tsx`, `admin-nav.tsx`, `operator-alerts.tsx`, `applicants-list.tsx`, `announcement-compose.tsx`,
  `announcement-list.tsx`, `moderation-grid.tsx` (its Remove onto the sheet; its tile untouched) and the new
  `admin-bar.tsx`, `admin-rail.tsx`, `health-band.tsx`, `admin-palette.tsx`, `inbox-pane.tsx`, `destructive-sheet.tsx`,
  `queue-list.tsx`, `sparkline.tsx` (never `triage-status-control.tsx`, `triage-filter.tsx`, `mfa-*.tsx`);
  `src/lib/admin/` (new `palette.ts`, `pending.ts`), `src/lib/jobs/health-summary.ts` (a
  `readJobHealth()` beside the wrapper), `src/lib/db/queries/metrics.ts` (the split), the new `src/components/ui/table.tsx`
  and `src/components/ui/command-palette.tsx`, `src/components/ui/badge.tsx` (RELEASED for two additive variants,
  `success` and `warning`), `src/app/(dev)/design/sandbox/admin/` and its registration lines (the SPEC retires at handoff; the board's fixtures survive as a Library demo rendering the production bar, rail, band and sheet credential-free, so `lab:smoke` and `lab:demo` keep proving the portal nobody can sign into on a lane's port), the
  "What binds" and "## Surfaces" sections of `docs/systems/admin-observability.md` (the second describes the dropdown and the bell this lane replaces). HANDS OFF: `src/app/admin/reports/**`,
  `src/components/app/report-review.tsx`, `triage-status-control.tsx`, `src/lib/moderation/` (admin-triage's lives),
  the MFA gate (`layout.tsx:37-63` renders outside the shell on purpose: no rail before AAL2). `OperatorAlerts` and
  `nav.ts`'s exports survive (the admin-triage board imports them).
- NO audit table: "write it down" was the `arm` option he did not pick, and the ROADMAP defers the operator log to
  that grammar; nothing is applied at the cut. The lane PROPOSES an `admin_actions` table in its Handoff as a
  Question (the columns, the `forensic_audit_log` posture, who writes it) and builds nothing on it.
- The shell: `admin-bar.tsx` (h-11: the logo, a crumb from NAV and the pathname, a live tag from `VERCEL_ENV`, the
  health chip, an initial opening a menu with the email and sign-out; the `text-[10px]` Ops badge replaced by a ladder
  step), `admin-rail.tsx` (a 232 px column at `lg` from `navGroups()`, counts on Support, Applicants, Reports and Jobs,
  a "Search ⌘K" row at the top; below `lg` the existing dropdown stays), `health-band.tsx` under the bar, rendered only
  when a job is unhealthy or the heartbeat unreadable (never "1 job" for an unreadable read), the pending counts read
  once through React `cache()` for the layout and the home.
- The home: `getPlatformMetrics()` (`queries/metrics.ts:64`) SPLIT into its database half (exported; the profiles
  slice with tier, `created_at`, `last_active_at`, the link stats, the media counts, `signupTrend`) and its Stripe
  half, so the home reads the first and `/admin/metrics` both (no new query file): four figures with their fortnight
  delta (Accounts, Active hosts, Uploads, Paid subscribers) on the existing `MetricCard`, one inline-SVG signup
  sparkline (`buildSignupTrend(rows, now, 14)` reused), and beneath them THE SAME QUEUE the board's console drew (a
  ranked list, worst first: kind, what, how long it has waited, the action; a report's row named by kind and age
  only, its anatomy admin-triage's); the nine-card grid goes; Exports joins NAV under Operations.
- The palette: `ui/command-palette.tsx` (Root/Input/List/Group/Item/Footer on the raw Radix Dialog, the combobox
  and keyboard model of the lab's help-centre palette (`sandbox/help-center/`; no production help palette exists)
  rebuilt as a primitive, skin-agnostic), `admin-palette.tsx` on it with an index of surfaces (NAV), actions (static jumps to a surface anchor) and
  accounts through a new AAL2-gated `searchAccountsForPaletteAction(q)` (limit 8); the palette jumps, never acts.
- Density: `ui/table.tsx` (shadcn, hand-checked) with `TableRow tone` emitting `data-tone` (a tint on the row, the
  leading edge as an inset shadow on the first cell; `tableRowVariants` exported so the inbox list shares it) for
  accounts, exports, jobs, reels and forensics rows; `inbox-pane.tsx` (the list beside the message, `?id=` honoured,
  stacked below `lg`) for Support and Applicants; Reports stays sectioned (admin-triage's "one language" ask).
- Colour: "the same four" reaching the row: `badge.tsx` gains `success`, `warning` and `info` (a running job, blue:
  the board's fourth; the `--info` token pair lands with the seam); the jobs page maps ok to success, running to
  info, missed and attention to warning; the row tone carries a failed run's tint and edge.
- The destructive sheet: `destructive-sheet.tsx` on `Sheet responsive` (`title`, `verb`, `touches[]`, `severity:
  reversible | permanent`, `confirmText` typed only when permanent, `onConfirm`): adopted by delete account (typed;
  the server still verifies), remove media, delete announcement, release hold (replacing the arm-then-confirm), the
  two kill switches and job pause on their OFF edge, run-now for the purge sweep; the two report verdicts are left to
  admin-triage and named in the Handoff.
- Tests (`// @contract-for:`): the palette index, the KPI deltas and sparkline path, the tone maps, the audit names,
  the health reducer, `nav.test.ts` extended (every admin page has an entry); jsdom: the table's `data-tone`, the
  palette's combobox aria and keys, the sheet (every touch listed; confirm disabled until typed only when permanent;
  one `onConfirm`), the inbox pane. `lab:smoke` proves the admin-triage board still draws.
- Verification: the lane cannot sign in as the admin (no credential is ever typed): unit and jsdom tests plus the
  fixtures carry it; the Orchestrator red-teams the admin host's alias signed out (the redirect) and lists the
  signed-in pass for Will (the bar at 44, the rail at 1440 and the dropdown at 375, ⌘K for a surface, an account and
  an action, the home's figures against `/admin/metrics`, the band absent on a good day, the sheet on a disposable
  announcement and a pause of downloads, the audit rows; the typed account delete never exercised).
- His to overrule: the four figures; Exports in NAV; the rail at 232 px (the board's number); the palette's static
  actions; the inbox pane for Support and Applicants only; the `info` fourth colour.

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

- **The `admin_actions` table the brief asked this lane to propose and not build.** Recommended shape:
  `id`, `at`, `actor` (the operator's `auth.users` id), `action` (an enum: `account_delete`,
  `media_remove`, `media_restore`, `announcement_delete`, `hold_release`, `job_pause`, `job_run`,
  `flag_toggle`), `subject_kind` + `subject_id` (never a join, so a row outlives what it names),
  `detail` (free-form jsonb, the sheet's own `touches[]` at the moment of the act), `reversible` (bool).
  Posture: `forensic_audit_log`'s exactly (deny-all RLS, service-role only, written inside
  `requireAdminAction` at the one place each act already funnels through, never from a client, and it
  outlives the row it concerns). The one open product question is RETENTION: the board's `arm` option
  drew "kept for 90 days" and a 90-day cut on an operator log is a deletion job nobody asked for, so
  the recommendation is to keep it forever and revisit when there is a team rather than one operator.
  Nothing in this lane reads or writes it; it is a migration for a later round.
- **Will's own answer, asked on the board and not yet given: is a paid-subscriber delta worth a
  column?** The home's fourth figure has no history to compare against because the Stripe webhook
  writes only the current `tier`. Recommended: leave it as a share ("25% of accounts") until there is
  revenue worth trending, then have the webhook append to a tiny `tier_events` table rather than
  reconstruct from Stripe on every page load.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/admin-observability.md`, "What binds the admin's design": the heading now names both
  dates, and Will's seven verdicts are listed as the rules that bind every surface, with the star line
  that there is NO operator audit table (the `arm` option he did not pick).
- `docs/systems/admin-observability.md`, "## Surfaces": the dropdown-plus-bell paragraph is replaced by
  the shell as built (bar, band, rail, the `lg` split, the full bleed), three star lines (one cached
  read per request and `serverNow()`; an unreadable heartbeat is never a count; the palette jumps and
  never acts), and the destructive-sheet adoption list. The Support / Applicants bullet gains the pane
  and its `?id=`; a new Overview bullet carries the four figures and the queue with the star line on
  the missing delta; the Metrics bullet names the `getPlatformDbMetrics()` split.

## Deferred (ROADMAP one-liners, bucket named)

- **Now**: the components gallery draws TWO "Surfaces" blocks (`album-stream` and friends at the head,
  the original block further down), which is a duplicate React key on every load of
  `/design/library/components`: one of the two is dropped silently. Pre-existing at this lane's cut and
  outside it (both head entries are other lanes'); the fix is one section name.
- **Now**: `docs/tracks/guest-shape-r2.md` fails `docs.test.ts` at `origin/launch-prep` 3e42e12d: a
  heading containing angle brackets renders as an HTML tag, so the rendered id and `headingsOf`'s
  disagree. One heading, the Orchestrator's own manifest.
- **The admin**: the help centre's palette (`marketing/help/help-palette.tsx`, 549 lines) predates
  `ui/command-palette.tsx` and still owns its own combobox and keyboard model; a follow-up folds it onto
  the primitive, which also removes the second global ⌘K listener in the tree.
- **The admin**: the queue's Reports row costs a full `listReports("open")` for one timestamp (the
  presign is local, so it is cheap, but an `oldestOpenReportAt()` head-read in `queries/reports.ts`
  would be honest); the same for the two inbox lists.
- **The admin**: `/admin/reports` keeps its own sectioned shape and the two report verdicts are still
  bare destructive buttons with no confirmation at all (`report-review.tsx:113`,
  `person-report-list.tsx:104`). Deliberately untouched here (admin-triage's lane) and named so the
  sheet reaches them.
- **The admin**: a fortnight of paid-subscriber history (see Questions) and the `admin_actions` table.

## Handoff (replaces the chat report)

- Board commit `5d4d09dc` (the whole lane); synced with `origin/launch-prep` at `3e42e12d` in merge
  commit `8e800240` (it had moved a long way: glass-wiring, guest-wiring and door-wiring all merged).
  Three conflicts, all resolved by hand: `ledger.test.ts` taken WHOLE from launch-prep (the
  Orchestrator had already landed the `stands` fix at `677be39c`, which this lane had found red at the
  cut and fixed the same way); `component-notes.ts` kept BOTH head blocks, glass-wiring's and this
  lane's; the two generated artifacts taken from launch-prep and regenerated.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok, the specimen collector
  ok (137 specimens on 98 entries), `pnpm typecheck` ok, `pnpm lint` ok (8 known warnings, 0 errors),
  `pnpm test` 2971 passing with ONE failure that is not this lane's, `pnpm build` ok (255 pages).
  `pnpm lab:smoke --base http://localhost:3134` ok, 416 checks, 0 failing. `pnpm lab:demo --board admin`
  exits 0 with "no open step to press": the board is ruled whole, so it has no waiting step left.
- ★ THE ONE RED IS PRE-EXISTING AND IS THE ORCHESTRATOR'S. `src/app/(dev)/design/_data/docs.test.ts`
  fails on `docs/tracks/guest-shape-r2.md`, which arrived with `3e42e12d`; proved by running that test
  against a clean checkout of `origin/launch-prep` in this worktree. A heading of that manifest carries
  angle-bracket text, so the renderer eats it as an HTML tag and the predicted id does not match. Every
  other test in the suite is green.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: 63 files, all owned but for the eleven
  below, each with why:
  - `src/lib/type-ladder-policy.test.ts`: ONE entry deleted. `admin-shell.tsx`'s `text-[10px]` operator
    badge is gone (the brief's own line), so its `board` exception counted 1 against 0 and went red.
    The list "only shrinks" and the file asks for exactly this deletion.
  - `src/app/(dev)/design/rules/component-notes.ts`: nine `for` lines at the head, which is the round's
    own ownership rule ("every new component gets its `for` line in `rules/component-notes.ts`").
  - `src/app/(dev)/design/rules/rules.generated.json`, `docs/design/library.md`,
    `src/app/(dev)/design/gallery/specimens.generated.json`: generated by the gate's own commands.
  - `src/app/(dev)/design/gallery/playgrounds.tsx` and
    `(shell)/library/components/gallery-demos.tsx`: `badge.tsx` was RELEASED for the additive variants
    and `gallery.test.ts` refuses a cva axis the gallery and its playground do not both declare, so the
    three new names had to land in all three places or the gate stayed red.
  - `(shell)/library/components/interactive-demos.tsx`,
    `(shell)/library/compositions/gallery-demos.tsx`,
    `(shell)/library/compositions/composition-demos.tsx`: the Library demo the brief demands ("the
    board's fixtures survive as a Library demo... so `lab:smoke` keeps proving the portal nobody can
    sign into"). The manifest named the demo and not the family files it has to live in.
  - `src/components/admin/{destructive-sheet,health-band,inbox-pane}.test.tsx`: three new test files
    beside their components. The brief asks for these jsdom contracts by name; the manifest listed each
    component and not its test.
- The items, one line each:
  - `home=kpi`: wired. Four figures with a fortnight delta, a server-drawn 14-day signup sparkline, and
    the ranked queue beneath; the nine-card grid is gone. Lands in the Library as `admin-shell`'s third
    specimen (the queue).
  - `nav=rail-palette`: wired. A 232px rail at `lg` with pending counts and a Search row; the dropdown
    below `lg`; `ui/command-palette.tsx` as a primitive and `admin-palette.tsx` on it. Lands in the
    Library as `command-palette` and as `admin-shell`'s first specimen.
  - `density=hybrid`: wired. `ui/table.tsx` for accounts, exports, jobs, reels and both forensics
    tables; `inbox-pane.tsx` for Support and Applicants; Reports untouched. Lands as `table`.
  - `colour=rows`: wired. `badge` gains `success`, `warning` and `info`; `lib/admin/tone.ts` is the one
    map; a failure or an overdue run tints its row and takes a 2px leading edge on the first cell
    (measured in both modes: 6 percent wash on a failure, 8 percent on a warning).
  - `destructive=sheet`: wired on nine controls (delete account typed, remove media, delete
    announcement, release hold, the two kill switches, job pause, Run now, plus `GuardedSwitch` as the
    shared OFF-edge wear). Lands as `destructive-sheet`.
  - `health=portal`: wired. `health-band.tsx` under the bar on every page, absent on a good day, plus
    the chip in the bar. Lands as `admin-shell`'s second specimen.
  - `chrome=devtool`: wired. A 44px bar with the crumb, the live tag, the chip and the initial; the
    `text-[10px]` Ops chip retired. NOT in the Library demo, on purpose: its operator menu holds a real
    `signOutAction` form and a gallery page does not get to end the visitor's session.
- Calls his to overrule on the alias, one line each:
  - The four figures are Accounts, Active hosts, Uploads and Paid subscribers, and the fourth carries no
    arrow at all (no history exists to compare against; a plausible one would be invented).
  - "Active hosts" means LAST SEEN in the fortnight, because `last_active_at` is one timestamp.
  - Exports joined NAV under Operations (it was reachable only from the card grid the home retired), and
    `nav.test.ts` now fails on any admin page the nav cannot reach.
  - The rail is 232px, at `lg` and up only; below that the dropdown is the nav, not a fallback.
  - The palette's Actions group is six static jumps to a surface anchor, and the palette never acts.
  - The inbox pane is Support and Applicants only; Reports keeps its sections.
  - `info` (blue) is the fourth state colour, on a running job.
  - Deleting an announcement is `permanent` and asks for NO typing: the only act that types is the one
    with a specific wrong thing to get wrong (an account's address).
  - Run now on the purge sweep is `reversible` in the sheet, because it does tonight's work now rather
    than anything extra.
  - The Library demo leaves the bar out (the sign-out form, above).
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them): none. Every
  surface changed is operator-internal and behind AAL2; `content/help/` describes the host and guest
  product only (checked with `git grep -il "admin\|operator" content/help`: no how-to describes the
  portal).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none applied and none needed. One
  migration is PROPOSED under Questions (`admin_actions`) and deliberately not built.
- Look at first: `/admin` signed in on the alias. The bar at 44 with the crumb and the live tag, the
  rail at 1440 and the dropdown at 375, ⌘K for a surface then an account then an action, the home's four
  figures against `/admin/metrics`, the band absent on a good day, the sheet on a disposable announcement
  and on a pause of downloads. The typed account delete is NOT to be exercised. This lane could not sign
  in (no credential is ever typed on a lane port), so everything above is unit and jsdom tested plus the
  Library demo at `/design/library/compositions` and `/design/library/components`, which is the only
  automated eye there is on a portal nothing can open.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
