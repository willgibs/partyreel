---
track: buttons-wiring
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c75734b9"          # the launch-prep SHA the branch was cut from
board: body-type       # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/button.tsx
  - src/lib/type-ladder-policy.test.ts
  - src/app/(dev)/design/sandbox/body-type/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/download-all-button.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - docs/reviews/body-type.json
  - docs/design/rulings.md
---

# lp/buttons-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/fe056e62.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md`.
- Owns: `src/components/ui/button.tsx`, `src/lib/type-ladder-policy.test.ts`, `src/app/(dev)/design/sandbox/body-type/`
  and the board's registration lines under the retirement exception (`registry.ts`, `boards.ts`, `touchpoints.ts`:
  the `SandboxId` union and `DESK_ORDER` entry go; the RULINGS row rewritten as shipped; `body-type` stays a
  `RulingId`), `docs/systems/design-system.md` (the button line), and BY FILE for the five overrides:
  `src/components/guest/entry-modal.tsx` and `src/components/guest/password-gate.tsx` are `guest-chrome-wiring`'s
  prefix: the two `text-[15px]` retirements there are this lane's EXCEPTION lines, applied after syncing past that
  lane if it lands first, else listed for the guest lane to apply (both Handoffs say which).
- The table by the rule above; every size's icon selector explicit (no size falls back to the base `size-4` by
  accident); `pnpm design:rules`; the `Button` contract test extended with the pairing (icon px = text px + one step,
  per size); `two-faces-policy` and the ladder policy green with the two `board` entries deleted; `lab:smoke` whole
  (dozens of lab files compose `Button`). Red-team on the alias signed out: the guest album's row and the door at
  375 and 1440; the host's Download and Select are Will's.
- His to overrule: the `cta` icon at 18; `sm` text at 12 rather than 14; the five overrides onto `cta`.

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

- none: `pairs=step-up` was concrete enough to wire outright; the one real ambiguity (icon-sm's target) was resolved by measurement, not escalated — see "Calls his to overrule" below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md:620-625` (the button line, inside "Six ways the ladder fails SILENTLY"): refined from "Button's four sizes are a round (`buttons-pairs`) and not a lint" (open) to name the shipped rule (`pairs=step-up`, every icon one Tailwind step over its own text, explicit on all eight sizes) and the `icon-sm` bug it fixed.

## Deferred (ROADMAP one-liners, bucket named)

- none: the brief's whole scope (the pairing, the two ladder-policy exceptions, the board retirement) shipped in this lane; nothing pushed out.

## Handoff (replaces the chat report)

- Board commit `047d9e0b` (the button rung wired, `pairs=step-up`; `body-type` retires), synced with `launch-prep` at merge commit `d4b23e9c` (launch-prep had moved by two `usher/` housekeeping commits since the cut — `usher/journal/2026-09-20.md`, `usher/kit/spawn-prompt.txt` — neither touching this lane's `owns` or `reads`; clean merge, no conflicts).
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code: `design:rules` ok (182 components, 116 with contracts, 18 policies), specimens ok (140 specimens on 101 entries), `typecheck` ok, `lint` ok (8 known warnings, 0 errors — the baseline, none introduced), `test` ok (3083 passed, 1 skipped, 291 files), `build` ok (255 pages) — full logs in `$S/buttons-wiring/{build.log,lab-smoke.log}` (`$S` = this session's scratchpad, printed at boot); `pnpm lab:smoke --base http://localhost:3131` ok (437 checks, 0 failing, run twice — before and after the sync-merge). `pnpm lab:demo --board body-type` was NOT run: the board retires in this same commit (its sandbox directory is deleted), so there is no board left to demo; `lab:smoke`'s per-board pass already exercises every OTHER board's sessions against the wired `button.tsx` (dozens of lab files compose `Button`) and found nothing.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/components/ui/button.tsx`, `src/lib/type-ladder-policy.test.ts`, `src/app/(dev)/design/sandbox/body-type/{board.tsx,fixtures.ts,spec.ts,surfaces.tsx}` (deleted), `docs/systems/design-system.md` — all owned (7 files) — plus 8 more files across four documented exception groups below, each named in this manifest's own brief text or a natural consequence of it:
  - `src/components/ui/button.test.tsx` (new): a sibling contract test for the owned `button.tsx`, not literally in `owns` (which names the one file) but the brief's own words ("the `Button` contract test extended with the pairing") require it; no other of the six lanes' manifests claims this path.
  - `src/components/guest/entry-modal.tsx`, `src/components/guest/password-gate.tsx`: the manifest's own named exception ("BY FILE for the five overrides ... this lane's EXCEPTION lines"). `guest-chrome-wiring` had NOT landed on `launch-prep` as of this lane's boot or its final push (`origin/lp/guest-chrome-wiring` sat exactly at the cut commit `2066b835` throughout, per `git rev-parse`), so the edit applied against its current content rather than after a sync, per the brief's "else listed for the guest lane to apply" fork resolving the other way (this lane wired first). The diff touches only the five buttons' own lines (`size`/`className`), a distinct hunk from anything `guest-shape`'s dock/sheet/mark rewrite is likely to touch; if `guest-chrome-wiring`'s own rewrite happens to land on the SAME lines first, `merge-lane.sh` will flag a real conflict rather than merge silently, and the second lane to land resolves it.
  - `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/touchpoints.ts`: the manifest's own named exception ("the board's registration lines under the retirement exception"); each touched ONLY on `body-type`'s own lines (one import, one array/map entry, the `SandboxId` union line, the `DESK_ORDER` line, the `body-type` `RULINGS` entry rewritten in place) — verified by reading each diff in full before committing.
  - `docs/design/library.md`, `src/app/(dev)/design/rules/rules.generated.json`: generated by `pnpm design:rules` (CLAUDE.md: regenerate after a contract or `touchpoints.ts` change); re-ran on the synced tree and diffed clean (no drift) before this Handoff was written.
- The items, one line each:
  - `pairs=step-up`: wired whole onto `button.tsx`'s `cva` size table — `xs` 12/14, `sm` 12/14 (text moved off `text-[0.8rem]` onto the ladder as `text-xs`), `default`/`lg` 14/16 (unchanged, now explicit), `cta` 16/18, and the four icon-only sizes made explicit by the height they share with a text size (`icon-xs` 14, `icon-sm` 14, `icon` 16, `icon-lg` 16); the board retires (`src/app/(dev)/design/sandbox/body-type/` deleted, `registry.ts`/`boards.ts`/`touchpoints.ts` updated, `body-type` stays a `RulingId` with its `RULINGS` row rewritten as shipped). Lands as: `docs/systems/design-system.md`'s button line (refined in place, see "System-doc edits") — there is no separate Library "entry" for a `cva` table (the design-rules generator's `rules.generated.json` picks up the new contract test's descriptions on `Button`'s existing row automatically).
  - The five `text-[15px]`/`h-12` overrides (`body-type` r1's `buttons=ladder` hold): all five now `size="cta"` (44px, `text-base`), the door's own precedent (`enter-event-prompt.tsx`'s `buttonClassName="h-11"`); `type-ladder-policy.test.ts`'s two matching `board` `BODY_EXCEPTIONS` entries deleted in the SAME commit as the fix (the policy pins the count; landing them apart would go red in between, per the Orchestrator's own integration note).
- Calls his to overrule (none blocked the work; each was the brief's own recommendation or a measured resolution of an open number, not a new decision):
  - The `cta` icon at 18 (`size-4.5`) and `sm` text at 12 rather than 14 (both named in the brief as "his to overrule" — direct, unavoidable consequences of `pairs=step-up` itself, not a separate choice this lane made).
  - The five overrides onto `cta` (44px, `text-base`) rather than a smaller step — also named in the brief; the visible change is real (the guest door's three CTAs and the password gate's two buttons grow from 36px/48px hand-set sizes with 15px text to a uniform 44px/16px), so "look at first" below flags it.
  - **icon-sm's number, MINE to flag**: the Orchestrator's plan prose named `icon-sm` as 16; this lane shipped 14. Re-derived from the approved board's own code (`body-type/surfaces.tsx`'s `iconClass()`, deleted with the board but readable at this lane's cut commit `c75734b9`): `icon-sm` pairs by HEIGHT with `sm` (both 28px), whose text is now 12 (caption tier), so step-up's own rule (`ONE_OVER[12] = size-3.5`, i.e. 14) gives 14, not 16 — and `icon-sm` was the literal probe (`PAIR_PROBES`) Will's approved review measured and judged. 16 was `icon`/`icon-lg`'s pairing (`default`/`lg`'s 14px text, one step over, is 16), not `icon-sm`'s. The plan text itself hedged this exact spot ("`icon-sm` 16 ... or as the lane measures"); this is the lane measuring. Flagged here rather than silently shipped so it is easy to overrule if the 16 was intended after all.
- The help articles this lane makes stale: none (no help/guide article describes a button's icon or text pixel size).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the guest door's three CTA buttons (SuccessStep's "Open the album", WelcomeStep's "Continue"/"View the album", RoleStep's "Look around", all in `entry-modal.tsx`) and the password gate's "Unlock"/"Open the album" (`password-gate.tsx`) are now visibly bigger (44px, 16px text) than before (36px or 48px hand-set, 15px text) — confirmed locally on the real `/e/<demo-token>` door at 1440 (`getComputedStyle`: height 44px, fontSize 16px, `data-size="cta"`) before the shared browser pane got reassigned to a concurrent lane's dev server mid-session (this machine runs six lanes' browsers at once; a `tabId`-less call can land on whichever tab another lane just fronted). The guest album's own row (`event-experience.tsx`'s Add photos/Invite, `lg`/`sm`, unrelated to the five overrides) was also confirmed live: heights unchanged, `sm`'s text now a clean 12px (was 12.8px) beside its unchanged 14px icon. `password-gate.tsx`'s two buttons were not separately walked live (no password-protected event exists in the disposable test data today, and seeding a password is outside a narrow CSS lane's remit) — they share the exact `size="cta"` mechanism already confirmed on `entry-modal.tsx`, and the contract test covers `cta` in isolation.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `body-type` round two ruled `pairs=step-up` (2026-09-20): every `Button` size's icon now sits one Tailwind icon-step over its own text (12/14, 14/16, 16/18), explicit on all eight sizes in `button.tsx`'s `cva` table so none falls back to the base `size-4` by accident (`icon-sm`'s old silent fallback to 16 was the exact mismatch Will saw). A new contract test (`button.test.tsx`) pins the pairing, the explicit-selector shape and the unmoved heights. The five `text-[15px]`/`h-12` overrides `body-type` r1 sent to round two (`entry-modal.tsx`'s three, `password-gate.tsx`'s two) moved onto `size="cta"`, and `type-ladder-policy.test.ts`'s two matching `board` exceptions retired with them in the same commit. `body-type` retires: its sandbox directory is gone, `registry.ts`/`boards.ts`/`touchpoints.ts` updated, and it stays a `RulingId` with its `RULINGS` row rewritten as shipped.
