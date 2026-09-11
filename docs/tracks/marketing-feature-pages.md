---
track: marketing-feature-pages
status: integrated
merged: "0f52503"      # the branch head merged into launch-prep
cut: "7a189ae"
preview: true
owns:
  - src/app/(marketing)/(cinema)/events/
  - src/app/(marketing)/(cinema)/features/
  - src/app/(marketing)/(cinema)/how-it-works/
  - src/app/(marketing)/(cinema)/pricing/
  - src/app/(marketing)/marketing-h1-policy.test.ts
  - src/components/marketing/sections/features/
  - src/components/marketing/sections/reel/reel-hero.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/page-hero-contract.test.ts
  - src/components/marketing/system/screen-lamp.tsx
  - src/components/marketing/system/screen-lamp.test.ts
  - src/lib/constants/feature-pages.ts
  - src/lib/constants/feature-pages.test.ts
reads:
  - src/lib/constants/marketing-voice.ts
  - src/components/marketing/system/section-shell.tsx
---

# lp/marketing-feature-pages

**Goal.** The feature pages and their hub rewritten as one voice on the rising-tides posture:
the six feature pages, the hub, /how-it-works, /events and /pricing, their sections, the shared
feature furniture (door, FAQ, GoDeeper, related), `PageHero` gaining its two entrance registers
and a stage slot, and the h1 LCP hole closed on the heroes that carried a data-attribute gate.
Will's own track, spawned 2026-09-01, before this manifest model existed.

**Rulings in force.** The 2026-08-28 posture ruling (incumbents named, QR rivals category-level);
the hero rule of 2026-09-02: no single templated hero, few named entrance registers, no unnamed
minor variants. Added on this branch by Will, page by page (all binding on the tracks that follow):
the hub H1 is "The full media kit for any event"; copy is PUNCHY (subheads two rows at most on
desktop; a card's line two rows, width-constrained, in a quieter colour; balanced breaks); every
multi-item list is visually balanced (siblings on the same number of rows, held by a length band and
spread in a test); NO monospace anywhere except where it aids a tabular layout ("Partyreel is a
consumer product, not a devtool"); one eyebrow label per hero (never the "Features ·" breadcrumb
half); every section finished in its own register, bold or simply elegant, never templated (the
icon-square claim row is the named failure); a plans chart never opens a cinema chapter; a page is
designed from a first-time host's QUESTIONS outward, with light tie-ins to its neighbours so a
visitor landing there first is never lost; the ambient pieces get Will's ten-second eye because
neither browser tool can run them.

**Verify on.** partyreel-git-lp-marketing-feature-pages-partyreel.vercel.app: the feature pages,
the hub, /how-it-works, /events, /pricing at 1440 and 375.

## Where the work stands at handoff (2026-09-11)

Not complete, by design: Will stopped the round here so the remaining pages can be worked
INDIVIDUALLY, one track each, off the merged tree. Done to his review bar: **the hub** (`/features`,
three rounds of his notes) and **`/features/album`** (two ground-up rounds and a finish pass; the
model for the others). Carrying the shared furniture and the first round's pacing but NOT their
own ground-up round: `/features/qr`, `/features/curation`, `/features/sharing`,
`/features/guests`, `/features/privacy`. Also on the branch: `PageHero`'s two entrances and stage
slot, `ScreenLamp`, `FeatureDoor`, the shared FAQ / GoDeeper / related band, the h1 policy scan,
and the h1 gate lifted on /pricing, /reel and /events/[slug].

## For the per-page tracks that follow (read this before booting)

- **Claim exactly your page.** `owns:` = `src/app/(marketing)/(cinema)/features/<page>/` and
  `src/components/marketing/sections/features/<page>/`. Put under `reads:` (never claim) the
  shared pieces: `src/lib/constants/feature-pages.ts` (the identity registry: your page's `h1`,
  `heroSub`, `directoryLine`; propose the new strings in your Handoff, or claim the file only if no
  sibling page track is live), `src/components/marketing/sections/features/shared/`
  (`feature-door.tsx`, `related-features.tsx`, `feature-faq.tsx`, `go-deeper.tsx`,
  `feature-hero-eyebrow.tsx`, `ghost-grid.tsx`, `text-swap.tsx`), `src/components/marketing/system/`
  (`page-hero.tsx`, `screen-lamp.tsx`, `section-shell.tsx`, `stat-band.tsx`, `reveal.tsx`,
  `media-split.tsx`), `src/components/marketing/frames/` (`PhoneShell`, `BrowserFrame`), and
  `src/components/marketing/mock-parity.test.ts` (append your pins under a `// <page>` comment so
  parallel appends merge). Five tracks editing the registry at once is the one foreseeable
  conflict; page by page (Will's stated order: qr, curation, sharing, guests, privacy) avoids it.
- **The album is the model, section for section.** Read `docs/systems/marketing-content.md` "THE
  FEATURE FAMILY" and the album folder before writing a plan. The mechanisms to reuse: the copy as
  SETS in a pure `<page>-copy.ts` held by a `<page>-copy.test.ts` band + spread (the hub's
  `directoryLine` mechanism); verdict-first FAQ answers (`<page>-faq.ts`, rendered by the shared
  `FeatureFaq`); every app string quoted verbatim and pinned in `mock-parity.test.ts`; every number
  DERIVED from `tiers.ts`, `limits.ts`, `gallery-access.ts`, the lifecycle constants
  (`over-cap.ts`, `inactivity.ts`, `recently-deleted.ts`); the real control shapes drawn (the
  switch, the select, the pill, the toast) rather than icon-square bullets; one lamp per page in the
  hero (`ScreenLamp` under the stage; the section `overflow-x-clip`), the footer seam, nothing
  between (curation and privacy carry NO lamp, on purpose); ONE `Reveal` per section with the body
  continuing the header's slots; `text-balance` on centred copy, `text-pretty` on bodies.
- **Three fact sheets before the IA** (what the album round did, and what caught its errors): the
  system docs, the host-side code, the guest-side code for your feature; then a fresh reader's
  question list to stress-test the section order. The album's corrections that MUST hold on every
  page: Require accounts defaults ON for a new event (never "no account by default"); anonymous is
  Anonymous (no name field exists); a guest deletes their own upload from their dashboard; a
  private page shows no name and no count; no big-screen mode exists (the album in any browser is
  the claim); nothing is locked or hidden at lapse; the EXIF strip is "for the common formats".
- **What each page has today, and the questions its round answers.**
  - `/qr`: the bespoke hero (`qr-hero.tsx`, the plate switching on, the page's one lamp),
    `entry-flow.tsx`, `print-shop.tsx` (the print stock straddling the cut), the shared close.
    Questions: what is on the code, can I style it (`resolveQrPreset`, the presets), print sizes
    and the table card, does the code ever change, the named link (Pro and Event Pass), what a guest
    sees the moment it is scanned (the album's getting-in stage tells the short version; this page
    owns the long one), what if a guest cannot scan.
  - `/curation`: `review-queue-demo.tsx`, `review-modes.tsx` (Live | Review, which the album's
    switch quotes), the plain hero by design. Questions: can I approve before anyone sees, bulk
    approve and select, hide vs delete vs the bin, what guests see while something waits ("Sent,
    waiting for host approval"), notifications, the host's own uploads.
  - `/sharing`: the link frame under a `ScreenLamp`, `downloads-section.tsx`, the shared close.
    Questions: how guests get everything after (Save, the zip up to `MAX_EXPORT_ITEMS`, the reel),
    full quality out, the unfurl and the named link, who can open the link (the privacy page's
    claim, told from the sharing side), the big screen.
  - `/guests`: `attribution-hero.tsx` (the attribution wall under a `ScreenLamp`),
    `guest-list-section.tsx` (the guest-list card straddling the cut). Questions: who uploaded
    what, do guests need accounts (Require accounts, the email code, `TEASER_LIMIT`), the display
    name and the Host badge, the guest dashboard and self-deletion, can guests see each other.
  - `/privacy`: `access-switch.tsx` (the four visibility states; `GhostBackdrop` now lives in
    `shared/ghost-grid.tsx`), `never-rides-along.tsx` (the EXIF clause), no lamp by identity.
    Questions: who can see what (public, accounts, password, private), search engines, location
    data, passwords on Pro and Event Pass, reporting, deleting an event and the bin, deleting the
    account (self-serve since milestone 19: say so, and point at the help article).
- **Verification recipe** (`docs/systems/testing-verification.md`): both browser tools run as
  background tabs here, so force `[data-inview="true"]` and neutralise `[data-mkt-cut],
  [data-mkt-reveal]` before any screenshot; images load only when forced eager; the Chrome window
  will not go below ~500px (use the Browser pane's mobile preset and DOM measurement); bust the
  stylesheet hrefs with `?v=` and, after a restart, refetch every chunk with `cache: "reload"` (the
  path-hashed dev chunks survive an `.next` wipe in the tab's cache and read as hydration
  mismatches: `+` is the client, `-` the DOM). Measure balance, do not eyeball it: rows per sibling =
  `getBoundingClientRect().height / lineHeight`, at 1440 and 375.
- **Media.** The photographs on the doors and stages are stock placeholders ("the only weak link");
  Will replaces them when the media batch lands. Do not spend a round on them.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

The sync took `launch-prep`'s side of `docs/CHANGELOG.md` and `docs/ROADMAP.md` whole (the branch's
ten CHANGELOG entries are under Record below; its ROADMAP edits are under Deferred). Three system
docs carry in-place edits, each for a fact inside the owned paths:

- `docs/systems/design-system.md`: (1) "The shipped light" table gains two rows, the feature heroes'
  `ScreenLamp` and the QR plate, plus the ★ `ScreenLamp` paragraph (the one underlight as a
  component; `overflow-x-clip`; scarcity on a feature page) and the ★ radial-reach paragraph (a
  mask's reach is a fraction of the FULL field), a union with launch-prep's three home rows resolved
  at the sync; (2) the `PageHero` paragraph: `entrance` is `rise | cut`, the stage slot, the H1
  never moves, the blur-rise deliberately not a third entrance; (3) the mono ruling restated in
  Will's words ("I don't want to use mono anywhere except where it aids in tabular layouts"), the
  GoDeeper grandfather clause closed (its caption went to Inter on this branch).
- `docs/systems/marketing-content.md`: the "THE FEATURE FAMILY" block (the registry and its
  `directoryLine` band, the photographic doors, the one picture of each feature, the heroes on the
  cut with the stage + lamp, the eyebrow ruling, the album as the model with its thirteen beats and
  the facts it corrected, the arrivals grammar and the FLIP rules). Its single-source pointer now
  names launch-prep's `over-cap.ts`.
- `docs/systems/testing-verification.md`: one paragraph under "Dev-server CSS": the stale
  client-chunk blind spot and the `+` client / `-` DOM reading of a hydration diff.

## Deferred (ROADMAP one-liners, bucket named)

- **Marketing, per page (Will, 2026-09-11):** the five remaining feature pages get their own
  ground-up rounds, one track each in nav order (qr, curation, sharing, guests, privacy), the album
  as the model; the brief is the section above.
- **Marketing, ROADMAP reconciliation the branch had made directly (fold these):** (a) delete the
  clause "FAQ/GoDeeper unification onto `shared/` (M3's ready-to-apply plan);" from the R5/R6
  settlement paragraph: it shipped on this branch 2026-09-01; (b) in the same paragraph the
  MonoCaption sweep question is answered for the GoDeeper captions too (Inter since 2026-09-02, the
  ruling: mono holds data only); what remains of that sweep is the `MonoCaption` component's other
  call sites, page by page; (c) replace the "settle `PageHero`" paragraph with: "**the `PageHero`
  sweep, the remaining half** (Will, 2026-08-29; the cut family swept at the feature-pages round,
  2026-09-01: `entrance` is `rise | cut`, and the six feature pages, the hub, /how-it-works and
  /events compose it, so ten of the twelve hand-rolled copies are gone; and the h1 LCP hole is CLOSED
  on every hero whose h1 carried a data-attribute gate: /pricing, /reel and /events/[slug] lifted at
  the same round, held by `marketing-h1-policy.test.ts`). What is left is the blur-rise trio: the
  /help index, /contact and /careers arrive on the texts-reveal `.mkt-line`, whose `opacity: 0` rest
  state is the SAME LCP BUG in class form (the scan cannot see a class), and `.mkt-line` forces
  `display:block`, so a blur-rise lockup needs its own handling for the actions row. Either give
  those three the cut or keep the blur-rise and lift its gate off the h1; Will's call, since all
  three are identity pages he has said he will revisit. ★ `PageHero` owns ONLY the plain type lockup
  plus a stage slot for what sits under it; it must never absorb a hero whose object sits beside the
  lockup or a form (/qr, /blog's index masthead, /help's instrument row, the home hero all stay
  bespoke by design)".
- **Media batch:** the hub doors' and the album stages' stock photographs are placeholders Will
  replaces ("the only weak link is the stock images").
- **A mobile pass** of the feature pages (Will has reviewed desktop only; the branch measured 375
  for overflow and row balance, not for feel).
- **The design library:** a `ScreenLamp` specimen (the Orchestrator's lane; proposed in Handoff).

## Handoff

- Head: the commit carrying this manifest, on top of the sync merges `e12a883`, `08d2cb3` and the third
  (the album finish pass is `f9ffc33`); pushed. Preview:
  partyreel-git-lp-marketing-feature-pages-partyreel.vercel.app (builds on every push now).
- Synced with `launch-prep` at `e67d23c` (milestone 20 recorded; the third sync, docs only, clean). The first sync's
  resolutions: CHANGELOG and ROADMAP take launch-prep's side whole; the design-system light table
  is a union; the over-capacity grace numbers collapse onto launch-prep's
  `src/lib/lifecycle/over-cap.ts` (the branch's duplicate `over-capacity.ts` deleted, its importers
  repointed: the purge route, `album-copy.ts`, `album-faq.ts`, `pricing-faq-data.ts`), which is what
  `single-source-policy.test.ts` pins. The second sync was clean.
- Gates on the synced tree: typecheck ok; lint ok (two warnings, both launch-prep's own:
  `contact-form.tsx` and `queries/jobs.ts`); build ok (109 routes); test 1638 of 1639. **The one failure is
  outside this lane:** `src/app/(dev)/design/marketing/marketing-library.test.ts` asks for a
  specimen of `system/screen-lamp` in the design library (`src/app/(dev)/design/`, the
  Orchestrator's claim). Proposed specimen, for `page.tsx` beside the Heroes section (the import
  alone satisfies the test; the frame gives it something to sample):

  ```tsx
  import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
  // ...
  <RefSection
    title="The screen lamp"
    blurb="ScreenLamp, the one underlight as a component: a lit object throws its own sampled light off its bottom edge, full-bleed. One per page, under the hero's stage; its section must be overflow-x-clip."
  >
    <Spec label="under a frame" hint="sampled from the frame's own photographs" contentClassName="p-0">
      <section className="overflow-x-clip py-12">
        <ScreenLamp>
          <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-xl border bg-card p-2">
            {["wedding-golden", "party-balloons", "reception-table"].map((id) => (
              <span key={id} className="relative aspect-square overflow-hidden rounded-[3px]">
                <Image src={marketingImage(id).src} alt="" fill sizes="140px" className="object-cover" />
              </span>
            ))}
          </div>
        </ScreenLamp>
      </section>
    </Spec>
  </RefSection>
  ```

- Lane check (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns:` above,
  this manifest, the three `docs/systems/` files listed, and these exceptions, all additive and
  small: `src/app/(marketing)/marketing.css` (one token, `--fly-scale`, on the fly recipe so an
  album arrival settles at 0.96 instead of popping from 0.55); `src/components/marketing/frames/
  phone-frame.tsx` + `index.ts` (`PhoneShell`, the bezel with a children slot);
  `src/components/marketing/mock-parity.test.ts` (rows for the album's quoted app strings);
  `src/components/marketing/sections/pricing/pricing-faq-data.ts` (derives the grace days from
  `over-cap.ts` instead of a literal); `src/lib/constants/marketing-voice.test.ts` (the "night"
  scan now covers the feature registry's fields). `src/app/api/cron/purge/route.ts` is identical to
  launch-prep after the sync.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/features` at 1440 (the H1, the doors, the CtaBand with nothing between);
  `/features/album` top to bottom, then the ten-second eye on the ambient pieces the tools cannot
  run (the phone's screen cycle with its index bar, the Live | Review photograph flying phone to
  album and Approve all sending it on, the lightbox pill cycling its three names); both at 375.
- Housekeeping: the app's old worktree for this session,
  `.claude/worktrees/marketing-pages-redesign-8a52d3`, is detached at `f9ffc33` and can be pruned;
  the handoff was made from `../partyreel-wt/marketing-feature-pages`.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). The feature family lifted onto the home page's
grammar on shared pieces: `PageHero` settled its one entrance (`rise | cut`) and grew a stage slot,
with the h1 LCP gate lifted everywhere the scan found one; `ScreenLamp` became the one underlight
as a component; `FeatureDoor` made the hub a directory of photographic doors that every page also
closes on; one FAQ band and one GoDeeper row serve all six pages. The hub was rewritten three times
on Will's reading rule (his H1, a one-breath subhead, seven door lines held in one band). The album
page was rebuilt twice from a first-time host's questions outward (thirteen beats: getting in,
everywhere, the numbers, then the host's desk of live-or-review, names, who can open it, taking it
home, how much fits, it stays), every app string pinned, every number derived, then finished: copy
as tested sets, verdict-first FAQ, no mono but the stat band, every section in its own register.
The five other pages keep the shared furniture and await their own rounds, one track each.

#### 2026-09-01, the feature pages round (the branch's own entries, newest first)

An autonomous Agent round on Will's brief: "attempt a redesign across all of our marketing feature
pages", with the design lab's light doctrine and the home page's chapter pacing as the current peak,
under rising tides. Built and verified on the worktree dev server (Chrome MCP at 1440, the Browser
pane at 375; every reveal forced by hand, since both tabs run in the background) and on the branch
preview. Gate green at every commit; 1316 tests.

**What it is, in one line: the hub and the six feature pages now open, light and pace the way the home
page does, on shared pieces instead of six hand-rolled copies.**

- **`PageHero` settles the one hero entrance** (`entrance: "rise" | "cut"`) and grows a stage slot.
  The six feature heroes, the hub, /how-it-works and /events compose it; the album hero had been
  cutting its own h1 after hydration against the family rule, which the sweep closes by contract.
- **`ScreenLamp`**, the one underlight mechanic as a component: a lit object throws its own sampled
  light down off its bottom edge, full-bleed. The album's arrivals stream, the guests' attribution
  wall and the sharing page's link frame are now lamps, each the colour of its own photographs
  (measured live on /features/album: hues 53 and 308, not the house set). The QR plate switches on
  (lab moment 06's second specimen: ignite on arrival, rest lit), with its field sized so the falloff
  completes inside it. Curation, privacy and the doors carry no lamp, by the scarcity ruling.
- **`FeatureDoor`**, the ruled media-forward card as the feature directory: the hub's seven doors and
  every page's sibling band are photographs with each surface's own chip. The hub's hand-drawn motifs
  went with it. The sibling band is now the close chapter's opener (three doors on the hard cut, with
  air), so the FAQ and CTA have something to ramp down from.
- **Each page as an attention arc**, bespoke per page: the album re-paced (hero → live → the quiet
  numbers → paper); the print stock straddles the cut on /qr and the guest-list card on /guests; the
  spec sheet, downloads, queue and access switch open their paper chapters a tier up; /qr's entry
  flow opens its close, so its doors drop to the body register.
- **One FAQ band and one GoDeeper row for all six pages** (`shared/`): curation, sharing and privacy
  drop their near-copies and their second FAQPage JSON-LD emission; the ROADMAP's unification
  one-liner closes. `launch-prep`'s sideways-scroll clip (the skin wrappers) merged in mid-round,
  which is the clip the full-bleed lamps rely on. Verified on the branch alias: the guest card
  overhangs the cut by 79px, the QR plate rests at base 0.34 with its field inside the section, the
  album lamp's first three hues are orange, gold and blue (sampled), no page overflows.

- **Per-page round 1, `/features` (Will's notes, 2026-09-02):** the centred `PageHero` lockup clamps
  to `max-w-3xl` again (the family's width; unclamped, the hub's title ran the full Container in one
  line), so every swept hero breaks evenly; the hub's actions are a Start free / How it works pair
  with the demo line centred beneath (the events hub takes the same balance); and the "How it
  works" section is GONE as a section: after two cuts (a body-tier SectionShell, then a 24/30
  lockup) still read as the CtaBand's twin, the walkthrough and help pointers were dropped altogether
  ("feels very clean"): the directory takes a step more padding and goes straight to the CtaBand.
  Then a full copy rewrite of the hub as one voice, cut twice on Will's reading rule ("people tend
  not to read most copy on a site"): his H1 "The full media kit for any event", a one-breath
  subhead, the seven door lines rewritten as a set on a new registry field (`directoryLine`, two
  rows at most, width-constrained on the card, held to one length band so they wrap alike), and a
  fresh close ("Start with one event, free.").
- **`/features/album`, the finish pass before review (2026-09-02).** Will's three notes on the
  question-driven rebuild: no mono anywhere but tabular alignment (a consumer product, not a devtool),
  supporting copy punchy and every multi-item list visually balanced, every section finished in its
  own register. Copy now lives in `album-copy.ts` as SETS held in a measured length band + spread by
  `album-copy.test.ts` (the hub's `directoryLine` mechanism); the FAQ is verdict-first (a few words,
  a period, one sentence). Mono swept to the StatBand alone (the GoDeeper caption went to Inter across
  every feature page). Elevations: the getting-in facts are the phone's INDEX (ruled rows, an ink
  gutter bar following the screen, hover pins it); the three controls are a settings document with
  the real switch / select / hidden-tile shapes; the Live|Review photograph MOVES along one rule
  (Approve all is a real button that sends it on); one lightbox pill cycles its three states with a
  synced index; four exposures of one album on the 3px rebate (`[data-mkt-isolate]` light table);
  three equal photographic take-home plates with the icon-swap; one ruled plan strip with storage
  bars and the guest's refusal drawn as the toast; the lifecycle on one hairline grid closing the desk
  on a drawn rule. Measured at 1440 and 375: every set's siblings on equal rows, no overflow.
- **`/features/album`, the second pass, from the host's questions outward (2026-09-02).** Will's
  read of the first pass was exact: the same skeleton with polish, and "a very poor job of covering
  all the questions a host would have". Three fact sheets (the system docs, the host-side code, the
  guest-side code) were compiled first and a Plan agent stress-tested the IA against a fresh
  reader's question list; it caught "no account by default" (backwards: Require accounts defaults
  ON), a private frame leaking a name and count, and a plans chart opening a cinema chapter. The
  page is now thirteen beats: getting in (one phone cycling the scan, the welcome and the first
  upload), everywhere, the numbers, then a paper desk (Live | Review as a switch you flip, names in
  the lightbox, four states of who can open it, taking it home, how much fits with every number
  derived, it stays with the grace and idle windows derived), then the doors and nine questions.
  New: `over-capacity.ts` (the 45-day grace, now shared by the cron and the pricing FAQ), a shared
  ghost grid, ten mock-parity pins, the night scan over the feature registry.
- **`/features/album`, the first ground-up page round (2026-09-02).** Will's brief: treat it as a
  total visual and copy redesign and think from the whole product's benefits, not the previous
  sections. The page is now the album through the event's own timeline in three arcs. The hero's
  stage was rebuilt on two product truths the old mock got wrong: the real album is newest-first
  and PREPENDS arrivals, and the real feedback is a green check plus a live count, not toasts. So
  the album now fills from the top (older tiles slide down on the shared `useFlip`, the check draws,
  the count ticks, an in-flight tile shows the real progress strip), from one tick and a pure,
  unit-tested derivation; a second stage lands the same tile on a laptop and a phone in one commit
  (the doorbell as a benefit); the spec sheet and keeping cards became one document; the double
  eyebrow became the page's label alone on all six pages; every copy block is two rows. New:
  `album-fill-fixtures.ts`, `use-album-fill.ts`, `album-fill-grid.tsx`, `arrivals-stage.tsx`,
  `everywhere-*.tsx`, `PhoneShell` (the bezel with a children slot), a `--fly-scale` token on the
  fly recipe so an album arrival settles (0.96) instead of popping (0.55). Deleted:
  `live-section.tsx`. ★ Neither browser tool can run the clock (both are background tabs, so
  `useAmbientPause` stays paused); the mechanic is held by the derivation tests and Will's eye.
- **The h1 never moves, held by a scan.** `marketing-h1-policy.test.ts` reads every marketing h1 for
  a reveal or cut gate. It found three outside the feature family (/pricing, /reel, the event pages),
  each the LCP hole PageHero forbids; the gate came off each and the slots around it keep arriving.
  The blur-rise trio (/help, /contact, /careers) carries the same hole as a CLASS, which the scan
  cannot see, and stays Will's call (ROADMAP). `screen-lamp.test.ts` and `feature-door.test.ts` pin
  the new pieces; the hero contract test grows the two-entrance and stage rules. 1316 → 1330 tests.

★ A radial mask's reach is a fraction of the full field: the lab's 78% on the plate rendered as a
rounded square until the field grew and reach dropped to 60%. ★ Both browser tools run as background
tabs here: IntersectionObserver never fires, so every reveal must be forced before a screenshot, and
the Chrome window will not resize below ~500px, so the phone pass ran in the Browser pane with the
mobile preset and DOM measurements (no page overflows at 375).
