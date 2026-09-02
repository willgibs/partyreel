# Marketing site, content & SEO

> ROLE: the public `(marketing)` site, its content pipelines, SEO/OG, the 404 boundaries, and the marketing side of the demo.
> BELONGS HERE: the marketing pages + nav, the frame library, the MDX help/blog pipeline, metadata/OG/sitemap/robots, the 404 system, the demo env wiring. · NOT HERE: the guest demo-mode behavior (→ [guest-flow.md](guest-flow.md)), the QR designer used in-app (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

The public `(marketing)` route group on the shared domain. Nav is single-sourced
([`marketing-nav.ts`](../../src/lib/constants/marketing-nav.ts)) and consumed by the config-driven
[`marketing-header.tsx`](../../src/components/marketing/chrome/marketing-header.tsx) (desktop mega-panels in
[`marketing-nav.tsx`](../../src/components/marketing/chrome/marketing-nav.tsx) + a full-screen mobile menu in
[`mobile-menu.tsx`](../../src/components/marketing/chrome/mobile-menu.tsx)) + the ink-slab
[`marketing-footer.tsx`](../../src/components/marketing/chrome/marketing-footer.tsx); both render only
**live** routes.

**The nav (rebuilt 2026-08-28).** ★ `PRIMARY_NAV` ORDER IS LOAD-BEARING: the three PANEL groups
(Features · Events · Resources) stay CONTIGUOUS and Pricing is last as the only flat link, because Radix
derives its side-by-side cross-slide from the index delta between adjacent items and a flat link wedged
between two panels left one pair without a sweep (a Vitest pin holds both the order and the invariant).
The panel now sits on the floating-layer contract ([design-system.md](design-system.md)); its clocks are
`--mkt-dropdown-*` / `--mkt-nav-*` on `[data-mkt]`, with `--mkt-dropdown-open-ms` deliberately shared by
the enter animation, the box morph and the cross-slide so they can never drift into separate clocks
again. Hover intent is `--mkt-nav-intent-ms`, read by JS through `readCssMs` (never `parseInt`). A
measured indicator ([`nav-indicator.tsx`](../../src/components/marketing/chrome/nav-indicator.tsx)) glides
behind the labels and doubles as the panel's `transform-origin` source, so the panel grows out of the
label you pointed at; `NAV_INDICATOR` swaps pill↔underline in one word. **Everything in the chrome carries
`var(…, fallback)` clocks**: the root `app/not-found.tsx` renders this header WITHOUT marketing.css, so a
bare `--mkt-*` reference there is silently unset. The header's glass is an inert `-z-10` layer whose
opacity animates ([`header-shell.tsx`](../../src/components/marketing/chrome/header-shell.tsx)) — the bar
itself must never carry `backdrop-filter` again, or every panel repaint happens inside a blurred region. **Brand = the app's design system turned up**: the ACHROMATIC base (zero-chroma chrome;
`--brand` aliases ink, there is no brand hue — the 2026-08-25 ruling; [design-system.md](design-system.md)
is authoritative), media is the color; marketing runs louder via type/layout/motion only (motion follows the
in-repo `emil-design-eng` skill). One `SITE_URL`/brand constant ([`site.ts`](../../src/lib/constants/site.ts),
incl. `BRAND_HEX` — satori needs a literal hex) is shared by `sitemap.ts` / `robots.ts` / the root `metadataBase`.

## Pages + their single-sources

- **home** + **`/features`** (copy in [`features.ts`](../../src/lib/constants/features.ts), feeding the home
  teaser too; layout via `FeatureSpotlight` + the `FEATURE_PRESENTATION` map in
  [`features-layout.ts`](../../src/lib/constants/features-layout.ts)).
- **`/events`** — a full landing hub + 4 umbrella pages (weddings/parties/conferences/trips) off ONE
  `[slug]` template; copy in [`events.ts`](../../src/lib/constants/events.ts) (`EVENT_TYPE*` — named to
  avoid colliding with the real `events` domain; + the `EVENTS_HUB` block); distinct hero + "Built for X"
  layouts via `EVENT_PRESENTATION` ([`events-layout.ts`](../../src/lib/constants/events-layout.ts)) + the
  `eventFrame()` resolver ([`event-frame.tsx`](../../src/components/marketing/event-frame.tsx)) +
  [`built-for.tsx`](../../src/components/marketing/built-for.tsx); shared
  [`event-frame-cards.tsx`](../../src/components/marketing/event-frame-cards.tsx) +
  [`faq-accordion.tsx`](../../src/components/marketing/faq-accordion.tsx) (+ FAQPage JSON-LD).
- **Media-frame library** ([`frames/`](../../src/components/marketing/frames)) — a `BrowserFrame` base + a
  vocabulary (`AlbumFrame`/`GalleryFrame`/`ReelFrame`/`PhoneFrame`/`QrFrame`); never one visual reused.
  `QrFrame` takes a `liveQrUrl?` → a REAL scannable QR ([`live-qr.tsx`](../../src/components/marketing/frames/live-qr.tsx) wrapping `StyledQr`) when the demo is set, else a decorative block.
- **`/about`** — THE MISSION PAGE (rebuilt twice, 2026-08-28; the IA never recorded its job before,
  which is a fair part of why it stayed a scaffold). Copy single-source
  [`about.ts`](../../src/lib/constants/about.ts), on the content-policy `CLAIM_FILES` list because the
  page file itself was reachable only by the weaker neutralization fence. The page was on probation
  ("if we can't figure it out, I plan on killing the page entirely"); what earns it is the MISSION,
  told as a story in the ruled arc (Will, 2026-08-28): here is the OPPORTUNITY (everyone at the event
  is already shooting it, from angles you will never get), here is the problem we kept hitting (it
  falls apart somewhere new every time), there has to be a better way, so we built it. Copy that
  opens on exposition instead of a scene reads as rambling here, and a fourth parallel failure turns
  the rhythm into a list. The six convictions then land as the ANSWER to that story rather than a
  feature list, and each links to the page that proves it (the previous version promised "you can
  verify each one" and gave the reader nothing to click). Close points at careers, not signup.
  ★ **AFFIRMATIVE ONLY (Will, 2026-08-28):** a planned "where Partyreel is the wrong call" section was
  cut. "A photographer could also deliver their photos via this platform... I genuinely hope people do
  find ways to use this beyond what we've thought of. **This is about who we are, not who we are not.**"
  Never enumerate what the product is not for, and never fence a use case.
  ★ **The comparison stays CATEGORY-LEVEL** (the AI-posture ruling): the cross-platform album, the
  drip-fed thread, the account wall, the per-person rental, never a product name.
  ★ **The R5 zero-team ruling is RELAXED here** (Will, 2026-08-28): the page carries a first-person
  origin and a join-our-team close. Its intent still holds, so no headcount and no founder biography.
  ★ **No CtaBand**, by the footer's own rule (the footer is the paper lane's one conversion action),
  and no mono anywhere (the R6 ruling).
- ★ **THE UTILITY-PAGE RHYTHM (Will's ruling, 2026-08-28): cinema hero, paper body, ink footer, on
  EVERY utility page** — the identity pages (about, blog, careers, press) and, as they are reworked,
  legal, privacy and contact too. "With the cinema hero, we need to go back to the dark nav to match."
  The dark ground BOOKENDS these pages rather than interrupting them: a short utility page has too few
  sections to alternate chapters the way the long marketing pages do.
  **The paper/cinema split is per-CHAPTER, not per-page.** A page takes the rhythm by JOINING THE
  `(cinema)` GROUP and wrapping its reading body in ONE `PaperChapter` — which is exactly what /help and
  all six feature pages already do, so there is no new mechanism and the dark overlay nav, the dark
  dropdowns, the dark overscroll and the `#040404` browser chrome all come with the group. Route groups
  do not appear in URLs, so adopting or dropping the treatment is a directory move with no redirect.
  `(paper)` survives only until the remaining pages have moved.
  ★ **A DARK HERO DECIDES THE ROUTE GROUP**, because a dark hero must be paired with a dark nav (Will)
  and the header skin is chosen by the GROUP LAYOUT, which a page cannot override from inside. That one
  sentence is the whole rule: the ground your hero wants is not a page-level choice.
  ★ **Do NOT build it from the paper side.** The /about round first shipped it as a `(spotlight)`
  group whose sticky header wore a hand-assembled `--gallery*` set, and that set is always one token
  behind: it omitted `--popover`, so the in-flow nav panels rendered white-on-white at ~1.07:1. The
  measurement and the rule live in [design-system.md](design-system.md).
  ★ **Do NOT drop a dark chapter into the MIDDLE of one of these pages** either. The register for a
  set-apart block inside a paper body is `bg-muted/40` with `border-y` (the /contact panel surface).
- **The About arc + the gather** ([`about/gather.tsx`](../../src/app/(marketing)/(cinema)/about/gather.tsx)) —
  About opens on the cinema room and BOOKENDS the page in dark against the ink footer, leaving the
  reading body in the middle (the wordmark as the page's h1 at the lockup's `display` step, never the
  Logo lockup, plus one line and the Start free / How it works pair).
  The gather carries the dark-to-paper cut on its own back: the album is centred on it, arriving out
  of the event and onto the desk (the /help strip idiom), **`sm:` and up only** — at three columns the
  album is four rows, so phones get the whole album on dark and a plain hard cut, exactly as
  /help does below `lg`.
  ★ **THE LESSON WORTH KEEPING: the first build reused `[data-mkt-fly]`, which animates opacity 0 → 1,
  so its pre-state is INVISIBLE.** Nobody ever saw the scatter, only an empty frame filling in, and
  Will's read was "almost unnoticeable" — the whole idea was happening in a state that could not be
  seen. The `.mkt-gather` recipe never touches opacity: the photographs are visible throughout and
  only position and angle change. Any beat whose CONCEPT is a change of arrangement must not hide its
  starting arrangement. The scatter is an authored table inside the frame (never `Math.random()`,
  which desyncs SSR), so the no-JS fallback is prints on a table rather than photographs stranded
  off-screen. Eleven gather and a twelfth arrives late, because a complete rectangle says "this is all
  of it" and there is always one more phone in the room.
- **`/careers`** (rebuilt from zero, the careers round 2026-08-28) — in the **(cinema)** group (URL
  unchanged; every consumer addresses it by path). Shape: dark hero → ONE paper chapter carrying the
  whole body → the ink footer. ★ **One cut, not stripes**: an earlier pass alternated per section and
  Will's read was that it "feels overwhelming when it's every section on a shorter page", which is
  also the ratified chapter doctrine (a cut introduces a concept group, "never stripe alternation").
  ★ **THE PAGE ARGUES IN PHOTOGRAPHS.** Two prototypes were rejected as generic and the cause was
  content, not layout: both were claims about ourselves ("why it matters" restated the product pitch,
  "how we work" was a values list) on a page whose reader had already met the pitch twice. The middle
  is now **the roll → the selects → the reel**
  ([`careers-story.tsx`](../../src/components/marketing/sections/careers/careers-story.tsx)): the
  contact sheet with everything but four frames dimmed to near-nothing (the dimming IS the argument),
  then the survivors gathered into the album chrome, then the real rendered loop via
  `InlineReelPlayer` (the PLAYER, not the engine, so the sanctioned-import boundary holds). Roughly
  forty words carry all three. Do not reintroduce a paragraph section to explain a beat.
  The hero is the **contact sheet**
  ([`contact-sheet.tsx`](../../src/components/marketing/sections/careers/contact-sheet.tsx)): real
  manifest frames butted tight, mono frame numbers, and a few circled as selects whose stroke DRAWS
  itself in on arrival, because marking the selects is the product's core act performed above the
  fold. The section is pulled UP under the overlay chrome (`-mt-[var(--mkt-header-h)]`, home's cinema-hero
  move) so the sheet runs behind the nav and the scrim's top stop fades it out there: starting below
  the header left a hard seam across the top of the page. ★ The hero's marks are POSITIONAL and low
  in the sheet (index 18+ clears row one at all three column counts) because marks in the top row sit
  under that chrome; the roll's marks are DERIVED from the kept-frame ids instead, so the four
  photographs circled there are provably the four that lead the album a screen later, and a reorder
  of the frame list cannot silently rot them. The two lists are separate on purpose: the hero repeats
  the roll three times, so id-based selection would circle every keeper three times over.
  Its composition is this page's alone (home owns the drifting wall, pricing the stacked photos,
  the footer the fanning pile), per the media doctrine in
  [`event-hero-media.tsx`](../../src/components/marketing/sections/events/event-hero-media.tsx).
  ★ Marks stay ACHROMATIC (white pencil, not the obvious red): there is no brand hue.
  ★ **Nothing in the hero is lazy** (fixed at the merge): the sheet fills the first screen, so every
  one of its cells is above the fold, and half of them were `loading="lazy"` on the reasoning that
  this is the LCP surface, which is the wrong lever. Because the roll REPEATS, covering the unique
  pass costs six more small requests; `priority` stays at six, since a preload per frame would fight
  the LCP element for the same bandwidth.
  ★ The h1 takes the **site ladder**, not a ramp of its own (Will, 2026-08-29: "let's normalize the
  site ladder so that we don't have one unique size ramp for a utility page"). The round shipped it
  one step louder below `lg`; a photographic hero earns presence from the sheet, not a private step.
  This hero is what EXPOSED the roughness in the overlay header's glass wash (the pattern itself
  predates it, on home's cinema hero); the fix is now the recommendation for any full-bleed hero, in
  the glass-crossfade note in [design-system.md](design-system.md).
  ★ The scrim is tuned against PHOTOGRAPHY, not the dim DOM art it first served — density plus a
  uniform 0.8 dim on hero frames is what lets the type win without crushing the images the page
  exists to show. Listings use ONE row design for every entry with contact-sheet frame numbers; the
  General Application's honesty lives in its DATA (no team at all, type "Always open", its own
  action label), because with a single real role a second container read as inconsistency rather than
  distinction. The close points at **/contact**, not the product: the footer carries a product CTA
  immediately below. ★ The HEADINGS have to tell the story alone, because people skim them and read nothing
  else: they run join our team → the best content gets lost in camera rolls → so we gather all of it in
  one place → and turn the best into a highlight reel → our core philosophy → we're hiring. Two traps
  live-caught there: a bare "Most of it is never seen again" under a hiring headline read as though
  our new HIRES vanish (the heading now names the photos and where they are lost), and the beats open
  with "So" and "And" so three captions read as one story. Headings also avoid the word "build" (it
  had run three of four). Listings are individual CARDS on the house gray plate (`bg-muted/50`, the
  contact form's surface) that go to white card stock on hover, like a print picked up off the desk;
  the index and the facts share one ruled line across the card top, which is what gives it structure
  rather than three stacked text blocks. The close is a small FOLLOW-UP inside the roles section
  (smaller than a role title, tucked under the cards) rather than a CtaBand, whose heading scale
  shouted over the list it was meant to trail. ★ Mono is confined to the contact sheet's frame
  NUMERALS; the role and philosophy indices are Inter (the R6 ruling, applied 2026-08-29).
  ★ **The philosophy indices are CIRCLED by the sheet's own `SelectMark`** (Will, 2026-08-29: "give
  it the page's vocabulary"). That row was the one beat arguing in prose on a page that argues in
  photographs, and a bare 01/02/03 under a hairline is any startup's values grid; the mark is not a
  new device, so one gesture repeats at three scales (hero frames, roll frames, indices), and it is
  true rather than decorative, since three principles survived a cut from four. Off the sheet it
  takes the SURFACE's ink (the base colour is the gallery's near-white, invisible on paper) and draws
  on its section's Reveal rather than the page-load clock a mark three screens down would waste.
  Copy single-source for the listings and the hub:
  [`careers.ts`](../../src/lib/constants/careers.ts), a content-policy `CLAIM_FILES` entry (the role
  page's apply-chapter notes are inline prose, like /contact's and /press's, and are covered by the
  neutralization fence that scans all of `(marketing)`); its `offer` block including "Competitive compensation" is KEPT by Will's ruling, the posting
  being meant to spark a conversation. **No `JobPosting` JSON-LD** while the listing is placeholder.
  **`/careers/[slug]` is a SPEC SHEET** (ruled 2026-08-29): dark title block → a paper document
  (reading column beside a sticky spec rail, the same two-column family help articles and the legal
  shell use) → the application chapter on its own gray band. Each role carries an **EMBLEM** ([`role-emblem.tsx`](../../src/components/marketing/sections/careers/role-emblem.tsx)):
  an achromatic SVG plate (a film reel, an empty slide mount, the album grid) shown on its listing
  card and again as the avatar above its title, which the two pages **MORPH between** via the native
  View Transitions API ([`role-morph.tsx`](../../src/components/marketing/sections/careers/role-morph.tsx),
  mounted from a careers-scoped layout so the listener stays off every other route). ★ The morph
  itself is the SHARED
  [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx), collapsed at the
  merge with the blog's cover morph, which was built in parallel and differed in three strings; a
  third morph is a config object, not a fourth copy. ★ NOT React's `<ViewTransition>` - that flag
  swaps the whole app's React runtime to a canary, which a marketing round does not get to decide.
  The CSS is NAME-SCOPED because `::view-transition-*` are document-global like `@keyframes`, and the
  binding between a `name` and its rule is pinned by `marketing-css-policy.test.ts` (renaming one
  side alone drops the timing with no error). Emblems map by slug with a deterministic integer-hash
  fallback, so a new listing is never emblem-less and server and hydration agree; ★ that fallback
  draws only from NEUTRAL kinds, because an unwritten role inheriting `reel` (the graphics role's
  mark) or `open` ("not a real vacancy") asserts something false. ★ It carries NO PHOTOGRAPHIC hero media on purpose.
  The hub argues in photographs; this page is where somebody decides and wants information density,
  and a contact-sheet frame borrowed as a header was considered and dropped because an image
  unrelated to the actual role reads as decoration. The restraint straight after a photographic hub
  is the point. Facts render as labelled pairs in the rail (a slashed inline run reads as a caption;
  a spec wants terms you can scan down), list items are ruled rows rather than dot-bullets, and the
  offer block keeps the green checks but takes a different SHAPE from the lists so three sections do
  not read as one column. ★ `lg:self-stretch` on the rail is load-bearing (the help ToC's lesson:
  `lg:items-start` otherwise collapses the aside and sticky gets zero travel), and the rail is
  `order-first` on mobile so the facts precede the prose. The application chapter wraps the form in
  context (what we need / what you do not need / what happens next) beside it, and INVERTS the
  contact figure/ground: a white card on the gray band, because here the band is the separator.
- **`/contact`** (rebuilt, the contact round 2026-08-28) — forms → deny-all
  `contact_submissions` / `job_applications` via a Server Action + the service-role admin client;
  best-effort Resend notify via `sendOnce` (ADR-0005; [`careers.ts`](../../src/lib/constants/careers.ts)).
  Contact's first field is a REQUIRED **topic Select** (single source
  [`constants/contact.ts`](../../src/lib/constants/contact.ts) — labels/icons/fastest-path hints; the zod
  enum + the `contact_submissions.topic` CHECK + the `[label]` email-subject tag + the `/admin/support`
  chip all read it, and a parity test pins the enum to the migration). Picking a topic swaps a deflection
  hint INSIDE the form. The form card is the STATIONERY NOTE on the Biograph gray panel (Will's
  composite ruling on the `contact-identity` touchpoint): `bg-muted/50` card + the photo postage stamp +
  the letterhead MonoCaption, with fields explicitly `bg-background` so white reads against the gray.
  ★ Radix Select gotchas (all live-caught): never pass a controlled `""` (it latches the placeholder
  over later programmatic values); the hidden native-select bridge emits an EMPTY `onValueChange`
  during mount cycles (drop empty emissions or programmatic pre-picks get clobbered); and render the
  trigger label yourself — `SelectValue` cannot resolve a label while the popper items have never
  mounted. The page mounts `HelpPaletteProvider` itself (⌘K + an embedded hero search band work on
  /contact; the palette is already `portalSkinProps("paper")`), and the `?about=<slug>` handoff
  prefills subject AND pre-picks the topic via the exhaustive `CATEGORY_TOPIC` map (a new help
  category fails typecheck until mapped), applied via `form.reset` so "Send another" keeps the
  article context. The route stays static (window.location read on mount, allowlisted — never
  `useSearchParams`).
- **`/help`** + **`/blog`** — an in-repo **MDX content pipeline** (ADR-0006): `content/*.mdx` + `gray-matter`
  + `next-mdx-remote/rsc` + **build-time zod frontmatter validation**. The generic core is
  [`content/collection.ts`](../../src/lib/content/collection.ts) (`loadCollection` + `slugify` +
  `extractHeadings` + `readingTime` + `escapeXml`); [`help.ts`](../../src/lib/content/help.ts) +
  [`blog.ts`](../../src/lib/content/blog.ts) are thin wrappers. Help (rebuilt R6, 2026-08-26 — "the index
  of everything"): a NINE-category lifecycle taxonomy (each category carries a `feature` link up to its
  marketing rung; a new category must land WITH its first article — the test requires ≥1 per category) +
  a ranked ⌘K **search palette** mounted from [`help/layout.tsx`](../../src/app/(marketing)/(cinema)/help/layout.tsx)
  ([`help-palette.tsx`](../../src/components/marketing/help/help-palette.tsx); pure fs-free scorer in
  [`help-search-rank.ts`](../../src/lib/content/help-search-rank.ts) — heading hits deep-link to sections
  only when they're the sole match reason, plus a static "Pages" tail onward to the site) + the index
  sheet (numbered panes, DOM-art [`help-emblems.tsx`](../../src/components/marketing/help/help-emblems.tsx),
  a live-constants "numbers" strip) + answer-first articles (the frontmatter `description` renders as the
  "In short" lead; scroll-spy ToC via pure `pickActiveHeading`; one delegated copy-anchor island; prev/next;
  an honest feedback row handing misses to `/contact?about=<slug>`, which the static contact page prefills
  from an allowlist). First-party MDX components
  ([`mdx-components.tsx`](../../src/components/marketing/mdx-components.tsx) — `Callout`, `AlbumShowcase`,
  `Steps`/`Step`, `Kbd`, `UiLabel`, inline spec components reading the `limits.ts`/`tiers.ts` single sources
  so numbers can't drift; NOTHING client-side may import it, it reaches `node:fs`) + a `prose-help` theme.
  Help lives in the **(cinema) group** since the polish arc (dark overlay nav + dark stages; the reading
  bodies ride `PaperChapter`, the search card / emblem strip / In-short card are `surface-paper` islands,
  the strip and the article's In-short card STRADDLE the cinema→paper cut via negative margin). Shared help
  components live in [`components/marketing/help/`](../../src/components/marketing/help). ★ MOTION LANDMINE:
  `[data-mkt] .mkt-line` forces `display:block` (texts-reveal recipe, 0,2,1 specificity) and silently kills
  flex utilities on the same element — center constrained children with `mx-auto`, never a parent
  `justify-center`. ★ The R6 MONO RULING (site-wide type doctrine, full text in
  [`design-system.md`](design-system.md)): mono is for numerals/tabular alignment ONLY in standard UI —
  captions, labels, and CTA notes are Inter. The content agent's brief lives at
  [`content/help/AUTHORING.md`](../../content/help/AUTHORING.md) (taxonomy map + component vocabulary +
  writing rules; the content-policy tests scan `.md` too so the brief obeys itself).
- **Blog** (rebuilt 2026-08-28 from the `blog-identity` lab round; Will's composite on V4 Cutting
  Room). Moved into the **(cinema) group** like /help, so it opens on the dark stage and the reading
  half rides `PaperChapter`. ★ **DISTINCTNESS FROM /help is the standing constraint** now that both
  hubs open dark: /help opens on an instrument (centred question, search field, emblem strip), /blog
  opens asymmetric on the lead story with a media wall beneath. No search field, no emblems, and the
  tag rail stays words-and-numerals only - an icon column there is the one move that collapses the
  two surfaces together.
  - **The index.** The Broadsheet masthead (a SMALL `Blog` h1 + a drawn `[data-mkt-rule]` hairline,
    a deliberate departure from the 4xl-7xl H1 ladder so the featured card owns the stage; the
    register is recorded in [`design-system.md`](design-system.md)) -> the newest post as a 21:9
    featured card STRADDLING the cinema->paper cut -> the library. The rail is a sticky margin index
    (counts from the full set, a 2px ink bar for active, never a fill); the library is 4/5 portrait
    `PostCard`s at 1/2/3 columns ([`components/marketing/blog/`](../../src/components/marketing/blog),
    shared with the post page's "Keep reading"). The masthead's right side is a subtle RSS
    `Subscribe`, the feed's only visible entry point (it shipped reachable through nothing but a
    `<link rel=alternate>`). Picking a tag runs the **two-beat set change** (`--mkt-set-*` in
    marketing.css: departing cards leave together, then a two-axis `useFlip` reorganizes the
    survivors) - page-neutral hooks, so any filtered collection can take it.
  - ★ **The hero exists ONLY in the unfiltered view** — lifting it permanently out of the filtered
    set renders EMPTY tags, because a hero can own tags no other post has (the derivations + the pin
    live in [`blog-index.ts`](../../src/lib/content/blog-index.ts)). Filter state rides a shareable
    `?tag=` read through `useSyncExternalStore` (never `useSearchParams`: it would deopt the static
    route; a mount effect is banned by the react-hooks lint). **Pagination** is built and INVISIBLE
    below `POSTS_PER_PAGE` (12), so today's four posts render with no control at all; it rides
    `?page=` beside `?tag=` rather than `/blog/page/[n]` routes, which would multiply into tag x page
    URL space on a four-post blog — ★ `paginate()` CLAMPS, because a stale `?page=` or a filter that
    shrinks the set under the reader (tag with 40 posts, page 4, pick a tag with 3) must land on a
    real page instead of an empty grid.
  - **Covers.** An optional frontmatter `cover` (a `MARKETING_IMAGES` id, refined so a typo fails the
    BUILD) over a stable slug-hash fallback in
    [`blog-covers.ts`](../../src/lib/content/blog-covers.ts) — ★ a pure function of the SLUG alone,
    because the obvious "walk the post list and hand out unused images" is deterministic but NOT
    stable and silently re-skins older posts on every publish. A crop ladder re-slices the same
    source so 11 images yield 66 distinguishable plates.
  - **The ARTICLE** ("the print of the frame") opens on the same cover at the same slug-derived crop
    as the card the reader clicked, so the page reads as the card opening; the frontmatter
    `description` renders as the visible STANDFIRST (it previously appeared on the card, in metadata,
    in the feed and in llms.txt, everywhere except in front of the reader). The ending is deliberately
    TWO blocks: chronological neighbours, then related posts with those neighbours excluded
    (`getRelatedPosts(post, n, exclude)`), because on a small archive the two sets otherwise coincide
    and repeat a post within one screen. Long-form reading components are shared with /help and live
    in [`components/marketing/reading/`](../../src/components/marketing/reading) — `ArticleToc`
    (scroll-spy, plus the `progress` READING SPINE that **both** long-form surfaces take, Will
    2026-08-29) and the delegated `HeadingAnchorsDelegate`. Both pages mark their body with the
    shared `ARTICLE_BODY_ID` so the spine measures the ARTICLE, never the page.
  - **THE COVER MORPH**: the card's photograph grows into the article's plate on navigation, via the
    **native** View Transitions API. The mechanism moved to the SHARED
    [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx) at the careers
    merge (the careers round had rebuilt it line for line in parallel);
    [`cover-morph.tsx`](../../src/components/marketing/blog/cover-morph.tsx) is now three strings of
    configuration. One delegated island, so every card stays a server component. ★ NOT React's `<ViewTransition>`: that needs
    `experimental.viewTransition`, which swaps the WHOLE app's React runtime from the pinned 19.2.4
    to 19.3.0-canary (measured with a probe build, not assumed) — a product-wide trade for a blog
    flourish, and a decision for Will, not a round. Two traps it cost: the delegate must intercept in
    the CAPTURE phase, because `next/link` preventDefaults on the anchor first and a bubble listener
    bails on `defaultPrevented` forever (the morph silently does nothing while the page still
    navigates perfectly); and the delegate, not the server render, must own the
    `view-transition-name`, because clearing it from an incoming cover is a mutation React will never
    undo (the `style` prop did not change), so the first morph otherwise disarms every one after it.
    The `::view-transition-*` rule in marketing.css is NAME-scoped and pinned by the CSS policy test:
    those pseudo-elements are document-global, exactly like `@keyframes`.
  - **Shared plumbing.** The byline is one component across the card, the featured card and the post
    header ([`post-meta.tsx`](../../src/components/marketing/blog/post-meta.tsx)) and is **Inter, not
    mono** — the R6 doctrine applied rather than reflexively obeyed: mono earns numerals that ALIGN
    in a column, and a byline aligns with nothing, so setting name+date+reading-time in mono read as
    a timecode and flattened the only human signal on the card. **ONE registered author**
    (`partyreel-team`) by Will's 2026-08-28 ruling; named individuals are deliberately absent from
    the registry rather than dormant in it, since a dormant entry is what a content agent picks up by
    accident. Frontmatter `title` is capped at 80 chars as a LAYOUT contract (cards clamp to 2 lines,
    the featured card to 3), failing the build rather than shipping a silently cut title. Share
    surfaces are media-led: the OG card is the featured card (cover read off disk and inlined, never
    fetched — `NEXT_PUBLIC_SITE_URL` resolves to PROD on preview builds) and the feed carries
    `<enclosure>` art sized by the route. Unchanged: the client-safe author registry
    ([`authors.ts`](../../src/lib/content/authors.ts)), Article JSON-LD, per-post `next/og` cards, and
    the build-static **RSS 2.0 feed** (`/blog/feed.xml`, `dynamic="force-static"`, hand-rolled
    `buildBlogRssXml` that takes its site config as a param so it stays out of the env-validating
    `site.ts` + is unit-tested); `draft: true` posts are excluded from listing/sitemap/RSS. The author
    brief is [`content/blog/AUTHORING.md`](../../content/blog/AUTHORING.md).
- `/pricing`, legal. The header `Resources ▾` + footer Resources column group Help + Blog + Press + Contact
  (a two-way Vitest mirror: change one side and you must change the other).

**THE FOOTER (the ink slab).** One always-dark surface under BOTH skins (`--gallery*`, never a
nested `.dark` — see [design-system.md](design-system.md) for the token-redeclaration trap it hides).
Three registers: the demo invitation (a server-rendered scannable QR on a fanning pile of event
photos, pointing at `DEMO_EVENT_URL`, desktop-only since you cannot scan your own screen, plus a
secondary `Start free`), the index, and a legal bar. A turbulence-warped seam glow on the ratified
confetti palette turns the top edge into spilled light instead of a hard cut.

IA is four columns beside the brand block: **Features** · **Events** · **Product** (How it works ·
Pricing · The reel · FAQ) · **Resources**, with About + Careers as Resources' TAIL under a hairline
and the legal bar owning `FOOTER_LEGAL` (Privacy + Terms) plus `/llms.txt`. Features and Events
carry their hub on the column TITLE (a `href` on the column, rendered with a hairline underline that
brightens on hover) rather than spending a row on "All features": the directory sits where the eye
already lands, and the underline is the only signal separating a linked title from an unlinked one. **Nothing is
collapsed** (Will's review, superseding the first pass's disclosure columns): Features and Events are
the most core marketing page families and folding them behind chevrons buried them, while the whole
sitemap is small enough to show at once. A Vitest pin guards against an accordion returning. This
SUPERSEDES R4-A19 for legal (Privacy/Terms sat under Company only because a sixth column wrapped at
1440; a bar is a different shape). The brand block carries the wordmark (no mark tile: its filled
square clashed with the QR plate above), the thesis, and the assistant row.

The root 404 renders the same footer, but outside `(marketing)`: `marketing.css` never loads there,
so the glow and the photo fan simply do not fire. Anything the footer needs in order to not BREAK
there (the stack's absolute positioning, the slab's tokens) is therefore carried on the components
themselves, never inherited from that sheet.

## SEO / OG

`metadataBase` is set in the root [`layout.tsx`](../../src/app/layout.tsx) (`env.NEXT_PUBLIC_SITE_URL ??
"https://partyreel.com"`) — WITHOUT it Next errors on relative OG URLs. OG images are **code-generated via
`next/og`** ([`opengraph-image.tsx`](../../src/app/opengraph-image.tsx) site-wide + a per-event card at
`(guest)/e/[token]/opengraph-image.tsx`). `sitemap.ts`/`robots.ts` list/allow ONLY the marketing routes
(sitemap `lastModified` carries help/blog frontmatter dates; build time elsewhere).

**The AI-discoverability layer (milestone-4, 2026-08-28):** `/llms.txt` + `/llms-full.txt` (the
llmstxt.org format) are built by pure fns in [`content/llms.ts`](../../src/lib/content/llms.ts)
(numbers derive from `tiers.ts`/`limits.ts`; the builders are content-policy `CLAIM_FILES`, so the
social-proof + backstop fences cover the AI surface; link integrity is unit-tested against the real
routes) and served by force-static routes (the RSS pattern). `robots.ts` names 14 AI crawlers with
explicit allow blocks (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, ...); a
`SoftwareApplication` schema mounts sitewide beside Org/WebSite (offers = the shared
AggregateOffer; NO ratings/reviews — absent beats fabricated). Posture (Will, 2026-08-28): the
comparison content stays CATEGORY-level, never rival brand names; the honest when-it-is-not section
is deliberate credibility, don't "fix" it into pure praise. The press boilerplate + fact sheet live
in [`constants/press.ts`](../../src/lib/constants/press.ts) (one quotable home: /press + the llms
builders). Follow-ons: the ROADMAP "AI-SEO content arc" bucket.

**`/press` = THE CONTACT SHEET (ruled 2026-08-28).** In `(cinema)` on the utility-page rhythm above:
masthead hero, then ONE `PaperChapter` carrying the whole body. The page is titled **"Press"**
everywhere (header panel, footer column, /contact directory, title, breadcrumb, H1, OG card): the old
"Press & brand" combo was two labels for one page and "brand" did no work a reporter needed. Hero =
the shared `PageHero` at `scale="display"`, eyebrow "Media assets" over H1 "Press" (both hoisted to
constants in the page; a taste call Will has turned three times).
★ **AT THE DISPLAY STEP, THE H1 MATCHES ITS NAV LABEL** (Will, 2026-08-29, arriving from the footer's
"Press" link). A 160px masthead is the loudest promise on the page, so it has to be the word the reader
just clicked; a link reading Press over a masthead reading "Media" lands as a non-sequitur. Anything
more specific belongs in the EYEBROW, which carries no word limit (the H1 does: see page-hero.tsx).

**The sheet** is the kit as a photographic proof sheet: eight numbered frames on the 3px
`--gap-gallery` album grid, opening the paper body rather than riding in the dark with the hero, so
the body reads as one continuous surface. ★ The frames are deliberately NOT all the same kind of thing
(artwork, an app icon, the share card, a working QR, the ink, the type) — a uniform grid of marks is a
downloads table wearing a metaphor; do not "tidy" it. ★ EVERY FRAME IS OURS: the first cut used two
stock event photos and Will pulled them ("just feels weird to say here's a random stock photo"), which
was right twice, since a press page must not hand a publisher media whose rights we do not hold.
★ Plate by LEGIBILITY, not variety: white behind ink-drawn artwork, ink behind white-drawn artwork,
and the two grounds are LITERAL colours (`PLATE_PAPER` / `BRAND_HEX`), never theme utilities — a plate
is the artwork's own ground and must not follow a token flip. ★ THE REBATE: the grid paints `--border`
and insets itself by the same `--gap-gallery`, so every gap is a hairline; outer inset and inner gap
are one value or it stops reading as a rebate.

**The body is a sticky two-column spine**: Assets / Words / Fact sheet pinned left, their content on
the right, each one a deep-link target. Every section's content ends at ONE SHARED RIGHT EDGE and the
narrower ones simply START further right (`lg:ml-auto` against a width cap) rather than widening, so
the gap between a pinned heading and its answer grows with the viewport while the reading measure does
not. Words and the fact sheet share one `max-w-2xl`. Each pinned column carries a pointer under its
note (the kit download, then /contact, then /how-it-works), and the glyph follows the ACTION rather
than variety: navigation takes `LearnChevron`, a download takes the hero's down arrow. The close is
centred, so the spine resolves before the cut to the footer. ★ NO BRAND-GUIDELINES SECTION, by ruling —
clear space / minimum size / misuse are brand-book material; only the two press-business usage points
(quoting needs no permission, how to write the name) ship, as quick hits beside the copy they govern.

The kit is manifest-driven (`PRESS_KIT` + `scripts/build-press-kit.mjs` + `scripts/build-press-qr.mjs`
+ the committed zip, guarded by `press-kit.test.ts`, which parses the archive back and CRC-checks
every member against the files on disk), so the pre-launch logo change is a files-and-rows edit with
no component work. Explored range + the ruling: `/design/c/press-identity`.

**The promise-neutralization doctrine (Will, 2026-08-28):** published copy commits to OUTCOMES (a
reply, a review, host control), never to WHO or WHAT delivers them — no "a real person answers", no
"a human reviews every report", no "never an automatic takedown", no "business day" — so support and
moderation tooling can evolve (AI first-gates included) without breaking published, especially legal,
language. The standard reply line, verbatim everywhere a reply is mentioned: **"Every note gets a
reply, usually within a day."** The moderation stance reframed actor-free as review-before-removal +
host-moves-fastest ([`report-review.tsx`](../../src/components/marketing/sections/features/privacy/report-review.tsx),
formerly "People, not machines"). Enforced by the third content-policy fence
([`content-policy.test.ts`](../../src/lib/content-policy.test.ts)): a phrase-list scan over ALL of
`src/app/(marketing)` + `src/components/marketing` + `src/lib/constants` + MDX — deliberately narrow
so the guest-attribution line ("every upload has a real person behind it") and careers'
"We read every application" stay legal on purpose.

## Gotchas (why it's like this — don't revert)

- **The `next/og` images load NO font** — the built-in font dodges the Next-16 satori font gotcha. Don't add a custom font loader.
- **The event page emits OG tags but `robots: { index: false }`.** `/e/[token]` sets `generateMetadata`
  (event name/description + the per-event OG) so links unfurl in chat, but the opaque `qr_token` must NEVER
  be indexed. `robots.ts` also disallows `/e/`, `/dashboard`, `/admin`, `/login`, `/auth`, `/api/`. The
  guest query `getEventByQrToken` is wrapped in React `cache()` so `generateMetadata` + the page + the OG
  image share one RPC per request.
- **404 — the double-chrome boundary (live-caught).** Five `not-found.tsx` (root catch-all + one per route
  group) share ONE animated core ([`not-found-screen.tsx`](../../src/components/shared/not-found-screen.tsx)
  — presentational, NO `Container`/chrome). The root [`not-found.tsx`](../../src/app/not-found.tsx) renders
  its OWN `MarketingHeader`/`Footer` because UNMATCHED URLs fall through to `app/layout.tsx` with no group
  chrome — but a `notFound()` thrown INSIDE the marketing group renders the root boundary INSIDE
  `(marketing)/layout.tsx`, which ALREADY renders header/footer → the chrome **double-stacks**. The fix is a
  [`(marketing)/not-found.tsx`](../../src/app/(marketing)/not-found.tsx) boundary that renders ONLY the
  centered content (lost-visitor copy single-sourced in
  [`marketing-not-found.tsx`](../../src/components/marketing/marketing-not-found.tsx)). ★ Since the
  careers round the marketing pair is LOPSIDED: `(cinema)` catches every dynamic marketing route
  (events, help, blog, careers) and `(paper)` catches NO `[slug]` at all, holding only the static
  trio. Do not delete the paper one for having no slug: a static page can call `notFound()`, and
  without the boundary that render falls through to the ROOT one and double-stacks the chrome.
  By audience: root
  (unmatched URL, brings its own chrome), marketing (bad `[slug]`, no chrome), guest (dead/expired event link
  → reassure + a "What is Partyreel?" CTA + the demo, minimal `Logo` header), host (inside the authed
  `AppShell`), admin (inside the MFA-gated `AdminShell`). All five → single chrome, 404 status + `noindex`.
- **Local-dev OG host:** in `pnpm dev` the emitted `og:image` URL shows the `localhost:3000` host (Next
  resolves metadata against the request origin in dev) while `sitemap.ts`/`robots.ts` show the
  `partyreel.com` fallback — NOT a bug; prod (with `NEXT_PUBLIC_SITE_URL` set) resolves correctly. The
  per-event OG URL carries a Next hash suffix (`…/opengraph-image-<hash>?…`) — read the real URL from `<head>`.

## Interactive demo (marketing side)

Env-gated, no schema change. A real curated event's `qr_token` is set in `NEXT_PUBLIC_DEMO_QR_TOKEN`
(public). **GOTCHA: it must be referenced explicitly in [`env.ts`](../../src/lib/env.ts)'s `parsePublic()`**
— Next only inlines literally-named `process.env.NEXT_PUBLIC_*` (this was added to the schema but not its
reader once, so it stayed `undefined` in prod). [`demo.ts`](../../src/lib/demo.ts) is the single source
(`DEMO_EVENT_URL` + `isDemoToken`). When set: the `/features` hero QR + a home-hero "Try the live demo" CTA
become real links; unset → no demo anywhere (decorative QR, no CTA). The guest-page demo-mode behavior is in
[guest-flow.md](guest-flow.md).

## See also

[ADR-0005](../adr/0005-marketing-form-submissions.md) · [ADR-0006](../adr/0006-mdx-content-pipeline.md) · [host-app.md](host-app.md) (the in-app QR designer / how-it-works single-source) · [notifications-analytics-growth.md](notifications-analytics-growth.md) (guest email capture / OG-driven growth).
