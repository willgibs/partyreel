---
track: home-hero
status: integrated
cut: "260c015"       # the launch-prep SHA the branch was cut from (docs: record MILESTONE-24)
merged: "393bacc"      # the branch head merged into launch-prep
preview: true           # Will's review surface: every push builds partyreel-git-lp-home-hero
owns:
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/app/(dev)/design/sandbox/
  - src/app/(dev)/design/c/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
reads:
  - src/components/marketing/system/page-hero.tsx
  - src/app/globals.css
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-voice.ts
---

# lp/home-hero

**Goal.** The full home hero redesign, as its own focus round (Will, 2026-09-01: "I'd love a full
home hero redesign"; 2026-09-11 and 2026-09-12: its own agent round, cut alongside `design-gallery`).
A design problem, not a lighting one: boards in the lab first (a `home-hero` ruling with a `board` in
`touchpoints.ts`, its variants under `sandbox/`, dispatched from `c/[touchpoint]/page.tsx`), Will's
rulings on the boards, then the wiring into `cinema-hero.tsx`. Take the big swing: a totally
different, better hero beats a safe increment, and the only law is the bible plus the hero's
contracts (`page-hero-contract.test.ts`, `marketing-h1-policy.test.ts`: the h1 on the ladder, never
gated, at paint).

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's). The hero stays UNLIT until a
board rules otherwise (the wall is the ground, not a source). The thesis line and the primary CTA are
ruled copy (`marketing-voice.ts`); the two provisional home headers stay provisional. Boards leave the
sandbox when their ruling lands; the record goes to `docs/decisions/design-record.md`.

**Verify on.** partyreel-git-lp-home-hero-partyreel.vercel.app: the boards on `/design/c/home-hero?key=`,
then the home at 1440 and 375 with the h1 at opacity 1 at paint, reduced motion included.

**Lane exception, ruled.** `src/app/(dev)/design/rules/rules.generated.json` is generated: a push that
adds a specimen, a component file or a contract regenerates it with `pnpm design:rules` (the
freshness guard says so) and the lane check accepts the file.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. No `docs/systems/*.md` line changed: nothing shipped to a production surface, so no
  current-truth fact moved. The hero's own facts change with the wiring, after Will rules.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing overhaul: wire the ruled home hero into `cinema-hero.tsx`, retire the board, and record
  the ruling in `docs/decisions/design-record.md#home-hero` (the board and its four variants stand
  in `sandbox/` until then).
- Marketing overhaul: the kinetic word in the home h1, keep or retire. The board runs both; every
  variant reads better with it off, because the variety the word carried is carried by the
  photographs now. It rides the hero ruling.
- Marketing overhaul: if the hero ruling is V3 (the arrival), the live-demo section at position 7 of
  the home arc needs its own round, since the two would say the same thing in one chapter.

## Handoff (replaces the chat report)

- Head: the tip of `lp/home-hero`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `05f8642`, which is what the preview alias was verified at. Pushed; preview
  `https://partyreel-git-lp-home-hero-partyreel.vercel.app`.
  **The board: `/design/c/home-hero?key=` (the sidebar's Sandbox zone picked it up on its own,
  since `catalog.ts` derives that list from `SANDBOX`).**
- Synced with launch-prep: **not needed**, it had not moved (`git rev-list --count
  HEAD..origin/launch-prep` = 0 at handoff).
- Gates: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing ones on
  `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`), test ok (1622 in 189
  files), build ok (245 static pages, the launch-prep count unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/home-hero.md`, `docs/decisions/design-record.md`,
  `src/app/(dev)/design/c/[touchpoint]/page.tsx`,
  `src/app/(dev)/design/sandbox/home-hero-lab.css`,
  `src/app/(dev)/design/sandbox/home-hero-variants.tsx`,
  `src/app/(dev)/design/touchpoints.test.ts`, `src/app/(dev)/design/touchpoints.ts`.
  **Two exceptions, both claimed rather than sneaked.** `touchpoints.test.ts` pins the exact set of
  standing boards, so a fifth board cannot be added without it; it is the test for a file this track
  owns, nobody else claims it, and it is now in `owns`. `docs/decisions/design-record.md` is
  unclaimed by any track and its own contract says the standing boards are listed there with
  `ruled: open`; the board page prints `design-record.md#home-hero` as its pointer, so an entry-less
  anchor would have been a broken link on the surface Will reviews. The edit is one new section, one
  index row, and one word in the header blockquote ("the four standing boards" to "the standing
  boards", which this change made stale).
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed:
  `cinema-hero.tsx` is untouched by design, because the brief is to wire only what Will rules.
- **Verified on the preview at `05f8642`** (the alias was polled until it served that build, proven
  by a marker in the HTML rather than by the clock):
  - The gate: `/design/c/home-hero` 404 with no key and 404 with a wrong key, 200 with the key; the
    four pre-existing boards still 200; an unknown board 404.
  - **The measurement that is the whole argument**, taken in the browser on the preview over each
    stage (absolutely-positioned layers over 200x200 that paint anything over a photograph, counted
    colour-agnostically because Tailwind v4 emits `oklab()` and an `rgba()` regex undercounts):
    V1 8 photographs / 8 eager / **0 darkening layers**; V2 30 images, 15 of them the seam duplicate
    / 15 eager / **0**; V3 18 / 18 eager / **0**; V4 13 / the frame eager, the 12 strip thumbs lazy
    / **0**. The shipped hero rendered beside them from production code: **3** (`bg-black/35`, the
    three-stop `from-black/90` ramp, the radial vignette), plus a fourth below `sm`, and 7 of its 25
    images eager.
  - The h1s: all four variants and the reference at `opacity: 1`, `transform: none`, no
    `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line`, straight off the server HTML as well as
    computed. Resolved to `text-7xl` on the 1440 canvas.
  - Reduced motion, read off the PRODUCTION-BUILT stylesheet rather than the source: every rule
    carrying a `data-hh-*` selector sits inside one `@media (prefers-reduced-motion: no-preference)`
    block, and nothing rests hidden. The JS beats gate on `usePrefersReducedMotion` as well (the
    album starts full, the count starts at its final value, no chips, no cut).
  - The home at 1440: h1 `opacity: 1`, 96px, `transform: none`, no horizontal overflow
    (`scrollWidth` 1440 = `clientWidth`). At 375: `opacity: 1`, 48px, no overflow. Console clean, no
    errors. It is unchanged, as intended.
  - The board at 375: no horizontal overflow, the desktop canvas zooms down to fit, the phone canvas
    sits at 1:1.
  - ★ **One reading that is the tooling, not the product:** `[data-hh-col]` reports
    `animationPlayState: "paused"` on the preview because the Browser pane's tab is hidden
    (`document.hidden === true`) and the board honours that. Measured running with live transforms
    on localhost with the tab in front. This is the documented Chrome-MCP blind spot; do not "fix"
    the drift on the strength of a paused reading.
- **Look at first:** the board at 1440, the Desktop toggle, scrolling from V1 to "Today, for
  reference" at the bottom. The whole case is in that scroll: four heroes whose photographs you can
  actually see, then the shipped one. Then the Phone 375 toggle, then the Kinetic word toggle.
- **The recommendation, if you want it before the boards: V1, the contact sheet**, with V2 the safer
  second. V1 is the only one that solves the problem structurally rather than by partition, and the
  only one whose composition IS the thesis (the promise is a page in the album, on the album's own
  grid lines). V4 is the most beautiful frame and the weakest argument, because one photograph is
  not an album. V3 makes the strongest argument and costs the most: it does what the live demo
  already does at position 7. If V1 wins, the second round worth taking is V1's sheet FILLING rather
  than developing, which is V3's beat on V1's composition.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-12). The home hero round opened with a board, not a
build. The finding is the board: the shipped hero carries three darkening layers over its wall of 24
tiles at desktop and a fourth below `sm`, because white type had to survive over whichever tile the
55-second drift parked under it, so bible rule 1 is inverted and not one photograph reads as a
photograph. That turns the hero into one design question, WHERE DOES THE TYPE LIVE so no photograph
is ever dimmed, and `/design/c/home-hero` answers it four ways: the type as a cell in the album's own
grid, as its own column against a hard frame edge, as a band over an album that fills guest by guest
with the count climbing, and as a small opaque title card on one photograph that owns the screen. The
four stages carry zero darkening layers over media between them, measured on the preview against
three on the shipped hero rendered beside them from production code, and all four show fewer, bigger
photographs (8 to 18, not 24 thumbnails). The ruled copy renders verbatim, the h1 is never gated and
at `opacity: 1` at paint in all four, and the hero stays cinema and unlit. Two lab-fidelity findings
came out of building it and are worth keeping: a board that shows two viewport sizes on one page
cannot use Tailwind's responsive ramps, because a breakpoint keys off the reviewer's own window and
not the stage, so the canvases are real viewport pixels fitted with `zoom` and the ladder is resolved
per canvas; and a board that proposes a hero has to propose its LOADING too, since four of V1's
frames, two thirds of V2's and most of V3's album were lazy inside a hero, which is the exact defect
the /careers round measured on production. No production byte changed: `cinema-hero.tsx` is
untouched, and the wiring waits on Will's ruling. The agent's recommendation is V1, with V2 second.
