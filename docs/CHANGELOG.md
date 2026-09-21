# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's, `git show b30445d9:docs/CHANGELOG.md` for the overnight round's, `git show 69a9a177:docs/CHANGELOG.md` for the morning sitting's round's, `git show a79cd55c:docs/CHANGELOG.md` for the evening sitting's (batch four), `git show 08967867:docs/CHANGELOG.md` for the night sitting's (batch five), `git show 87ede4da:docs/CHANGELOG.md` for the small hours' (batch six's first cut).

---

## 2026-09-20 — The closing sitting: the desk's head answered (`fe056e62` onward)

**What Will did.** At 18:20 EDT, on the alias's `fe056e62`, he answered the desk's first five boards in one paste:
every open ask of `body-type`, `app-shape`, `guest-shape` and `app-vocabulary` (their round twos) and all six of the
new `guest-verify` board: 14 verdicts, seven confirming, five overruling, two `?` each carrying his own answer; every
note verbatim in rulings.md ("the closing sitting's first batch") with his summing-up ("we still need to find the best
shape across login, verification, upload credits, anonymous accounts ... Looking for best shape overall") and his
instruction to pause Moltbook. The plan, approved in plan mode after a second architect red-teamed the identity brief
(the round-one board's rate-limit wall was misread; two ideas demoted to recorded refusals; the host's never-refunding
meter made a decision), cut six lanes on the six seats: four wiring lanes that retire their boards, the desk pass
`overtaken-3`, and `guest-verify` round two on the identity shape whole. His four `guest-verify` rulings (`gate=after`,
`badge=mark`, `host-lens=badge`, `expiry=host`) are recorded and HELD, not wired, until round two rules ("May have to
relitigate"). The briefs are in the plan file and in each manifest.

**The record.** The five ledgers written (`guest-verify.json` created; 14 recorded, none echoed); the review sheet
rendered from the desk's captures (14 pictured) for the lanes and for Will; the kit's scripts honor an exported
scratchpad path and the heartbeat pauses Moltbook (`87ede4da`).

- **`guest-verify-r2` merged at `d68ef23f`** (2026-09-20, Opus; the board's round two, lab-only): the identity shape drawn whole on the shipped door, album, faces row, queue and settings sheet at 375 and 1440: `address` (none / private / public), `allowance` (handful / budget / open), `unproven` (shown-marked / shown-plain / held; `outage` answered inside it as a frame note), `collision` (offer / label / require; his cases 1 and 3 drawn beside it as settled fact), `gate-switch` (two / one / none); round one's four rulings HELD on the board's head and on every frame that rests on them; the rate-limit wall corrected to Supabase's current table (verify 360 an hour per IP with bursts of 30, so a room queues rather than walls; otp 360 an hour project-wide; the custom-SMTP emails cap ours to raise), documented defaults labelled as such, the configured numbers riding `call:numbers`. The Handoff's one-page recommendation is a THIRD shape, `none` + `handful` + `shown-marked` + `offer` + `one`, needing no new identity column (unproven is derivable from `guests.user_id is null`, since `guests.email` is verified-at-join): a display name typed at the door, ten photographs and no video per unproven session, the mark as the prompt aimed at the one person who can clear it, the same offer to every guest after the first upload, the switch keeping its view half; the migrations written only. Read by the Orchestrator against the invariants (RLS, verified-at-join, no oracle, the claim never re-stamps, deletion the only exit, the host's never-refunding meter): it holds. Gate 66 on the merged tree (Tests  3056 passed; smoke 443 checks, 0 failing; demo guest-verify 5 steps, 0 failing; log $S/gate1.log). Three carried calls his: `numbers`, `handful`, `vouch`.

- **`buttons-wiring` merged at `224049d6`** (2026-09-20, Sonnet; `body-type` round two wired whole, the board retired): every `Button` size's icon one Tailwind step over its own text (12/14, 14/16, 16/18), explicit on all eight sizes in `button.tsx`'s `cva` table so none falls back to the base `size-4` by accident (`icon-sm` had, silently, the exact mismatch he flagged); `sm`'s text onto the ladder as `text-xs`; the five `text-[15px]` overrides on the door's and the password gate's buttons moved to `size="cta"` (44 px, the door's own precedent) and the two `board` exceptions deleted from the ladder policy in the same commit; a contract test for the pairing (27 cases); `body-type` retired (registry, boards, touchpoints; a `RulingId` still, its ruling rewritten as shipped; the ledger deleted at the merge); `design-system.md`'s button line refined. Gate 67 on the merged tree (3079 tests; smoke 440 checks, 0 failing; demo toasts 3 of 5, `material` and `action` FROZEN, the harness's stacked-srcdoc blind spot verified by hand by the toasts lane, accepted on that standing evidence; log $S/gate2.log). His to overrule on the alias: `icon-sm` at 14 (the lane's re-derivation from the board's own measurement code; the plan had said 16), the `cta` icon at 18, the door's CTAs now uniformly 44 px with 16 px text (look at first: the guest door's three buttons and the password gate's two).

- **`controls-home-wiring` merged at `ddf4db47`** (2026-09-20, Sonnet; `app-vocabulary` round two wired whole, the board retired): one shared `ViewMenu` (`shared/view-menu.tsx`, radio groups as props on the shipped dropdown) holding Tile size, Sort and Filter behind one View button beside Add photos, Download and Select in the hub gallery's header; the Deleted lens moved inside Filter (All / Deleted); Sort's two orders drawn but DISABLED until the client holds the whole approved list (the brief's honesty line; a follow-up when it does); `tile-size-control.tsx` unmounted and kept for the lab; `app-vocabulary` retired (a `RulingId` still; the ledger deleted at the merge); `host-app.md`'s gallery lines refined; the guest album mounts the same menu under `guest-chrome-wiring`. Gate 68 on the merged tree (Tests  3079 passed; smoke 438 checks, 0 failing; demo guest-verify 5 steps, 0 failing; log $S/gate3.log). One help line stale (`your-event-page-explained.mdx:33`, the next `help-sync`). His to overrule on the alias, signed in: the trigger's word and icon, Filter without a photos / videos split, Sort disabled.

- **The toasts verdicts** (2026-09-20 20:05 EDT, build `c75734b`): five of five, every one the board's own recommendation, no notes (`where=top`, `material=card`, `life=persist`, `stack=expanded`, `action=always`); the paste verbatim in rulings.md ("the toasts board"); `toasts-wiring` (Sonnet, :3131) cut at this record; the board retires at its merge.

- **`overtaken-3` merged at `8c30faf6`** (2026-09-20, Opus; the desk's third judgment pass, for the closing sitting's first batch): twenty-nine asks reached by the fourteen verdicts (the map 62 to 72 keys), eight new judgments (six stands, two concedes), nineteen lines gaining a clause, and a THIRD grammar for the four held `guest-verify` rulings: the badge names the hold and his own clause and carries no judgment (two asks, `seed-avatar.look` and `first-event.first`). The heaviest reach is `guest-shape` round two (fifteen: `welcome=sheet` retires the centred float at a desk that four boards' options drew; `chrome=both` puts a dock at the foot of every guest album, which `toasts.where` and `help-center.from-product` waited on; `theirs=mark` puts a fourth mark on a tile, so glass's three-marks line has moved). The queue test's `first-event` pin (four badges, `asks` unreached) had kept two real badges out of two passes; lifted as the lane's granted exception, the count and the unreached ask now derived from the map, and the two badges are in. Gate 69 on the merged tree with `guest-chrome-wiring` (3102 tests; smoke 435 checks, 0 failing; demo guest-verify 5 of 5; the harness sight check sees; log $S/gate4.log). The hand merge: `docs/design/library.md` regenerated rather than merged.

- **`guest-chrome-wiring` merged at `fd42c759`** (2026-09-20, Opus; `guest-shape` round two wired whole, the board retired): the row on landing and a dock at the foot once it scrolls away (`guest/guest-action-dock.tsx` on the row's own sentinel: Add beside Invite as a `role="group"`, a gradient scrim, safe-area padding, `inert` while hidden; the floating Add pill's product mount gone, the file kept for three lab surfaces); the door's desk half on the responsive Sheet (a full-height right-edge panel with the album blurred beside it, the option's own posture: HIS TO OVERRULE, one line back to the centred dialog at 640 and up), its phone half vaul with the Sheet's height cap, the dismissability table and the step machine untouched; the one grid gained `mineIds`, `data-mine` on the tile box and a fourth mark in the play mark's glass recipe at the tile's top-left, whose tap filters the album to yours under "Showing yours · Show all" on the server-read own-uploads set Remove already gates; a Tailwind v4 landmine found in the browser and fixed (a transition named `transform` while v4's translate utilities set the standalone `translate` property, so the dock teleported); the board retired in the house convention (the `RulingId` and its row kept, `SandboxId` and `DESK_ORDER` gone; the ledger deleted at the merge); `guest-flow.md` refined. The guest album's View menu (tile size and Yours) waits for a one-line follow-up now that `ViewMenu` is on the tree. Gate 69 on the merged tree (3102 tests; smoke 435 checks, 0 failing; demo guest-verify 5 of 5; the harness sight check sees; log $S/gate4.log). The hand merge: `registry.ts`'s adjacent import deletions kept together, the generated files regenerated. Not exercised by the lane and left for the alias: the gated door's two steps (every test event is open) and the mark on a real own upload.

- **`home-states-wiring` merged at `5ea7415d`** (2026-09-20, Sonnet; `app-shape` round two wired whole, the board retired): the real collapse in `next-step-band.tsx` (three chips by tone, a "+N more" chip that expands in place with `aria-expanded`, "Show fewer", the chevron turning on `ease-emphasis`, reduced motion a plain swap), the band order from his `busy` note (the notices, then the storage line, then Your events, then Just arrived beneath the events; the page's header comment rewritten with his words), the empty and the one-event pages verified as already the ruled composition and left alone (`wizard`, `pulse`); the pulse's "Print the code" chip untouched (his to overrule); `app-shape` retired in the house convention (the `RulingId` and its row kept; the ledger deleted at the merge); `host-app.md`'s landing section refined. Gate 70 on the merged tree (3105 tests; smoke 432 checks, 0 failing; demo guest-verify 5 of 5; the sight check sees; log $S/gate5.log). The hand merge: the registration deletions kept together, the rows and the component notes as the union of both sides, the two retired ids dropped from `DESK_ORDER` where the union had re-added them (the typecheck caught it), the generated files regenerated. One help article stale, `your-dashboard-explained.mdx` (already stale since `home-wiring`'s pulse: it still describes the five-chip feed; the next `help-sync`).

- **`toasts-wiring` merged at `c92d653f`** (2026-09-20, Sonnet; the `toasts` board wired whole, the board retired): the Toaster at the top under the bar at both sizes (`top-center`, a 5rem offset that clears the marketing bar, the app shell's bar and the guest header, one number because one Toaster mounts globally), always expanded so a run of outcomes reads as full sentences newest on top, errors persisting until dismissed with a close control (sonner's `toast.error` patched once at module load, guarded against double-patching, the 65 call sites untouched; the other kinds on their clock), the popover card as today (verified a no-op), the trailing action as sonner's own `action` prop sanctioned for Undo and the refusals' Upgrade (no helper needed); a contract test on the real `toast` (one allow-list line in `floating-layer.test.ts` for it); `toasts` retired in the house convention and its two overtaken badges retired with it; `design-system.md`'s toast line refined. Gate 71 on the merged tree (3106 tests; smoke 429 checks, 0 failing; demo guest-verify 5 of 5; log $S/gate6.log). His to overrule on the alias: the 5rem offset (never measured on a signed-in host page), three visible toasts (sonner's default), the close control on a persistent error. The stylesheet released to the lane returns to the Orchestrator's owns at this record.

- **`guest-view-menu` merged at `86e41a28`** (2026-09-20, Sonnet; the follow-up of `guest-chrome-wiring`, no board): the shared `ViewMenu` in the guest album's control row beside Download all, Tile size (three steps, disabled below 640 with a "Wider screens" hint, the grid forcing two columns there) and Showing (Everyone's / Yours (n), present only once the guest owns something) on the same state as the own-tile mark's filter; the tile size resolved server-side from the shared cookie in the guest page and threaded down (one additive prop on `event-experience.tsx`, the lane's listed exception), the write through a server action mirroring the host's; fourteen tests; the first paint at the chosen size proven on the raw SSR HTML. Gate 72 on the merged tree (3117 tests; smoke 429 checks, 0 failing; demo guest-verify 5 of 5; log $S/gate7.log). Left for the alias: Yours after a real upload (R2's CORS allow-list excludes localhost). His to overrule: the group names and the hint's words.

- **The library index's duplicate key fixed at `ae20259b`** (2026-09-20, the Orchestrator; Will's report: `/design/library` threw React's "two children with the same key" for `src/components/shared`): the index grouped rows by consecutive runs of `dir` while the rules artifact lists a directory's files in several runs; `groupRowsByDir` (an insertion-ordered map, the artifact's order kept) merges every row of a directory into one group; three unit cases; verified in headless Chrome against the dev tree (188 rows, 38 groups, no console error; a control proves the collector sees a same-key error). The sibling `/design/library/components` still logs its own duplicate key (the ROADMAP's `admin-wiring` line, two Surfaces blocks), untouched.

- **The closing sitting's second batch** (2026-09-20 ~22:45 EDT, build `c75734b`; the paste verbatim in rulings.md): thirteen verdicts on the four drawn round twos and on `app-pricing` whole (eleven the boards' recommendations, two overrules: `phone=stack`, `carry=cards`), seven of them overriding badges earlier rulings had set (echoed in `_window.json`); six lanes cut at this record: `avatar-mesh-wiring`, `welcome-film-wiring`, `demo-frame-wiring` (Sonnet), `pricing-split-wiring`, `app-pricing-wiring`, `overtaken-4` (Opus); five boards retire at their merges. His word on the components gallery's duplicate key: taken the Orchestrator's way, after the cut.

- **The components gallery's duplicate key fixed at `6b4ecd46`** (2026-09-20, the Orchestrator; Will: "take the components gallery duplicate key the same way"): `familySections` grouped a family's entries by consecutive runs of `section` while lanes add entries at the head under headings that exist further down (the disjoint-hunk convention), so "Surfaces" drew as two blocks with one key and one DOM id; one shared first-appearance grouping (`gallery/group-by.ts`) now serves both the family pages and the library index (`groupRowsByDir` delegates to it), the merged block sits where its section first appears; three helper cases and a source pin on `familySections` (the runtime registry cannot load in a node test without the product's env, so the pin reads the source); verified in headless Chrome against the dev tree with and without the change (the duplicate key gone, zero exceptions; a pre-existing next/image `sizes` warning on the hero specimen remains, a ROADMAP line). The four gate steps green.

- **No push deploys any more (2026-09-20 late, the Orchestrator; Will: "we're wasting a ton on launch-prep, even for minor things ... stop deploying launch prep automatically, and intentionally deploy the review branch for each review round ... Or if there is a better system, implement that"):** Vercel's Hobby cap (100 deployment creations per rolling day, canceled ones included, both projects on the repository) filled at 20:03 EDT on the Orchestrator's own pushes (about forty to `launch-prep`, each creating two deployments the ignore step canceled at once, which the prune then deleted, so the dashboard showed almost none) and pinned the alias at `c75734b9`. `vercel.json` now turns `launch-prep` off beside `lp/*`, so a push creates nothing on either project; `usher/kit/alias-ensure.mjs` is the deployment: one per project by API at each `[preview]` record, both launch-prep aliases assigned by hand (about twenty creations a day); `scripts/prune-vercel-deployments.mjs` prunes both projects (the admin project had kept forty-three deployments, thirty-three of them canceled) and a canceled build no longer takes one of a branch's three keep slots. Not taken: a review branch fast-forwarded per round, because the allow-listed URL is the launch-prep alias itself; it is the fallback if an API creation for a branch whose git deployments are off is ever refused, which the first record after the window clears (about 20:00 EDT 2026-09-21) will show. Lanes lose nothing: they build and test on their own dev servers and never used the alias.

- **`overtaken-4` on the tree at `71e49638`** (2026-09-20 late, handed off `d354e44e`; the board commit `6451ad3a`, synced `fbe2030f`; gate 73 on the merged tree): the desk pass for the second batch, fourteen asks on the standing boards judged for the first time (every one a stand: a marketing-and-pricing batch rarely answers another board's option word for word; `press-page` carries its first badge ever), fifteen earlier lines gained a clause behind their judgment (`MAX_CLAUSES` to three), the seven overrides his answers made closed against their `_window.json` echoes (`seed-avatar.look` over `guest-verify`'s hold, spent by `look=mesh` without round two: the second way a hold ends, now in the file's contract; `app-pricing`'s six over five earlier rulings), the one hold left `first-event.first` (`gate=after`). Map totals 69 stands, 7 concedes, 1 held; seventy-seven entries on seventeen boards. Two calls his to overrule: the sheet cross-wire recorded, not resolved (`object=sheet` read as the one responsive Sheet; the badge says a centred surface is "alive again at a desk"), and "Convert, not block" generalised to a guest's allowance cap and the download limit.

- **`pricing-split-wiring` on the tree at `9ab4b243`** (2026-09-21, handed off `4fdf77bf`; the board commit `d3d796b7`, synced `ef893383`; gate 74 on the merged tree; `pricing-page` RETIRED, its ledger deleted): `fit=split` wired whole: the album wall became the split configurator, one bordered panel of two planes (the storage slider on `STOP_GB`, the video switch and the once-or-again fork recessed on `bg-muted`; one elevated photographed plan card on the page's own white as the live result, its deck of prints fanning as the slider climbs, one at 1 GB and four at 2 TB, so the wall's "watch your album fill up" survived the wall); `calculator.tsx` became `configurator.tsx` (`STOP_GB` still exported), `PhotoStack` joined `StatRow` as an export of the pair. His chapter note: the configurator closes the paper chapter directly under the pair and the Event Pass ticket, and `UnlockGrid` opens the dark one as its overview, then the matrix, then the FAQ (his round-one "tiles above Find your plan size" superseded, as he said); both halves pinned in `pricing-page.test.ts` and a new five-clause contract. `phone=stack` changed nothing at 375. `touchpoints.ts`'s 2026-08-27 `pricing-calculator` row names the configurator as the wall's successor (called out, not taken silently). Six calls his to overrule on the alias: the result card's photograph (a fourth stack of prints can read as a fourth plan), the recess at `bg-muted` (the only real step paper offers; deeper is a token change), the figure at `text-prose`, the panel at `max-w-5xl`, the new subhead (the board's was false at 375 where the halves stack), the live region as the verdict alone. Verified locally at 1440 and 375 with real CDP keyboard drive; the alias pass is the Orchestrator's once the window clears.

**Next.** The handoffs in the program's order (gate 66 onward), each recorded here through `usher/kit/record.py`; the
identity board's Handoff read against the invariants before its message; the wiring of `guest-verify` after round two
rules; no new board.

## 2026-09-20 — The small hours, second: the round twos and the queue (`58f7acbd` onward)

**Where this opens.** The sixth batch's first cut is on the tree (the entry below): six wiring lanes, the pricing page
and the desk pass, five records, five gates. Will sleeps; his instruction for the rest of the night is verbatim in
rulings.md ("the night, second"): the batch's queue first (the round twos he asked for by name, the demo, batch five's
four boards, help-sync), then explorations on surfaces no open board can reach, and from 9am his time the desk only
closes. Every lane here is lab-only unless its bullet says otherwise; nothing signed in is seen by a lane.

- **`guest-shape-r2` merged at `ba153a39`** (2026-09-20, Sonnet; the board's round two): his two asks by name and the
  plan's third, drawn on the wired album and the demo's own arrival at 375 and 1440. `chrome` (where Add and Invite
  live: the column as wired, the dock, both, the header; `both` recommended, his two traits read as two rather than
  one subsuming the other; the frame scrolled deep into the album is the one where today's column visibly loses
  Invite). `welcome` (the door's shell and the welcome screen's design: today, page, card, sheet; `card` recommended
  over the just-unified Sheet, whose real desk posture is the side panel his note flagged; `sheet` drawn as it really
  is). `theirs` (where a guest finds their own photographs in sixty-eight: none, chip, strip, mark; `mark`
  recommended, a badge on a guest's own tiles that filters on a tap, for zero new chrome). Round one's seven asks
  replaced and named as ruled in the RULINGS row. Gate 52 on the merged tree; the overtaken map's badge on round one's
  `dialogs` ask reconciled at the merge (both lanes had named it). Calls his: `card` over `sheet`; `both` over `dock`;
  `mark` over `chip`; the sixty-eight-photograph fixture is invented for the board.

- **`welcome-tour` merged at `af7ec784`** (2026-09-20, Sonnet; `app-door` round two): one decision, the tour's design,
  drawn four ways on the real `/welcome` at 375 and 1440 with the name step untouched and the closing CTA primary
  and skippable in every one: `cards` (the shipped tutorial, corrected), `stage` (real product screens, the code
  live, a guest's phone, the album filling; the wizard's first step as a dimmed peek), `film` (the twelve bespoke
  how-it-works pictures in motion, one per step; recommended: the pictures exist and "alive" is the literal word of
  his ask), `one` (a single screen, the tutorial's copy losing its only home in the app). Round one's seven asks
  replaced and named as ruled; round one's three orphaned overtaken entries removed after syncing past the desk pass.
  Gate 53 on the merged tree. Calls his: `film`'s copy on a card plate at the picture's foot rather than a scrim (six
  of the twelve are bright app panels); `stage`'s three beats on the create, share and fill copy; `one` folding the
  name step's reason into one promise line.

- **`album-controls` merged at `ad967efc`** (2026-09-20, Sonnet; `app-vocabulary` round two): one decision, where the
  host gallery's five controls live, four options drawn on the real wired Album header with the production leaf
  components at 1440 and 375: the row as shipped (three wrapped lines at 375), a View menu holding tile size, Sort and
  Filter beside the two verbs (recommended: his own first instinct, two lines at 375, the same at both widths), the
  view controls in the responsive Sheet at 375 only, and every control riding the sticky cards row with nothing left
  in the header (drawn at rest and stuck). Round one's seven asks replaced and named as ruled; five orphaned badges on
  them retired from the overtaken map with the count corrected. Gate 55 on the merged tree. Look at first: `view-menu`
  against `row` at 375, side by side.

- **`pricing-fit` merged at `3cf43bde`** (2026-09-20, Sonnet; `pricing-page` round two): `fit`, three options on the wired page at 1440
  and 375: the wall as today, `split` (Higgsfield's configurator-left and designed-plan-card-right shape, read live
  from its page and built fresh with Partyreel's own controls, copy and photographs; recommended), `inline` (the whole
  block gone, drawn as a real contender). `phone`, re-asked with its demo REPAIRED and proven end to end by `lab:demo`
  (his "I think the demo is broken, so I can't actually see it live"): `stack` as today, `swipe` (recommended; its
  row reshapes the Pass into a compact card so three peers share one height), `tabs`. Round one's six asks named as
  ruled. Gate 56 on the merged tree. Calls his: `split`'s execution is the lane's reading of the reference, not a
  literal match; two Pass shapes on one board, deliberately. One lab finding on the ROADMAP: a fully ruled ask is
  unreachable by `?session=` even by a direct link.

- **`avatar-look` merged at `539dfa4e`** (2026-09-20, Sonnet; `seed-avatar` round two): one decision, the look, four options measured on
  the wired avatar at 24, 32, 40 and 80 with the initial, on the guest list, the menu and the profile row: the
  diagonal as wired; `mesh` (hashvatar's own register reproduced from its SOURCE, one identity hue at four tonal
  depths diffused and layered, the brief's "several hue stops" corrected; recommended: it clears the letter floor on
  every one of a thousand seeds, worst 4.69:1, against the wired diagonal's 76 percent, worst 4.13:1); `throw` (two
  pools of light); `lit-seam` (a lit crease on the diagonal's seam). Every option measured with real compositing math
  at the exact pixel, a bar stricter than the production contract has held any look to, which surfaces a gap every
  option shares and the disc's ring mitigates (on the ROADMAP; his call). Round one's seven asks named as ruled. Gate
  57 on the merged tree. Look at first: the board opens on `mesh` with the measured caption.

- **`demo-wiring` merged at `0521613a`** (2026-09-20, Sonnet; `demo-event` round one wired whole): the demo's own
  arrival screen on the guest welcome's exact shell (`computeEntry` no longer special-cases the demo, the pin the
  board's own header flagged); a Demo mark beside the wordmark with the header pinned for the whole visit; a turn
  card above the album's first tile once an upload lands; "Start your own" beside Invite in the demo's action row
  and a closing card below the album; the footer's photo pile confirmed as the doors rule and the nav panel's ticket
  retired (its featured pane empty until `demo-doors` draws the door); the phone pair on one ephemeral Realtime
  broadcast channel per pairing keyed into the demo's own Invite link (a downscaled JPEG thumbnail over REST, no new
  table, never the shared gallery channel), proven end to end against the real project with a raw listener; the two
  "Hosted by" bylines fold onto the seeded Avatar (avatar-wiring's deferred line closed). Gate 58 on the merged tree.
  Calls his: the demo's two-column row against a real guest's one; the pairing's shape (per-visitor channel, a URL
  param); `live-demo.tsx` untouched by design. Look at first: the pairing with a real phone (the lane rehearsed the
  far end with a listener).

- **`guest-verify` merged at `76950230`** (2026-09-20, Opus; a new board from his `gate=ask` note, resumed after the
  limit from a committed board): six decisions on the real guest door, the guest list, the faces row and the host's
  review queue, phone first: `gate` (three phone screens one second after Add; `held` recommended, riding the existing
  `pending` status with a second reason), `badge` (his idea drawn literally with its cost on the frame; host-only
  recommended), `collision` (the flow, two lanes side by side; `session` recommended: GoTrue mints the auth row at SEND
  time, so an email-bound claim is a real takeover), `outage` (the wall measured under Supabase's documented limits, per
  IP on verify and project-wide on send; a time-boxed window on the settings sheet recommended), `host-lens` (`split`),
  `expiry` (the host's own switch). Three carried calls above the first step (the mechanism, the badge's audience, the
  numbers); one migration WRITTEN ONLY (a nullable `guests.claimed_email` that authorises nothing, left out of the
  column-locked grant), applied by nobody; the ruled gate sentence untouched. Moved after `guest-shape` on the desk.
  Gate 59 on the merged tree. Two lab findings on the ROADMAP (the pinned stage's head at 375 with one config row; the
  project's configured Auth rate limits, a dashboard read). Look at first: `collision`, the two lanes side by side.
- **`buttons-pairs` merged at `c28a2060`** (2026-09-20, Sonnet; `body-type` round two, resumed after the limit from six
  uncommitted files): one decision, `pairs`, three options on the real Button at every size in the real rows, each
  measured on the frame: `step-up` (the icon one notch over its text, 12/14, 14/16, 16/18; recommended, the shipped
  icons already sit there), `text`, `today` (what he saw). The board's frozen-caption bug found and fixed in the lane
  (a measurement effect keyed on a constant probe array never re-fired when the control swapped the option). The winner
  wires at `button.tsx`'s cva table in a follow-up. Gate 60 on the merged tree. Look at first: the `sm Download` and
  `xs Approve` pair his note named.

- **`help-sync` merged at `84ee48cd`** (2026-09-20, Sonnet; production, resumed after the limit from a bare boot):
  eleven help articles rewritten against the surfaces' code, each read before its article (a guest's own upload
  comes off on the album itself, signed in or anonymous by the same device; the code-led door with Google beside it
  and a password behind a quiet link, the existing-account notice, the three real buttons under each failure; the
  resend cooldown and the rate-limited state; removing a photo reveals the seeded colour; the event page as the hub
  with the live code, the cards row going sticky and the crumbs; settings as a sheet over the album and the custom
  link in the Share sheet, three articles found stale beyond the named seven; the loop's six steps paraphrased in
  the help voice); the two legal lines rewritten so an anonymous guest's removal reads as self-serve; the legal
  versions bumped (privacy 1.2, terms 1.3, one changelog line each, the file's own header rule; still "pending
  counsel review"); one article retitled with its slug kept; forty-eight read and left alone. The manifest had named
  the legal content under `components/marketing/legal`; the real files are `lib/constants/legal-*.tsx` (the lane
  corrected it). Gate 61 on the merged tree. Look at first: the event-page and event-settings articles, and the two
  legal lines.

- **`home-states` merged at `99550a89`** (2026-09-20, Sonnet; `app-shape` round two, resumed after the limit from two
  touched files): the home across three host states, drawn on the wired pulse with fixtures at 1440 and 375:
  `empty` (`wizard` recommended: the create door and the storage line, what zero events renders today; `ghosts` and
  `guided` drawn in full), `first` (`share` recommended: the code and the link lead, the one job left; `promise`,
  `pulse`), `busy` (`collapsed` recommended: the top three chips by tone, the rest behind one chip that expands in
  place; `ruled`, `events-first`). "Your events" draws as a plain grid of the real EventCard, never the real
  EventsSection, whose view toggle would rewrite the reviewer's own live preference. Round one's eight asks named as
  ruled and their stale overtaken badge removed. The board stays open on his own note. Gate 62 on the merged tree
  (its demo step timed out twice on a cold frame compile under three concurrent gates; the warm re-run pressed all
  three steps clean, and the gate now retries once warm).
  Calls his: the top three ranked by tone; the fixture QR chip on every card; the named-event heading on `promise`.
  Look at first: `busy.collapsed`, then `empty.guided` beside `empty.wizard`.

- **`demo-doors` merged at `042f82bd`** (2026-09-20, Sonnet; `demo-event` round two, resumed after the limit from a bare
  boot): one decision, `door`, four text-free options, each the one object drawn at its four places (the home hero,
  the footer, a feature page's line, the nav panel's pane left empty since the ticket retired) at 375 and 1440:
  `pile` (the footer's fan, proposed at the hero and the line), `frame` (one photograph in a mat with the code in its
  corner; recommended), `stage` (the falling engine's rest frame, sketched; nothing in the nav pane on purpose),
  `ticket` (the retired ticket redrawn as one object). A finding on the frame: the wired `pile` rule reached only the
  nav panel, the hero's plate and the feature line never gained it, so the winner's wiring covers all four places.
  The board's measurement probe fixed to remount on a live option switch (the twin of the buttons-pairs bug). Gate
  63 on the merged tree. Calls his: "text-free" read as no added words on the object (the party's name ON the object
  would be a smaller ask on the winner); `stage` sketched as a rest frame, never the live loop. Look at first: the
  nav pane under each option at 1440.

- **`type-sync` merged at `f76ff412`** (2026-09-20, Sonnet; production, the ladder's follow-up): the body scan's
  allow-list from 38 entries and 95 elements across five kinds to 27 and 78 across three: the `lane` and `pending`
  kinds at zero and dropped from the exception type, so one coming back fails typecheck (the hard fail the ladder
  deferred, for the half that was ever a lane boundary; `depicted`, `relative` and `board` stay named, counted and
  reasoned). Eleven files moved onto a step as a mechanical class swap (the footer's links, controls, lede, thesis,
  note and badge; the gate's eyebrow; the teaser's badge and eyebrow; the three flat ledes and the wysiwyg glyph
  onto `copy`; the feed header's label; the "N uploading" chip onto `micro`), plus the footer's shared link constant.
  The design-system doc's stale way-6 paragraph refined in place. Gate 64 on the merged tree. Calls his: the
  footer's two controls at 14 (`working`, not the button rung); the demo lede and the thesis on `copy`; the
  assistant note on `caption`; the "N uploading" chip read as a count (10) rather than a category label (12).

- **`toasts` merged at `75fefbdf`** (2026-09-20, Sonnet; a new board from his `moment=today` note, resumed after the limit
  from an unregistered board on disk): the toast as a system on the real toasts, its first line the rule that halves
  them (if the control can show it, no toast); five decisions drawn on the guest's held line, the host's bulk approve
  with Undo, an export mint, a pricing refusal and an error at 375 and 1440 in both themes: `where` (`top`
  recommended: the foot is claimed twice already), `material` (`card`; the scene pinned to paper so `ink` is
  provable), `life` (`persist`: an error that vanishes before it is read repeats itself), `stack` (`expanded`),
  `action` (`always`: a slot, not a mandate). Two steps read FROZEN in the demo harness though both draw correctly,
  verified three ways by hand (the captures come back byte-identical on grid-stacked srcdoc iframes, the glass
  finding's twin; on the ROADMAP). Moved after `app-vocabulary` on the desk. Gate 65 on the merged tree (its demo step
  red on those two steps by the harness, not the board). Call his: the paper-pinned `material` scene rather than a
  light and dark pair. Look at first: `material` and `action` by hand at their session links.

**Next.** The handoffs, in the program's order; his eye on the alias and the desk in the morning.
