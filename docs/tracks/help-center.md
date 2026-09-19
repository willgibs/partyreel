---
track: help-center
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: help-center      # round one: where a host or a guest with a problem lands
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - src/app/(marketing)/(cinema)/help/page.tsx
  - src/app/(marketing)/(cinema)/help/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/help/layout.tsx
  - src/lib/content/help.ts
  - src/lib/content/help-search-rank.ts
  - src/components/marketing/help/article-feedback.tsx
  - src/components/marketing/help/checklist.tsx
  - src/components/marketing/help/help-emblems.tsx
  - src/components/marketing/help/help-facts-band.tsx
  - src/components/marketing/help/help-palette.tsx
  - src/components/marketing/reading/article-toc.tsx
  - src/components/marketing/reading/chip-toc.tsx
  - src/components/marketing/mdx/spec-help.tsx
  - src/components/marketing/mdx/spec-shared.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/app/user-menu.tsx
  - src/components/guest/report-dialog.tsx
  - src/lib/constants/marketing-nav.ts
  - content/help/AUTHORING.md
  - content/help/customize-and-share-your-qr.mdx
  - content/help/an-upload-wont-finish.mdx
  - content/help/how-guests-join-and-upload.mdx
  - src/app/(dev)/design/sandbox/contact-page/spec.ts
  - src/app/(dev)/design/sandbox/loose-ends/spec.ts
---

# lp/help-center

**Goal.** Round one of `help-center`: WHERE A HOST OR A GUEST WITH A PROBLEM LANDS, the hub, the article and the way
there from the product, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight
round"): explore every surface, everything unprotected, "at worst, net neutral and fully deleted". Six to eight decisions
with `defineExploration`, each drawn on the REAL help pieces (`PageHero`, the category emblems, `HelpFactsBand`, the
index sheet, the article stage, the "In short" card, `ChipToc` and `ArticleToc`, `Checklist`, `ArticleFeedback`, the
palette with a fixture index) with hand-authored article bodies in the same vocabulary (`Callout`, `Steps`, `Path`,
`UiLabel`, `Checklist`) and literal stand-in numbers, at 1440 and 375, a recommendation each, every number measured
(the hub's height, how far down the first guest door lands); no preview compiles MDX or imports `help.ts`'s
filesystem side. **Not in this round:** any production byte; `/contact` itself and the `?about=` handoff
(`contact-page`, on the desk); the FAQ accordion's look (`loose-ends`); the body ladder (`body-type`); the voice
(`voice`); `/how-it-works` and its pairing with the "How Partyreel works" article (`how-it-works`, a sibling lane).

**What is measured (the tree at the cut).** The hub: a dark `PageHero`, a search trigger, four quick chips, one
guest-voiced line ("Just scanned a QR code? Start with the guest guides"), a strip of ten category emblems (snap-scrolling
at `min-w-[84px]` on a phone, ten columns released on a laptop) straddling into `PaperChapter`, a Start-here trio of
illustrated cards (no real screens), the facts filmstrip (five live numbers from the limits and tiers), the full index
sheet (two columns of ten panes with ghost folio numerals), a dark close band (Contact, a reply line, three links). The
article: a dark stage (a back link, a compact search pill, category and audience badges, the h1, updated and reading
time), an "In short" card straddling the cut (the description, an optional action, plan badges), then paper: `ChipToc` on
a phone, the prose at `max-w-2xl`, `ArticleFeedback`, previous and next, keyword-scored Related, an up-link, a Contact
card; a sticky `ArticleToc` rail from `lg` with a reading spine. Fifty-nine articles in ten categories, 273 to 585 words
(the average 401; the authoring rule says 250 to 500); the audience defaults to host except the guest and troubleshooting
categories, and the default guesses wrong more often than right in two categories. Search is a ranked palette (AND
terms, heading deep links, a "Pages" tail, an empty state of ten chips and Contact) mounted only on `/help` and
`/contact`, its trigger a bare button with no href. NO guest surface links to help (the report dialog, the guest header,
the album page, the entry modal and the password gate: zero hits); the only product link is the host's user menu; a stuck
guest's one exit is Report. Feedback calls no endpoint ("Yes" flips local state, "No" deep-links to contact) so nothing
records which of fifty-nine articles fail. Troubleshooting's eight articles get no "bigger picture" link (no feature, an
audience of both). No help article emits FAQ structured data though each is a clean question-and-answer pair. The pins,
all function: `help.test.ts` (frontmatter, links and anchors resolve, related non-empty), `help-mdx-compile.test.ts`,
`help-ui-labels.test.ts` (every `<UiLabel>` matches a shipped app string: the fidelity guard), `help-slug-pins.test.ts`,
`help-search-rank.test.ts`, `content-policy.test.ts`, `marketing-nav.test.ts`; one look pin allows the troubleshooting
emblem's drawn "?".

**The decisions (suggested; yours to recut, never forced apart).** WHO FIRST (who the hub greets: a host, as today, the
guest line one sentence under a host trio; a guest first, the party being now; two doors at the top, host and guest;
the phone assumed a guest, the laptop a host); THE HUB (staged after WHO FIRST: the index sheet, as today; a few doors
and the search, the sheet gone; a hybrid, doors then the sheet); THE ARTICLE (prose with steps, as today; a checklist
first, the prose beneath; the real screen anchored beside each step, drawn on a shipped surface); FROM THE PRODUCT (no
path for a guest, the host's menu only, as today; a Help entry in the guest's menu and the gate; a contextual link from
the moment of trouble, an error toast opening its own troubleshooting article); FEEDBACK (ephemeral, as today; a counted
beacon; routed and logged the way contact submissions are); THE DEAD END (troubleshooting's missing up-link: blank, as
today; the contact band made explicit; a "bigger picture" rung of its own); SEARCH (the palette on two pages, as today;
sitewide; a visible trigger in the footer and the header's Resources card). Optional if it fits the budget: THE PHONE
(the emblem strip snap-scrolling, as today; a two-row grid; the categories as a list). The FAQ structured data and the
audience heuristic go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; the copy fidelity guard (every `<UiLabel>` in a fixture body must match a shipped string, or the
fixture uses plain words); the boundary rule in `spec-shared.tsx` (`mdxComponents` reaches `node:fs` through `help.ts`:
never import it from a client file; bodies are hand-authored fixtures or one article pre-rendered on the server and
handed down as a node); `ArticleToc`'s scroll spy measures against the live header (draw it settled); the palette
provider is single-instance and reads the router (one per board, tolerant of the lab's router); `Checklist` persists to
localStorage by slug (unique ids per fixture); the cinema rhythm and `PageHero`'s contract; the help how-tos track
shipped reality (a picture of the real screen is a picture of the shipped one); reduced motion honoured; no em-dashes;
the copy is open (bible 21). Mobbin is encouraged, never required: help centres, in-app help, troubleshooting flows.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board help-center` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixture bodies; a capture of every option beside its words, the
  picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The optional eighth decision (THE PHONE) was not asked.** The board read at 370/1200 words with room to spare, but
  the emblem strip's snap-scrolling shape does not change under any of the seven answers, so a eighth ask would have
  been a decision about nothing this round changed. Recommended: skip it; revisit only if a later round touches the
  strip itself.
- **WHO FIRST asks three of the manifest's four suggested shapes, not four.** "A guest first, unconditionally" was
  folded out: it is subsumed by `context`, which already opens guest-voiced on the one surface a guest actually
  meets (a phone, seconds after a scan) without a fourth tile repeating the same picture. Recommended: keep it
  folded; a plain always-guest-voiced hero is a strictly weaker version of the device-implied one.
- **FEEDBACK's recommended `beacon` needs a new table and an admin read**, not proposed as a migration this round
  (lab-only). Recommended: small cost (one insert, one small table, a per-article count somewhere in `/admin`); land
  it with the wiring round.
- **ARTICLE's recommended `screen` is a standing content cost**, not a one-time change: every how-to that adopts it
  wants a maintained illustration per step, and today's fixture only proves the idea on one guest article's three
  steps. Recommended: land the machinery on the lane most helped by it first (setup, QR, sharing) per the option's
  own overrule, and leave troubleshooting on prose.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (a lab-only round; nothing shipped that a system doc's facts would need to track)

## Deferred (ROADMAP one-liners, bucket named)

- Help content: no help article emits `FAQPage` JSON-LD though every one is a clean question-and-answer pair (bucket:
  SEO / content, named by the manifest's own goal regardless of which decision won).
- Help content: the audience default (host, unless `guest-experience` or `troubleshooting`) guesses wrong more often
  than right in two categories per the tree at the cut; worth a per-article pass (bucket: content quality).

## Handoff (replaces the chat report)

- Head `6d297151`, pushed; synced with launch-prep at `9f976f7c` (fast-forward, `docs/tracks/orchestrator.md` only,
  no conflict)
- Gates on the synced tree: typecheck ok, lint ok (the 8 known warnings, 0 new), test ok (2533), build ok (254
  pages); `pnpm design:rules` regenerated `docs/design/library.md`; `pnpm lab:smoke --base http://localhost:3136` ok
  (372 checks, 0 failing, help-center 370/1200 words); `pnpm lab:demo --board help-center --base
  http://localhost:3136` ok (7 steps, 0 failing, no CLIPPED, no UNLABELLED, no NO DOCK, no same-picture pairs)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/help-center/*` (owned)
  + the registration exception (`sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`) + `docs/design/library.md`
  (generated, `pnpm design:rules`) + this manifest; nothing else
- The decisions, one line each:
  - `who-first`: who the hub's hero greets first; the host as today, two doors side by side, or the device implies
    it; recommended **the device implies it** (a phone opens guest-voiced, a laptop host-voiced, no toggle)
  - `hub`: whether the full index sheet survives below the hero; as today, a few doors with the sheet gone, or doors
    then the sheet; recommended **doors, then the sheet** (a lighter first screen, the real index kept lower)
  - `article`: whether a how-to leans on prose, a checklist, or the real screen beside each step; recommended **the
    real screen beside each step** (closes the gap between a quoted control and the screen it lives on)
  - `from-product`: how a guest reaches help from inside the product; nothing as today, a Help entry in the guest's
    menu, or a link at the moment of trouble; recommended **a link at the moment of trouble** (a failed tile or a
    wrong password carries its own link to the matching fix)
  - `feedback`: whether "Did this answer your question?" goes anywhere; ephemeral as today, a counted beacon, or
    routed and logged; recommended **a counted beacon** (cheap enough to ship without turning every miss into a
    ticket)
  - `dead-end`: what a troubleshooting article does with no bigger picture to point to; nothing as today, the
    Contact band made explicit, or a rung of its own; recommended **a rung of its own** (the calm version of the
    same act, one article away)
  - `search`: how far the help search palette reaches; local as today, sitewide, or a visible trigger kept local;
    recommended **a visible trigger, kept local** (the footer's Resources column and the header panel each gain a
    plain Search row; the provider stays where its index is actually complete)
- Assets requested from Will: none. The `article.screen` option's three step illustrations are hand-built from real
  primitives (`Button`, `CategoryEmblem`) rather than requested art; a wiring round that adopts it is the point to ask
  for real per-step screenshots of the shipped surfaces.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: `who-first` (it stages `hub`, and the device-implied recommendation is the round's least expected
  answer), then `article` (the screen option is the one bible-backed by the how-tos-track-shipped-reality rule)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `help-center` asked seven decisions on the real help
pieces (`PageHero`, the category emblems, the index sheet, `ChipToc`/`ArticleToc`, `Checklist`, `ArticleFeedback`,
`ReportDialog`, the search palette) with hand-authored fixture bodies for three real articles, at 1440 and 375:
who the hub greets first (recommended: the device implies it), whether the index sheet survives (doors, then the
sheet), whether a how-to shows the real screen beside each step (yes), how a guest reaches help from the product (a
link at the moment of trouble), whether feedback is recorded (a counted beacon), troubleshooting's dead end (a rung
of its own), and search's reach (a visible trigger, kept local). Two clipping bugs (`hub.hybrid`, `article.screen`)
were found and fixed by measuring real rendered iframe heights rather than guessing them. Two ROADMAP one-liners
carried to Deferred: the missing `FAQPage` JSON-LD and the audience-default miss rate.
