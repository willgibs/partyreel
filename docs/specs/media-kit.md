# The media kit: sourcing, licensing, and the kit we make

> **ROLE:** the proposed sourcing law for every frame on a Partyreel surface, plus the survey behind
> it and the plan for the kit Will produces. Written by the `media-kit` track of the review wave
> (2026-09-14). **BELONGS HERE:** the rule, the allowed sources with the clause that allows them, the
> manifest's contract, the re-render runbook, and the shot lists. **NOT HERE:** which assets have been
> asked for or delivered (that is [`../ASSETS.md`](../ASSETS.md)), how a marketing page is built
> (that is [`../systems/marketing-content.md`](../systems/marketing-content.md)), or the wiring itself
> (a wiring round's commit). **GROWS BY:** refine in place; the settled part is promoted into the
> system layer by the Orchestrator once Will rules.

> **STATUS: A PROPOSAL.** Nothing here is in force. Bible 18 ("every frame is ours") is ratified; the
> operative detail below is this track's recommendation and waits on Will's ruling. No production byte
> changed on this track: the twelve stand-ins are untouched and the candidate batch is staged under
> `public/design/media-kit/`, which no marketing surface reads.

---

## 0. The short version

**What is true today.** All twelve entries in `MARKETING_IMAGES`
([`src/lib/constants/marketing-media.ts:64-171`](../../src/lib/constants/marketing-media.ts)) carry one
line, `license: "unsplash (per lab-pack comment; provenance unverified)"`, and nothing else: no author,
no source URL, no retrieval date. All three of those fields exist on the type and all three are
optional (`:33-36`). The lab pack the files were copied from, `public/design/`, was empty when this
track opened, so the provenance trail is gone from the tree. This is not a lab problem. Eleven of the
twelve are the blog's
cover pool ([`src/lib/content/blog-covers.ts:22-34`](../../src/lib/content/blog-covers.ts)), which puts
them on 23 published posts, on the OpenGraph card each post syndicates to every social platform and
chat app that unfurls a link, and inside the RSS enclosures the feed hands to aggregators. The frames
are being redistributed, at scale, under a license nobody can name.

**What is being asked.** Three routes, argued on the board at
`/design/c/media-kit`:

| Route | What it is | Cost | What it buys |
| --- | --- | --- | --- |
| Licensed | Replace the twelve with frames under a license we can name and record | none of Will's time | The letter of bible 18, not its point |
| Ours | 36 masters across six verticals, made by Will, everything else derived | two shoots or two generation passes | The rule as written, and the product's own claim made true |
| Mix | Ours on the frames a reader studies, licensed as a dated bridge on the rest | one shoot now, one later | A correct site this month and the real kit by launch |

**The recommendation is Mix**, with the bridge dated: licensed frames are legal to ship and are deleted
the day the kit lands. Ten of the twelve go to the shoot because they are studied (the hero, the four
reel clips, the four blog posts that all ride one empty banquet hall); two are detail shots nobody
studies and can carry a licensed bridge until then.

**The finding that settles it.** Unsplash's license, which is the one the twelve claim, does not cover
the people in them. The terms say the license "does not include the right to use ... People's images
if they are recognizable in the Images" (section 4.2). Every one of the twelve has recognizable people
in it: a couple, a toast, a dance floor, a crowd. So the gap is not a missing citation that a
provenance hunt could close. Even in the best case, where all twelve really are Unsplash and really
were downloaded in good faith, the license they were taken under never covered the thing that makes
them worth having. This is not a filing problem. It is a sourcing problem, and only new frames fix it.

**The finding that makes it affordable.** Round two's three hero concepts each asked for their own
batch: 24 squares at 512 px (`hero-source`), 36 photographs at 1600 px plus 8 vertical clips
(`hero-gathering`), and a 15 to 20 s film (`hero-reel`). Those are not four deliveries. They are **one
library at three crops and one cut**: 36 masters, six per vertical, from which the 512 squares are
crops, the clips are the same events shot as video, and a film is cut from that footage.
`shared.tsx:130` already says so in the tree, describing the replacement as "Will's 36-frame set (a
third portrait, 24 also as 512-square)".

The round-two ruling proved the point the same day: the gathering and the reel were not ruled in, so
`ASSETS.md` rows 3 and 4 went to `parked` and `withdrawn` while round three opened three new hero
variations that all want the same photographs. **A kit cut to the product's verticals survives a hero
ruling. A batch cut to one composition does not.** That is the argument for defining the kit here, by
vertical, rather than concept by concept.

---

## 1. The rule (proposed)

Bible 18 says every frame is ours and there is no stock at launch. That is a statement of taste and of
rights at once, and it needs an operative form a test can hold. Proposed:

**1.1 Every frame on a Partyreel surface is one of exactly two things.**

- **Ours.** Photographed, filmed, drawn, rendered or generated by Will or by Partyreel. This is the
  default and the only thing that ships at launch on a surface a reader studies.
- **Licensed.** Under a named license whose clause permitting our use is quoted in section 4 of this
  doc, with the author, the source URL and the retrieval date recorded on the manifest entry.

There is no third category. A frame whose provenance cannot be stated in one line is not a frame we
own; it is a liability with a nice colour palette.

**1.2 The three fields become required.** `author`, `sourceUrl` and `retrieved` are optional on
`MarketingImage["credit"]` today (`marketing-media.ts:33-36`). They become required, and `license`
becomes a union rather than free text:

```ts
credit:
  | { kind: "ours"; author: string; created: string; how: string }
  | { kind: "licensed"; license: LicenseId; author: string; sourceUrl: string; retrieved: string }
```

`how` on an `ours` entry is the one field that does not exist today and matters more than any of the
others: for a photograph it reads "shot, <event>, <date>"; for a generated frame it names the tool and
the account the output was made under, because **a generated frame's license is the generating
service's output-ownership clause**, and that clause is exactly as nameable, and exactly as
forgettable, as a stock library's. A generated asset is not automatically ours. It is ours when the
terms under which it was generated say so, and that sentence belongs in the manifest next to the frame.

**1.3 The test rises with the rule.** `marketing-media.test.ts:51` asserts only that the license string
is non-empty, which the twelve pass while being exactly the problem. Proposed: the test asserts the
discriminated shape above, that a `licensed` entry's `license` is one of the ids in section 4, and that
`retrieved` parses as a date. That turns "provenance unverified" from a comment into a build failure,
which is what `marketing-media.ts:31` already promises ("unverified entries block the M4 gate") without
any code behind it.

**1.4 Identifiable people.** A marketing page showing a recognisable face implies that person endorses
Partyreel. For an `ours` frame that is a release Will collects at the shoot, in writing, and the entry
records that he holds it. For a `licensed` frame the platforms are explicit that they do not supply
model releases (section 4), so a licensed frame may not carry a recognisable face on a page that makes
a claim. The two licensed frames the Mix route keeps are detail shots for that reason, not by accident.
The same applies to a generated face: a synthetic person who resembles a real one is the same exposure
with none of the paperwork.

**1.5 The fixtures are not a source.** `/Users/gibby/local/ai/partyreel-test-media/` is proxy-licensed
(Lorem Picsum, itself Unsplash-sourced, and `samplelib.com`). It exists to exercise the upload path and
is gitignored. Nothing in it is ever promoted into `public/marketing/`, whatever it looks like.

---

## 2. The manifest, and what it already guarantees

The media manifest is undocumented in the system layer (`marketing-content.md` covers the pages but
never the manifest), so the contract is written here until the Orchestrator promotes it.

**One gate, both directions.** `src/lib/constants/marketing-media.ts` is the only path between
`public/marketing/` and any component. `marketing-media.test.ts` pins both directions: every entry
resolves to a real file on disk (`:29`) and every file under `public/marketing/{img,reels,posters}` is
reachable through an entry (`:39`). So an orphaned asset and a dead reference are both build failures,
and there is no way to drop an unaudited file into the tree and have it render.

**What else it pins.** Ids are unique and `marketingImage()` throws on an unknown one (`:57`), so a
typo fails a test rather than rendering a hole. Orientation must match the recorded dimensions
(`:64`). Reel recipes may only reference known image ids, and every shot boundary must land on a 1/24 s
multiple (`:71`).

**What it does not pin, and should.** That a license line is *true*. That is the gap section 1.3
closes.

**The swap model.** The manifest's header states the intent: Will's final media lands as a pure swap,
files and entries replaced, components untouched. One deliberate exception guards it:
`blog-covers.ts:22` pins its own eleven-id pool rather than reading `MARKETING_IMAGES`, because the
cover of a published article must never change under it, and if the pool were the manifest a wholesale
swap would silently re-skin every post. **A wiring round therefore has to keep the ids stable or accept
that every blog cover moves.** Keeping the ids is free and is the recommendation: a replacement frame
inherits the id of the stand-in it replaces.

**The crop ladder is a hidden spec on the media itself.** `blog-covers.ts:43-50` re-crops one source to
six object-positions from `22% 45%` to `78% 45%`, which is how eleven images dress 23 posts without
reading as eleven images. It works, and it means a frame whose whole subject sits in the middle loses
that subject in four of the six positions. Every frame entering the pool has to be composed for it.

---

## 3. How a recorded loop is re-rendered

Two reels are recorded in the manifest (`:181-217`), both stand-ins, both pinned to stand-in clip ids.
Replacing the media means re-rendering them, and that is not a CLI job. Budget for it.

**★ The engine encodes in a browser.** The Remotion/AWS-Lambda render path was torn down 2026-07-08;
the only path is an on-device WebCodecs encode (`src/lib/reel/engine/encode.ts`), brokered for
production by `src/lib/reel/render-service.ts`. There is no headless renderer to point at a file.

**The runbook.**

1. Open `/design/reel-parity` in the lab (Chrome, on a machine with WebCodecs).
2. Edit `FIXTURES` in `src/app/(dev)/design/reel-parity/parity.tsx` to the recipe's `clipIds`, in
   order. **This is a code edit, not a control**, which is the one real friction in the loop: the page
   exposes style, seed, orientation and watermark as controls but hardcodes its eight fixtures. If
   re-rendering is ever going to happen twice, that list should come from a `MARKETING_REELS` recipe
   rather than a literal; noted as a follow-on, not fixed here.
3. Set the recipe's `styleId`, `seed` and `orientation` from the manifest entry. Determinism is per
   (clips, styleId, seed, orientation), so those four reproduce the source exactly.
4. Encode and download the mp4.
5. Run the `finish` string recorded on the entry verbatim, by hand. For `hero-candidate-01` that is
   `ffmpeg scale=720:1280 b:v 2200k yuv420p +faststart -an`.
6. Grab the poster from the first graded frame, update `durationSeconds`, `shotBoundaries` (transition
   midpoints, frame-exact at 24 fps, extracted from `planReel`) and `renderedAt`.

**Why this matters to sourcing.** Both recipes draw on `festival-lights`, `festival-crowd`,
`concert-confetti`, `party-dj`, `wedding-golden`, `party-balloons`, `wedding-petals` and
`wedding-toast`: eight of the twelve. A media swap that touches any of them invalidates both recorded
loops. If the film in `ASSETS.md` row 1 is delivered as a real cut, the landscape reel stops being a
render at all and becomes a file, which is simpler and better; the portrait reel is the one that still
needs the loop above.

---

## 4. The licensed sources, clause by clause

Surveyed 2026-09-14 by reading each license page. Every quotation below is verbatim from the page
named beside it. The test applied is the one this round was given: **does this source allow a
commercial marketing use, without attribution, under terms we can name?**

### 4.1 The five that pass

**CC0 1.0** (`creativecommons.org/publicdomain/zero/1.0/`). The deed:

> "You can copy, modify, distribute and perform the work, even for commercial purposes, all without
> asking permission."

A waiver rather than a license, so there is no revocation clause and no compliance to maintain. The
one thing it does not do is reach the people in the frame: "In no way are the patent or trademark
rights of any person affected by CC0, nor are the rights that other persons may have in the work or
in how the work is used, such as publicity or privacy rights." Creative Commons also states plainly
that it verifies nothing: "Creative Commons has not verified the copyright status of any work to
which CC0 has been applied."

**Pexels** (`pexels.com/license/`). "All photos and videos on Pexels are free to use." and
"Attribution is not required. Giving credit to the photographer or Pexels is not necessary but always
appreciated." Forbids, verbatim: "Identifiable people may not appear in a bad light or in a way that
is offensive", "Don't imply endorsement of your product by people or brands on the imagery", "Don't
redistribute or sell the photos and videos on other stock photo or wallpaper platforms". The terms of
service go further than the license page and are the operative text: a **Standalone** bar, where
"using the Content in its original form or solely using a filter, changing colors, resizing or
cropping the Content remains Standalone use", and a competing-service bar. Two flags: the terms grant
an "irrevocable" license in one section and reserve "the right to cancel or change the licenses
granted by these Terms" in another, and Pexels "do[es] not warrant that any consents or licenses have
been obtained in relation to any Content". AI-generated uploads are prohibited but not guaranteed
absent.

**Pixabay** (`pixabay.com/service/license-summary/`). "Use Content without having to attribute the
author (although giving credit is always appreciated by our community!)" Same house as Pexels and
near-identical terms, with two differences that matter. The CC0 era ended: "CC0 Content on the Service
is any content which lists a 'Published date' prior to January 9, 2019", so everything newer is under
Pixabay's own license. And AI-generated work is **permitted** and must be declared: "You must clearly
label any Content which is AI-generated by selecting the 'AI-generated' checkbox on the upload page."
So the library is mixed by design, which is a provenance fact, not a quality judgement.

**Mixkit** (`mixkit.co/license/`). "Items under the Mixkit Stock Video Free License can be used in
your commercial and non-commercial projects, for free." and "Attribution is not required, however, we
would appreciate it if you credit Mixkit where reasonably possible." **The trap is that the license is
per item.** The same video library carries a Stock Video Restricted License under which "Items ...
can be used in personal projects only", explicitly not allowed for "Commercial Projects /
Advertising / Company Social Media posts". The grant is also "freely revocable" in its own words and
liability is capped at ten dollars. Usable for a clip, checked at download. Never for a batch.

**Coverr** (`coverr.co/license`). "Coverr.co grants you an irrevocable, non-exclusive, worldwide
copyright license to download, copy, modify, perform, and use videos and music from Coverr.co for
free, including for commercial purposes, without needing permission from the content creator or
Coverr.co." Attribution is not required on either tier. It is the most candid source on releases:
"While we do obtain model releases for individuals appearing in our content, we do not provide these
releases to users", and "We do not hold releases for any brands, trademarks, or identifiable
properties or landmarks". It bars AI training outright, and its own FAQ discloses that it supplements
its catalog with Shutterstock results, which are not under this license.

### 4.2 The five that fail, and why

**Unsplash** (`unsplash.com/license`, `unsplash.com/terms`). **This is the finding of the round.** The
license page reads generously: "Unsplash grants you an irrevocable, nonexclusive, worldwide copyright
license to download, copy, modify, distribute, perform, and use images from Unsplash for free,
including for commercial purposes, without permission from or attributing the photographer or
Unsplash." The terms then carve the middle out of it:

> "Note that the Unsplash License does not include the right to use: Trademarks, logos, or brands that
> appear in Images / People's images if they are recognizable in the Images / Works of art or
> authorship that appear in Images"

Every one of the twelve stand-ins claims Unsplash, and every one of them is full of recognizable
people: a couple, a toast, a dance floor, a crowd. **The license they claim never covered the people
in them.** The free tier also disclaims all warranties and caps liability at one hundred dollars.
Unsplash's paid tier does carry a real warranty ("using Unsplash+ images will not infringe third party
IP rights or publicity rights", backed "Up to US $10,000 per licensed photo"), which is the honest
shape of what a face in a marketing frame costs. Unsplash is out for the manifest.

One important exception, and it is where the staged batch comes from. Photographs published on
Unsplash **before 5 June 2017** were released under CC0, and Wikimedia Commons mirrors that corpus
with a template that states it: "This image is from Unsplash and was published prior to 5 June 2017
under the Creative Commons CC0 1.0 Universal Public Domain Dedication. Note: On 5 June 2017, Unsplash
switched the old sitewide license for all uploads from Creative Commons CC0 to a custom license
arrangement which does not meet the free content licensing requirements for Commons." That archive is
genuinely CC0, with the author and the original photo URL recorded per file.

**CC BY 4.0.** Refused for the manifest, not on principle. It is a strong license that "cannot [be
revoked] as long as you follow the license terms", but it requires that "You must give appropriate
credit, provide a link to the license, and indicate if changes were made". A credit line under every
photograph is a design decision nobody has made, and the sourcing rule has to be one a page can keep
silently. Fine for a single editorial frame that prints its credit.

**Vecteezy Free** (`vecteezy.com/licensing-agreement`). "Attribution is required." Commercial use is
capped ("Content may be used in video, film, or production projects with budgets up to $1,000"), and
the agreement reserves the right to pull the rug: "Vecteezy may stop licensing any Content at any time
in its sole discretion", after which it "may require you to immediately, and at your own expense,
cease using the Content and any End Product incorporating the Content". A license that can be
withdrawn from under a published page is not one to build a manifest on.

**Videvo.** The license page no longer exists: `videvo.net/license/` redirects to `magnific.com/license`,
which returns a 404. The brand was absorbed into Freepik. Its successor terms grant use "in a
non-transferable, **revocable**, limited, non-exclusive manner" and make free use "conditioned upon any
use by the User being duly attributed" unless you subscribe. Worth recording precisely because it is
the failure mode the rule exists for: **a source can disappear, and a manifest entry that records only
a platform name has no way to prove what was agreed.**

**Openverse** (`docs.openverse.org/terms_of_service.html`). An index, not a source: "Openverse does not
own or control the content or data made available through the API or shared on the website, and does
not verify its licensing status or make any representations or warranties about the content or data
whatsoever." Useful to find a candidate, never to justify one.

**Wikimedia Commons** sits between the two. It licenses nothing itself, but unlike Openverse it
enforces a floor on what may be hosted: "Republication and distribution must be allowed. / Publication
of derivative work must be allowed. / Commercial use of the work must be allowed. / The license must
be perpetual (non-expiring) and non-revocable." That floor, plus a machine-readable per-file license,
is why the staged batch was cut there. It still verifies no uploader's ownership, and most of its
files are CC BY or CC BY-SA, so a batch has to be filtered to CC0 file by file.

### 4.3 What every one of them has in common

1. **Nobody hands you a model release.** Coverr says so outright, Unsplash removes recognizable people
   from the grant, Pexels and Pixabay push the determination to the user: "Responsibility for
   determining whether permissions are needed always rests solely and exclusively with you." A face on
   a marketing page is a release question, and no free tier answers it.
2. **Nobody verifies that the uploader owned the photograph.** Every free tier disclaims it in capital
   letters. The upside of a real shoot is not only taste; it is the only sourcing where we know.
3. **Everybody bars building a competing service** from their assets. Not a risk for us today. Worth
   remembering the day anything reaches for a media library as a product feature.
4. **"Irrevocable" is soft on four of the five.** Pexels, Pixabay and Coverr each grant an
   irrevocable license and separately reserve the right to change the terms; Mixkit does not even
   claim it, calling its own grant "freely revocable". Only CC0 and CC BY are clean, which is the
   real reason to prefer CC0 for anything that ships.

---

## 5. The kit Will makes

**36 masters, six per vertical.** The verticals are the ones the product sells to and the blog already
writes for: weddings, birthdays, corporate, conferences, festivals, trips. The manifest holds seven
weddings, one birthday, four festivals and nothing else, which is why
`/blog/conference-photo-sharing-no-app` is illustrated with an outdoor music festival and
`/blog/company-offsite-photos` with a banquet hall of blue and white streamers. Seven of 23 posts are
miscast this way and nobody chose any of them: the cover is hashed from the slug into a pool that has
no corporate, conference or trip frame to hash into.

**Everything else is derived from those 36.**

| Deliverable | Derivation | Replaces | Standing |
| --- | --- | --- | --- |
| 36 masters, 1600 px long edge, a third portrait, one grade | the shoot | all twelve stand-ins | `ASSETS.md` row 7, requested |
| 24 squares at 512 px, 6 to 35 KB webp | crops of 24 of the masters | `FRAMES` in `shared.tsx`, which every round-three hero variation cycles | row 2, requested and live |
| 8 vertical clips, 3 to 5 s, 1080 x 1920, silent, each with its own poster | filmed at the same events | the `currentTime` ranges cut out of `hero-candidate-01` | row 4, withdrawn with the gathering; cheap to revive because it is the same shoot |
| The film, 15 to 20 s, 12 to 18 shots, both orientations, mp4 + webm + posters | cut from the same footage | `hero-candidate-02` and its poster | row 1, parked for the queued video card |

Only the first row is a new ask. The rest are the same shoot, cropped and cut, which is why parking a
hero concept should never park the photography.

### 5.1 The shot lists

**Weddings.** A toast mid-sentence, glass up, the table sharp and laughing. Two hands on a table edge,
rings on, one still holding a glass. The dance floor from above, hands up, edges dark. The exit under
petals or confetti, shot portrait from low. A guest holding a phone up, filming the first dance. The
cake table at dusk under string lights, people reaching in.

**Birthdays.** Candles going out, faces lit from below. A sparkler number held up in a dark room. The
sofa squeeze, too many people in one frame. Hands and cake, close enough to read at 120 px. Balloons
against a ceiling, shot straight up, someone underneath. The table after: plates, confetti, one glass
still going.

**Corporate.** The offsite long table, warm, phones down. A rooftop drinks circle at golden hour. The
award handshake, caught mid-clap from the room. Karaoke, two people sharing a mic, the room out of
focus. The van at the end of the night, doors open. A team photo going wrong, half of them laughing.

**Conferences.** The hallway between sessions, lanyards, nobody posing. The stage from the back of the
room, silhouettes and screen glow. A phone held up over the crowd, photographing a slide. The
coffee-break huddle, cups and gesturing hands. A booth handshake, badges legible, faces soft. The badge
wall at the end of day one, half of them gone.

**Festivals.** The crowd from inside it, hands up against stage light. Confetti over a night crowd,
phone screens in the dark. Two friends on shoulders at sunset, one of them filming. A light rig from
underneath at dusk, sky still blue. The field at golden hour, flags, small figures. The camp at dawn,
one person awake.

**Trips.** The car loaded, doors open, someone still deciding. A terrace table at night, the town
below. The group on a beach at dusk, backlit, no faces needed. Someone photographing someone
photographing. A ridge line with the group small in it. The last fire, faces lit orange.

### 5.2 What a frame must survive

These are not preferences. Each one comes from a surface the twelve already feed.

1. **1600 px long edge, a third portrait.** Eleven of the twelve stand-ins are landscape and none is
   wider than 900 px, so `wedding-petals`, the manifest's lone portrait, currently feeds every
   vertical slot in the product and a landscape-only library crops hard in every tall one.
2. **Readable at 120 px.** The hero corridor reads a frame between 70 and 290 px, where a wide room
   shot is grey mush. Tight framing is the single biggest lift available to the whole set.
3. **Survives the crop ladder.** Six positions, 22 percent left to 78 percent right. Put something in
   both halves.
4. **Dark and warm, left 55 percent of frame in the lower third of the range.** That is what buys a
   hero with no scrim over the media, which is rule 1 held rather than argued.
5. **Three frames show a guest holding a phone up at the event.** The many-hands argument is carried by
   the arrangement; it lands harder when one frame says it literally.
6. **No frame needs a face in focus to work**, because the type sits over the left half of the hero.
   This is also what keeps most of the kit clear of the release question in 1.4.

### 5.3 The cheapest way to get all of it

One real event, hosted, shot by Will, with a release signed at the door. That is the rising-tides
answer: it is the only sourcing under which the product's own claim ("this is what an event looks like
when the guests shoot it") is literally true, it produces the 36 masters and the 8 clips and the film
in one night, and it seeds `ASSETS.md` row 5 (the demo event's curated folder) at the same time,
because the demo event should be a real event. A second one in a different season covers the verticals
one night cannot.

---

## 6. The first batch

**Eight of twelve, all CC0, staged under `public/design/media-kit/`** with `provenance.json` beside the
files. Nothing under `public/design/` is scanned by `marketing-media.test.ts` and nothing on a
marketing surface reads it, so the batch is a proposal on a board and not a shipped byte.
`provenance.test.ts` in the board's own directory pins it anyway, both directions, the way the real
manifest is pinned: every file exists and is under 300 KB, every file has a record, every record names
an author and an `https://` source and an ISO retrieval date, and every field the board shows matches
the record beside the files.

**Where they came from, and why.** Pexels and Pixabay both refuse a non-browser client outright (403),
so neither can be surveyed or fetched without a key. The batch was therefore cut from Wikimedia
Commons, filtered to CC0 file by file, and within that from the pre-5-June-2017 Unsplash archive
(section 4.2), which is the only body of freely licensed imagery in the same aesthetic family as the
twelve. Each file was confirmed twice before download: the Commons page carries the `{{Unsplash}}`
template, which Commons applies only to the CC0-era corpus, and the API reports CC0 for the file.
Each was then resized to 1200 px and stripped of metadata; CC0 permits modification without
permission, and the record of who made it belongs in `provenance.json` rather than in EXIF.

**What the search actually returned, which is the more useful result.** The batch is eight, not twelve,
and the four holes are the argument:

| Stand-in | What the CC0 corpus returned |
| --- | --- |
| `party-balloons` | Hot air balloons. Six results out of six. |
| `reception-hall` (a dance floor) | A woman in a desert, a couple embracing, an elderly couple, a person jumping, and a rope on a stage. Not one dance floor. |
| `reception-table` | Restaurant tables and styled flat-lays. No dinner with people at it. |
| `wedding-petals` | Nothing portrait at all, which is the same hole the manifest already has: one portrait in twelve. |

A search for "wedding aisle" returned an aircraft cabin. A search for "festival crowd" returned, among
the usable frames, ten photographs of a memorial to a fatal crowd crush. **Keyword-sourcing a
marketing library from a public index does not control what the library is about**, and the failure
mode is not a bad photograph, it is a photograph whose subject you did not intend and did not look at.
Every frame that ships has to be looked at by a person. That is true of a licensed batch and it is why
the manifest's `subject` field says "verified by eye at intake, not inherited from filenames".

**Two of the eight carry a caution on the board rather than in a footnote.** `party-dj` shows one
identifiable performer, so under the proposed rule 1.4 it needs a release nobody here holds and could
not ship as it stands. `wedding-toast` is honest subject drift: it is hands and beer glasses in a
restaurant in Niigata, standing in for a champagne toast at a reception under string lights. Both are
shown as they are. A batch that hides its own weak entries is not a survey.

**The recommendation on the batch: yes as a bridge, no as an answer.** Ship licensed frames only where
the photograph is furniture, delete them the day the kit lands, and never on the hero. A stock photo on
a page that says "every frame here is from a real event" is the failure Will already caught once, on
the press page, and the reason bible 18 exists. The eight also demonstrate the ceiling: seven of
them are empty rooms, detail shots, silhouettes or the backs of people's heads, and the one with a
face in it is the one carrying a caution. That is not a coincidence in the search. The frames worth
anything to this product are the ones with faces in them, and those are exactly the frames no free
license covers.

---

## 7. What a wiring round does with a ruling

Whichever route is ruled, the same checklist applies. It is written here so the wiring round does not
have to rediscover it.

1. **Keep the ids.** A replacement frame takes the id of the stand-in it replaces, or every blog cover
   moves under its published article (section 2).
2. **Files in, entries in, one commit.** `public/marketing/{img,posters,reels}` and
   `MARKETING_IMAGES` change together or the orphan test fails, which is the point of it.
3. **Widths and heights are real.** The orientation assertion reads them.
4. **Re-render both reels** per section 3, or replace them with the delivered film.
5. **Raise the test** to the shape in section 1.3 in the same commit, so the new entries are the first
   ones it holds.
6. **Check the crop ladder by eye** on three posts at 4:5 before and after, because the ladder is
   derived from the slug and a new frame inherits whatever position that slug already hashed to.
7. **Delete the bridge.** Any licensed frame carried under the Mix route is removed, not left because
   it still looks fine.
