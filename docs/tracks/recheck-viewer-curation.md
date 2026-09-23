---
track: recheck-viewer-curation
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

No new one-way door. The calls this lane took and built on, each his to overrule:

- `media-viewer.video`'s recommendation moves from `badge` to `auto`. Taken: `auto`, because the reel made muted motion the product's grammar for a video and a tap on the reel can open a clip mid-play, which the badge would freeze into a poster. Recommended: keep `auto` (the overrule line carries the badge's case: a clip nobody pressed costs a phone at a party nothing).
- `host-curation.told`'s recommendation moves from `never` to `line`. Taken: `line`, because `reel-front.yours` may tell a guest when one of hers is in and her waiting tile keeps saying the host has not decided after the host has, so silence is no longer neutral. Recommended: keep `line` (the overrule carries the FAQ's public "Never").
- The host's `who` credit shows a CONFIRMED guest's proved address and never a typed one's, as `src/lib/media/uploader-identity.ts` (case 2) ships it and `content/help/require-verified-emails-explained.mdx:30` says. Recommended: keep; if "only a badge, never the address" is meant to cover confirmed addresses too, the shipped host lightbox line (`media-lightbox.tsx:214`) is what changes, and this drawing follows it.

## System-doc edits (in place, owned facts only)

- none (a lab-only recheck: no `docs/systems/` fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- Now, the lab and the kit: `lab:demo` presses a step only in its default knobs, so a config's other states are never measured (`media-viewer`'s `origin=reel` and `credit=confirmed`, verified by hand here); a `--state <control>=<option>` pass would press them too.
- Now, the lab: `media-viewer`'s drawn chrome (both capsules, the strip, the face-led credit) wears the board's hand-copied `bg-black/55 backdrop-blur-sm`, a grade behind the shipped lightbox's Crystal (`GLASS`); a material pass before the board's next round.
- Now, the lab: `media-viewer.holds` still draws the `grow` opening caught mid-flight, where `who` and `wayout` now draw it settled (`Viewer`'s `settled`); its next round passes `settled` there too.
- Now, the lab: `sandbox/gallery-fixtures.ts` (the shared pool of `host-curation` and four reel boards) still mints a nameless `isAnonymous` uploader and puts the host's own uploads in `REVIEW_ITEMS`, neither of which the product can do now; `host-curation` corrects only its peek, locally (`PEEKED`).

## Handoff (replaces the chat report)

- Work commit `b542965d` (both boards rechecked, the overtaken mechanism retired). Sync-merge commits, one per landing while this lane ran its gates: `b2602ebb` (docs-rules, roadmap-lean, the bible's why lines), `209a11aa` (recheck-mail-admin-export, recheck-help-press), `1ebff657` (docs-product-trim), `7b865cc8` (recheck-guest-identity; its `guest-list.tsx` change, a `reads` file, is two comment words and moves no grammar `who` follows) and `36a663c5` (systems-trim; `guest-flow.md`, a `reads` file, rewritten in the present tense with no rule moved). Every one auto-merged clean, none touched an owned path, and the two generated files merged without conflict: `pnpm design:rules` on each synced tree reproduced them with no diff. The head is in the chat line.
- Gates on the final synced tree `36a663c5`, each its own exit code: `pnpm design:rules` 0 (no diff); `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (no diff); `pnpm typecheck` 0 (after `rm -rf .next/dev`: on the first sync a stale `.next/dev/types/validator.ts` still named the `library/rulings/page.tsx` docs-rules deleted, so every later run cleared it first); `pnpm lint` 0 (9 pre-existing warnings in 8 files, none in a file this lane touched); `pnpm test` 0 (3837 passed, 1 skipped: `influences.test.ts`'s standing skip); `pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 ("483 checks, 0 failing"); `pnpm lab:demo --board media-viewer --base http://localhost:3134` 0 ("8 steps, 0 failing"); `pnpm lab:demo --board host-curation --base http://localhost:3134` 0 ("8 steps, 0 failing"). The same nine gates ran green on each of the four earlier synced trees. Both boards were also captured by hand at 375 and 1440 with `--force-prefers-reduced-motion`, from both origins and both credits.
- Lane check, `git diff --name-only origin/launch-prep...HEAD` (27 paths, plus this manifest on the handoff commit):

      docs/design/library.md
      scripts/lab-review.mjs
      src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.test.ts
      src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
      src/app/(dev)/design/(shell)/lab/_desk/queue.ts
      src/app/(dev)/design/(shell)/lab/_desk/review-store.ts
      src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
      src/app/(dev)/design/(shell)/lab/_desk/staging.test.ts
      src/app/(dev)/design/(shell)/lab/page.tsx
      src/app/(dev)/design/review/ledger.test.ts
      src/app/(dev)/design/rules/component-notes.ts
      src/app/(dev)/design/rules/rules.generated.json
      src/app/(dev)/design/sandbox/host-curation/fixtures.ts
      src/app/(dev)/design/sandbox/host-curation/host-curation.css
      src/app/(dev)/design/sandbox/host-curation/queue.tsx
      src/app/(dev)/design/sandbox/host-curation/signals.tsx
      src/app/(dev)/design/sandbox/host-curation/spec.ts
      src/app/(dev)/design/sandbox/media-viewer/board.tsx
      src/app/(dev)/design/sandbox/media-viewer/fixtures.ts
      src/app/(dev)/design/sandbox/media-viewer/media-viewer.css
      src/app/(dev)/design/sandbox/media-viewer/reel.tsx
      src/app/(dev)/design/sandbox/media-viewer/spec.ts
      src/app/(dev)/design/sandbox/media-viewer/viewer.tsx
      src/app/(dev)/design/sandbox/overtaken.test.ts
      src/app/(dev)/design/sandbox/overtaken.ts
      src/components/lab/step.test.tsx
      src/components/lab/step.tsx

  Exceptions: `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md`, both written by `pnpm design:rules` (the brief names the first; the second is the same command's other output, dropping the `overtaken.ts` line and the 22 retired contracts, 1237 to 1215); `src/app/(dev)/design/(shell)/lab/_desk/staging.test.ts`, one deleted line: its `AskState` fixture still built the retired `outcome` field.
- The items, one line per reached question (old question to new; adapted, redrawn or left, and why). None REMOVED: every reached question still holds an option that can beat the current path.
  - `media-viewer.opening` ADAPTED and REDRAWN for two origins: "How should a photograph arrive on the ground the album makes behind it?" to "How should a photograph arrive, out of its tile or out of the live reel, on the ground behind it?". `grow` became "It grows out of where it was" (out of the reel, the frame lets go of its crop), `sheet` keeps the album or the paused reel lit; recommendation `grow` kept. A new `origin` knob draws the reel as the engine's own frame of the tapped photograph, drawn once off the DOM (`media-viewer/reel.tsx`), with the flight measured from where the engine put the picture.
  - `media-viewer.who` ADAPTED and REDRAWN on the identity model: "the unverified mark" to "the Unverified mark", context now the three trust levels. `face`: a confirmed account's face and a door to its page, a typed name's plain disc and no door (as `guest-list.tsx` draws them); the mark is the shipped `UnverifiedMark` lit tone and word where it was an amber dot labelled "Email not confirmed"; the host's credit carries a proved address only, where every uploader's was printed. A `credit` knob asks Priya (typed) and Leah (confirmed); recommendation `face` kept.
  - `media-viewer.video` ADAPTED and REDRAWN: "How should a video meet a guest: playing, waiting, or wearing the browser's bar?" to "How should a video meet a guest in the viewer, now the live reel plays a muted window of it and may open the viewer mid-clip?". Each option says what it does opened from the reel (`auto` carries on from the reel's 1.5 s; `controls` and `badge` start over); recommendation `badge` to `auto`.
  - `media-viewer.wayout` ADAPTED and REDRAWN for two origins: "How should a guest get back to the album?" to "How does a guest get back to where a photograph opened: its tile, or the reel?". `down` drops it into its tile or back into the reel's frame, which picks up again; recommendation `down` kept; now drawn settled, where it wore `grow`'s flight under the dismissal.
  - `media-viewer.link` ADAPTED: "Should an open photograph have an address of its own, and what should Share hand on?" to "Should an open photograph get its own address, as the reel's ?reel will, and should Share hand on the link or the file?". The overrule no longer waits on the privacy call the cut settled, `file` stays the live road; recommendation `query` kept; captions only redrawn.
  - `host-curation.arrivals` ADAPTED: "A photograph lands while the host is reviewing with a selection held: what should the queue do?" to "A photograph lands mid-review with a selection held, and nothing waiting reaches the reel or the wall until approved: what should the queue do?". `reel-host.review` named as the owner of any header line; silence's note says none of the three reaches the reel or the wall; recommendation `prompt` kept.
  - `host-curation.count` ADAPTED: "How many places should tell a host how many uploads are waiting?" to "How many places should say how many uploads are waiting, now that the wall and the host's reel view may say it too?". `reel-screen.review` and `reel-host.review` named, never re-asked; one line above the three says what each answer means for them; recommendation `deeplink` kept.
  - `host-curation.told` ADAPTED and REDRAWN: "Should a guest whose photograph was refused ever be told?" to "... ever be told, now the album may tell her when one of hers is in?". `line` loses "and on their profile" (a typed name has none, a confirmed one shows only chosen events), `message` reaches only a confirmed address; recommendation `never` to `line`. Her feed drops the host-only like counts and `line` draws the dim it names.
  - `host-curation.peek` REDRAWN, question unchanged: the credit is a guest's typed name with the Unverified mark (`PEEKED`, "Nina, 4 of 7") where it fell back to "Anonymous" over the host's own upload; the ground is the shipped peek's (fixed, `GLASS_BEHIND`, a glass close) where a pre-glass `bg-black/95` box stopped at the content's foot.
  - Left alone, unreached by either round: `media-viewer.holds`, `.next`, `.closeup`; `host-curation.queue`, `.verb`, `.keys`, `.undo`.
  - The overtaken mechanism retired: `sandbox/overtaken.ts` and `overtaken.test.ts` deleted (the `press-page.the-facts` entry with them); `step.tsx` loses the badge, the `s` key, the stands button and `stood`, and `step.test.tsx` its 8 overtaken cases; `_desk/queue.ts` the `overtaken` and `outcome` fields and the two counted rows, `queue.test.ts` the real-board join block; `session-step.ts` the `OvertakenBadge` type and the `STANDS` re-export; `review-store.ts` `standAnswer`; `copy-so-far.test.ts` its 2 stands cases; `(shell)/lab/page.tsx` the stat, the tag, the bullet, the stood and overriding labels and the empty-state count; `review/ledger.test.ts` the stands exception (no ledger stores one: `grep -rn stands docs/reviews/*.json` finds nothing); `scripts/lab-review.mjs` the stands grammar, the overtaken reader, the override echo into `_window` and its help line (a pasted `=stands` is now refused as not an option); `component-notes.ts` its entry.
  - Lines left to the Orchestrator, each naming the retired mechanism: `docs/STATUS.md:39` (six asks "carry a badge ... until the boards are rechecked"); `docs/reviews/README.md:86-92` (the `stands` grammar and its example); `docs/ROADMAP.md:58` (the dock's note-column patch, which the stands button crowded); `usher/kit/README.md:49` (`sandbox/overtaken.test.ts` among the gate tests); `usher/kit/board-card.mjs:9,47-49,66,83-84` (reads the map behind `existsSync`, now always empty); `usher/kit/batch-reader.mjs:145,185-208` and `usher/kit/review-sheet.mjs:35` (a `stands` reading nothing produces now); `usher/essays/scar-tissue.md:28`; `docs/tracks/orchestrator.md:36,53`. The `touchpoints.ts` comment the brief named left with docs-rules' rewrite; the `media-viewer` registry lines (`ruled` and `board.note`, "how they get back to the album") could read "how they get back to where it opened, a tile or the reel".
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `media-viewer.video` now recommends `auto` (was `badge`); see Questions.
  - `host-curation.told` now recommends `line` (was `never`); see Questions.
  - The host's `who` credit shows a confirmed guest's proved address, as shipped; see Questions.
  - `credit=confirmed` credits Leah on Priya's photograph (the set's one portrait still) rather than on her own landscape, so the knob moves the credit and nothing else.
  - `who` and `wayout` are drawn with the opening settled; `holds` is unreached and still shows `grow` mid-flight (Deferred).
  - The reel origin wears `reel-view`'s own framing at its recommendations (the composition fitted in a 16 px margin, orientation following the screen, bare chrome) and Cinematic as the stand-in mood; another answer there moves this drawing, not these questions.
  - Opened from the reel in a hand, `sheet`'s gap shows mostly the reel's own dark ground (a 9:16 reel in a taller screen): drawn as it would be, not flattered.
  - `host-curation.peek`'s upload is credited in the board's own fixtures (`PEEKED`) rather than by editing the shared pool (Deferred).
  - The one-line exception in `staging.test.ts` (Lane check).
- Look at first: `media-viewer.wayout` with Opened from set to The live reel (the reel returning at full light, the frame it drops into lit), then `media-viewer.who` under The host curating on both credits (the plain disc and the mark against a face, a door and a proved address), then `host-curation.told` (the flipped recommendation, with the dim drawn).
