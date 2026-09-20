---
track: guest-verify-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c75734b9"          # the launch-prep SHA the branch was cut from
board: guest-verify    # round two on the same board id: the identity shape whole; round one's four rulings held
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-verify/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
  - docs/systems/database-security.md
  - docs/systems/billing-caps.md
  - src/lib/constants/tiers.ts
  - supabase/migrations/
  - src/components/auth/account-door.tsx
  - src/components/auth/email-sign-in.tsx
  - src/lib/auth/door-failure.ts
  - src/lib/auth/remembered-email.ts
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/lib/guest/
  - src/lib/media/uploader-identity.ts
  - src/components/social/guest-list.tsx
  - src/components/shared/media-lightbox.tsx
  - docs/reviews/guest-verify.json
  - docs/design/rulings.md
---

# lp/guest-verify-r2

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/fe056e62.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md`.

A `defineExploration` round two on the SAME board id (`round.n: 2`), five decisions, drawn on the real door, album,
guest list, queue and settings sheet at 375 and 1440 with the board's one-party fixtures; a stage of flows for the
collision; a written recommendation in the Handoff. The brief was red-teamed by a second architect before the cut and
the findings are folded in below (the wall re-measured; two options demoted to recorded refusals; the host's meter;
three security cases the board must draw).

**His words first** (the brief quotes them whole): the four rulings and the two `?` notes of the batch above; the
summing-up ("we still need to find the best shape across login, verification, upload credits, anonymous accounts,
etc. Everything is unprotected and open to relitigate ... Looking for best shape overall."); the round-one `gate=ask`
note (2026-09-19) that opened the board.

**The facts that bind (the scout's fact sheet, file:line in the manifest):** a guest is a `guests` row per event per
device (`session_token`, our own capability in localStorage `pr_session_{qr_token}`; `email` written ONLY from
`auth.users` at join, the verified-at-join invariant; `user_id` nullable); uploads bind to that row; `create_guest`
raises when accounts are required and the caller has no confirmed session; every path to a session proves the address
by construction (the code, the link, Google, a passkey behind the flag; no `signUp` with a password);
`claim_anonymous_uploads` stamps only rows whose token this device holds and never re-stamps an owned row;
`capture_guest_email` writes the caller's verified address onto any guest row with `email null` given only the token;
"already had an account" is decided server-side after the code, under a create intent, never before (no enumeration
oracle); the guest list shows only signed-in uploaders, the queue names nobody, the lightbox says "Anonymous", the
host's lightbox shows `uploaderEmail`, which has always been a verified string; the export names nobody and no
anniversary mail exists (the board cites no surface we lack); the host's meter (`storage_ledger.cumulative_bytes`,
`tiers.ts`) never refunds on delete, so an upload burns the host's monthly ingress for good, and the account
requirement was the only per-person cost at a public QR (`abuse_rate_limit.sql` catches cross-event breadth, not a
single-event flood); `allow_anonymous_uploads=false` gates the album VIEW as well as the upload (`guest-flow.md`). A
proposed, unapplied column exists in writing: `guests.claimed_email`, "typed and NEVER proven; authorises nothing".

**The wall, re-measured before anything is drawn on it.** The round-one strip drew Supabase's numbers wrong: the
current table gives `/auth/v1/verify` 360 an hour per IP with a BURST of 30 (a venue's phones drain the burst, then
clear at about six a minute), `/auth/v1/otp` 360 an hour project-wide and customisable, and "30 an hour" is the
custom-SMTP emails-per-hour cap, raisable. So "most guests cannot confirm that night" is false as written; what is
true is that a mail can still fail (spam, delay, a mistyped address) and that a full room at the door drains the
burst. The board draws the CORRECT documented numbers, labelled as documented, and swaps in the project's CONFIGURED
numbers the day Will reads them (Dashboard, Authentication, Rate Limits: three numbers, asked for in the message;
this is the one thing the board needs from him). Nothing on the board rules on an unread number.

**The principle, stated on the first frame:** nothing at the party may depend on a mail arriving, and nothing
unproven may be shown as proven. Identity has three jobs one email gate conflated: CREDIT (who added this), OWNERSHIP
(these are mine across events; I can delete them; my profile), SAFETY (the host's: no stranger's dump, a way to trace,
a meter that is theirs). Credit needs no proof. Ownership needs proof only when ownership matters (another device, a
profile, a claim). Safety was served by the gate and must be served by something else once the gate opens.

**Facts drawn, not asked (the first frame; each with the cost that made it a fact):** the KEY is the session (the
device's guest row); "a Supabase anonymous user per device" is a recorded refusal (`handle_new_user` mints a
`profiles` row per scan, the host table; every `authenticated` grant would admit anonymous JWTs without
`is_anonymous` policies everywhere; a CAPTCHA at the door); "the typed address is the key" is a recorded refusal
(the takeover the round-one stage showed); PROOF is the code by mail, later, from anywhere, with a passkey for the
return (app-door's `return=tap`, behind its flag); "a claim link from our own mailer" is a recorded refusal (it
bypasses only the raisable cap and mails a bearer credential to whatever address a stranger typed, N events = N
links, from our domain). The four held rulings are the baseline (`gate=after`, `badge=mark`, `host-lens=badge`,
`expiry=host`); an option that would change one says so on its frame.

**The decisions (five):**
1. `address`: what a typed address DOES on an unproven session. `none` (the door asks a name only; an address is
   typed only inside the sign-in door, so no unproven address exists anywhere: the simpler shape, half of which
   ships as the after-upload keep-the-album offer), `private` (the typed address is kept on the row as
   `claimed_email`, shown to the host as "typed, unconfirmed" in a slot that is never the verified one, shown to the
   guest on their own tiles, never public, never mailed, a hint for the later claim), `public` (the typed name or
   address is credit with the mark, his `badge=mark` world; with the rule case 1 needs written on the frame: proof
   of an address anywhere scrubs every unproven copy of that string). The transition rule on every option: proof
   from the same device claims the session's rows; from another device it claims nothing.
2. `allowance`: what an unproven session may add (who pays; the flood at a public QR). `handful` (a fixed count of
   photographs, no video, per session until proven: the round-one cost line "Add more than a handful" made real),
   `budget` (a per-event unproven budget the host sees and raises on the settings sheet), `open` (no cap; the meter's
   never-refund fact drawn beside it). The ingress fact on every frame.
3. `unproven`: where unproven content goes and what it looks like. `shown-marked` (live in the guest album, a subtle
   mark on the tile and the avatar, a hover tooltip, the same badge on the pop-up and the profile: his rulings),
   `shown-plain` (live, no mark for guests anywhere; the host's queue says "unconfirmed"; the simpler shape), `held`
   (the host sees it at once, guests see it once proven, the album shows "3 more waiting on their owners"; this one
   changes `gate=after` for guests and says so). Frame notes, not options: the host's per-event switch as the two
   positions `shown` and `held` if he wants a switch; the host's "That's Bob" vouch, drawn once, granting NOTHING
   beyond clearing the mark inside this event (never "verified", never a profile, never a claim); what "the code
   didn't come" looks like on the marked tile's tap (the door's `send_failed` and `rate_limited` paths with their
   three buttons, and "Confirm later from anywhere; your photos are already in"); `expiry` as a consequence (under
   `shown-*` nothing is pending, so nothing expires; under `held` the day-seven rule applies).
4. `collision`: his case 2 (a returning guest types an address they used at another event, not signed in). `offer`
   (after the first upload lands, "Sign in to keep your photos together" is offered to EVERYONE, revealing nothing),
   `label` (you are a labelled session; the code later merges; nothing is offered), `require` (an address matching
   an existing account must type the code first: the oracle, drawn for its cost). The STAGE beside it draws, as
   fact: case 1 and case 3 under the session key (the round-one lane's verdict lines), THE PASSED PHONE (a venue's
   iPad or a phone handed round holds the previous guest's tokens; the next sign-in claims their rows and
   `capture_guest_email` can label them: the claim drawn as an explicit confirmation with the thumbnails, "Keep the 5
   photos added from this phone as yours?"), and THE UNPROVEN STRING IN THE HOST'S LIGHTBOX (a typed address drawn in
   its own slot, never the verified one).
5. `gate-switch`: what the host's "Require accounts" switch becomes once uploading no longer requires one (it gates
   the album VIEW too today). `two` (Require an account to view / to add, two rows), `one` (one row gating the view
   only; adding is always open under the allowance), `none` (the switch retires; visibility's private, password and
   public already govern the view; the allowance and the queue are the protection).

**The Handoff's written recommendation:** one page, "the best overall shape": the recommended option of each
decision composed into one story of a guest's night and the week after (the door, the first upload, the tap, the
mail at home, the claim, the profile), the simpler shape (`none`, `handful`, `shown-plain`, `offer`, `none`) weighed
against his rulings' shape (`public`, `handful`, `shown-marked`, `offer`, `one`) in the same page, each checked
against every invariant (RLS the boundary; `guests.email` verified-at-join only; no enumeration oracle; the claim
never re-stamps; service-role RPCs; deletion the only lifecycle exit; the host's meter; the walls as read), with the
migrations either shape needs WRITTEN ONLY, and the cases it cannot answer without him. The lane reads Supabase's
current docs (Context7) for the rate-limit table, anonymous sign-ins and passkeys before drawing.

- The round-one `carried` calls: `numbers` (defaults or the configured limits) is carried FORWARD into round two's
  spec so his three numbers can land through the `call:` grammar; `mechanism` and `badge-audience` retire, answered
  by his rulings.
- Owns `src/app/(dev)/design/sandbox/guest-verify/` and the board's own lines in `registry.ts`, `boards.ts`,
  `touchpoints.ts` (the RULINGS row rewritten for round two: round one's four asks named as ruled and HELD, the two
  `?` re-asked inside `unproven` and `collision`; `variants` set to five) under the registration exception. Reads,
  never edits: `docs/systems/guest-flow.md`, `auth-accounts.md`, `database-security.md`, `billing-caps.md`,
  `src/lib/constants/tiers.ts`, the migrations named in the fact sheet (`create_guest`, `claim_anonymous_uploads`,
  `capture_guest_email`, `remove_my_upload_by_session`, `abuse_rate_limit`), `src/components/auth/account-door.tsx`,
  `email-sign-in.tsx`, `door-failure.ts`, `remembered-email.ts`, `src/components/guest/enter-event-prompt.tsx`,
  `entry-modal.tsx`, `save-account-prompt.tsx`, `src/lib/guest/`, `src/lib/media/uploader-identity.ts`,
  `src/components/social/guest-list.tsx`, `src/components/shared/media-lightbox.tsx`, `docs/reviews/guest-verify.json`
  (round one, after the record), rulings.md, the review sheet. `lab:smoke` whole; `lab:demo --board guest-verify`
  pressing every step; the gate; no production byte.

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
