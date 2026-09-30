---
track: desk-tune-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "903476f4"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
  - src/app/(dev)/design/sandbox/disposable-mode/
  - src/app/(dev)/design/sandbox/event-ready/
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - src/components/app/event-settings/videos-switch.tsx
  - src/components/shared/media-lightbox-parts/actions.tsx
  - src/components/guest/door/shut-door.tsx
  - src/lib/guest/use-upload-queue.ts
---

# lp/desk-tune-2

**Goal.** Make every line on Will's desk true of production before his sitting: the audits' stale lines on disposable-mode (the Videos switch, the viewer's Report and Download album, Create's album card, the review queue's Reject), locked-door (the wait the queue already holds, the not-found family's glyphs, the host's shut-door line), event-ready's invite door and demo-framing's eyebrow.

## The brief

**Why.** Will sits at the desk next: `locked-door` r2, `event-ready` r1, `privacy-hero` r4, `disposable-mode` r2, `demo-framing` r2 and `about-press` r1, on the launch-prep alias. Lanes merged since each board was drawn changed some of what their asks describe. Two read-only audits checked every production claim on these boards against launch-prep's code (`79beeb39`, build 30). Each line below is untrue of production today, and his time is the scarcest in the program. So this lane is small and exact: make each line true, and draw nothing new. An option's proposal (what it would build) is never a claim: keep it. Verify each fix against the production file named before you write it (the line numbers are the audits', at `79beeb39`), and word it plainly, one crisp line, in the board's own voice.

**disposable-mode** (`src/app/(dev)/design/sandbox/disposable-mode/`). Since `settings-wiring`, a paid event takes a guest's video only while the host's Videos switch is on. It is on by default and binds guests only (`src/components/app/event-settings/videos-switch.tsx`, `docs/systems/billing-caps.md`). Also since `triage-r2-wiring`, a guest viewing someone else's photo gets a Report flag.
1. `spec.ts:188`, the carried `sound` call: "Yes: on Event Pass and Pro the first press asks for the camera and the microphone in one prompt." becomes, in substance, "Yes: wherever videos are on (Event Pass or Pro, with the host's Videos switch on), the first press asks for the camera and the microphone in one prompt."
2. `spec.ts:488`, the `video` ask's `when`: "The event is on Event Pass or Pro, so the camera can film; …" becomes "The event is on Event Pass or Pro with Videos on, so the camera can film; Priya wants a few seconds of the toast."
3. `spec.ts:490`, the `video` ask's `context` opens "Video is paid, so a Free event's camera takes photos only; …". Say that the host's Videos switch can turn video off too, so on Free or with Videos off the camera takes photos only. Keep "the word is video, never clip (the reel's)" and the rest of the line.
4. `host.tsx:552`, the Create step's "An album" card fact "Photos and videos from their phones, as many as they like". A Free album takes photos only, about thirty (`src/lib/constants/tiers.ts`), which also contradicts the drawing's own row "On Free: About 30 photos". Write: "Photos from their phones, and videos on a paid plan".
5. `host.tsx:531`, the review queue's "Decline" button. Production's review verb is "Reject" (`review-actions.tsx`), and "Decline" is now the door's word for a newcomer. Draw production's Reject.
6. `viewer.tsx:15` and `:110-119`, the guest's floating capsule, drawn as Like, Save, Share, Copy link. Production adds Report (a flag) after Copy link for a guest viewing someone else's photo (`src/components/shared/media-lightbox-parts/actions.tsx`). Draw it, and fix the comment.
7. `viewer.tsx:16` and `:166-200`, the menu drawn as "Download" with Everything, then Yours. Production's is "Download album" with Yours first, then Everything, Photos, Videos (`export-dialog.tsx`).
8. The spec's header comment (`spec.ts:16-17`, `:48-49`) still calls the consequence line (`ui/consequence-line.tsx`) and Settings as four rows future work. Both are built: say so, or drop the stale lines.
Keep `host.tsx`'s "Take out". It is the peek option's own proposed verb ("unless you take it out"), not a quote of production.

**locked-door** (`src/app/(dev)/design/sandbox/locked-door/`). Its door components are unchanged since the board's last tune. Two things moved:
- since `crumbs-27`, a join that lands waiting keeps her picked files queued on the phone and sends them the moment the door opens (`src/lib/guest/use-upload-queue.ts`, `takeJoin` and the `doorOpen` effect);
- every 404 on the site shares a grammar (a glyph, a headline and a way out), but only the guest link's wears the QR code; the root's wears a compass and the others their own glyphs (`e/[token]/not-found.screen.tsx`, `marketing-not-found.tsx`).
1. `spec.ts:152`, settled: "Someone who was in reads that Maya made it private". Production's line is "The host made it private." and names no one (`shut-door.tsx`). Write "…reads that the host made it private…".
2. `spec.ts:183`, the term "not-found family": "…the QR glyph, a headline and a way out." becomes "The screens every broken link on the site shares: a glyph, a headline and a way out; a guest's broken link wears a QR code."
3. `spec.ts:401-402`, the `wait` ask's `lands`: "…and whether the upload queue takes her picks before she is let in." The queue already holds them at the held door. Say what lands: what the waiting door holds, and whether she can choose photos while she waits. Then refine the `pick` option's `means`, `gains` and `costs` where they count the queue's hold-and-send as new work: only the chooser on the held door is new.
4. `spec.ts:416`, `lost.context`: "the site's not-found page" becomes "the not-found family's page". The code now calls the root's page "the site's 404", which is not what a guest's broken link shows.
5. `spec.ts:422` and `:424`, the `lost` ask's `own` option. `means` becomes, in substance, "The QR glyph in the dead-end grammar every 404 on the site wears; the shut door leaves that family." `gains`: "Every dead end on the site keeps one look: the QR glyph and a way out." becomes "Every dead end on the site keeps one grammar: a glyph, a headline and a way out."
6. Comments only:
   - `words.ts:207`, `words.ts:237` and `today.tsx:43` point at `e/[token]/not-found.tsx`; since `crumbs-25` the words live in `not-found.screen.tsx`.
   - `words.ts:79` says WelcomeStep "exports none", but `welcomeAddLine` has been exported from `entry-modal.tsx` since `crumbs-17`. Import it for the welcome's first line instead of quoting it, if the frames stay identical.

**event-ready** (`src/app/(dev)/design/sandbox/event-ready/`). `readiness.ts:127-128` and `:151-152`: an invite door with an empty list reads "nobody can get in yet" and fails the door item. Production lets anyone else ask to be let in ("Anyone else can ask you.", `visibility-labels.ts`, `GATE_LINES.invite`, and `lib/events/decide.ts`). No frame draws it today, but the wiring will inherit it, so make it true, with `readiness.test.ts`.

**demo-framing** (`src/app/(dev)/design/sandbox/demo-framing/`). Production still ships the home hero's eyebrow, "Try our demo event", with its live dot (`cinema-hero.tsx`).
1. `spec.ts:78`, settled: "…Try our demo event, is gone (your note)" becomes "…goes (your note): the card becomes the first screen's one door to the demo."
2. `spec.ts:118`, the term: "the home's said Try our demo event" becomes "the home's says Try our demo event, beside a live dot."

`privacy-hero` and `about-press` hold as drawn: leave them.

**Verify:**
- the gate;
- `pnpm lab:smoke --base http://localhost:3132` (its scope is these boards);
- `pnpm lab:demo --board locked-door,event-ready,disposable-mode,demo-framing --base http://localhost:3132`, every step at both widths;
- each changed line read on its frame or in About at 1440, and the capsule and the menu at 375.

The milestone gate's dev-server run of `lab:demo --all` stalled once on `about-press.facts` ("Page.navigate did not answer"), a board this lane does not touch. If your own run meets it, name it in your Handoff and don't chase it.

**Record:** no ROADMAP line. Under Calls, list any wording you chose that the audits did not give.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/locked-door/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `locked-door`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
