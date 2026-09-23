# Marketing site, content & SEO

> ROLE: the public `(marketing)` site, its content pipelines, SEO/OG, the 404 boundaries, and the marketing side of the demo.
> BELONGS HERE: the marketing pages + nav, the frame library, the MDX help/blog pipeline, metadata/OG/sitemap/robots, the 404 system, the demo env wiring. · NOT HERE: the guest demo-mode behavior (→ [guest-flow.md](guest-flow.md)), the QR designer used in-app (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

The public `(marketing)` route group serves the marketing site on the shared domain, the help center and blog
included. Nav is single-sourced ([`marketing-nav.ts`](../../src/lib/constants/marketing-nav.ts)) and consumed by
the config-driven [`marketing-header.tsx`](../../src/components/marketing/chrome/marketing-header.tsx) (desktop
mega-panels in [`marketing-nav.tsx`](../../src/components/marketing/chrome/marketing-nav.tsx) + a full-screen
mobile menu in [`mobile-menu.tsx`](../../src/components/marketing/chrome/mobile-menu.tsx)) and the ink-slab
[`marketing-footer.tsx`](../../src/components/marketing/chrome/marketing-footer.tsx); both render only **live**
routes.

**The nav.**
★ `PRIMARY_NAV` order is load-bearing, because Radix derives the cross-slide from adjacent items' index delta.
The three PANEL groups (Features · Events · Resources) stay CONTIGUOUS and Pricing stays last as the only flat
link, or one pair of panels loses its sweep (a Vitest pin holds the order). The panel sits on the floating-layer
contract ([design-system.md](design-system.md)); its clocks are `--mkt-dropdown-*` / `--mkt-nav-*` on
`[data-mkt]`, and `--mkt-dropdown-open-ms` is shared by the enter animation, the box morph and the cross-slide so
they cannot drift apart. JS reads hover intent (`--mkt-nav-intent-ms`) through `readCssMs`, never `parseInt`. The
measured indicator ([`nav-indicator.tsx`](../../src/components/marketing/chrome/nav-indicator.tsx)) draws the
pill or the underline (`NAV_INDICATOR`); the panel's `transform-origin` comes from the open trigger's own rect,
which `handleValueChange` writes as `--mkt-nav-origin-dx` for the viewport. **Every chrome clock carries a
`var(…, fallback)`**: the root `app/not-found.tsx` renders this header WITHOUT marketing.css, where a bare `--mkt-*`
is silently unset. The header's glass is an inert `-z-10` layer whose opacity animates
([`header-shell.tsx`](../../src/components/marketing/chrome/header-shell.tsx)); the bar itself never carries
`backdrop-filter`, or every panel repaint happens inside a blurred region.
★ **The bar hides by transform alone, never by height.** It leaves going down and returns coming up, on both
postures; `--mkt-header-h` stays `4rem` and the sticky `z-40` box never moves, because ~14 consumers derive from
that one knob. It leaves once the reader commits 8px past a one-header-height reveal zone, and returns on ANY
upward movement, at the top, and on `:focus-within`; it never leaves with a nav panel or the phone sheet open. The
hide and its three escapes are ONE compound selector, so no utility ordering decides them. `-translate-y-full`
writes the standalone `translate` property, so the clock is `transition-[translate]`, never
`transition-transform`. The header's one scroll listener (passive, rAF-coalesced, attached only while read) lives in
[`use-scroll-direction.ts`](../../src/lib/shared/use-scroll-direction.ts), because direction is the one thing an
IntersectionObserver cannot report; the glass keeps its observer (the article reading spine and the root 404's
trail keep scroll listeners of their own).
★ **The header's right cluster reads the session on the client, from a cookie, so every marketing route stays
prerendered.** [`session-hint.tsx`](../../src/components/marketing/chrome/session-hint.tsx) runs on
`useSyncExternalStore` with the SERVER SNAPSHOT `false`: ~50 prerendered routes ship the stranger's Log in and
Start free pair, and a signed-in host's single `Dashboard` lands before paint (the phone sheet's foot swaps with
it). One `getUser()` in the chrome would make every one of those routes dynamic. The signal is the
`sb-<project-ref>-auth-token` cookie in `document.cookie` (`@supabase/ssr` defaults `httpOnly: false` and
`createBrowserClient` keeps the session in `document.cookie`, so `updateSession` needs
no presence cookie). ★ A HINT, NEVER AUTHORIZATION: the `(app)` layout's `getUser()` and RLS under it are the
boundary, and both wrong answers land the visitor on `/login`. **Brand = the app's design system turned up**:
the ACHROMATIC base (`--brand` aliases ink and there is no brand hue; [design-system.md](design-system.md) is
authoritative), media is the color, and marketing runs louder through type, layout and motion only (motion
follows the in-repo `emil-design-eng` skill). One `SITE_URL`/brand constant ([`site.ts`](../../src/lib/constants/site.ts), incl.
`BRAND_HEX`, a literal hex because satori reads no CSS token) feeds `sitemap.ts`, `robots.ts` and the root
`metadataBase`.

★ **Never promise "no account", anywhere.** Require verified emails defaults ON for a new event, so the claim is
**"No app required."**, never "No app, no account." It runs across the OG cards, the trust strip, the footer,
`events.ts`, `press.ts`, `careers.ts`, the JSON-LD `featureList`, the guest door, and the help and blog articles
(`llms.txt` says "no app to install and no password to invent", then names the email code). One line still breaks
the rule: the /blog index's closing CtaBand ships "No app or account for your guests."
**"No app"
STAYS** as a benefit; the fence is only on defining Partyreel AGAINST another product ("we're not cloud
storage"), never on naming an absence a guest is wary of (bible 20). A line that PROMISES a guest needs no account
goes; one that describes the per-event switch truthfully, or reports a different act (reporting is anonymous, the
demo opens with no sign-up), stays. ★ The expensive case is a **suggested host announcement**: a help or blog
line handing a host "no sign-up" becomes a support question a hundred times over once their event asks for an
email, as [`conference-photo-sharing-no-app.mdx`](../../content/blog/conference-photo-sharing-no-app.mdx) warns.
Every ruled line and the rule itself live in [`marketing-voice.ts`](../../src/lib/constants/marketing-voice.ts)'s
head comment.

**A SUBHEAD RUNS OPPORTUNITY → WHAT WE DO → BENEFIT.** `SITE_SUBHEAD` is the model: the reader's opportunity
(their guests already shot the best photographs), what we do in one clause with no mechanism, then the failure it
spares them; the QR code is the page's job below the fold. **AN EMPTY STATE NAMES WHAT IS ABOUT TO EXIST**, with
the album as the noun and "starts" as the verb ("Your first album starts here" for a host with no events, "The
album starts with you" for a guest in an empty album), so it invites the first upload rather than waiting for one.

## Pages + their single-sources

Each entry below names a marketing page's copy single-source and the traps its layout carries.

- **home**: [`section-ids.ts`](../../src/components/marketing/sections/home/section-ids.ts) is the one source of
  the fifteen sections' order and surface (cinema or paper), Vitest-pinned; consecutive paper ids render inside
  one `PaperChapter`, and the section headers read `SECTION_HEADERS` in `marketing-voice.ts`.
  [`features.ts`](../../src/lib/constants/features.ts) (`FEATURE_GROUPS`) and
  [`features-layout.ts`](../../src/lib/constants/features-layout.ts) (`FEATURE_PRESENTATION`) are dead scaffold:
  only their own test reads them.
- **THE FEATURE FAMILY (the hub + six pages on the home page's grammar).**
  Identity single-source: [`feature-pages.ts`](../../src/lib/constants/feature-pages.ts) (`directoryLine`, the
  hub door's line, is written as one set in one length band so the six doors wrap alike, apart from each page's
  own `heroSub`; no test pins the band).
  The hub `/features` is a DIRECTORY of **photographic doors**
  ([`feature-door.tsx`](../../src/components/marketing/sections/features/shared/feature-door.tsx), the home event
  cards' anatomy), the reel leading full-width. Each door wears its feature's own photograph and a chip its surface
  really draws (the live dot, the approved check, the name chip, the lock, the play badge); the QR door streams the
  album out of a real scannable code between the two scrims, its white plate over everything because a scrim over
  white greys it. The same doors close every
  page ([`related-features.tsx`](../../src/components/marketing/sections/features/shared/related-features.tsx)), so
  the site has ONE picture of each feature. Every hero but /qr's composes `PageHero` on the cut (the H1 static,
  [design-system.md](design-system.md)): guests and sharing stage their object under a `ScreenLamp` (the page's one
  lamp, sampled from its own frame), the album hero lights its live album with a halo instead, and curation and
  privacy open plain on purpose. /qr's hero stays bespoke because its plate sits beside the lockup, and `PageHero` owns
  only the type lockup. The eyebrow is the page's own label alone, never a "Features ·" breadcrumb half.
  **`/features/album` is the model for the others**, designed from a first-time host's questions outward with
  light tie-ins to the neighbouring features: cinema (the hero, getting in, everywhere, the numbers), a bare
  photograph between the chapters, ONE paper chapter as the host's desk (your call, names, who can open it, taking
  it home, how much fits, it stays), then the doors, nine questions and the band. Every app string is quoted and
  pinned by `mock-parity.test.ts`.
  ★ The album page keeps six product facts true to the shipped app, and each is an easy one to get wrong. Require
  verified emails defaults ON for a new event (never "no account by default"); every upload carries a name (with
  the switch off, a typed display name wearing a small unverified mark), so no surface calls an upload or a guest
  anonymous; a guest deletes their own upload and it leaves the album at once; a private page shows no name and no
  count (the name + count tease is the PASSWORD state); no big-screen mode exists (the album in any browser is the
  claim); nothing is locked or hidden at lapse. Every figure derives from `tiers.ts`, `limits.ts` and the lifecycle
  constants ([`over-cap.ts`](../../src/lib/lifecycle/over-cap.ts), whose grace numbers the cron reads too, and
  `recently-deleted.ts`). The hero is the live guest album itself
  ([`album/arrivals-hero.tsx`](../../src/components/marketing/sections/features/album/arrivals-hero.tsx): the
  shared hero lockup over the shipped guest masonry, photographs falling in from behind). "Land once, show up
  everywhere" runs one `useAlbumFill` into a laptop and a `PhoneShell`, so a tile lands on both in one commit
  ([`album-fill-grid.tsx`](../../src/components/marketing/sections/features/album/album-fill-grid.tsx) over
  [`use-album-fill.ts`](../../src/components/marketing/sections/features/album/use-album-fill.ts): the guest
  album's arrival grammar, newest-first with older tiles sliding down on `useFlip`, the ~2.5s green check, the live
  "N photos & videos from M guests" line and a progress strip on uploads still in flight, all from ONE tick and a
  pure derivation the test pins).
  ★ The fill grid's FLIP wrapper carries no transform of its own, and its `layoutKey` is the mounted count, never
  the tick. The entrance lives on the inner element and the beat stays above `--tune-reorder-ms`, or a landing
  re-runs the layout effect mid-slide and snaps the column. No "Just added" chip and no "Maya added 3" toast:
  neither has a product surface behind it. **Each page is a three-chapter attention arc** (design-system.md
  "Chapters"): cinema, then ONE paper chapter with a bespoke opener (the print stock STRADDLES the cut on /qr, the
  guest-list card on /guests; the Live or Review switch, downloads, the queue and the access switch open a tier up
  on the cut elsewhere), then a close that opens on the doors band and winds down through the FAQ to the CtaBand.
  The doors band takes `opener={false}` where the close already opens on its own beat (/qr's entry flow), because
  two openers back to back are noise. The FAQ band
  ([`shared/feature-faq.tsx`](../../src/components/marketing/sections/features/shared/feature-faq.tsx)) emits the
  FAQPage JSON-LD itself and takes the GoDeeper row as children; a page's FAQ list (its `*-faq.ts`, or an array in
  the page) is data only.
- **`/events`**: a landing hub + 4 umbrella pages (weddings/parties/conferences/trips) off ONE `[slug]` template.
  ALL copy AND per-type media live in [`events.ts`](../../src/lib/constants/events.ts) (`EVENT_TYPE*`, named apart
  from the real `events` domain, and `EVENTS_HUB`). ★ `media` is the single home for a per-type photograph
  (`card` / `turn` / `object` / `statement`): no component names a still of its own. **The arc:** `PageHero` on
  the cut (its eyebrow links back to the hub) staging ONE lit object per type
  ([`event-object.tsx`](../../src/components/marketing/sections/events/event-object.tsx)) under
  `SectionLight placement="room"` → the statement, still dark
  ([`event-statement.tsx`](../../src/components/marketing/sections/events/event-statement.tsx), one claim on the
  `chapter` step, the type's long tail, `nestedThemes`, as one running line under a hairline, never a chip row that
  reads as a tag cloud) → the turn ([`event-turn.tsx`](../../src/components/marketing/sections/events/event-turn.tsx), a
  full-width photograph that IS the chapter cut) → ONE `PaperChapter` holding
  [`built-for.tsx`](../../src/components/marketing/built-for.tsx) alone → the door proof
  ([`event-door.tsx`](../../src/components/marketing/sections/events/event-door.tsx)) → the FAQ → `CtaBand`. The
  hub keeps an ALL-DARK arc (no planning document to earn a light chapter), wears the cross-event object, and has
  its own `opengraph-image.tsx`.
  ★ **Every event object carries the demo's real code, and never a dead link.** All five pages server-render it
  the way [`footer-qr.tsx`](../../src/components/marketing/chrome/footer-qr.tsx) does (`qrcode-generator` is
  DOM-free, so the matrix ships as inert markup at zero client JS), encoding `/demo` at 25 modules, never the event
  link. With no demo configured each object DROPS the piece that carries the code (the badge falls back to its
  drawn cells) and the door proof loses its door (the `DemoCtaLink` contract).
  ★ **The prints are literal `bg-white`, never `bg-card`.** These still lifes stand on the cinema ground, where the
  card token is near-black: a paper border in it renders as a GAP and six prints read as a thumbnail strip. The
  wedding album's dark channel between its two ivory pages IS the spine. **One card anatomy at two sizes**
  ([`event-type-card.tsx`](../../src/components/marketing/sections/events/event-type-card.tsx)): the photograph IS
  the card for all four types (`aspect-4/5`, the ruled `CARD_COPY_SCRIM`), worn by the hub's
  [`type-directory.tsx`](../../src/components/marketing/sections/events/type-directory.tsx) (2x2, tilted) and the
  home's [`events-teaser.tsx`](../../src/components/marketing/sections/home/events-teaser.tsx) (four up, no tilt).
  Conferences and trips carry a NAMED STAND-IN still (`reception-hall`, `festival-crowd`) until their own land
  ([ASSETS.md](../ASSETS.md)); the artifacts
  ([`event-artifacts.tsx`](../../src/components/marketing/sections/events/event-artifacts.tsx)) remain only where
  a photograph cannot do the job (the conference badge, and the filling pane where `media.statement` is null).
  **At 375** the lockup takes `subheadShort`, the hero's padding closes to `pt-10 pb-0` so the object CROSSES the
  fold, and the FAQ-to-close gap halves below `sm` (`max-sm:pb-10` / `max-sm:pt-10`). The FAQ is
  `faq-accordion.tsx` (native `<details>` only), and each page mounts `FaqPageJsonLd` over the same items itself.
- **Media-frame library** ([`frames/`](../../src/components/marketing/frames)): a `BrowserFrame` base + a
  vocabulary (`AlbumFrame`/`GalleryFrame`/`ReelFrame`/`PhoneFrame`/`QrFrame`), never one visual reused.
  `QrFrame`'s `liveQrUrl?` renders a REAL scannable QR
  ([`live-qr.tsx`](../../src/components/marketing/frames/live-qr.tsx) wrapping `StyledQr`) when the demo is set,
  else a decorative block.
- **`/how-it-works`**: THE LOOP AS SIX STEPS in one scroll under a Host/Guest toggle.
  [`how-it-works.ts`](../../src/lib/constants/how-it-works.ts) is the ONE source of both step sets, read by the
  page, the home's overview stepper
  ([`how-it-works-stepper.tsx`](../../src/components/marketing/sections/shared/how-it-works-stepper.tsx), under the
  film strip) and the app's welcome tutorial (the host's first three). Twelve bespoke pictures
  (`sections/how-it-works/host-pictures.tsx`, `guest-pictures.tsx`); the proof is the demo as a finished album with
  a real code encoding `/demo`; one folded close. The pair is named apart: the spine's foot links the help article
  as "Read the full how-to", and the help hub links this page as "See the loop, start to finish".
- **`/pricing`**: THE MONEY PAGE, and the one (cinema) page with NO dark hero: ONE paper chapter (the words at the
  chapter step, the Free/Pro pair, the Event Pass, **the configurator closing it**), then one unbroken dark room
  (the unlock tiles as its opener, the matrix, the FAQ, the band). ★ THE ORDER IS DELIBERATE: a reader sizes their
  event while the pair is still in their eye, and "Where Free ends and paid begins." opens the room that proves
  it; `pricing-page.test.ts` pins both halves. ★ It stays in **(cinema)** although it opens on paper, because a
  page cannot flip its header from inside (bible 16) and globals.css refuses `.dark` inside `.surface-paper`: the
  paper group would buy a white bar and cost every dark chapter below it. Pro's size is a **slider whose stops are
  `plansForTier("pro")`** (never a typed range) under the cadence toggle; the Pass is a wide **ticket** carrying
  the pair's own `StatRow` (imported from `plan-cards.tsx`, never copied). **The configurator**
  ([`configurator.tsx`](../../src/components/marketing/sections/pricing/configurator.tsx)) is two planes in one
  bordered panel: the controls on white inside a `bg-muted` recess, and the elevated half framing one
  photographed plan card. They CANNOT be two card fills, because on Pearl `--card` and `--background` are the same
  white and `bg-muted` is the only real step.
  [`recommend.ts`](../../src/components/marketing/sections/pricing/recommend.ts) (pure, unit-tested) alone picks
  the plan; the card wears the pair's `PhotoStack`, whose deck fans a print at a time as the slider climbs. The FAQ
  is **six** questions in
  [`pricing-faq-data.ts`](../../src/components/marketing/sections/pricing/pricing-faq-data.ts), the one list the
  accordion AND the `FAQPage` JSON-LD read. At 375 the plans STACK, never swipe cards (scrolling is far more
  common than swiping, and a swipe card gets missed). `shared-band.tsx` is dead: nothing imports it.
- **`/privacy` + `/terms`**: THE LEGAL DOCUMENTS, formal but readable: every section carries an "In short" line
  beside the formal text. Single-sources: [`legal.ts`](../../src/lib/constants/legal.ts) (version, date, `status`,
  the bracketed `LEGAL_PARTY` launch placeholders, the typed block model + `legalPlainText`, `LEGAL_RELATED`) and
  the content modules [`legal-privacy.tsx`](../../src/lib/constants/legal-privacy.tsx) /
  [`legal-terms.tsx`](../../src/lib/constants/legal-terms.tsx) (content-policy `CLAIM_FILES`; **env-free by
  rule**, never importing `site.ts`). The shell
  ([`legal-document.tsx`](../../src/components/marketing/legal/legal-document.tsx)) is `PageHero` at `lg` (never
  `display`: multi-word titles) → a META CARD straddling the cut (a `<div>`, never a `<header>`, because
  `ArticleToc` measures the first header) → ONE `PaperChapter` on a three-track grid (gutter / 42rem column /
  rail, so the column, the card and the centred hero share one axis) → `ArticleToc` with the reading spine,
  `ChipToc` below `lg` and `HeadingAnchor` on every h2/h3 → a "Read next" foot from `LEGAL_RELATED`. The rail takes `max-h` + its own overflow (the Terms' 22 sections outgrow a
  laptop viewport). Blocks render in [`legal-blocks.tsx`](../../src/components/marketing/legal/legal-blocks.tsx)
  (p / list / table / sub / `note`, the `bg-muted/40 border-y` register for disclaimers, never all-caps).
  **Section ids are the anchor contract**, pinned in `legal.test.ts`; renaming one is a reviewed change. **The
  launch switch is a test**: `status` set to `effective` with a bracketed placeholder still in the text fails CI.
  ★ **The Terms carry no prices and no cap numbers.** They point at `/pricing`, so a Stripe price change never
  falsifies a contract. **The fences read the legal text AND its comments**: their regexes (`business day`, the
  child-safety acronyms, `law enforcement`, `ingress`) cannot be quoted even in a comment; write "working days",
  "public authorities", "content that sexually exploits minors", "reasonable limits on upload volume". Acceptance
  is the one [`LegalConsentLine`](../../src/components/shared/legal-consent-line.tsx), shown once per surface: the
  account door renders it (in place on `/login`, with `newTab` elsewhere so the surface survives the tap) unless
  its surface already carries it, as the guest door's welcome step does above the gate; no checkbox, nothing
  recorded. The sitemap reads the legal `lastUpdated`, not build time. The
  shared reading pieces live in [`reading/`](../../src/components/marketing/reading): `heading-anchor.tsx`
  (`HeadingAnchor` + `HEADING_SCROLL_MT`, used by the legal blocks and the MDX headings behind `mdx-components`)
  and `chip-toc.tsx` (the mobile chip row).
- **`/about`**: THE MISSION PAGE. Its copy lives in [`about.ts`](../../src/lib/constants/about.ts), on the
  content-policy `CLAIM_FILES` list because the page file itself is reached only by the weaker neutralization
  fence. The MISSION is told as a story: the OPPORTUNITY (everyone at the event is already shooting it, from angles
  you will never get), the problem (it falls apart somewhere new every time), a better way, so we built it. Opening
  on exposition instead of a scene reads as rambling, and a fourth parallel failure turns the rhythm into a list.
  The six convictions land as the ANSWER, each linking to the page that proves it. The close points at careers, not
  signup, and there is **no CtaBand** (the footer is the paper lane's one conversion action).
  **AFFIRMATIVE ONLY** (bible 20): the page says who we are, never who we are not; never enumerate what the product
  is not for, and never fence a use case. **The comparison stays CATEGORY-LEVEL** (the cross-platform album, the
  drip-fed thread, the account wall, the per-person rental), never a product name. **The zero-team rule is RELAXED
  here** for a first-person origin and a join-our-team close, but still no headcount and no founder biography.
- **THE UTILITY-PAGE RHYTHM (bible 16): cinema hero, paper body, ink footer, on every utility page** (about, blog,
  careers, press, privacy, terms) but one: /contact opens on a paper `PageHero` inside `(paper)`, a route group that
  exists only for it. The dark ground BOOKENDS a short page rather than interrupting it, because it has
  too few sections to alternate chapters. **The paper/cinema split is per-CHAPTER, not per-page**: a page takes
  the rhythm by JOINING THE `(cinema)` GROUP and wrapping its body in ONE `PaperChapter` (as /help and the feature
  pages do), and the dark nav, dropdowns, overscroll and `#040405` browser chrome come with the group. Route groups
  are not in URLs, so moving a page between them needs no redirect. **A DARK HERO DECIDES THE ROUTE GROUP** (bible
  16): the header skin is chosen by the GROUP LAYOUT, which no page can override from inside. **Never build it from
  the paper side**: a hand-assembled `--gallery*` set on a sticky header is always one token behind, and the
  omitted one paints the nav panels white-on-white (the landmine and its measurement live in
  [design-system.md](design-system.md)). **A dark chapter never sits in the MIDDLE of these pages** (bible 16); a
  set-apart block inside a paper body takes the muted panel, `bg-muted/40` between hairlines (the /contact panel):
  **the fourth ground**, the one thing allowed to break the strict light-dark alternation. It ships at /30, /40
  and /50 (on paper /40 is a 1% step).
- **The About arc + the gather** ([`about/gather.tsx`](../../src/app/(marketing)/(cinema)/about/gather.tsx)): About
  opens on the cinema room and bookends in dark against the ink footer (the wordmark as the h1 at the `display`
  step, never the Logo lockup). The gather carries the dark-to-paper cut, the album centred on it and arriving out
  of the event onto the desk (the /help strip idiom), **`sm:` and up only**: at three columns the album is four
  rows, so phones get the whole album on dark and a plain cut. **A beat whose CONCEPT is a change of arrangement
  must not hide its starting arrangement** (bible 13): `[data-mkt-fly]` animates opacity 0 → 1, so reusing it
  would hide the scatter, while `.mkt-gather` never touches opacity, only position and angle. The scatter is an
  authored table (never `Math.random()`, which desyncs SSR), so the no-JS fallback is prints on a table. Eleven
  gather and a twelfth arrives late: a complete rectangle says "this is all of it", and there is always one more
  phone in the room.
- **`/careers`**: in the **(cinema)** group; dark hero → ONE paper chapter carrying the whole body → the ink
  footer (**one cut, not stripes**, bible 17: per-section alternation overwhelms a short page). **THE PAGE ARGUES
  IN PHOTOGRAPHS** (bible 18): a "why it matters" pitch or a values list is a claim about ourselves to a reader who
  has met the pitch twice, so the middle is **the roll → the selects → the reel**
  ([`careers-story.tsx`](../../src/components/marketing/sections/careers/careers-story.tsx)): the contact sheet
  with all but four frames dimmed (the dimming IS the argument), the survivors in the album chrome, then the real
  loop via `InlineReelPlayer` (the player, never the reel engine: the engine stays out of first-load marketing
  chunks, the pure `engine/style-registry` being the one engine module there, and /reel's style switcher reaches
  `CanvasReelPlayer` only behind a lazy boundary). About forty
  words carry all three; never add a paragraph section to explain a beat. The hero composes `PageHero` over the
  **contact sheet** ([`contact-sheet.tsx`](../../src/components/marketing/sections/careers/contact-sheet.tsx)) in
  its backdrop, a few frames circled as selects whose stroke draws in on arrival, and is pulled UP under the
  overlay chrome (`-mt-[var(--mkt-header-h)]`, the home hero's move), or a hard seam crosses the top of the page.
  The hero's marks are POSITIONAL and low (index 18+ clears row one at every column count), because top-row marks
  sit under the chrome; the roll's marks DERIVE from the kept-frame ids, so the four circled are provably the four
  that lead the album a screen later. The two lists stay separate: the hero repeats the roll three times, so
  id-based selection would circle every keeper three times. The composition is this page's alone (the media
  doctrine in [`event-object.tsx`](../../src/components/marketing/sections/events/event-object.tsx)). Marks stay
  ACHROMATIC (white pencil, never red): there is no brand hue (bible 1).
  ★ **The careers hero's unique pass is never lazy-loaded.** The sheet fills the first screen, so one set of the
  unique frames loads eager (`eagerFrames`) and only the two repeats keep `loading="lazy"` (their images come from
  cache); `priority` stays at six, since a preload per frame would fight the LCP element for bandwidth. The h1 takes the **site ladder** (bible 5) at the `lg` step, never a private ramp. The
  full-bleed glass wash follows the crossfade note in [design-system.md](design-system.md), and the scrim is tuned
  against PHOTOGRAPHY (density plus a uniform 0.8 dim on hero frames), so the type wins without crushing the
  images. The close is a small follow-up to **/contact** inside the roles section, never a CtaBand, whose heading
  would shout over the list (the footer's product CTA sits right below). The HEADINGS tell the story alone,
  because people skim them: join our team → the best content gets lost in camera rolls → so we gather all of it in
  one place → and turn the best into a highlight reel → our core philosophy → we're hiring. The problem heading
  names the photos and where they are lost (a bare "Most of it is never seen again" under a hiring headline reads
  as though new HIRES vanish), the beats open with "So" and "And" so the captions read as one story, and headings
  avoid "build". Listings are ONE card design on the house gray plate (`bg-muted/50`), turning to white card stock
  on hover; the General Application's honesty lives in its DATA (no team, type "Always open", its own action
  label), never a second container. **The philosophy indices are CIRCLED by the sheet's own `SelectMark`**: one
  gesture at three scales, and true rather than decorative, since the principles are the kept selects. Off
  the sheet the mark takes the SURFACE's ink (the sheet's near-white vanishes on paper) and draws on its section's
  Reveal, not the page-load clock. Copy lives in [`careers.ts`](../../src/lib/constants/careers.ts), a
  content-policy `CLAIM_FILES` entry (the role page's apply notes are inline prose, covered by the neutralization
  fence over all of `(marketing)`);
  its `offer` block keeps "Competitive compensation": the posting is meant to spark a conversation, not to
  specify an offer. **No `JobPosting` JSON-LD**
  while the listing is placeholder. **`/careers/[slug]` is a SPEC SHEET**: dark title block → a paper document
  (reading column beside a sticky spec rail) → the application chapter on its own gray band. Each role's
  **EMBLEM** ([`role-emblem.tsx`](../../src/components/marketing/sections/careers/role-emblem.tsx), an achromatic
  SVG plate) sits on its listing card and above its title, and the two pages **MORPH between** them through the
  native View Transitions API ([`role-morph.tsx`](../../src/components/marketing/sections/careers/role-morph.tsx),
  mounted from a careers-scoped layout so no other route pays for the listener). The morph is the SHARED
  [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx) the blog's cover morph also
  uses; a third morph is a config object. NOT React's `<ViewTransition>`, for the reason under the blog's cover
  morph. The CSS is NAME-SCOPED because `::view-transition-*` are document-global like `@keyframes`, and
  `marketing-css-policy.test.ts` pins each `name` to its rule (renaming one side drops the timing silently).
  Emblems map by slug with an integer-hash fallback that draws only NEUTRAL kinds, because an unwritten role
  inheriting `reel` (the reels role's mark) or `open` ("not a real vacancy") asserts something false. The role page
  carries NO photographic hero media, because it is where somebody decides and wants density; its facts render as
  labelled pairs in the rail, and the offer block takes a different SHAPE from the lists so three sections never
  read as one column.
  ★ The role rail's `lg:self-stretch` is load-bearing, or `lg:items-start` collapses the aside and sticky gets
  zero travel. It is the same trap as the help ToC. The rail is `order-first` on mobile so the facts precede the
  prose, and the application chapter INVERTS the contact figure/ground (a white card on the gray band, because the
  band is the separator here).
- **`/contact`**: the contact and application forms write the deny-all `contact_submissions` /
  `job_applications` tables through a Server Action on the service-role admin client, then notify best-effort via
  `sendOnce` (see Gotchas). Contact's first field is a REQUIRED **topic Select**, single-sourced in
  [`constants/contact.ts`](../../src/lib/constants/contact.ts) (labels, icons, fastest-path hints): the zod enum,
  the `contact_submissions.topic` CHECK, the `[label]` email-subject tag and the `/admin/support` chip all read it,
  and a parity test pins the enum to the migration. A topic swaps a deflection hint INSIDE the form. The form card
  is a STATIONERY NOTE (a `bg-muted/50` card with a photo postage stamp and a letterhead caption), its fields
  explicitly `bg-background`.
  ★ A Radix Select takes no controlled `""`, drops empty `onValueChange` emissions, and hand-renders its trigger
  label. A controlled `""` latches the placeholder over later programmatic values; the hidden
  native-select bridge emits an EMPTY `onValueChange` during mount cycles that would clobber programmatic
  pre-picks; and `SelectValue` cannot resolve a label before the popper items have mounted. The page mounts
  `HelpPaletteProvider` itself (⌘K and a hero search band; the palette is already `portalSkinProps("paper")`).
  The `?about=<slug>` handoff prefills the subject AND pre-picks the topic through the exhaustive `CATEGORY_TOPIC`
  map (a new help category fails typecheck until mapped), via `form.reset` so "Send another" keeps the context. The
  route stays static: it reads window.location on mount against an allowlist, never `useSearchParams`.
- **`/help`** + **`/blog`**: an in-repo **MDX content pipeline** (`content/*.mdx`, `gray-matter`,
  `next-mdx-remote/rsc` and **build-time zod frontmatter validation**). The generic core is
  [`content/collection.ts`](../../src/lib/content/collection.ts) (`loadCollection`, `slugify`, `extractHeadings`,
  `readingTime`, `escapeXml`); [`help.ts`](../../src/lib/content/help.ts) and
  [`blog.ts`](../../src/lib/content/blog.ts) are thin wrappers. Help is a TEN-category lifecycle taxonomy (set up →
  invite → guests → album → share → reel → pay → account → trust → fix), every category but troubleshooting
  linking up to its marketing `feature`; a new category lands WITH its first article, its emblem, its strip label +
  grid column and its `CATEGORY_TOPIC` row, since the test requires ≥1 article per category and the contact map is
  exhaustive by type. The guest lane is "For guests" (slug `guest-experience`); `account-and-profile` (sign-in, name
  and photo, the handle, following, notifications) is the eighth of the ten. Frontmatter takes an optional `audience` (`host|guest|both`, defaulting from the category), `plans`
  ("Applies to" badges) and `action` (the one door under the short answer); `description` caps at 200
  (`HELP_DESCRIPTION_MAX`). The ranked ⌘K **search palette** mounts from
  [`help/layout.tsx`](../../src/app/(marketing)/(cinema)/help/layout.tsx)
  ([`help-palette.tsx`](../../src/components/marketing/help/help-palette.tsx), scored by the pure, fs-free
  [`help-search-rank.ts`](../../src/lib/content/help-search-rank.ts): a heading hit deep-links only when it is the
  sole match reason, and a static "Pages" tail leads onward). The index sheet has numbered panes, DOM-art
  [`help-emblems.tsx`](../../src/components/marketing/help/help-emblems.tsx), a live-constants numbers strip and a
  guest fast lane; at ten categories the strip cells need `sm:min-w-0` or the desktop strip scrolls, and panes with
  7+ guides split into two columns. Troubleshooting always closes the sheet wide and the guest pane goes wide only
  when the remaining count is odd, which keeps the two-column rows even at any category count. The empty ⌘K search
  offers the ten category chips. Articles are answer-first: `description` is the "In short" lead, the ToC
  scroll-spies through the pure `pickActiveHeading`, related articles need a shared keyword and exclude the
  prev/next siblings (or Related duplicates pagination), an audience tag shows only when it says something the
  category chip does not, guest articles end on /how-it-works (the growth loop stated once), the feedback row hands
  misses to `/contact?about=<slug>` (a Yes offers "Up next"), and `@media print` rides `data-print-*` hooks (the day-of checklist is the
  guide a host prints). The MDX components are one map,
  [`mdx-components.tsx`](../../src/components/marketing/mdx-components.tsx), composed from `mdx/spec-shared.tsx`,
  `mdx/spec-help.tsx` and `mdx/spec-blog.tsx` (the composer throws on a duplicate name): `Callout`,
  `AlbumShowcase`, `Steps`/`Step`, `Kbd`, `UiLabel`, `PlanBadge` (an outline pill, distinct from UiLabel's filled
  chip), `Path`, `Checklist`/`Check` (ticks kept per article in localStorage;
  [`help/checklist.tsx`](../../src/components/marketing/help/checklist.tsx)), and a spec-inline family reading
  `limits.ts`/`tiers.ts`/`lifecycle/*` so numbers cannot drift. NOTHING client-side may import that map: it
  reaches `node:fs`. The bodies take a `prose-help` theme. Four tests hold the catalog honest: every article
  COMPILES (`help-mdx-compile.test.ts`; `blockJS` strips `{placeholder}` braces, so UI strings are quoted in
  rendered form), every `<UiLabel>` is a shipped app string (`help-ui-labels.test.ts`), every internal link and
  `#section` anchor resolves, and all eleven literal-referenced slugs are pinned. `/llms.txt` lists the first
  `LLMS_HELP_PER_SHELF` (4) articles per shelf, because the full catalog outgrows its 16k budget; `/llms-full.txt`
  keeps the descriptions.
  Help lives in the **(cinema) group**: the reading bodies ride `PaperChapter`, the search card, emblem strip and
  In-short card are `surface-paper` islands, and the strip and the In-short card STRADDLE the cut via negative
  margin. Shared help components live in [`components/marketing/help/`](../../src/components/marketing/help).
  ★ `[data-mkt] .mkt-line` forces `display:block` and silently kills flex utilities on the same element. It is the
  texts-reveal recipe, an unlayered rule in marketing.css that outranks any Tailwind utility, so center
  constrained children with `mx-auto`, never a parent `justify-center`. TWO FACES, AND ONLY TWO (bible 7, full text
  in [`design-system.md`](design-system.md)): no mono anywhere, data on the body face with tabular figures, and
  every label, hint and descriptor is the `Caption` atom. The authoring brief is
  [`content/help/AUTHORING.md`](../../content/help/AUTHORING.md); it names the fences by pointer only, because the
  content-policy tests scan `.md` too and the brief must obey itself.
- **Blog.** In the **(cinema) group** like /help. **DISTINCTNESS FROM /help is the constraint**, because both hubs
  open dark: /help opens on an instrument (a centred question, search, the emblem strip), /blog asymmetric on the
  lead story over a media wall. No search field, no emblems, and a tag rail of words and numerals only; an icon
  column there would collapse the two surfaces together.
  - **The index.** A SMALL `Blog` h1 at the ladder's `subsection` step over a drawn `[data-mkt-rule]` hairline
    lets the featured card own the stage (the register is recorded in [`design-system.md`](design-system.md)); the
    newest post is a 21:9 featured card STRADDLING the cut, then the library. The rail is a sticky margin index
    (counts from the full set, a 2px ink bar for active, never a fill); the library is 4/5 portrait `PostCard`s at
    1/2/3 columns ([`components/marketing/blog/`](../../src/components/marketing/blog), shared with "Keep
    reading"). The masthead's RSS `Subscribe` is the feed's only visible entry point. Picking a tag runs the
    **two-beat set change** (`--mkt-set-*` in marketing.css: departing cards leave together, then a two-axis
    `useFlip` reorganizes the survivors) on page-neutral hooks.
  - **Registered tags:** six ids in a zero-import registry
    ([`blog-tags.ts`](../../src/lib/content/blog-tags.ts): the audiences weddings / parties / corporate and the
    purposes how-to / compared / product). The frontmatter schema enforces membership, one or two tags and at most
    one audience, so a typo fails the BUILD. The rail prints LABELS in fixed registry order (a most-used-first rail
    reshuffles as posts land) while `?tag=` carries the id; the library heading keeps one height under every filter
    (`BLOG_LIBRARY_LINE` when unfiltered), because a height change is what the set-change FLIP animates as a jolt.
    The registry stays import-free because the "use client" island and PostCard reach it (a test reads the file).
    "Keep reading" is SCORED (2 × shared audience + shared purpose, tiebreak nearest date), because same-tag-first
    funnels every ending to the two newest posts; a test bounds any post to five recommendations across the
    archive.
  - ★ **The hero exists ONLY in the unfiltered view.** Lifting it out of the filtered set renders EMPTY tags,
    because a hero can own tags no other post has (the derivations and the pin live in
    [`blog-index.ts`](../../src/lib/content/blog-index.ts); `normalizeTag` checks POSTS, not the registry, so a
    registered-but-empty `?tag=` also collapses to Everything). Filter state rides a shareable `?tag=` read through
    `useSyncExternalStore` (never `useSearchParams`, which would deopt the static route; a mount effect is banned
    by the react-hooks lint). **Pagination** is INVISIBLE below `POSTS_PER_PAGE` (12); it rides `?page=` beside
    `?tag=`, never `/blog/page/[n]` routes, which would multiply into tag x page URL space.
    ★ `paginate()` clamps, so a stale `?page=` or a shrinking filter lands on a real page, never an empty grid. The
    develop stagger (`--i`) is CAPPED at 5 on library cards so the staged lead (6) lands last; uncapped, a
    twelve-card page lands half its cards after the hero and replays a muted hole on every filter change.
  - **Covers.** An optional frontmatter `cover` (a `MARKETING_IMAGES` id, so a typo fails the BUILD) over a
    slug-hash fallback in [`blog-covers.ts`](../../src/lib/content/blog-covers.ts).
    ★ The cover fallback is a pure function of the slug alone, so publishing never re-skins an older post. Walking
    the post list to hand out unused images is deterministic but NOT stable. A crop ladder re-slices each source,
    so 11 images yield 66 distinguishable plates. Every library post SETS its cover, and a pure test pins that no
    photograph repeats beside itself (i+1, i+2 at two columns, i+3 at three) on any page or under any filter, and
    that the hero is landscape (`wedding-petals`, the one portrait, bands in the 21:9 card and the OG crop).
  - **The ARTICLE** opens on the same cover at the same crop as the card the reader clicked, so the page reads as
    the card opening; `description` is the visible STANDFIRST. The ending is TWO blocks: chronological neighbours,
    then related posts excluding them (`getRelatedPosts(post, n, exclude)`), or on a small archive one post repeats
    within a screen. An optional frontmatter **`faq`** (1-8 plain-text items, guarded against markup and typed
    numbers) renders as an always-open "Questions" `<dl>` outside the article body, so the spine measures the
    piece (it joins the ToC as `#questions`), and ships verbatim as `FaqPageJsonLd` for on-page Q&A and assistant
    retrieval (Google shows FAQ rich results only for authoritative sites). The reading components are shared with
    /help and the legal shell in [`components/marketing/reading/`](../../src/components/marketing/reading):
    `ArticleToc` (scroll-spy plus the `progress` READING SPINE every long-form surface takes) and the delegated
    `HeadingAnchorsDelegate`; each long-form page marks its body with `ARTICLE_BODY_ID` so the spine measures the
    ARTICLE, never the page.
  - **THE COVER MORPH**: the card's photograph grows into the article's plate through the **native** View
    Transitions API, driven by the SHARED
    [`morph-delegate.tsx`](../../src/components/marketing/system/morph-delegate.tsx)
    ([`cover-morph.tsx`](../../src/components/marketing/blog/cover-morph.tsx) is three strings of configuration)
    from one delegated island, so every card stays a server component. NOT React's `<ViewTransition>`: it needs
    `experimental.viewTransition`, which swaps the WHOLE app's React runtime from the pinned 19.2.4 to
    19.3.0-canary, a product-wide trade only Will decides. Two traps: the delegate intercepts in the CAPTURE phase,
    because `next/link` preventDefaults first and a bubble listener bails on `defaultPrevented` (the morph silently
    does nothing while navigation still works); and the delegate, not the server render, owns the
    `view-transition-name`, because a name cleared from an incoming cover is a DOM mutation React never undoes (the
    `style` prop did not change), so the first morph would disarm every later one. Its CSS is name-scoped like the
    careers morph's.
  - **Shared plumbing.** The byline ([`post-meta.tsx`](../../src/components/marketing/blog/post-meta.tsx)) is one
    component across the card, the featured card and the post header, on the **body face**: a machine face turns
    name, date and reading time into a timecode. **ONE registered author** (`partyreel-team`); named individuals
    are absent rather than dormant, because a dormant entry is what a content agent picks up by accident. `title`
    caps at 80 chars as a LAYOUT contract (cards clamp to 2 lines, the featured card to 3), failing the build rather
    than shipping a cut title. The OG card is the featured card, its cover read off disk and inlined (never
    fetched: `NEXT_PUBLIC_SITE_URL` resolves to PROD on preview builds), and the feed carries `<enclosure>` art.
    Also: the client-safe [`authors.ts`](../../src/lib/content/authors.ts), Article JSON-LD, per-post `next/og`
    cards, and the build-static **RSS 2.0 feed** (`/blog/feed.xml`, `dynamic="force-static"`, whose
    `buildBlogRssXml` takes its site config as a param so it stays out of the env-validating `site.ts` and stays
    unit-tested); `draft: true` posts are excluded everywhere. The author brief is
    [`content/blog/AUTHORING.md`](../../content/blog/AUTHORING.md).
  - **The library:** posts under the six tags, every marketed number reaching prose through the spec family in
    `mdx-components.tsx` (a test scans bodies for a typed size, price or limit beside its unit; `formatCapacity`
    carries the capacity rule of thumb). GFM tables scroll in a wrapper with /pricing's header register;
    `<Yes />` / `<No />` are the /pricing matrix's glyphs through the shared `MatrixMark`. Comparisons name
    INCUMBENTS only (Google Photos, iCloud, WhatsApp, iMessage, AirDrop, email, Dropbox, disposables, booths),
    hedged; QR-app rivals stay category-level. `/llms.txt` lists the newest `LLMS_BLOG_LIMIT` (8) posts, because
    the archive outgrows the 16k lean budget, and `/llms-full.txt` all of them. The four placeholder slugs 308 to
    their successors via [`blog-redirects.ts`](../../src/lib/content/blog-redirects.ts) → `redirects()` in
    `next.config.ts` (test-held against the live slugs).
- **The Resources group.** The header `Resources ▾` panel and the footer Resources column both group Help, Blog,
  Press and Contact (a two-way Vitest mirror: change one side and change the other). **ONE IDEA, ONE PAGE, TWO
  DOORS TO IT**: the Resources panel's featured card is the PRIMARY door to `/how-it-works`, the Features panel's
  footnote the quieter second. The help article `how-partyreel-works` is linked from NOWHERE in the chrome; it
  keeps its row in the help center and the walkthrough's foot link.

**THE FOOTER (the ink slab).** One always-dark surface under both skins: `.surface-ink` (globals.css) redeclares
the slab's own tokens and paints its own `--background`, never a nested `.dark` and never `bg-gallery` (the deeper
media well); [design-system.md](design-system.md) has the token-redeclaration trap. Three registers: the demo
invitation (the shared demo frame pointing at `DEMO_EVENT_URL`, from `sm` up since a phone cannot scan its own
screen; phones get an "Open the demo album" link), the index, and a legal bar. ★ **The action is not part of the
invitation**: `Start free` renders at every width in both branches of the `if (!DEMO_EVENT_URL)` early return,
because `/about`, `/press`, `/careers`, the legal pages and the 404 carry no `CtaBand` and would end with nothing
to do whenever the demo is unset. The seam glow
([`footer-glow.tsx`](../../src/components/marketing/chrome/footer-glow.tsx), the shared spill engine lit from the
`--lamp-*` house light) turns the top edge into spilled light.

IA is four columns beside the brand block: **Features** · **Events** · **Product** (How it works · Pricing · The
reel · FAQ) · **Resources**, with About + Careers as Resources' TAIL under a hairline and the legal bar owning
`FOOTER_LEGAL` (Privacy + Terms) plus `/llms.txt`. Features and Events carry their hub on the column TITLE (a
`href` rendered with a hairline underline, the only signal separating a linked title from an unlinked one) rather
than an "All features" row. **Nothing is collapsed**: folding the two core page families behind chevrons buries
them, and the sitemap is small enough to show at once (a Vitest pin refuses an accordion). Privacy and Terms live
in the legal bar, never a column of their own, which wraps at 1440. The brand block carries the wordmark alone
(no mark tile), the thesis and the assistant row.

The root 404 renders the same footer outside `(marketing)`, where marketing.css never loads, so the footer carries
everything it needs on its own components: the slab's tokens (`.surface-ink`), the seam glow (the shared `Glow`
engine) and the demo frame's own radius, border and shadow.

## SEO / OG

The root [`layout.tsx`](../../src/app/layout.tsx) sets `metadataBase` from `SITE_URL`
(`env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com"`), because Next errors on relative OG URLs without it.
★ **`SITE_DESCRIPTION` is its own line, never the hero subhead.** Never compose it as
`${SITE_THESIS} ${SITE_SUBHEAD}`: the hero sentence runs 144 characters, so the composed form passes 160 and every
search result and unfurl cuts it mid-clause. The meta copy is `SITE_DESCRIPTION_LINE` in `marketing-voice.ts`
(`env.ts`-free, so a pure test can measure it), composed with the thesis in `site.ts` so a thesis rewrite still
reaches every consumer (root metadata, manifest, RSS, JSON-LD); `home-sections.test.ts` pins the composition
under 160 and pins the two apart. OG images are **code-generated via `next/og`** (the site-wide
[`opengraph-image.tsx`](../../src/app/opengraph-image.tsx), per-route cards beside most marketing pages, and a
per-event card at `(guest)/e/[token]/opengraph-image.tsx`). `sitemap.ts` lists ONLY the marketing routes
(`lastModified` carries a page's content date where it has one; build time elsewhere); `robots.ts` allows everything
but its disallow list (the app, admin, auth, `/e/` and `/api/`), so the public `/u/[slug]` profiles stay
crawlable.

**The AI-discoverability layer:** `/llms.txt` + `/llms-full.txt` (the llmstxt.org format) are built by pure fns in
[`content/llms.ts`](../../src/lib/content/llms.ts) (numbers from `tiers.ts`/`limits.ts`; the builders are
content-policy `CLAIM_FILES`, so the social-proof and backstop fences cover the AI surface; link integrity is
unit-tested against the real routes) and served by force-static routes. `robots.ts` names 14 AI crawlers with
explicit allow blocks (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, ...); a `SoftwareApplication`
schema mounts across the marketing site (the `(marketing)` layout) beside Org/WebSite (offers = the shared AggregateOffer; NO ratings or reviews, because
absent beats fabricated). The llms files compare CATEGORIES, never rival brand names, and their "When it is not"
section is deliberate credibility: never "fix" it into pure praise. The press boilerplate and fact sheet live in
[`constants/press.ts`](../../src/lib/constants/press.ts), the one quotable home for /press and the llms builders.

**`/press` = THE CONTACT SHEET.** In `(cinema)` on the utility-page rhythm: a masthead hero, then ONE
`PaperChapter`. The page is titled **"Press"** everywhere (header panel, footer column, /contact directory, title,
breadcrumb, H1, OG card), never "Press & brand", which is two labels for one page. The hero is `PageHero` at
`scale="display"`, eyebrow "Media assets" over H1 "Press". **AT THE DISPLAY STEP, THE H1 MATCHES ITS NAV LABEL**
(bible 6): a 160px masthead has to be the word the reader just clicked, and anything more specific belongs in the
EYEBROW, which carries no word limit (the H1 does: see page-hero.tsx).

**The sheet** is the kit as a photographic proof sheet: eight numbered frames on the 3px `--gap-gallery` album
grid, opening the paper body. The frames are deliberately NOT one kind of thing (artwork, an app icon, the share
card, a working QR, the ink, the type), because a uniform grid of marks is a downloads table wearing a metaphor; do
not "tidy" it. EVERY FRAME IS OURS (bible 18): no stock photos, and never media whose rights we do not hold. Plates
go by LEGIBILITY: white behind ink-drawn artwork, ink behind white-drawn artwork.
★ The press plates' two grounds are literal colours (`PLATE_PAPER` / `BRAND_HEX`), never theme utilities. A plate
is the artwork's own ground, and following a token flip hides the artwork on it. THE REBATE: the grid paints
`--border` and insets itself by the same `--gap-gallery`, so every gap is a hairline; outer inset and inner gap
are one value or it stops reading as a rebate.

**The body is a sticky two-column spine** (Assets / Words / Fact sheet pinned left, each a deep-link target).
Every section ends at ONE SHARED RIGHT EDGE and the narrower ones START further right (`lg:ml-auto` against a width
cap), so the gap to a pinned heading grows with the viewport while the reading measure does not; Words and the
fact sheet share one `max-w-2xl`. A pointer's glyph follows its ACTION: navigation takes `LearnChevron`, a
download the hero's down arrow. No brand-guidelines section: only the two press-business usage points (quoting
needs no permission, how to write the name) ship, beside the copy they govern.

The kit is manifest-driven (`PRESS_KIT` + `scripts/build-press-kit.mjs` + `scripts/build-press-qr.mjs` + the
committed zip, guarded by `press-kit.test.ts`, which parses the archive back and CRC-checks every member against
the files on disk), so a logo change is a files-and-rows edit with no component work.

**The promise-neutralization doctrine:** published copy commits to OUTCOMES (a reply, a review, host control),
never to WHO or WHAT delivers them (no "a real person answers", no "a human reviews every report", no "never an
automatic takedown", no "business day"), so support and moderation tooling can evolve (AI first-gates included)
without breaking published, especially legal, language. The standard reply line, verbatim wherever a reply is
mentioned, is `REPLY_LINE` in `contact.ts`: **"Every note gets a reply, usually within a day."** Moderation copy
is actor-free (review-before-removal and host-moves-fastest,
[`report-review.tsx`](../../src/components/marketing/sections/features/privacy/report-review.tsx)), never "People,
not machines". The neutralization fence in [`content-policy.test.ts`](../../src/lib/content-policy.test.ts)
enforces it with a phrase scan over ALL of `src/app/(marketing)`, `src/components/marketing`,
`src/lib/constants` and MDX, narrow on purpose so the guest-attribution line ("every upload has a real person
behind it") and careers' "We read every application" stay legal.

## Gotchas (why it's like this, don't revert)

Each entry below is a behaviour that looks wrong and is load-bearing, so reverting it breaks something silently.

- **A public form's ROW is authoritative; its email is best effort.** The Server Action inserts into the deny-all
  table (`contact_submissions` / `job_applications`) on the service-role admin client FIRST, then attempts the
  Resend notify in a try/catch (`sendOnce`, `dedupeKey` = the row id so a double submit notifies once, `replyTo` =
  the submitter). A missing key, an unconfigured inbox or a failed send is logged and swallowed: it never changes
  what the visitor sees, and the row is already queryable. No anon RPC and no anon grant sit behind it, so a public
  form adds no anon-executable surface. The hidden `website` honeypot returns SUCCESS without storing, so a bot
  learns nothing. The address shown is the `SUPPORT_EMAIL` constant and the destination is the optional
  `CONTACT_NOTIFY_EMAIL` env (falling back to `SUPPORT_EMAIL`), so moving the mail is an env swap. Resend
  **Inbound** stays unused on purpose (webhook-only ingestion, no mailbox); the destination is a real receiving
  inbox.
- **The MDX pipeline is in-repo by choice, and stays JS-free.** `content/**/*.mdx` is versioned with the code, so
  publishing an article is a deploy: the accepted price of running no CMS for a curated, engineering-authored
  library. Never `@next/mdx` (file as route): it cannot list or filter a collection by frontmatter, which the
  index, search, sitemap and related-articles all need; `gray-matter` lists cheaply with no compile and
  `compileMDX` renders one body. `blockJS` stays ON, stripping raw `{expressions}` while keeping JSX components,
  which is why every live number rides a spec component reading `tiers.ts` / `limits.ts`. Articles are
  first-party and build-compiled; never feed untrusted input to MDX. Heading ids come from the ONE in-repo
  `slugify` that `extractHeadings` also uses (no `rehype-slug`), so an anchor and the ToC cannot drift apart.
- **The `next/og` images load NO font.** The built-in font dodges the Next-16 satori font gotcha; never add a
  custom font loader.
- **A count can glue itself to its noun.** Next 16's SWC drops the LEADING whitespace of a JSX text run that both
  spans more than one source line and holds an HTML entity (`&rsquo;`, `&nbsp;`), so `{n} marketing pages` renders
  "24marketing" in exactly that case. tsc does not reproduce it, and a prettier reflow can create the shape in a
  file nobody meant to change. Put an explicit `{" "}` after the expression, or keep the run on one line.
- **The event page emits OG tags but `robots: { index: false }`.** `/e/[token]` sets `generateMetadata` (event
  name/description + the per-event OG) so links unfurl in chat, but the opaque `qr_token` must NEVER be indexed.
  `robots.ts` also disallows `/e/`, `/dashboard`, `/admin`, `/login`, `/auth`, `/account`, `/welcome`, `/design`
  and `/api/`. The guest query `getEventByQrToken` is wrapped in React `cache()` so `generateMetadata`, the page
  and the OG image share one RPC per request.
- **404: the double-chrome boundary.** Seven `not-found.tsx` share ONE animated core
  ([`not-found-screen.tsx`](../../src/components/shared/not-found-screen.tsx), presentational, NO
  `Container`/chrome; it takes exactly one of `visual` or `icon`, a `help` line and, on the crash screens only, a
  `digest`): the missing-frame strip stands in for the icon on the marketing group 404s and the marketing 500, the
  root 404 keeps `Compass` over its trail, and the marketing 404 alone has no help line because its actions and
  footnote already name help and contact. The root [`not-found.tsx`](../../src/app/not-found.tsx) renders its OWN
  `MarketingHeader`/`Footer`, because UNMATCHED URLs fall through to `app/layout.tsx` with no group chrome; on the
  admin build it branches on `surface() === "admin"` (inlined at build time) to the portal's own screen with one
  link to `/admin`, with no route and no proxy change. The marketing chrome lives in the `(cinema)` and `(paper)`
  group layouts, never in `(marketing)/layout.tsx`, and a `notFound()` inside a marketing route with no nearer
  boundary renders the ROOT not-found INSIDE that group layout, which already renders header and footer → the
  chrome **double-stacks**. So each group carries its own boundary,
  [`(cinema)/not-found.tsx`](../../src/app/(marketing)/(cinema)/not-found.tsx) and
  [`(paper)/not-found.tsx`](../../src/app/(marketing)/(paper)/not-found.tsx), rendering ONLY the centred content
  (copy single-sourced in [`marketing-not-found.tsx`](../../src/components/marketing/marketing-not-found.tsx)); a
  `(marketing)`-level boundary would render skinless.
  ★ Never delete the `(paper)` 404 for catching no `[slug]`. `(cinema)` catches every dynamic marketing route
  (events, help, blog, careers) and `(paper)` holds only `/contact`, but a static page can call `notFound()`, and
  without the boundary that render falls through to the ROOT one and double-stacks the chrome. By audience: root
  (unmatched URL, its own chrome), marketing (bad `[slug]`, no chrome), guest (an event link that resolves to
  nothing: reassurance, a "What is Partyreel?" CTA and the demo, under the session-less guest bar that is the
  `Logo` alone; an unknown `/u/` handle has its own boundary that never says why), host (inside the authed
  `AppShell`), admin (inside the MFA-gated `AdminShell`). All seven → single chrome, 404 status + `noindex`.
- **Local-dev OG host:** in `pnpm dev` the emitted `og:image` URL shows the `localhost:3000` host (Next resolves
  metadata against the request origin in dev) while `sitemap.ts`/`robots.ts` show the `partyreel.com` fallback.
  That is not a bug; prod (with `NEXT_PUBLIC_SITE_URL` set) resolves correctly. The per-event OG URL carries a
  Next hash suffix (`…/opengraph-image-<hash>?…`), so read the real URL from `<head>`.

## Interactive demo (marketing side)

The demo is one real curated event, switched on by one public env var and needing no schema of its own. Its
`qr_token` is set in `NEXT_PUBLIC_DEMO_QR_TOKEN`. **GOTCHA: it must be referenced explicitly in
[`env.ts`](../../src/lib/env.ts)'s `parsePublic()`**, because Next only inlines literally-named
`process.env.NEXT_PUBLIC_*`: added to the schema but not its reader, it stays `undefined` in prod.
[`demo.ts`](../../src/lib/demo.ts) is the single source (`DEMO_EVENT_URL` + `isDemoToken`). When set, every demo
door links the real event and the `/features/qr` hero code becomes scannable; unset, no demo link exists anywhere
(each door stands down or stays as unlinked decoration, and that code turns decorative). `/demo` ([`route.ts`](../../src/app/demo/route.ts)) is a
307 to the demo event (the home page when unset), never a cached 308, because the demo row can be re-seeded or
retired. The guest-page demo-mode behavior is in [guest-flow.md](guest-flow.md).

**One `DemoFrame` is every demo door.** A photograph in a plain mat with the live code tucked into its corner
([`demo-ticket.tsx`](../../src/components/marketing/system/demo-ticket.tsx)) is what the home hero's plate
([`cinema-hero.tsx`](../../src/components/marketing/sections/home/cinema-hero.tsx)'s `DemoQr`, a `heroCompact`
pair below `lg`), the footer invitation ([`footer-demo.tsx`](../../src/components/marketing/chrome/footer-demo.tsx)),
a feature page's demo line ([`demo-cta-link.tsx`](../../src/components/marketing/system/demo-cta-link.tsx)) and
the Features nav panel's featured pane ([`mega-panel.tsx`](../../src/components/marketing/chrome/mega-panel.tsx))
all wear. The corner code trades scannability for proportion (a full-size badge on a photograph-sized mat reads as
a QR code with a photo leaking out behind it): at `hero` and `heroCompact` it reads as a symbol and a tap target,
not an assumed scan, and `footer` keeps a bigger badge because its copy promises a scan. `DemoTicket` stays the
frame's own complete door (its own link and env gate) for the Library's specimen and the site-chrome sandbox
alone.

## See also

[host-app.md](host-app.md) owns the in-app QR designer and the first-time welcome that reads `how-it-works.ts`,
and [notifications-analytics-growth.md](notifications-analytics-growth.md) owns the marketing web analytics, guest
email capture and OG-driven growth.
