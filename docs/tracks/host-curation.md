---
track: host-curation
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d1923907"          # the launch-prep SHA the branch was cut from
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

- **The decisions were recut, and the recut is the one call worth quoting back.** THE BIN (the optional eighth)
  was dropped and a new root put first: THE QUEUE, how a waiting photograph is shown at all. Recommended: keep
  the recut. The bin is a discoverability bug with one obvious fix and no design question in it, so it is a
  ROADMAP line below; the 4:5 crop is the act of judging, nothing has ever asked about it, and at 375 it renders
  a photograph at 112 by 140 with seven on screen at once (measured in the frame). Carried on.
- **THE QUEUE relitigates a ruling of Will's own**, quoted in `selectable-media-grid.tsx`: "Review = a UNIFORM
  grid (standardized selection hit-targets, Will 2026-06-22)". The board says so in the decision's `overrule`
  rather than quietly recommending against him. Recommended: the album's own shapes, on bible 22. Carried on.
- **THE GUEST TOLD is a policy call, and the most overrulable thing on the board.** Recommended: never, as today,
  because a refusal is the host's private judgement about their own party and the marketing FAQ answers it in
  public with "Never". The other two options are drawn in full so overruling costs one click. Carried on.
- **`peek.viewer` overlaps the `media-viewer` lane**, which was cut on the same night and had not landed a spec
  when this board was built. If he picks it, the SHAPE of that viewer is `media-viewer`'s to rule and this board
  has only asked whether the review peek should become it. Recommended: pick `verdict` here and leave the one-viewer
  question to that lane. Carried on.
- **THE VERB changes a word and never a row state.** `Reject` still lands pending -> hidden, never removed, and the
  decision's `lands` line says so, so a wiring lane cannot read a picked `Reject` as permission to wire a delete.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none made: this lane owns no `docs/systems/` path. One correction is owed and is proposed rather than applied:
  `docs/systems/host-app.md` and `host-media-grid.tsx`'s own comment both describe a hidden tile as "a 1-tap show
  atop the 30% dim". There is no dim (the first Deferred line). Either the bug is fixed and the sentence stands,
  or the sentence goes; a wiring lane should not find both.

## Deferred (ROADMAP one-liners, bucket named)

- **Now**: the hidden-media dim has never rendered anywhere: `masonry.tsx:198` builds the class as
  `active:scale-[0.98]${dimItem ? "opacity-30" : ""}` with no separator, so the two run into one token Tailwind
  never emits and a hidden photograph sits in the host album at full brightness. Its only mark is the amber Show
  chip. One consumer (`host-media-grid.tsx:422`), no test. Found by measuring the frame for this board's `verb`
  decision, which is drawn unfixed on purpose.
- **Later**: `ApproveAllPendingButton` has no caller anywhere in the tree: dead code with a live Server Function
  behind it.
- **Later**: the lightbox's pending Approve branch can never render: pending media lives in the review queue and
  the lightbox only ever draws the album grid, which filters it out.
- **Later**: the review peek's own comment promises Escape closes it and nothing listens for a key; the only way
  out is the X or the backdrop.
- **Later**: doc drift on the review grid's columns: the review queue is `grid-cols-3` at 375
  (`GALLERY_UNIFORM_COLUMNS`) while the masonry album is `columns-2`, so "two columns at a phone" is true of one
  grid and not the other.
- **Later**: nothing tells a host the Trash exists: the settings' Deleted card renders only when it is non-empty,
  so the one place a removed photograph can be recovered from is invisible until something is in it.
- **Later**: no test covers `useReviewTriage`, `ReviewActions` or the two bulk mutations; `use-selection.test.tsx`
  covers only the primitive underneath them.

## Handoff (replaces the chat report)

- Head is this commit on `lp/host-curation`, pushed; the code commit is `8aea7685`; synced with `origin/launch-prep` at `9f976f7c` (it had moved; a clean merge, one doc file)
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok, the specimen collector ok, typecheck ok,
  lint ok (the 8 known warnings), test ok (2,533), build ok (254 pages); `pnpm lab:smoke --base http://localhost:3133`
  ok (373 checks, 0 failing; the board reads 399 words of 1,200); `pnpm lab:demo --board host-curation` ok (8 steps,
  0 failing, every step draws its options)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the eight files under
  `src/app/(dev)/design/sandbox/host-curation/`, this manifest, the three registration files (one line each at the head
  of `sandbox/registry.ts`, `(shell)/lab/boards.ts` and both unions of `touchpoints.ts`, plus one RULINGS row after
  `river-visual`'s), and `docs/design/library.md` as `pnpm design:rules` wrote it
- The decisions, one line each:
  - `queue`: how should a photograph waiting for approval be shown? the 4:5 grid as today / the album's own shapes /
    one at a time, whole. **The album's own shapes.**
  - `verb`: what should the button that refuses an upload be called? Hide for both as today / Reject at the door and
    Hide after / one word and a Hidden chip on the tile. **Reject at the door, Hide after.**
  - `peek`: what should a tap on a waiting photograph open? a look as today / a look you can act in / the media viewer
    with the verdict on its pill. **A look you can act in** (staged behind `queue`).
  - `keys`: should a host be able to clear a queue from the keyboard? taps only as today / j and k with a and h /
    arrows with Enter and Backspace and a hint row. **Arrows, with a hint row** (staged behind `peek`).
  - `undo`: after a bulk act, what should the toast offer? the sentence as today / an Undo on the toast / five seconds
    before it commits. **An Undo on the toast.**
  - `arrivals`: one lands mid-visit, what should the queue do? nothing as today / a line that says how many / straight
    in at the top. **A line that says how many.**
  - `count`: how many places should say how many are waiting? all three as today / three that agree and lead somewhere /
    one count on the card. **Three that agree and lead somewhere.**
  - `told`: should a refused guest ever be told? never as today / a quiet line in their own feed / a message.
    **Never, as today** (the most overrulable call on the board).
- Mobbin citations: none. The act was asked from the shipped surface and its own numbers.
- The captures (every option at 1440 and at 375, 48 of them) and the scripts that took them:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/host-curation/`
- Assets requested from Will: none. Every still is one of the fourteen bootstrap images every other board reuses.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: **`queue` at 375.** The measured caption under it reads "the biggest upload renders 112 by 140; 7
  judgeable on screen at once". That is what the product asks a host to judge a stranger's photograph from, and it is
  the number the whole board turns on. Then `verb`, where the album underneath shows what the word produced and the
  30 percent dim that was supposed to mark it is missing, because it has never rendered.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of `host-curation` asked the host's act of reviewing what
guests send as eight decisions on the shipped review surface, at 1440 with 375 on every decision's strip: six roots
and two staged, the peek behind the queue and the keyboard behind the peek. The triage machine was forked so its two
Server Functions became a resolved promise at the real round trip while the exit and beat timings kept reading the
same CSS variables, and nothing on the board could reach a mutation: the album and the guest feed run with pointer
events off and the bell is drawn from the real pure builder rather than opened. The suggested cut was changed once,
recorded under Questions: the optional bin was dropped for a new first root, how a waiting photograph is shown at all,
which relitigates Will's own 2026-06-22 uniform-grid ruling and says so in its overrule line. Measuring the frame for
the verb decision found a shipped bug, first on the ROADMAP list: `masonry.tsx` concatenates the hidden-media dim
without a separator, so `opacity-30` has never rendered and a hidden photograph sits in the host album at full
brightness under a comment that describes a dim.
