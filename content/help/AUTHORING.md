# The help library: authoring brief

This file is the working brief for the dedicated help-content agent. The help
center UI shipped finished in R6 (2026-08-26): the index, the search palette,
the article layout, and the component vocabulary are done and ruled. Your job
is to fill the library against the map at the bottom, article by article,
without touching the UI. This file never renders (the loader reads only
`.mdx`), but the content-policy tests scan it, so it obeys the rules it
teaches.

## The one-sentence contract

Every article is a short, true ANSWER (roughly 250 to 500 words) whose
frontmatter `description` IS the short answer: the article page renders it as
the styled "In short" lead under the title, and it doubles as the meta
description. Write it so someone could stop reading after it.

## Frontmatter

The schema is `helpFrontmatterSchema` in `src/lib/content/help.ts`. Point of
truth lives there (including the description length cap); do not trust this
file for limits. Field notes:

- `title`: the question or task, in the reader's words. Concise, no leading
  "The" unless natural. It must carry the article alone in search results.
- `description`: the short answer (see above). A statement, not a teaser.
- `category`: one of the nine slugs in `HELP_CATEGORIES` (same file). Adding a
  category means adding its registry row, its emblem (see below), and its
  first article in the same commit; a category with zero articles fails the
  test suite.
- `order`: sort weight within the category. Follow the map's order.
- `updated`: the real date of the last substantive edit. Never freshen a date
  without an edit; never leave a real edit undated.
- `keywords`: search synonyms, generously. Include the words people actually
  type ("OTP", "code", "zip", "QR"), abbreviations, and app-string nouns. They
  feed ranking and the related-articles scoring, so shared keywords across
  genuinely related articles make the web tighter.

## Writing rules

1. **Answer first.** The description answers; the opening paragraph expands
   it; sections carry the detail. No throat-clearing intros.
2. **`##` sections only for structure.** `##` headings feed the table of
   contents and the palette's section deep links; keep them short, plain text
   (the slugify contract: no formatting inside headings). `###` renders but
   stays out of the ToC; use it sparingly.
3. **No em-dashes.** Anywhere, prose or frontmatter. Recast with a comma,
   colon, parentheses, or two sentences. Test-enforced.
4. **Numbers come from components, never keyboards.** Any marketed limit or
   price reaches an article through the spec components (below) so it can
   never drift from the product. If no component exists for a number you
   need, add one to `mdx-components.tsx` reading the real constant; do not
   type the number.
5. **Quote the app exactly.** When you name a control, use its shipped string
   ("Approve all", "Download album", "Require accounts to upload") inside
   `<UiLabel>`. A reader who later opens the product must recognize
   everything the help center showed them. Verify strings in the app source;
   never invent UI.
6. **Never promise what is not shipped.** No SLAs, no roadmap features. Known
   not-yet-shipped paths (self-serve account deletion, deleting a single one
   of your own uploads as a guest) are documented as their honest current
   flows. The claims fence in `src/lib/content-policy.test.ts` is binding.
7. **Voice**: plain, warm, host-and-guest-facing, contractions welcome. Hosts
   are addressed as "you" managing "your event"; guest articles address the
   guest. British-ism-free American English.
8. **Link the ladder.** Link related help articles inline where they help,
   and link UP to the marketing rung when the reader may want the bigger
   picture (the category registry's `feature` entry names each category's
   rung). The article page already renders the category's rung pointer in the
   end matter; inline links are for specific moments.
9. **One Callout at most, usually.** They are punctuation, not paragraphs.

## The component vocabulary

Available inside every article (`src/components/marketing/mdx-components.tsx`):

- `<Callout type="info | tip | warning" title="...">` for the one aside that
  earns it.
- `<Steps>` / `<Step title="...">` for numbered procedures (renders the mono
  numeral rail; use for any "do this, then this" flow instead of a bare `1.`
  list when steps have bodies).
- Spec inlines: `<UploadSize />`, `<FreeStorage />`, `<EventPassStorage />`,
  `<EventPassPrice />`, `<ProPrice />`. Extend this family for new numbers.
- `<Kbd>` for literal keys ("Press <Kbd>Enter</Kbd>").
- `<UiLabel>` for quoted app strings.
- `<AlbumShowcase label="..." caption="...">` (and the Figure variants that
  ship with it) for product-shaped illustrations. Decorative, token-drawn,
  never screenshots of invented UI.

## The library map

Legend: [x] live today, [ ] planned. Order within a category is the shipping
order (`order` field). Scopes are one line; you own the final outline. Titles
are the working map, not final copy: improve them where you can make them
carry more.

### 01 Getting started

- [x] How Partyreel works
- [x] Create your first event
- [ ] Your dashboard, explained: events, uploads hub, the Deleted chip
- [ ] Event settings, explained: name, visibility, require accounts, review,
      per-event caps, custom link

### 02 QR & invites

- [x] Customize and share your QR code
- [ ] Print cards and posters that scan: sizes, contrast, the test-scan habit
- [ ] Put the QR on a screen: slides, loops, lobby TVs
- [ ] Share the album link directly: when a link beats the code
- [ ] A day-of checklist for hosts: print, test, place, announce

### 03 Guest experience

- [x] How guests join and upload
- [ ] Browse the album as a guest: the live gallery, the lightbox, the reel
- [ ] Save an event to find it later
- [ ] Your uploads across events: the uploads hub, claiming on sign-in
- [x] Profiles, guest lists, and following
- [ ] What guests can and can't see: names, emails, hidden media

### 04 Event album

- [x] Curate what shows up in your album
- [ ] Review mode vs. live mode: which to pick per occasion
- [ ] Hide, remove, restore: how the trash works
- [ ] Bulk select and batch actions
- [ ] Photos, videos, and supported formats (spec components throughout)
- [ ] Upload caps for a single event: the presets, when to lower them

### 05 Sharing & downloads

- [ ] Share the album after the event: the one link, who can open it
- [x] Download your photos and videos
- [ ] Download the whole album as a zip: filters, host extras, big albums
- [ ] What guests can download

### 06 Highlight reel

- [x] The highlight reel
- [ ] Reel styles, length, and the cover
- [ ] Pick the shots: reel curation and reordering
- [ ] Download the reel as a video (the free-tier reel watermark truth)
- [ ] Share the reel

### 07 Plans & billing

- [x] Storage, plans, and what counts toward your limit
- [x] Pro vs. Event Pass: which is right for you?
- [ ] The Event Pass year, explained (about a year; move to Pro before it
      lapses to keep things seamless)
- [ ] Upgrade, downgrade, or cancel
- [ ] What happens when storage fills up
- [ ] Payments and receipts

### 08 Privacy & safety

- [x] Who can see your event and media
- [ ] Password-protected events (a Pro and Event Pass feature; the app's
      exact segment labels)
- [ ] Verified guest emails, explained (require accounts, default on)
- [ ] Photo metadata and what uploads (reuse the ratified wording from the
      privacy feature page; do not overclaim beyond it)
- [x] How long your media is kept
- [x] Reporting content and staying safe (refresh: stale date)
- [x] Your data and deleting your account (swap the deletion section when
      the self-serve app feature ships)

### 09 Troubleshooting

- [x] The email code didn't arrive
- [ ] An upload won't finish: size, connection, retries
- [ ] The QR code won't scan: print quality, lighting, distance
- [ ] A video won't play: formats, processing, patience
- [ ] You can't sign in: account mismatches, provider quirks
- [ ] "This event is full" and other limits: what each wall means, the fix

## Truth sources

Product numbers: `src/lib/media/limits.ts`, `src/lib/constants/tiers.ts`,
`src/lib/lifecycle/recently-deleted.ts` (always via components). App strings:
the app source under `src/components` and `src/app/(app)`. Durability and
privacy claims: reuse the shipped wording on the privacy feature page and
`docs/systems/durability-backups.md`; the hard never-claim list (encryption
guarantees, compliance certifications, multi-cloud) is in the marketing truth
base and the content-policy test. When the product and an existing article
disagree, the product is right: fix the article and set `updated`.

## Process

Branch per the elevation protocol (your own `lp/` track branch; the
orchestrator integrates). Gates before every commit: `pnpm typecheck`,
`pnpm lint`, `pnpm test` (the suite validates frontmatter, category
population, slugs, em-dashes, and claims). Article slugs are load-bearing
once merged (marketing GoDeeper links and pins point at them), so name slugs
carefully and never rename one without sweeping `help-slug-pins.test.ts` and
every inbound link.
