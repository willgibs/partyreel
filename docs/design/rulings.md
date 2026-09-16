# Will's rulings, verbatim

> **ROLE:** the dated record of every directive of Will's that shapes design work, whether or not it
> became a bible rule. **BELONGS HERE:** the quote (a paraphrase is marked as one), the date, and
> what it became. **NOT HERE:** the rule's text (the bible), how to apply it (`guidance.md`,
> `docs/PROGRAM.md`). **GROWS BY:** the Orchestrator appends a section from a review message or from
> chat; a section is never rewritten, only superseded by a later one that says so. Never owned by a
> track. Rendered in the Library at `/design/library/rulings`; until 2026-09-15 these lived only in
> the Orchestrator's memory files, invisible to agents in worktrees.

## 2026-09-16 · the home hero is the source, centred, without the count; the stream wants polish

**Became:** `docs/reviews/home-hero.json` round 5 (`direction=source`, `headline=ruled`,
`lockup=centred`, `count=cut`); the hero's wiring round; the lit surface and the publish beat's colour
close on the light board (`docs/reviews/glow-doctrine.json`, `glow-moments.json`: both `light`).

Verbatim, on the direction: "The album coming out of the code definitely looks best. However, I think
we can improve this visual a lot. The random stream feels worse than a more polished one."

## 2026-09-16 · a track returns a catalog to rule on item by item; the Library owns every design fact; history is the last two rounds

**Became:** the revamp (four rounds: the lab, the docs diet and the track protocol, the Library as
the complete inventory, the six paper boards rebuilt as catalogs); `docs/PROGRAM.md` "The round", "A
round returns a catalog", "Every round gets Will's notes" and "The record's depth"; `ITEM_VERDICTS`
(`keep | refine | kill`) and `LIBRARY_VERDICTS` (`keep | redesign | retire`) in
`src/components/lab/board-spec.ts` and the review grammar's item scope (`item:<id>=<verdict> "note"`);
the one-round manifest template and the spawn paragraph in `docs/tracks/README.md`; CLAUDE.md "Keeping
the docs healthy" ("nothing under `docs/` is history") and `src/lib/record-depth-policy.test.ts`; the
`lab-catalog`, `lab-sweep` and `docs-adr-fold` lanes.

On the lab, verbatim: "The lab UI is super broken, at least on localhost." The full menu open at the
top of every page and not collapsible; "On this page" a weird section at the top; 1:1 previews with
left padding overflowing to the right ("use the full window first"); the page-wide configs not
sticky; "I can't unpick a selection to return to a non-selected state." "This in no way reflects the
full list of errors. It's just what I could spot during a quick look. If you find more while addressing
these, please attempt to fix as well." (The layout faults were a browser holding an old copy of the
lab's stylesheet; the unpick and the 1:1 gutter were real.)

On the explorations, verbatim: the tracks "are turning into massively over-engineered pages"; what he
wanted was "design catalogs of ideas to ship in the lab", from which he can kill, refine, or "promote
the best to the Library"; the spill placements board "is a decent example". Brand-voice should have
been "a couple dozen spot examples across the marketing site and app", where he can "compare 2 brand
voices in usage side by side" with "a config to choose which 2, then select my winner"; type-scale "a
few different scales side by side" on real UI, no variable lists. Agents that ran two and three rounds
without his notes "made research papers out of their first round's work". "Gallery view by default,
notes per item"; where a gallery does not fit, the agent builds the best presentation for the
question. The Lab's tooling is built progressively: "GUIs, configs, previews, iFrames, questions,
information callouts, galleries, accordions... think dynamic docs."

On the record, verbatim: "we're over-indexing the importance of archival documentation"; the Library
owns all design information (the preview, the variants, the unique rules, the tokens): "If it exists
in our UI design, it exists here with nothing slipping by... The idea of a 'history' is unimportant";
docs handle "anything active" (workflows, database, agent init, systems, sitemaps, roadmap) with
history "highly limited to very recent work"; "revamp all of our working systems from the ground up";
"I'd like this to be the change that lets us breeze through future marketing and app rounds."

His answers to the plan's questions (paraphrase): a review is notes AND a keep / refine / kill
verdict per item, with asks only for what is not one item; history is the current round and the one
before; the Library covers components, marketing sections and app screens, each with a live preview,
plus tokens; all six paper boards are rebuilt as catalogs before his next review; the palette catalog
is walked first.

## 2026-09-15 · a question carries its context; an exploration is a catalog

**Became:** the ask shape (`src/components/lab/board-spec.ts`: a real question, its context, where to
look, options labelled in words with what each means, the dock state that shows it); the `?` answer
("not clear to me") in the review grammar; the review card on the board; `guidance.md#boards-the-
review-surface`; PROGRAM.md "Exploration rounds are light and iterative"; the palette board rebuilt as
the first catalog.

On his first review through the desk (the light board; three asks answered, two marked not clear):

> "I made it through these, but honestly, it was tough to understand what I was being asked for most
> of those questions already... Remember that the more clearly you can ask me questions, the more
> easily it is for me to respond."
>
> "Each exploration page feels like a small research paper into its track, so when you use very
> technical terms or nicknames from spots in these 'reports', it makes me have to go deep into the
> track to gain the relevant context and even begin understanding the question being asked. Having
> the link helps a bit, but framing the context more with the question would help a ton."
>
> "That's also a helpful note for future agents we spawn: our goal is to get creative while designing
> to find a combination of intuitive content flow/layouts and engaging visuals. When we're exploring,
> the goal is to get a few of our best concepts created for review, pick the best direction and refine
> for production polish. Simply designing a few (or many, complexity and context dependent)
> variations will always beat a mountain of 'research text'. Prime example: for the new palette
> exploration, it almost feels like I'm reading a PhD on color theory. We're simply exploring new
> color palettes - having a dozen polished variants with preview palettes with some demo UI to config
> & compare would've been far more helpful than this massive mountain we've created. Then I end up
> with six configs that aren't clearly explained. I have to toggle around the page to see what they
> impact. Building future explorations almost as a catalog of previews to select from would be much
> faster, and likely more lightweight and streamlined on your side to simply design beautiful
> components and organisms."

On the two he could not answer: "Am I being asked what aurora placement within the footer? Or what
aurora replacement looks better in general?" and "Hard to visibly tell what Family and Lift are from
the previews." The ruling on the light board's register the same night: "Identity feels way too
weak. Let's use accent as the global register, and we can modify it as needed in the future if it
feels too strong."

## 2026-09-15 · the lab is an internal app; the library is the whole rule set

**Became:** the Library x Lab round (this shell, the kit, the rule layer, the desk); `README.md`.

> "I think we need a dedicated round of library and lab UI work to make nav and presentation
> better before I can review the track work itself. For example, there's no cross-page navigation,
> each page's presentation can be super messy so it's hard for me to understand the work."
>
> "Think of this as building our own internal app to manage our design system, exploratory lab work
> that gets merged in. Remember, the goal is for the library to represent our entire working rule
> set so that everything influencing new agents' design work is visible to both me as a human, you
> as an orchestrator, and new agents. This removes any hidden influences from my sight, and
> separates global rules from component-exclusive (which helps minimize working rules agents need
> to follow in their explorations). The lab should be configured to support exploratory work, and
> may include its own UI library to support those explorations, such as the fixed/sticky GUI,
> config tools, preview galleries, variant selection, human vs ai notes, review questions, etc."

Decisions the same day: the review panel composes a message rather than writing the repo; these
rulings move into the repo; the routes rename to Library and Lab and the lab's separate token set
retires; the boards migrate in a wave after the shell, the kit, the rule layer and the desk land.

## 2026-09-15 · agent pushes do not run CI

**Became:** `.github/workflows/ci.yml`, `scripts/vercel-ignore-build.mjs`, CLAUDE.md "Git".

> "We've reached our GitHub Actions budget for the month. Burned through it massively the last
> couple of days with the sub-agents... I'd like to adjust our agent strategy moving forward so that
> we don't have single days that burn entire monthly GitHub action budgets again. Every single commit
> does not need a full CI/CD deployment, especially when it's UI heavy with minimal risk."

## 2026-09-15 · the review surface

**Became:** `guidance.md#boards-the-review-surface`; the board dock and 1:1 stages; PROGRAM.md's
"the app's UI is open".

> "For any pagewide configs, the GUI control should be fixed so that variants can be toggled on
> different previews anywhere on the page for better back-and-forth comparisons. Having to scroll
> back to the top (such as for palette) makes it very hard to review differences."
>
> "The iFrame previews throw off anything related to size, making those reviews particularly
> difficult (such as type scale - the whole point is reviewing accurate sizing). This needs to be
> fixed for pixel-perfect lab demos/previews, whether it's working off of the iframes or something
> new."
>
> "I'd love to see more UI examples for comparison, especially if they can be live production
> components using the demo palettes."
>
> "We can choose dark and light separately, don't have to be a package deal. Dark will apply to
> marketing and app, light applies to paper in marketing and light mode in app."
>
> "Overall, I don't really love our app design in general, dropdown/nested menus included. The app
> is functionally great, but UI design lags far behind the design work we've been doing for the
> marketing site... any UI that touches App in an active lab track may be worked on before the
> dedicated app agents get to it later."
>
> On a voice board: "any examples should actually show the distinction (can include similarities as
> well)"; on a light board: "this currently feels more like a fun research report without many
> applicable takeaways to carry into the platform."

## 2026-09-14 · rising tides, from the ground up

**Became:** bible 22 (`rising-tides`); PROGRAM.md "Rising tides"; CLAUDE.md's Build step.

Paraphrase of the ruling, which rejected a "bar" rule an agent had drafted from Will's own example:
there should not be a "bar" rule at all; the rule is the Rising Tides policy, enforced. No agent
can know the finished design bar in advance ("else you'd build it in one round"), so the goal is a
better and better iterative flow that funnels into a progressive bar we keep shaping. The core value
is high-agency decision-making per element: every section, component, flow and line is unprotected;
an agent asks "if this didn't exist yet, what would the perfect version be?", then builds that: if
the existing work points there, elevate; if the ideal deviates, rework entirely; lots of room in the
middle. Agents are empowered to push beyond the existing systems, components and rules to set new
peak standards. A binary of "always rework" or "always elevate slightly" produces either big progress
that loses what we like or so little risk that no progress is felt. When Will gives an example, it is
an illustration of the principle, never the rule's text.

## 2026-09-14 · unlimited design resources; light QA in exploration; nothing is protected

**Became:** PROGRAM.md (Program principles, hard gate 1); CLAUDE.md's Build step and the red-team
carve-out; the manifest template's "Assets requested from Will" line; `docs/ASSETS.md`.

> "New standing policy globally should be to design assuming you have unlimited design resources to
> support, and simply request anything needed to support; this can be incredibly specific: a row of
> themed event card images, a party video of fast paced highlight clips, inspiration images for a
> new/updated section, etc."
>
> "Since we're not messing with real functionality, testing and QA can be light, and we can red team
> more deeply on completion, since UI exploration should be more iterative rather than thorough per
> round which wastes time for iterative cycles."
>
> "We've established a few nearly production-grade elements so far, but the majority of the site
> lags far behind, and nothing should feel protected as we progress."

## 2026-09-14 · the bible's second edition

**Became:** `src/app/(dev)/design/rules/bible.ts` (nine rules rewritten, each with a status);
mono retired (bible 7 is the two-faces rule); copy opened (bible 21).

Paraphrase: Will reviewed the 22 rules line by line. Media stays the loudest thing and the interface
muted, but a section without media must still be beautiful (the accent and the aurora carry colour
where there is no media); marketing may be louder than the app in most aspects, only the token set is
shared by law; mono leaves entirely; copy is unprotected; shadows are allowed in dark where objects
stack; lamps may light a section without media (the footer is the model); the grounds are four, with
the muted panel the set-apart block; the "bar" rule is rising tides.

## 2026-09-12 · less is more: the bible plus the contracts is the whole design law

**Became:** the 22-rule bible on `/design/library/rules`; `@contract-for` tests; CLAUDE.md's
"the design law is short on purpose"; the ★ convention (a landmine, never a decision).

Paraphrase of the ruling, on seeing a first bible of 433 rules: a short global bible of
visual-identity rules, hand-authored and ratified by him, plus each component's functional contract,
is the whole design law; everything else on the site is precedent an agent may break. His diagnosis:
rules that were his one-off revision notes got logged as permanent law, and agents referencing 400+
rules produced "incredibly repetitive" designs or "very minor upgrades rather than taking big
swings"; docs and rules had created "a fear in new agents where it feels safer to aim small". He
wants big swings toward production-grade fidelity, prototyped in the lab first. No copy is pinned by
a test (his own byte-pinned lines included); a contract never freezes a look; a ★ marks a silent
breakage on revert and nothing else; his human review is parked until the UI era lands unless
something blocks or is high-leverage.

## 2026-09-11 · the library is what agents pull from; the lab is temporary

**Became:** the Library and Lab areas; `docs/ROADMAP.md` "the design lab on its own subdomain".

Paraphrase: the design library (`/design`) is what agents pull from; the lab is a temporary
exploratory surface. He wants the lab "closely tied and unified with the marketing site and app for
the agents to continually learn from and upgrade", which argues for one repository and, later, a
second deployment of the same code.

## 2026-09-01 · rules are provisional

**Became:** PROGRAM.md "★ RULES ARE PROVISIONAL TOO"; the health strip on the library home.

Paraphrase: most of the laws, doctrines, don't-revert notes and policy tests in the repo were
written by agents to keep themselves consistent, against a design system that has since moved; they
are not his rulings. The test to apply, in his words:

> "Is this a good rule that prevents bad choices, or is this a bad system that prevents good
> choices?"

Every round audits the rules it touches, keeps the ones encoding a real scar, reshapes the ones whose
reason expired, and says which it did and why in the commit.

## 2026-09-01 · chapters open strong

**Became:** bible 17 (`chapters-open-strong`); `docs/systems/design-system.md#chapters-the-attention-arc`.

The ruling as recorded in the system doc: a chapter is a pacing principle, not a component; the
first section of a chapter opens with a bespoke device (a heading a tier up, a film-cut entrance,
air, a straddling object, a drawn rule, a lit subject, a full-bleed frame) and the rest of the
chapter runs on the utility rhythm.

## 2026-08-27 · focused rounds, prototype first

**Became:** PROGRAM.md's round definitions; the lab as the iteration surface; the "would this hold up
next to the homepage?" screenshot gate in `guidance.md`.

> "Would it be more helpful to deep think with multiple dedicated plan rounds (like UI, theming,
> shuffling, generation, encoding) which may be better than a single huge pass over a massive single
> plan."

Paraphrase of the lesson behind it: reel generation shipped "zero design magic" despite ambitious
planning because the magic was never prototyped; the help centre later shipped "incredibly bland and
completely paper... best case, initial wireframes" because it was built in one pass while the home
page got screenshot-and-iterate loops. Creative and UI work is prototyped in the lab, reacted to,
tuned, then wired; every new page ends at the screenshot gate beside the home page.

## 2026-06-20 · action colours are universal

**Became:** the per-action colour system in `globals.css` (like, save, hide, approve, delete, reel);
`docs/systems/design-system.md#the-identity-achromatic-media-is-the-color`.

Paraphrase, correcting a "guest viewer unchanged" translation artifact: one colour per action
everywhere it appears, guest and host alike; the only guest/host difference is the action set, never
the colours, because colour clarity helps every user read state.

## 2026-05-31 · craft is the differentiator; guest pages are the host's

**Became:** `guidance.md` (the emil skill is primary); bible 4 (`guest-surface-is-the-host`);
`docs/systems/design-system.md#the-craft-guidance-stack`.

Paraphrase: Will installed the `emil-design-eng` skill himself and asked that it be followed on
craft-heavy UI (custom easing curves, motion under 300 ms, press feedback, GPU-only transforms,
entrances via `@starting-style`, staggers, reduced-motion safety); "taste is the differentiator".
Guest-facing pages are the host's event, not a Partyreel ad: formal, minimally branded, premium and
non-intrusive.

## 2026-05 · one brand, two volumes; media is the colour

**Became:** bible 1 (`media-is-the-color`), bible 2 (`one-token-set`); the achromatic identity
(zero brand hue since the V1 rebuild).

Paraphrase: the marketing site and the host app are one brand on one shared core design system;
marketing may run louder to attract users, but louder means bolder type, richer media frames and
more motion, never a wider palette; the chrome stays achromatic so the photographs and videos take
the stage. Marketing visuals are media-ready frames (a browser window, a phone screen, a gallery
grid, a QR card, a reel player) built so real media drops in without a layout change.

## 2026-05 · no em-dashes in copy

**Became:** bible 19 (`no-em-dashes`); `src/lib/no-em-dash-policy.test.ts`; CLAUDE.md "Copy".

Paraphrase: the long dash reads as an "AI copy" tell; recast with a comma, parentheses, a colon or
two sentences. A forward policy on user-facing copy, not a blind retroactive find-and-replace.
