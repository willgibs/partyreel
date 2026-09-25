# Writing a Partyreel blog post

> The content agent's brief for `content/blog/*.mdx`. Its sibling is
> [`../help/AUTHORING.md`](../help/AUTHORING.md), which covers the help center; the two collections
> share one pipeline (`src/lib/content/collection.ts`) but not one voice. Help answers a question.
> The blog has a point of view. This file never renders (the loader reads only `.mdx`), but the
> content-policy tests scan it, so it obeys the rules it teaches.

## What a post is

A post is a 700 to 1,400 word argument with a reader in mind: a host who is about to throw an
event, a guest who just scanned a code, or a planner deciding how to collect the room's photos. It
opens on the answer (or the scene), earns its sections, and ends on one thing to do next. It is
never a help article with a longer intro: if a post describes a flow, the flow exists today and the
help center already explains the clicks, so the post links there and spends its words on the why,
the when, and the trade-offs.

The voice is warm-host ease over big-event stakes, disciplined by concise clarity. American
English, contractions welcome, hosts addressed as "you" running "your event". Specific over
general: a table, a T-minus clock, a line the MC can read out. Claims are true or hedged, never
inflated.

## Frontmatter

Every field is validated at BUILD time by `blogFrontmatterSchema` (`src/lib/content/blog.ts`).
A bad value fails `pnpm build`; nothing degrades at runtime.

```yaml
---
title: "QR code for wedding photos: the complete guest photo sharing guide"
description: One code on every table gets you the whole day. Here is how to set it up so guests actually use it.
date: "2026-08-28"
cover: wedding-golden
tags:
  - weddings
  - how-to
faq:
  - q: Do wedding guests need an app to upload photos?
    a: No. They scan the code with the phone camera and upload from the browser.
---
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | **45-60 characters; hard cap 80** (the build fails past it). A layout contract: a library card holds TWO lines at the three-column width (280px, about 60 characters of ordinary words; a long word costs more), and anything longer ships with an ellipsis. The featured card holds three lines. Measure a borderline title on the wall before merging. Front-load the words a searcher types; the card gives you no subtitle. |
| `description` | yes | Max 160 characters. It renders as the **visible standfirst** under the title, as the featured card's blurb, as the meta description, and in the feed. The primary query phrase appears once in its first hundred characters, and it never repeats a clause from the title. Same voice as the body. |
| `date` | yes | `YYYY-MM-DD`, quoted. Drives sort order, the byline, and RSS `pubDate`. The newest post is the staged hero of the unfiltered `/blog`. |
| `cover` | **no, but always set it** | A media id from `MARKETING_IMAGES` (`src/lib/constants/marketing-media.ts`). See Covers. |
| `tags` | yes | One or two ids from the **registry** below, at most one of them an audience; anything else fails the build. Pair an audience with a purpose. |
| `faq` | no | One to eight `{ q, a }` items. Plain text only (no `<Component />`, it ships verbatim into FAQPage JSON-LD) and **number-free**: a FAQ answer is the one place a product figure could only be typed, so answers point at `/pricing` or the help center instead of quoting a cap. Test-enforced. |
| `author` | no | Leave it out. `partyreel-team` is the universal byline and the only registered id. |
| `updated` | no | `YYYY-MM-DD`. Sets `dateModified` in the Article JSON-LD and the sitemap. Set it only with a substantive edit: a comparison post when a named product's behaviour changes, a hub on its yearly refresh. |
| `draft` | no | `true` keeps the post out of the listing, the sitemap, and the feed. |

## The tag registry

Six tags, in `src/lib/content/blog-tags.ts`. Three AUDIENCES (who the post is for) and three
PURPOSES (what kind of piece it is). A post carries one or two tags: at most one audience, and a
purpose (a second purpose is allowed where the piece is both, e.g. a comparison written as a
guide). A group-trip guide carries `how-to` alone.

| id | kind | label | The library line under the heading |
| --- | --- | --- | --- |
| `weddings` | audience | Weddings | Receptions, ceremonies, rehearsal dinners: every guest's angle of the day. |
| `parties` | audience | Parties | Birthdays, showers, graduations, reunions and holidays, before anyone leaves. |
| `corporate` | audience | Corporate | Conferences, offsites and team events, curated before they are reshared. |
| `how-to` | purpose | How-to | Practical guides for collecting, curating and sharing event photos. |
| `compared` | purpose | Compared | How a QR event album stacks up against the ways guests already share. |
| `product` | purpose | Product | How Partyreel works under the hood, and why it works that way. |

The rail prints these labels in this order. Adding a tag is a registry change plus its first post
in the same commit (a tag with no posts never reaches the rail), never a frontmatter choice.

## Covers

`/blog` is media-forward: the cover IS the card, and the newest post's cover fills the hero (a 21:9
letterbox from a small screen up, 4:5 on a phone). Set `cover` on every post from the manifest's
`MARKETING_IMAGES` ids (`src/lib/constants/marketing-media.ts`; the `hero-candidate-*` ids below
them are reels and fail the build) and pick a subject that matches the piece. Two rules the tests
enforce:

- **No photograph repeats beside itself.** Not in the row, not one row down at two columns, not
  one row down at three, in the unfiltered library on any page or under any tag filter. Publishing
  a post means checking its neighbours under every filter it belongs to.
- **The hero is landscape.** `wedding-petals` is the manifest's only portrait and crops to a band
  in the featured card, the article plate and the share card. Do not use it.

The crop is derived from the slug (one of six positions), so two posts on one photograph usually get
different plates, though nothing guarantees it. The photographs are stand-ins until the launch set
replaces them by id.

## Writing rules

1. **Own one claim.** Every post has a one-line thesis no other post makes. The five
   incumbents-fail posts (the ranking, the group chat, the cloud album, the compression chain,
   the disposables), in particular, each carry ONE argument (the roundup, the morning-after scene, the
   account wall, the compression chain, keepsake versus coverage) and may not borrow another's.
2. **No em-dashes.** Anywhere, prose or frontmatter. Recast with a comma, a colon, parentheses, or
   two sentences. Test-enforced over all of `content/`.
3. **Numbers come from components, never keyboards.** Every marketed figure reaches a post through
   a spec component reading the real constant, so nothing can drift. The family is listed below.
   A test scans the body, the title and the description for typed sizes and prices; if you need a
   number that has no component, add one to `src/components/marketing/mdx/spec-blog.tsx` (the
   blog lane's file) reading the constant, and never type it; if the help center needs it too, the
   Orchestrator promotes it to `mdx/spec-shared.tsx` at integration.
4. **How-tos track shipped reality.** Only marketing pages present the product as-if-complete. If
   a post describes a flow, the flow has to exist today. Do not write about anything unshipped:
   the screen is the reel's (say "put the reel on a screen"), and there is no video editor, no
   co-hosts, no custom branding, no comments, no native app, no email-the-album, no upload-time
   scanning.
5. **Quote the app exactly.** A control is named by its shipped string inside `<UiLabel>`:
   "Require verified emails", "Approve all", "Download all", "Include hidden items". Verify in `src/components`
   and `src/app/(app)`; never invent UI.
6. **Commit to outcomes, never to who or what delivers them** (the promise-neutralization doctrine,
   `docs/systems/marketing-content.md`). A report gets reviewed; a note gets a reply; the host
   stays in control. Never name the actor and never promise a turnaround in desk hours. The
   standard reply line is single-sourced: copy it from an existing page.
7. **No social proof, no counts.** Pre-launch, so no user numbers, no borrowed endorsements,
   no quoted customers, and no invented statistics ("half the room") either. Argue from
   mechanism. The claims fence in `src/lib/content-policy.test.ts` is binding.
8. **Name incumbents, never rivals.** Google Photos, iCloud Shared Albums, WhatsApp, iMessage,
   AirDrop, email, Dropbox, disposable cameras and photo booths may be named, because they are
   what people already use. QR photo-sharing startups are never named; that comparison stays at
   the category level ("apps that need a download", "apps that charge per guest").
9. **Hedge what you did not verify this week.** Named products change. Write "by default",
   "reduced-size copies", "around", and only what their public documentation says. No dollar
   figures for booths or disposables.
10. **Reuse the ratified lines byte-for-byte.** "every guest is a second shooter". "a thousand
    guests cost the same as ten". The metadata line: "Location data is stripped in the browser
    before a photo ever uploads, for the common formats." The failure-mode clause: "compression
    ruins quality, media scatters across threads, and nothing is collected" (`FAILURE_MODE_LINE`).
    Vary nothing.
11. **"night" is never identity language.** Not in a title, a standfirst, or a tag line.
12. **Link the ladder.** At least two inline links to other posts, one to a help article, and one
    to a marketing rung (`/events/<type>`, `/features/<page>`, `/reel`, `/pricing`,
    `/how-it-works`). Hubs collect inbound links from their spokes. The closing line is a single
    next step, usually `/help/create-your-first-event` or the hub the post hangs off.
13. **Structure.** `##` sections only (`#` is the title); three to six of them; one `<Callout>` at
    most; headings that read as the question a searcher asked where that is natural. `###` renders
    but stays out of the table of contents.
14. **The FAQ block** goes on hubs, on `compared` posts, and on a product explainer whose queries
    are question-shaped: three to five questions the post itself did not fully answer, none of
    them already on a marketing page (`faq-data.ts`, `events.ts`, the feature pages' `*-faq.ts`
    files, `pricing-faq-data.ts`), all number-free.

## The component vocabulary

Available inside every post. The shared vocabulary lives in
`src/components/marketing/mdx/spec-shared.tsx` (Orchestrator-owned); blog-only additions go in
`src/components/marketing/mdx/spec-blog.tsx`, the blog lane's own file (each file's header says
whose it is):

- `<Callout type="info | tip | warning" title="...">` for the one aside that earns it.
- `<Steps>` / `<Step title="...">` for a numbered procedure with bodies.
- `<Kbd>` for literal keys, `<UiLabel>` for quoted app strings.
- `<AlbumShowcase label="..." caption="...">` for a decorative album moment (eight manifest
  photographs in a browser frame, never a screenshot of invented UI).
- **Tables**: a GFM table renders with a scrolling wrapper and a nowrap label column. Use
  `<Yes />` and `<No />` for a plain yes or no (the same marks as the pricing matrix); write
  anything else as words ("By default", "Paid plans", "Apple only").

The spec inlines, each reading a real constant (`tiers.ts`, `limits.ts`, the lifecycle constants,
the gallery's teaser limit, the reel's style registry). A `…Days`, `…Seconds` or `…Count` name
renders the bare number and you write the unit; a size, a price or a name renders whole
(`<UploadSize />` is the size with its unit). The help center's own components (`<Path>`,
`<PlanBadge>`, `<Checklist>` and the help-named spec aliases such as `<RecoveryDays />`) render
here too; `../help/AUTHORING.md` lists them.

| Component | Renders |
| --- | --- |
| `<UploadSize />` | the per-file ceiling, photos and videos alike |
| `<FreeStorage />`, `<EventPassStorage />` | aliases of `<PlanStorage id>` kept for the help center; new posts use the `id` form |
| `<PlanStorage id="pro_500" />` | any plan's storage (`free`, `event_pass`, `pro_100`, `pro_500`, `pro_2tb`, `pro_100_yr`, `pro_500_yr`, `pro_2tb_yr`) |
| `<PlanPrice id="pro_100_yr" />` | a price label (`<EventPassPrice />` and `<ProPrice />` are aliases for the help center) |
| `<EventPassRenewalPrice />` | the one-time renewal price |
| `<EventLimit tier="free" />` | events a tier may hold (`pro` renders the unlimited word) |
| `<ReelSeconds tier="free" />` | a clip's length ceiling in seconds for `free`, `pro`, `event_pass` (the live reel has none) |
| `<ReelStyleCount />` | how many looks a clip can wear (the reel plays the moods among them) |
| `<CapacityEstimate plan="event_pass" />` | "19,200 photos or 9 hours of video" (photos only where the tier has no video, so `plan="free"` renders the photo count alone) |
| `<PhotoAverageSize />`, `<VideoMinuteSize />` | the rule-of-thumb sizes behind the estimates |
| `<RecoveryWindowDays />` | the recovery window a deleted item waits in |
| `<InactiveDays />`, `<InactiveWarningDays />` | the free-tier inactivity clock and its warning |
| `<OverCapGraceDays />` | the over-capacity grace for a lapsed paid account |
| `<RenewalNudgeDays />` | how far ahead the Event Pass renewal nudge goes out |
| `<TeaserCount />` | how many photos a teaser-access gallery shows |

## The product, in one place (write from this, verify against the source)

- **The loop.** A host creates an event and gets one QR code and one link. Guests scan with the
  phone camera, give a name, and upload from the browser: no app required (a password-locked
  album asks for its password first). NEVER write "no account", and never call a guest or an
  upload "anonymous" (reporting an event is anonymous, and saying so is fine): a host may require
  a verified email and the setting is ON by default; every upload carries a name either way,
  verified or marked. By default guests confirm their email with a six-digit code from their inbox
  (the same email carries a sign-in link; the "Require verified emails" setting, free on every
  plan, on by default); the host can allow a typed display name instead, shown with a small
  unverified mark, per event. The album fills live. The host approves, hides or removes
  anything, in review mode (uploads wait for approval) or live mode. The same link is the shared
  album afterwards, and from its second photo the album plays as a live highlight reel.
- **Quality.** Originals are stored as uploaded and never recompressed (the in-browser metadata
  strip aside). Tiles show a small preview for speed; the lightbox, the per-item save, and the zip
  all serve the original. Accepted: JPEG, PNG, WebP, HEIC/HEIF, AVIF; MP4, MOV, WebM. One per-file
  size ceiling (a host may set a lower one per event), no duration cap. No watermark on
  photos, the album or the live reel on any plan; only a free event's clips carry a small mark.
- **Privacy.** Location data is stripped in the browser before a photo ever uploads, for the
  common formats (JPEG, PNG and WebP photos, MP4 and MOV video; HEIC, HEIF, AVIF and WebM are
  stored as the phone sends them). Albums are open, password-locked (paid) or private (the app's
  labels: Public, Password, Private); a locked album shows the name and the count and no media;
  teaser access shows the newest few photos with a count. The host controls whether a guest list
  shows. View and scan counts are aggregate with no personal data. No ads; event media is never
  used to train models or sold.
- **Plans.** Free: one event, photos only, the album and its live reel, short marked clips. Event
  Pass: one-time, one event with video and every paid control for about a year, renewable, and
  passes stack. Pro: monthly or yearly (two months free), unlimited events, video, longer unmarked clips,
  password locks, custom links. No guest limit and no per-guest fee on any plan: pricing is by
  storage. Moving from a pass to Pro converts the unused part to credit. A handle and a public
  profile page (the events a host chooses to list on it included) are free on every plan.
- **Lifecycle.** An event has no end date; deleting it is the only exit (the anti-abuse reason:
  otherwise fill, end, repeat would be free storage). Deleted events and media wait in Deleted
  (one word everywhere: the app, the marketing pages and the posts; never "trash" or "bin") for
  the recovery window, then are purged. A free event with no activity (the host's, an edit, a new
  upload) for about six months gets a warning email, then removal. An Event Pass covers about a
  year; a nudge goes out before it lapses, a renewal extends it, and a lapsed pass drops the event
  to Free with a grace window before anything is reduced.
- **Sharing and download.** One link per event. Per-item originals; a full-quality zip for hosts
  and guests, with type filters and the host's "include hidden" option. Likes from anyone with an
  account (a signed-out tap asks for an email first); the per-event like count is host-only.
  Profiles are free, and a guest's events reach their dashboard through their own uploads
  (there is no separate save).
- **The reel.** Every album plays as a live highlight reel from its second photo, composed on
  each viewer's own device and on any screen in the room (the host's Play on a screen), taking in
  uploads as they land and dropping what the host hides. Nobody makes, renders or publishes it,
  it obeys the album's gate, and it is never a file. It starts on the host's default mood and
  hold, which any viewer can change on their own device. A **clip** is the viewer's own: anyone
  with album access makes one from the reel (Make your own), picks moments, a look, a layout and
  a length, and it renders on their device and saves or shares as a file, never stored; on a paid
  event Add to event puts it in the album as an ordinary video the reel never plays. Free clips
  carry a small mark and the shorter cap. No music, no beat-sync, no end card, never a timeline.

Truth sources when in doubt: `src/lib/constants/tiers.ts`, `src/lib/media/limits.ts`,
`src/lib/constants/features.ts`, `src/lib/constants/events.ts`, `src/lib/content/llms.ts`,
and `docs/systems/{guest-flow,host-app,reel,uploads-and-r2,lifecycle-recovery}.md`. Where a doc and
the code disagree, the code wins.

## The help center, for linking

`/help/how-partyreel-works` · `/help/create-your-first-event` · `/help/customize-and-share-your-qr`
· `/help/how-guests-join-and-upload` · `/help/profiles-guest-lists-and-following`
· `/help/moderate-and-curate-your-album` · `/help/download-photos-videos-and-albums`
· `/help/the-highlight-reel` · `/help/storage-plans-and-limits` · `/help/pro-vs-event-pass`
· `/help/who-can-see-your-event` · `/help/how-long-media-is-kept` · `/help/reporting-and-safety`
· `/help/your-data-and-deleting-your-account` · `/help/the-email-code-didnt-arrive`.

The help map in `../help/AUTHORING.md` lists every article. A blog post never
duplicates one of those (print sizes, screen setups, review-versus-live mechanics, upload caps,
metadata mechanics, password mechanics); it links the concept and keeps its point of view.

## Process

Branch per the elevation protocol (your own `lp/` track; the Orchestrator integrates). Gates
before every commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`, and the suite validates
frontmatter, the registry, cover adjacency, slugs, em-dashes, typed numbers, and the claims
fences. Slugs are permanent once merged (redirects live in `src/lib/content/blog-redirects.ts`),
so name them as the primary query: no years, no leading "the" or "why".
