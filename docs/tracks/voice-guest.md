---
track: voice-guest
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
