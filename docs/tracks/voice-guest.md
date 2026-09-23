---
track: voice-guest
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d1f66fd"            # the launch-prep SHA the branch was cut from
board: voice-guest
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/voice-guest/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/lab/
  - src/components/guest/entry-shell.tsx
  - src/components/guest/guest-name-step.tsx
  - src/components/guest/upload/stack-tile.tsx
  - src/components/guest/upload/failure-sheet.tsx
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/auth/account-door.tsx
  - docs/design/guidance.md
  - src/app/(dev)/design/rules/bible.ts
---

# lp/voice-guest

**Goal.** A NEW lab board, `voice-guest` (Will, 2026-09-22: "nail our voice in the lab", the guest journey first): seven real lines of the guest journey, each drawn in its real place with three or four candidates spanning registers, so the lines he picks build the voice one won line at a time; the capture's own words among them. A catalog, nothing wiring production.

## The brief

**Will's words (2026-09-22), verbatim.** "'Every ask is a benefit' doesn't have to be a super strict rule, else it may feel like we're pandering in some areas that feel we're forcing a benefit in copy to follow the rule. However, where framing a benefit feels forced, we should aim for natural or at least neutral rather than any sort of strict or regulatory language. Still need to nail our voice in the lab, across all main and micro copy." Asked where the first voice board should start, he picked THE GUEST JOURNEY: the door, the name step, the upload, the errors and the capture, the most-read micro copy and where most asks live.

**Rising Tides (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." A rule that blocks better work is reshaped deliberately and named in your Handoff.

**The guidance his words became** (`docs/design/guidance.md`, landed tonight): "An ask says what it gives, where that comes naturally. A name, an email, a first upload or a gate reads as what the guest or the host gains when the gain is real (\"The host has asked guests to confirm an email for safety\"); where a benefit would be forced, the line is natural or at least neutral, never worded as a rule or in regulatory language. The first welcome reads fun, safe, easy and quick. A guest who scanned a code owes us nothing: a regulatory ask reads as a barrier, and a forced benefit reads as pandering." And bible 21: "the voice is built one won line at a time, in its real place, and no copy is pinned by a test"; guidance: "Copy is judged in its real place. A line is compared with three or four close candidates where it will live, one real line at a time, and the voice is built from the lines that win: never declared first and then applied."

**What this is.** A NEW lab board, `voice-guest`: the voice's first board, a catalog to select from, nothing wiring production. Each decision is ONE REAL LINE drawn in its real place on the real guest surface (the kit's frames over the shipped components' look), with three or four candidates that span registers (plain and warm, bright and playful, quiet and exact), so the lines he picks reveal the voice. A line he already ruled verbatim appears as its own "as ruled" option, never re-asked from zero (an earlier voice round ruled, among others, "The album starts with you" for the empty album's heading and the gate's "For safety, the host has requested you confirm your email. One tap and you're in."; the name step's lede "Your name goes on the photos you add, so the host knows who to thank." was ruled yesterday).

**Seven lines, one question each** (read each shipped string at its source first; the surveyed sources are named):
1. `welcome`: the door's welcome, the first thing a scanning guest reads (`entry-shell.tsx` and the door's first step).
2. `ask`: an ask under the refined guidance: the password step's lede (`guest-name-step.tsx` modes, or the password door); the name step's lede is ruled.
3. `landed`: an upload landing, on the upload stack tile (`upload/stack-tile.tsx`; toasts are retired there); a candidate may say, for a signed-in member, that the event is now in their account (uploading is the save now).
4. `failed`: a failed upload with its way out (`upload/failure-sheet.tsx`: "Try again" / "Retry all").
5. `empty`: the empty album's sub-line or button (`gallery-empty-state.tsx`; its heading is ruled).
6. `waiting`: "Waiting for the host" on the stack tile (a photo held for review, as its own guest sees it).
7. `keep`: the post-upload capture's words (`save-account-prompt.tsx`'s heading, reason and button, and the account door's `save` wear it opens): the ask his "the new email capture after upload should incentivize the email to save the event under the account for the future" names. Save is gone as a feature: a guest is a guest by uploading, and confirming keeps every photo they add in their account with the event (the `guest-by-upload` lane is making the wear's words hold before an upload too; draw candidates on the post-upload card, where the photos exist).

**Never ask what a standing board asks, and name each in the context:** `identity-door` (the field, the member nudge, the verified gate's benefit, the menu, undoing an email), `guest-capture` (the moment, the shape, whom to follow, the name), `identity-claims` (`pointer`, `after`), `export-flow` (`stuck`, `hollow`, `cap`, `phone`), `emails` (`guest`), `reel-front`'s tile lines and small states, `reel-view`'s chrome, the copy of `reel-cut` and `reel-screen`, and `host-curation.told`. `recheck-by-upload` is reshaping `identity-door`, `guest-capture` and `identity-claims` tonight: sync once it merges (the pickup announces it) and re-read their specs before you hand off.

**The wiring after his verdicts** (not yours): the won lines land in the product and seed working voice notes in the Library; the rest of the journey's lines go to the next voice boards (the host app, then marketing's main lines), never a blanket sweep. Say in each option what it would sound like elsewhere, one short line, so the pick carries.

**Build from the kit** (`src/components/lab`); register the board directly after `guest-capture` in `registry.ts`, `boards.ts`, `touchpoints.ts` and `DESK_ORDER` (the Orchestrator moves the desk order at the merge). The board at 1440 and 375 with reduced motion honoured; no em-dash anywhere a person reads (bible 19); no mono face; never promise "no account" (bible 20).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

No new one-way door. The calls the lane took on its own recommendation (each is also a carried call or an option on the board, so it reaches him where he reads):

- Which password line is `ask`? The password step's lede (`password-gate.tsx`), not a name-step mode: it is the one ask on the door no standing board claims, and the name step's lede is ruled.
- Is a laptop on a knob? No: every frame is a 375 by 812 phone (carried call `phone`); the desk panel sets the same lines at a similar measure.
- Does the capture card's button move with its words? No: "Confirm your email" in every option, because the Unverified mark and the name menu open the same door with those words (carried call `button`).
- How does a word option land on the stack tile? It holds the tile a beat after the last file lands, the line on the reading pane where "N to go" and the bar were; today's option draws the shipped behaviour (the stack leaves, the newest tile takes its pass of light).
- Does the member's account clause get its own option? No: `landed` draws every option twice, Priya (a typed name) beside Tom (signed in), and each register writes its own member line.

## System-doc edits (in place, owned facts only)

- none (a lab-only board; no shipped fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- The lab kit: `Scene`, `Fit` and `Measured` are now copied verbatim in three boards (guest-capture, identity-door, voice-guest); lift them into `src/components/lab`.

## Handoff (replaces the chat report)

- **Commits:** the work `73ef3a86`; the sync merge `40b7dbee` (origin/launch-prep at `3896d016`: recheck-by-upload, host-storage and storage-guard landed; the one conflict was the generated `docs/design/library.md`, regenerated by `pnpm design:rules`); one follow-up after the sync, `e3ea4976` (the welcome's "As shipped" option says its first row is the retired voice board's ruled pick). launch-prep has not moved since `3896d016`. Pushed.
- **Gates on the synced tree at `e3ea4976`, each on its own exit code** (logs in the lane's scratch dir): `pnpm design:rules` 0 · the collector 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, none in a file this lane touched) · `pnpm test` 0 (361 files, 3982 passed, 1 skipped) · `pnpm build` 0 (259 pages) · `pnpm lab:smoke --base http://localhost:3135` 0 (499 checks, voice-guest reads 640 of 1200 words) · `pnpm lab:demo --board voice-guest --base http://localhost:3135` 0 (7 steps, 0 failing, every step draws its options). `pnpm lab:review --dry` parses a full answer line against the spec.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, before this manifest commit): `docs/design/library.md`, `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/touchpoints.ts`, and `src/app/(dev)/design/sandbox/voice-guest/` (`board.tsx`, `fixtures.ts`, `lines.ts`, `parts.tsx`, `scene.tsx`, `spec.ts`). Exceptions: the three registration files carry only this board's lines, directly after `guest-capture` (registry import and entry, boards import and entry; touchpoints `RulingId`, `SandboxId`, the RULINGS row, `DESK_ORDER`), the new-board exception; `library.md` is `design:rules` output.
- **Items:**
  - A new board, `voice-guest`, "The voice of the guest journey": seven decisions, each one real line drawn where it ships on a 375 phone over Priya at Maya and Jay's wedding (`welcome`, `ask`, `landed`, `failed`, `empty`, `waiting`, `keep`).
  - Every decision offers the same four keys, `today`, `warm`, `bright`, `exact` (as shipped, plain and warm, bright and playful, quiet and exact), so his ledger reads as a voice at a glance; each option's `means` ends with what its register sounds like on another of the seven, so a pick carries.
  - Ruled lines ride verbatim and are never re-asked: "No app required." in every welcome, "The album starts with you" over every empty-album button, "Almost in" over every password line; the name step's lede and the verified gate are not drawn.
  - The candidate strings live in one pure module (`lines.ts`), the host's and the event's names as parameters; the shipped components are quoted with the one string lifted to a prop (none has a prop for its line), in the kit's portalled frames, with no network, no session and no Radix portal.
  - Every frame is titled with its option's own label and captioned with a number read off the frame: lines run at 375, words before the control, a pane's share of its photograph (a tile line at 2 lines covers 30% of it; "Waiting for the host" is 1 line on a 166px tile).
  - `landed` draws two phones per option (a typed name beside a signed-in member, whose line may say the event is in his account) and carries its own Replay for the one pass of light today's landing makes; under reduced motion its caption says nothing marks the landing today.
  - `keep` draws two phones per option: the card, then the door its button opens, the door's words written to hold before an upload; the card mirrors guest-capture's recheck (a mail glyph, a plain button).
  - Recommendations: welcome=bright, ask=warm (the ruled gate's own cadence), landed=bright, failed=warm, empty=warm, waiting=warm, keep=warm: bright at the two delight moments (the first welcome, the landing), plain warmth at every ask and failure.
  - A delight for the wiring, if a `landed` line wins: the words ride in on the tile's own pass of light (the sweep reveals them, a rare beat), shown plainly under reduced motion.
  - For the wiring: a two-line line on a tile pane (`WaitingTile`'s <p>, the stack's pane) leaves a widow at 166px ("The host sees it / first"); give the pane `text-balance` if one wins.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The four registers as the four option ids on every decision (`today`, `warm`, `bright`, `exact`).
  - Phone only, 375 by 812, no laptop knob (carried `phone`).
  - The capture card's button held at "Confirm your email" (carried `button`).
  - `ask` is the password step's lede.
  - `landed`'s word options hold the stack a beat with the line; today's draws the shipped silence; the reel's "Yours is in it" (reel-front's recommendation) stands in every album scene where her photos are approved (not over the held ones).
  - `failed` varies the heading, the line and the retry button; each row's own reason ("That upload did not finish."), Retry and "Not now" stay as shipped.
  - `empty` varies the button alone (no sub-line).
  - The album scenes are drawn trimmed as guest-capture draws them (header, the words column's slot, the reel's tile, the album); only `empty` draws the event's own heading.
  - Priya and Tom at Maya and Jay's wedding, the desk's world (carried `world`).
- **Look at first:** start the review at `welcome`, then `landed` (the one decision that asks for words where today there are none; press Replay on "As shipped" to see its pass of light).
