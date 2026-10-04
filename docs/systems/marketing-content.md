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
([design-system.md](design-system.md), whose "Chapters" paces every core page). Its motion is calm and fluid but never
still: a loop moves often enough that a visitor scrolling past never misses a step, which is what makes them stop and
watch; and a punchy line beside a strong visual beats a paragraph.

**The copy sells the feeling truthfully, never pedantically literally**, headings and hero lines above all, on every
marketing surface: "Uploads appear the moment guests take them" stays, though the calm album shows another guest's
photo some seconds later, since a reader knows nothing is instant and a qualifier like "within seconds" only kills the
line (the live album is keeping one open and watching it fill). Exactness lives where a reader looks for it: the
pricing table and its hover lines, the help, the fine print. Prices and limits are exact everywhere, and a claim is
never false (the fences below).

One `SITE_URL` and brand constant set
(`src/lib/constants/site.ts`) feeds the sitemap, robots and the root `metadataBase`; `BRAND_HEX` is a literal hex
because satori reads no CSS token.

## The chrome: header, nav, footer

The nav is single-sourced in `lib/constants/marketing-nav.ts` and drawn by `marketing-header.tsx` (its shell and the
hide-on-scroll in `header-shell.tsx`, desktop panels in `marketing-nav.tsx`, a full-screen phone menu in
`mobile-menu.tsx`) and `marketing-footer.tsx`; both render only live routes.

- ★ **The chrome reads no session on the server, so every marketing route stays prerendered**: one `getUser()` in the
  chrome would make every route dynamic and cost an Auth round-trip per view. The header's right cluster reads the
  `sb-<project-ref>-auth-token` cookie on the client (`session-hint.tsx`, on `useSyncExternalStore` with a server
  snapshot of `false`), readable because `@supabase/ssr` keeps the session in `document.cookie`. It is a hint, never
  authorization: the `(app)` layout's `getUser()` and RLS are the boundary, and either wrong answer lands the visitor
  on `/login`.
- **marketing.css loads only inside `(marketing)`, and its recipes are unlayered.** The root 404 renders this header and
  footer outside the group, so each chrome piece carries what it needs itself (a fallback or a literal on every clock,
  the slab's tokens, the demo pile's box and rest pose). An unlayered recipe outranks every utility on its element
  ([design-system.md](design-system.md)): `[data-mkt] .mkt-line` forces `display: block`, so centre a constrained child
  with `mx-auto`, never a parent's `justify-center`; the pile's rest pose is a layered utility on purpose, so on a
  marketing page the recipe's hover fan wins, where an inline pose would outrank it everywhere.
- **The Resources group** is the header panel and the footer column at once, a mirror `marketing-nav.test.ts` holds;
  Press goes to the kit band on About (`ABOUT_PRESS_HREF`). Each menu's Search row is component-side, since an action is
  not a route: it rings the help palette (the help center's bullets below).
- **The footer's FAQ link follows the page** (`footer-faq-link.tsx`, a client island because a server footer cannot read
  the pathname): on a route in `OWN_FAQ_ROUTES`, whose FAQ band carries `id="faq"`, it stays there, and from every other
  page it goes to the home's; `marketing-nav.test.ts` holds the list both ways.

## The claims every page shares

- **"No app required.", never "no account"**: a new event requires verified emails by default. The lines live in
  `marketing-voice.ts`, whose head comment holds the fence; a line may describe the per-event switch truthfully or
  report a different act (reporting is anonymous, the demo needs no sign-up). ★ The expensive case is a suggested host
  announcement: a help or blog line handing a host "no sign-up" becomes a support question a hundred times over once
  their event asks for an email. `content-policy.test.ts` refuses a line promising "no app" and "no account" together.
- ★ **A line that says an event "stays up" carries the Free plan's one exception**: an event nobody touches for about six
  months is warned about by email, then moved to Deleted, where it can be restored for 30 days (the help guide's rule 7,
  derived from `lifecycle/inactivity.ts` (`INACTIVE_MONTHS`) and `recently-deleted.ts`). The home FAQ's keep answer,
  the event pages' lines and the two blog posts that say how long an album lasts hold it (`faq-data.test.ts`,
  `events.test.ts`, `blog-keep-lines.test.ts`); the pricing FAQ, the llms files and `/features/privacy` carry it too.
- **An empty state names what is about to exist**, with the album as the noun and "starts" as the verb ("Your first
  album starts here"), so it invites the first upload rather than waiting for one.
- **The promise-neutralization doctrine**: published copy commits to outcomes (a reply, a review, host control), never
  to who or what delivers them (no "a real person answers", no "a human reviews every report", no "business day"), so
  support and moderation can evolve, AI first-gates included, without breaking published and especially legal
  language. The reply line, verbatim wherever a reply is mentioned, is `REPLY_LINE` in `constants/contact.ts`. The
  fence in `content-policy.test.ts` scans all of the marketing source narrowly on purpose, so "every upload has a real
  person behind it" and careers' "We read every application" stay legal.
- **The site shows no team** (no headcount, no founder biography, no named spokesperson), so nothing hints at less than
  a stellar product; `/about` tells a first-person origin, and careers is where "small team" may live.
- **Comparisons stay category-level** (the cross-platform album, the account wall, the per-person rental), since naming
  products dates the copy and sounds defensive; only the blog names incumbents, hedged, and never a QR-app rival
  (`content/blog/AUTHORING.md`).
- **Every watermark or length claim names the clip, never the reel**: the live reel and the screen carry no mark and no
  cap on any plan, and an upload is never a "clip" ([reel.md](reel.md) holds the nouns and the clip's levers).
- `content-policy.test.ts`'s header lists every fenced claim, and its claims fence reads every constant under
  `src/lib/constants/` (the copy single-sources and the legal content, so a new one is fenced the day it lands) but
  the ones `CLAIM_EXEMPT_CONSTANTS` names with a reason (none today: the uploads allowance is published, and the fence
  reads only the unpublished breakers' numbers, from the SQL that enforces them), plus the FAQ answers and the llms
  builders; a copy source outside `src/lib/constants/` joins `CLAIM_FILES` by hand.

## Pages and their single sources

- **Each section's media is made for its own point, never borrowed from the demo**: a film for the home's reel teaser,
  a still for a card, each a `marketing-media.ts` entry named by the component that shows it, since a feature demo needs
  to explain the product, not to agree with the demo album. The demo stays an experience a visitor opens on purpose,
  through its labelled doors (below). Every Watch opens the one contained player (`sections/shared/reel-player.tsx`),
  which keeps the reader on the page.
- **The home**: `sections/home/section-ids.ts` is the one source of the sections' order and surface, consecutive paper
  ids rendering inside one `PaperChapter`; the headers read `SECTION_HEADERS` in `marketing-voice.ts`.
- **The feature family**: identity in `constants/feature-pages.ts`. The hub is a directory of photographic doors
  (`features/shared/feature-door.tsx`), and the same doors close every feature page (`related-features.tsx`), so the site
  holds one picture of each feature. The FAQ band (`shared/feature-faq.tsx`) emits its own FAQPage JSON-LD; a page's FAQ
  list is data only.
- ★ **`/features/album` keeps six product facts true to the shipped app**, each easy to get wrong: verified emails are
  required by default; every upload carries a name (with the switch off, a typed name with an unverified mark), so no
  surface calls an upload or a guest anonymous; a guest's own delete leaves the album at once; a private page shows no
  name and no count (that tease is the password state's); the album has no big-screen mode of its own (the wall is the
  reel's screen, [reel.md](reel.md)); nothing locks or hides at lapse. Every figure derives from `tiers.ts`, `limits.ts`
  and the lifecycle constants (`lifecycle/over-cap.ts`), and every quoted app string is pinned by `mock-parity.test.ts`.
- **The album page's hero is the live album taking uploads** (`album/arrivals-hero.tsx` over `shared/album-stream/` and
  `live-album-stage.tsx`; the filling grid is `album-fill-grid.tsx` over `use-album-fill.ts`).
- **`/features/privacy`'s hero is the lens** (`sections/features/privacy/`), a server component with no script of its
  own: every number in `privacy-lens.ts`, the structure in `privacy-lens.css`. The photograph (`PRIVACY_STILL`) is the
  one thing to swap; re-measure the words' contrast over the loop when it changes, since the pools behind the words were
  sized on the stand-in.
- **`/events`**: one `[slug]` template for the four types, all copy and per-type media in `constants/events.ts`
  (`EVENT_TYPE*`, named apart from the real `events` domain). The FAQ is the one shared accordion (`faq-accordion.tsx`,
  whose head holds why it is not a `<details>` and how find-in-page opens a closed answer) with the page's own
  `FaqPageJsonLd`.
- **The frame library** (`marketing/frames/`): a `BrowserFrame` base and a vocabulary (album, gallery, reel, phone, QR);
  `QrFrame`'s `liveQrUrl` renders a real scannable code when the demo is set.
- **`/how-it-works`**: `constants/how-it-works.ts` is the one source of both step sets, read by the page, the home's
  stepper and the app's welcome ([host-app.md](host-app.md)).
- **`/reel`**: the tile is the app's own `PosterCard` over `LivingStills`, so the motion a visitor meets there is the one
  they meet on their album; the clip table reads `clipTermsFor` (the clip creator's own facts, the pricing matrix's
  phrase too) under `TIER_NAMES`; the hero's heading is `REEL_LINE` (`marketing-voice.ts`), the reel door's line, so the
  door and the room it opens agree. The reel engine stays out of first-load marketing chunks (the pure
  `engine/style-registry` is the one engine module there): /reel reaches `CanvasReelPlayer` only behind a lazy boundary,
  and /careers plays `InlineReelPlayer`.
- **`/pricing`**: one paper chapter (the Free and Pro pair, the Event Pass, the configurator closing it), then one dark
  room (the unlock tiles, the matrix, the FAQ), so a reader sizes their event while the pair is still in their eye and
  the room proves where Free ends. It stays in `(cinema)` although it opens on paper, because a page cannot flip its
  header from inside and globals.css refuses `.dark` inside `.surface-paper`. Pro's size slider stops are
  `plansForTier("pro")`, never a typed range; the Pass ticket imports the pair's `StatRow`, never a copy; `recommend.ts`
  alone picks the plan; the FAQ is one list, `pricing-faq-data.ts`, read by the accordion and the JSON-LD (its section
  is `id="faq"`, the target of the footer's FAQ link while a reader is on this page).
- **`/privacy` and `/terms`**: `constants/legal.ts` (version, date, `status`, the bracketed `LEGAL_PARTY`
  placeholders, the block model, `LEGAL_RELATED`) and the content modules `legal-privacy.tsx` and `legal-terms.tsx`,
  which are env-free (never importing `site.ts`). Every section carries an "In short" line beside the formal text.
  **Section ids are the anchor contract** (`legal.test.ts`). **The launch switch is a test**: `status: "effective"` with
  a bracketed placeholder still in the text fails CI. ★ **The Terms carry no prices and no cap numbers**; they point at
  `/pricing`, so a price change never falsifies a contract. **The fences read the legal text and its comments**, so
  their patterns cannot be quoted even in a comment: write "working days", "public authorities", "content that
  sexually exploits minors", "reasonable limits on upload volume". Acceptance is the one `LegalConsentLine`, shown once
  per surface (in place on `/login`, a new tab elsewhere, none where the surface already carries it): no checkbox,
  nothing recorded. The reading pieces shared with the articles live in `marketing/reading/`; `ArticleToc` measures the
  first `<header>` for its scroll offset, so the meta card straddling the cut is a `<div>`.
- **`/about`**: copy in `constants/about.ts`, a `CLAIM_FILES` entry because the page file itself is reached only by the
  weaker neutralization fence. The press kit is a band on it (`about/press-kit-band.tsx`, copy in `ABOUT_PRESS_KIT`,
  `id="press"`), and `/press` is a page whose only act is `redirect()` (a 307, never a 308: the kit's home may move
  again, and a permanent redirect would sit in every CDN and phone that followed it), out of the sitemap; every door
  that names the kit reads `ABOUT_PRESS_HREF`. The kit is manifest-driven (`PRESS_KIT`, `scripts/build-press-kit.mjs`,
  `scripts/build-press-qr.mjs` and the committed zip, which `press-kit.test.ts` parses back and CRC-checks), so a logo
  change is a files-and-rows edit. The paragraph both llms files open on lives in `lib/content/llms.ts`, and the fact
  sheet (`PRESS_FACTS`) feeds `/llms-full.txt` alone.
- **The utility-page rhythm**: a cinema hero, a paper body, the ink footer, on about, blog, careers, contact, privacy
  and terms. A page takes the rhythm by joining the `(cinema)` group and wrapping its body in one `PaperChapter`, which
  brings the dark nav, the overscroll and the browser chrome with it (route groups are not in URLs, so moving a page
  needs no redirect); a light page is a `PaperChapter` inside `(cinema)`, since no paper group exists, and dark chrome is
  never hand-built on the paper side ([design-system.md](design-system.md)). The body stays one paper chapter, so a
  set-apart block inside it takes the muted panel, `bg-muted/40` between hairlines, rather than a dark chapter.
- **`/careers`**: copy in `constants/careers.ts` (a `CLAIM_FILES` entry), and no `JobPosting` JSON-LD while the listing
  is a placeholder, since structured data would publish a vacancy we are not ready to commit to. `/careers/[slug]`
  morphs its emblem from the listing through the shared `morph-delegate.tsx` (the blog's cover morph, below), mounted
  from a careers-scoped layout; an emblem for an unwritten role draws from neutral kinds only, because inheriting `reel`
  or `open` asserts something false.
- **`/contact`**: its first field is a required topic, single-sourced in `constants/contact.ts` (labels, icons, each
  topic's note and help links, the directory beside the form) and read by the zod enum, the `contact_submissions.topic`
  CHECK, the email's subject tag and the `/admin/support` chip; a parity test pins the enum to the migration, so a new
  topic is a migration too. `contact.test.ts` holds every hint link to a real route or article and each topic to its own
  answers, with no reply timing of a hint's own: `REPLY_LINE` is the only true one, so a per-topic promise would be
  invented. `?about=<slug>` prefills the subject and picks the topic through the exhaustive `CATEGORY_TOPIC` map (a new
  help category fails typecheck until mapped); the route stays static by reading `window.location` on mount against an
  allowlist of OWN keys (a plain object also answers `constructor`), never `useSearchParams`.

## The content pipeline: help and blog

An in-repo MDX pipeline (`content/*.mdx`, `gray-matter`, `next-mdx-remote/rsc`, zod frontmatter validated at build) on
one core, `lib/content/collection.ts` (`loadCollection`, `slugify`, `extractHeadings`, `readingTime`, `escapeXml`),
with `help.ts` and `blog.ts` as thin wrappers.

- **In-repo by choice**: publishing is a deploy, the price of running no CMS for a curated, engineering-authored
  library. `@next/mdx` (file as route) cannot list or filter a collection by frontmatter, which the index, search,
  sitemap and related articles need.
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
- **Help** is a lifecycle taxonomy (`help.ts`), each category but troubleshooting linking up to its marketing feature; a
  troubleshooting article ends on its own frontmatter `rung` instead, the working version of the same act
  (`help.test.ts`). A new category lands with its first article, its emblem, its strip label and grid column, and its
  `CATEGORY_TOPIC` row. Search ranks in the pure, fs-free `help-search-rank.ts`.
- **The help palette mounts in `help/layout.tsx` and `/contact` only** (`help-palette-mounts.test.tsx`), so the admin
  portal's own ⌘K never meets a second one. Everything else reaches it through `help-search-signal.ts`: a Search row
  rings a window event a mounted palette answers in place, and goes to `/help?search` when nothing does, where the
  palette opens on arrival and the query leaves the address. A query, never a hash: a client navigation to `#search`
  finds no element and scrolls the arriving page. A bell and not a context, because the chrome sits above
  `help/layout.tsx` and cannot read the provider's context.
- **Every how-to step names the screen it describes** (`<Step screen="…">`, and a `<Callout>`'s, an id in
  `help/step-screens/registry.ts`; a test fails a step without one), drawn from the product's own pieces, and every word
  a picture quotes is held to the file it quotes (`step-screens.test.ts`).
- **"Did this answer your question?" is a counted beacon**: one fire-and-forget post a click to `/api/help/feedback`
  (JSON only, a published slug only, a bare status back), one identity-free `article_feedback` row read only at
  `/admin/help-feedback`; the reader's thank-you or sorry never depends on it. Its limiter and table are
  [database-security.md](database-security.md)'s, its reading [admin-observability.md](admin-observability.md)'s.
- **Tags are a zero-import registry** (`lib/content/blog-tags.ts`: the client island and `PostCard` reach it): the
  schema enforces membership (a typo fails the build), one or two tags and at most one audience.
- **The blog index stays static**: the filter rides `?tag=` through `useSyncExternalStore`, never `useSearchParams`,
  which would deopt the static route, and pagination rides `?page=`, not `/blog/page/[n]` routes, which would multiply
  the URL space.
- **A cover fallback is a pure function of the slug** (`lib/content/blog-covers.ts`), so publishing never re-skins an
  older post; a frontmatter `cover` is a `MARKETING_IMAGES` id (a typo fails the build).
- **An article's optional `faq` renders outside its body** (so the reading spine measures the article) and ships as
  `FaqPageJsonLd`; every long-form page marks its body with `ARTICLE_BODY_ID`.
- **The cover morph is the native View Transitions API**, driven by `system/morph-delegate.tsx` from one delegated
  island so every card stays a server component. React's `<ViewTransition>` needs `experimental.viewTransition`, which
  swaps the whole app's React runtime to a canary: a product-wide trade to raise as a question, not to make inside a
  marketing change. The delegate intercepts in the CAPTURE phase, because `next/link` calls `preventDefault` first and
  a bubble listener bails (the morph silently does nothing while navigation works); and the delegate, not the server
  render, owns `view-transition-name`, because a name cleared from an incoming cover is a DOM mutation React never
  undoes, which would disarm every later morph.
- **One registered author** (`partyreel-team`): a dormant named entry is what a content agent picks up by accident. The
  OG card reads its cover off disk, never fetched, because `NEXT_PUBLIC_SITE_URL` resolves to prod on preview builds.
  Retired slugs 308 through `blog-redirects.ts` into `redirects()`.

## Public forms

The contact and application forms write the deny-all `contact_submissions` and `job_applications` tables, on ONE
contract: the shared fields and honeypot (`lib/validation/public-form.ts`) and one pipeline (`submitPublicForm`,
`lib/security/public-form-submit.ts`: validate, the honeypot, the form's own refusal, the rate gate, the row, the
notify), each Server Function naming only its schema, its row and its mail (`public-form-submit.test.ts` drives both
end to end). The rate gate fails closed ([database-security.md](database-security.md)).

- **The row is authoritative; the email is best effort.** The pipeline inserts on the service-role admin client
  FIRST, then tries the Resend notify in a try/catch (`sendOnce`, `dedupeKey` the row id so a double submit notifies
  once, `replyTo` the submitter); a missing key, an unset inbox or a failed send is logged and swallowed, never changing
  what the visitor sees.
- **No anon RPC and no anon grant sit behind a public form**, so it adds no anon-executable surface. ★ The hidden
  honeypot is named for nothing an autofill fills (`HONEYPOT_FIELD`, `lantern`), or a real person's note would vanish
  behind a success: it returns success before the rate gate (and before a careers role is looked up) and stores
  nothing, so a bot learns nothing, and a walk of the success path on a dev server fills it to send no row and no mail.
- ★ **No receipt email**: a send to an address nobody verified is a spoofed send or an inbox bomb, so a sent note
  becomes a receipt on the card that wrote it (`NoteReceipt`, `components/marketing/forms/`), showing the sender's own
  words and the address a reply goes to, and nothing leaves the server a second time.
- The address shown is `SUPPORT_EMAIL`; the destination is the optional `CONTACT_NOTIFY_EMAIL` (falling back to it), so
  moving the mail is an env swap. Resend Inbound stays unused (webhook-only ingestion, no mailbox).

## SEO, OG and the AI layer

- **`SITE_DESCRIPTION` is its own line, never the hero subhead**: composed as thesis plus subhead it passes 160
  characters and every result cuts it mid-clause. The line is `SITE_DESCRIPTION_LINE` in `marketing-voice.ts`
  (env-free, so a pure test measures it), composed with the thesis in `site.ts`.
- **OG images are code-generated with `next/og`**: the site-wide card, per-route cards and the per-event card, a route
  at `/e/<token>/card` rather than an `opengraph-image` file ([guest-flow.md](guest-flow.md) says why). They load no
  custom font: the built-in one dodges the Next 16 satori font gotcha their heads name.
- ★ **The event page unfurls but is never indexed**: `/e/[token]` emits the event's OG through `generateMetadata` with
  `robots: { index: false }`, because the opaque `qr_token` must never reach an index, and `robots.ts` disallows `/e/`
  (with the app, admin, auth, `/design` and `/api/`) while `/u/[slug]` profiles stay crawlable. `getEventByQrToken` is
  wrapped in React `cache()`, so the metadata and the page share one RPC.
- **The sitemap lists only the marketing routes**, each with its content date where it has one.
- **The AI layer**: `/llms.txt` and `/llms-full.txt` are built by pure functions in `lib/content/llms.ts` (numbers from
  `tiers.ts` and `limits.ts`; a `CLAIM_FILES` entry; link integrity tested against the real routes) and served
  force-static; the short file lists a few articles per help shelf and the newest posts, because the catalog outgrows
  its budget. `robots.ts` allows the AI crawlers by name. A `SoftwareApplication` schema mounts in the `(marketing)`
  layout beside Organization and WebSite, with no ratings or reviews: absent beats fabricated. The llms files' "When it
  is not" section is deliberate credibility, kept honest rather than turned into praise.
- **A count can glue itself to its noun**: Next 16's SWC drops the leading whitespace of a JSX text run that spans
  lines and holds an HTML entity (`&rsquo;`, `&nbsp;`), so `{n} marketing pages` renders "24marketing"; tsc and the
  test runner's transform do not reproduce it, and a prettier reflow can create the shape. Keep the space out of such a
  text (the value and its word as one string, the entity written as its character): a `{" "}` is no fix, since
  prettier folds it back. `jsx-text-space-policy.test.ts` compiles with SWC and refuses the shape.
- **In `pnpm dev` the `og:image` URL shows the localhost host** while the sitemap and robots show the partyreel.com
  fallback: not a bug. A per-route card's URL carries a hash suffix (its file sits in a route group), so read it from
  `<head>`.

## The 404 pages

Six `not-found.tsx` files, five sharing one presentational core, `shared/not-found-screen.tsx`, and the guest link's
wearing the door's own empty doorway ([guest-flow.md](guest-flow.md), the door family), each with one chrome and
`noindex`. By audience: root (its own header and footer in `app/not-found.site.tsx`, since an unmatched URL falls
through to `app/layout.tsx` with no group chrome; on the admin build it branches on `surface() === "admin"` to the
portal's screen), marketing (a cinema page's own `notFound()`, no chrome), guest (an event link that resolves to
nothing, under the logo-only bar; an unknown `/u/` handle has its own screen that never says why), host (inside
`AppShell`) and admin (inside the MFA-gated `AdminShell`).

- ★ **No `not-found.tsx` draws anything itself**: Next renders a not-found into every page under it (the root's into
  every route's, a group's into each page of the group), so whatever one drew rides every page (the root's chrome inline
  would cost every route about 110 KB of HTML). Each keeps its metadata and renders one reference into the one client
  boundary (`app/not-found.lazy.tsx`, `next/dynamic` in a client module, a real split), whose loaders name each screen
  (`app/not-found.site.tsx`, the admin host's, and a group's `not-found.screen.tsx` beside its `not-found.tsx`); one
  boundary, not one per group, since each boundary's chunk carries its own copy of `next/dynamic`'s runtime.
  `not-found.test.ts` walks every not-found's eager imports, so a new one that draws is refused.
- ★ **A link a stranger holds never throws `notFound()`**: one thrown while a page renders is served as Next's error
  shell (`<html id="__next_error__">`, an empty body) and drawn by the client once its script has run (about six
  seconds of white on Slow 4G at 4x CPU, never drawn without script), and Next 16.2.6 gives a page no way to set its own
  status. So the guest link and the profile draw their segment's not-found themselves, in the HTML, titled by its
  metadata and noindex, and answer 200, a soft 404; every marketing `[slug]` page declares `dynamicParams = false`, so
  an unknown slug is routing's 404 with the root's screen (`marketing-dynamic-params-policy.test.ts`). The host app's
  event pages and the portal's record pages draw theirs the same way: behind sign-in nothing reads the status, so they
  answer 200, titled from their group's `not-found.metadata.ts`. What still throws (a cinema page's own, the print
  sheet's) paints its screen one request after the boundary's chunk.
- ★ **A status the proxy sets on a request it sends on never reaches the page**: on Vercel,
  `NextResponse.next({ status: 404 })` is answered with the platform's own `/404`, the root's page from cache, and the
  page never renders, while `next start` honours the status, so it passes locally. The proxy's only 404s are its two
  rewrites to the root's own page (the surface rule's, the lab gate's), the page Vercel's `/404` serves anyway.
- **`global-not-found` is no substitute in Next 16.2.6**: experimental, it serves only unmatched URLs (a thrown
  `notFound()` with no nearer boundary, the lab's or the print sheet's, would draw Next's bare default), needs its own
  copy of the document shell, and sits on every route's root layer, so its client JS still loads everywhere.
- **The marketing group's boundary is `(cinema)`'s, rendering only the centred content** (copy in
  `marketing-not-found.tsx`): the chrome lives in the `(cinema)` layout, so with no nearer boundary the root not-found
  would render inside a layout that already drew a header and footer, and the chrome would double-stack; a
  `(marketing)`-level boundary would render skinless. It stays although no `[slug]` sits in `(cinema)`, since a static
  page can call `notFound()` too.
- **The root 404's links prefetch nothing on sight** (`QuietChromePrefetch` around its screen, every link drawn through
  `ChromeLink`): standing outside `(marketing)`, it holds none of the sheets its links' routes need, and a prefetched
  payload makes React preload each sheet it names, never drawn. A press still navigates in place and fetches then.

## The demo (marketing side)

The demo is one real curated event, switched on by one public env var, `NEXT_PUBLIC_DEMO_QR_TOKEN` (named literally in
`env.ts`'s `parsePublic()`, whose head says why), and needing no schema of its own.

- **`lib/demo.ts` is the single source** (`DEMO_EVENT_URL`, `isDemoToken`). Set, every demo door links the real event
  and the `/features/qr` code scans; unset, no demo link exists anywhere and each door stands down, so no page carries a
  dead link or a code that encodes the site it is on.
- **`/demo` (`app/demo/route.ts`) is a 307**, never a cached 308, because the demo row can be re-seeded or retired.
- **The demo's doors are objects built for their places**: the home hero's link card
  (`sections/home/cinema-hero-card.tsx`), `DemoFrame` (`system/demo-ticket.tsx`, the Features panel's pane), the
  footer's invitation (`chrome/footer-demo.tsx`) and `DemoCtaLink` (the live dot and the words). A code is drawn to scan
  only where its copy promises a scan (the footer's, the event objects'); the hero card's and `DemoFrame`'s are symbols,
  since the modal a desk's press opens carries the one that scans.
- **Every pointer to the demo is a demo door** (`system/demo-modal/`): a real `target="_blank"` link, so a phone, a
  tablet (a coarse pointer), a modified press and a reader without script open the demo in a new tab, and a plain press
  at a desk (640 and up, a fine pointer: the Sheet's own split) opens the one demo modal. The modal belongs to the page,
  not the door: a door only asks (`store.ts`) and one host draws it (`host.tsx`, its own root on `<body>` on the first
  press), because a door can leave while the modal is up, and focus returns to the opener or the fallback it named. A
  plain link to the demo is easy to miss in review, so `demo-door-policy.test.ts` refuses one anywhere in the marketing
  source.
- The guest-side demo mode is [guest-flow.md](guest-flow.md)'s; the in-app QR designer and the welcome are
  [host-app.md](host-app.md)'s; the marketing analytics and the OG-driven growth are
  [notifications-analytics-growth.md](notifications-analytics-growth.md)'s.
