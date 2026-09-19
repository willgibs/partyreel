---
track: host-curation
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: host-curation    # round one: the host's act of reviewing what guests send
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-curation/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/lifecycle-recovery.md
  - src/components/app/event-feed/review-section.tsx
  - src/components/app/event-feed/review-grid.tsx
  - src/components/app/event-feed/review-actions.tsx
  - src/components/app/event-feed/use-review-triage.ts
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/event-feed/feed-section-header.tsx
  - src/components/app/event-feed/feed-section-empty.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/app/event-feed/use-selection.ts
  - src/components/app/host-media-grid.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/host-selection-provider.tsx
  - src/components/app/event-card.tsx
  - src/components/app/notification-bell.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/components/shared/masonry.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/event/sections.ts
  - src/lib/notifications/build.ts
  - src/lib/lifecycle/recently-deleted.ts
  - src/lib/db/mutations/media.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(marketing)/(cinema)/features/curation/page.tsx
  - src/app/(dev)/design/sandbox/app-vocabulary/spec.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/fixtures.ts
  - src/app/(dev)/design/sandbox/guest-upload/spec.ts
---

# lp/host-curation

**Goal.** Round one of `host-curation`: THE HOST'S ACT OF REVIEWING WHAT GUESTS SEND, from a photograph arriving under
"Review uploads before they appear" to its fate (approved, hidden, removed, gone), reconceived from the ground up. Will
(2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every surface, everything unprotected, "at worst,
net neutral and fully deleted". Six to eight decisions with `defineExploration`, each drawn on the REAL feed pieces with
`app-vocabulary`'s fixtures reused verbatim (`HOST_EVENT`, `REVIEW_ITEMS`, `GALLERY_ITEMS` with a few forced hidden,
`BIN_ITEMS`) plus a second "just landed" batch and two or three events with different pending counts, at 1440 and 375, a
recommendation each, every number measured; no preview calls a server action. **Not in this round:** any production byte;
the empty and loading treatments, the two toolbars' grammar, the two tile-action models, the tile-size control and the
confirm switch's mechanism (`app-vocabulary`, on the desk: cite its decisions, never re-judge them); the event page's
section order, nav and chrome (`app-shape`); the guest's own held tile and toast (`guest-upload`'s `held`: read its
query contract only); the media viewer's shape (`media-viewer`, a sibling lane, reads `sandbox/media-viewer/spec.ts` if
it lands first).

**What is measured (the tree at the cut).** One enum, `media.status` in pending, approved, hidden, removed, driven by one
settings switch ("Review uploads before they appear" / "Hold new photos for your approval instead of showing them live").
The queue is `ReviewSection` (an amber header, a uniform 4:5 masonry, a browse peek or a select mode), first in the feed
only while moderation is on and something is pending, last once caught up. Approve is pending to approved; the review
"Hide" is pending to HIDDEN, never removed: the item stays in the host's gallery dimmed to 30 percent with a one-tap Show,
and the guest never sees it (both guest RPCs hard-filter approved). Remove is a separate act, from the lightbox or the
bulk bar only, into a 30-day Trash then an irreversible purge (R2 first). Nothing takes an item from arrived to gone in
one tap. The guest is told once, at upload ("Sent, waiting for host approval"), then nothing, ever, including in their
own Uploads feed; the marketing FAQ says "Never". Bulk and select share `useSelection` (prune, never reset); Review's
actions are `[Select] [Approve all]` then `Select all · N · [Hide] [Approve] [Cancel]`; there is no keyboard triage
anywhere (only the lightbox's arrows). No toast carries an Undo (the bin's "Upgrade" toast shows the idiom exists).
Three "N to review" counts never agree and none is live: the header bell (aggregate, linking `/dashboard`), the event
card's amber chip, the event page's pill; a photograph arriving mid-visit never joins the queue (the guest's gallery
polls; the host's does not). The browse peek is read-only (a fixed div, its own X, a comment promising Escape); the
lightbox's pending Approve branch can never render. `ApproveAllPendingButton` has no caller. The settings' Deleted card
renders only when non-empty, so nothing tells a host the bin exists. At 375 the grids are two columns and the tile row
collapses to Like and Download (Hide moves into the lightbox). The pins: `use-selection.test.tsx`, `masonry.test.tsx`,
`sections.test.ts` (urgency order), `recently-deleted.test.ts` (the copy "Deletes today" / "Deletes in N days"), the
forensics migration guards (`restore_media`'s guard); nothing covers the triage hook, the actions or the bulk mutations.

**The decisions (suggested; yours to recut, never forced apart).** THE VERB (Review's "Hide" means two things: as
today; "Reject" in review and Hide / Show in the gallery; one word everywhere with a state chip on the tile); THE PEEK
(the browse peek: read-only, as today; Approve and Reject inside it; the peek IS the viewer with the curate pill);
KEYS (staged after THE PEEK: no keyboard, as today; j / k with a / h; arrows with Enter and Backspace, drawn as a hint
row); UNDO (bulk approve and hide land as plain toasts, as today; an Undo on the toast; a held state that commits after
five seconds); NEW ARRIVALS (a photograph arriving mid-visit: silence, as today; an "N new" prompt that never reflows a
selection; live insertion at the top when nothing is selected); THE COUNT (three counts, as today; the bell deep-links
to the one event's queue when only one has one; one count in one place, the rest gone); THE GUEST TOLD (a rejected guest
learns nothing, as today and per the FAQ's "Never"; a quiet line in their own Uploads feed; a message). Optional if it
fits the budget: THE BIN (the settings' Deleted card only when full, as today; always, with the Trash's empty line; the
two bins as one place, drawn, if `app-shape` has not already asked). THE GUEST TOLD is a policy call: draw it, recommend
"no", flag it as the most overrulable. The dead button, the dead lightbox branch and the doc drift on the review grid's
columns go under Deferred as ROADMAP lines.

**Binds.** The bible; the host-app invariants (hidden is never removed; the purge is R2-first and irreversible; the
restore guard); the never-mutate rule (`useReviewTriage` imports live server actions: fork it with a resolved promise
and the real timing; `GalleryBulkBar` needs the real `HostSelectionProvider`, seeded as `app-vocabulary` seeds it;
`HostMediaGrid` pulls the reel, likes and export hooks: stub all three; `uploads-section.tsx` needs a `FormProvider`,
reuse `app-vocabulary`'s wrapper; fixtures arrive pre-presigned as plain URLs, never through presign); the lightbox is
lazy and portal-bound (draw it as a still, never through the full masonry); reduced motion honoured; no em-dashes; the
copy is open (bible 21). Mobbin is encouraged, never required: moderation queues, approve and reject flows, undo
toasts, "new items" prompts.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board host-curation` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixtures, no server action from a preview; a capture of every
  option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board host-curation` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
