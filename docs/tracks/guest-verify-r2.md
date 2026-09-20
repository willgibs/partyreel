---
track: guest-verify-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Three rode into the board itself, as `carried` calls, so they reach him on the page he is reading rather than in a record
(`call:numbers`, `call:handful`, `call:vouch`). They are repeated under "Calls his to overrule" below. Nothing else was
left open: the brief's recommendations were built, and where the lane departed from the brief's two named shapes it says
so in the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. A lab-only lane: every `docs/systems/` file it touched is in `reads`, and the facts it corrected (the
  rate-limit numbers) are the BOARD's, not the systems docs' - `guest-flow.md` and `auth-accounts.md` never carried the
  wrong figures. The correction belongs in a systems doc only once a shape is ruled and wired.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `docs/reviews/guest-verify.json` round one's `carried` entries `mechanism` and `badge-audience` are answered by
  his rulings and retire; only `numbers` was carried forward into round two's spec.
- Next: the board's `links.track` resolves to `docs/tracks/guest-verify.md`, which never existed, so the page reads "no
  manifest (a standing board)". `defineExploration` has no way to name a track; a round-two board on a differently named
  lane will keep reading that way until it does.

## Handoff (replaces the chat report)

- Board commit `9c4b090b`; sync-merge commit `acb198d9` (`origin/launch-prep` had moved to `436ef3d3`, two `usher/` files,
  merged not rebased, no conflict). The manifest commit follows; the Orchestrator reads the head from the chat line.
- Every claim below names its artifact.
- **Gates on the synced tree**, each on its own exit code: `pnpm design:rules` ok (182 components, 1299 contracts, 18
  policies) · specimens ok (140 specimens on 101 entries) · `pnpm typecheck` ok · `pnpm lint` ok (8 known warnings, 0
  errors) · `pnpm test` ok (3058 passed, 1 skipped, 290 files) · `pnpm build` ok (130 routes) · `pnpm lab:smoke --base
  http://localhost:3135` ok (444 checks, 0 failing; the board reads 690 words of a 1200 budget) · `pnpm lab:demo --board
  guest-verify --base http://localhost:3135` ok (5 steps, 0 failing, every option drawn; the stages move 14.68 to 69.93
  percent, the tallest step 1.6 screens). Dev server on :3135 only, killed by port before each build, the test run and
  this handoff.
- **Lane check** `git diff --name-only origin/launch-prep...HEAD`: the nine files under
  `src/app/(dev)/design/sandbox/guest-verify/` (five added, four modified, five of round one's deleted),
  `src/app/(dev)/design/touchpoints.ts`, and `docs/design/library.md`. Exceptions and why: `touchpoints.ts` is the
  board's own row under the registration exception (the RULINGS row rewritten for round two, `variants` set to five,
  the head comment updated; `DESK_ORDER` and the id unions untouched); `docs/design/library.md` is GENERATED by
  `pnpm design:rules` and its whole diff is one line, that same board row. `registry.ts` and
  `(shell)/lab/boards.ts` needed no edit: the board id did not change.
- **The items, one line each.** A round-two board is a catalog, so each is a decision rather than a Library entry:
  - `address`: what a typed address does on an unproven session. `none` / `private` / `public`, recommended `none`.
  - `allowance`: what such a session may add. `handful` / `budget` / `open`, recommended `handful`; `open` marked as today.
  - `unproven`: where it goes and what a guest is told. `shown-marked` / `shown-plain` / `held`, recommended `shown-marked`.
  - `collision`: his case 2. `offer` / `label` / `require`, recommended `offer`; cases 1 and 3 drawn as settled fact.
  - `gate-switch`: what Require accounts becomes. `two` / `one` / `none`, recommended `one`.
  - Round one's six asks are gone from the spec; its four rulings are named as HELD on the board's head and on the
    frames that rest on them, and `outage` is answered inside `unproven` as a frame note rather than re-asked.
- **Calls his to overrule on the alias**, one line each (all three also ride the board as `carried`, so they can be
  answered with `call:<id>=yes|no`):
  - `call:numbers`: the wall is drawn from Supabase's DOCUMENTED defaults, re-read this round. The project's configured
    numbers are three reads (Dashboard, Authentication, Rate Limits) and they swap in without redrawing anything.
  - `call:handful`: ten photographs a session, no video. Any number fits the same shape.
  - `call:vouch`: a host may clear a mark for a guest they know, once, inside that one event, granting nothing else.
  - And the one departure from the brief: the brief named two shapes to weigh; the lane recommends a THIRD, `none` +
    `handful` + `shown-marked` + `offer` + `one`, and the page below says why rather than hiding it.
- **Help articles made stale:** none. Nothing shipped; every help how-to still tracks the tree.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none applied. The migrations either shape would
  need are WRITTEN ONLY, below.
- **Look at first:** step 1 (`address`) at 375. The principle, the three jobs, the five facts and the four held rulings
  are on its frames, so it is the only long screen on the board and everything after it is a picture. Then step 3
  (`unproven`) at 375, which is where his two held rulings meet.

### The written recommendation: the best overall shape

**The shape: `address=none`, `allowance=handful`, `unproven=shown-marked`, `collision=offer`, `gate-switch=one`.**
It is neither of the two shapes the brief named. It takes `none` from the simpler shape, because his cases 1 and 3 are
questions that only exist if an unproven address exists, and it takes `shown-marked` and `one` from his rulings' shape,
because his own reason for the mark is a prompt aimed at the person who can clear it, and because the switch's view half
is a promise hosts have already made. `handful` and `offer` are in both.

**One guest's night, and the week after.** Sam scans the code on the table. The door asks what to call her and nothing
else: no address is typed anywhere a code does not prove it, so there is no string in the product that could be anyone's
but hers. She adds a photograph and it is in the album at once, wearing a small dot with a tooltip, on the tile, in the
faces row, on the pop-up when someone taps her, and on her profile. After that first photograph lands she is offered,
in the same words every guest is offered, the chance to sign in and keep them together; she ignores it. At ten
photographs the offer becomes the way to keep going, and everything she has already added stays exactly where it is.
She taps, the code does not arrive, and the door says so with three real buttons under it and the sentence that is only
true once the gate is gone: confirm later from anywhere, your photos are already in. On Tuesday at home she types the
code. Because it is the same phone, the claim we already ship stamps her guest rows to her account; because it is a
claim and not a merge, it never touches a row that already has an owner. The mark goes from every surface at once. She
has a profile, her photographs across events are hers, and she can remove any of them for good.

**The simpler shape, weighed** (`none`, `handful`, `shown-plain`, `offer`, `none`). It is one decision better and two
worse. Better: nothing. Worse in two places. `shown-plain` throws away the only mechanism that makes an unproven session
CONVERT, and his own sentence is the argument against it ("I'm expecting a guest to see themselves as marked as
unverified publicly and want to correct that immediately by verifying"): without the mark, an unproven guest has no
reason to ever prove anything, and every one of them stays a row the host cannot trace. `gate-switch=none` opens every
album a host already gated, and leaves a host who wanted "only people who tell me who they are" with a shared password,
which is a different promise. Its one real merit is that it says nothing about anybody, which matters if marking five of
twenty-three reads as an accusation. That is the overrule line on step 3.

**His rulings' shape, weighed** (`public`, `handful`, `shown-marked`, `offer`, `one`). It differs in one place, and it
is the place that costs the most. `public` makes whatever a guest types their credit in the album, so a stranger can put
a real person's address on a real photograph at a real wedding, and the product then owes a rule it must keep for ever:
proving an address anywhere scrubs every unproven copy of that string, everywhere, or the album shows one person wearing
another's address after the second has proved it. `none` needs no such rule, because there is nothing to scrub. His case
1 ("how does the original fake uploader get back to their account if we reassign the email?") and his case 3 ("two
different people upload under the same fake email. Attached?") are both unaskable under `none`, and both need written
rules under `public`. The mark still works: it rides the session and the name, which is what he actually wants marked.

**Against every invariant.**
- RLS is the boundary: unchanged. Nothing here gives `anon` a table; the guest path stays capability tokens validated
  inside SECURITY DEFINER RPCs, and every Server Function still re-verifies with `getUser()`.
- `guests.email` is verified-at-join only: unchanged under the recommendation, and that is the point of `none`. Under
  `private` or `public` the typed string MUST be a different column (`claimed_email`), never this one, and never in the
  host lightbox slot the verified address occupies.
- No enumeration oracle: `offer` shows every guest the same sentence, so nothing about who exists can be read off the
  door. `require` is the one answer that breaks this, and it is drawn for that reason.
- The claim never re-stamps: unchanged. `claim_anonymous_uploads` stamps only `user_id IS NULL` rows whose token this
  device holds, so the passed phone is a confirmation with thumbnails rather than a silent transfer, and declining
  leaves every row where it was.
- Service-role RPCs and the server-only key: unchanged; no new client-trusted field anywhere. The allowance is counted
  server-side inside the create path, never read from the browser.
- Deletion is the only lifecycle exit: unchanged, and `shown-marked` keeps it that way. Nothing is pending, so nothing
  expires, so his `expiry=host` ruling never fires and the purge cron never removes a guest's photograph on a timer.
  `held` is the only answer that puts a deadline back in.
- The host's meter: `handful` is the whole answer here. The meter never refunds, the account gate was the only
  per-person cost at a public QR, and `handful` replaces it with a bound that scales with the guest list (120 unproven
  guests spend 4.8 GB of a Free host's 20 GB month) rather than with the internet (one script, 5,000 photographs, the
  whole month, in an afternoon).
- The walls, as read: `/auth/v1/verify` 360 an hour per IP with bursts of 30; `/auth/v1/otp` 360 an hour project-wide,
  customizable; custom-SMTP emails 30 new users an hour, raisable; the 60s resend window, already wired. A room at the
  door queues, it does not wall. Documented defaults, labelled as such, pending `call:numbers`.

**The migrations, WRITTEN ONLY, applied by nobody.**
- The recommended shape needs no new identity column, which is its strongest practical argument:
  1. `alter table public.guests add column display_name text;` - typed, never proven, credit only, never an address and
     never an authorisation. A CHECK that refuses a value containing `@` is worth considering so the field cannot be
     used as the address slot by habit.
  2. `create_guest`: drop the `raise` when `not allow_anonymous_uploads` and the caller has no confirmed session. The
     column keeps its meaning for the VIEW (`gate-switch=one`), and the upload half becomes the allowance.
  3. `create_media` (or the guest upload RPC): refuse a photograph past the allowance for a guest row with
     `user_id is null`, and refuse video for such a row outright. The count is `select count(*) from media where
     guest_id = ...`; no column is added, because the bound is a product constant.
  4. The reads that draw the mark need `user_id is null` exposed on the album, the guest list and the queue payloads.
     That is a projection change, not a schema one: "unproven" is already derivable, because `guests.email` is
     verified-at-join, so a guest row with an owner is by construction proven.
- `private` or `public` additionally needs: `alter table public.guests add column claimed_email text;` (the proposed,
  unapplied column, "typed and NEVER proven; authorises nothing"), never unique, never indexed as an identity, never
  read by any authorisation path; plus, for `public` only, the scrub: on a successful verification of an address,
  `update public.guests set claimed_email = null where lower(claimed_email) = lower(<the proved address>)`, across every
  event, inside the definer path, or the album shows a stranger wearing a proved address.
- `held` additionally needs a release condition on the `pending` status and a day-seven job under `expiry=host`.
- `two` on the switch needs a second boolean on `events`; `one` needs only a rename in the copy, since
  `allow_anonymous_uploads` already gates the view; `none` needs a backfill decision for every event currently set to
  require accounts, which is the one-way door.

**What it cannot answer without him.** Three, and they are the three carried calls: the project's configured rate limits
(`numbers`), the size of the handful (`handful`), and whether a host may vouch at all (`vouch`). One more is his and is
not a call because it is a product position rather than a number: whether the mark is acceptable on a guest-facing
surface at all, which is step 3's overrule line and the only place the simpler shape is genuinely better.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). `guest-verify` opened round two on the same board id: round one's six
asks retired, its four rulings named as HELD on the head and on every frame that rests on them, and five decisions drawn
on the shipped door, album, faces row, queue and settings sheet at 375 and 1440 (`address`, `allowance`, `unproven`,
`collision`, `gate-switch`). The rate-limit wall was re-measured from Supabase's current table and round one's figures
corrected; the principle, the three jobs identity conflated, and five facts (two that are, three refused with the cost
that refused them) are drawn on the first step's frames. The host's never-refunding monthly meter is the measurement
under the allowance. Every caption reads the laid-out DOM, and one that said "4 of the album's 25" beside a frame
holding 16 was caught and rewired to count the drawn tiles. No production byte; the migrations either shape needs are
written in the Handoff and applied by nobody.
