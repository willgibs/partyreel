# The media kit: sourcing, licensing, and the kit we make

> **ROLE:** the proposed sourcing law for every frame on a Partyreel surface, plus the survey behind
> it and the plan for the kit Will produces. Written by the `media-kit` track of the review wave
> (2026-09-14). **BELONGS HERE:** the rule, the allowed sources with the clause that allows them, the
> manifest's contract, the re-render runbook, and the call sheet. **NOT HERE:** which assets have been
> asked for or delivered (that is [`../ASSETS.md`](../ASSETS.md)), how a marketing page is built
> (that is [`../systems/marketing-content.md`](../systems/marketing-content.md)), or the wiring itself
> (a wiring round's commit). **GROWS BY:** refine in place; the settled part is promoted into the
> system layer by the Orchestrator once Will rules.

> **STATUS: A PROPOSAL, revised at round two (2026-09-14).** Nothing here is in force. Bible 18
> ("every frame is ours") is ratified; the operative detail below is this track's recommendation and
> waits on Will's ruling. No production byte changed on this track: the twelve stand-ins are untouched
> and the candidate batch is staged under `public/design/media-kit/`, which no marketing surface reads.
> Round two corrected three things round one got wrong, each marked ★ in place: the exposure (the site,
> not the blog), the blog covers (chosen in frontmatter, not hashed) and the reel runbook (no code edit
> needed). The board is `/design/c/media-kit`.

---

## 0. The short version

**What is true today.** All twelve entries in `MARKETING_IMAGES`
([`src/lib/constants/marketing-media.ts:64-171`](../../src/lib/constants/marketing-media.ts)) carry one
line, `license: "unsplash (per lab-pack comment; provenance unverified)"`, and nothing else: no author,
no source URL, no retrieval date. All three of those fields exist on the type and all three are
optional (`:33-36`). The lab pack the files were copied from, `public/design/`, was empty when this
track opened, so the provenance trail is gone from the tree.

**★ The blast radius is the site, not the blog.** Round one measured this as the blog's cover pool and
understated it. The twelve ids are referenced by name in **40 production files** and reached by **22
production routes**, and two of those files are the footer's demo strip
([`chrome/footer-demo.tsx`](../../src/components/marketing/chrome/footer-demo.tsx): `wedding-arch`,
`concert-confetti`, `reception-table`, `festival-lights`) and the navigation's mega panel
([`chrome/mega-panel.tsx`](../../src/components/marketing/chrome/mega-panel.tsx): `wedding-toast`,
`reception-table`). Both sit in the `(cinema)` and `(paper)` **group layouts**, so six of the twelve are
in the chrome of all 24 marketing pages before a reader scrolls. `exposure.test.ts` recomputes every one
of those numbers from the tree, so the board cannot quote a stale one. On top of that the blog puts
eleven of them on 23 published posts, on the OpenGraph card each post syndicates to every platform that
unfurls a link, and inside the RSS enclosures. The frames are being redistributed, at scale, under a
license nobody can name.

**★ And nobody hashed those covers.** Round one's board said the blog's cover pool hashes a slug into
eleven frames, which is true of the resolver and false of production: **every one of the 23 posts sets
an explicit `cover:` in its frontmatter**, so `blog-covers.ts`'s fallback never fires, and 22 of the 23
differ from what the hash would have returned. A person chose every miscast cover, out of eleven wedding
and festival frames, which is why `/blog/conference-photo-sharing-no-app` is illustrated with an outdoor
music festival. That changes what the fix is: the bridge is **23 frontmatter lines**, not twelve files.

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

**★ The second search closed all four of round one's holes, and that moves the argument rather than
winning it.** The first pass searched the corpus by the words on a manifest entry ("party balloons"
returned hot air balloons, six for six) and staged eight of twelve. The second searched by the SCENE,
in the one pocket of the corpus with the right aesthetic (the pre-5-June-2017 Unsplash archive that
Commons mirrors), and found a dance floor, a table with people at it, real balloons and a portrait: 16
more frames, 22 staged in all, all twelve ids fillable. So the corpus *can* dress the site. What it
still cannot do is put a recognisable private celebration in frame: **18 of the 22 work only because
nobody in them is recognisable, and the four with a face are the four that need a release nobody here
holds.** The frames worth anything to this product are the ones with faces in them.

**★ What the corpus actually is, which is the more useful result.** Scene searches for "office party
colleagues", "conference audience" and "dinner party friends" return government photo-ops, UN panels,
Wikimedia meetups and the Place de la Concorde. The free corpus is an archive of **record** (press,
state, museum, open-source events), not of private celebration, and its coverage maps exactly onto what
photographers give away: travel, landscape, food, details, concerts. Mapped onto our verticals: **trips
is covered completely, festivals mostly, weddings only as details and the backs of heads, birthdays
only as a cake on a table, corporate as an empty meeting room, and conferences not at all.** Two of the
23 posts are therefore left empty on the board on purpose, and both are at the corporate end, which is
half the business.

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

**1.2 Six fields become required** (round two added two of them, after prototyping the record on 22
real files). `author`, `sourceUrl` and `retrieved` are optional on `MarketingImage["credit"]` today
(`marketing-media.ts:33-36`). They become required, `license` becomes a union rather than free text,
and two fields join them:

```ts
type People = "none" | "unidentifiable" | "identifiable";

credit:
  | { kind: "ours"; author: string; created: string; how: string; people: People }
  | {
      kind: "licensed";
      license: LicenseId;
      /** The sentence of the license that permits this use, QUOTED, not named. */
      clause: string;
      author: string;
      sourceUrl: string;
      retrieved: string;
      people: People;
    }
```

**`clause` is quoted rather than named** because a source can vanish and a platform name proves nothing
about what was agreed. Videvo is the worked example (section 4.2): its license page 404s, the brand was
absorbed, and the successor terms are revocable and demand attribution. An entry that recorded only
"Videvo" would today be unprovable. An entry that quoted the clause is still a record.

**`people` is the field that does the work**, because it is the one a human has to answer by looking.
No free tier supplies a model release, so `identifiable` on a `licensed` entry means "not on a page
that makes a claim" (1.4), and it is the reason 18 of the 22 staged candidates are backs, hands and
silhouettes. It is also the field that cannot be derived: the filename, the search query and the
uploader's title all lie, and only an eye settles it.

The shape is not a sketch. `candidates.ts` and `public/design/media-kit/provenance.json` both carry all
six fields for 22 files, and `provenance.test.ts` pins them against each other field by field, refuses a
record missing one, refuses a frame created on or after 5 June 2017, and refuses an `identifiable` frame
that carries no caution. The rule can be watched passing before it is ruled on.

`how` on an `ours` entry is the one field that does not exist today and matters more than any of the
others: for a photograph it reads "shot, <event>, <date>"; for a generated frame it names the tool and
the account the output was made under, because **a generated frame's license is the generating
service's output-ownership clause**, and that clause is exactly as nameable, and exactly as
forgettable, as a stock library's. A generated asset is not automatically ours. It is ours when the
terms under which it was generated say so, and that sentence belongs in the manifest next to the frame.

**1.3 The test rises with the rule.** `marketing-media.test.ts:51` asserts only that the license string
is non-empty, which the twelve pass while being exactly the problem. Proposed: the test asserts the
discriminated shape above, that a `licensed` entry's `license` is one of the ids in section 4, and that
`retrieved` parses as a date, that `clause` is non-empty, and that `people` is one of the three values.
That turns "provenance unverified" from a comment into a build failure,
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

**★ That pool is dormant in production.** Every one of the 23 posts sets `cover:` in frontmatter, so
`coverFor` takes the explicit branch every time and the hash never runs. Two consequences. The pool's
eleven ids are a safety net for a post nobody has written yet, not the thing dressing the blog today;
and **changing a post's cover is a frontmatter edit**, which is the cheapest possible bridge and the one
round two recommends. `bridge.test.ts` pins every post's cover and crop against the real resolver.

**The crop ladder is a hidden spec on the media itself.** `blog-covers.ts:43-50` re-crops one source to
six object-positions from `22% 45%` to `78% 45%`, which is how eleven images dress 23 posts without
reading as eleven images. It works, and it means a frame whose whole subject sits in the middle loses
that subject in four of the six positions. Every frame entering the pool has to be composed for it.

**★ And the share card ignores the ladder entirely.** `blog/[slug]/opengraph-image.tsx` reads the cover
off disk and draws it at 1200x630 with `objectFit: "cover"` and **no** `objectPosition`, so the card a
stranger sees when a link unfurls is always the MIDDLE of a frame that was composed for a 4:5 card at
the 22 or 78 percent rung. A frame can pass the card and fail the share image, which is why the board
shows both geometries side by side and why "survives a 1200x630 centre crop" is its own line in the
shot brief.

---

## 3. How a recorded loop is re-rendered

Two reels are recorded in the manifest (`:181-217`), both stand-ins, both pinned to stand-in clip ids.
Replacing the media means re-rendering them, and that is not a CLI job. Budget for it.

**★ The engine encodes in a browser.** The Remotion/AWS-Lambda render path was torn down 2026-07-08;
the only path is an on-device WebCodecs encode (`src/lib/reel/engine/encode.ts`), brokered for
production by `src/lib/reel/render-service.ts`. There is no headless renderer to point at a file.

**★ It is NOT a code edit, which is the round-one claim this round withdrew.** The survey read
`FIXTURES` at the top of `reel-parity/parity.tsx`, saw eight hardcoded ids and concluded that a
re-render needs an edit. Twenty lines further down the same file there is a `CLIP_SETS` picker, and
both recorded recipes are already in it, in order:

| Recipe | Clip set on the page | Style | Seed | Orientation |
| --- | --- | --- | --- | --- |
| `hero-candidate-01` | **Marketing: mixed 6** | `classic` | 73 | portrait |
| `hero-candidate-02` | **Marketing: festival arc** | `golden` | 73 | landscape |

`runbook.ts`'s `matchClipSet` checks that against the manifest rather than asserting it, and
`runbook.test.ts` fails the suite the day either list drifts. The friction that is actually left is
that **the pairing is true and nothing in the tree says so**, so the next person rediscovers it or
edits code they did not need to edit.

**The runbook.**

1. Open `/design/reel-parity` in the lab (Chrome, with WebCodecs; the page probes on mount and
   disables Encode if it is not there).
2. Pick the clip set from the table above. No code edit.
3. Set style, seed and orientation from the recipe. Seed defaults to 73, which both recipes use.
4. Set the bitrate to **4 Mbps**. `DEFAULT_BITRATE` is 5, and both recipes recorded `sourceBitrate:
   4_000_000`, so a default that does not match the record is a silent way to lose determinism.
5. Encode and download the mp4. Determinism is per (clips, styleId, seed, orientation).
6. Run the entry's `finish` string verbatim. It is recorded as prose rather than as argv, so step 6 is
   a retype rather than a paste.
7. Grab the poster from the first graded frame and update `durationSeconds`, `shotBoundaries`
   (transition midpoints, exact 1/24 s multiples, read off `planReel`) and `renderedAt`.

**What the wiring round adds**, in the order it bites: a clip set that reads a `MARKETING_REELS` recipe
rather than a literal, so a recorded loop re-renders from its own record; the bitrate preselected from
`sourceBitrate`; `finish` recorded as argv; and, until the first of those lands, a note on the entry
naming the clip set that reproduces it.

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
5. **★ The free corpus is an archive of record, not of celebration** (round two, from the second
   search). Scene queries for "office party colleagues", "conference audience" and "dinner party
   friends" return government photo-ops, UN panels, Wikimedia meetups and the Place de la Concorde,
   because what is freely licensed at scale is what institutions publish and what photographers give
   away: travel, landscape, food, details, concerts. Against our six verticals that means **trips is
   covered completely, festivals mostly, weddings as details and the backs of heads, birthdays as a
   cake on a table, corporate as an empty meeting room, and conferences not at all.** The gap is not
   bad luck in a search. It is what the corpus IS.

---

## 5. The kit Will makes

**36 masters, six per vertical.** The verticals are the ones the product sells to and the blog already
writes for: weddings, birthdays, corporate, conferences, festivals, trips. The manifest holds seven
weddings, one birthday, four festivals and nothing else, which is why
`/blog/conference-photo-sharing-no-app` is illustrated with an outdoor music festival and
`/blog/company-offsite-photos` with a banquet hall of blue and white streamers. Seven of 23 posts are
miscast this way, and a person chose every one of them (section 0): choosing carefully out of eleven
wedding and festival frames is what produces a conference illustrated with a music festival.

**Everything else is derived from those 36.**

| Deliverable | Derivation | Replaces | Standing |
| --- | --- | --- | --- |
| 36 masters, 1600 px long edge, a third portrait, one grade | the shoot | all twelve stand-ins | `ASSETS.md` row 7, requested |
| 24 squares at 512 px, 6 to 35 KB webp | crops of 24 of the masters | `FRAMES` in `shared.tsx`, which every round-three hero variation cycles | row 2, requested and live |
| 8 vertical clips, 3 to 5 s, 1080 x 1920, silent, each with its own poster | filmed at the same events | the `currentTime` ranges cut out of `hero-candidate-01` | row 4, withdrawn with the gathering; cheap to revive because it is the same shoot |
| The film, 15 to 20 s, 12 to 18 shots, both orientations, mp4 + webm + posters | cut from the same footage | `hero-candidate-02` and its poster | row 1, parked for the queued video card |
| 8 portrait crops at 512x640 | 4:5 recrops of eight of the same 24 | the square box on a third of the burst's field | row 9, requested |
| 12 portraits at 720x900, 15 to 60 KB webp, legible at 110 px | `W4`, `B5` and `S3` are shot portrait; the other nine are 4:5 recrops of masters whose subject is vertical | the portrait cards in the river's `CARD_POOL`, cropped hard from landscape today | row 12, requested |
| A hand-and-phone cutout, PNG with alpha, the screen area transparent, two grips | **a separate setup**, the only one on this list | the drawn device in `scan.tsx` | row 8, requested |

Only the first row and row 8 are new asks. Everything else is the same shoot, cropped and cut, which is
why parking a hero concept should never park the photography. **Row 8 is the exception worth naming**:
shoot it at the same event, against the darkest wall available, from just behind the holder's shoulder,
in the same low warm light as `K3`, so the body is nearly a silhouette with one highlight along the
edge. It costs ten minutes at an event that is already happening and nothing at all if it is missed.

### 5.1 The call sheet

Round one wrote the kit as six shot lists: one line per frame, enough to argue with and not enough to
hold a camera to. Round two rewrote the same 36 frames as a call sheet, one card per frame, and the
data lives at
[`sandbox/media-kit/shoot.ts`](../../src/app/(dev)/design/sandbox/media-kit/shoot.ts) and renders on
the board. Each frame carries a stable code (`W1` to `T6`, so a ruling can name one), what happens in
the frame, where the camera is, what the light is doing, the crops it has to survive, and the manifest
ids it inherits.

**Each frame's crops come from a real surface**, never from taste: the 4:5 card and the 22-to-78 ladder
are `blog-covers.ts`; the 1200x630 centre crop is the share card, which ignores the ladder; 120 px is
the narrowest the home hero's corridor draws a frame; 512 square is `ASSETS.md` row 2; 512x640 and
720x900 are rows 9 and 12.

**All twelve stand-ins are inherited**, by id: `W1` takes `wedding-golden` and `wedding-arch` (the
couple coming back down the aisle under it), `W2` `wedding-toast`, `W3` `reception-hall`, `W4`
`wedding-petals`, `W6` `reception-table` and `wedding-rings`, `B1` `party-balloons`, `S1`
`festival-crowd`, `S2` `concert-confetti`, `S4` `festival-lights`, `S5` `party-dj`.

**Four of the 36 are the palette board's hard cases** (`ASSETS.md` row 7), marked rather than asked for
separately, because a ramp is only ever wrong against media that fights it: `W5` high key (the dress
against a white wall in window light), `W3` low key (a dance floor lit by one lamp), `W2` candle warm,
`S4` stage cool (a rig against the last blue).

**Three show a guest holding a phone up**: `K3` (photographing a slide over the crowd), `S3` (on
shoulders at sunset, filming) and `T4` (someone photographing someone photographing).

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

## 6. The batch, and the bridge

**22 files, all CC0, staged under `public/design/media-kit/`** with `provenance.json` beside them.
Nothing under `public/design/` is scanned by `marketing-media.test.ts` and nothing on a marketing
surface reads it, so the batch is a proposal on a board and not a shipped byte. `provenance.test.ts`
pins it anyway, both directions, the way the real manifest is pinned, plus the four assertions the
proposed rule adds (section 1.2).

**Where they came from, and why.** Pexels and Pixabay both refuse a non-browser client outright (403),
so neither can be surveyed or fetched without a key. The batch was therefore cut from Wikimedia
Commons, filtered to CC0 file by file, and within that from the pre-5-June-2017 Unsplash archive
(section 4.2), which is the only body of freely licensed imagery in the same aesthetic family as the
twelve. Each file was confirmed twice before download: the Commons page carries the `{{Unsplash}}`
template, which Commons applies only to the CC0-era corpus, and the API reports CC0 for the file. Each
was then resized to 1200 px and stripped of metadata, and **looked at by eye at intake**, which is the
only way the `subject` and `people` fields can be filled at all. `provenance.test.ts` refuses any record
created on or after 5 June 2017, because that date is the entire basis of the batch being CC0.

**Round one staged eight and called the four holes the argument.** Round two searched the same corpus by
the SCENE rather than by the words on a manifest entry and filled all four, plus a candidate for the
three verticals the manifest has nothing for. 16 new frames; two of round one's eight were superseded
and dropped, because a file nothing uses should not be staged (the suite enforces that too).

| Round one could not fill | What the second search found |
| --- | --- |
| `party-balloons` (hot air balloons, six for six) | Polka dot balloons on a white brick wall. High key and cool, and still decor with nobody under it |
| `reception-hall`, a dance floor (a desert, an elderly couple, a rope on a stage) | A DJ over a packed floor under a mirror ball. An identifiable performer, so it needs a release |
| `reception-table`, a dinner with people at it (restaurant tables, styled flat-lays) | A table from above at brunch, hands reaching in, no faces. Daylight and cool, not a reception at night |
| `wedding-petals`, anything portrait at all | Two people in silhouette against a dusk sky, shot tall. The only portrait in the batch |

**The ceiling, restated with the larger batch.** Of the 22, **18 work only because nobody in them is
recognisable** (backs, hands, silhouettes, empty rooms) and **the four with a readable face all carry a
caution**, because no free tier supplies a model release. The frames worth anything to this product are
the ones with faces in them, and those are exactly the frames no free license covers. A bigger search
did not change that. It made it measurable.

**The bridge is per post, not per frame** (section 2). The board maps all 23 published posts to a
candidate at the blog card's 4:5 with its real ladder position and at the share card's 1200x630 centre
crop; 21 fill and **two stay empty on purpose**:
`/blog/conference-photo-sharing-no-app`, because every conference in the corpus is a press photograph
of a UN panel or an empty meeting room, and `/blog/office-holiday-party-photos-checklist`, because an
office party at night, indoors, with colleagues in it, under a license we can name, does not exist.
Both are at the corporate end of the product, which is half the business. A third,
`/blog/corporate-event-photo-sharing-pricing`, is filled with laptops and hands and is shown precisely
because it reads as a stock office photograph, which is the exact thing bible 18 exists to stop.

**The recommendation on the batch: yes as a dated bridge, no as an answer.** Ship licensed frames only
where the photograph is furniture, delete them the day the kit lands, and never on the hero. A stock
photo on a page that says "every frame here is from a real event" is the failure Will already caught
once, on the press page, and the reason bible 18 exists.

---

## 7. What a wiring round does with a ruling

Whichever route is ruled, the same checklist applies. It is written here so the wiring round does not
have to rediscover it.

1. **Start with the chrome.** Four ids are in the footer strip and two in the nav panel, both in the
   group layouts, so those six frames are on every marketing page. Cheapest six to fix, most visible
   (section 0).
2. **Keep the ids.** A replacement frame takes the id of the stand-in it replaces, or every blog cover
   moves under its published article (section 2).
3. **The per-post bridge is its own, deliberate change.** 23 `cover:` lines in frontmatter, made once,
   with the before and after looked at. It is not a side effect of swapping files.
4. **Files in, entries in, one commit.** `public/marketing/{img,posters,reels}` and
   `MARKETING_IMAGES` change together or the orphan test fails, which is the point of it.
5. **Widths and heights are real.** The orientation assertion reads them.
6. **Re-render both reels** per section 3 (no code edit; the clip sets are in the picker), or replace
   them with the delivered film.
7. **Raise the test** to the shape in section 1.3 in the same commit, so the new entries are the first
   ones it holds. `provenance.test.ts` is the working prototype to lift from.
8. **Check both geometries by eye** on three posts: the 4:5 card at its ladder position AND the
   1200x630 share card, which centre-crops and will show a different part of the frame.
9. **Delete the bridge.** Any licensed frame carried under the Mix route is removed, not left because
   it still looks fine.
