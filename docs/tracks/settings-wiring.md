---
track: settings-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929120000_event_doors.sql
  - src/components/app/event-settings/
  - src/components/app/event-settings-form.tsx
  - src/components/app/visibility-selector.tsx
  - src/components/app/pricing/lock-chip.tsx
  - src/lib/events/visibility-labels.ts
  - src/lib/events/guest-experience-summary.ts
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
