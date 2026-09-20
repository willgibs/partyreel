# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's, `git show b30445d9:docs/CHANGELOG.md` for the overnight round's, `git show 69a9a177:docs/CHANGELOG.md` for the morning sitting's round's, `git show a79cd55c:docs/CHANGELOG.md` for the evening sitting's (batch four).

---

## 2026-09-20 — The small hours: the sixth batch and its wiring (`806695d1` onward)

**What Will did.** The sixth batch (build `806695d`) answered the next five boards on the desk and glass round two whole,
and a second paste the same hour answered the demo and the pricing page: eight boards, 52 verdicts (34 confirming, 13
overruling, two `?` each carrying his own answer, three "the ruling stands", and ten answers on questions the desk had
badged as reached by an earlier ruling, every one of which the desk lane had itself marked "stands"). `guest-shape`: the
welcome then the gate ("not this sheet design"), the river on every empty guest screen, the dock held for a second round,
a photograph that grows into its column when it arrives, "A guest can delete any photo they've personally uploaded,
ever", Save after the first upload, the dialogs on the one sheet. `app-vocabulary`: one skeleton as needed, icons on both
bars with tooltips that open at once and slide between neighbours ("Desktop should still support hover on cards"), the
tile-size cluster with room reserved, per device, one ConfirmSwitch; the tile grammar's unification left to the
Orchestrator's judgment. `seed-avatar`: the diagonal look (with a bug: "the clipping here is wrong"), the whole wheel at
full colour, the initial always, the account id as the seed, the colour under the photograph, no motion. `admin`: the
numbers first with the queue beneath, a rail with a palette, a table for data and a pane for prose, colour reaching the
row, one destructive sheet, the health band, a 44 px tool bar. `app-door`: the code first, one account object worn four
ways, the tour as today, the product beside the door, an existing account named ("dismissible and provide an action"),
failures with the ways out as buttons, one press where the device remembers ("if we can use passkeys"). `glass` round
two: Crystal, the double edge. `demo-event`: a role on arrival, a Demo mark that stays, the turn after an upload, "Start
your own" in the row and a closing card, the photo pile as the door (better designs asked), one session across two
screens, one party. `pricing-page`: the plans open on paper, Free and Pro side by side with the Pass beneath, a slider,
the wall kept, his own answer on the sheet (the tiles and the table dark, the band killed), the accordion at five or six,
the phone row held until its demo works. Plan mode; his four answers there; three fresh-context reviews folded in.

**The cut.** Eight wiring lanes and six round twos from the two pastes, the desk pass for their reach. Before the cut the
Orchestrator landed the seam (the grid and the lightbox gained `arrivedIds`, `canDelete`, `prefix` and a lightbox
`canDelete`, so the guest lane never opens a glass file), the `--info` token pair (the admin's fourth colour), and the
session-remove RPC (`remove_my_upload_by_session`, SECURITY DEFINER, `service_role` only, a claimed row never touched);
`globals.css` was released to `glass-wiring` for one fenced block. The six seats: `glass-wiring` :3131, `guest-wiring`
:3132, `door-wiring` :3133, `admin-wiring` :3134, `vocab-wiring` :3135, `avatar-wiring` :3136; `pricing-wiring` and
`demo-wiring` on the first seats that free, then `overtaken-2`, the round twos, batch five's four, `help-sync`. No lane
can sign in on its port: the hub gallery's bars and cluster, the admin portal, the account page's passkey and the owner
mode's avatars are Will's on the alias, and each lane's bullet below says so.

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
  ROADMAP line). The door's sequence AND shell untouched ("not this sheet design"). Gate 47 on the merged tree; the one
  red test at its cut was the Orchestrator's (the ledger test predated the `stands` grammar; fixed at `677be39c`).
  Calls his to overrule on the alias: the arrival as white light, not a state colour; only another's photograph
  lights; the anonymous removal device-bound; a failed removal restoring the tile with "Couldn't remove that photo.";
  Report's sheet with the primary first. One help article stale for `help-sync` (`save-an-event-and-find-your-uploads`).
  NOT SEEN RENDERED: the locked page's river (no password event exists), the signed-in Remove, and Report's textarea
  on a real iPhone (the Sheet's phone half has never held a focused input) are Will's on the alias.

**Next.** The handoffs, in the program's order; his eye on the alias; the night's explorations once he sleeps.

## 2026-09-20 — The night sitting: the fifth batch and its wiring (`69a9a177` onward)

**What Will did.** The fifth batch (build `69a9a17`) answered the four boards at the head of the desk whole: 30 verdicts,
three `?` each with his own answer in the note (his words verbatim in rulings.md). `voice`: bible 20 ruled permissive
and the line becomes "No app required."; his hero sentence; the curation h1 kept; "For videos and unlimited events.";
the album noun on both empty states; his gate line, with "1+ exploratory tracks" asked on skipping email confirmation
for a badge; today's toast, with "redesign our toasts". `body-type`: 16 / 14 / fluid / 10 as the floor with 12 kept
for labels / 12 on 0.08em / `leading=length`; `buttons` "more work required". `glass`: Frost with a second round asked
("nail our glass from the start"), one grade, the album behind, his tiles rule (nothing on a mobile card but an active
like, a play mark and a subtle count; every action in the lightbox), white on the reel ("worth exploring making this
the standard"), the row as a bar, dark on paper. `app-shape`: the pulse (more dashboard explorations asked across host
states), cover cards AND a row/table behind a toggle, the hub with the gallery beneath and a clickable QR by the title,
crumbs with the cards going sticky, sharing as a sheet with a view-transition mini-modal and a subtle copy link,
settings as a sheet, the personal on the profile and money on the account, one shape on a phone. In plan mode: the
glass wiring waits for round two; the questions his rulings reach on ten other boards are neither killed nor redrawn
(badged in place, an agent's line, a trash, an answer overriding); the button rung goes to a lab round two. Ten lanes
cut at the record; the four ledgers of retired boards deleted; then his night instruction: the seats run all night on
unexplored surfaces and the Orchestrator gets `PartyreelAI/`, a folder of its own.

- **`lab-tides` merged at `75d6d2e2`** (2026-09-20, Opus; cut `11f03ef9`; the lab itself, Will's standing ask): ten
  lab-workflow findings in one lane without changing the shape of a round. `lab:demo` and `lab:smoke` refuse a missing
  `--base` (the Orchestrator's port was the silent default), every DevTools call took a ceiling and every board a budget (a
  stall is a printed row, not a nine-minute wait), and a capture settles on the frames' own images, fonts and stillness
  instead of a flat 1,600 ms. `defineExploration` dedupes its flattened `configs` (the knob drawn once per decision AND
  the option presses no longer silently dead), gains an opt-in `today`, passes a `carried` list through; a staged step
  reached by URL stops counting itself into a walk it is not in; a board's knob keeps the router's history state. A
  portalled frame gets a doctype; the specimen collector records what it could not read; the board's dock cluster
  reaches a step. The carried calls draw above a board's sections, counted in the reading budget, the `call:` grammar
  proposed verbatim for the Orchestrator to land. The "a responsive variant never reaches a frame" mystery was measured
  to its cause (the lab's utilities compile into a `utilities.lab` sub-layer that production's `utilities` beats at
  every width) and drawn on `/design/lab/sample`. On Will's stacking question: a paste marks what it took (the review
  store's v2 `sent` marker, a sent answer visible and greyed, excluded from the next paste) and a repeated clause is a
  no-op, so a stale re-send is harmless. Four `glass` steps report UNPAINTED (headless Chrome rasterises
  backdrop-filter as one flat colour) instead of a false FROZEN: they need a headed eye before his answers on them mean
  anything. The desk-wide demo green at 187 steps. Gate 40 green on the merged tree.

- **`voice-wiring` merged at `32861973`** (2026-09-20, Opus; cut `20cc9b5f`): the voice's eight ruled lines in
  production and the board retired in the same lane. "No app, no account." became "No app required." verbatim on 27
  production sites and the prose variants were rewritten in their own sentences under one rule now written in
  `marketing-voice.ts` (a line that PROMISES a guest needs no account goes, a line that describes the per-event switch
  truthfully stays, and the expensive case is the suggested host announcement in help and blog, three help articles
  and four posts rewritten; `require-accounts-to-upload-explained` read end to end and already true). His hero sentence
  landed whole; at 144 characters it pushed the composed meta description to 175, past the ~160 that gets read, so the
  meta line is its own ruled copy (`SITE_DESCRIPTION_LINE`) with a pin. The Pro line single-sourced (`PRO_LINE`) with its
  four siblings aligned video-first; both empty states in one voice (the album, "starts"); the gate on his adjusted
  line; the toast untouched. The six feature h1s measured at 1440: `/features/album` is the one that wraps to three
  lines (kept, since `feature-h1=today` ruled nothing moves; three two-line candidates in the calls). Calls his to
  overrule on the alias: the meta line's own copy; two Pro-line alternates ("Video, and every event after this one." /
  "Add video. Host as many events as you like."); the album h1 ("Every photo, from every guest." recommended); the
  curation subhead left as it is (it already clarifies the good part); no phone trim of the hero sentence (four lines
  at 375, the CTAs above the fold); the blog comparison table's "No account" column kept as category analysis; `llms.ts`'s
  plan table shape kept; "No app, just your email." kept in the save and likes prompts as the register's model. Gate 41
  green on the merged tree.

- **`ladder-wiring` merged at `59345bc8`** (2026-09-20, Opus; cut `20cc9b5f`): six of `body-type` r1's seven rungs as
  tokens beside the heading steps, the ladder now "sixteen steps, one set": `reading` 16/24 for every guest-facing
  sentence (the 26 `text-[15px]` gone), `working` 14/20 for the app, the admin and marketing's own chrome, `copy` a
  clamp from 16 at a phone to 18 at a desk printed by the retired board's own `fluid()` (recovered from git),
  `caption` 12/16 and `micro` 10/12 as the floor (his note read as two rungs), `label` 12/16 on 0.08em as a STEP, not
  an `@utility` (a custom utility would lose to a stray `text-sm`; `globals.css` untouched), every rung on 2 x size - 8
  pinned by a test that reads it off the tokens. The type policy gained its sixth silent-failure way: a count-pinned
  allow-list that only shrinks (101 survivors named and reasoned, five kinds; the buttons rung and its five overrides
  under `board` for `buttons-pairs`). The sweep moved 112 sentences: the 11 px mass split by role (a label to 12,
  metadata over a photograph to 10), the sub-floor raised to 10 outside pictures (eleven small uppercase chips grew
  from 8 or 9 to 12), every hand-set `leading-*` beside a new step deleted, two hero subs onto `subhead`, a price
  numeral onto `subsection`, the admin mapped where equal and its health numerals left alone. Measured in headless
  Chrome at both widths. `design-system.md`'s type section refined in place. Calls his to overrule on the alias: the
  six names; the trackings (0 / 0 / 0 / +0.005 / +0.08 / +0.01); `copy` never inside a `card-title` block; the chips
  that grew; the removed leadings' new rhythm; `working` on marketing's own UI chrome. One lane incident on the
  record: a `--force-with-lease` on its own branch to fix a manifest SHA (nothing lost; the rule stands). Five
  ROADMAP lines (the hard-fail flip, a `type-sync` sweep of the 21 sites other lanes held, the `text-[10px]` rename,
  `components/admin/` owned by no manifest, the stale contract line numbers in the generated artifact). Gate 42 green
  on the merged tree.

- **`overtaken` merged at `f7928597`** (2026-09-20, Opus; cut `20cc9b5f`; the lab itself): the mechanism Will's ruling
  asked for, smaller than it sounded because the ledger already treats any non-null choice as answered. A question an
  earlier ruling reached stays in its board's walk with a badge in plain words and the date ("Ruled since app-shape r1,
  19 Sep: sharing is a sheet", plus "'as today' here means before that ruling" where an option says so), the lane's one
  line under it, and a third dashed answer in the dock beside "Not clear to me": "The ruling stands". That press
  composes `<ask>=stands "the earlier ruling stands"`, a RESERVED VALUE on the ask (never a new clause), accepted only
  where `sandbox/overtaken.ts` names the ask, owing a note as `?` does, stored as `{ choice: "stands" }` so the desk,
  the walk and "Copy so far" count it answered; answering with a real option is an override and the new ruling, echoed
  into `_window.json` at the overtaking board so the lane that wired the earlier ruling reads it. The map is one typed
  file with a test that joins every key to a real ask in its board's current round (a reworded or retired question
  fails the gate rather than leaving a badge that lies); the desk's count says "N overtaken". The judgment pass: 29
  asks on 13 boards, 23 stand and 6 concede (the four his notes answered outright plus `first-event.style` and
  `reel-studio.door`). The grammar landed by the Orchestrator at the merge as proposed (`7f0ca050`), with the README
  paragraph and the map's contract published. One ROADMAP line (the dock's one-row grid squeezing the note column).
  Gate 43 green on the merged tree.

- **`home-wiring` merged at `62a82a26`** (2026-09-20, Opus; cut `20cc9b5f`): `app-shape` r1's home, list and You
  answers in production. `/dashboard` is the pulse in four bands: the first is a RULE, not a queue (`next-step.ts`,
  his precedence: a queue waiting, uploads paused, no reel, dated tomorrow, no events at all, storage over 85
  percent; an empty result renders a calm line and the storage line and the create door are unconditional), then
  "just arrived" widening its window hour, today, newest until it holds twelve and captioning which (the arrivals keep
  the tile fade, the one host surface where it tells the truth), the storage line, the events. The five-chip inbox
  retired (`dashboard-feed.tsx` and `following-section.tsx` deleted; `filter-chips` and `trash-section` kept on disk
  for the lab). The events list: cover cards by default, rows behind a toggle opposite the heading (a three-item sort
  menu on the rows; the bin and saved events as lenses on one list, shown in both views), the view in a cookie set by a
  Server Action for an honest first paint. The three personal feeds moved to `/u/[slug]`'s owner mode (the component
  takes no parameters, so the gate can only fail safely); a Plan card on `/account` with every fact from the
  webhook-written row; the user menu's two doors ("Your profile", the claim card when handle-less; "Account").
  `host-app.md`, `auth-accounts.md` and `profiles-social.md` refined in place. Calls his to overrule on the alias: the
  four bands and the next-best-step precedence; the cookie and cards-as-default; the row shape and its sort menu; the
  bin and saved events as filters in both views; no headed table; the menu's two doors as rows, not a clickable
  header; no inline avatar editing on the profile (the Edit profile door); `profiles.events_view` recommended against
  (a written proposal only). The row view drops the guest and view counts the board drew (no cheap honest source).
  Three ROADMAP lines (`trackAttrs` is inert on `(app)`: no listener; `toggle-group.tsx` ships unspecimened;
  `getFollowedHostEventCards` has no caller). Two of its tests were re-pointed at the record: one pinned the empty
  teaser's old title that `voice-wiring` had ruled away (now a door check), one is named below. Gate 44 on the
  merged tree, with those two tests green after the fix.

- **`hub-wiring` merged at `a91464cb`** (2026-09-20, Opus; cut `20cc9b5f`): `app-shape` r1's event, navigation, sharing,
  settings and phone answers in production. The event page is a hub: one header object (a live ~112 px `StyledQr` at
  the left of the title, metadata and a subtle link that shows the pretty URL, copies the permanent one and confirms
  in place with a 90 ms pop and an `aria-live` line, no toast; the two header chips retired into the code's own
  "Paused" state and the Settings card's value line), a cards row (Review, Reel, Guests, Settings last, each with its
  value line), the album beneath with the bin as a lazily fetched Deleted filter (a `getUser()`-gated Server
  Function; the empty album's door to sharing is a control of the gallery's own). The code opens a mini-modal on the
  native View Transitions API (240 ms on `--ease-emphasis`, name-scoped in `share/share.css`; whole-screen and white
  in a hand with `navigator.share` third). Crumbs in the bar (`CrumbsProvider` inside `AppShell`, the trail landing
  at hydration on a fixed-height bar; cut to the parent step at 375); Review, Reel and Guests as rooms with crumbs,
  the Reel room holding the builder before birth (the `?section=reel` redirect deleted, not re-pointed). Sharing and
  settings as two URL-backed sheets (`?room=`, the marker inside the state Next merges so Back closes the sheet and
  never reloads; `/settings` redirecting) on ONE responsive Sheet, opt-in by prop, the sheet `guest-shape`,
  `profile-page` and `app-pricing` inherit; `EventShareDialog` kept as a nine-prop wrapper. The cards row condenses
  into the sticky pill row with a QR pill only while the header's code is off screen; the phone's edge gradients are
  masks. `host-app.md`'s five sections refined in place (the share surface has its home now). Calls his to overrule on
  the alias: the trail in the bar at hydration; the QR pill as Share's place in the sticky row; the Reel room pre-birth;
  the lazy Deleted filter; the cards' order and value lines; the mini-modal's contents; the sheet's width; no
  guest-side select. Deferred: the share sheet's posters and invite (nothing to hold yet); the hub header at 375
  against "immediately visible at the top of the page" (unmeasured: the code compresses to ~96 before anything is
  cut); `event-feed.tsx` and its action bar now lab-only. Two help articles made stale for `help-sync`
  (`your-event-page-explained`, and any routing a host to `/settings`). NOT SEEN RENDERED: the local signed-in pass
  could not run (Google OAuth will not redirect to a lane's port; no password ever typed), so the hub, the morph, the
  sticky row, the sheets and the crumbs await the alias signed in, which is Will's; the four things to look at first
  are in its Handoff (the 375 fold, one element carrying the view-transition name, the sheet's Back, a fresh-tab
  `?room=settings`). Gate 45 green on the merged tree.

- **`glass-material` merged at `337f1de9`** (2026-09-20, Opus; cut `e271729a`): glass round two, the ONE material his
  notes asked for. Frost, Crystal and the reel's white on Frost's filter, drawn on all six glass surfaces in a single
  frame per option (the lightbox pill, the mobile card's three marks, the reel's controls, the host's bar, a chip on
  paper, the guest's Add pill) over the darkest, middling and brightest photographs at 375 and 1440, every option
  carrying an active rose mark; the edge freed from the body as a second decision so "a bit darker" and "the double
  edge" stop competing. Every number re-measured off the rendered pane, the active icon for the first time: Frost keeps
  the rose mark at 5.30:1 against Crystal's 4.44 and White's 3.61 over the darkest photograph, white text survives on
  all three, the three cost the same to scroll; the double edge holds 97 percent of a pane's outline where no hairline
  holds 59. Round one's answers spent subtractively (`veil`, the quiet grade, the flat control and the paper material
  deleted); two carried calls on the board (one frame for six surfaces, the Add pill drawn in the material). The lab's
  UNPAINTED cause found one layer down: a clipped capture drops the backdrop-filter layer, not the renderer (a ROADMAP
  line with the headed-capture loss and the rose mark no material saves over a bright photograph). The lane force-pushed
  its own manifest commit to amend a SHA into its Handoff and flagged it itself; the rule stands. Gate 46 green on the
  merged tree.

**Next.** His next batch, composed on the alias; the waiting four and the night's explorations once he sleeps; his eye
on the alias, signed in, in the morning.
