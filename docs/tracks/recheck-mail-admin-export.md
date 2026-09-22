---
track: recheck-mail-admin-export
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c2482757"            # the launch-prep SHA the branch was cut from
board: emails
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/emails/
  - src/app/(dev)/design/sandbox/admin-triage/
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/identity-claims/spec.ts
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/app/(dev)/design/sandbox/reel-cut/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/trust-safety-forensics.md
---

# lp/recheck-mail-admin-export

**Goal.** `emails`, `admin-triage` and `export-flow` made current with the identity and reel rounds: the dead reel mail, the code that became a tap, the reporter who now always passed a named door, the teaser viewer who never reaches Download.

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
- `emails.moments`: RESHAPE and REDRAW: `shipped` counts "Your highlight reel is ready" (`moments.tsx:81`), which dies with the render; `identity` predates the claim ticket's notice (`identity-claims.ticket`, option `bell`).
- `emails.code`: RESHAPE: the gate now promises "One tap and you're in", so `digits` (nothing to tap) is dead.
- `emails.guest`: RESHAPE: the context carries the send-after-upload rule, but `link` and `GUEST_ROSTER` (`moments.tsx:89`) still send when a guest "left an address"; an unconfirmed address is never mailed on its own.
- `admin-triage.notice`: RESHAPE and REDRAW: every reporter passed a door that asked their name; a confirmed guest has a proven address and an Unverified guest's address is never mailed, so the cost of `both` changed (`notice.tsx:91-104` still draws "Anonymous, on their phone"); the claim's Finish deleting unclaimed uploads gives hosts a second silent gap.
- `admin-triage.escalate`: RESHAPE (context): "Their other album" for "Guest, no account" with an address (`fixtures.ts:284-291`, `escalate.tsx:217-228`) links events through an unconfirmed address, which nobody sees before verification; the ask should say whether a legal hold is exempt.
- The admin rail's "Reels" entry comes from the live nav (`src/lib/admin/nav.ts:80`) and leaves with the reel's teardown: leave it.
- `export-flow.chips`: REMOVE: its only case is a teaser viewer, who is held at the door with an inert backdrop (`docs/systems/guest-flow.md`), so never reaches Download. Drop the ALBUM knob's `teaser` option too (its "anonymous uploads are open" fixture, `fixtures.ts:86-94`, is impossible now).
- `export-flow.means`: RESHAPE (light): "a guest's only download" now has a sibling, the cut saved on the device; `reel-cut.moments`' "only yours" fill mirrors `mine`.

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

- **Work commit** `3d5e01c8` on `lp/recheck-mail-admin-export`, pushed. **Sync**: `origin/launch-prep` had moved to
  `1b92ad74` (docs-rules/roadmap-lean/docs-product-trim: `docs/design/rulings.md` retired, the ROADMAP/ASSETS trimmed,
  `touchpoints.ts` restructured — none of it under this lane's `owns` or `reads`); `git merge origin/launch-prep`
  fast-forwarded cleanly onto that tip (no merge commit: this branch carried no commits of its own yet), then the work
  commit landed on top of it, so no separate sync commit exists. The head is in the chat line.
- **Gates on the synced tree**, each its own exit code: `pnpm design:rules` and
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` both 0 (no diff produced either time — this lane touches
  no contract, policy or specimen); `pnpm typecheck` 0; `pnpm lint` 0 (9 pre-existing warnings, all in files this lane
  never touched: `review-session.tsx`, `home-hero/shared.tsx`, the guest `page.tsx`, `contact-form.tsx`,
  `album-fill-grid.tsx`, `review-switch.tsx`, `jobs.ts`, `use-flip.ts`); `pnpm test` 0 (350 files, 3871 passed, 1
  skipped); `pnpm build` 0. `pnpm lab:smoke --base http://localhost:3136`: 499 checks, 0 failing. `pnpm lab:demo --base
  http://localhost:3136` per board: `emails` 8 steps 0 failing, `admin-triage` 8 steps 0 failing, `export-flow` 7 steps
  0 failing (down from 8, `chips` gone). Verified `emails.moments`, `emails.code`, `admin-triage.notice`,
  `admin-triage.escalate` and `export-flow.means`/the ALBUM control in the browser at 375 and 1440.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = exactly the 10 files below, every one under
  `owns`; no exceptions.
- **The items**, one line each (verdict, old question -> new question):
  - `emails.moments` ADAPTED: "the four as drawn, nothing yet, or the set the new door implies" -> "the three as
    drawn...": `DORMANT_ROSTER` drops "Your highlight reel is ready" outright (impossible now, not unbuilt — a live
    montage with no host action or file never finishes rendering), so `shipped`'s three switches gain real sends
    instead of four; `identity`'s overrule now names identity-claims' own ticket as the in-app surface this mail
    would echo, and guest-capture's post-upload offer as the other board it should defer to first.
  - `emails.code` ADAPTED: "What should the sign-in mail show first, now the code is the product's one door?" ->
    "Now the verified-required gate itself promises 'One tap and you're in,' what should the mail's own button
    say?": `digits` (no button) is dropped as dead (a mail with nothing to tap would break a promise already made);
    both remaining options draw digits-plus-button and differ only in the button's copy ("Continue" vs the gate's
    own words, "One tap, you're in").
  - `emails.guest` ADAPTED (light, no question change): the `link` option's `means` and `GUEST_ROSTER`'s trigger
    both corrected from "left an address" to "first upload, address on file," matching the rule the context already
    stated (never mailed on its own).
  - `admin-triage.notice` ADAPTED and REDRAWN: "now a host already lives with one silent gap" -> "...two silent
    gaps" (the claim ticket's Finish deleting an unclaimed event's uploads is the second, beside a guest's own
    deletion); `notice.tsx`'s "Anonymous, on their phone" redrawn to "A named guest, on their phone"; the `both`
    option's cost, in both `spec.ts` and `notice.tsx`, corrected from "needs a new field" to "only ever reaches a
    confirmed reporter, an Unverified one has no address that could ever be mailed regardless."
  - `admin-triage.escalate` ADAPTED (context only, same question and options): now states that the hold sheet's
    "their other album" already crosses events by an unconfirmed address, and (moved into `because` for the length
    budget) that a legal hold is forensics' own deliberate exemption from that address's usual invisibility, not a
    hole in the rule.
  - `export-flow.chips` REMOVED: its only case, a teaser viewer reaching the Download sheet at all, is foreclosed by
    the door's "no exit" (she is held at an inert backdrop the whole way and never reaches the album, let alone this
    sheet). The ALBUM knob's `teaser` option went with it (`fixtures.ts`, `spec.ts`); `ChipMode`'s locked "two"/"why"
    rendering was cut from `dialog.tsx` as dead code once `chips` was its only remaining caller.
  - `export-flow.means` ADAPTED (light, context only): now names the cut (reel-cut's, saved on the device) as a
    sibling download path this board doesn't ask about, and credits reel-cut's own "Only mine" fill as the idea
    `mine` mirrors.
  - The admin rail's "Reels" nav entry (`src/lib/admin/nav.ts`): LEFT ALONE, as the survey said — not owned by this
    lane, and it leaves on its own once the reel's teardown lands.
- **Assets requested from Will**: none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**, one line each:
  - `emails.code`'s reshape invents a new copy dimension (which words the mandatory button carries) rather than
    letting the ask retire with one option standing; if he'd rather fold "always digits plus a button" into settled
    furniture and drop the ask, that's a smaller board.
  - `emails.moments`' `identity` option now defers to identity-claims for the notification surface rather than
    committing to one; if he wants this mail wired regardless of what identity-claims settles on, the deferring
    clause in `overrule` can come back out.
  - `admin-triage.notice`'s fixture reporter is redrawn as "A named guest" without picking a specific trust level;
    if always drawing her as Unverified (the commonest case) reads better than staying generic, that's a one-line
    change.
  - `export-flow.means`'s context names reel-cut's fill by the placeholder word "mine" (reel-cut's own copy round
    may rename it); nothing here pins that word, but the cross-reference reads it literally today.
- **Look at first**: `emails.moments` (option 1, "The three as drawn," for the redrawn roster) and `emails.code`
  (both options, for the new button-copy question); then `admin-triage.notice` option 3 ("both") for the corrected
  cost line; then `export-flow`'s ALBUM control (now three options, not four) confirming `chips`/`teaser` are fully
  gone.
