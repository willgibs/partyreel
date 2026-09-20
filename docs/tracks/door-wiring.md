---
track: door-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c935f072"          # the launch-prep SHA the branch was cut from
board: app-door        # wiring; round two on the welcome tour is another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(auth)/
  - src/components/auth/
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/save-event-button.tsx
  - src/components/likes/likes-provider.tsx
  - src/components/app/welcome-flow.tsx
  - src/app/(app)/welcome/
  - src/lib/supabase/client.ts
  - src/lib/env.ts
  - src/lib/auth/remembered-email.ts
  - src/lib/auth/door-failure.ts
  - src/lib/auth/remembered-email.test.ts
  - src/lib/auth/door-failure.test.ts
  - src/app/(app)/account/passkeys-card.tsx
  - src/app/(app)/account/passkeys-actions.ts
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/app-door.json
  - docs/design/rulings.md
  - src/components/guest/entry-modal.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/app/admin/layout.tsx
  - src/components/admin/mfa-challenge.tsx
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/app-door/
---

# lp/door-wiring

**Goal.** Will's sixth batch (2026-09-20, build `806695d`) answered the next five boards on the desk and glass round two, and a second paste the same hour answered the demo and the pricing page; this lane is one of eight cut from them, on the seam the Orchestrator landed first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the sixth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `806695d1`)

- Owns: `src/app/(auth)/` (the /login page with the product beside it; the callback route emitting `?error=<kind>`),
  `src/components/auth/` (the new `account-door.tsx`; `login-form.tsx` a thin wrapper; `email-sign-in.tsx` keeps its
  exports and gains `sentAt` and an `onVerified({ existing, email })` shape; `password-sign-in.tsx` loses
  `CreateAccount` (creation is the code path) and keeps `SignIn` and `SetInitialPassword`; the hand-copied Google glyph
  in `login-form.tsx:38-59` deleted for `google-icon.tsx`), `src/components/guest/enter-event-prompt.tsx` (the gate
  wear: gains Google, keeps `?next=/e/<token>` and its blur/claim/refresh `onVerified`, passes `consent={false}` because
  the welcome step carries the line), `src/components/guest/save-event-button.tsx` (the Save wear: gains the consent
  line, keeps the newsletter switch as a `children` slot), `src/components/likes/likes-provider.tsx` (the like wear:
  gains the consent line), `src/components/app/welcome-flow.tsx` and `src/app/(app)/welcome/` (the tour as today, its words
  untouched: "Skip", "I'll look around first"; the closing "Create my first event" already primary, so nothing
  changes until round two), `src/lib/supabase/client.ts` (the
  experimental passkey option only when the flag is set), `src/lib/env.ts` (`NEXT_PUBLIC_PASSKEYS`, optional),
  the two NEW files by name `src/lib/auth/remembered-email.ts` and `src/lib/auth/door-failure.ts` (never the `src/lib/auth/` prefix: it covers `admin-context.ts` and `admin-host.ts`, which every admin page and the callback import), the new `src/app/(app)/account/passkeys-card.tsx`
  and its action (the one `<PasskeysCard />` line in `account/page.tsx` is this lane's exception AFTER syncing past
  `avatar-wiring`, which owns that page and lands first), `docs/systems/auth-accounts.md` (the door's facts in place).
  Reads, never edits: `entry-modal.tsx`, `entry-shell.tsx`, `save-account-prompt.tsx` (guest-wiring's), the admin's
  MFA files (not this lane), `rulings.md`, the app-door ledger.
- `AccountDoor` props: `wear: "login" | "gate" | "save" | "like"` (each wear its heading and reason line),
  `methods: { code: true; google?: boolean; password?: boolean }`, `emailRedirectTo`, `onVerified`, `consent?`
  (default true), `hintEmail?`. One email field (`EmailSignIn` inside, `shouldCreateUser` true), Google beside it, a
  password as a quiet "Have a password?" link that swaps in `SignIn` only. `/login` leads with the code (the password
  drops to the link).
- `existing=tell` without an enumeration leak: decided ONLY after `verifyOtp` succeeds, from SERVER facts, never a
  clock on the phone (a server read of the own profile: `welcomed_at` or `password_set_at` set, or `created_at` older
  than this sign-in by more than a few minutes; the same rule on the code path and the magic-link callback); the line
  "Signed you into the account <email> already had.", dismissible, with "Not you?" calling `signOut()` client-side
  and resetting the door with the field cleared; shown ONLY under a create intent (the gate, Save and like wears,
  and /login reached as `?intent=create` from the marketing "Start free" door), never on a plain sign-in, where
  every returning host's code would otherwise read as an account it already had. The gate wear DEFERS both its
  `router.refresh()` and its
  `claimAnonymousUploads` until the line is dismissed or four seconds pass, so "Not you?" never leaves the wrong
  account owning a guest's photographs (the claim RPC never re-stamps an owned row).
- `failure=paths`: `door-failure.ts` maps a kind to one short sentence and three real buttons: `expired_link` (Send a
  new code / Use Google / Type the code), `wrong_code` (Try again / Resend / Different email), `send_failed` (Retry /
  Google / Contact), `rate_limited` (a countdown / Google / Contact; a 429 from `signInWithOtp` lands here),
  `google_failed` (Retry Google / Email me a code / Contact), `password_mismatch` (Email me a code / Forgot / Google);
  the callback emits the kind, the /login page renders through the same table; the visual redesign is inside the lane.
- `return=tap`, FLAGGED and wired safely: passkeys behind `NEXT_PUBLIC_PASSKEYS` on Supabase's experimental API
  (`signInWithPasskey`, `registerPasskey`, in the installed SDK; no conditional mediation in auth-js's WebAuthn
  helper, so the one-press is a plain "Sign in with a passkey" button shown only when `PublicKeyCredential` exists
  and a `pr_passkey_hint` was set at registration); registration offered once after a code sign-in on /login and
  from the Passwords card on /account; the Google one-press is never an auto sign-in: "Continue as <email>" through
  the chooser with `login_hint` when the remembered email's last method was Google; `remembered-email.ts` (localStorage,
  a hint never authorization) pre-fills the field for "welcome back, one field" on /login ONLY: the gate and Save
  wears pass no hint, because a phone passed around a party or a venue's iPad must never show the last guest's
  address; no email ever in a URL.
  Supabase's dashboard must enable passkeys and the RP id must match the apex: routed to Will; the flag stays off on
  the alias until he does, and the lane says so.
- `page=beside`: /login as a two-column grid at `lg` (the door left at `max-w-sm`; a mosaic of `MARKETING_IMAGES`
  frames right through `next/image`); under `lg` a 120 px band above the card.
- Tests: unit tests for `door-failure.ts` and `remembered-email.ts`; a `// @contract-for:` test for `AccountDoor` (the
  four wears render their reason and the consent line where they must; the existing-account line only after a
  verified code; the passkey button absent without the flag AND present with the flag, the hint and a mocked
  `PublicKeyCredential` in jsdom), on the mocked `EmailSignIn` pattern of
  `entry-modal.test.tsx:20-30` (the guest lane's test: the door lane exports the compatible `onVerified` shape and
  lists it). Red-team on the alias: /login at 1440 and 375 signed out (the code first, Google beside, the password
  link, the mosaic), a wrong code and an expired link (the buttons), the guest gate on the disposable event with
  Google present, the Save and like dialogs' consent lines; the existing-account line and the passkey row are Will's
  (signed in, and the dashboard flag).
- His to overrule: the four wears' reason lines; the create-intent scope of the existing-account line; the failure
  table's three buttons per kind; the passkey hint's placement; the remembered email on /login as the fallback (his
  approved answer, though his note preferred the passkey: it goes the day passkeys are on); the mosaic's frames.

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
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
