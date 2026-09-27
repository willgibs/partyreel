---
track: guest-door
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
