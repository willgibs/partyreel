---
track: settings-wiring
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929120000_event_doors.sql
  - src/components/app/event-settings/
  - src/components/app/event-settings-form.tsx
  - src/components/app/event-settings-form.test.tsx
  - src/components/app/visibility-selector.tsx
  - src/components/app/pricing/lock-chip.tsx
  - src/lib/events/visibility-labels.ts
  - src/lib/events/guest-experience-summary
  - src/lib/event/door
  - src/lib/db/queries/event-doors
  - src/lib/db/mutations/event-doors
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/app/(app)/dashboard/[eventId]/settings/
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/actions.ts
  - src/app/(app)/dashboard/[eventId]/actions.test.ts
  - src/components/app/event-feed/room-card.ts
  - src/components/social/guest-list
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/door/
  - src/components/guest/entry-shell.tsx
  - src/components/shared/not-found-screen.tsx
  - content/help/
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - src/app/(dev)/design/sandbox/event-settings/
  # added at boot (2026-09-29): the paths the doors reach beyond the starting list
  - src/lib/db/row-cap-sql.test.ts
  - src/lib/db/queries/guest-events
  - src/lib/db/queries/album-guest
  - src/lib/db/queries/event-card
  - src/lib/db/queries/claims
  - src/lib/db/queries/notifications
  - src/lib/db/queries/events
  - src/lib/db/mutations/guest
  - src/lib/db/mutations/events
  - src/lib/events/closed-door
  - src/lib/events/gallery-access
  - src/lib/events/album-viewer
  - src/lib/events/upload-lock
  - src/lib/validation/event
  - src/lib/validation/upload
  - src/app/api/guests/route
  - src/app/api/guests/ask/
  - src/app/api/guests/door/
  - src/app/api/guests/name/
  - src/app/api/guests/email/
  - src/app/api/guests/mine/
  - src/app/api/guests/remove/
  - src/app/api/guests/unlock/
  - src/app/api/r2/presign-upload/
  - src/app/api/r2/complete-upload/
  - src/app/api/export/guest/
  - src/app/api/album/guest/
  - src/app/(guest)/e/[token]/card/
  - src/lib/guest/entry-steps
  - src/lib/guest/event-card
  - src/components/guest/entry-modal
  - src/components/guest/event-experience.tsx
  - src/components/guest/upload/
  - src/lib/dashboard/guest-events
  - src/lib/dashboard/next-step
  - src/lib/notifications/build
  - src/components/app/share/event-sheets.tsx
  - src/components/ui/popup.test.tsx
  - src/components/app/event-blocks/
  - src/lib/errors/codes
  - src/lib/guest/join
  - src/components/guest/identify-step
  # added in phase 2 (the guest path) and on the Orchestrator's milestone-30 relay
  - src/lib/guest/use-stored-session
  - src/lib/guest/session-cookie.test.ts
  - src/components/guest/guest-upload.tsx
  - src/components/guest/upload-step.tsx
  - src/lib/events/testing/
  - src/components/marketing/sections/features/album/visibility-frames.tsx
  - src/components/marketing/mock-parity.test.ts
  - src/components/app/share/event-share-provider
  # added in phases 3 and 4 (the settings, the door's page)
  - src/components/ui/dormant
  - src/components/ui/consequence-line
  - src/components/app/event-slug-control
  - src/lib/use-unsaved-changes-guard.ts
  - src/components/app/pricing/gated-sites.test.ts
  - src/lib/events/visibility-labels.test.ts
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/components/interactive-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json
  # added in phase 5 (the Guests room, the pulse, the bell)
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/dashboard/next-step-band.tsx
  # added in phase 6 (the words, and the gated album's Guest card the sweep found)
  - src/lib/events/event-blocks.ts
  - src/lib/events/event-blocks.test.ts
  - src/lib/db/queries/social
  - src/components/shared/unverified-mark
  - src/components/marketing/sections/features/privacy/access-switch.tsx
  - src/components/marketing/sections/features/privacy/never-rides-along.tsx
  - src/components/marketing/sections/features/privacy/privacy-faq.ts
  - src/components/marketing/sections/home/privacy.tsx
  - src/components/marketing/sections/home/trust-strip.tsx
  - src/components/marketing/jsonld.tsx
  - src/components/marketing/faq-data.ts
  - src/components/marketing/sections/features/album/album-copy.ts
  - src/components/marketing/sections/features/album/album-faq.ts
  - src/components/marketing/sections/features/guests/credited-album.tsx
  - src/app/(marketing)/(cinema)/features/guests/page.tsx
  - src/components/marketing/sections/pricing/comparison-table.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/components/marketing/help/step-screens/registry.ts
  - src/components/marketing/help/step-screens/door-screens.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-settings.json
  - docs/reviews/locked-door.json
  - docs/systems/database-security.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/profiles-social.md
  - docs/systems/billing-caps.md
  - src/lib/constants/tiers.ts
---

# lp/settings-wiring

**Goal.** Wire every pick on `event-settings` r1 end to end: settings rebuilt as four sentence rows with pages of their own, dormant settings tucked under their switches, a Videos switch locked on Free, and the door in steps (Public, Private with its gates, Only me), with the three missing doors built (approve newcomers, close to newcomers, the invite list), the Guests room's At the door and Invited sections with an Invite action, and the hub saying the door.

## The brief

**His words** (`docs/reviews/event-settings.json`, build 19's sitting, 2026-09-29):
- `structure=summary`: "This feels much more organized/focused/targeted, so everything isn't thrown at a new host at once. More learn-as-you-explore. Option 4 did have a super neat idea though - would be curious if we could work that into this selection somehow, to effectively be used as some sort of natural language overview/config of their current settings."
- `idle=greyed`: "I don't want the no current effect settings to fully disappear because they do an amazing job at hinting at unused features that may not be known ... I don't love this selected option's disabled design simply going grey. I feel like there could be a more \"magical\" transition that keeps unused features visible, nested clearly to show what controls what, but not always showing the full state of all configs when some have no effect, instead having a neat way to kind of toggle in and out of those so they're more subtle when unused."
- `lock=switch`: "We want free hosts to *know* they're missing out on videos so they upgrade, not hide that loss. However, this should have a disabled state so it's more clear they can't use it on free."
- `join=steps`: "I love stepping this, so they can visualize the guest path ... Would it feel even more intuitive if we switched the 'what the link opens' options to 'public' (anyone type acceptance), 'private' (password, approval, invites, etc), and 'me' (host only, reframes private as gated). Each gate should have a clear tooltip or explainer on its own purpose, so a host *never* has to guess here. Help center could be integrated subtlety (not article links everywhere)."
- `waiting=held`: "This could definitely be redesigned to be a more engaging waiting experience." (That redesign is `locked-door` r2's; build the pick.)
- `inside=count`: "Maybe we even change to \"X guests are already in.\" ... We should flag that swap too, where switching to 'me' with guests already in closes them out completely."
- `editor=both`: "Could this be more easily managed under 'Guests' with a pointer from here, so this settings page can't potentially become a 200 person invite list? ... the guests page could use invite as a feature (maybe main action from empty state, or as an action somewhere once guests start joining) which is not exclusive to invite-only event gates, simply helping the host invite guests as part of sharing? Would ideally work with their native contacts."
- `opens=page` and `queue=room` as drawn. The `queue` note's hub row (order, fades) is `crumbs-12`'s, running beside you.

**The build, as Will approved it in chat (2026-09-29):**
- **Four rows, each a sentence whose key words are live controls** (tap "anyone with the link" to change who gets in), each row opening its own page with a back arrow (the panel at a desk, the screen in a hand). `src/lib/events/guest-experience-summary.ts` already writes such sentences: one home for them. The form's one Save retires; every control saves itself.
- **The dormant pattern, one primitive:** a setting with no effect right now stays in view, tucked under the switch that controls it as one quiet line naming what's inside (the reel off: its look and hold), and unfolds into its full controls with a transition when that switch turns on (reduced motion: no movement). Never plain grey, never hidden. Used by the reel's look and hold, A photo first while uploads are paused, and the door's steps under Only me.
- **The consequence line, one primitive:** a change that affects people already in says what happens before it happens, in the control's own place. The door swaps use it; the disposable camera's mode switch will.
- **Videos, a switch:** on Free a clear locked state (off, the Pro mark), and pressing it opens the plans; on Event Pass and Pro it works, so a host can keep an album to photos. Its column, the upload gate's check and the guest picker's flag ride your migration. LockChip leaves its settings row.
- **The door, in steps**, numbered in the order a guest meets them: (1) what the link opens: **Public** (anyone with the link), **Private** (a gate), **Only me** (today's `private`); (2) the gate, under Private: a password, you let each person in, your invite list, or only people already in; (3) an email first; (4) a photo first. Each gate carries one line on what a guest meets, and help sits one tap away behind a small (i), never an article link per row. Check the words against the profile's own public and private (the "2 private events" count) so the two never collide, and name the enum's values however the data wants: the words are the UI's.
- **One rule for everyone already in:** a gate stops newcomers; only Only me and a block shut out someone already in. Under a gate: "31 guests are already in". Switching to Only me says it closes them out. `previous=private` (locked-door r1): someone who was in and is shut out reads that the host made it private, as her dashboard card already says; a blocked person reads the same (the block stays invisible).
- **The missing doors**, carrying event-safety r1's `newcomer=same` (one shut screen for everyone new: private, closed, declined, unlisted and blocked alike) and `unlisted=ask` (someone not on the invite list can ask to be let in):
  - *Approve newcomers:* the lit door she confirmed in says the host will let her in and opens onto the album by itself the moment the host does (`waiting=held`). The waiting door checks in about every 30 s, so the banked let-in mail (ROADMAP's Emails bucket) can later tell whether she left; no mail sends now. `queue=room`: an At the door section heads the Guests room, Let in and Decline on each row. A waiting newcomer counts on the hub's Guests card and wherever the host is already told about held uploads (the pulse, the bell), with no new mail. A declined newcomer meets the one shut screen and cannot keep re-asking.
  - *Close to newcomers:* everyone already in keeps adding; nobody new joins.
  - *The invite list* (`editor=both`: type one and press Enter, or paste two hundred and they land as chips, the unreadable flagged) lives in the Guests room as an Invited section, each person marked joined or not yet, capped per event; the door's step points to it ("Only people you invite · 24 invited · Manage in Guests"). An address matches only once confirmed, so the email step is held on for this gate.
- **Invite, in Guests, on every door:** the room's main action while it is empty and a quiet one after, opening the event's share sheet (the phone's own sheet where there is one, with a ready message, the link and the code). It sends nothing: mail on the host's behalf is banked for the email exploration.
- **The hub:** its Settings card says the door (Public, Private and its gate, Only me) through one function that words the door everywhere (`src/lib/events/visibility-labels.ts` is today's home).

**Security (non-negotiable):**
- Every guest path re-checks the door on every request: joining, opening the album, uploading, liking, and both claims (this device's tokens and the claims review's rows).
- Keyed on the account (every device) or one guest row (one browser), never a device id or an IP.
- A pending newcomer reads nothing of the album. Declined, closed-out, unlisted and blocked answer exactly as private does, in response and timing, so a block is never told apart.
- Requests to join are rate-limited (`action_attempts`); only the event's host lets in, declines or edits the list, re-checked inside SECURITY DEFINER RPCs with `getUser()` in every Server Function; `anon` gets no table access; every function created revokes EXECUTE from `public` AND `anon` explicitly; host table writes stay column-locked (grants additive, never a table-level revoke).
- You own every guest-path function replacement this batch (no other lane replaces one; `tier_limits()` is nobody's). A function you replace starts from its newest definition in `supabase/migrations/` (`event_blocks`, `like_private` and `slug_family` are the newest bodies).

**The migration** (write it; the Orchestrator applies it and regenerates the types): `supabase/migrations/20260929120000_event_doors.sql`, and add any further file to `owns` before writing it. Exercise every refusal inside a rolled-back transaction: a pending, a declined, a closed-out, an unlisted and a blocked newcomer each refused on every path; someone already in allowed under each gate and shut out by Only me; a Pro album with videos off refusing a video; the host allowed; another host refused.

**Words:** the sweep covers the app, the help (help tracks shipped reality: every article naming visibility, the password or who can join, `day-of-checklist-for-hosts` included), the pricing page and marketing. Legal words are Will's: draft any Terms or Privacy change under Questions, never in the legal files.

**Order, committing each phase:** (1) the doors' backend and its rolled-back proofs; (2) the guest path (the held door, the shut door's lines); (3) the settings structure and the two primitives; (4) the door's page; (5) the Guests room, Invite and the hub; (6) the words sweep. `crumbs-12` changes `event-cards-row.tsx`'s scroller and `src/lib/event/sections.ts`'s order and merges first: if you need either file, sync after its merge (announced in `docs/tracks/orchestrator.md`) and add it to `owns` then. `locked-door` r2 redraws the door family later: build today's family (the lit door, `src/components/guest/door/`).

**Then retire `event-settings`** in one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`, as named exceptions); the ledger is the Orchestrator's to delete. ROADMAP's Event safety line is already retired into this brief.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:** Vitest for every rule and the rolled-back SQL checks above; the four rows, each page, the dormant unfold, the Videos switch on Free and Pro, the door's steps, both swaps, the held door opening itself, the shut door's two lines, the Guests room's At the door and Invited and Invite, all at 1440 and 375 with reduced motion; `pnpm lab:smoke` whole. Name in the Handoff the walks the live red-team should take (partyr33l as the newcomer at a willg97 test event through every gate).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is his to overrule; no one-way door was guessed.

- **Someone already in passes the password?** Yes, on every device they are signed in on or the phone they joined
  with, so a password added mid-party stops newcomers only; a leaked link's stranger already in is put out by a block
  or Only me (his one rule for everyone already in; `decide.ts`, `get_upload_context`).
- **Decline is a block?** Yes: a declined newcomer meets the one shut screen and cannot ask again; Undo on its toast,
  Let back in under Blocked.
- **Private with no gate chosen lands where?** On "Only people already in", or back on the password when one is set
  (`doorForStep`): the gate that changes nothing for anyone inside and stops every stranger.
- **Videos binds whom?** Guests only: the host's own uploads and clips ignore it, as the per-upload cap does; a
  guest's clip Add hides while it is off.
- **Confirming at the approve door is the ask?** Yes: the email step ends at the held door with no second tap; "Ask
  to join" shows only to someone who arrives already confirmed. At an invite list, a listed address that confirms
  comes straight in.
- **The unlisted ask sits on the shut door?** As locked-door r2 relayed ("Ask Maya to let me in", "Use a different
  email", under the one message; asking takes her to the held door; a declined ask meets the shut door with no ask).
  Nothing in the code argued against it.
- **The invite list stays editable while it is not the door?** Yes, and Guests says so with a pointer to Change who can
  get in, so a host can build it before switching.
- **Back from a settings page?** Its back arrow returns to the four rows; the browser's Back closes Settings (one
  history entry per place, the page riding `replaceState`).
- **Whose word is "private"?** The host's settings say Only me; the visitor-facing profile, dashboard card and shut
  screen keep "private" ("The host made this event private", "This album is private").
- **A gate never locks a guest's own card?** Yes: the Guest card, the profile picker's tile and a claim's Open album stay
  named and linked (never a cover) at a gated album, since their owner is past the door; only Only me and a block lock
  them (`readEventGates`).
- **The four host acts are authenticated SECURITY DEFINER** (`set_event_door`, `let_in_at_door`,
  `add_event_invites`, `remove_event_invite`), the class `block_from_event`, `let_back_in` and `set_event_slug` hold,
  so lint 0029 reads 33 against database-security.md's "a new DEFINER function is service-role only". Recommended:
  keep (each re-checks the host with `auth.uid()` inside, as its neighbours do); the alternative is a service-role
  DEFINER taking the Server Action's `getUser()` id. schema-pass owns the doc's line.
- **Marketing and pricing words:** the trust strip's "Private by default" reads "Unlisted by default" (Private is now a
  setting, Public the default); pricing's "Password lock" row and the Free card read "Every gate". The voice is his.
- **A gated album unfurls as the generic card**, as Only me does, while a password album shows its name: the card is
  public to everyone for an hour, so it follows the stored door (the safe side). Kept.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: Settings as four sentences (the overlay, Dormant, ConsequenceLine, the Videos switch), a
  new "The door, the host's side" (set_event_door, the consequence lines, At the door, Invited, Invite, the pulse and the
  bell), the Guest card's gate rule, the deep link's hydration gate, the switches' new names.
- `docs/systems/guest-flow.md`: "State follows the door" (six doors, one decision a request: shut, ask, waiting,
  newcomer, through; the pass; the masked upload context; `accepts_video`), the switches' new names, the anon read's
  door pass.
- `docs/systems/billing-caps.md` (a named exception, the Videos fact being this lane's): the Videos switch binds guests
  only, in `create_media` and `video_blocked`.
- Proposed for `docs/systems/database-security.md` (schema-pass owns it this batch): line 37's "`get_event_by_qr_token`
  also keeps the PUBLIC EXECUTE its recreates inherited" retires with 20260929120000 (PUBLIC revoked by name; anon,
  authenticated and service_role granted; proven exactly that); the inventory gains the doors' service-role reads
  (`event_door_standing`, `event_door_check_in`, `event_door_counts`, `event_door_queue`, `event_invite_list`,
  `host_door_waiting`, `ask_to_join`), the four authenticated host acts, the invoker helpers
  (`event_door_account_in`, `event_door_lists_account`) and the trigger (`events_door_opened`), with 0029 at 33.

## Deferred (ROADMAP one-liners, bucket named)

- Retire, by their words: "Guests: a locked door could open by itself the moment the host lets her in" (the held door
  checks in every 30 s); "Help-sync: `day-of-checklist-for-hosts` sends a host to "the event page" to tap Approve all";
  "Help-sync, the guest door: `a-photo-is-missing-from-the-album` gives the preview one cause" (both halves); "Host: the
  event settings sheet as a board once the lab revamp lands" (event-settings r1, wired); Security: "Revoke the PUBLIC
  EXECUTE `get_event_by_qr_token` carries through its recreates" (20260929120000).
- Guests: my-uploads marks a gated album's photos unlikeable (`albumsReadingPrivate` reads a gated album as private),
  though a guest in can like there; asking the gate (`readEventGates`) ends it (from `settings-wiring`).
- Guests room: a waiting newcomer's face is an initial (a seed only where she has an account); her profile photo wants
  the avatar resolve the room's people carry (from `settings-wiring`).
- Guests: the held door's check-in (`/api/guests/door`) has no limiter of its own; it reads one standing a call and
  stamps only the caller's waiting rows, and a limiter would bound a scripted poll (from `settings-wiring`).
- Admin: the album view names a gated album "private" (`admin/albums/[eventId]/page.tsx` reads `visibility` alone);
  `doorLabel(doorOf(...))` would name its gate (from `settings-wiring`; triage-r2-wiring owns the page this batch).
- Guests room: Invite could read the phone's own contacts where there is a picker, his "would ideally work with their
  native contacts" (from event-settings r1).
- Share: an approve or invite album could unfurl with its name (its newcomers meet the name and host at the door),
  where a closed door and Only me stay generic (from `settings-wiring`).
- Host: a Guest card's "Password" label names a password its guest never meets (someone already in passes it); it
  could go, or name the album's door (from `settings-wiring`).
- Code hygiene: `claims-review.tsx`'s note "A private album opens for nobody" means Only me now that a claimed gated
  album offers Open album (from `settings-wiring`).

## Handoff (replaces the chat report)

- **Commits** on `lp/settings-wiring`, pushed (the head is in the chat line): `e865f622` phase 1 (the doors' backend
  and its proof), `403aa329` phase 2 (the guest path), `170fc8c6` a sync, `384fafd7` the board retired, `46174f96`
  phases 3 and 4 (settings as four sentences, the door's page), `b1c90382` phase 5 (the Guests room, the pulse, the
  bell), `4d5531ea` phase 6 (the words, the gated album's Guest card), `96c55e9a` the sync with launch-prep at
  `231534a0`, `b25d4595` a closed page keeps what was typed and the system docs, `f2b717bf` and `ea23fb59` the Guests
  room's door in the Library (`77e78482` a checkpoint of this manifest between them), `1b55aa1f` the sync with launch-prep at `96a9c995` (it brings `docs/ROADMAP.md` and
  `docs/tracks/orchestrator.md` alone), then this manifest.
- **Gates on `ea23fb59`**, synced with launch-prep's code at `231534a0`, each on its own exit code: `pnpm typecheck` 0,
  `pnpm lint` 0 (0 warnings), `pnpm test` 0 (586 files, 6,721 tests), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3131` 0 (172 checks, 0 failing). The head reaches `ea23fb59` by docs alone.
  Logs: `../partyreel-wt/_scratch/settings-wiring/` (`lib-*.log`, `final-*.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths, this manifest, and seven named
  exceptions. The retirement's three shared lists (`src/app/(dev)/design/(shell)/lab/boards.ts`,
  `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/touchpoints.ts`; `384fafd7`, the brief's named
  exceptions; lab-revamp owns them now, and the kit's diff3 resolver carries them). Three paths released to lanes cut
  after mine, each edited here in `46174f96` before those cuts: `src/lib/db/migration-guards.test.ts` (the album read's
  ACL guards reshaped with their scars, since the newest definition is this lane's; schema-pass owns it now),
  `src/components/ui/popup.tsx` (`PopupHeader`'s `up`, the settings pages' back arrow; crumbs-14 owns it now for the
  screen header's back label, so the two merges meet in `PopupHeader`) and
  `src/components/app/event-feed/event-hub.test.tsx` (the settings card's pins reshaped; crumbs-14 owns it now). And
  `docs/systems/billing-caps.md`, under System-doc edits.
- **The items:**
  - The doors' backend: `supabase/migrations/20260929120000_event_doors.sql` (the gate and its enum, `allow_videos`,
    a guest's admission and check-in stamp, the invite list, the door's reads and acts, every guest-path function
    replaced, `get_event_by_qr_token`'s ACL narrowed to the roles that call it), its rolled-back proof held on the live
    schema (twelve rows, quoted in its foot, the ACL's own proof beside them).
  - The guest path: one decision a request (`closed-door.server.ts`); the one shut screen and the previous guest's
    line; the held door, which checks in every 30 s and opens itself; the ask at approve; the unlisted ask on the shut
    door, built where locked-door r2 placed it (nothing in the code argued against it); the door's pass; every guest
    route re-checking the door.
  - Settings as four sentences: live words, a page each with a back arrow, every control saving itself; Dormant and
    ConsequenceLine as Library primitives; the Videos switch, locked on Free and a switch on paid plans.
  - The door's page: four steps, each gate's line and its (i), "N guests are already in", the consequence lines (Only
    me with guests in, Public or closed with someone waiting), the invite and waiting pointers.
  - Milestone 30's two bugs: a place opened from a link closes (a hydration gate; the settings pages and their back
    arrow too; pinned in `event-share-provider.test.tsx`), and the custom link's error is announced (a live region and
    `aria-describedby`).
  - The Guests room: At the door (Let in; Decline is a block, with Undo), Invited (a typed or pasted list, capped at
    500, Joined or Not yet), Invite on every door; the hub's Guests card says who waits, the pulse's first step, the
    bell's rows.
  - The words: every help article naming visibility, the password or who can join (the day-of checklist and
    your-event-page-explained's card order among them), the privacy page's switch and the album's plate in the door's
    words, the FAQs, JSON-LD, trust strip and pricing, the app's email-switch dialog and hints; `VISIBILITY_LABELS` and
    `VISIBILITY_HINTS` retired. No legal words touched, per the relay.
  - Found on the way: a gated album is stored private, so the Guest card, the picker's tile and a claim's Open album
    locked for guests already in; they read its gate now (`readEventGates`). A guest's clip Add follows Videos. A typed
    field keeps what was typed when its page closes (`event-page.test.tsx` fails without it). The Guests room's door
    has a Library composition, since the room is sign-in-gated.
  - The `event-settings` board retired (its ledger is the Orchestrator's to delete).
- **Verified** in headless Chrome at 1440 and 375 with reduced motion: the Library's settings composition (the rows,
  the door's page, the email step held under a gate), the Guests room's composition (At the door, Decline and its
  toast, Invited with a paste and a flagged chip), the privacy page's three answers, the album's plate, pricing's row
  and card, the trust strip, the help's held-door screen. The dashboard itself is sign-in-gated, so its sheet, the deep
  link's close and the Guests room in place wait on the walks below.
- Assets requested from Will: none.
- **Board ideas:** the held door's waiting (his "a more engaging waiting experience", locked-door r2's to draw); the
  invite list reading the phone's own contacts; an approve or invite album unfurling with its name.
- **Proposed migrations:** `supabase/migrations/20260929120000_event_doors.sql`, by its APPLY PROTOCOL (the drift check
  against the live bodies it lists, the rolled-back check at its foot on the live schema, apply verbatim, the hashes
  after), then regenerate `src/lib/db/types.ts`. The code runs on either side (a typed and a runtime seam read a missing
  schema as today's three doors, captured as `doors_schema_missing`), so apply and push go in either order. The
  expected advisor delta: 0029 from 29 to 33 (the four host acts; Questions), 0028 and `rls_enabled_no_policy`
  unchanged (`event_invites` keeps RLS and a host select policy). No Worker, Vercel, Stripe or env change.
- Calls his to overrule: the thirteen under Questions.
- **The live red-team's walks** (after the apply, on the launch-prep alias; partyr33l the newcomer, willg97 the host,
  one test event): (1) Private, you let each person in: partyr33l confirms and waits; the Guests card, the pulse and
  the bell count her; Let in, and her door opens by itself within 30 s. (2) Decline another newcomer: the shut screen
  and no ask; Undo; Let back in under Blocked. (3) Your invite list: paste a list with an unreadable entry; her address
  comes straight in and reads Joined; removing it leaves her in; an unlisted account meets the shut door's "Ask Maya to
  let me in" and "Use a different email", and asking holds her at the door. (4) Only people already in: she keeps
  adding; a fresh visitor meets "This album is closed". (5) A password: she passes without it; a signed-out window is
  asked. (6) Both swaps: Only me with guests in (the consequence line; then she reads "This album is private" and her
  Guest card locks) and Public with someone waiting (the held door opens); back to only people already in, her card
  is named and linked again. (7) Videos off on Pro: photos only in the picker and the terms line, no clip Add for
  guests, the host still adds a video; on Free the locked switch opens the plans. (8) The deep link:
  `/dashboard/<id>/settings` and `?room=settings&setting=door` close with Escape, the X and the back arrow, Back closes
  Settings, and Checkout's return with `?room=share` closes. (9) The custom link's refusal is announced and describes
  its field. (10) A new event name typed and Escape pressed at once is saved. (11) Cross-tenant and abuse: another
  host's session against the event's door and invite acts answers not found; `/api/guests/ask` and `/api/guests/door`
  at a shut album answer the private album's words; a signed-out ask answers 422.
- Look at first: the door's page at 375 (its steps, a gate's (i), a consequence line), then the Guests room's At the
  door, then the shut door's unlisted ask.

