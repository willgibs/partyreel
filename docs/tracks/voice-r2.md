---
track: voice-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: voice-guest
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/voice-guest/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/voice-guest.json
  - docs/systems/guest-flow.md
---

# lp/voice-r2

**Goal.** Draw `voice-guest` round 2: where a held photo shows to the guest who sent it, what her uploads say while the host decides and after they leave one out (host-curation's `told` words folded in), and the keep ask's words redrawn on the keep step as it ships.

## The brief

**His round 1 answers** (`docs/reviews/voice-guest.json`), each with its note in the ledger:
- `welcome=today`: today's copy does a good job ("in seconds", "No app required.", one shared album, a count of what awaits); he will adjust it later with the rest of the platform's copy.
- `ask=warm`.
- `landed=today`. His note is the direction for this round: tracking it through the uploads queue, or maybe a toast, is fine, but "I'm not a fan of adding notices within the media cards, expecting they'll be scrolled past. Makes more sense to notify the user where they are without real interruption, if we even need to notify them at all".
- `failed=exact`: clear about the failure, clarity without coldness; the rest felt too cute.
- `empty=warm`.

**Two came back unclear, and here is what is true:**
- `waiting=?`: "Is this not being handled separately in a queue from a past selection?" Partly. guest-capture r1's tracker (`tracker=button`: `src/components/guest/upload-tracker.tsx`, words in `src/lib/guest/upload-tracker.ts` `TRACKER_WORDS`) lists her held photos in the same words. But the album still shows them as dim tiles with a clock and "Waiting for the host" at its head (`src/components/guest/upload/stack-tile.tsx`). And a refused one keeps saying Waiting there until her visit ends, because the album's sync moves only in and out of approved.
- `keep=?`: "Want to ensure this is not a repeat question ... If not, please keep this on the desk for my next review." Not a repeat: guest-capture r1 settled when it asks and its shape (the door's last screen), and identity-door r3 settled its look; its words were never asked. But round 1 drew it on the old card.

And `host-curation`'s `told=line` (built: `TRACKER_TELLS_REFUSAL`, the tracker's "Not in the album") came with his note (that ledger leaves with its board; read it at `git show e199f43f:docs/reviews/host-curation.json`): "maybe we can be more clear than 'Not in the album', because a guest may not immediately understand why not. 'Rejected' seems harsh, but at least they'd clearly see *why* it's not in the album. Can you think of better language there? Or could we handle differently in the uploads queue?"

**Round 2, three questions.** The round 1 answers leave `asks`, and their picked lines are drawn in every frame.
1. `held`: where a held photo shows to the guest who sent it. Examples: the album's head as today; only in her uploads, with the tracker's badge counting them; one quiet line at the album's head that opens her uploads. Draw each at 375 in the real album, with her uploads where popups' `lists=panel` puts a list (its own screen in a hand). The answer also decides what a refused photo does there.
2. `status`: the words her uploads use for a photo the host is still deciding on, and for one the host left out. The host's verb is becoming Reject (`curation-wiring`). The words should be clearer than "Not in the album" without "Rejected"'s edge, and at least one option handles a left-out photo differently in the list (for example its own section with one line of why). His picks read warm and exact so far; draw registers that are truly different, not costumes.
3. `keep`: the keep step's words, redrawn where they ship: `src/components/guest/save-account-prompt.tsx`'s `KeepOffer`, the door's last screen ("Sent" with its lit check, where it went, the offer, Confirm your email or Maybe later), with round 1's registers.

Nothing here asks what emails' `guest` asks (which moments may mail a guest; `flow-refresh` is merging two more mail questions into it) or what host-curation settled. The board moves to `round.n: 2` with round 1 in `history` and his notes as the direction; its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

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
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
