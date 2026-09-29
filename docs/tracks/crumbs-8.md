---
track: crumbs-8
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8dc0d0d9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/card/
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/app/event-settings/
  - supabase/migrations/20260929100000_like_private.sql
  - src/components/marketing/sections/pricing/
  - src/components/app/pricing/pro-price-list
  - src/lib/events/event-blocks
  - src/components/app/event-blocks/
  - src/app/(app)/account/page.tsx
  - src/components/app/share/event-share-sheet.tsx
  - src/components/marketing/sections/features/guests/
  - content/blog/corporate-event-photo-sharing-pricing.mdx
  - content/blog/AUTHORING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - supabase/migrations/20260928120000_event_blocks.sql
---

# lp/crumbs-8

**Goal.** Fix what build 17's red-team found (the share card shared across viewers by the edge, Event Settings' crushed cards, like_media's tell, the dark slider, four stale or wrong words) and the two site claims the always-on guest list made false.

## The brief

**Build 17's red-team** (2026-09-29, the alias at `1407daf6`; its ledger is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-17/ledger.txt`) passed every journey and found these:

1. **Major: the share card is shared across viewers by the edge.** `/e/<token>/card` (`src/app/(guest)/e/[token]/card/route.tsx`) has answered per viewer since the block: a blocked viewer gets the generic card, everyone else the named one. It still sends `Cache-Control: public, max-age=3600` with no `Vary`, so Vercel's edge serves whichever answer it cached first to everyone, for an hour (`x-vercel-cache: HIT`).
   - After a blocked fetch, an open album unfurls nameless.
   - Before one, the blocked viewer gets the named card while her page says private: a tell.

   Fix: every cacheable URL answers the same for every viewer.
   - The event's card follows the event's own visibility.
   - A viewer the closed door masks is pointed, by her page's metadata, at the private album's card, never the event's named one. The red-team confirmed her HTML already carries neither the event's name nor "blocked".
   - If some answer must differ per viewer, it is never shared (`private, no-store`).

   Pin it with a test on the headers and on which card URL each viewer's metadata names.
2. **Major: Event Settings crushes its last three cards.** This has been on launch-prep since popups-wiring (`5f5e639b`, 2026-09-27); partyreel.com is unaffected.
   - Highlight reel, Profile and Danger zone shrink to 32 px with their titles cut, at 1440 (the panel) and 375 (the screen).
   - So the reel's switch and look, "Show on my profile" and Delete event (its only home) cannot be reached.
   - Cause: `PopupBody className="flex flex-col gap-6"` (`event-settings/event-settings-sheet.tsx:112`), with the Card's `overflow-hidden`, which drops the cards' automatic min-height to 0.
   - Likely fix: `shrink-0` on the cards. Look for the same shape in any other popup body and name it in your Handoff.
3. **Minor: `like_media` tells a block from a private album.** A private album's guest with a row passes the check (ok), while a blocked account gets `not_found`, so a direct RPC call with a known photo id reveals the block.
   - Recommended: nothing on a private album's lock screen can like, so a private album refuses every guest's like with the same `not_found` a block gets.
   - Write the migration from `like_media`'s newest definition (`20260928120000_event_blocks.sql`), with its drift md5s and a rolled-back proof at its foot. The proof shows a blocked account and a private album's guest answer alike, an open album's guest still likes, and the host is unaffected. The Orchestrator applies it.
4. Already fixed by `triage-wiring`: the admin confirms' "Not in the album". Leave it.
5. **Minor: /pricing's Pro size slider has no visible track in a dark system theme.** This dates from 2026-09-20. The WebKit track's gradient uses `var(--color-background)`, which resolves near-black at `:root`, where it should use the card's local `--background` (`sections/pricing/plan-cards.tsx:299`).

**Nits:**
- The plan sheet floors at "1% full": 97.9 MB of 2 TB reads 1% (`pro-price-list.tsx:319`). Under 1%, say so.
- Let back in's restore toast says "back in the album" for an upload that came back hidden (`lib/events/event-blocks.ts:236` and its tests). Say what it did.
- Two stale lines, false since the always-on list and the shift:
  - the Account page's "(the host controls that)" about the guest list (`account/page.tsx:409`);
  - `event-share-sheet.tsx:53`'s comment "THE PRO GATE ON THE SLUG IS UNTOUCHED".
- /pricing's cadence toggle wraps "Yearly, 2 months free" to two lines at 375. Set the tag beside the control, as the plan sheet does.

**Two site claims the always-on guest list made false**, to fix before milestone 30:
- /features/guests still calls the list a host switch ("One switch shows the guest list ... Until you flip it, the list is yours alone", `features/guests/guest-list-section.tsx:78`) and draws the switch (`guest-list-card.tsx:123,138`).
- The blog's FAQ says the same (`corporate-event-photo-sharing-pricing.mdx:11`, `content/blog/AUTHORING.md:209`).

**Paths:** a running lane holds the export paths, the help, the emails and the chrome this batch. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for each fix.
- The rolled-back SQL proof.
- The card's headers and bytes across two viewers, under `next start`.
- Event Settings at 1440 and 375 with every card whole.
- The slider in both themes.
- `pnpm lab:smoke` whole.

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
