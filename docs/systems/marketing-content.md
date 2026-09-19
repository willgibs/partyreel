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

**The nav.**
★ `PRIMARY_NAV` ORDER IS LOAD-BEARING: the three PANEL groups
(Features · Events · Resources) stay CONTIGUOUS and Pricing is last as the only flat link, because Radix
derives its side-by-side cross-slide from the index delta between adjacent items, and a flat link wedged
between two panels leaves one pair without a sweep (a Vitest pin holds both the order and the invariant).
The panel sits on the floating-layer contract ([design-system.md](design-system.md)); its clocks are
`--mkt-dropdown-*` / `--mkt-nav-*` on `[data-mkt]`, with `--mkt-dropdown-open-ms` deliberately shared by
the enter animation, the box morph and the cross-slide so they cannot drift into separate clocks.
Hover intent is `--mkt-nav-intent-ms`, read by JS through `readCssMs` (never `parseInt`). A
measured indicator ([`nav-indicator.tsx`](../../src/components/marketing/chrome/nav-indicator.tsx)) glides
behind the labels and doubles as the panel's `transform-origin` source, so the panel grows out of the
label you pointed at; `NAV_INDICATOR` swaps pill↔underline in one word. **Everything in the chrome carries
`var(…, fallback)` clocks**: the root `app/not-found.tsx` renders this header WITHOUT marketing.css, so a
bare `--mkt-*` reference there is silently unset. The header's glass is an inert `-z-10` layer whose
opacity animates ([`header-shell.tsx`](../../src/components/marketing/chrome/header-shell.tsx)); the bar
itself must never carry `backdrop-filter`, or every panel repaint happens inside a blurred region.
★ **THE BAR LEAVES GOING DOWN AND RETURNS COMING UP** (`on-scroll=hide`, Will 2026-09-19), on BOTH postures
and by TRANSFORM ALONE: `--mkt-header-h` stays `4rem` and the sticky `z-40` box never moves, because ~14
consumers derive from that one knob. It goes once the reader commits 8px past a one-header-height reveal
zone and comes back on ANY upward movement, at the top, and on `:focus-within`; it never leaves with a nav
panel or the phone sheet open. The hide and its three escapes are ONE compound selector, so no utility
ordering decides them, and `-translate-y-full` writes the standalone `translate` property, so the clock is
`transition-[translate]` and never `transition-transform`. Direction is the one thing no
IntersectionObserver can report, so the site's single passive, rAF-coalesced scroll listener lives in
[`use-scroll-direction.ts`](../../src/lib/shared/use-scroll-direction.ts) (attached only while something
reads it); the glass's own signal must stay on its observer.
★ **THE RIGHT CLUSTER IS THE ONE PERSONAL THING IN THE CHROME** (`returning=dashboard`): a client island
([`session-hint.tsx`](../../src/components/marketing/chrome/session-hint.tsx)) on `useSyncExternalStore`
with the SERVER SNAPSHOT `false`, so ~50 prerendered routes ship the stranger's Log in + Start free pair
and a signed-in host's single `Dashboard` correction lands before paint; the phone sheet's foot swaps with
it. The signal is the `sb-<project-ref>-auth-token` cookie prefix read from `document.cookie`
(`@supabase/ssr` defaults `httpOnly: false` and `createBrowserClient` uses `document.cookie` AS its
session storage, so no presence cookie is needed in `updateSession`). ★ A HINT, NEVER AUTHORIZATION: the
`(app)` layout's `getUser()` is the boundary and RLS is the boundary under it, and both wrong answers land
the visitor on `/login`. **Brand = the app's design system turned up**: the ACHROMATIC base (zero-chroma chrome;
`--brand` aliases ink and there is no brand hue, [design-system.md](design-system.md)
is authoritative), media is the color; marketing runs louder via type/layout/motion only (motion follows the
in-repo `emil-design-eng` skill). One `SITE_URL`/brand constant ([`site.ts`](../../src/lib/constants/site.ts),
incl. `BRAND_HEX` — satori needs a literal hex) is shared by `sitemap.ts` / `robots.ts` / the root `metadataBase`.

## Pages + their single-sources

- **home** + **`/features`** (copy in [`features.ts`](../../src/lib/constants/features.ts), feeding the home
  teaser too; layout via `FeatureSpotlight` + the `FEATURE_PRESENTATION` map in
  [`features-layout.ts`](../../src/lib/constants/features-layout.ts)).
- **THE FEATURE FAMILY (the hub + six pages on the home page's grammar).**
  Identity single-source: [`feature-pages.ts`](../../src/lib/constants/feature-pages.ts)
  (its `directoryLine` is the hub door's line, written as one set and held in one length band by
  the registry test so the six doors wrap alike; `heroSub` stays each page's own).
  The hub is a DIRECTORY of **photographic doors** ([`feature-door.tsx`](../../src/components/marketing/sections/features/shared/feature-door.tsx),
  the ruled media-forward card anatomy from the home event cards, each door carrying its feature's
  own photograph plus the chip its surface draws: the live dot, the approved check, the name chip,
  the lock, the play badge; the QR door is the one made object, the real renderer on a white plate,
  rendered ABOVE the scrims because a scrim over white greys it). The reel leads full-width on its
  poster. The same doors are every page's closing band ([`related-features.tsx`](../../src/components/marketing/sections/features/shared/related-features.tsx)),
  so the site has ONE picture of each feature. Every page's hero composes `PageHero` on the cut
  (the H1 static, [design-system.md](design-system.md)); the album, guests and sharing heroes put
  their object in the stage slot under a `ScreenLamp` (the page's one lamp, sampled from its own
  frame), the QR plate switches on in its own bespoke hero, and curation and privacy open plain on
  purpose. The eyebrow is the page's own label alone, never a "Features ·" breadcrumb half.
  **`/features/album` is the model for the
  others:** designed from a first-time host's QUESTIONS outward (the link vs the QR, hosting accounts,
  names without accounts, live vs review timing, guest deletion, the total cap and what happens at
  it, video on Free, who can OPEN the album, downloads, paying to keep it, the bin, the big screen),
  with light tie-ins to the neighbouring features so a visitor landing here first is never lost.
  Thirteen beats in three arcs: cinema (the hero, getting in, everywhere, the numbers), ONE paper
  chapter as the host's desk (your call, names, who can open it, taking it home, how much fits, it
  stays), the close (doors, nine questions, the band). Every app string is quoted and pinned by
  `mock-parity.test.ts`; every number derives (`tiers.ts`, `limits.ts`, the lifecycle constants,
  including [`over-cap.ts`](../../src/lib/lifecycle/over-cap.ts), the grace numbers the cron
  reads too).
  ★ Facts the page must keep: Require accounts defaults ON for a new event
  (never "no account by default"); anonymous is Anonymous (no name field exists); a guest deletes
  their own upload from their dashboard and it is private to the host; a private page shows no name
  and no count (the name + count tease is the PASSWORD state); no big-screen mode exists (the album
  in any browser is the claim); nothing is locked or hidden at lapse. Chapter 1 opens on **the
  album filling from the top** ([`album/arrivals-stage.tsx`](../../src/components/marketing/sections/features/album/arrivals-stage.tsx)
  over the shared [`album-fill-grid.tsx`](../../src/components/marketing/sections/features/album/album-fill-grid.tsx)
  + [`use-album-fill.ts`](../../src/components/marketing/sections/features/album/use-album-fill.ts)):
  the REAL guest album's arrival grammar quoted (newest-first, arrivals prepended with older tiles
  sliding down on `useFlip`, the ~2.5s green check, the live "N photos & videos from M guests"
  line, the in-flight progress strip), driven by ONE tick and a pure derivation that the test pins.
  ★ The FLIP wrapper carries no transform of its own (the entrance lives on the inner element) and
  its `layoutKey` is the MOUNTED COUNT, never the tick, with the beat held above `--tune-reorder-ms`,
  or a landing re-runs the layout effect mid-slide and snaps the column. No "Just added"
  chip and no "Maya added 3" toast: neither has a product surface behind it.
  Then "Land once, show up everywhere" (the doorbell as a benefit: one `useAlbumFill` feeding a
  laptop and a `PhoneShell` so the same tile lands on both in one commit), then the quiet numbers.
  Chapter 2 is ONE document on the cut (what lands, and what stays; the keeping cards folded in).
  Chapter 3 is the doors, three questions, the band. Every figure derives from `limits.ts` and
  `recently-deleted.ts`. **Each page is a three-chapter attention arc** (design-system.md "Chapters"): a cinema
  chapter that opens on the lamp and ramps down (the album re-paced hero → live → the quiet
  numbers), ONE paper chapter whose opener is bespoke per page (the print stock STRADDLES the cut
  on /qr, the guest-list card straddles on /guests, the spec sheet / downloads / queue / access
  switch open a tier up on the cut elsewhere), and a close chapter that opens on the doors band and
  winds down through the FAQ to the CtaBand. The doors band takes `opener={false}` on a page whose
  close already opens on its own beat (/qr's entry flow): two openers back to back are noise. The
  FAQ band and the GoDeeper row are ONE pair for all six pages
  ([`shared/feature-faq.tsx`](../../src/components/marketing/sections/features/shared/feature-faq.tsx)
  emits the FAQPage JSON-LD itself; each page's `*-faq.ts` is data only).
- **`/events`** — a landing hub + 4 umbrella pages (weddings/parties/conferences/trips) off ONE
  `[slug]` template, rebuilt from the ground up by `events-wiring` (2026-09-19) on the seven directions
  of `event-identity`. ALL copy AND all per-type media in
  [`events.ts`](../../src/lib/constants/events.ts) (`EVENT_TYPE*` — named to avoid colliding with the
  real `events` domain; + the `EVENTS_HUB` block). ★ `media` is the single home for a per-type
  photograph (`card` / `turn` / `object` / `statement`); five components named their own before the
  wiring round, so a manifest swap meant five edits and a hunt. The generated set lands HERE and
  nowhere else (ASSETS rows 24 and 25). **The arc, in order:** `PageHero` on the cut with the eyebrow
  a link back to the hub, its stage holding ONE lit object per type
  ([`event-object.tsx`](../../src/components/marketing/sections/events/event-object.tsx)) under a
  `SectionLight placement="room"` → the statement, still dark
  ([`event-statement.tsx`](../../src/components/marketing/sections/events/event-statement.tsx): one
  claim on the `chapter` step, one visual, the long tail as one running line under a hairline) → the
  turn ([`event-turn.tsx`](../../src/components/marketing/sections/events/event-turn.tsx), a
  full-width photograph with a centred cast and one line, both hairlines: it IS the chapter cut) → ONE
  `PaperChapter` holding [`built-for.tsx`](../../src/components/marketing/built-for.tsx) alone → the
  door proof ([`event-door.tsx`](../../src/components/marketing/sections/events/event-door.tsx)) → the
  FAQ → `CtaBand`. The hub keeps the ALL-DARK arc (no planning document of its own to earn a light
  chapter), wears the cross-event object, and has its own `opengraph-image.tsx`.
  ★ **EVERY OBJECT IS A DOOR.** All five pages server-render the demo's REAL scannable code the way
  [`footer-qr.tsx`](../../src/components/marketing/chrome/footer-qr.tsx) does (`qrcode-generator` is
  DOM-free, so the matrix ships as inert markup and the object costs zero client JS), encoding `/demo`
  at 25 modules, never the event link. With no demo configured each object DROPS the piece that would
  carry it (the table card, the tent card, the sleeve's plate; the badge falls back to its drawn
  cells) and the door section goes whole: never a dead link (the `DemoCtaLink` contract).
  ★ **The prints are literal `bg-white`, never `bg-card`.** These still lifes stand on the cinema
  ground where the card token is near-black, so a paper border in it renders as a GAP and six prints
  read as a thumbnail strip. The wedding album is a dark cover holding two ivory pages, and the dark
  channel between them IS the spine.
  **One card anatomy at two sizes**
  ([`event-type-card.tsx`](../../src/components/marketing/sections/events/event-type-card.tsx)): the
  photograph IS the card for all four types (`aspect-4/5`, the ruled `CARD_COPY_SCRIM`, the name, the
  teaser, the long tail as one line at directory size), worn by the hub's
  [`type-directory.tsx`](../../src/components/marketing/sections/events/type-directory.tsx) (2x2, the
  tilt kept) and by the home's
  [`events-teaser.tsx`](../../src/components/marketing/sections/home/events-teaser.tsx) (four up, no
  tilt). Conferences and trips carry a NAMED STAND-IN still until ASSETS 24/25 land; the artifacts
  ([`event-artifacts.tsx`](../../src/components/marketing/sections/events/event-artifacts.tsx)) stayed
  only for what a photograph cannot do (the badge is the conference's object, the filling pane is the
  statement's visual where `media.statement` is null).
  **At 375** the lockup takes `subheadShort`, the hero's padding closes to `pt-10 pb-0` and the object
  deliberately CROSSES the fold (measured: it starts at 539 and ends at 912 on weddings); the
  FAQ-to-close gap is halved below `sm` (`max-sm:pb-10` / `max-sm:pt-10`).
  `EVENT_PRESENTATION`, `eventFrame()`, `event-frame-cards.tsx`, `event-hero-media.tsx` and
  `reel-angle-band.tsx` are all GONE; `faq-accordion.tsx` and its FAQPage JSON-LD stay.
- **Media-frame library** ([`frames/`](../../src/components/marketing/frames)) — a `BrowserFrame` base + a
  vocabulary (`AlbumFrame`/`GalleryFrame`/`ReelFrame`/`PhoneFrame`/`QrFrame`); never one visual reused.
  `QrFrame` takes a `liveQrUrl?` → a REAL scannable QR ([`live-qr.tsx`](../../src/components/marketing/frames/live-qr.tsx) wrapping `StyledQr`) when the demo is set, else a decorative block.
- **`/how-it-works`** — THE LOOP AS SIX STEPS in one scroll with a Host/Guest toggle above them
  (`loop-wiring`, 2026-09-19). [`how-it-works.ts`](../../src/lib/constants/how-it-works.ts) is the ONE
  source of both step sets, read by the page, the shared overview stepper
  ([`how-it-works-stepper.tsx`](../../src/components/marketing/sections/shared/how-it-works-stepper.tsx),
  mounted on the home under the film strip) and the app's welcome tutorial (its three derive from the
  host's first three). Twelve bespoke pictures (`sections/how-it-works/host-pictures.tsx`,
  `guest-pictures.tsx`), the host's on a desk and the guest's in a phone; the demo as a finished album
  with a real code encoding `/demo` rather than a reel; one folded close. The pair is named apart: the
  spine's foot and the mega panel's Resources card link the article as "Read the full how-to", the help
  hub links this page as "See the loop, start to finish".
- **`/privacy` + `/terms`** — THE LEGAL DOCUMENTS (v1.0; formal but readable, on a two-register
  contract: every section carries an "In
  short" line beside the formal text). Single-sources: [`legal.ts`](../../src/lib/constants/legal.ts)
  (version, date, `status`, the bracketed `LEGAL_PARTY` launch placeholders, the typed block model +
  `legalPlainText`, `LEGAL_RELATED`) and the two content modules
  [`legal-privacy.tsx`](../../src/lib/constants/legal-privacy.tsx) /
  [`legal-terms.tsx`](../../src/lib/constants/legal-terms.tsx) (both on the content-policy
  `CLAIM_FILES` list; **env-free by rule**, never import `site.ts`). Shell:
  [`legal-document.tsx`](../../src/components/marketing/legal/legal-document.tsx): `PageHero` at `lg`
  (never `display`: multi-word titles) → the version/status/reading-time META CARD straddling the
  cinema→paper cut (the help "In short" move; a `<div>`, never a `<header>`, because `ArticleToc`
  measures the first header) → ONE `PaperChapter` on a three-track grid (gutter / 42rem column / rail)
  so the column, the card and the centred hero share one axis → `ArticleToc` with the reading spine +
  `ChipToc` below `lg` + `HeadingAnchor` on every h2/h3 → a "Read next" foot from `LEGAL_RELATED`.
  The rail takes `max-h` + its own overflow (22 entries do not fit a laptop viewport). Blocks render
  in [`legal-blocks.tsx`](../../src/components/marketing/legal/legal-blocks.tsx) (p / list / table /
  sub / `note`, the `bg-muted/40 border-y` set-apart register for disclaimers, never all-caps). The
  status line is the body face with tabular figures. **Section ids are the anchor
  contract**, pinned as arrays in `legal.test.ts`; renaming one is a reviewed change. **The launch
  switch is a test**: flipping `status` to `effective` with a bracketed placeholder still in the text
  fails CI.
  ★ **No prices and no cap numbers in the Terms**: they point at `/pricing` so a Stripe
  price change never falsifies a contract.
  **The fences read the legal text AND its comments**: the
  neutralization regexes (`business day`, the child-safety acronyms, `law enforcement`, `ingress`)
  cannot be quoted even in a header comment; write "working days", "public authorities", "content
  that sexually exploits minors", "reasonable limits on upload volume". Acceptance: the one
  [`LegalConsentLine`](../../src/components/shared/legal-consent-line.tsx) on `/login` and on the
  guest door's welcome step (`newTab` there so the sheet survives the tap); no checkbox, nothing
  recorded. The sitemap reads the legal `lastUpdated`, not build time. The reading family's shared
  pieces now live in [`reading/`](../../src/components/marketing/reading): `heading-anchor.tsx`
  (`HeadingAnchor` + `HEADING_SCROLL_MT`, lifted out of `mdx-components`) and `chip-toc.tsx` (the
  mobile chip row help and blog each carried verbatim).
- **`/about`** — THE MISSION PAGE. Copy single-source
  [`about.ts`](../../src/lib/constants/about.ts), on the content-policy `CLAIM_FILES` list because the
  page file itself is reachable only by the weaker neutralization fence. What earns the page is the
  MISSION, told as a story in the ruled arc (Will, 2026-08-28): here is the OPPORTUNITY (everyone at
  the event is already shooting it, from angles you will never get), here is the problem we kept
  hitting (it falls apart somewhere new every time), there has to be a better way, so we built it.
  Copy that opens on exposition instead of a scene reads as rambling here, and a fourth parallel
  failure turns the rhythm into a list. The six convictions land as the ANSWER to that story rather
  than a feature list, and each links to the page that proves it, because a promise that "you can
  verify each one" needs something to click. Close points at careers, not signup.
  **AFFIRMATIVE ONLY** (bible 20; Will, 2026-08-28): no "where Partyreel is the wrong call" section.
  "A photographer could also deliver their photos via this platform... I genuinely hope people do
  find ways to use this beyond what we've thought of. **This is about who we are, not who we are not.**"
  Never enumerate what the product is not for, and never fence a use case.
  **The comparison stays CATEGORY-LEVEL** (the AI-posture ruling): the cross-platform album, the
  drip-fed thread, the account wall, the per-person rental, never a product name.
  **The zero-team rule is RELAXED here** (Will, 2026-08-28): the page carries a first-person
  origin and a join-our-team close. Its intent still holds, so no headcount and no founder biography.
  **No CtaBand**, by the footer's own rule (the footer is the paper lane's one conversion action).
- **THE UTILITY-PAGE RHYTHM (bible 16; Will, 2026-08-28): cinema hero, paper body, ink footer, on
  EVERY utility page** — the identity pages (about, blog, careers, press) and, as they are reworked,
  legal, privacy and contact too. "With the cinema hero, we need to go back to the dark nav to match."
  The dark ground BOOKENDS these pages rather than interrupting them: a short utility page has too few
  sections to alternate chapters the way the long marketing pages do.
  **The paper/cinema split is per-CHAPTER, not per-page.** A page takes the rhythm by JOINING THE
  `(cinema)` GROUP and wrapping its reading body in ONE `PaperChapter` — which is exactly what /help and
  all six feature pages already do, so there is no new mechanism and the dark overlay nav, the dark
  dropdowns, the dark overscroll and the `#040405` browser chrome all come with the group. Route groups
  do not appear in URLs, so adopting or dropping the treatment is a directory move with no redirect.
  `(paper)` holds only `/contact` and retires with it.
  **A DARK HERO DECIDES THE ROUTE GROUP** (bible 16), because a dark hero must be paired with a dark nav (Will)
  and the header skin is chosen by the GROUP LAYOUT, which a page cannot override from inside. That one
  sentence is the whole rule: the ground your hero wants is not a page-level choice.
  **Do NOT build it from the paper side.** A hand-assembled `--gallery*` set on a sticky header is
  always one token behind, and the omitted one renders the in-flow nav panels white-on-white; the
  landmine and its measurement live in [design-system.md](design-system.md).
  **A dark chapter never sits in the MIDDLE of one of these pages** either (bible 16). The register for a
  set-apart block inside a paper body is the muted panel, `bg-muted/40` with `border-y` (the /contact
  panel surface): **the fourth ground** (bible 16, Will, 2026-09-14: cinema, paper, ink and
  the panel), the one thing allowed to break the strict light-dark alternation. It ships at /30, /40
  and /50 (seventeen sites; on paper /40 is a 1% step); the `palette` board proposes it as one
  token at one value.
- **The About arc + the gather** ([`about/gather.tsx`](../../src/app/(marketing)/(cinema)/about/gather.tsx)) —
  About opens on the cinema room and BOOKENDS the page in dark against the ink footer, leaving the
  reading body in the middle (the wordmark as the page's h1 at the lockup's `display` step, never the
  Logo lockup, plus one line and the Start free / How it works pair).
  The gather carries the dark-to-paper cut on its own back: the album is centred on it, arriving out
  of the event and onto the desk (the /help strip idiom), **`sm:` and up only** — at three columns the
  album is four rows, so phones get the whole album on dark and a plain hard cut, exactly as
  /help does below `lg`.
  **A beat whose CONCEPT is a change of arrangement must not hide its starting arrangement**
  (bible 13). `[data-mkt-fly]` animates opacity 0 → 1, so its pre-state is INVISIBLE: reuse it here
  and nobody sees the scatter, only an empty frame filling in, which reads as "almost unnoticeable"
  because the whole idea is happening in a state that cannot be
  seen. The `.mkt-gather` recipe never touches opacity: the photographs are visible throughout and
  only position and angle change. The scatter is an authored table inside the frame (never `Math.random()`,
  which desyncs SSR), so the no-JS fallback is prints on a table rather than photographs stranded
  off-screen. Eleven gather and a twelfth arrives late, because a complete rectangle says "this is all
  of it" and there is always one more phone in the room.
- **`/careers`** — in the **(cinema)** group (URL
  unchanged; every consumer addresses it by path). Shape: dark hero → ONE paper chapter carrying the
  whole body → the ink footer. **One cut, not stripes** (bible 17): alternating per section "feels
  overwhelming when it's every section on a shorter page" (Will), which is
  also the chapter doctrine (a cut introduces a concept group, never stripe alternation).
  **THE PAGE ARGUES IN PHOTOGRAPHS** (bible 18), and a generic middle is a CONTENT problem, not a
  layout one: a "why it matters" that restates the product pitch and a "how we work" values list are
  both claims about ourselves, on a page whose reader has already met the pitch twice. The middle
  is **the roll → the selects → the reel**
  ([`careers-story.tsx`](../../src/components/marketing/sections/careers/careers-story.tsx)): the
  contact sheet with everything but four frames dimmed to near-nothing (the dimming IS the argument),
  then the survivors gathered into the album chrome, then the real rendered loop via
  `InlineReelPlayer` (the PLAYER, not the engine, so the sanctioned-import boundary holds). Roughly
  forty words carry all three. Do not reintroduce a paragraph section to explain a beat.
  The hero is the **contact sheet**
  ([`contact-sheet.tsx`](../../src/components/marketing/sections/careers/contact-sheet.tsx)): real
  manifest frames butted tight, tabular frame numbers, and a few circled as selects whose stroke DRAWS
  itself in on arrival, because marking the selects is the product's core act performed above the
  fold. The section is pulled UP under the overlay chrome (`-mt-[var(--mkt-header-h)]`, home's cinema-hero
  move) so the sheet runs behind the nav and the scrim's top stop fades it out there: starting below
  the header left a hard seam across the top of the page. The hero's marks are POSITIONAL and low
  in the sheet (index 18+ clears row one at all three column counts) because marks in the top row sit
  under that chrome; the roll's marks are DERIVED from the kept-frame ids instead, so the four
  photographs circled there are provably the four that lead the album a screen later, and a reorder
  of the frame list cannot silently rot them. The two lists are separate on purpose: the hero repeats
  the roll three times, so id-based selection would circle every keeper three times over.
  Its composition is this page's alone (home owns the band streaming out of the demo code, pricing the stacked photos,
  the footer the fanning pile, the event pages their four lit objects), per the media doctrine in
  [`event-object.tsx`](../../src/components/marketing/sections/events/event-object.tsx).
  Marks stay ACHROMATIC (white pencil, not the obvious red): there is no brand hue (bible 1).
  ★ **Nothing in the hero is lazy.** The sheet fills the first screen, so every
  one of its cells is above the fold, and `loading="lazy"` on half of them (on the reasoning that
  this is the LCP surface) is the wrong lever. Because the roll REPEATS, covering the unique
  pass costs six more small requests; `priority` stays at six, since a preload per frame would fight
  the LCP element for the same bandwidth.
  The h1 takes the **site ladder** (bible 5), not a ramp of its own (Will, 2026-08-29: "let's normalize the
  site ladder so that we don't have one unique size ramp for a utility page"), one step louder below
  `lg`; a photographic hero earns presence from the sheet, not a private step.
  Its full-bleed glass wash follows the crossfade note in [design-system.md](design-system.md).
  The scrim is tuned against PHOTOGRAPHY rather than dim DOM art: density plus a
  uniform 0.8 dim on hero frames is what lets the type win without crushing the images the page
  exists to show. Listings use ONE row design for every entry with contact-sheet frame numbers; the
  General Application's honesty lives in its DATA (no team at all, type "Always open", its own
  action label), because with a single real role a second container reads as inconsistency rather than
  distinction. The close points at **/contact**, not the product: the footer carries a product CTA
  immediately below. The HEADINGS have to tell the story alone, because people skim them and read nothing
  else: they run join our team → the best content gets lost in camera rolls → so we gather all of it in
  one place → and turn the best into a highlight reel → our core philosophy → we're hiring. Two traps
  to know: a bare "Most of it is never seen again" under a hiring headline reads as though
  our new HIRES vanish (so the heading names the photos and where they are lost), and the beats open
  with "So" and "And" so three captions read as one story. Headings also avoid the word "build", which
  otherwise runs three headings of four. Listings are individual CARDS on the house gray plate (`bg-muted/50`, the
  contact form's surface) that go to white card stock on hover, like a print picked up off the desk;
  the index and the facts share one ruled line across the card top, which is what gives it structure
  rather than three stacked text blocks. The close is a small FOLLOW-UP inside the roles section
  (smaller than a role title, tucked under the cards) rather than a CtaBand, whose heading scale
  shouted over the list it was meant to trail. The sheet's frame numerals and the role and philosophy
  indices all read on the body face with tabular figures (bible 7).
  **The philosophy indices are CIRCLED by the sheet's own `SelectMark`** (Will, 2026-08-29: "give
  it the page's vocabulary"). A bare 01/02/03 under a hairline is any startup's values grid, and that
  row is the one beat arguing in prose on a page that argues in photographs; the mark is not a
  new device, so one gesture repeats at three scales (hero frames, roll frames, indices), and it is
  true rather than decorative, since three principles survived a cut from four. Off the sheet it
  takes the SURFACE's ink (the base colour is the gallery's near-white, invisible on paper) and draws
  on its section's Reveal rather than the page-load clock a mark three screens down would waste.
  Copy single-source for the listings and the hub:
  [`careers.ts`](../../src/lib/constants/careers.ts), a content-policy `CLAIM_FILES` entry (the role
  page's apply-chapter notes are inline prose, like /contact's and /press's, and are covered by the
  neutralization fence that scans all of `(marketing)`); its `offer` block including "Competitive compensation" is KEPT by Will's ruling, the posting
  being meant to spark a conversation. **No `JobPosting` JSON-LD** while the listing is placeholder.
  **`/careers/[slug]` is a SPEC SHEET**: dark title block → a paper document
  (reading column beside a sticky spec rail, the same two-column family help articles and the legal
  shell use) → the application chapter on its own gray band. Each role carries an **EMBLEM** ([`role-emblem.tsx`](../../src/components/marketing/sections/careers/role-emblem.tsx)):
  an achromatic SVG plate (a film reel, an empty slide mount, the album grid) shown on its listing
  card and again as the avatar above its title, which the two pages **MORPH between** via the native
  View Transitions API ([`role-morph.tsx`](../../src/components/marketing/sections/careers/role-morph.tsx),
  mounted from a careers-scoped layout so the listener stays off every other route). The morph
  itself is the SHARED
  [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx), which the blog's
  cover morph also uses; a
  third morph is a config object, not a third copy. NOT React's `<ViewTransition>` (the reason is
  under the blog's cover morph below).
  The CSS is NAME-SCOPED because `::view-transition-*` are document-global like `@keyframes`, and the
  binding between a `name` and its rule is pinned by `marketing-css-policy.test.ts` (renaming one
  side alone drops the timing with no error). Emblems map by slug with a deterministic integer-hash
  fallback, so a new listing is never emblem-less and server and hydration agree; that fallback
  draws only from NEUTRAL kinds, because an unwritten role inheriting `reel` (the graphics role's
  mark) or `open` ("not a real vacancy") asserts something false. It carries NO photographic hero
  media, on purpose.
  The hub argues in photographs; this page is where somebody decides and wants information density,
  and a contact-sheet frame borrowed as a header is an image
  unrelated to the actual role, which reads as decoration. The restraint straight after a photographic hub
  is the point. Facts render as labelled pairs in the rail (a slashed inline run reads as a caption;
  a spec wants terms you can scan down), list items are ruled rows rather than dot-bullets, and the
  offer block keeps the green checks but takes a different SHAPE from the lists so three sections do
  not read as one column.
  ★ `lg:self-stretch` on the rail is load-bearing (the same trap as the help ToC:
  `lg:items-start` otherwise collapses the aside and sticky gets zero travel), and the rail is
  `order-first` on mobile so the facts precede the prose. The application chapter wraps the form in
  context (what we need / what you do not need / what happens next) beside it, and INVERTS the
  contact figure/ground: a white card on the gray band, because here the band is the separator.
- **`/contact`** — forms → deny-all
  `contact_submissions` / `job_applications` via a Server Action + the service-role admin client;
  best-effort Resend notify via `sendOnce` (see Gotchas; [`careers.ts`](../../src/lib/constants/careers.ts)).
  Contact's first field is a REQUIRED **topic Select** (single source
  [`constants/contact.ts`](../../src/lib/constants/contact.ts) — labels/icons/fastest-path hints; the zod
  enum + the `contact_submissions.topic` CHECK + the `[label]` email-subject tag + the `/admin/support`
  chip all read it, and a parity test pins the enum to the migration). Picking a topic swaps a deflection
  hint INSIDE the form. The form card is the STATIONERY NOTE on the Biograph gray panel (Will's
  composite ruling on the `contact-identity` touchpoint): `bg-muted/50` card + the photo postage stamp +
  the letterhead caption, with fields explicitly `bg-background` so white reads against the gray.
  ★ Radix Select gotchas: never pass a controlled `""` (it latches the placeholder
  over later programmatic values); the hidden native-select bridge emits an EMPTY `onValueChange`
  during mount cycles (drop empty emissions or programmatic pre-picks get clobbered); and render the
  trigger label yourself, because `SelectValue` cannot resolve a label while the popper items have never
  mounted. The page mounts `HelpPaletteProvider` itself (⌘K + an embedded hero search band work on
  /contact; the palette is already `portalSkinProps("paper")`), and the `?about=<slug>` handoff
  prefills subject AND pre-picks the topic via the exhaustive `CATEGORY_TOPIC` map (a new help
  category fails typecheck until mapped), applied via `form.reset` so "Send another" keeps the
  article context. The route stays static (window.location read on mount, allowlisted — never
  `useSearchParams`).
- **`/help`** + **`/blog`** — an in-repo **MDX content pipeline**: `content/*.mdx` + `gray-matter`
  + `next-mdx-remote/rsc` + **build-time zod frontmatter validation**. The generic core is
  [`content/collection.ts`](../../src/lib/content/collection.ts) (`loadCollection` + `slugify` +
  `extractHeadings` + `readingTime` + `escapeXml`); [`help.ts`](../../src/lib/content/help.ts) +
  [`blog.ts`](../../src/lib/content/blog.ts) are thin wrappers. Help is "the index
  of everything": a TEN-category
  lifecycle taxonomy (set up → invite → guests → album → share → reel → pay → account → trust → fix; each
  category carries a `feature` link up to its marketing rung; a new category must land WITH its first
  article, its emblem, its strip label + grid column, and its `CATEGORY_TOPIC` row on /contact, since the test
  requires ≥1 per category and the contact map is exhaustive by type) holding **59 answer-first
  articles**, every one checked against the shipped app. The guest lane is titled "For guests" (slug
  `guest-experience`) and `account-and-profile` is the tenth shelf (sign-in, name + photo, the handle,
  following, notifications). Frontmatter carries an optional `audience` (`host|guest|both`, default derived
  from the category), `plans` ("Applies to" badges in the In-short card's footer) and `action` (the one
  door under the short answer); `description` is capped at 200 (`HELP_DESCRIPTION_MAX`, wide enough for
  the lead to keep its second sentence). A ranked ⌘K **search palette** mounted from [`help/layout.tsx`](../../src/app/(marketing)/(cinema)/help/layout.tsx)
  ([`help-palette.tsx`](../../src/components/marketing/help/help-palette.tsx); pure fs-free scorer in
  [`help-search-rank.ts`](../../src/lib/content/help-search-rank.ts) — heading hits deep-link to sections
  only when they're the sole match reason, plus a static "Pages" tail onward to the site; the empty state
  offers the ten category chips and guest-voiced results carry a "Guest" tail) + the index
  sheet (numbered panes, DOM-art [`help-emblems.tsx`](../../src/components/marketing/help/help-emblems.tsx),
  a live-constants "numbers" strip, a one-line guest fast lane under the quick links; at ten categories
  the strip cells need `sm:min-w-0` or the desktop strip scrolls, and the sheet keeps its row parity by
  making the guest pane wide too; panes with 7+ guides split into two columns) + answer-first articles (the frontmatter
  `description` renders as the "In short" lead; scroll-spy ToC via pure `pickActiveHeading`; one delegated
  copy-anchor island; prev/next; keyword-scored related, where a candidate needs a shared
  keyword and the prev/next siblings are excluded, or Related duplicates pagination; an audience tag only when it says
  something the category chip does not; guest articles end on /how-it-works, the growth loop stated once; a
  Yes in the feedback row offers "Up next"; an honest feedback row handing misses to `/contact?about=<slug>`,
  which the static contact page prefills from an allowlist; `@media print` on the article page via
  `data-print-*` hooks, the day-of checklist being the guide a host prints). First-party MDX components
  ([`mdx-components.tsx`](../../src/components/marketing/mdx-components.tsx) — `Callout`, `AlbumShowcase`,
  `Steps`/`Step`, `Kbd`, `UiLabel`, `PlanBadge` (an outline pill, distinct from UiLabel's filled chip),
  `Path` (where-to-find-it chips), `Checklist`/`Check` (ticks persisted per article in localStorage, the
  drawn check; [`help/checklist.tsx`](../../src/components/marketing/help/checklist.tsx)), and a spec-inline
  family reading the `limits.ts`/`tiers.ts`/`lifecycle/*` single sources so numbers can't drift; NOTHING
  client-side may import it, it reaches `node:fs`) + a `prose-help` theme. Four tests hold the catalog
  honest: every article COMPILES as MDX (`help-mdx-compile.test.ts`; `blockJS` strips `{placeholder}`
  braces, so UI strings are quoted in rendered form), every `<UiLabel>` is a shipped app string
  (`help-ui-labels.test.ts`, whitespace-, tag- and apostrophe-normalized), every internal link and
  `#section` anchor resolves, and all eleven literal-referenced slugs are pinned. `/llms.txt` lists the
  first `LLMS_HELP_PER_SHELF` (4) articles of every shelf as title + link (the annotated form blew its
  budget at 59, and the bare list did too once the blog library sat beside it); `/llms-full.txt` keeps the
  descriptions.
  Help lives in the **(cinema) group** (dark overlay nav + dark stages; the reading
  bodies ride `PaperChapter`, the search card / emblem strip / In-short card are `surface-paper` islands,
  the strip and the article's In-short card STRADDLE the cinema→paper cut via negative margin). Shared help
  components live in [`components/marketing/help/`](../../src/components/marketing/help).
  ★ MOTION LANDMINE:
  `[data-mkt] .mkt-line` forces `display:block` (texts-reveal recipe, 0,2,1 specificity) and silently kills
  flex utilities on the same element, so center constrained children with `mx-auto`, never a parent
  `justify-center`.
  TWO FACES, AND ONLY TWO (bible 7, full text in
  [`design-system.md`](design-system.md)): there is no mono in the product, data reads on the body face
  with tabular figures, and every label, hint and descriptor is the `Caption` atom. The authoring brief lives at
  [`content/help/AUTHORING.md`](../../content/help/AUTHORING.md) (the map, the component vocabulary, the
  three-class numbers doctrine, the writing rules; it names the fences by pointer only, because the
  content-policy tests scan `.md` too and the brief must obey itself).
- **Blog.** In the **(cinema) group** like /help, so it opens on the dark stage and the reading
  half rides `PaperChapter`. **DISTINCTNESS FROM /help is the constraint**, because both
  hubs open dark: /help opens on an instrument (centred question, search field, emblem strip), /blog
  opens asymmetric on the lead story with a media wall beneath. No search field, no emblems, and the
  tag rail stays words-and-numerals only; an icon column there is the one move that collapses the
  two surfaces together.
  - **The index.** The Broadsheet masthead (a SMALL `Blog` h1 + a drawn `[data-mkt-rule]` hairline,
    a deliberate departure from the 4xl-7xl H1 ladder so the featured card owns the stage; the
    register is recorded in [`design-system.md`](design-system.md)) -> the newest post as a 21:9
    featured card STRADDLING the cinema->paper cut -> the library. The rail is a sticky margin index
    (counts from the full set, a 2px ink bar for active, never a fill); the library is 4/5 portrait
    `PostCard`s at 1/2/3 columns ([`components/marketing/blog/`](../../src/components/marketing/blog),
    shared with the post page's "Keep reading"). The masthead's right side is a subtle RSS
    `Subscribe`, the feed's only visible entry point; without it the feed is reachable through
    nothing but a `<link rel=alternate>`. Picking a tag runs the **two-beat set change** (`--mkt-set-*` in
    marketing.css: departing cards leave together, then a two-axis `useFlip` reorganizes the
    survivors), on page-neutral hooks, so any filtered collection can take it.
  - **Registered tags:** six ids in a zero-import registry
    ([`blog-tags.ts`](../../src/lib/content/blog-tags.ts); three AUDIENCES weddings / parties /
    corporate, three PURPOSES how-to / compared / product, each with a label and a one-line
    description). The frontmatter schema enforces membership, one or two tags, and at most one
    audience, so a typo fails the BUILD like `cover`/`author`. The rail prints LABELS in fixed
    registry order (a most-used-first rail reshuffles as posts land) while `?tag=` carries the id;
    the library heading is a label + description lockup whose height never changes under a filter
    (the unfiltered view carries `BLOG_LIBRARY_LINE`), because a height change there is what the
    set-change FLIP would animate as a jolt; the description re-mounts on the shared enter beat.
    The registry must stay import-free: it is reached by the "use client" island and PostCard
    (a test reads the file). "Keep reading" is SCORED (2 × shared audience + shared purpose,
    tiebreak nearest date), because same-tag-first funnels every audience's endings to its two
    newest posts; a test bounds any post to five recommendations across the archive.
  - ★ **The hero exists ONLY in the unfiltered view.** Lifting it permanently out of the filtered
    set renders EMPTY tags, because a hero can own tags no other post has (the derivations + the pin
    live in [`blog-index.ts`](../../src/lib/content/blog-index.ts); `normalizeTag` checks POSTS, not
    the registry, so a registered-but-empty `?tag=` also collapses to Everything). Filter state
    rides a shareable `?tag=` read through `useSyncExternalStore` (never `useSearchParams`: it would
    deopt the static route; a mount effect is banned by the react-hooks lint). **Pagination** is
    INVISIBLE below `POSTS_PER_PAGE` (12) and live above it; it rides `?page=` beside
    `?tag=` rather than `/blog/page/[n]` routes, which would multiply into tag x page URL space.
    ★ `paginate()` CLAMPS, because a stale `?page=` or a filter that shrinks the set under the
    reader (tag with 40 posts, page 4, pick a tag with 3) must land on a real page instead of an
    empty grid. The develop stagger (`--i`) is CAPPED at 5 on library cards: the staged lead holds
    6 so it lands last, and uncapped, a twelve-card page lands half its cards after the hero and
    replays a second-long muted hole on every filter change.
  - **Covers.** An optional frontmatter `cover` (a `MARKETING_IMAGES` id, refined so a typo fails the
    BUILD) over a stable slug-hash fallback in
    [`blog-covers.ts`](../../src/lib/content/blog-covers.ts).
    ★ The fallback is a pure function of the SLUG alone,
    because the obvious "walk the post list and hand out unused images" is deterministic but NOT
    stable and silently re-skins older posts on every publish. A crop ladder re-slices the same
    source so 11 images yield 66 distinguishable plates. Every library post SETS its cover, and a
    pure test pins that no photograph repeats beside itself (i+1, i+2 at two columns, i+3 at
    three) in the unfiltered wall on any page or under any tag filter, and that the hero is
    landscape (`wedding-petals`, the one portrait, bands in the 21:9 card and the OG crop).
  - **The ARTICLE** ("the print of the frame") opens on the same cover at the same slug-derived crop
    as the card the reader clicked, so the page reads as the card opening; the frontmatter
    `description` renders as the visible STANDFIRST (it previously appeared on the card, in metadata,
    in the feed and in llms.txt, everywhere except in front of the reader). The ending is deliberately
    TWO blocks: chronological neighbours, then related posts with those neighbours excluded
    (`getRelatedPosts(post, n, exclude)`), because on a small archive the two sets otherwise coincide
    and repeat a post within one screen. An optional frontmatter **`faq`** (1-8 plain-text items,
    schema-guarded against markup and test-guarded against typed numbers) renders as an always-open
    "Questions" `<dl>` outside the article body (an appendix, like Keep reading, so the spine measures
    the piece; appended to the ToC as `#questions`) and ships verbatim as `FaqPageJsonLd`: on-page
    Q&A plus assistant-retrieval data, NOT a Google rich result (withdrawn for non-authority sites in
    2023). Long-form reading components are shared with /help and live
    in [`components/marketing/reading/`](../../src/components/marketing/reading): `ArticleToc`
    (scroll-spy, plus the `progress` READING SPINE that **both** long-form surfaces take) and the
    delegated `HeadingAnchorsDelegate`. Both pages mark their body with the
    shared `ARTICLE_BODY_ID` so the spine measures the ARTICLE, never the page.
  - **THE COVER MORPH**: the card's photograph grows into the article's plate on navigation, via the
    **native** View Transitions API. The mechanism is the SHARED
    [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx);
    [`cover-morph.tsx`](../../src/components/marketing/blog/cover-morph.tsx) is three strings of
    configuration. One delegated island, so every card stays a server component. NOT React's `<ViewTransition>`: that needs
    `experimental.viewTransition`, which swaps the WHOLE app's React runtime from the pinned 19.2.4
    to 19.3.0-canary (measured with a probe build), a product-wide trade for a blog
    flourish, and a decision for Will rather than a round. Two traps: the delegate must intercept in
    the CAPTURE phase, because `next/link` preventDefaults on the anchor first and a bubble listener
    bails on `defaultPrevented` forever (the morph silently does nothing while the page still
    navigates perfectly); and the delegate, not the server render, must own the
    `view-transition-name`, because clearing it from an incoming cover is a mutation React will never
    undo (the `style` prop did not change), so the first morph otherwise disarms every one after it.
    The `::view-transition-*` rule in marketing.css is NAME-scoped and pinned by the CSS policy test:
    those pseudo-elements are document-global, exactly like `@keyframes`.
  - **Shared plumbing.** The byline is one component across the card, the featured card and the post
    header ([`post-meta.tsx`](../../src/components/marketing/blog/post-meta.tsx)) and reads **on the
    body face**: name+date+reading-time set in a machine face reads as a timecode and flattens the only
    human signal on the card. **ONE registered author**
    (`partyreel-team`, Will, 2026-08-28); named individuals are deliberately absent from
    the registry rather than dormant in it, since a dormant entry is what a content agent picks up by
    accident. Frontmatter `title` is capped at 80 chars as a LAYOUT contract (cards clamp to 2 lines,
    the featured card to 3), failing the build rather than shipping a silently cut title. Share
    surfaces are media-led: the OG card is the featured card (cover read off disk and inlined, never
    fetched, because `NEXT_PUBLIC_SITE_URL` resolves to PROD on preview builds) and the feed carries
    `<enclosure>` art sized by the route. Also: the client-safe author registry
    ([`authors.ts`](../../src/lib/content/authors.ts)), Article JSON-LD, per-post `next/og` cards, and
    the build-static **RSS 2.0 feed** (`/blog/feed.xml`, `dynamic="force-static"`, hand-rolled
    `buildBlogRssXml` that takes its site config as a param so it stays out of the env-validating
    `site.ts` + is unit-tested); `draft: true` posts are excluded from listing/sitemap/RSS. The author
    brief is [`content/blog/AUTHORING.md`](../../content/blog/AUTHORING.md).
  - **The library:** posts under the six tags, every marketed number reaching prose
    through the spec family in `mdx-components.tsx` (reel seconds, the Trash window, inactivity and
    over-cap days, plan storage/prices, the capacity rule of thumb via `formatCapacity`; a test
    scans bodies for a typed size, price, or limit-beside-its-unit). GFM tables render with a
    scrolling wrapper, /pricing's header register and a nowrap label column; `<Yes />` / `<No />`
    are the /pricing matrix's own glyphs through the shared `MatrixMark`. Comparison content names
    INCUMBENTS only (Google Photos, iCloud, WhatsApp, iMessage, AirDrop, email, Dropbox, disposables,
    booths),
    hedged; QR-app rivals stay category-level per the posture ruling. `/llms.txt` lists
    the newest `LLMS_BLOG_LIMIT` (8) posts, because the whole archive outgrows the 16k lean budget, and
    `/llms-full.txt` all of them. The four placeholder slugs 308 to their successors via
    [`blog-redirects.ts`](../../src/lib/content/blog-redirects.ts) → `redirects()` in
    `next.config.ts` (test-held against the live slugs).
- `/pricing`, legal. The header `Resources ▾` + footer Resources column group Help + Blog + Press + Contact
  (a two-way Vitest mirror: change one side and you must change the other). **ONE IDEA, ONE PAGE, TWO DOORS
  TO IT** (`two-doors=one`, Will 2026-09-19): the Resources panel's featured card is the PRIMARY door to
  `/how-it-works` and the Features panel's footnote is the quieter second one. The help article
  `how-partyreel-works` is linked from NOWHERE in the chrome; it keeps its row under Help center, the
  walkthrough's own foot link and the help hub's.

**THE FOOTER (the ink slab).** One always-dark surface under BOTH skins (`--gallery*`, never a
nested `.dark` — see [design-system.md](design-system.md) for the token-redeclaration trap it hides).
Three registers: the demo invitation (a server-rendered scannable QR on a fanning pile of event
photos, pointing at `DEMO_EVENT_URL`, desktop-only since you cannot scan your own screen), the index, and a
legal bar. ★ **THE ACTION IS NOT PART OF THE INVITATION** (`foot-door=always`, Will 2026-09-19): the
secondary `Start free` sits ABOVE the `if (!DEMO_EVENT_URL)` early return and at every width, one rule in
both states, because `/about`, `/press`, `/careers`, the legal pages and the 404 carry no `CtaBand` and
used to end with nothing to do at all whenever the demo token happened to be unset. The invitation still
stands down with the demo; the action never does. A turbulence-warped seam glow on the ratified
confetti palette turns the top edge into spilled light instead of a hard cut.

IA is four columns beside the brand block: **Features** · **Events** · **Product** (How it works ·
Pricing · The reel · FAQ) · **Resources**, with About + Careers as Resources' TAIL under a hairline
and the legal bar owning `FOOTER_LEGAL` (Privacy + Terms) plus `/llms.txt`. Features and Events
carry their hub on the column TITLE (a `href` on the column, rendered with a hairline underline that
brightens on hover) rather than spending a row on "All features": the directory sits where the eye
already lands, and the underline is the only signal separating a linked title from an unlinked one. **Nothing is
collapsed** (Will): Features and Events are
the most core marketing page families and folding them behind chevrons buries them, while the whole
sitemap is small enough to show at once. A Vitest pin guards against an accordion returning. Privacy
and Terms live in the legal bar rather than under a Company column, which is what a sixth column
forced when it wrapped at 1440. The brand block carries the wordmark (no mark tile: its filled
square clashes with the QR plate above), the thesis, and the assistant row.

The root 404 renders the same footer, but outside `(marketing)`: `marketing.css` never loads there,
so the glow and the photo fan simply do not fire. Anything the footer needs in order to not BREAK
there (the stack's absolute positioning, the slab's tokens) is therefore carried on the components
themselves, never inherited from that sheet.

## SEO / OG

`metadataBase` is set in the root [`layout.tsx`](../../src/app/layout.tsx) (`env.NEXT_PUBLIC_SITE_URL ??
"https://partyreel.com"`); WITHOUT it Next errors on relative OG URLs. OG images are **code-generated via
`next/og`** ([`opengraph-image.tsx`](../../src/app/opengraph-image.tsx) site-wide + a per-event card at
`(guest)/e/[token]/opengraph-image.tsx`). `sitemap.ts`/`robots.ts` list/allow ONLY the marketing routes
(sitemap `lastModified` carries help/blog frontmatter dates; build time elsewhere).

**The AI-discoverability layer:** `/llms.txt` + `/llms-full.txt` (the
llmstxt.org format) are built by pure fns in [`content/llms.ts`](../../src/lib/content/llms.ts)
(numbers derive from `tiers.ts`/`limits.ts`; the builders are content-policy `CLAIM_FILES`, so the
social-proof + backstop fences cover the AI surface; link integrity is unit-tested against the real
routes) and served by force-static routes (the RSS pattern). `robots.ts` names 14 AI crawlers with
explicit allow blocks (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, ...); a
`SoftwareApplication` schema mounts sitewide beside Org/WebSite (offers = the shared
AggregateOffer; NO ratings/reviews, because absent beats fabricated). Posture (Will, 2026-08-28): the
comparison content stays CATEGORY-level, never rival brand names; the honest when-it-is-not section
is deliberate credibility, don't "fix" it into pure praise. The press boilerplate + fact sheet live
in [`constants/press.ts`](../../src/lib/constants/press.ts) (one quotable home: /press + the llms
builders).

**`/press` = THE CONTACT SHEET.** In `(cinema)` on the utility-page rhythm above:
masthead hero, then ONE `PaperChapter` carrying the whole body. The page is titled **"Press"**
everywhere (header panel, footer column, /contact directory, title, breadcrumb, H1, OG card): a
"Press & brand" combo is two labels for one page and "brand" does no work a reporter needs. Hero =
the shared `PageHero` at `scale="display"`, eyebrow "Media assets" over H1 "Press" (both hoisted to
constants in the page).
**AT THE DISPLAY STEP, THE H1 MATCHES ITS NAV LABEL** (bible 6; Will, 2026-08-29).
A 160px masthead is the loudest promise on the page, so it has to be the word the reader
just clicked; a link reading Press over a masthead reading "Media" lands as a non-sequitur. Anything
more specific belongs in the EYEBROW, which carries no word limit (the H1 does: see page-hero.tsx).

**The sheet** is the kit as a photographic proof sheet: eight numbered frames on the 3px
`--gap-gallery` album grid, opening the paper body rather than riding in the dark with the hero, so
the body reads as one continuous surface. The frames are deliberately NOT all the same kind of thing
(artwork, an app icon, the share card, a working QR, the ink, the type), because a uniform grid of marks is a
downloads table wearing a metaphor; do not "tidy" it. EVERY FRAME IS OURS (bible 18): no stock event
photos ("just feels weird to say here's a random stock photo", Will), and a press page must not hand
a publisher media whose rights we do not hold.
Plate by LEGIBILITY, not variety: white behind ink-drawn artwork, ink behind white-drawn artwork.
★ The two plate grounds are LITERAL colours (`PLATE_PAPER` / `BRAND_HEX`), never theme utilities: a plate
is the artwork's own ground, and following a token flip hides the artwork on it. THE REBATE: the grid paints `--border`
and insets itself by the same `--gap-gallery`, so every gap is a hairline; outer inset and inner gap
are one value or it stops reading as a rebate.

**The body is a sticky two-column spine**: Assets / Words / Fact sheet pinned left, their content on
the right, each one a deep-link target. Every section's content ends at ONE SHARED RIGHT EDGE and the
narrower ones simply START further right (`lg:ml-auto` against a width cap) rather than widening, so
the gap between a pinned heading and its answer grows with the viewport while the reading measure does
not. Words and the fact sheet share one `max-w-2xl`. Each pinned column carries a pointer under its
note (the kit download, then /contact, then /how-it-works), and the glyph follows the ACTION rather
than variety: navigation takes `LearnChevron`, a download takes the hero's down arrow. The close is
centred, so the spine resolves before the cut to the footer. No brand-guidelines section, by ruling —
clear space / minimum size / misuse are brand-book material; only the two press-business usage points
(quoting needs no permission, how to write the name) ship, as quick hits beside the copy they govern.

The kit is manifest-driven (`PRESS_KIT` + `scripts/build-press-kit.mjs` + `scripts/build-press-qr.mjs`
+ the committed zip, guarded by `press-kit.test.ts`, which parses the archive back and CRC-checks
every member against the files on disk), so the pre-launch logo change is a files-and-rows edit with
no component work.

**The promise-neutralization doctrine (Will, 2026-08-28):** published copy commits to OUTCOMES (a
reply, a review, host control), never to WHO or WHAT delivers them (no "a real person answers", no
"a human reviews every report", no "never an automatic takedown", no "business day"), so support and
moderation tooling can evolve (AI first-gates included) without breaking published, especially legal,
language. The standard reply line, verbatim everywhere a reply is mentioned: **"Every note gets a
reply, usually within a day."** The moderation stance is actor-free: review-before-removal +
host-moves-fastest ([`report-review.tsx`](../../src/components/marketing/sections/features/privacy/report-review.tsx)),
never "People, not machines". Enforced by the third content-policy fence
([`content-policy.test.ts`](../../src/lib/content-policy.test.ts)): a phrase-list scan over ALL of
`src/app/(marketing)` + `src/components/marketing` + `src/lib/constants` + MDX — deliberately narrow
so the guest-attribution line ("every upload has a real person behind it") and careers'
"We read every application" stay legal on purpose.

## Gotchas (why it's like this, don't revert)

- **A public form's ROW is authoritative; its email is best effort.** The Server Action inserts into the
  deny-all table (`contact_submissions` / `job_applications`) on the service-role admin client FIRST, then
  attempts the Resend notify inside a try/catch (`sendOnce`, `dedupeKey` = the row id so a double submit
  notifies once, `replyTo` = the submitter). A missing key, an unconfigured inbox or a failed send is
  logged and swallowed: it never changes what the visitor sees, and the submission is already queryable.
  There is no anon RPC and no anon grant behind any of it, so a public form adds no anon-executable
  surface. The hidden `website` honeypot returns SUCCESS without storing, so a bot learns nothing. Display
  and routing are deliberately separate: the address shown is the `SUPPORT_EMAIL` constant, the
  destination is the optional `CONTACT_NOTIFY_EMAIL` env, so moving the mail is an env swap rather than a
  code change. Resend **Inbound** stays unused on purpose (webhook-only ingestion, no mailbox); the
  destination is a real receiving inbox.
- **The MDX pipeline is in-repo by choice, and stays JS-free.** `content/**/*.mdx` is versioned with the
  code, so publishing an article is a deploy: the accepted price of running no CMS for a curated,
  engineering-authored library. `@next/mdx` (file as route) was rejected because it cannot list or filter a
  collection by frontmatter, which the index, the search, the sitemap and related-articles all need;
  `gray-matter` lists cheaply with no compile, `compileMDX` renders one body. `blockJS` stays ON, which
  strips raw `{expressions}` while preserving JSX components: that is why every live number rides a spec
  component reading the `tiers.ts` / `limits.ts` single sources instead of an expression. Articles are
  first-party and build-compiled; untrusted input must never be fed to MDX. Heading ids come from the ONE
  in-repo `slugify` that `extractHeadings` also uses (no `rehype-slug`), so an anchor and the on-this-page
  ToC cannot drift apart.
- **The `next/og` images load NO font.** The built-in font dodges the Next-16 satori font gotcha. Don't add a custom font loader.
- **A count can glue itself to its noun.** Next 16's SWC drops the LEADING whitespace of a JSX text run
  that both spans more than one source line and holds an HTML entity (`&rsquo;`, `&nbsp;`), so
  `{n} marketing pages` renders "24marketing" in exactly that case. tsc does not reproduce it, and a
  prettier reflow can create the shape in a file nobody meant to change. Put an explicit `{" "}` after
  the expression, or keep the run on one line. (The guard that caught it scanned only the media kit's
  own board, and went with it on 2026-09-17.)
- **The event page emits OG tags but `robots: { index: false }`.** `/e/[token]` sets `generateMetadata`
  (event name/description + the per-event OG) so links unfurl in chat, but the opaque `qr_token` must NEVER
  be indexed. `robots.ts` also disallows `/e/`, `/dashboard`, `/admin`, `/login`, `/auth`, `/api/`. The
  guest query `getEventByQrToken` is wrapped in React `cache()` so `generateMetadata` + the page + the OG
  image share one RPC per request.
- **404: the double-chrome boundary.** Five `not-found.tsx` (root catch-all + one per route
  group) share ONE animated core ([`not-found-screen.tsx`](../../src/components/shared/not-found-screen.tsx),
  presentational, NO `Container`/chrome; since `errors-wiring` (2026-09-19) it takes `visual` OR `icon`, a
  `help` line and, on the crash screens only, a `digest`; the strip stands where the icon was on the group
  404s and the marketing 500, the root 404 keeps `Compass` over its trail, and the marketing 404 alone has no
  help line because its actions and footnote already name help and contact). The root
  [`not-found.tsx`](../../src/app/not-found.tsx) renders its OWN `MarketingHeader`/`Footer` because UNMATCHED
  URLs fall through to `app/layout.tsx` with no group chrome (on the admin build it branches on
  `surface() === "admin"`, inlined at build time, to the portal's own screen with no marketing chrome and one
  link to `/admin`; no route and no proxy change); but a `notFound()` thrown INSIDE the marketing group renders the root boundary INSIDE
  `(marketing)/layout.tsx`, which ALREADY renders header/footer → the chrome **double-stacks**. So a
  [`(marketing)/not-found.tsx`](../../src/app/(marketing)/not-found.tsx) boundary renders ONLY the
  centered content (lost-visitor copy single-sourced in
  [`marketing-not-found.tsx`](../../src/components/marketing/marketing-not-found.tsx)).
  ★ The marketing pair is LOPSIDED: `(cinema)` catches every dynamic marketing route
  (events, help, blog, careers) and `(paper)` catches NO `[slug]` at all, holding only `/contact`.
  Do not delete the paper one for having no slug: a static page can call `notFound()`, and
  without the boundary that render falls through to the ROOT one and double-stacks the chrome.
  By audience: root
  (unmatched URL, brings its own chrome), marketing (bad `[slug]`, no chrome), guest (dead/expired event link
  → reassure + a "What is Partyreel?" CTA + the demo, minimal `Logo` header), host (inside the authed
  `AppShell`), admin (inside the MFA-gated `AdminShell`). All five → single chrome, 404 status + `noindex`.
- **Local-dev OG host:** in `pnpm dev` the emitted `og:image` URL shows the `localhost:3000` host (Next
  resolves metadata against the request origin in dev) while `sitemap.ts`/`robots.ts` show the
  `partyreel.com` fallback. That is not a bug; prod (with `NEXT_PUBLIC_SITE_URL` set) resolves correctly. The
  per-event OG URL carries a Next hash suffix (`…/opengraph-image-<hash>?…`), so read the real URL from `<head>`.

## Interactive demo (marketing side)

Env-gated, no schema change. A real curated event's `qr_token` is set in `NEXT_PUBLIC_DEMO_QR_TOKEN`
(public). **GOTCHA: it must be referenced explicitly in [`env.ts`](../../src/lib/env.ts)'s `parsePublic()`**,
because Next only inlines literally-named `process.env.NEXT_PUBLIC_*`: added to the schema but not its
reader, it stays `undefined` in prod. [`demo.ts`](../../src/lib/demo.ts) is the single source
(`DEMO_EVENT_URL` + `isDemoToken`). When set: the `/features` hero QR + a home-hero "Try the live demo" CTA
become real links; unset → no demo anywhere (decorative QR, no CTA). The guest-page demo-mode behavior is in
[guest-flow.md](guest-flow.md).

## See also

[host-app.md](host-app.md) (the in-app QR designer / how-it-works single-source) · [notifications-analytics-growth.md](notifications-analytics-growth.md) (guest email capture / OG-driven growth).
