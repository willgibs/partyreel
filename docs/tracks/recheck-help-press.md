---
track: recheck-help-press
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c2482757"            # the launch-prep SHA the branch was cut from
board: help-center
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/reel-story/spec.ts
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - content/help/
  - src/lib/constants/press.ts
---

# lp/recheck-help-press

**Goal.** `help-center` and `press-page` made current with the identity and reel rounds: the door drawn as it ships, the highlight-reel copy retold in the reel's current words as provisional stand-ins, and the `press-page.the-facts` badge folded into its question.

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
- `help-center.article`: REDRAW: it draws the three steps from before the door ruling, ending "a few ask for nothing" (`article.tsx:32-50`); the shipped article runs scan, welcome, password, name with optional email, confirm, first photo.
- `help-center.hub` and `.who-first`: REDRAW the stale drawn copy: "Highlight reel ... one shareable video" (`fixtures.ts:76-83`); a facts row linking the retired download-the-reel-as-a-video article (`fixtures.ts:138-142`); "and the highlight reel" (`who-first.tsx:92`); "no app, no account" (`fixtures.ts:56`, `who-first.tsx:91`), where the shipped copy says "no app required" and Require verified emails is on by default. The reel's names follow `reel-story.help` and `reel-story.pricing`, which Will has not answered yet: use their recommended options as stand-ins and say so in each context.
- `help-center.from-product` `menu`: it draws a generic user menu, but the guest's own menu is `identity-door.menu`'s question: drop or narrow that part.
- `press-page.the-facts` (badge): RESHAPE, context only: keep the question word for word and add one context clause saying the reel's sweep retells the "Hosts get" and "Not this" rows (`src/lib/constants/press.ts:61`, `:80`). Its `overtaken.ts` entry is removed by `recheck-viewer-curation`; do not edit that file.
- `press-page.the-words`: REDRAW: the three-lengths fixture ends "becomes a highlight reel" (`the-words.tsx:23`); the drawn boilerplate follows `reel-story.thesis`'s recommended option as a stand-in.

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

- Now: `press-page/board.tsx`'s `wordsPreview` Frame heights for `paragraph-and-line` (declared 560/700, the real rendered iframe 605/913) and `founder-voice` (740/900 vs. 850/1238) run well short, pre-dating this lane and untouched by it (neither renders anything the identity or reel rulings touch); `the-sheet` and `the-facts` show the same kind of drift. A remeasure pass on the whole board would bring it to the "measured against the real iframe, never guessed" bar `help-center`'s own `board.tsx` already holds.

## Handoff (replaces the chat report)

- Work commit `aadfb15d` (help-center and press-page redrawn on the reel and identity rounds); sync-merge commit `185e0687` (`Merge remote-tracking branch 'origin/launch-prep'`: docs-product-trim and docs-rules had landed on `origin/launch-prep` since this lane's cut; auto-merged clean, no conflicts, nothing under either owned path touched by it). The head is in the chat line.
- Gates on the synced tree, each its own exit code: `pnpm design:rules` 0 (no diff: nothing here touches a contract, policy or `touchpoints.ts`); `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (no diff); `pnpm typecheck` 0 (first run failed on a stale `.next/dev/types/validator.ts` still pointing at `library/rulings/page.tsx`, which the synced-in docs-rules merge deleted; `rm -rf .next` and a clean re-run passed); `pnpm lint` 0 (9 pre-existing warnings, none in a file this lane touched); `pnpm test` 0 (3871 passed, 1 skipped); `pnpm build` 0; `pnpm lab:smoke --base http://localhost:3137` 0 (490 checks, 0 failing); `pnpm lab:demo --board help-center --base http://localhost:3137` 0 (7 steps, 0 failing, tallest `article` at 9.0 screens); `pnpm lab:demo --board press-page --base http://localhost:3137` 0 (7 steps, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the 6 `help-center/` files and 3 `press-page/` files below, plus this manifest on the handoff commit. No exceptions.
- The items, one line each (REDRAW/RESHAPE/ADAPT/left word for word, and why):
  - `help-center.article` — question and options left word for word (a format decision, not a product claim); REDRAW `article.tsx`'s `STEPS`/`SCREENS`: the old 3-step, pre-door "password or your email, if asked ... a few ask for nothing" replaced with the shipped 6 (scan, welcome, password, name with optional email, confirm, first photo) plus 3 new hand-built screen illustrations (`NameScreen`, `ConfirmScreen`, `PhotoScreen`); `board.tsx`'s `ARTICLE_H` remeasured against the real rendered iframes for all 3 shapes.
  - `help-center.hub` — question, options and context left word for word (an index-layout decision, unreached); REDRAW only `fixtures.ts`'s `CATEGORIES["highlight-reel"]` (title, blurb, `feature.label`) and `FACTS`'s reel row (label, href off the retired `download-the-reel-as-a-video`), both rendered inside `hub.tsx`'s `CategoryPane`/`BigDoors`. Names follow `reel-story.help`'s recommended `"the-reel"` and `reel-story.pricing`'s recommended `"renamed"` as unruled stand-ins, said so in a code comment at each site.
  - `help-center.who-first` — question/options left word for word; REDRAW `who-first.tsx`'s two hero subheads ("no app, no account" to "no app required"; "and the highlight reel" to "and the reel", same stand-in as above, same comment convention).
  - `help-center.from-product` — ADAPTED the `context` field only, per the brief's overlap rule, to name `identity-door.menu` and drop the overlap; question, options and `because`/`overrule`/`lands` left word for word. REDREW (narrowed, not dropped) the `menu` option's popover in `from-product.tsx`: it drew a generic single-row menu; it now mirrors `identity-door.menu`'s own shipped rows (name, "Unverified", Add your email, Change name, Sign in) verbatim and adds only the one proposed Help center row, visually distinguished.
  - `press-page.the-facts` — RESHAPED context only, question word for word, exactly as the brief specified: one added clause naming the reel round's retelling of the "Hosts get" and "Not this" rows (`press.ts:61`, `:80`) as a fact-wording change outside this ask's own question. `overtaken.ts` untouched (`recheck-viewer-curation`'s file).
  - `press-page.the-words` — question/options/context left word for word (a handover-format decision, unreached); REDRAW only the local `PAGE_LENGTH_FIXTURE` in `the-words.tsx`: its "becomes a highlight reel without a separate editor or a render queue to wait on" retold after `reel-story.thesis`'s recommended `"grows"` line ("Every event has a reel"), noted as an unruled stand-in in the same comment; `board.tsx`'s `wordsPreview.three-lengths` height remeasured for the longer line.
  - Every other ask on both boards (`help-center.feedback`, `.dead-end`, `.search`; `press-page.who-for`, `.the-sheet`, `.a-human`, `.the-close`, `.the-arc`) checked against both rulings and left alone, unreached: grepped both owned directories for "reel", "highlight", "studio", "email", "password", "account" and "guest" beyond what is listed above, and nothing else hit.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `from-product.menu` was narrowed rather than dropped outright (the brief allowed either): it keeps the option's own drawing, now mirroring `identity-door.menu`'s exact current rows plus the one proposed addition, rather than gesturing at "some further rows" with no shape at all. His call if the plainer gesture would have been the honester version.
  - Three names in this diff are unruled stand-ins, each following its own board's recommended (not yet decided) option: `reel-story.help`'s `"the-reel"`, `reel-story.pricing`'s `"renamed"`, and `reel-story.thesis`'s `"grows"` line. A different verdict on any of those three boards is a one-line word swap here, not a redraw.
  - The `press-page/board.tsx` height drift on `paragraph-and-line`/`founder-voice` (see Deferred) was left alone rather than fixed alongside `three-lengths`, on the read that fixing pre-existing, unrelated drift belongs to its own pass rather than this recheck's diff; a different call is a very small addition to the same file.
- Look at first: `help-center.article`'s `screen` option (the largest redraw: 6 real steps, 3 new illustrations) and `help-center.from-product`'s `menu` option (the identity-door.menu mirror).
