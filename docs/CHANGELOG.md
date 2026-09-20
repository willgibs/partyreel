# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's, `git show b30445d9:docs/CHANGELOG.md` for the overnight round's, `git show 69a9a177:docs/CHANGELOG.md` for the morning sitting's round's, `git show a79cd55c:docs/CHANGELOG.md` for the evening sitting's (batch four), `git show 08967867:docs/CHANGELOG.md` for the night sitting's (batch five).

---

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

**Next.** The handoffs, in the program's order; his eye on the alias and the desk in the morning.

## 2026-09-20 — The small hours: the sixth batch and its wiring (`806695d1` onward)

**What Will did.** The sixth batch (build `806695d`) answered the next five boards on the desk and glass round two,
and a second paste the same hour answered the demo and the pricing page: eight boards, 52 verdicts (34 confirming, 13
overruling, two `?` each carrying his own answer, three "the ruling stands", ten answers on badged asks the desk lane
had itself marked "stands"), every note verbatim in rulings.md with his framing, his second message and his four
answers in plan mode (the guest chrome round two first; a guest's self-delete final for the host; the diagonal wired
now; passkeys behind a flag); three fresh-context reviews folded in at his request. In a line each: the welcome then
the gate with its shell withheld, the river on every empty guest screen, the dock held, the arrival, "A guest can
delete any photo they've personally uploaded, ever", Save after upload, the dialogs on one sheet; one skeleton, icons
with tooltips that open at once and slide, the tile-size cluster, ConfirmSwitch; the diagonal avatar with its clipping
bug named, the wheel, the initial, the account seed; the admin on numbers with a rail, a palette, tables, colour on the
row, one destructive sheet, the health band, a 44 px bar; the door on the code, one object worn four ways, the tour as
today, the product beside /login, an existing account named, failures with buttons, passkeys; Crystal with the double
edge; the demo's role arrival, its mark, the turn, Start your own, the pile, one session, one party; the pricing page
on paper, the pair with the Pass beneath, a slider, the wall, his own sheet answer, the accordion, the phone row held.

**The cut.** Eight wiring lanes and six round twos from the two pastes, the desk pass for their reach; before the cut
the Orchestrator landed the seam (the grid and the lightbox gained `arrivedIds`, `canDelete`, `prefix` and a lightbox
`canDelete`, so the guest lane never opens a glass file), the `--info` token pair and the session-remove RPC
(`remove_my_upload_by_session`, SECURITY DEFINER, `service_role` only, a claimed row never touched); the seats and the
queue are in `tracks/orchestrator.md`; nothing signed in is seen by a lane, and each bullet says what waits for Will.

- **`guest-wiring` merged at `7f4f2ffe`** (2026-09-20, Opus; cut `0ad0c32d`): `guest-shape` r1's answers in production.
  The locked page draws the river at the empty album's own depth (`GhostRiver`, one home for the ghost fade; the
  ghost grid retired on disk for the board that draws it). A photograph somebody else adds lights a white inset rim
  that rises in 200 ms and fades over two seconds (pure `newArrivalIds`, one duration shared by sheet and state; the
  seed render, a rolled presign and the guest's own upload, which keeps its green check, never light); the ruled
  growth into ONE column did not land: CSS columns are column-major, so it waits for `glass-wiring`'s explicit
  columns (a ROADMAP line, deferred rather than half-built). Save left the block above the album and Invite takes the
  row. A guest's own photograph is removable ever under both identities: signed in through a Server Function on
  `remove_my_upload`, anonymous through `POST /api/guests/remove` on the service-role-only session RPC behind the join
  limiter; "mine" a server read on both paths (`/api/guests/mine`), never a client claim and never in the gallery's
  ETag; every database call in `lib/db/mutations/guest-media.ts`; an eleven-way rolled-back RPC check and both routes
  red-teamed live. Invite and Report onto the responsive Sheet (Download all and Save are other lanes' files: a
  ROADMAP line). The door's sequence AND shell untouched ("not this sheet design"). Gate 47 (the one red at its cut was the ledger test, mine, fixed at `677be39c`).
  Calls his to overrule on the alias: the arrival as white light, not a state colour; only another's photograph
  lights; the anonymous removal device-bound; a failed removal restoring the tile with "Couldn't remove that photo.";
  Report's sheet with the primary first. One help article stale for `help-sync` (`save-an-event-and-find-your-uploads`).
  NOT SEEN RENDERED: the locked page's river (no password event exists), the signed-in Remove, and Report's textarea
  on a real iPhone (the Sheet's phone half has never held a focused input) are Will's on the alias.

- **`glass-wiring` merged at `a2a0d973`** (2026-09-20, Opus; cut `0ad0c32d`): glass round two's answer in production.
  Crystal as the one material, with one home: the `--glass-*` tokens and `@utility glass` in `globals.css` (blur 42,
  the backdrop at 0.68, saturate 2, 4 percent black, a 28 percent lip and a 10 percent hairline as inset shadows,
  never a border), named by `lib/glass.ts` and held to it by its test; `glass-mark` re-points one number (a lighter
  blur for a tile's marks) and `glass-behind` is the lightbox's ground, and there are no more. The lightbox's flat
  `bg-black/90` became the album blurred at half brightness on its own element. ONE `MediaTile` for every album
  grid: a phone tile carries an active like, a play mark and a subtle count and nothing else; the desk's verbs are
  one declared glass pane per surface (guest, host, bin, feeds); the reveal chip rides the bar; `GuestMasonry` is a
  thin wrapper over the shared grid. The grid left CSS `columns` for explicit columns filled oldest-first into the
  shortest, so a prepended photograph is the last placed and every tile on screen keeps its column (a property
  test): the ruled arrival growth is now possible. The reel's Share and Download in the one pane, the event card's
  chip as dark glass on paper, the marketing plate onto the tokens (its two measured numbers kept); the `glass`
  board retired, its ledger gone at this record. Gate 48 on the merged tree. Calls his to overrule on the alias: a
  glyph on glass carries its own halo (`glass-mark-lit`), because production floats the pill over the raw
  photograph where the board drew it over a half-bright album; the phone keeps the desk's blurred ground (measured at 375 under a 6x throttle);
  the per-surface hover sets. NOT SEEN RENDERED: the host gallery's one-pane row, the bin and the event card's chip are Will's, signed in.

- **`door-wiring` merged at `f7075a73`** (2026-09-20, Opus; cut `0ad0c32d`): `app-door` r1 wired whole. One
  `AccountDoor` worn four ways (/login, the guest gate, Save, a like): one email field and the code first, Google
  beside it, a password on a quiet link; Save and the like dialog gain the Terms line they never had (the gate keeps
  its on the welcome step); creating an account is the code path, so `CreateAccount` and `PasswordAuth` retired and
  the hand-copied Google glyph went for the shared icon. `existing=tell` decided server-side after a verified code
  from the caller's own profile row, only under a create intent, the guest gate holding its photograph claim four
  seconds so "Not you?" can never strand a guest's pictures. `failure=paths` as one table of six kinds behind
  `door-failure.ts`, the callback emitting the kind, the ways out as buttons. /login is the door with a wall of
  marketing frames beside it. Passkeys wired behind `NEXT_PUBLIC_PASSKEYS` on auth-js's experimental API and DARK
  until Will enables passkeys in the Supabase dashboard with the WebAuthn RP id on the apex (a mismatch is
  unrecoverable, so the flag ships unset, in `env.ts` and `.env.example` only). Not applied: the `PasskeysCard` line on the account page
  (`avatar-wiring`'s file, unmerged); deferred: the magic-link half of the existing-account line and a Google-only
  host's memory on /login (ROADMAP). Gate 48 on the merged tree. Calls his to overrule: a recovery already on screen
  is not promoted twice (the code-led door shows the line over the ladder it has; the password door promotes all
  three); the four wears' reason lines. Three help articles stale for `help-sync` (`you-cant-sign-in`,
  `sign-in-options-and-passwords`, `the-email-code-didnt-arrive`). NOT SEEN RENDERED: the existing-account line and
  its four-second hold, and the passkey row, are Will's (a real second sign-in; the dashboard settings).

- **`admin-wiring` merged at `b81ed49a`** (2026-09-20, Opus; cut `0ad0c32d`, synced at `8e800240`): `admin` r1 wired
  whole. The portal opens on four figures (Accounts, Active hosts, Uploads, Paid subscribers; the fourth carries no
  arrow because no history exists to compare against, and "active" means last seen in the fortnight) with the ranked
  queue beneath; a 44 px bar with the crumb and the live tag, a 232 px rail at `lg` and the dropdown below it, the
  health band under the bar only on a bad day, and a command palette on the new `ui/command-palette.tsx` primitive (a
  surface, an account, an action); `ui/table.tsx` with `tone` as a data attribute and four state colours reaching the
  row (`info` the fourth); one destructive sheet on nine controls, the permanent one typed; Exports joined to NAV. The
  `admin` board's ledger gone at this record and its fixtures kept as a Library demo of the real rail, band, queue,
  table, palette and sheet (the only automated eye on a portal nothing can sign into); the board itself, which the
  lane left standing, retired at `290bbd3e` with the next record. The `admin_actions` table proposed under
  Questions and not built. Gate 49 on the merged tree. Calls his to overrule on the alias: the four figures and the arrowless
  fourth; "active" as last seen; whether a paid-subscriber delta is worth a `tier_events` table (his question, open).
  Deferred (ROADMAP): the components gallery's duplicate "Surfaces" block (a duplicate React key, pre-existing); the
  help centre's palette onto the primitive (and the second global ⌘K listener gone); the queue's Reports row costing a
  full list for one timestamp; the two report verdicts still unconfirmed (admin-triage's lane). NOT SEEN RENDERED: the
  whole portal is Will's, signed in on the admin host (the bar, the rail at 1440 and the dropdown at 375, ⌘K three
  ways, the figures against /admin/metrics, the band absent, the sheet on a disposable announcement); the typed account
  delete never exercised.

- **`avatar-wiring` merged at `2a5c7018`** (2026-09-20, Sonnet; cut `0ad0c32d`, synced at `87cadbcf`): `seed-avatar` r1
  wired whole. The clipping bug first: the root clips (one `overflow-hidden`, one `rounded-full`) and neither the image
  nor the fallback carries a radius of its own, pinned by `avatar.test.tsx` and verified live. The generator moved
  home to `src/lib/avatar/` with `seedFor`, a server-side SHA-256 of `profiles.id`, so one person is one colour on
  every surface and a client never holds a raw id it does not already have; `Avatar`'s `seed` prop paints the
  diagonal under the initial and under the photograph (the fallback transparent, the image covering the root once
  mounted), the whole wheel at full strength, the initial always, no motion; the crowd test on a thousand real UUIDs
  through the generator and through the production pipeline. Every surface seeded: the user menu, the account form,
  the guest account menu (through `/api/me/menu`'s hashed `seed`, not a raw id: the lane's call), the guest list's
  chips and faces row and the owner sections through `ProfileCardItem`, the profile identity row folded onto `Avatar`
  at a new `xl` size. The Library's Avatar entry enhanced. Three additive exceptions named. Gate 50 on the merged tree.
  Calls his to overrule: the 80 px fourth size; the transparent fallback ground; the bucket bound at twice the mean;
  the menu route's hashed seed. Deferred (ROADMAP): the two "Hosted by" bylines still show no colour behind a missing
  host photo (`seedFor(host_id)` is ready, the guest files' owner places it). One help article stale for `help-sync`
  (`display-name-and-profile-photo`). The board stays for round two on the look. NOT SEEN RENDERED: a signed-in
  person's own menus and the owner sections are Will's; `/u/willg` signed out carries the identity row live.

- **`overtaken-2` merged at `ca9bc121`** (2026-09-20, Opus; the desk lane): the judgment pass for the sixth batch and
  its second paste. All 110 open asks across the twenty standing boards read against the eight ruling boards'
  answers and drawings; the map from 29 keys to 76 (47 new badges; nine first-pass lines gain a second clause behind
  `ALSO_REACHED`, the first judgment never rewritten; 68 stands, 8 concedes; heaviest where a whole backdrop was
  ruled: guest-upload 8 of 8, admin-triage 7 of 8, app-pricing 6, host-curation 6; press-page 0). Two corrections:
  `media-viewer.holds` and `host-curation.peek` were badged by glass's "every action lives in the lightbox", which his
  batch narrowed to a phone, and both now say so where they are read (`peek` keeps its concedes word and is flagged
  as the one judgment worth his eye). The test's blunt rule (a ruling board is never itself reached) replaced by the
  real invariant (a note never credits its own board), since six of the eight are still on the desk with round twos
  coming. The retired `admin` board's three entries left the map at the record. The desk reads 66 of 76 overtaken
  still open. Gate 51 on the tree with `vocab-wiring`. Deferred (ROADMAP): `first-event.first`, `.asks` and `.limit`
  are reached and unbadged behind the desk queue test's pins (three lines and three entries, the Orchestrator's).

- **`vocab-wiring` merged at `40863a96`** (2026-09-20, Sonnet; cut `0ad0c32d`, synced at `baf0ef15`): `app-vocabulary`
  r1's four wiring answers. One `RouteSkeleton` with three shapes (the pulse, the hub, the Studio's first; the two
  `loading.tsx` files became it). One `BulkBar` behind `ReviewActions` and `GalleryBulkBar`: icons with an instant
  tooltip that slides between neighbours (`floatingCrossSlide` lifted into `floating-layer.ts`; the root
  `TooltipProvider` at 0, his "immediately"), mounted behind a hydrated flag; the select-mode header slot un-gated so
  Hide, Approve and Cancel show again. `TileSizeControl` (three steps and two reserved slots) in the hub gallery's
  header beside Download and Select, the knob persisted per device in a COOKIE (`pr_tile_size`) rather than the
  ruled localStorage: an honest first paint on the events-view precedent, the intent held, the mechanism his to
  overrule. `ConfirmSwitch` owns the glyph and the deferred-open dance; the uploads section's two hand-rolled pairs
  retired into it. Empty states and the tile grammar left to their earlier rulings. Two unowned files touched with
  why (the hub page and its actions for the cookie; `review-section`'s select gate). Gate 51 on the merged tree.
  Calls his to overrule: the cookie; the reserved slots' words; the slide's 32 px; the skeleton's three shapes,
  the Studio's especially; the cluster's order (Download, tile size, Select). Deferred (ROADMAP): the navigation
  menu's inline cross-slide onto the constant. NOT SEEN RENDERED: the hub gallery's bars, tooltips and cluster,
  the Studio's skeleton and the settings switches are Will's, signed in.

- **`pricing-wiring` merged at `58f7acbd`** (2026-09-20, Opus; cut `7f4f2ffe`, synced at `1d4d4d1e`): six of
  `pricing-page` r1's eight answers. The page opens on paper with no dark hero; Free and Pro side by side with Pro's
  room a real range input whose stops are `plansForTier("pro")` under the cadence toggle; the Event Pass redrawn as a
  wide ticket beneath (one photograph down its left edge, the pair's `StatRow` imported not copied, a notch punched at
  each end of the stub rule); the band killed and the matrix unwrapped so the tiles-to-table run is one dark room; the
  FAQ trimmed to six (the four that settle money plus expiry and stacking; guests-pay and upload-size moved to Help)
  feeding the accordion and the JSON-LD from one list. `fit` and `phone` untouched (round two's). Gate 51 on the
  merged tree. THE CALL WORTH HIS FIRST TEN SECONDS: the page stays in the cinema group, so the cinema bar sits over
  the paper opening rather than the white bar the board drew; bible 16 says a page cannot flip its header from
  inside and `globals.css` refuses `.dark` inside `.surface-paper`, so the paper group would have cost every dark
  chapter he asked for in the same answer (the alternative in its manifest). Also his: the Pass as a photographic
  ticket with `wedding-petals` as its frame; the six that stayed; the slider's labels as labels. Deferred (ROADMAP):
  the cinema layout's dark `themeColor` over a white first screen on a phone (a group-level answer); `shared-band.tsx`
  deleted when the board retires. Seen on the alias signed out: `/pricing` (a served check).

**Next.** The handoffs, in the program's order; his eye on the alias; the night's explorations once he sleeps.
