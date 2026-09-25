# The help library: authoring brief

The working brief for anyone writing or editing help articles. This file is
about the CONTENT; the help center's UI (the index, the ⌘K palette, the
article layout) belongs to the Library and the `help-center` board. It never
renders (the loader reads only `.mdx`), but the content-policy tests scan it
too, so it obeys the rules it teaches.

The articles sit in ten categories (the map below). When the product and an
article disagree, the product is right: fix the article and set `updated`.

## The one-sentence contract

Every article is a short, true ANSWER (roughly 250 to 500 words) whose
frontmatter `description` IS the short answer: the article page renders it as
the "In short" lead under the title, and it doubles as the meta description.
Write it so someone could stop reading after it.

## Frontmatter

The schema is `helpFrontmatterSchema` in `src/lib/content/help.ts`. Point of
truth lives there (including the description length cap); do not trust this
file for limits. Field notes:

- `title`: the question or task, in the reader's words, and ideally in the
  app's words (the label they just saw). It must carry the article alone in
  a result list. No leading "The" unless natural.
- `description`: the short answer. A statement, not a teaser.
- `category`: one of the ten slugs in `HELP_CATEGORIES`. Adding a category
  means adding its registry row (its `stripLabel` included), its emblem
  (`help-emblems.tsx`), its grid column (`help/page.tsx`), its contact topic
  (`CATEGORY_TOPIC` on the contact page), and its first article in the same
  commit.
- `order`: sort weight within the category. Follow the map; it is the
  prev/next reading order.
- `updated`: the real date of the last substantive edit. Never freshen a
  date without an edit; never leave a real edit undated.
- `keywords`: five to eight SPECIFIC search synonyms: the words people type
  ("OTP", "code", "zip", "HEIC", "watermark"), abbreviations, app-string
  nouns. They feed search ranking and the related-articles scorer, where each
  shared keyword counts twice what a shared category does, so a generic list
  ("event", "photos") relates everything to everything.
- `audience` (optional): `host`, `guest`, or `both`. The default derives from
  the category (the guest category is guest-voiced, troubleshooting answers
  both, everything else addresses the host). Set it only for the exceptions.
- `plans` (optional): the plans a feature applies to, rendered as badges in
  the In-short card. Leave it empty when the article applies to every plan.
- `action` (optional): `{ label, href }`, the one door under the short answer
  ("Open your dashboard" to `/dashboard`). Most articles have none.

## Writing rules

1. **Answer first.** The description answers; the opening paragraph expands
   it; sections carry the detail. No throat-clearing intros.
2. **`##` sections only for structure.** `##` headings feed the table of
   contents and the palette's section deep links; keep them short, plain
   text (no formatting inside a heading), and never inside a `<Callout>`.
   `###` renders but stays out of the ToC; use it sparingly.
3. **No em-dashes.** Anywhere, prose or frontmatter. Recast with a comma,
   colon, parentheses, or two sentences. Test-enforced.
4. **Three classes of numbers.** Marketed limits, prices, and lifecycle
   windows reach an article ONLY through the spec components below, so they
   can never drift from the product. UI strings are quoted verbatim inside
   `<UiLabel>`, digits included. Incidental counts ("three steps") are typed.
   If no component exists for a marketed number, add one to `spec-help.tsx`
   (the vocabulary below) reading the real constant; never type the number.
   The frontmatter `description` cannot hold a component, so a number there is
   typed by hand and nothing checks it: leave it out where the answer survives
   without it, and match the constant exactly where it cannot.
5. **Quote the app exactly.** When you name a control, use its shipped
   string inside `<UiLabel>`, in its RENDERED form: write the example a
   reader would see, never a `{placeholder}` (the MDX compiler strips
   JS-expression braces). A test greps every `<UiLabel>` against the app
   source, so an invented or paraphrased label fails the suite.
6. **Never promise what is not shipped.** No SLAs, no roadmap features, no
   music in the reel, no co-hosts, no per-photo reports (a report names the
   event, or a person from their profile). The claims fence in
   `src/lib/content-policy.test.ts` is binding: read its two pattern lists
   (the claims fence and the neutralization fence) before writing about
   moderation, support replies, security, or limits, and reuse the sanctioned
   sentences rather than inventing new ones: the standard reply line, "Every
   note gets a reply, usually within a day." (`REPLY_LINE` in
   `constants/contact.ts`), and the durability facts in `constants/about.ts`
   and on the privacy page (their "no expiry" clauses answer to rule 7).
7. **One reconciled lifecycle sentence.** Events have no end date. On the
   Free plan an event nobody touches for about six months is warned by
   email, then moved to Deleted, where it can be restored for 30 days. Use
   the components for both windows; never let one article say "never
   expires" while another describes the removal.
8. **Voice**: warm and confident. Plain second person, contractions welcome,
   short sentences, a little personality in openings and callouts, never
   jokey. Hosts are "you" managing "your event"; guest articles address the
   guest. American English.
9. **Link the ladder.** Link related articles inline where they help, and
   link UP to the marketing rung when the reader may want the bigger picture
   (the category registry's `feature` entry names the rung for every category
   but troubleshooting; the article page already renders it in the end
   matter, and guest articles end on `/how-it-works` instead). A test
   resolves every `/help/...` link and every `#section` anchor.
10. **One Callout at most, usually.** They are punctuation, not paragraphs.
11. **The pinned slugs.** Marketing pages, the legal drafts, /about, and the
    contact directory link some articles by literal slug; the list lives in
    `help-slug-pins.test.ts`. Renaming one means sweeping every referrer in
    the same commit.

## The house terms

One word per thing, so the palette's deep links and the reader's mental map
stay whole: **Deleted** (the place removed items wait; never "trash" or "bin"
in prose), **photo viewer** (the full-screen view; never "lightbox"), **the
highlight reel** (the album playing itself; "the reel" after first use, never
a "slideshow" or a "video"), **clip** (what a viewer makes from the reel with
Make your own; never a "cut", and never a word for a video upload, which is a
"video"), **the screen** (the reel's screen mode, from Play on a screen),
**event link** (the address guests open;
"permanent link" only against a "custom link"), **share dialog** (the host's
Share sheet; guests have the `Invite` button), the **Show** menu (the
dashboard's All events, Guest and Deleted), the **View** menu (the event
page's sort, filter and tile size), **grid** (the album layout), **Review**
(the switch and the section; "waiting in Review" for the state), and
**confirm an email** for what a guest does at the email step.

## The component vocabulary

Available inside every article. The shared vocabulary lives in
`src/components/marketing/mdx/spec-shared.tsx` (Orchestrator-owned; it grows only by
promotion at integration). A component only the help center needs goes in
`src/components/marketing/mdx/spec-help.tsx`, the help lane's own file; never edit
the shared file or the blog's (each file's header says whose it is).

- `<Callout type="info | tip | warning" title="...">` for the one aside that
  earns it.
- `<Steps>` / `<Step title="...">` for numbered procedures (the numeral rail;
  use it for any "do this, then this" flow instead of a bare `1.` list).
- `<Path>Dashboard › Your event › Settings</Path>` for "where to find it": a
  breadcrumb row of chips, the first element of any how-to. Plain text with
  `›` between segments.
- `<PlanBadge tier="paid" />` (also `pro`, `event_pass`, `free`): the quiet
  outline pill for a gated feature. One per section at most; the frontmatter
  `plans` line carries the entitlement once.
- `<Checklist id="<slug>">` / `<Check title="...">body</Check>`: a real
  checklist with ticks remembered on the reader's device. Reserved for
  procedures a host works through on the day.
- `<UiLabel>` for quoted app strings; `<Kbd>` for literal keys.
- Spec inlines, each reading one constant: `<UploadSize />`,
  `<FreeStorage />`, `<EventPassStorage />`, `<EventPassPrice />`,
  `<ProPrice />`, `<FreePrice />`, `<ProPlans />`, `<EventPassRenewalPrice />`,
  `<ReelSeconds tier="free" />`, `<RecoveryDays />`,
  `<MaxEvents tier="free" />`, `<UploadCapFloor />`, `<InactivityMonths />`,
  `<EventPassTerm />`, `<PasswordMinLength />`, `<AccountPasswordMinLength />`, `<UnlockHours />`,
  `<TeaserCount />`, `<OverCapGraceDays />`, `<TierName tier="pro" />`.
  Extend this family for new numbers. `<RecoveryDays />` and `<UnlockHours />`
  carry their unit ("30 days", "12 hours"), and `<InactivityMonths />` and
  `<EventPassTerm />` render a phrase ("about 6 months", "about a year").
  `<ReelSeconds />` is a clip's length cap; the live reel itself has none.
- `<AlbumShowcase label="..." caption="...">` for a decorative album moment:
  eight manifest photographs in a browser frame, never a screenshot of
  invented UI.
- Markdown tables (GFM) for comparisons; the component map styles them (a
  scrolling wrapper, a nowrap label column).
- The blog library's wider spec family renders here too (`<PlanStorage id>`,
  `<PlanPrice id>`, `<ReelStyleCount />`, `<RecoveryWindowDays />`, `<InactiveDays />`,
  `<CapacityEstimate plan>`, `<Yes />` / `<No />` and the rest; the full table is in
  `../blog/AUTHORING.md`). One name, one number: `<OverCapGraceDays />` renders the
  bare number on both surfaces, so write the unit in prose.

## The library map

Ten categories in lifecycle order; the article order within each is the
`order` field. The guest-voiced category is marked (G).

### 01 Getting started

1. how-partyreel-works
2. create-your-first-event
3. your-dashboard-explained
4. your-event-page-explained
5. event-settings-explained
6. day-of-checklist-for-hosts

### 02 QR & invites

1. customize-and-share-your-qr
2. print-or-display-your-qr
3. send-the-event-link
4. custom-event-link

### 03 For guests (G)

1. why-an-event-asks-for-your-email
2. how-guests-join-and-upload
3. what-you-can-upload
4. browse-the-album
5. find-your-uploads-and-events
6. profiles-guest-lists-and-following
7. what-guests-can-and-cant-see
8. report-a-problem-as-a-guest

### 04 Event album

1. moderate-and-curate-your-album
2. review-uploads-before-they-appear
3. hide-remove-and-restore
4. bulk-select-and-batch-actions
5. add-your-own-photos
6. turn-off-uploads-or-cap-file-size
7. likes-and-what-they-do

### 05 Sharing & downloads

1. share-the-album-after-the-event
2. download-photos-videos-and-albums

### 06 Highlight reel

Live-first: the reel, then the screen it plays on, then the clip a viewer
makes from it.

1. the-highlight-reel
2. play-the-reel-on-a-screen
3. make-your-own-clip
4. reel-styles-length-and-layout
5. add-a-clip-to-the-event

### 07 Plans & billing

1. what-the-free-plan-includes
2. pro-vs-event-pass
3. how-long-an-event-pass-lasts
4. storage-plans-and-limits
5. what-happens-when-storage-fills-up
6. upgrade-downgrade-or-cancel
7. payments-receipts-and-invoices

### 08 Account & profile

1. sign-in-options-and-passwords
2. display-name-and-profile-photo
3. your-public-profile-following-and-blocking
4. notifications-and-emails

### 09 Privacy & safety

1. who-can-see-your-event
2. password-protect-your-event
3. require-verified-emails-explained
4. photo-metadata-and-location
5. how-long-media-is-kept
6. reporting-and-safety
7. your-data-and-deleting-your-account
8. require-an-upload-to-view-explained

### 10 Troubleshooting

1. the-email-code-didnt-arrive
2. you-cant-sign-in
3. an-upload-wont-finish
4. a-photo-is-missing-from-the-album
5. messages-guests-might-see
6. the-qr-wont-scan-or-the-link-wont-open
7. a-video-wont-play
8. a-clip-wont-finish-or-save

## Truth sources

Product numbers: `src/lib/media/limits.ts`, `src/lib/constants/tiers.ts`,
`src/lib/lifecycle/*.ts` (always via components). App strings: the app
source under `src/components` and `src/app/(app)` (hosts) and
`src/components/guest` + `src/components/auth` (guests). Behavior:
`docs/systems/host-app.md`, `guest-flow.md`, `reel.md` (the reel, the screen
and the clip), `billing-caps.md`, `lifecycle-recovery.md`,
`profiles-social.md`, `uploads-and-r2.md`.
Durability and moderation claims: reuse the shipped wording on the privacy
feature page and in `constants/about.ts`. Never claim end-to-end encryption,
point-in-time recovery, compliance certifications or multi-cloud storage: no
test fences them, so this line and the why-comment in the privacy page's
`media-lives.tsx` are the whole guard.

## Process

Branch per the elevation protocol (your own `lp/` track branch; the
orchestrator integrates). Gates before every commit: `pnpm typecheck`,
`pnpm lint`, `pnpm test` (the suite validates frontmatter, category
population, slugs, MDX compilation, `<UiLabel>` fidelity, internal links,
em-dashes, and claims), and `pnpm build` after content changes (every article
prerenders, with its share card). `/llms.txt` lists the first four articles of
each category (`LLMS_HELP_PER_SHELF`) under a 16,000-character budget and
points to `/llms-full.txt`, which carries every article with its description
under a 60,000-character budget.
