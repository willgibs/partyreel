---
track: guest-door
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/entry-
  - src/components/guest/door
  - src/components/guest/guest-name-
  - src/components/guest/identify-step
  - src/components/guest/password-gate
  - src/components/guest/upload-step
  - src/components/guest/add-email-dialog
  - src/components/guest/claim-handle-prompt
  - src/components/guest/save-account-prompt
  - src/components/guest/follow-moment-card
  - src/components/guest/guest-upload
  - src/components/guest/event-experience
  - src/components/guest/guest-action-dock
  - src/components/guest/upload/
  - src/components/guest/upload-tracker
  - src/components/auth/confirm-email-dialog
  - src/lib/guest/
  - src/app/(dev)/design/sandbox/guest-capture/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - docs/reviews/guest-capture.json
  - src/app/(dev)/design/sandbox/identity-door/
  - src/lib/shared/sampled-palette.ts
  - src/components/ui/sheet.tsx
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
  - docs/systems/design-system.md
---

# lp/guest-door

**Goal.** The guest's door wears lit and keeps what a guest adds: `identity-door` r2's lit look (its own pieces) on every production door screen, and `guest-capture` r1's five answers built: the keep-what-you-added ask as the door's last screen after the first upload, the name told with a Change that changes it, one confirm beat with the host's Follow, and a tracker beside Add photos with a count of what waits for the host.

## The brief

**Where this comes from.** Will's sitting on build 10 (`docs/reviews/identity-door.json`, `docs/reviews/guest-capture.json`). Each option's drawing on its board (`src/app/(dev)/design/sandbox/identity-door/`, `.../guest-capture/`) is the spec. A pick is the best of what was drawn: build it as a working version, refine it inside the wiring where production shows a better answer, and list each refinement as his to overrule.

**1. Lit, its own pieces, on the production door** (`look=lit`, overruling `peek`). What lit draws (`sandbox/identity-door/looks.tsx`: `LitProvider`, `Lamp`, `LitHero`, `Ticker`; `identity-door.css`):
- the scrim (`looks.tsx:511`); production's `DOOR_SCRIM` (`entry-shell.tsx:27`) was kept as a one-line restyle for exactly this;
- the lamp on the sheet's free edge (the top on a phone, the left at a desk), coloured from the album's three newest photos through `src/lib/shared/sampled-palette.ts`, with the five house hues until the sample lands and at a password event (no photo can be sampled before the unlock); stronger on the code screen, blooming on "You're in";
- the welcome's hero: the event name large beside the host's face, "Hosted by" over the date;
- the live count ticking as photos land (the welcome's row and the gate's title);
- the menu card's lit edge.

Carry it to every held sheet the door shows, including the screens the board never drew (the password step, the upload step, the demo's welcome, the stalled beat), and to the change-email sheet (`add-email-dialog.tsx`) and the confirm sheet (`auth/confirm-email-dialog.tsx`) when they open from the door. Reduced motion: the count lands without ticking and the lamp holds still.

**Not in this lane:** the door's remaining icons and copy (the chooser, name, gate, code, log in and create account, "You're in", the menu's rows, the change sheet's words). Will's note, "The remaining icon + copy items could likely be redesigned within this as well", goes through `identity-door` r3 first (his call, 2026-09-27), which a board lane is drawing now. Keep production's icons and words as they are.

**2. `guest-capture` r1, all five** (each option drawn in `sandbox/guest-capture/parts.tsx`):
- **`moment=first` and `shape=sheet-step`** (the second overrules `inline`). The ask to keep what she added arrives the instant her first file lands, as the door's LAST screen. The door no longer closes onto the album after the upload (`src/lib/guest/entry-steps.ts:154-165`; the open state is derived in `event-experience.tsx:333-337`); its last screen is the ask, in the same sheet that offered the optional email a minute earlier (`OfferSheet`: "Sent / Your photo joined Maya's album.", the offer, Confirm your email, Maybe later). His note: "I like bubbling it up front and center, so its clearly visible to either input email or dismissed... At this point, we've already gotten the guest's value to the host (uploads), so we're simply trying to capture the guest as a Partyreel user now." The album's own offer card (`save-account-prompt.tsx`, through `claim-handle-prompt.tsx`) then has little left to ask of a guest who answered or dismissed at the door: decide what remains of it (a guest back later, the demo, uploads closed) and say why.
- **`follow=card`.** The moment card keeps its own row for the host with its own Follow, and the Guests list keeps one on each name with a page, as shipped (`follow-moment-card.tsx`). His note: "needs to work within any multi-claim handling. Follow doesn't have to be pushed as hard as a feature relative to uploads/verifications/etc." Today a confirm that also claimed uploads at other events fires a second toast (`src/lib/guest/use-confirm-return.ts`), and the name toast below would be a third in the same beat. Make the confirm return ONE beat: the moment card with the host's row, the other events said once, the name told; never stacked toasts. How a batch of claimed events is followed up on the dashboard is `identity-claims` r2's question, not this lane's.
- **`name=told`.** The name she typed becomes her account's name at once, then she is told: "You're on as Priya." His note: "Rather than 'Change it in Account', we could likely have a simple 'Change' link to actually do so. This is better UX." So Change edits the name right there. Use the lightest surface that works on a phone with the keyboard up, and keep it small (the new `popups` board may reshape surfaces). Write through the existing display-name action. Today the name is written silently in two places (`claim-handle-prompt.tsx:135-142`, `entry-modal.tsx:436-439`); both now tell.
- **`tracker=button`.** A round button beside Add photos (the page's full-width one, `event-experience.tsx:986-995`, and the dock's, `guest-action-dock.tsx:112-125`) opens a list of her own batch, each row with its status (sending, waiting for the host, approved, refused: the board's "Your uploads"). His note: "Maybe the button could have a little status icon (like notification buttons tend to in nav) to display the item count (number only) of pending items. This makes the button feel more clickable ('what's that 12? oh my uploads waiting for approval')". So add a count badge, the number only, of her items waiting for the host. Show it only where she has something sent at a moderated event; never on the demo. Held photos show today only as `WaitingTile` (`upload/stack-tile.tsx:149-178`, `mediaStatus === "pending"`): find the source of truth for her items' statuses (her uploads, not the approved album) and keep it live without a new poll where the album's sync can carry it. The list opens in a sheet (the board's drawing) until `popups` answers.

**3. Retire `guest-capture`** once its five are built, in your branch, in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (your named exceptions; the album-columns retirement `95c8aa56` is the template). The Orchestrator deletes its ledger. `identity-door` stays: r3 is open.

**Neighbours.** Board lanes are drawing `identity-door` r3 and a new `popups` board (sandbox only). `mine-none` edits `live-gallery.tsx` and the album's tiles. `profile-setup` owns the dashboard, `src/components/social/` (the follow button is your read) and the profile setup it is building. When it announces the setup's route in `orchestrator.md`, point the moment card's "Claim a handle" row there; otherwise leave `/account#public-profile` and say so.

**Verify.** Local on your port against the real Supabase and R2, wherever the door runs locally (the upload itself is allow-listed; the Orchestrator's red-team walks it live on the alias):
- the door at 375 and 1440, lit on every screen including password and upload;
- the keep screen after the first file;
- the told name and its Change;
- one beat on a confirm return;
- the tracker's badge counting what waits;
- reduced motion.

Put the `guest-flow.md` lines in the Handoff for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does her tracker tell a refusal?** The brief's four statuses include refused; `host-curation`'s `told` is still
  open (recommended `line`), and the public FAQ says hosts hide "silently" (`a-photo-is-missing-from-the-album`).
  Recommended and built: the quiet line, "Not in the album" on her own row, no reason, seen by nobody else
  (`TRACKER_TELLS_REFUSAL`, `src/lib/guest/upload-tracker.ts`); `false` drops refused rows from the list and from the
  route in one edit. The FAQ follows `told` (a Deferred line).
- **Lit in dark: the wash, or the words?** Measured off real pixels (headless Chrome, reduced motion, logs in
  `partyreel-wt/_scratch/guest-door/`): lit's dark register as drawn leaves the words at a resting sheet's free edge
  inside the light, the welcome's eyebrow and the keep's "Sent" at 2.3:1 and the first line under them at 3.1:1 in a
  hand, a line's first letters about 3:1 at a desk (`contrast-asis.log`); light clears 5:1. Recommended and built
  (`320dafd2`): in dark the resting lamp spends itself inside the sheet's own 24px padding, a rim of the album's
  colour, every word's ground at 4.5:1 or better (eyebrow 5.0, its brightest pixel 4.49; first line 5.7; the desk's
  worst pixel 4.9: `contrast-final2.log`, `contrast-keep-final.log`); light keeps the wash, and the bloom keeps its
  own ("You're in" stands below it, 5.9:1: `contrast-success-asis.log`). The untried other way: keep the wash and
  brighten the words inside its reach. Compare `shot-asis-375-dark-welcome.png` with
  `shot-final2-375-dark-welcome.png`.

## System-doc edits (in place, owned facts only)

- none by the lane: `guest-flow.md` and `design-system.md` are reads, so their lines are in the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- Help-sync, the guest door: `find-your-uploads-and-events` and `how-guests-join-and-upload` still call the keep a
  card under the first upload (it is the door's last screen, and Maybe later puts it down for that event on that
  device) and never say a typed name becomes the account's ("You're on as …", with Change);
  `a-photo-is-missing-from-the-album` promises hosts hide "silently" while her tracker says "Not in the album"
  (follows `host-curation`'s `told`) (from `guest-door`).
- Guests: her tracker draws a picture only for what is in the album; her earlier held or refused items show a
  placeholder, since a guest is never presigned media outside the album (`grid-items.ts`), so drawing them needs an
  own-media presign rule (from `guest-door`).
- Guests: a refusal reaches her tracker at its next read (mount or opening), since the album's sync moves only in
  and out of approved; a live refusal needs its own signal (from `guest-door`).
- Guest door: a quieter Follow on the moment card (his note: "Follow doesn't have to be pushed as hard") needs a
  `FollowButton` variant in `src/components/social/`; the card keeps the shipped one until then (from `guest-door`).
- Guest door: a full-reload confirm return that moves nothing of this album plays no moment, so it says the other
  events but not the told name (the typed name reaches the account through `adoptDoorName` with no beat to carry
  it) (from `guest-door`).

## Handoff (replaces the chat report)

- Work commits, pushed: `134f7aa2` (the door lit, the keep as its last screen, one confirm beat, the told name, her
  tracker), `6e7dc470` (the exception below), `ca018345` (the Claim rows to `PROFILE_SETUP_PATH`), `3eade6c6`
  (`guest-capture` retired, one commit on `95c8aa56`'s template), `fb359113` (previews-only sampling; pins),
  `320dafd2` (dark's resting lamp spent in the margin; the keep rests). Syncs: `d39e808d` (profile-setup, to import
  `PROFILE_SETUP_PATH` rather than a literal) and `00d216e0` (door-r3 merged into a read, `sandbox/identity-door/`;
  its manifest's deletion took this lane's one-line exception to it, `b6098663`, with it). The head is in the chat
  line.
- Gates on `320dafd2`, the synced tree, each on its own exit code (logs `partyreel-wt/_scratch/guest-door/g2-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, 5 warnings, none in a touched file); `pnpm test` 0 (499 files, 5615
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (260 checks, 0
  failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and the exceptions:
  `touchpoints.ts`, `sandbox/registry.ts` and `(shell)/lab/boards.ts` (the brief's retirement lines);
  `src/app/api/guests/mine/route.ts` and `src/lib/db/mutations/guest-media.ts` with their tests, in their own commit
  `6e7dc470`: the tracker's one read (her own rows' statuses by ticket or by account under `getUser()`, a private or
  unknown album answering empty, the limiter checked, the old ids path unchanged), the source of truth the brief
  asked for, since the album's sync carries only what is approved.
- Lit, its own pieces, on every door screen (the scrim, the lamp on the free edge from the album's three newest
  previews, the house five until the sample and at a password event, stronger on the code screen, blooming on
  "You're in"; the welcome's hero; the count ticking in the welcome's row and the gate's title; the menu card's edge),
  carried to the password, upload, demo welcome, stalled beat, change and confirm sheets (`door/lit.tsx`,
  `door/lit.css`, `lib/guest/door-light.ts`, `door/album-light.tsx`).
- The keep, the door's last step the instant her first file lands (`keep` in `entry-steps.ts`; `KeepOffer` and
  `KeepConfirm` in `save-account-prompt.tsx`, the file kept for its touchpoints); the album's offer card is retired:
  signed out, the slot says nothing (the door asked; a guest who put it down is not asked again under the album),
  her menu's card stays the ask's standing home, the demo never asks, and closed uploads never land a first file.
- One confirm beat (`lib/guest/confirm-beat.ts`): the moment card when it plays (the host's row, the other events
  said once, the name told), else one toast from the page after the door's hold; the three doors report, never toast.
- The told name: "You're on as Priya." with a Change that edits it in place in the card, or opens the name door in
  its `account` mode from the toast; both silent writers now tell (`settle-name.ts`, `claim-handle-prompt.tsx`).
- Her tracker: a round button beside Add in the row and the dock, its badge the number waiting for the host, "Your
  uploads" in the responsive sheet, only where she sent something at a moderated event, never the demo or the host;
  read at mount and at each opening, approvals live through the album's own sync (`upload-tracker.ts`/`.tsx`).
- The Claim rows (the moment card's and the handle card's) point at `PROFILE_SETUP_PATH`, imported through the sync.
- `guest-capture` retired (`3eade6c6`): the Orchestrator deletes `docs/reviews/guest-capture.json`.
- `guest-flow.md`, for the Orchestrator, each in place:
  - "THERE IS NO SAVE, ANYWHERE" (its offer sentence): "Keeping what a guest added is asked AFTER her first file
    lands, as the door's LAST step (`keep`, `save-account-prompt.tsx`), never a button above an album a stranger has
    not seen yet."
  - "THE OFFER IS THE CAPTURE FLOW" becomes "THE KEEP IS THE CAPTURE FLOW": due the instant a signed-out guest's
    first file lands this visit, from the door's upload step or the album's Add, never the demo or the host
    (`keepDue`, `event-experience.tsx`); the door reopens on "Sent" over what went ("Your photo joined Maya's
    album.", or "Your photo is waiting for the host." where uploads are held), the ask, Confirm your email (the
    account door in the same held sheet, its `keep` wear, code or Google, carrying the one newsletter opt-in through
    `/api/guests/capture-email`) and Maybe later (put down for that event on that device, `pr_save_prompt_<qr>`,
    `keep-ask.ts`). `ClaimHandlePrompt`'s slot: signed out → nothing; just confirmed → the moment card (what they
    hold, the told name with Change, the other events once, the host to follow, Claim to `PROFILE_SETUP_PATH`);
    signed in without a handle → the handle card (Claim to the same setup); with one → nothing.
  - "THREE CONFIRM DOORS": the door's keep (inside the held sheet), the Unverified mark and the header name menu
    (these two through `confirm-email-dialog.tsx`) all wear the account door's `keep` wear and claim only.
  - "THE RETURN", its last two sentences: "★ A CONFIRMATION IS ONE BEAT, NEVER STACKED TOASTS (`confirm-beat.ts`):
    when the moment plays, its card says the other events once and tells the name; when it does not, the doors report
    and the page says it once, after the door's hold: "You're on as Priya." with a Change (the name door's `account`
    mode) and the other events as its line, or "We added your uploads to your account." alone when only other events
    moved. The (app) layout's own mount still says it whenever uploads moved."
  - The itinerary: `… | upload | keep`, the keep last and only when due (never ahead of a step she still owes).
  - The shell, after `door.css`: "★ THE DOOR IS LIT (`door/lit.tsx`, `door/lit.css`): `DOOR_SCRIM` is the lightbox's
    ground at a gentler dim (30% black, a 28px blur, brightness .72), and a lamp on the sheet's free edge (the top in
    a hand, the left at a desk) wears the hues of the album's three newest previews, sampled only while a lamp is lit
    (`door-light.ts`, `door/album-light.tsx`; the house five until the sample lands and at a password event);
    stronger on the code screen, blooming on "You're in"; the change and confirm sheets and her menu's card wear it
    too. In dark the resting lamp is spent inside the sheet's padding (a muted word inside the atmosphere register
    reads 2:1, measured); light keeps the wash."
  - The welcome: the event name large beside the host's face with "Hosted by" over the date, and the count ticking
    as photographs land (`LiveCount`; the gate's title ticks too; reduced motion lands the number, no tick).
  - The affordance table: the one FREE surface is the name door over the album, from the menu's "Change name"
    (`openToName("edit")`) or the told name's Change (`openToName("account", name)`, which writes the account's name).
  - The naming: `guest-name-step.tsx` has FOUR modes, the fourth `account` (the account's display name through
    `updateDisplayNameAction`, dismissible like `edit`).
  - "THE CONFIRMATION'S FOUR WRITES", after "refresh.": "Then she is TOLD: the name she typed is the account's now
    (the account's own name wins, and is the one told), said once, with a Change."
  - The WAITING tile, after it: "★ Her tracker says where each of hers stands (`upload-tracker.ts`, pure): this
    visit's queue plus her own rows through `/api/guests/mine` `{statuses: true}`, read at mount and at each opening,
    never on a timer; an approval arrives live through the album's sync, a refusal at the next read, as "Not in the
    album" (`TRACKER_TELLS_REFUSAL`); only what is in the album draws its picture."
  - The empty state: "At 0 items the header and dock drop their Add and the CTA owns it, only while nothing of hers
    is in flight or waiting: her tiles at the album's head take its place, so the row's Add and her tracker return."
- `design-system.md`, the Spill bullet, for the Orchestrator: "★ Spill in dark stays off the words: under a muted
  word the atmosphere register reads about 2:1, so a lamp behind copy spends itself in the padding in dark (the
  door's, `door/lit.css`, measured)."
- ROADMAP, answered: line 46 (lit's house five at a password event) is carried; line 62 (the tracker's server half)
  is answered for the tracker, its toast half being line 49's; line 138 (`guest-capture`'s `sheet-step` peek) left
  with the board.
- Verified: the door at 375 and 1440, light and dark, on every screen including password, upload, stalled, the menu
  and both sheets, walked in the Browser pane before the sync (no capture kept), and after the dark fix in
  `shot-final2-*-welcome.png`, `shot-final-*-light-welcome.png`, `shot-final-*-menu.png`, `shot-keepfinal-*.png`
  (the keep forced by a patch since reverted; a real upload is the alias's); the tracker walked on the probe event
  (an approval and a hide reached the badge); the count ticked 3 to 4 live; the rest pinned in
  `entry-steps.test.ts`, `entry-modal.test.tsx`, `confirm-beat.test.tsx`, `use-confirm-return.test.tsx`,
  `confirm-email-dialog.test.tsx`, `follow-moment-card.test.tsx`, `claim-handle-prompt.test.tsx`,
  `upload-tracker.test.ts(x)`, `mine/route.test.ts`, `guest-media.test.ts`, `door/lit.test.tsx`,
  `door/album-light.test.tsx`, `door-light.test.tsx`, `keep-ask.test.tsx`.
- Test data, all disposable: event `55bcdbe0` "Guest door tracker probe (disposable)" (held uploads; guest `104b81e6`
  "Priya T." with media `95344efe` pending, `4ba5e2cb` hidden, `58057870` approved); guest `53fa1e89` "Lit Walk" on
  "Reel lane probe (disposable)".
- Assets requested from Will: none.
- Board ideas: carry dark's margin to `identity-door`'s board (its `lit.tsx` and `identity-door.css` draw the
  as-picked wash, 2.3:1 under a muted word), and draw the keep resting, or ask whether a blooming keep moves its words
  below the light, so his next sitting judges the look production wears.
- Board ideas: tapping her own waiting tile at the album's head could open her tracker.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The keep also follows a first file added through the album's Add, not only the door's upload step.
  - The album's offer card is retired rather than kept for a guest back later (the menu card is that home).
  - Maybe later lasts per event per device, under the old card's key, so an old dismissal still holds.
  - The keep wears the door's step grammar (a "Sent" eyebrow with a check, the page heading, a primary, a ghost
    Maybe later) rather than OfferSheet's own head.
  - Where uploads are held, "Sent" says "Your photo is waiting for the host." rather than "joined the album".
  - The keep rests the lamp where door-r3's board blooms it (its words sit where a bloom reads 2:1 in dark).
  - Dark's resting lamp is a rim spent in the padding (the second Question).
  - The told name is the account's own when it already had one, and is told only when a name was typed here.
  - Change edits in place in the card; the toast's Change opens the name door in its `account` mode.
  - Follow stays the shipped primary on the moment card until a quieter variant exists.
  - The tracker's words: "Sending…", "Waiting for the host", "In the album", "Not in the album"; "Your uploads".
  - The badge counts only what waits for the host; the button stands as soon as her first file is in the air.
  - The welcome's hero: `text-hero` in a hand, `text-section` at a desk; the demo's welcome keeps its role step.
  - Add (and the tracker) return at an empty moderated album while her files wait at its head.
  - The lamp samples previews only (a video's poster), never an original or a tile with no link.
  - The code screen's stronger lamp is read off the code's own entry (`:has([data-otp-entry])`), not a prop.
  - The handle card's Claim also points at the setup (the brief named the moment card's row).
  - Her earlier held or refused items draw a placeholder in the tracker (nothing outside the album is presigned).
- Look at first, on the alias: a real first upload as a signed-out guest at a disposable held-uploads event (the door
  reopens on the keep, "waiting for the host", and the badge counts it; approve it from Review and watch the badge
  fall without a reload); Confirm your email from that keep (through the account chooser) for the one beat, the
  moment card telling the name, and its Change; Maybe later on a second device; then the lamp's own sampled hues
  (R2's CORS keeps localhost on the house five) in light and dark at 375 and 1440.
