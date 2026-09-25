# Marketing site, content & SEO

Open this before you:
- change the marketing header, nav or footer;
- change a marketing page, its copy or a figure on it;
- write a help article or a blog post, or change the MDX pipeline;
- touch a public form (`/contact`, a job application);
- change metadata, an OG image, the sitemap, robots or the llms files;
- touch a 404 page;
- wire or unwire the demo.

The public `(marketing)` route group serves the site, the help center and the blog on the shared domain. It is the
app's design system turned up: the same tokens and faces, louder only through type, layout and motion
([design-system.md](design-system.md), whose "Chapters" paces every core page). One `SITE_URL` and brand constant set
(`src/lib/constants/site.ts`) feeds the sitemap, robots and the root `metadataBase`; `BRAND_HEX` is a literal hex
because satori reads no CSS token.

## The chrome: header, nav, footer

The nav is single-sourced in `lib/constants/marketing-nav.ts` and drawn by `marketing-header.tsx` (desktop panels in
`marketing-nav.tsx`, a full-screen phone menu in `mobile-menu.tsx`) and `marketing-footer.tsx`; both render only live
routes.

- ★ **`PRIMARY_NAV`'s order is load-bearing**: Radix derives the cross-slide from adjacent items' index delta, so the
  three panel groups (Features, Events, Resources) stay contiguous and Pricing stays last as the only flat link, or a
  pair of panels loses its sweep.
- **The nav's clocks are `--mkt-dropdown-*` and `--mkt-nav-*` on `[data-mkt]`**, and `--mkt-dropdown-open-ms` drives
  the enter, the box morph and the cross-slide together so they cannot drift; JS reads the hover intent through
  `readCssMs`. Every chrome clock carries a `var(…, fallback)`, because the root `not-found.tsx` renders this header
  without marketing.css. The panel's `transform-origin` comes from the open trigger's rect (`--mkt-nav-origin-dx`).
- ★ **The bar hides by transform alone, never by height**: about fourteen consumers derive from `--mkt-header-h`, so it
  stays `4rem` and the sticky box never moves. It leaves once the reader commits past a one-header reveal zone, returns
  on any upward movement, at the top and on `:focus-within`, and never leaves with a panel or the phone sheet open; the
  hide and its escapes are ONE compound selector, so no utility order decides them. `-translate-y-full` writes the
  standalone `translate` property, so the clock is `transition-[translate]`. Direction is the one thing an
  IntersectionObserver cannot report, so the header's single passive listener lives in `use-scroll-direction.ts`.
- ★ **The header's right cluster reads the session from a cookie on the client, so every marketing route stays
  prerendered.** `session-hint.tsx` runs on `useSyncExternalStore` with a server snapshot of `false`, so the prerendered
  routes ship Log in and Start free and a signed-in host's `Dashboard` lands before paint; one `getUser()` in the chrome
  would make every route dynamic. The signal is the `sb-<project-ref>-auth-token` cookie, readable because
  `@supabase/ssr` keeps the session in `document.cookie`. ★ It is a hint, never authorization: the `(app)` layout's
  `getUser()` and RLS are the boundary, and either wrong answer lands the visitor on `/login`.
- **The Resources group** is the header panel and the footer column at once (Help, Blog, Press, Contact), held as a
  two-way mirror by a test. One idea has one page and two doors: the Resources panel's featured card is the primary door
  to `/how-it-works`, the Features panel's footnote the second.
- **The footer is the ink slab** (`.surface-ink`, never a nested `.dark` or `bg-gallery`), with three registers: the
  demo invitation (a scannable frame from `sm` up, since a phone cannot scan itself; phones get a link), the index and
  the legal bar. ★ `Start free` renders at every width in both branches of the `if (!DEMO_EVENT_URL)` return, because
  the pages with no `CtaBand` would otherwise end with nothing to do whenever the demo is unset.
- **The footer's index shows everything**: four columns (Features, Events, Product, Resources, with About and Careers as
  Resources' tail), the hubs linked from the Features and Events titles, Privacy and Terms in the legal bar with
  `/llms.txt`. Nothing is collapsed: the sitemap is small enough to show whole, and a test refuses an accordion.
- **The root 404 renders the same footer outside `(marketing)`**, where marketing.css never loads, so the footer carries
  everything it needs itself: the slab's tokens, the seam glow and the demo frame's own radius, border and shadow.

## The claims every page shares

- **"No app required."**, never "no account": a new event requires verified emails by default. The claim runs across
  the OG cards, the trust strip, the footer, `events.ts`, `press.ts`, `careers.ts`, the JSON-LD `featureList`, the
  guest door and the articles, and the lines themselves live in `marketing-voice.ts` (its head comment carries the
  fence). A line may describe the per-event switch truthfully or report a different act (reporting is anonymous, the
  demo needs no sign-up). ★ The expensive case is a suggested host announcement: a help or blog line handing a host "no
  sign-up" becomes a support question a hundred times over once their event asks for an email.
- **A subhead runs opportunity, then what we do, then the benefit**: `SITE_SUBHEAD` is the model (their guests already
  shot the best photographs; what we do in one clause with no mechanism; the failure it spares them).
- **An empty state names what is about to exist**, with the album as the noun and "starts" as the verb ("Your first
  album starts here"), so it invites the first upload rather than waiting for one.
- **The promise-neutralization doctrine**: published copy commits to outcomes (a reply, a review, host control), never
  to who or what delivers them (no "a real person answers", no "a human reviews every report", no "business day"), so
  support and moderation can evolve, AI first-gates included, without breaking published and especially legal
  language. The reply line, verbatim wherever a reply is mentioned, is `REPLY_LINE` in `constants/contact.ts`;
  moderation copy is actor-free. The fence in `content-policy.test.ts` scans all of the marketing source narrowly on
  purpose, so "every upload has a real person behind it" and careers' "We read every application" stay legal.
- **The site shows no team**: no headcount, no founder biography, no named spokesperson. `/about` alone tells a
  first-person origin and closes on joining the team.
- **Comparisons stay category-level** (the cross-platform album, the account wall, the per-person rental); only the
  blog names incumbents (Google Photos, iCloud, WhatsApp, AirDrop, disposables), hedged, and a QR-app rival is never
  named.
- ★ **The reel's nouns and its one mark.** A clip is what a viewer makes from the reel; an upload is a photo or a
  video, never a "clip". The live reel and the screen carry no mark and no cap on any plan, so every watermark or
  length claim names the clip ("30-second clips with a small mark"), never the reel, which carries neither
  ([reel.md](reel.md)).
- `content-policy.test.ts`'s header lists every fenced claim and the files it scans (`CLAIM_FILES`: the copy
  single-sources, the llms builders, the legal content); a copy source outside `(marketing)` joins that list.

## Pages and their single sources

- **The home**: `sections/home/section-ids.ts` is the one source of the sections' order and surface, consecutive paper
  ids rendering inside one `PaperChapter`; the headers read `SECTION_HEADERS` in `marketing-voice.ts`.
  `constants/features.ts` and `features-layout.ts` are dead scaffold that only their own test reads.
- **The feature family**: identity in `constants/feature-pages.ts`. The hub is a directory of photographic doors
  (`features/shared/feature-door.tsx`), and the same doors close every feature page (`related-features.tsx`), so the site
  holds one picture of each feature. Every hero but /qr's composes `PageHero` (/qr's plate sits beside its lockup), and
  an eyebrow is the page's own label, never a "Features ·" breadcrumb. The FAQ band (`shared/feature-faq.tsx`) emits its
  own FAQPage JSON-LD; a page's FAQ list is data only.
- ★ **`/features/album` keeps six product facts true to the shipped app**, each easy to get wrong: verified emails are
  required by default; every upload carries a name (with the switch off, a typed name with an unverified mark), so no
  surface calls an upload or a guest anonymous; a guest's own delete leaves the album at once; a private page shows no
  name and no count (that tease is the password state); the album has no big-screen mode of its own (the wall is the
  reel's screen, [reel.md](reel.md)); nothing locks or hides at lapse.
  Every figure derives from `tiers.ts`, `limits.ts` and the lifecycle constants (`lifecycle/over-cap.ts`, whose grace
  numbers the cron reads too), and every quoted app string is pinned by `mock-parity.test.ts`.
- ★ **The album page's fill grid** (`album/album-fill-grid.tsx` over `use-album-fill.ts`, one tick and a pure derivation
  landing a tile in a laptop and a phone at once): its FLIP wrapper carries no transform of its own, its `layoutKey` is
  the mounted count, never the tick, and the beat stays above `--tune-reorder-ms`, or a landing re-runs the layout
  effect mid-slide and snaps the column.
- **`/events`**: one `[slug]` template for the four types, all copy and per-type media in `constants/events.ts`
  (`EVENT_TYPE*`, named apart from the real `events` domain). ★ `media` is the single home of a per-type photograph: no
  component names a still of its own. ★ **Every event object carries the demo's real code, never a dead link**: the
  pages server-render it as `footer-qr.tsx` does (`qrcode-generator` is DOM-free, so the matrix ships as inert markup at
  zero client JS), encoding `/demo`, never the event link; with no demo configured each object drops the piece carrying
  the code and the door proof loses its door. ★ **The prints are literal `bg-white`, never `bg-card`**: they stand on the
  cinema ground, where the card token is near-black and a paper border would render as a gap. The FAQ is native
  `<details>` with the page's own `FaqPageJsonLd`.
- **The frame library** (`marketing/frames/`): a `BrowserFrame` base and a vocabulary (album, gallery, reel, phone, QR),
  never one visual reused; `QrFrame`'s `liveQrUrl` renders a real scannable code when the demo is set.
- **`/how-it-works`**: `constants/how-it-works.ts` is the one source of both step sets, read by the page, the home's
  stepper and the app's welcome ([host-app.md](host-app.md)).
- **`/reel`**: the live style switcher is the engine's proof (the canvas arrives only behind its lazy island), then the
  live reel, the screen and the clip. The tile is the app's own `PosterCard` over `LivingStills`, so the motion a
  visitor meets there is the one they meet on their album; the screen's corner code is the demo's real one and drops
  with the demo; the clip table reads `MAX_REEL_SECONDS` and `TIER_NAMES`.
- **`/pricing`**: one paper chapter (the Free and Pro pair, the Event Pass, the configurator closing it), then one dark
  room (the unlock tiles, the matrix, the FAQ). ★ The order is deliberate: a reader sizes their event while the pair is
  still in their eye, and the room proves where Free ends. ★ It stays in `(cinema)` although it opens on paper, because
  a page cannot flip its header from inside and globals.css refuses `.dark` inside `.surface-paper`. Pro's size slider
  stops are `plansForTier("pro")`, never a typed range; the Pass ticket imports the pair's `StatRow`, never a copy; the
  configurator's two planes cannot be two card fills, because on paper `--card` and `--background` are the same white
  and `bg-muted` is the only real step; `recommend.ts` alone picks the plan; the FAQ is one list,
  `pricing-faq-data.ts`, read by the accordion and the JSON-LD; at 375 the plans stack. `shared-band.tsx` is dead.
- **`/privacy` and `/terms`**: `constants/legal.ts` (version, date, `status`, the bracketed `LEGAL_PARTY`
  placeholders, the block model, `LEGAL_RELATED`) and the content modules `legal-privacy.tsx` and `legal-terms.tsx`,
  which are env-free (never importing `site.ts`). Every section carries an "In short" line beside the formal text. The
  meta card straddling the cut is a `<div>`, never a `<header>`, because `ArticleToc` measures the first header; the rail
  takes its own overflow, since the Terms outgrow a laptop viewport. **Section ids are the anchor contract**
  (`legal.test.ts`). **The launch switch is a test**: `status: "effective"` with a bracketed placeholder still in the text
  fails CI. ★ **The Terms carry no prices and no cap numbers**; they point at `/pricing`, so a price change never
  falsifies a contract. **The fences read the legal text and its comments**, so their patterns cannot be quoted even
  in a comment: write "working days", "public authorities", "content that sexually exploits minors", "reasonable limits
  on upload volume". Acceptance is the one `LegalConsentLine`, shown once per surface (in place on `/login`, a new tab
  elsewhere, none where the surface already carries it): no checkbox, nothing recorded. The sitemap reads the legal
  `lastUpdated`. The reading pieces shared with the articles live in `marketing/reading/`.
- **`/about`**: copy in `constants/about.ts`, a `CLAIM_FILES` entry because the page file itself is reached only by the
  weaker neutralization fence. It tells the mission as a story (the opportunity, the problem, a better way), and its six
  convictions land as the answer, each linking to the page that proves it; it says who we are, never who we are not,
  and closes on careers with no `CtaBand`. The gather (`about/gather.tsx`) carries the dark-to-paper cut from `sm` up.
  ★ A beat whose concept is a change of arrangement must not hide its starting arrangement: `[data-mkt-fly]` animates
  opacity from 0, which would hide the scatter, so `.mkt-gather` moves only position and angle, and the scatter is an
  authored table (never `Math.random()`, which desyncs SSR), so the no-JS page is prints on a table.
- **The utility-page rhythm**: a cinema hero, a paper body, the ink footer, on about, blog, careers, press, privacy and
  terms; /contact alone opens on paper, in `(paper)`, a group that exists only for it. A page takes the rhythm by
  JOINING the `(cinema)` group and wrapping its body in one `PaperChapter`, which brings the dark nav, the overscroll and
  the browser chrome with it (route groups are not in URLs, so moving a page needs no redirect): a dark hero decides the
  route group, never a hand-built dark set on the paper side ([design-system.md](design-system.md)). No dark chapter
  sits in the middle of these pages; a set-apart block inside a paper body takes the muted panel, `bg-muted/40` between
  hairlines.
- **`/careers`**: copy in `constants/careers.ts` (a `CLAIM_FILES` entry); the page argues in photographs, never a pitch
  (the roll, the selects, the reel). The reel is `InlineReelPlayer`, never the engine: the engine stays out of
  first-load marketing chunks (the pure `engine/style-registry` is the one engine module there, and /reel reaches
  `CanvasReelPlayer` only behind a lazy boundary). ★ **The hero's unique pass is never lazy-loaded**: the sheet fills
  the first screen, so one set of frames loads eager (`eagerFrames`), only the repeats stay lazy, and `priority` stays at
  six, since a preload per frame would fight the LCP element. The hero's circled marks are positional (the sheet repeats
  three times, so id-based marks would circle every keeper thrice), while the roll's derive from the kept ids, so the
  four circled are provably the album's four. The offer keeps "Competitive compensation", and there is no `JobPosting`
  JSON-LD while the listing is a placeholder. `/careers/[slug]` morphs its emblem from the listing through the shared
  `morph-delegate.tsx`, mounted from a careers-scoped layout; an emblem for an unwritten role draws from neutral kinds
  only, because inheriting `reel` or `open` asserts something false. ★ The role rail's `lg:self-stretch` is
  load-bearing, or `lg:items-start` collapses the aside and sticky gets no travel (the help ToC's trap).
- **`/contact`**: its first field is a required topic, single-sourced in `constants/contact.ts` (labels, icons,
  deflection hints) and read by the zod enum, the `contact_submissions.topic` CHECK, the email's subject tag and the
  `/admin/support` chip; a parity test pins the enum to the migration. `?about=<slug>` prefills the subject and picks
  the topic through the exhaustive `CATEGORY_TOPIC` map (a new help category fails typecheck until mapped), via
  `form.reset` so "Send another" keeps it; the route stays static, reading `window.location` on mount against an
  allowlist, never `useSearchParams`. ★ A Radix Select takes no controlled `""` (it latches the placeholder over a later
  value), its hidden native bridge emits an empty `onValueChange` during mount that would clobber a programmatic pick,
  and `SelectValue` cannot resolve a label before the items mount, so the trigger's label is hand-rendered. The form's
  write path is under "Public forms".
- **`/press`, the contact sheet**: titled "Press" everywhere (a 160px masthead has to be the word the reader clicked;
  detail goes in the eyebrow), its boilerplate and fact sheet in `constants/press.ts`, the one quotable home that the
  llms builders share. The sheet's frames are deliberately not one kind of thing (a uniform grid of marks is a downloads
  table): do not tidy it. ★ The plates' grounds are literal colours (`PLATE_PAPER`, `BRAND_HEX`), never theme
  utilities: a plate is the artwork's own ground, and following a token flip hides the artwork. The grid's rebate
  insets by the same `--gap-gallery` as its gaps, or it stops reading as a rebate. The kit is manifest-driven
  (`PRESS_KIT`, `scripts/build-press-kit.mjs`, `scripts/build-press-qr.mjs` and the committed zip, which
  `press-kit.test.ts` parses back and CRC-checks), so a logo change is a files-and-rows edit.

## The content pipeline: help and blog

An in-repo MDX pipeline (`content/*.mdx`, `gray-matter`, `next-mdx-remote/rsc`, zod frontmatter validated at build) on
one core, `lib/content/collection.ts` (`loadCollection`, `slugify`, `extractHeadings`, `readingTime`, `escapeXml`),
with `help.ts` and `blog.ts` as thin wrappers.

- **In-repo by choice**: publishing is a deploy, the price of running no CMS for a curated, engineering-authored
  library. Never `@next/mdx` (file as route): it cannot list or filter a collection by frontmatter, which the index,
  search, sitemap and related articles need.
- **`blockJS` stays on**: it strips raw `{expressions}` and keeps JSX components, which is why every live number rides a
  spec component reading `tiers.ts`, `limits.ts` and the lifecycle constants, and why a UI string is quoted in its
  rendered form. Articles are first-party and build-compiled: never feed untrusted input to MDX.
- **Heading ids come from the one in-repo `slugify`** that `extractHeadings` also uses (no `rehype-slug`), so an anchor
  and the ToC cannot drift.
- **Nothing client-side may import the MDX components map** (`marketing/mdx-components.tsx`, composed from
  `mdx/spec-*.tsx`, whose composer throws on a duplicate name): it reaches `node:fs`.
- **Four tests hold the catalog honest**: every article compiles, every `<UiLabel>` is a shipped app string, every
  internal link and anchor resolves, and every literal-referenced slug is pinned; a test also scans the bodies for a
  typed size, price or limit beside its unit.
- **The authoring briefs are `content/help/AUTHORING.md` and `content/blog/AUTHORING.md`.** They name the fences by
  pointer only: the content-policy scan reads `.md` too, and a brief must obey itself.
- **Help** is a ten-category lifecycle taxonomy (set up, invite, guests, album, share, reel, pay, account, trust, fix),
  each category but troubleshooting linking up to its marketing feature. A new category lands with its first article,
  its emblem, its strip label and grid column, and its `CATEGORY_TOPIC` row (a test requires an article per category).
  At ten categories the index strip's cells need `sm:min-w-0`, or the desktop strip scrolls. Search ranks in the pure,
  fs-free `help-search-rank.ts`.
- ★ **`[data-mkt] .mkt-line` forces `display: block`** and silently kills flex utilities on the same element (an
  unlayered marketing.css rule), so centre a constrained child with `mx-auto`, never a parent's `justify-center`.
- **The blog stays distinct from /help**, since both open dark: /help opens on an instrument (a question, search, the
  emblem strip), the blog on its lead story, with no search, no emblems and a tag rail of words only.
- **The blog index's h1 is small on purpose**: `Blog` at the `subsection` step over a drawn `[data-mkt-rule]`, so the
  newest post's featured card owns the stage. It stays the h1, because it is what the page is.
- **Tags are a zero-import registry** (`lib/content/blog-tags.ts`: the client island and `PostCard` reach it, and a test
  reads the file): the schema enforces membership (a typo fails the build), one or two tags and at most one audience. The
  rail prints labels in fixed registry order, and the library heading keeps one height under every filter, because a
  height change is what the set-change FLIP animates as a jolt. "Keep reading" is scored (a shared audience counts
  double) rather than same-tag-first, which would funnel every ending to the two newest posts.
- ★ **The hero exists only in the unfiltered view**: lifting it out of a filtered set renders empty tags, because a
  hero can own tags no other post has (`lib/content/blog-index.ts`; `normalizeTag` checks posts, not the registry).
  The filter rides `?tag=` through `useSyncExternalStore`, never `useSearchParams`, which would deopt the static route;
  pagination rides `?page=`, never `/blog/page/[n]` routes, which would multiply the URL space. ★ `paginate()` clamps,
  so a stale page lands on a real one. The develop stagger is capped on library cards so the staged lead lands last.
- ★ **A cover fallback is a pure function of the slug** (`lib/content/blog-covers.ts`), so publishing never re-skins an
  older post; walking the list to hand out unused images is deterministic but not stable. A frontmatter `cover` is a
  `MARKETING_IMAGES` id (a typo fails the build), and a test pins that no photograph repeats beside itself on any page or
  filter and that the lead is landscape.
- **An article opens on the same cover at the same crop as the card**, its `description` the standfirst; it ends on
  its chronological neighbours, then related posts excluding them. An optional `faq` renders outside the body (so the
  reading spine measures the article) and ships as `FaqPageJsonLd`. Every long-form page marks its body with
  `ARTICLE_BODY_ID`.
- **The cover morph is the native View Transitions API**, driven by `system/morph-delegate.tsx` from one delegated
  island so every card stays a server component. It is not React's `<ViewTransition>`, which needs
  `experimental.viewTransition` and swaps the whole app's React runtime to a canary: a product-wide trade that is Will's
  call. ★ The delegate intercepts in the CAPTURE phase, because `next/link` calls `preventDefault` first and a bubble
  listener bails (the morph silently does nothing while navigation works); and the delegate, not the server render,
  owns `view-transition-name`, because a name cleared from an incoming cover is a DOM mutation React never undoes, which
  would disarm every later morph. The CSS is name-scoped, since `::view-transition-*` is document-global.
- **One registered author** (`partyreel-team`): a dormant named entry is what a content agent picks up by accident. The
  byline is one component on the body face. `title` caps at 80 characters as a layout contract, failing the build
  rather than shipping a clamped title. The OG card reads its cover off disk, never fetched, because
  `NEXT_PUBLIC_SITE_URL` resolves to prod on preview builds. The RSS feed (`/blog/feed.xml`) is force-static, and
  `buildBlogRssXml` takes its config as a parameter, staying out of the env-validating `site.ts`. `draft: true` posts are
  excluded everywhere; retired slugs 308 through `blog-redirects.ts` into `redirects()`.

## Public forms

The contact and application forms write the deny-all `contact_submissions` and `job_applications` tables.

- **The row is authoritative; the email is best effort.** The Server Action inserts on the service-role admin client
  FIRST, then tries the Resend notify in a try/catch (`sendOnce`, `dedupeKey` the row id so a double submit notifies
  once, `replyTo` the submitter); a missing key, an unset inbox or a failed send is logged and swallowed, never changing
  what the visitor sees.
- **No anon RPC and no anon grant sit behind a public form**, so it adds no anon-executable surface. The hidden
  `website` honeypot returns success without storing, so a bot learns nothing.
- The address shown is `SUPPORT_EMAIL`; the destination is the optional `CONTACT_NOTIFY_EMAIL` (falling back to it), so
  moving the mail is an env swap. Resend Inbound stays unused (webhook-only ingestion, no mailbox).

## SEO, OG and the AI layer

- **The root layout sets `metadataBase` from `SITE_URL`**, because Next errors on relative OG URLs without it.
- ★ **`SITE_DESCRIPTION` is its own line, never the hero subhead**: composed as thesis plus subhead it passes 160
  characters and every result cuts it mid-clause. The line is `SITE_DESCRIPTION_LINE` in `marketing-voice.ts`
  (env-free, so a pure test measures it), composed with the thesis in `site.ts`.
- **OG images are code-generated with `next/og`**: the site-wide card, per-route cards and the per-event card
  (`(guest)/e/[token]/opengraph-image.tsx`). They load no font: the built-in one dodges the satori font trap, so never
  add a loader.
- ★ **The event page unfurls but is never indexed**: `/e/[token]` emits the event's OG through `generateMetadata` with
  `robots: { index: false }`, because the opaque `qr_token` must never reach an index, and `robots.ts` disallows `/e/`
  (with the app, admin, auth, `/design` and `/api/`) while `/u/[slug]` profiles stay crawlable. `getEventByQrToken` is
  wrapped in React `cache()`, so the metadata, the page and the OG image share one RPC.
- **The sitemap lists only the marketing routes**, each with its content date where it has one.
- **The AI layer**: `/llms.txt` and `/llms-full.txt` are built by pure functions in `lib/content/llms.ts` (numbers from
  `tiers.ts` and `limits.ts`; a `CLAIM_FILES` entry; link integrity tested against the real routes) and served
  force-static; the short file lists a few articles per help shelf and the newest posts, because the catalog outgrows
  its budget. `robots.ts` allows the AI crawlers by name. A `SoftwareApplication` schema mounts in the `(marketing)`
  layout beside Organization and WebSite, with no ratings or reviews: absent beats fabricated. The llms files' "When it
  is not" section is deliberate credibility: never "fix" it into praise.
- ★ **A count can glue itself to its noun**: Next 16's SWC drops the leading whitespace of a JSX text run that spans
  lines and holds an HTML entity (`&rsquo;`, `&nbsp;`), so `{n} marketing pages` renders "24marketing". tsc does not
  reproduce it, and a prettier reflow can create the shape; put an explicit `{" "}` after the expression.
- **In `pnpm dev` the `og:image` URL shows the localhost host** while the sitemap and robots show the partyreel.com
  fallback: not a bug. The per-event OG URL carries a hash suffix, so read it from `<head>`.

## The 404 pages

Seven `not-found.tsx` files share one presentational core, `shared/not-found-screen.tsx` (exactly one of `visual` or
`icon`, a `help` line, and a `digest` on the crash screens only), each with one chrome, a 404 status and `noindex`.

- **The root `not-found.tsx` renders its own header and footer**, because an unmatched URL falls through to
  `app/layout.tsx` with no group chrome; on the admin build it branches on `surface() === "admin"` to the portal's own
  screen.
- ★ **Each marketing group carries its own boundary**, rendering only the centred content (copy in
  `marketing-not-found.tsx`): the chrome lives in the `(cinema)` and `(paper)` layouts, so a `notFound()` with no nearer
  boundary renders the ROOT not-found inside a group layout that already drew a header and footer, and the chrome
  double-stacks. A `(marketing)`-level boundary would render skinless. ★ Never delete the `(paper)` 404 for catching no
  `[slug]`: a static page can call `notFound()` too.
- **By audience**: root (its own chrome), marketing (a bad slug, no chrome), guest (an event link that resolves to
  nothing: reassurance, "What is Partyreel?" and the demo under the logo-only bar; an unknown `/u/` handle has its own
  boundary that never says why), host (inside `AppShell`), admin (inside the MFA-gated `AdminShell`).
- **The root 404 stands on the image trail** (`shared/trail`), which walks its own figure until a cursor takes over.
  Nothing is laid over a photograph: the words punch a feathered window in the trail, so the muted description keeps its
  contrast; the trail needs layout, so without scripting a reader gets the words and links on clean paper.

## The demo (marketing side)

The demo is one real curated event, switched on by one public env var and needing no schema of its own.

- ★ **`NEXT_PUBLIC_DEMO_QR_TOKEN` must be read explicitly in `env.ts`'s `parsePublic()`**: Next inlines only a
  literally named `process.env.NEXT_PUBLIC_*`, so a var added to the schema but not its reader stays `undefined` in prod.
- **`lib/demo.ts` is the single source** (`DEMO_EVENT_URL`, `isDemoToken`). Set, every demo door links the real event
  and the `/features/qr` code scans; unset, no demo link exists anywhere and each door stands down.
- **`/demo` (`app/demo/route.ts`) is a 307**, never a cached 308, because the demo row can be re-seeded or retired.
- **One `DemoFrame` is every demo door** (`system/demo-ticket.tsx`): the home hero's plate, the footer invitation, a
  feature page's demo line and the Features panel. Its corner code trades scannability for proportion, a symbol and a tap
  target at the hero sizes; the footer's is bigger, because its copy promises a scan.
- The guest-side demo mode is [guest-flow.md](guest-flow.md)'s; the in-app QR designer and the welcome are
  [host-app.md](host-app.md)'s; the marketing analytics and the OG-driven growth are
  [notifications-analytics-growth.md](notifications-analytics-growth.md)'s.
