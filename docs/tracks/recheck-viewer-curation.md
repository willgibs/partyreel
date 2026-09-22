---
track: recheck-viewer-curation
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c2482757"            # the launch-prep SHA the branch was cut from
board: media-viewer
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/media-viewer/
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/app/(dev)/design/sandbox/overtaken.test.ts
  - src/components/lab/step.tsx
  - src/components/lab/step.test.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/queue.ts
  - src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
  - src/app/(dev)/design/(shell)/lab/_desk/review-store.ts
  - src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.test.ts
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/review/ledger.test.ts
  - scripts/lab-review.mjs
  - src/app/(dev)/design/rules/component-notes.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/reel-view/spec.ts
  - src/app/(dev)/design/sandbox/reel-host/spec.ts
  - src/app/(dev)/design/sandbox/reel-screen/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/components/social/guest-list.tsx
  - docs/systems/guest-flow.md
---

# lp/recheck-viewer-curation

**Goal.** `media-viewer` and `host-curation` made current with the identity and reel rounds: the five `overtaken.ts` badges on these two boards folded into their questions, the viewer asked for both of its origins (a tile and the live reel), and every drawn credit on the identity model. The sixth badge (`press-page.the-facts`) is reshaped by `recheck-help-press`; then the overtaken mechanism retires (the map, its readers, the badge and the stands answer).

## The brief

**Will's words for this work (2026-09-22):** "Once we're complete with the current round and your internal reshaping, we may want to recheck the open boards in Lab to ensure they're all current with our big recent changes to identity and reels."

**The judgment you make on every question a newer ruling reached (Will, 2026-09-22, verbatim):** "when I hit an early board question, I answer based on the immediate context I have in my head of that question, plus what's provided. However, sometimes my selection diverges us from an exploration's idea that's actually better but would become irrelevant due to my selection taking a different path. It's up to your discretion to decide which open questions still offer potential value and deserve to be adapted to current context, and which have been solved optimally already, offering no further value regardless of previous selections (we've already reached pinnacle solution of that question's context) and ready to be removed." An early pick can close the road to the best answer. So, for each reached question: if its options still hold an idea that could beat the current path (even one a ruling diverged from), ADAPT it to the current context: reword it so it asks what is still open, keep the promising road as an option, and say in the option what choosing it would change. If its context is already solved at its best, REMOVE it. An option whose drawing shows the old product is REDRAWN on the current one. The survey below proposes a fix per ask; it is a starting point, and your judgment wins where the options say otherwise. The Handoff says, one line per reached question, whether you adapted, removed or left it, and why. No badges: the overtaken mechanism is retiring.

**Rising Tides, in full (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." The identity and reel rulings below are the ground each question now stands on, not walls: an option that would beat one of them may stay, stated as the change it would make.

Everything else on a board stays as it is: this is a recheck, not a new round, so the round number stays, no ledger is written, and a question nobody reached is left alone. Keep the decision shape (`defineExploration`: one question per decision, every option drawn). Never ask what a newer board already asks: where an ask overlaps an identity or reel board, drop the overlapping part and name that board in the context. You register nothing: `registry.ts`, `boards.ts` and `touchpoints.ts` are not yours (the Orchestrator moves the desk order at the record).

**What changed under these boards (the current rules; nothing older binds you):**
- IDENTITY. A guest is a row per event at one of three trust levels. (1) A typed name: the public mark reads "Unverified"; the plain disc; no profile page; uploads remembered on the device. (2) A typed name plus an address nobody has proved: stored inert, never shown to the host or other guests, never attributed, never mailed on its own; only the guest's own menu says "Email not confirmed"; publicly the same "Unverified" mark. (3) A confirmed account, the only identity that uploads as itself; a known confirmed address at the door triggers sign-in. The door in names mode asks the name with "Email (optional)" under it ("Come back to this album anytime, with every photo you add."); the name step's lede reads "so the host knows who to thank"; the verified-required gate reads "The host has asked guests to confirm an email for safety. One tap and you're in." The host sees only a badge, never an address. A confirmed address claims its rows per event from a card on the dashboard (Claim all as a shortcut; Finish confirms, and an event left unclaimed has its uploads removed and the address detached). Profiles are a 404 until a handle exists and publish no attended event until its owner turns it on ("nothing until chosen"). Require verified emails is on by default for new events.
- THE REEL. The host-made, published, stored mp4 is gone: no Studio, no Create reel, no publish, no one-reel-per-event, no reel card under the action block, no keepsake hero, no guest download of the host's mp4, no "your reel is ready" mail. The reel is now the event's own live, looping montage of everything the album shows, from its third item, with no host action and no file; a tile at the album's head opens it (`?reel`), a venue screen mode plays it on a wall (`?screen`), and anyone can make their own cut on their device (saved or shared as a file; on a paid event also added to the album as a video). The six reel boards (`reel-view`, `reel-front`, `reel-screen`, `reel-cut`, `reel-host`, `reel-story`) and the three identity boards (`identity-door`, `identity-claims`, `identity-profile`) sit on the desk and are current: read their `spec.ts` for what they ask, and never ask it again.

**Verify** each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke`; `pnpm lab:demo --board <board>` for every board you own. In the Handoff list every ask you reshaped, redrew or removed, one line each with its old and new question.

**The stale asks (from the Orchestrator's survey; check each against the files before you change it):**
- `media-viewer.link` (badge): RESHAPE to "Should an open photograph get its own address, as the reel's `?reel` will, and should Share hand on the link or the file?" The cut already shares as a file, which settles the privacy call its overrule line waited on.
- `media-viewer.video` (badge): RESHAPE to "How should a video meet a guest in the viewer, now the live reel plays a muted window of it (Include videos, on by default) and may open the viewer mid-clip?"
- `media-viewer.wayout` (badge) and `media-viewer.opening`: RESHAPE both for TWO origins: "How does a guest get back to where a photograph opened: its tile, or the reel?" (`grow` assumes a tile). This board sits above `reel-view` on the desk, whose `tap` decides the reel's side, so ask both origins here now rather than waiting.
- `media-viewer.who`: RESHAPE and REDRAW. An Unverified name wears the plain disc and opens no page (`src/components/social/guest-list.tsx:103-146`), yet `face` draws Unverified Priya with a seeded face and a pressable credit (`board.tsx:489`, `viewer.tsx:259-293`); her mark reads "Email not confirmed" (`viewer.tsx:230`) where the public word is "Unverified"; the host's credit prints every uploader's address (`viewer.tsx:208`, `fixtures.ts:161-165`) where the ruling is "Only a badge, never the address".
- `host-curation.arrivals` (badge): RESHAPE to "A photograph lands mid-review with a selection held, and nothing waiting reaches the reel or the wall until approved: what should the queue do?" `reel-host.review`'s `roomsays` option writes into this room's header; `reel-host` sits above this board, so its answer is the ground here.
- `host-curation.count` (badge): RESHAPE to "How many places should say how many uploads are waiting, now that the wall (`reel-screen.review`) and the reel view (`reel-host.review`) may say it too?"
- `host-curation.told`: RESHAPE. `line`'s "and on their profile" is dead (profiles show only chosen events; Unverified guests have none); `reel-front.yours` may tell a guest her photo is in, so the guest is no longer told nothing.
- `host-curation.peek`: REDRAW (trivial): the credit falls back to "Anonymous" (`queue.tsx:443`); every uploader passed a door that asked a name.

**Retire the overtaken mechanism (the Orchestrator's call under Will's word above: the triage is judgment now, so the badge and its "The ruling stands" answer have nothing left to do).** Once the five questions here are adapted or removed, delete `src/app/(dev)/design/sandbox/overtaken.ts` and `overtaken.test.ts` (the sixth entry, `press-page.the-facts`, is adapted by `recheck-help-press` from its own spec; it goes with the file), and every reader: the badge, the `s` key and the stands button in `src/components/lab/step.tsx` (and `step.test.tsx`), the desk's `_desk/queue.ts`, `queue.test.ts`, `session-step.ts`, `review-store.ts`, `copy-so-far.test.ts` and `(shell)/lab/page.tsx`, `src/app/(dev)/design/review/ledger.test.ts`, the `stands` grammar and the overtaken reader in `scripts/lab-review.mjs` (no ledger stores `stands`; confirm with `grep -rn stands docs/reviews/*.json`), and the entry in `src/app/(dev)/design/rules/component-notes.ts`, then `pnpm design:rules` (list `rules.generated.json` as the generated exception). A board spec or comment that merely uses the word "overtaken" is left alone. Leave `docs/reviews/README.md`, `docs/STATUS.md`, the ROADMAP, `usher/` and the comment in `touchpoints.ts` to the Orchestrator: name each line in the Handoff.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
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
