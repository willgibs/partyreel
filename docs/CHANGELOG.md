# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16).

---

## 2026-09-16 — The revamp, in progress: the lab that works, the loop as the rulebook, the record two rounds deep (`5cdebfe0` onward)

Will opened his review of the clarity round on localhost and found the lab "super broken": the
sidebar as a full-width block at the top of every page, "On this page" a section above the title,
1:1 canvases boxed in a centred column, the dock not sticky, a pick that could not be unpicked. Behind
the bug was the finding that matters: the tracks "are turning into massively over-engineered pages"
when he wanted "design catalogs of ideas to ship in the lab" to kill, refine or promote to the
Library; agents run two and three rounds without his notes "made research papers out of their first
round's work"; and the repo "over-indexes archival documentation". The plan he approved runs four
rounds: the lab, the docs diet and the track protocol, the Library as the complete inventory, the six
paper boards rebuilt as catalogs. His directive is verbatim in `docs/design/rulings.md` (2026-09-16).

**Round 1, the lab.** The layout faults were a browser holding an old copy of the lab's stylesheet
(Turbopack names dev chunks by path) and, once, the dev server's own cache serving the old chunk after
an edit. The foundation (`5cdebfe0`): `LabChrome` reads `--lab-css-generation` off `.lab-shell` after
mount, reloads once in development and otherwise shows a strip naming both causes;
`lab-css-generation.ts` holds the number `design.css` declares and a test keeps them equal;
`pnpm lab:smoke` refuses a lab page whose stylesheet set lacks the shell; a second click on any pick
clears it, through one set of writers in `review-store.ts` that every surface uses; a wide page's
stages and frame rows take the gutter back at 1:1 (`data-lab-bleed`); `board-spec.ts` gained the
catalog's shared types (`ITEM_VERDICTS`, `LIBRARY_VERDICTS`, `Candidate.one / verdict / facts`,
`Control.clearable`, `BoardSpec.catalog`, `LIMITS.readingWords`). Two lanes ran on it.
**`lab-sweep`** (merged `88dafe50`) walked every lab page as a stranger at 1440 and 375, dark and
light, keyboard only, and fixed the shell: "On this page" closes the page header instead of opening
every page above its title (a board drops it for the dock's Sections menu); the top bar's sidebar
button collapses the sidebar on any page, not only a board; a skip link is first in the tab order
where thirty nav stops stood; the phone sheet gained a close and the two area pills; the content
column clips at 1:1 so a bleed stops at the window edge whatever a board does; a board's round badge
reads its own spec, since a manifest is deleted at its merge; the words a stranger reads were
plainened; the ⌘K palette became a combobox. ★ A bare `overflow-x: clip` is dropped by Lightning CSS
and survives only inside `@supports`. **`lab-catalog`** (merged `57b93286`) built the review's third
scope and the catalog kit: a round's ledger gained `items` beside its answers and the Library
`_library.json`; a board that declares `catalog` puts its cards on the desk as one items step per
board, walked before that board's questions; the grammar grew `item:<id>=keep|refine|kill "note"` and
`review library: <entry>=keep|redesign|retire`, parsed by `pnpm lab:review`, which reads a spec's
`candidates` off the page; the kit gained `Catalog`, `VerdictPill`, `ItemVerdictRow`, `CompareTwo`,
`SpotCompare` and `GroundBox`; `pnpm new-board` scaffolds a catalog by default; `/design/lab/kit` is
the toolbox with a live demo per tool; the smoke weighs every board's words outside every closed fold
and every specimen against the budget (all twelve standing boards are over it, 2,465 to 15,004 words,
which is the measure of the papers); the palette was rebuilt on the kit as the proof; the dock opens
collapsed at 375. Behind the merges: Next's dev indicator moved off the sidebar control (`52241e4f`),
and the lab functions' file trace fell from 2,248 files to 718 once the doc reader's dynamic root
carried `turbopackIgnore` (`ce21ac31`; the docs it needs were already traced by name).

**Round 2, the docs diet and the track protocol.** `docs/PROGRAM.md` became the loop itself: Will's
one-line ask, the questions that branch the work asked in chat, one track per board returning a
catalog, one alias build per close, his verdicts on the desk, the promote path, never a second round
without his notes; the agent boot and the integration steps; the record's depth. `CLAUDE.md` is 150
lines. `docs/tracks/README.md` carries the one-round manifest template (Questions, the items one line
each) and the spawn paragraph that says "return a catalog, not a paper"; a manifest is deleted in the
merge commit that integrates it, and the 26 integrated ones left (`44090827`). STATUS is a snapshot,
the CHANGELOG holds two entries, the ROADMAP's Now list is one line each, the PRD is eighty lines;
`src/lib/record-depth-policy.test.ts` holds the caps. **`docs-adr-fold`** (merged `d4ec4cff`) read
the 25 architecture decision records against their owning system docs and folded them: roughly thirty
still-true invariants became dateless lines in the doc's own voice, the facts a doc already stated got
no second line, the superseded ones were left to git; `docs/adr/` went whole with the decisions
tombstones, the reel spec (its product shape opens host-app's reel section) and the perf baseline;
one stale claim fell out (the guest email capture had been server-mediated since June while the doc
still called it an anon RPC). The 247 citations in `src/`, `workers/` and `scripts/` name the system
docs now (`aea90fd3`); the migrations keep theirs as immutable history. The `docs-systems-strip` lane
runs next on the four heavy docs.

Machine notes: four agents at once is the ceiling on 36 GB, one process each, a dev server killed by
port; Vercel's daily cap kept the alias on the Library x Lab round's Phase 1 until 2026-09-17 00:13
UTC, so every review ran on a local `pnpm dev`. Gates on the tree at the catalog's merge: typecheck,
lint, 2,213 tests, the build.

## 2026-09-15 to 16 — The Library x Lab round: the lab as an internal app, every board on one kit, every ask in plain words, the first catalog (`2644310d` to `1165e503`)

Will stopped his review of round four before it began: no cross-page navigation, every board a
different presentation, so the work could not be read. He asked for a round that turns the lab into
an internal app: the **Library** (`/design/library`) as the whole working rule set, everything that
influences an agent's design work visible to him, the Orchestrator and new agents, global rules
separated from component-exclusive contracts; the **Lab** (`/design/lab`) as the exploratory surface
with its own kit (a fixed configurator, preview galleries, candidate selection, review questions).
Four decisions at the plan: review notes are copy-as-message only (the UI never writes the repo); the
rulings that lived only in the Orchestrator's memory moved into `docs/design/rulings.md`; the routes
became `/design/library/*` and `/design/lab/*` with every old URL a 307 that keeps the key; the shell,
the kit, the rules layer and the desk came first and the boards migrated in a wave after them.

**Phase 0, the shell** (the Orchestrator, `2644310d`). The route groups (`(shell)/` for every page a
person reads, the iframe scenes outside it); the shell layout building the nav server-side
(`_data/nav.ts` over `_data/catalog.ts`) with the top bar, the sidebar, the content column and the
table-of-contents rail; the page templates (`PageHeader`, `Section`, `Pager`, `Ref` for every
reference the repo writes, `LabLink`, `Tag`, `Callout`, `StatRow`, `WidePage`); repo markdown rendered
in the library from an allow-list (`_data/docs.ts`, `compileMDX`); the board spec type
(`src/components/lab/board-spec.ts`); `docs/design/README.md` (the levels and what binds you) and
`docs/reviews/README.md` (the ledger shape and the message grammar); `pnpm lab:smoke`. The first alias
build showed the gate leaking (a keyless request answered 200 with the nav in the flight payload
because a layout cannot read `searchParams`), so the gate moved into `src/proxy.ts`: a real 404 before
any lab layout renders, the key forwarded as the `x-design-key` request header.

**Phase 1, five tracks on disjoint lanes** (`a76578de`, `0fb9498e`, `e00d3b00`, `4ba890a5`,
`9fcea12d`). `lab-library`: the family pages, the permalink and the home on the shell's templates; a
component page answers what it is for, what it accepts, what it looks like and what binds it (its
contracts, and the ★ landmines of its surface lifted from the system docs); every specimen with
Preview and Code derived from the entry module (`specimens.generated.json`, held fresh by a test);
`new` and `updated` as data on an entry. `lab-rules`: `rules/influences.ts` gives every influence a
level (law, contract, policy, program, guidance, precedent, proposal, ruling, landmine), each defined
once in `docs/design/README.md` and read from there by a test; `bindsFor()` answers what one
exploration obeys; the collector gained `// @policy:` and `// @refuses:` and throws on a directive past
the header window (which surfaced a `@contract-for` that had sat invisible for weeks); `/design/library/rules`
rebuilt around the levels; guidance moved to `docs/design/guidance.md`; `docs/design/library.md`
renders the whole rule set as one greppable file. `lab-kit`: the kit moved to `src/components/lab`
and grew to twenty-two pieces (`BoardPage`, `Frame` as a true-viewport iframe injecting a candidate as
an adopted stylesheet in the frame's own realm, `Compare` with a required "what differs" line, the
specimen furniture, `ApplyToSite`, the walk, the review panel composing one ledger line); a board
became two files, a pure `spec.ts` and a `board.tsx` of evidence, `registry.test.ts` pinning the
density limits; the fourteen landmines the boards had each paid for written once in `traps.ts` and
rendered on `/design/lab/kit`; `pnpm new-board`. `lab-shell`: one URL vocabulary (`_data/state.ts`:
`key`, `canvas`, `ground`, `candidate`, `s`, `session`), the ⌘K index (`_data/search.ts`), the three
faults that hid the table of contents fixed at their source (★ an `xl:` display utility exists only
in the lab and compiles into the losing `utilities.lab` sub-layer, so the shell's layout rules are
plain unlayered CSS in `design.css`), the sidebar a sheet below `lg`. `lab-desk`: `/design/lab` as
Will's queue (every open ask of every board, derived by `review/status.ts` from the specs minus the
ledgers); `?session=<board>.<ask>` as the review session; `scripts/lab-review.mjs` (`pnpm lab:review`)
parsing his pasted line, validating every board, round, ask and option against the spec and appending
to `docs/reviews/<board>.json` all-or-nothing with the line and column of anything refused.

**Phase 2, the migration wave** (nine tracks, `1c0306dd` to `abe45329`). Every standing board moved
onto the kit's template in one wave, nine agents at once, each allowed to edit the three registration
lines for its own board id; the two legacy marketing boards retired unruled and the last `.mono`
override left with them; at the close the shim `src/components/dev/board/`, `variant-frame.tsx`,
`phone-shell.tsx` and `marketing-lab-shared.tsx` were deleted and the discipline test's exemption
list was empty. Per board: `glow-specs` (the two glow boards, one ask each, asked as where the item
closes), `home-hero` (three scattered arguments into one spec; the shipped hero mounted from
production code as the last section), `river-visual` (a Motion knob driving the visual's own `still`
prop; the cost measured in three declared phases), `album-hero` (the no-script question became the
fifth ask; an executable six-step walk), `floating-surfaces` (seven `useState` switches became six
declared controls on the URL; the candidate CSS written into each frame's realm), `brand-voice`
(fifty-two frames each with a true viewport, because a breakpoint prefix inside a div reads the
browser rather than the canvas), `palette` (the live sections became live pages in the kit's `Frame`;
today-beside-the-candidate became a wipe on a slider), `media-kit` (round four's `details` fold gone;
four page-wide switches declared), `type-scale` (the glance tables became `SelectTable`; the settle as
CSS). Findings landed in the kit as they arrived: anchors landing a bar's height too low
(`3fce6c56`), `Compare` splitting on a Tailwind prefix inside a stage (`b85df96e`), the collapsed
paste with no rule (`5959b433`), `lab:review` finding a board at the first brace after `defineBoard`
(`9ab89cdd`). The evening also brought **the storage round**: fourteen handoffs building previews in
one day put deployment storage at 40 GB of the 10 GB month, so an agent branch builds only on
`[preview]`, 103 deployments were deleted, and the launch-prep alias is built once per round close;
and **the CI budget round**: twelve tracks running the remote gate on every push spent the month's
private-repo GitHub Actions minutes in two days, so CI runs on `main` and `launch-prep` code pushes
only, an `lp/*` push only on `[ci]`, and the repo is public for the interim. A machine restart
mid-wave stopped all nine agents; each was resumed by message with its state spelled out.

**Phase 3, the clarity round** (`be1638f2` to `1165e503`). Will's first review through the desk
(the light board) answered three asks (`kit=land`, `infusion=phase-1`, `register=accent`: "Identity
feels way too weak") and stopped at two he could not parse, because an ask was a label ("The aurora's
placement") over bare tokens with the evidence a tab away and labelled in other words. His directive,
verbatim in `docs/design/rulings.md` (2026-09-15): "the more clearly you can ask me questions, the
more easily it is for me to respond", and for every future exploration "a catalog of previews to
select from". The `Ask` shape gained `context`, `look`, `state`, `control` and options as `{id,
label, means}`; `?` became an answer ("not clear to me", stored as a null choice, reported as
`unclear`, flagged on the desk); the light board was rewritten as the exemplar. Eleven tracks then ran
at once from `d5f0c3c9`: nine rewrote their board's asks in plain words with the evidence labelled by
the options' names (`glow-specs` `1244fbd8`, `brand-voice` `80200756`, `rounding` `edb4c732`,
`home-hero` `f438190d`, `media-kit` `7617d6b4`, `album-hero` `63240eac`, `type-scale` `bfab66c1`,
`river-visual` `bea5ace8`, `floating-surfaces` `b9a32cba`; no candidate, number or recommendation
moved on any of them, and every ask and option id stayed so the ledgers still join);
`lab-review-card` (`0829c12d`) moved the answering onto the board (`?session=<board>.<ask>` pins a
review card under the dock: the question, the context, where to look, the options as numbered cards,
the note, "not clear to me", Back and Next across the whole queue; landing on a step applies the
ask's declared state and picking an option previews it through the ask's `control`); `palette`
(`99544a2b`) became the first catalog (twelve finished palettes as cards with their grounds, text
steps, accent and state colours in both modes and the production Card, Button, Input, Badge and menu
at true pixels; picking a card picks the palette everywhere below; eight asks became four). At the
close `PLAIN` (the registry's list of boards still on the string form) was empty. The wave crashed
the machine once (eleven agents' dev servers, builds and tabs took the app to 80 GB on 36 GB of RAM);
nothing was lost, every agent was resumed from its worktree, and the rest ran four at a time with one
process each, which is the ceiling on this machine. Vercel's daily cap refused every `[preview]` push
(the cap counts every path, the GitHub integration included), so the alias serves Phase 1
(`a0ef9867`) until 2026-09-17 00:13 UTC and the reviews run on a local `pnpm dev`. Gates on the
closing tree: typecheck, lint, 2183 tests, the build, 327 smoke checks.
