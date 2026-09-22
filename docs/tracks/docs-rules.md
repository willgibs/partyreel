---
track: docs-rules
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/design/README.md
  - docs/specs/
  - src/app/(dev)/design/_data/
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/rules/
  - docs/systems/design-system.md
  - docs/PROGRAM.md
  - CLAUDE.md
---

# lp/docs-rules

**Goal.** Distill Will's rulings log into the rules it became, then retire it and its Library page; keep the Library's specs and rulings registry to current rules only.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: the rulings log and the Library's rules.

1. Read `docs/design/rulings.md` whole (Will's dated rulings, each with a **Became:** line). For every section: if what it became already lives as a current rule in its home (the bible under `src/app/(dev)/design/rules/`, a policy test, `docs/design/guidance.md`, `docs/design/README.md`, a `docs/systems/` doc, `docs/PROGRAM.md`, CLAUDE.md, a component's contract), drop the section; if a still-live directive has no home, write it into its home as a current rule (present tense, one-line why; his exact words only where the words are the rule itself, such as a copy line he wrote); drop dead material (superseded rulings, retired boards' verdicts, process events, Moltbook and usher matters, dates). The bible changes only by his ruling: never add or reword a bible rule; a bible-level directive missing from the bible goes in your Handoff as a question. You own `docs/design/guidance.md` and `docs/design/README.md`; a fact whose home is a `docs/systems/` doc (the `systems-trim` lane owns those), `docs/PROGRAM.md` or CLAUDE.md (the Orchestrator's) goes in your Handoff under "For other homes", verbatim-ready, naming the home.
2. Delete `docs/design/rulings.md`. Remove the Library's rulings page (`src/app/(dev)/design/(shell)/library/rulings/`), its nav entry and search-index entries (`_data/nav.ts`), `listRulings` (`_data/docs.ts`) and every test assertion about them (`_data/docs.test.ts`, `links.test.ts`, `catalog.test.ts`, and anything the gate names). No Library link points at a removed page.
3. `docs/specs/*.md`: each spec is either a current rule the Library carries (keep it, present tense, no history) or a dead proposal (delete it and its references in your owned files).
4. The rulings registry `RULINGS` in `src/app/(dev)/design/touchpoints.ts`: delete every row whose board or item left without a winner in the codebase (retired unruled, superseded, `reel-studio`), keeping every row a test requires (every standing board's row; every ruled component's row with `lives`); rewrite each remaining row's `ruled` and `why` as the current rule and its rationale in the present tense (a standing board: `open` and what it asks; a ruled item: what binds and why), inside `touchpoints.test.ts`'s limits. Keep ids, `lives`, `board` fields and `DESK_ORDER` exactly as they are.
5. Every mention of `rulings.md` or `CHANGELOG` in your owned files states the rule instead.

HANDOFF EXTRAS: a carried/dropped table (one line per rulings.md section: its home, or why dropped); "For other homes" (PROGRAM.md principles, CLAUDE.md lines, docs/systems facts, verbatim-ready, each naming its home); memory candidates (Will's durable preferences about how he works, one line each); bible questions.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The full gate on the synced tree, each step on its own exit code (`pnpm design:rules`, the specimen collector, typecheck, lint, test, build, `pnpm lab:smoke --base http://localhost:3131`); the Library at 1440 with no link to a removed page.

## Questions (a recommended answer each; the Orchestrator relays them)

Calls taken on the recommended answer, each his to overrule (none is a one-way door):

- **All seven `docs/specs/` files are dead proposals.** Each was a retired board's post-mortem ("kept only until the spec docs of retired boards are folded"); its rules live in `design-system.md`, `marketing-voice.ts`, `marketing-media.ts` and the bible, and the Library's own health strip already counted all seven as "proposals whose board has landed". Recommended and taken: delete all seven.
- **With no spec doc, the proposal level reads the standing boards.** `influences.test.ts` requires every level to carry an influence, and a standing board's asks ARE "a board's argument; not law until Will rules", so proposals are the 23 boards and rulings the 51 ruled rows (before, the open boards were counted as rulings). Recommended and taken; the alternative is retiring the proposal level and `/design/lab/proposals`, which changes the level set and so is his ruling.
- **The ruled rows get a Library home.** The rulings page was the Library's only view of his rulings; the rules page now renders the registry's ruled rows as "The rulings" (`/design/library/rules#rulings`, grouped by surface, each row anchored `ruling-<id>`), the nav's Rules group lists it, and the search indexes each row there. Recommended and taken, since a removed page with no replacement would leave the ruling level visible nowhere ("no hidden influences").
- **Will's directives with no home land in `guidance.md`** as "Standing preferences" (defaults, never law), not the bible. Recommended and taken; the two that may be bible-level are the bible questions below.

**Bible questions** (the bible changes only by his ruling; nothing in `bible.ts` was touched):

1. "I think this crisp media motion design is going to be the foundation of our visual identity" (his, on the privacy hero and the image trail) is in no rule. Recommended: add it to bible 1's statement, which today names only the still half of the identity ("the media is the color").
2. The bible's `why` lines still carry dates and provenance ("Will, 2026-09-14", "ruled 2026-09-17", "the ninth batch made the law the ORDER (2026-09-18: ...)"), bible 21 names the retired `voice` board as the one establishing the voice, and bible 1's why says "the light exploration writes the aurora" (retired). Recommended: let the Orchestrator rewrite the `why` lines present-tense in one pass with no rule's meaning changed, bible 21 reading "the voice is built one won line at a time, in its real place".
3. "Every ask is a benefit" (frame a name, an email, an upload or a gate as what the guest or the host gains, never as a regulation; his words at the identity ruling) holds on any page that does not exist yet. Recommended: keep it in guidance, where it is now, unless he wants it as a copy rule beside bible 20.

## System-doc edits (in place, owned facts only)

- none (this lane owns no system doc; the lines for other homes are in the Handoff)

## Deferred (ROADMAP one-liners, bucket named)

- Now: `/blog`'s closing band promises "No app or account for your guests." (`src/app/(marketing)/(cinema)/blog/page.tsx:52`), which bible 20 refuses; `content-policy.test.ts` misses it.
- Now: the `/pricing` h1 is `GOLDEN_LINES.pricing`, "Start free, upgrade when you host again.", which sells Pro as hosting again; his pricing note says that framing loses every wedding. Redraw it on what one big event gains (a voice ask).
- Now: two pricing doors still leave the app for `/pricing`: the storage step (`src/lib/dashboard/next-step.ts:139`) and the Studio's 60-second line (`src/components/reel/reel-studio.tsx:503-512`, the old sentence rather than a lock chip); `gated-sites.test.ts` covers neither.
- Now: the guest album's skeleton takes no tile size (`src/components/guest/event-experience.tsx:1005-1010`), so it lays 8 columns at 1920 before the album lands at 7.
- Now (probable): `src/components/shared/masonry.tsx:363` reads `--gap-gallery` unresolved (`max(3px, 4px)`), so the JS column count parses no gap.
- The voice: the event type pages close on "Your guests need nothing but their phones." (`src/app/(marketing)/(cinema)/events/[slug]/page.tsx:195`), a promise a verified-emails event breaks.
- The voice: the toast sweep his toasts ruling left open: where a control can show its own result, no toast fires (the 65 call sites are unreviewed).
- The lab: `/design/lab/proposals` and the `docs/specs` reader have nothing to show (a board's argument lives in its `spec.ts`): retire the route and its `status.ts`, or keep it for a board that writes a document.
- The lab: the exploration briefs shelved until the desk closes, in leverage order: the link cards, a feature page's anatomy, the home-screen install, the blog read, the legal read, the about page, the AI-reader surface (the venue screen became `reel-screen`).
- The lab: `help-palette.tsx` builds its own floating panel outside `src/components/ui`, hand-wearing `rounded-float` and `shadow-layer`, so `floating-layer.test.ts` cannot hold it.
- Code hygiene: unmounted production components (`ghost-grid.tsx`, `floating-add-button.tsx`, `event-feed.tsx`, `event-feed-action-bar.tsx`, `event-filter-pills.tsx`; `filter-chips.tsx` and `tile-size-control.tsx` drawn only in the Library), three unused props passed to `EventCardQr` (`events-section.tsx`), and comments describing retired designs (`sonner.tsx` and `guest-masonry.tsx:35-38` the floating Add pill, `masonry.tsx:180-182` the landed check, `globals.css:745-747` the ghost grid, `gallery-skeleton.tsx:15-16` 5/6/8, `enter-event-prompt.tsx:7-12` the "account step", `cinema-hero.tsx:57-69` and `hero-stream.ts` a bare QR, `marketing-voice.ts:75` a kinetic headline, `reel-marquee.tsx` and `reel-panel.tsx` the feed, `next.config.ts:106` "the rulings, the record").

## Handoff (replaces the chat report)

- **Head:** the manifest commit named in chat, pushed. **Work commits** `3f052961` (the distillation, the retirements, the registry) and `7ccef6f9` (the Library as working guidelines, not hard rules, on Will's clarification relayed mid-lane). **Synced** with `launch-prep` at `49136929` (a merge of `1c560b16`, which carries `pointer-sweep`'s merge `b314fc97` and the Orchestrator's `c2482757`; an earlier sync was `d403487a`); the generated files re-checked fresh after it.
- **Gates on the synced tree** (`49136929`), each on its own exit code: `pnpm design:rules` 0 (no change to `library.md` or `rules.generated.json`); the specimen collector 0 (no change); `pnpm typecheck` 0; `pnpm lint` 0 (9 warnings, none in a touched file); `pnpm test` 0 (350 files, 3873 passed, 1 skipped); `pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (491 checks, 0 failing; the key a dummy in the environment). The Library at 1440 on :3131: the rules page's "The rulings" renders 51 rows by surface; no link to `/design/library/rulings` on `/design/library`, `/rules`, `/guidance`, `/policies`, `/glossary` or `/design/lab`; `/design/library/rulings` 404s and `/design/record` 307s to `/design/library/rules`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths below plus this file, with three exceptions:
  `docs/design/README.md`, `docs/design/guidance.md`, `docs/design/library.md`, `docs/design/rulings.md`, `docs/specs/brand-voice.md`, `docs/specs/floating-surfaces.md`, `docs/specs/light.md`, `docs/specs/media-kit.md`, `docs/specs/palette.md`, `docs/specs/rounding.md`, `docs/specs/type-scale.md`, `scripts/design-rules/library-md.mjs`, `src/app/(dev)/design/(shell)/library/page.tsx`, `src/app/(dev)/design/(shell)/library/rules/page.tsx`, `src/app/(dev)/design/(shell)/library/rulings/page.tsx`, `src/app/(dev)/design/_data/catalog.test.ts`, `src/app/(dev)/design/_data/catalog.ts`, `src/app/(dev)/design/_data/docs.test.ts`, `src/app/(dev)/design/_data/docs.ts`, `src/app/(dev)/design/_data/glossary.ts`, `src/app/(dev)/design/_data/legacy-routes.ts`, `src/app/(dev)/design/_data/links.test.ts`, `src/app/(dev)/design/_data/links.ts`, `src/app/(dev)/design/_data/nav.ts`, `src/app/(dev)/design/rules/influences.ts`, `src/app/(dev)/design/touchpoints.test.ts`, `src/app/(dev)/design/touchpoints.ts`.
  - Exception `docs/design/library.md`: generated by the gate's `pnpm design:rules` from the README's levels and the guidance headings this lane changed.
  - Exception `scripts/design-rules/library-md.mjs` (no lane owns it): the four template lines of its "What binds you" intro, which told a worktree agent to "obey three things and nothing else"; they now say working rules followed by default and reshaped deliberately, as the README does on Will's clarification.
  - Exception `src/app/(dev)/design/rules/influences.ts` (`pointer-sweep`'s, now merged; in my `reads`): deleting `listRulings` (brief item 2) broke its import and its `rulingInfluences` still read the retired file and linked the removed page, and emptying `docs/specs` (item 3) left the proposal level with no source, which `influences.test.ts` refuses. The hunks: the import lines; the `law`, `contract`, `policy`, `proposal` and `ruling` LEVELS lines (they match the README rows); `proposalInfluences` (the standing boards, plus any spec doc whose board has left) and `rulingInfluences` (the ruled rows, `visibleAt` `/design/library/rules#ruling-<id>`) with their header comments. The two conflicts with `pointer-sweep` (the `ruling` line and the `rulingInfluences` comment) are resolved in `49136929`, this lane's side taken; nothing in the tree reads or links the retired file or page.
- **Items:**
  - `docs/design/rulings.md` deleted, its 58 sections carried or dropped (the table below).
  - `docs/design/guidance.md`: present tense, no dates or quotes-as-provenance; new "Standing preferences" (four for the product, seven for the marketing site); Boards gains "the answer never covers the question", "the specimen shows the difference" and "copy is judged in its real place"; the stale guest reading-copy rule (`text-[15px]`) replaced by the body ladder; Hobday's list corrected (both shadows, cool neutrals).
  - `docs/design/README.md`: the proposal level is a standing board's argument, the ruling level what Will ruled for one component or page; "What binds you" gains "an example illustrates a rule, never its text" and the Library as the whole rule set; the homes of proposals and rulings rewritten.
  - `docs/specs/`: all seven deleted (Questions).
  - The Library: the rulings page deleted; "The rulings" section on the rules page; the nav's "Rulings" item and the search's rulings pointing there; the glossary's Library, Ruling and Proposal terms; the home's link and description; `/design/record` redirects to the rules page; `rulings` leaves `RESERVED`; the `ruling` ref kind, `listRulings` and the specs trace glob deleted; the Proposals nav section appears only while a spec doc exists.
  - `touchpoints.ts`: 15 rows deleted (`marketing-identity`, `marketing-decomposition`, `marketing-hero-substrate`, `pricing-calculator`, `brand-voice`, `media-kit`, `reel-reveal`, `reel-experience`, `reel-studio`, `host-event`, `host-dashboard`, `host-event-page`, `host-event-build`, `buttons`, `album-hero`: retired unruled, killed, superseded by a later ruling, or the stored reel his reel ruling replaces); 74 rows rewritten, the 23 boards as `open:` and what each asks, the 51 ruled rows as the rule each holds today with its why and what ships, every claim checked against the code by three read-only sweeps (the rows that had drifted: `entry`, `upload`, `states`, `event-card`, `forms`, `qr-card`, `app-door`, `app-vocabulary`, `guest-verify`, `gallery-width`, `glass`, `home-hero`, `type-scale`, `body-type`, `floating-surfaces`, `river-visual`, `voice`); `album-page` retitled without "round four"; `RULED` exported; the header, the `Ruling` field docs and the `DESK_ORDER` comment state the current rules (a new board registers after its named neighbour). Ids, `lives`, `board` fields and `DESK_ORDER`'s entries are unchanged.
  - `touchpoints.test.ts`: a guard that a ruled row states its rule (never "open", never an ISO date).
  - Will's clarification (the Library as working guidelines, not hard rules) is in the README's "What binds you" and levels, the generated `library.md`, the rules page (its description, the levels callout, "The bible" section), the Library home, the glossary's Rule and Contract, the nav's bible note and the registry's header: the rules are followed by default and reshaped deliberately when a better solution needs it (the bible only by his word, a contract only with its test), the lane saying which in its Handoff.
  - Tests: `docs.test.ts` (no `listRulings`, no read of the retired file, a spec doc only for a standing board, the rendered-doc floor counting only the fixed docs so the manifests leaving at their merges cannot redden it), `links.test.ts` (no `ruling` kind), `catalog.test.ts` (crumbs on Guidance, the proposal search kind optional while `docs/specs` is empty, the ruled rows indexed on the rules page).
- **Carried or dropped, one line per `rulings.md` section** (newest first):
  1. the reel, reconceived: the six reel boards' rows state what each asks of the live reel and the cut; the reel round's approved plan carries the wiring; the rules that stand (curated randomness, no music, the free levers, no end-card, the watermark in the dispatch layer) are already in `host-app.md`; the superseded stored reel and the retire-unreviewed precedent go to other homes (below); his reasons, answers and plan review dropped as the round's narrative.
  2. the morning after the identity round: the name gate in `auth-accounts.md`; the unclaimed name leaving the guest list to another home (below); the identity work is the three identity boards; his project next is the reel round (done); Moltbook dropped.
  3. guest identity: `guest-flow.md` (three levels of trust, "Unverified", the door's copy), `host-app.md` (the claim ticket), `profiles-social.md` (nothing published until chosen); "every ask is a benefit" into `guidance.md`; the accepted impersonation gap to another home (below); "he reads chat, not plan files" a memory candidate.
  4. the door's first look: `guest-flow.md` (Continue, "The host has asked...", the demo fresh each visit); Back and Continue as previous and next into `guidance.md`; his open email question answered by section 3, dropped.
  5. the door as three steps: `guest-flow.md` (the door as an itinerary with no exit), `host-app.md` (Require an upload to view); the profile setup is `identity-profile`; the plan-review request dropped.
  6. the overtaken audit: `PROGRAM.md` "The round" 7 (stacked boards never overlap; reshape, or remove only at no value); the focused and token-burn cycles a memory candidate; the audit's counts dropped.
  7. the identity reshape: superseded in part by section 3; what stands (Require verified emails on by default, no cap on a name-only guest, the mark and its way out) is `guest-flow.md` and the `guest-verify` row; the Auth rate limit is on the ROADMAP; his calls to overrule dropped.
  8. the desk by day: the heartbeat and Moltbook are the Orchestrator's own (`usher/`), dropped here; the Supabase dashboard permission a memory candidate.
  9. the closing sitting's third batch: the `first-event` and `upload` rows, `host-app.md` (the cap as a door), `guest-flow.md` (the failure sheet, one arrival grammar); the printable QR gallery on the ROADMAP; the overnight cadence dropped.
  10. the closing sitting's second batch: the `seed-avatar`, `app-door`, `demo-event`, `pricing-page` and `app-pricing` rows; "convert, not block" in `lock-chip.tsx` and `guidance.md`; the Plan card as billing's only door in `auth-accounts.md`; scrolling over swiping in `marketing-content.md` and `guidance.md`.
  11. the toasts board: the `toasts` row; the "if the control can show it, no toast" sweep to Deferred.
  12. the closing sitting's first batch: the `body-type`, `app-shape`, `guest-shape` and `app-vocabulary` rows; the no-dashboard-share note quoted in `host-app.md`; `guest-verify` round one superseded by sections 3 and 7; Moltbook dropped.
  13. the morning, close the board: "no new board until the desk is closed" superseded by his own reel round; an open board's next round is `PROGRAM.md` ("Every round gets Will's notes"); the shelved briefs to Deferred.
  14. the night, second: `PROGRAM.md` "The round" 7 (explorations touch nothing open); the Orchestrator's own folder, Moltbook and the overnight autonomy dropped here (memory holds the autonomy).
  15. the sixth batch: the `glass`, `guest-shape`, `admin`, `app-door`, `seed-avatar`, `app-vocabulary`, `demo-event` and `pricing-page` rows; a guest's own upload removable for good in `guest-flow.md`; desktop hover kept in `design-system.md`; "one purpose, one component" into `guidance.md`; Pro's case to another home (below); his plan answers dropped.
  16. the fifth batch: the `voice` (bible 20 permissive), `body-type`, `glass` and `app-shape` rows; his hero sentence in `marketing-voice.ts`; two-line headings into `guidance.md`; a phone tile's marks in `design-system.md`; the overtaken mechanism in `PROGRAM.md` "The round" 7; the Orchestrator's own-folder rules a memory candidate.
  17. seeded default avatars: the `seed-avatar` row, `auth-accounts.md`, `profiles-social.md` and the generator's own credit to hashvatar.
  18. the desk by leverage: `PROGRAM.md` "The round" 5 and the `DESK_ORDER` comment; the preview-key aside dropped (the key's rotation now waits for his word).
  19. the lab rides rising tides: `PROGRAM.md` "A round returns DECISIONS" (the workflow rides rising tides too).
  20. the fourth batch: the `event-identity`, `site-chrome` and `profile-page` rows; `profiles-social.md` (the quick look, the avatar on the name, bio limits, everyone named, handles free); "the menu goes straight to the page" into `guidance.md`; the nav over every chapter is `site-chrome`'s; a demo event always set is on the ROADMAP.
  21. the third batch: the `error-pages`, `how-it-works` and `event-type-pages` rows; heroes share a lockup never a template, a page's payoff is its own and no centred portrait video into `guidance.md`; the partners page on the ROADMAP; "kids are never a target user" a memory candidate (his "not a rule").
  22. the overnight round: the twelve boards are rows (standing or ruled); why explorations are cheap is `PROGRAM.md` "Rising tides"; the pacing is "Model delegation"; the rest dropped.
  23. the pricing page, granular: `PROGRAM.md` (every part its own decision); the two boards it queued are ruled rows; dropped otherwise.
  24. stack the lab: the boards it cut are rows; the in-app sheet with the marketing page a click away is the `app-pricing` row.
  25. the app and the guest pages are unprotected: bible 22 and `PROGRAM.md` "Rising tides" (the app's UI and the guest pages included).
  26. the second batch: the `image-trail`, `album-page`, `river-card` and `gallery-width` rows; `album-motion` stands; the card's own copy gradient in `design-system.md`; the tile size in the `app-vocabulary` row; the left header in the `header` row.
  27. full-image sections are chapter transitions: `design-system.md` "Chapters"; the `cursor-backdrop` and `image-trail` rows.
  28. the privacy hero: none: the `image-trail` row and `privacy-hero` board; "crisp media motion is the foundation of the visual identity" is bible question 1; the Codrops reference in the trail engine.
  29. the admin rethought: `admin-observability.md` (the foundational identity, an on-brand devtool), `architecture.md` (one Orchestrator across every surface), the `admin` row.
  30. the board keeps growing: `PROGRAM.md` (narrower rounds; his notes between rounds), `guidance.md` (dark and light chosen separately), bible 5 (the ladder reaches body sizes).
  31. the calm was the wrong instruction: `PROGRAM.md` (a relative note against a reference; placeholder copy by size); "the answer never covers the question" into `guidance.md`; the `gallery-width`, `river-visual` and `album-page` rows.
  32. the ladder keeps its order; corners C; generated media: bible 5 and 8, the `type-phone` and `rounding` rows, `PROGRAM.md` (the fix at its source, measure every tile), the Terms' generative-AI line (`legal-terms.tsx`), the Higgsfield month on the ROADMAP and in memory.
  33. the media kit is killed: bible 18, the `marketing-media.ts` header and memory (no rights tracking, one Higgsfield month); its spec deleted.
  34. the brand voice killed: bible 21, `PROGRAM.md` (never force options apart), "copy is judged in its real place" into `guidance.md`, the `voice` row; its three shipped calls in `marketing-voice.ts`; its spec deleted.
  35. the v1 wordmark: `design-system.md` (the wordmark alone), the icon on `ASSETS.md`.
  36. dark mode's shadows, the bright edge, Card, two levels: bible 10 and 15, `design-system.md` (elevation, the bright edge, the floating-layer contract), the banked shimmer on the ROADMAP; Glass shipped (the `glass` row).
  37. the bloom, the halo, the beam; the Aurora as a mix: bible 9 and 11, `design-system.md` (the halo lights an object from behind, never a button); rising tides reaching the lab in `PROGRAM.md`.
  38. the type scale B; the Aurora in three forms: the `type-scale` row, `design-system.md` "The Aurora, and its three forms".
  39. the hero stacked; Graphite; the Aurora off paper: the `home-hero` and `palette` rows, bible 11, `design-system.md` (the publish beat in the house five); the resolved-question rule lives in the lab's review code, dropped here.
  40. the lab winds down into the Library: `PROGRAM.md` "The round" 6, CLAUDE.md "Build", memory.
  41. the home hero is the source: the `home-hero` row.
  42. a track returns a catalog; the Library owns every design fact: the Library as the whole rule set into the README; docs carry rules, never history (CLAUDE.md); the verdicts in `board-spec.ts`; the lab bug list dropped.
  43. a question carries its context; a catalog: `guidance.md` Boards and `PROGRAM.md`; the light board's accent register superseded by Graphite, dropped.
  44. the lab is an internal app; the library is the whole rule set: the README ("no hidden influences"; global apart from component) and `guidance.md` (the lab never writes the repo).
  45. agent pushes do not run CI: CLAUDE.md "Git" and `PROGRAM.md` "Agent boot".
  46. the review surface: `guidance.md` Boards (switches in the dock, 1:1, the real thing, dark and light apart, the specimen shows the difference); the app's UI open in `PROGRAM.md`.
  47. rising tides, from the ground up: bible 22 and `PROGRAM.md`; "an example illustrates, never the rule's text" into the README.
  48. unlimited resources; light QA; nothing protected: `PROGRAM.md` (Unlimited design resources, Prototype first, Rising tides).
  49. the bible's second edition: `bible.ts` itself.
  50. less is more: the README "What binds you", CLAUDE.md "Keeping the docs healthy" (no copy pinned, a contract never a look, the ★), `PROGRAM.md` "Rules are provisional"; the parked human review dropped (obsolete).
  51. the library is what agents pull from: CLAUDE.md "Build" and the README; the lab's own subdomain on the ROADMAP.
  52. rules are provisional: `PROGRAM.md` "Rules are provisional".
  53. chapters open strong: bible 17 and `design-system.md` "Chapters".
  54. focused rounds, prototype first: `PROGRAM.md` "Prototype first" and `guidance.md` "The screenshot gate".
  55. action colours are universal: `design-system.md` (one colour per action) and the `gallery-actions` row.
  56. craft is the differentiator; guest pages are the host's: `guidance.md` "The craft stack", bible 4 and 12.
  57. one brand, two volumes; media is the colour: bible 1 and 2; "frames wait for real media" into `guidance.md`.
  58. no em-dashes: bible 19, `no-em-dash-policy.test.ts`, CLAUDE.md "Copy".
- **For other homes** (verbatim-ready, each naming its home):
  - `docs/systems/host-app.md`, at the head of the reel section: "★ **The stored reel is ruled out; the reel round replaces it at its wiring.** The reel becomes the event's own: a live, looping montage of what the album shows from its third reel-eligible item, spliced within seconds by the doorbell, the host's mood by default with a viewer's own style switch, a first-class screen mode, and a per-event switch, on by default. A cut is anyone's, made on the device from the reel and never stored (on a paid event, Add to the album sends it through the ordinary upload queue as the uploader's video, which the live reel skips). Video plays a range-fetched window of the original decoded on the viewer's device behind Include videos, the poster covering every failure. Every table, route and job built for a stored reel is dropped once one alias build replaces the old reel, so build nothing new on the stored reel below."
  - `docs/systems/host-app.md`, the claim ticket's paragraph: "An unclaimed name leaves the guest list and the host's Guests room with its uploads, since both list only guests with an approved upload (`getEventGuestList`); the guest row itself survives, empty, for the device that minted it."
  - `docs/systems/guest-flow.md`, the three levels of trust: "**One gap is accepted.** On a names-mode event anyone can type any name and any unproven address. An unconfirmed address is inert (never shown to the host, never attributed, never mailed), so a false one borrows nobody's identity; a host facing a risky crowd turns on a password, Require verified emails or moderation, and an address's owner disowns what was not theirs at Finish."
  - `docs/PRICING.md`: "Pro's case is what one big event needs (videos, more storage, the longer reel), never only hosting again: most paid hosts hold one event, a wedding above all, so a line that sells Pro as 'for your next event' loses them."
  - `docs/PROGRAM.md`, "The round" 7, after "a retired board leaves nothing behind but its winner": "A board whose product no longer exists retires unreviewed, and its live questions are reshaped into the boards that replace it."
  - `docs/reviews/README.md` line 8, which still names `docs/design/rulings.md`: "the rulings once they land (the rule each made: the bible, the Library, a system doc)".
  - Facts stale against the code, found by the sweeps (for `systems-trim` or the doc-eye pass): `design-system.md` about line 757 and `guest-flow.md` line 93 name a ghost grid (the empty and locked album draw the ghost river); `guest-flow.md` lines 82-83 give 220px columns and 5/6/8 (the Tile size defaults to 240px, 5/6/7 at 1280/1512/1920); `design-system.md` about line 384 lists the album hero under ScreenLamp and about 436 says the halo has no production use (the album page's hero is lit by a halo); its media-forward card section names the blog library (blog cards keep their own scrim); `marketing-content.md` lines 114-115 say "anonymous is Anonymous" (the identity rule: never "anonymous").
- **Memory candidates** (Will's durable preferences about how he works):
  - He does not read the plan files: anything that matters is said in chat, in the planning questions or in the round's summary.
  - He works in two cycles: focused (he reviews while agents build, at an even pace) and token-burn (boards stacked on non-overlapping surfaces before the weekly limit resets, so no tokens expire).
  - He reviews faster than agents build: keep the board filling while he reviews, but never deepen an exploration without his notes between rounds.
  - An early answer must not kill a later, better option: reshape rather than remove whenever unsure.
  - He favours unifying similar components with props but may pick "unify" where two serve different purposes; flag or judge those rather than merge blindly.
  - His examples illustrate a principle; they are never the rule's text.
  - Kids are never a target user: a note for the Orchestrator, never marketing copy and never a rule.
  - He granted read ("pull") permission to use the Supabase dashboard in his Chrome.
  - The Orchestrator's own folder (`usher/`) is its own, on three rules: never act as him, never spend money, never do anything destructive.
- **Calls his to overrule:** the seven specs deleted; the proposal level as the standing boards; "The rulings" on the rules page as the ruling level's home; eleven standing preferences in `guidance.md` (their wording is mine, his where quoted); the fifteen rows deleted, above all `reel-reveal` (its composite still ships; deleted because his reel ruling supersedes the birth by Create) and `marketing-voice` kept as the thesis row beside `voice`; the working-guidelines wording across the Library (mine, on his clarification), with the rules page's law section retitled "The bible" and the level badges and ids unchanged.
- **Look at first:** `/design/library/rules` at 1440 (the reframed header, then "The rulings"), then `src/app/(dev)/design/rules/influences.ts` as resolved in `49136929`, then the Standing preferences in `docs/design/guidance.md`.
