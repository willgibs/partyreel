---
track: voice-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is his to overrule; the board draws the first four as its carried calls.

- When does her badge stop counting a photo Maya left out? **When her rows are re-read: at each opening, as today,
  and also when one of hers arrives in the album** (a host decides a pick in one sitting), so `uploads`, `line` and
  `toast` draw no badge once Maya has decided; `tiles` (today) is drawn as wired, with no extra read. If it must be
  live, her rows join the album's poll (ROADMAP's "a live refusal needs its own signal"). (`refusal-read`)
- Do her uploads name the host? **No, "the host"**, as the list's own line and the upload area say it; his round one
  picks twice took the line without Maya's name (`welcome`, `failed`). Else "Waiting for Maya" and "Maya didn't add
  this one" at the wiring. (`host-name`)
- Does the screen Confirm your email opens take the ask's words? **No**: it keeps the account door's keep wear, which
  the Unverified mark and her name menu open before any upload, so it has to promise the photos first
  (`DOOR_WEAR.keep`'s own rule); round one's warm, bright, exact and tender door lines put the event first and would
  be untrue there. `keep` draws the ask's screen alone. (`keep-confirm`)
- Who and where? **Priya at Maya and Jay's wedding, signed out under her typed name**; `held` and `status` on the
  wedding holding uploads for review, `keep` on it open. (`world`)
- Does `held` offer a toast? **Yes, its fourth option**, since his `landed` note floated "maybe a toast
  confirmation"; it speaks the keep's own Sent sentence for a held event ("Your 2 photos are waiting for the host."),
  so one moment has one sentence wherever she meets it.
- Does `keep` rewrite round one's words for the door's screen? **No, carried verbatim**: he asked whether the
  question was a repeat, not for new words, and each is true after an upload, the only moment this screen exists.
- How much does `status`' own section say? **One sentence**: "The host chose not to add this one. Other guests don't
  see it." The list's own line already says the host reviews every upload, so the why does not say it twice.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- Now · Guests: in the album's rows a landscape photograph in flight or waiting for the host fills only the top of its
  square head slot, a grey band under it: `upload/stack-tile.tsx` draws the file at its natural height
  (`PickPreview fit="natural"`) inside the square `album-window-plan.ts` gives a head slot (`HEAD_RATIO`, "the one
  that crops either orientation least"); cover the square (from `voice-r2`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/voice-r2` (branched at `1708b049`): `29aa6d05` (the board, round 2) and `2e1e2b66` (one
  caption's grammar); this manifest's commit is the head. **No sync**: launch-prep moved by `e541cb05` only (a pickup
  record: `docs/STATUS.md`, `docs/tracks/orchestrator.md`), neither in my reads; `git merge-tree --write-tree
  2e1e2b66 origin/launch-prep` merges clean (tree `a56e5c50`).
- **Gates** on `2e1e2b66`'s tree, each its own exit code (logs in `../partyreel-wt/_scratch/voice-r2/`):
  `pnpm typecheck` 0 (`typecheck2.log`); `pnpm lint` 0, 5 warnings all in untouched files (`lint2.log`); `pnpm test`
  0, 510 files, 5738 tests (`test2.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`);
  `pnpm lab:smoke --base http://localhost:3133` 0, 234 checks, voice-guest 559 of 1200 words (`smoke3.log`);
  `pnpm lab:demo --board voice-guest --base http://localhost:3133` 0, 3 steps, each 1.6 screens, the stage moving up
  to 39.04% (`held`), 4.13% (`status`), 11.61% (`keep`) (`demo3.log`). After the build, the restarted dev server
  answered 404 on every dynamic design route until `rm -rf .next/dev` (`smoke2.log`, `demo2.log` are that stale
  server's runs).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the six files under
  `src/app/(dev)/design/sandbox/voice-guest/`, this manifest, and `src/app/(dev)/design/touchpoints.ts` (the board's
  own row only: asks, why, lives, note, variants; the brief's named exception). `registry.ts` and `boards.ts` needed
  no change (the same exports).
- **Verified**: every step at 1440 (three phones in a row at 1:1) and at 375 (they stack, `scrollWidth` 375), the
  board page at both, light and dark, reduced motion emulated (captures in `_scratch/voice-r2/cap/`, `cap/dark/`);
  every option pressed on each step with no console error; each caption read off its frame.
- **Items**:
  - Round 2, round 1 in `history`; its five picks left the asks, and none of their lines sits on these three screens,
    so none is redrawn. Round one's quoted pieces (welcome, password, landing, failure sheet, empty album, the old
    card and its door) retired with their asks.
  - `held`, "When the host reviews uploads, where should a photo still waiting show to the guest who sent it?": four
    whole strategies, `tiles` (today), `uploads` (recommended), `line`, `toast`, each three phones in time order: the
    moment her 2 go, later once Maya let one in and left one out, her uploads opened as their own screen (popups'
    `lists=panel`, Back reads "Album"). Today's frames show its two stale truths: the left-out tile still "Waiting for
    the host", the badge still 1.
  - `status`, "In her uploads, what should a photo the host is still deciding on say, and one the host left out?":
    `today`, `host` (recommended, "The host didn't add this one"), `approval` ("Waiting for approval", "Not
    approved"), `apart` (the left-out ones gather at the list's foot under "Not added to the album" with one sentence
    of why).
  - `keep`, "On the door's last screen, after her photos are sent, what should the ask to confirm her email say?":
    round one's five registers on `KeepOffer`'s screen (Sent with the lit check, where they went, the ask, Confirm your
    email, Maybe later) in the lit held sheet; `warm` recommended, as round one did.
  - The ground is production as it ships: the words column, the tracker's real round button and badge
    (`UploadTrackerButton` on a store of its own), the upload area's held line, the reel tile, the album's head
    (count, Download all, View), justified rows two a row with square head slots; the real `WaitingTile`, `DoorLamp`,
    `DoorCheck` and `DoorHeading`; today's words imported (`TRACKER_WORDS`, `keepCopy`, `keepSentLine`).
  - Captions measured off the frame: her tiles and their size, the badge's number, a status's room to spare (or
    "cut short"), the why's lines, the keep's words and lines and the sheet's height.
- **Assets requested from Will**: none (the twelve marketing stills).
- **Board ideas**:
  - The reel's one approval toast says "The host added your uploads" when the first of her held uploads is approved,
    even when another of the same pick was left out and her uploads say so; a line that stays true beside
    `told=line` ("One of yours is in the album") would end it (`guest/reel/live-reel.tsx`, `ApprovalToast`).
  - Her name menu's card still asks "Save this event for later" (his identity-door r1 words) though save is gone and
    the keep asks with "Keep"; once `keep` is picked, the card, the ask's standing home, could carry its title.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the seven Questions above.
- **Look at first**: the desk step `voice-guest.held` at a laptop, flipping 1 to 4 (frame 1 is the decision, frame 2
  what a left-out photo does, frame 3 the same list in all four), then `status` 1 to 4, then `keep`.
