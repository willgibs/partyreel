# The Partyreel voice

> ROLE: the standing PROPOSAL for what Partyreel sounds like: the voice in a paragraph, three
> volumes, five sentence shapes, the do's that replace bible 20's don'ts, the word list, what is
> still open, and the order a sweep runs in. BELONGS HERE: what is ruled and what is open. · NOT
> HERE: the candidate voices and their lines (the board, `/design/lab/brand-voice`, and its
> `voices.ts`), the lines themselves once ruled (the one home is
> [`marketing-voice.ts`](../../src/lib/constants/marketing-voice.ts)), the pages that carry them
> (→ [`../systems/marketing-content.md`](../systems/marketing-content.md)), the help authoring brief
> (→ [`../../content/help/AUTHORING.md`](../../content/help/AUTHORING.md)), any ledger of what each
> candidate writes where, and any history of how the board got here (git holds that).
> GROWS BY: refine in place. Never a ledger, never a diary.

> **STATUS: a PROPOSAL (the `brand-voice` track, round seven, 2026-09-16).** Bible 20 says this
> exploration writes the do's that replace it, and bible 21 opened every line on the site until a
> voice exists. **Six voices are on the board** at `/design/lab/brand-voice`, each writing the same
> twenty-four real places across the marketing site, the host's app and a guest's phone. The board
> is a five-step walk decided by ONE pick, and the last of the five asks how far the winner reaches,
> which nothing had asked out loud before. This document is written as the board's OWN
> recommendation (**Live**) and nothing in it binds until Will rules a card. On his ruling the
> Orchestrator promotes it to `docs/systems/brand-voice.md` and the `voice-infusion` round carries
> it site-wide. **The questions live on the board, not here**
> (its `spec.ts` holds each one with its options and the recommendation, and
> `docs/reviews/brand-voice.json` records the answer); a list of them in this doc would be a second
> home that goes stale the moment one is reworded.

## The voice, in one paragraph

Partyreel talks the way a good host talks while the party is still going: present tense, plain
nouns, one breath per sentence. Every line is about something arriving. A code goes on a table,
phones find it, an album fills with the event as everyone saw it, and the voice stays inside that
moment instead of describing it from afterwards. It is warm because it is specific, not because it
is friendly: it says photo, video, phone, code, album, guest, link, and it leaves memories, magic
and journeys to someone else. It calls the host you and the guests everyone. It leads with what the
reader gets, so the things Partyreel spares them (an app, an account, a group chat the morning
after) land in the second half of a sentence and never the first. It commits to outcomes and keeps
the machinery out of view. And it changes volume, not vocabulary: loud on the marketing site, quiet
in the product, nearly silent on a guest's screen, where the host's event is the only name that
matters.

## The three volumes

One voice at three volumes (bible 2: marketing may be louder in everything but the tokens; bible 4:
a guest surface belongs to the host's event). **The vocabulary never changes.** What changes is how
much shaping a sentence is allowed, and the volumes do NOT fork with the voice: a ruling on a card
moves the marketing volume's default sentence shape and nothing else in this section.

| | Marketing, loud | The app, quiet | A guest's phone |
| --- | --- | --- | --- |
| Beats per line | one or two | one | one |
| A shaped sentence (a turn, a count, a verb in front) | yes | no | no |
| Who "you" is | the host | the host | the guest |
| A number | yes, if it is real | only one already on screen | only one already on screen |
| The name "Partyreel" | freely | rarely | almost never |
| May sell | yes | no | no |

> Loud: *The album fills while the party is still going.*
> Quiet: *Your album is ready to share.*
> Nearly silent: *Add your photos and videos to Maya & Jay's Wedding.*

## The five sentence shapes

The do's in their positive form: a line that is none of these is usually a line that has not decided
what it is about.

| | Shape | Where it belongs | Written |
| --- | --- | --- | --- |
| 1 | **The arrival.** A verb in the present, the album as what results. | Hero, section header, feature card, email subject, notification body | One code on the table, and the album starts filling. |
| 2 | **The two beats.** A noun phrase, a comma, the turn that makes it matter. | Hero, section header, feature card, directory line, guest door | The whole event, in one album. |
| 3 | **The count.** A real number and what it adds up to, only where the number is on screen. | Section header, stat plate, notification title | Built from 214 photos. Shot by 23 guests. |
| 4 | **The instruction.** The action in the reader's words, ending in what they get. | Help article, app button, the second half of an error, guest surface | Scan the code, and you're in. |
| 5 | **The plain statement.** One clause, no music. | App copy, app label, help description, email first line, the first half of an error | Your album is ready to share. |

Shape 1 is the marketing default under **Live**; under **Keepsake** it is shape 2, and nothing else
in this document moves. **Plain** makes shape 5 the default everywhere, which is the one card that
would rewrite this section rather than one row of it.

### The surfaces, in one place

| Surface | Shapes | The rule |
| --- | --- | --- |
| Hero | 1, 2 | The h1 is the whole product in one line, the subhead the mechanism in one sentence. The h1 never explains; the subhead never sells a second time. |
| Section header | 1, 2, 3 | A claim the section then proves, never the category it belongs to. |
| Feature card | 1, 2 | Read in a row of cards, so it is scannable and different from its neighbours in substance. One line, no verb in front: the title carries the name. |
| Help article | 5, then 4 | The title is the reader's question in the reader's own words. **The one surface where the reader's words outrank the voice:** a title is also the search string and the tab title, which is why "How Partyreel works" keeps our name in a subject position the voice avoids everywhere else. |
| App label | none | The noun or verb the host would use for the thing. It is also the source string the help catalogue quotes. |
| Email subject | 1, 5 | Name what happened to the reader's own thing, front-loaded for a truncating inbox. Carry "Partyreel" only where the inbox needs it to sort. |
| Error | 5, then 4 | Say what did not happen, in the app's own noun, then the one thing to do next. Never apologise, never blame the reader, never explain the system. |
| Guest surface | 2, 4, 5 | The event's name leads, the host's business stated plainly, in the guest's words. |

## The eight do's

The two fences that are product truth
([`content-policy.test.ts`](../../src/lib/content-policy.test.ts)) and the bible's copy rules, each
written as the affirmative it replaces. This is the section bible 20 asked for.

**1. Lead with what arrives.** An absence may be the second beat, never the first, and never both.
"Scan, upload, done. No app to install." is the shape: the gain arrives, then the relief. "Nothing
to install. Nothing to sign up for." is two absences and no product. **This sentence is the proposed
replacement for bible 20**, whose current form ("say who we are, never who we are not") reads as a
ban on a line Will has already ruled.

**2. Commit to the outcome.** A reply, a review, host control, yes; a person answering, a human
reviewing, a "business day", no. Copy promises what arrives, never who or what delivers it, so
support and moderation tooling can change without breaking published (especially legal) language.
Two carve-outs stay: guest attribution and careers' "We read every application". The model sentence
already ships on `/contact`: **"Every note gets a reply, usually within a day."**

**3. Use only proof the product produced.** A number in a line is a number the product made (214
photos, 23 guests, 3 uploads to review). No "trusted by", no thousands of hosts, no testimonials,
no invented counts. The ingress backstop is never discussed at all, in any wording.

**4. Punctuate with a comma, a colon, parentheses, or two sentences.** Never an em-dash (bible 19,
with an AST guard over `app`, `components` and `lib`, plus the MDX scan).

**5. Call it an event.** A wedding, a conference and a christening are all events, and only one of
them is a night. "Night" is banned as identity language.

**6. Inside the app, say what happened and then stop.** The pitch stays on the site: a host who is
already paying does not need the argument again, and a marketing sentence inside the product is a
regression even when the sentence is better.

**7. Name the real thing.** photo, video, phone, code, album, event, guest, link, full size, the
room. Not memories, moments (in the plural abstract), magic, journeys, experiences, seamless,
effortless, unforgettable. "Moment" survives where it names a real thing on screen, which is why
the ratified "Every moment, and you decide what stays." is legal: that moment is a photo.

**8. Quote a control, never rename one.** If a line quotes an app control, the control is the
source. Changing the word means changing the app string and the help catalogue in the same commit
(`help-ui-labels.test.ts` fails otherwise).

## The word list

Reach for: photo, video, phone, code, scan, album, event, guest, host, link, upload, download, full
size, full length, keep, hide, approve, share, the room.

Leave alone: memories, magic, journey, experience, seamless, effortless, unforgettable, capture,
leverage, unlock, night (as identity), curate as a verb in a sentence. "Curation" survives as the
feature's name, where it is a label rather than a claim.

## What is still open

Four calls a pick does not settle. Each is an ask on the board, with its options and this guide's
recommendation; the board is where they are answered.

- **How far the winner reaches.** This guide is written as ONE voice at three volumes, which is what
  rounds one and four measured on twenty surfaces: the app's quiet lines are the same words with the
  shaping taken out. The other answer is a marketing voice and a product voice, which costs two
  guides, two sweeps and a seam at the sign-in page. Recommended: **one voice, three volumes**.

- **One noun for the thing.** The site, the app and the reel say *album*; the shipped guest pages
  say *gallery* in five places. A guest who scans a code on the site's promise and lands on a
  gallery has met two products. Recommended: **album everywhere**. It touches a component name as
  well as copy, which is why it is an ask rather than a sweep line.
- **The link preview a group chat draws.** Where an event asks for an email before a guest can add,
  the line under the title is the only warning anyone gets. Recommended: **say the email up front**.
- **Which pair of numbers the home page quotes.** The hero proposes "312 photos from 48 guests" and
  the band two sections below ships "Built from 214 photos. Shot by 23 guests." Do 3 allows one of
  those, not both. Recommended: **the demo event's real pair**, read from one source.

Two corrections land whichever card wins, because they are wrong in every voice: the create
wizard's "events never expire" (an event stays until the host deletes it; there is deliberately no
end date) and the guest door's "create a free account" (bible 4: a guest surface belongs to the
host's event, and this asks a guest to sign up with US on it).

## The sweep, in order (the `voice-infusion` round)

Gate after each step: `pnpm test` runs the em-dash AST guard and the content policy over every
surface below, and the 23 blog articles ride the same scan.

1. **[`marketing-voice.ts`](../../src/lib/constants/marketing-voice.ts) first**: the thesis, the
   subhead, the six section headers, the decomposition facts. Everything downstream is written
   against the register these set. The board's last section generates this block as a paste.
2. **[`feature-pages.ts`](../../src/lib/constants/feature-pages.ts) and
   [`marketing-nav.ts`](../../src/lib/constants/marketing-nav.ts) together**, in one commit: the nav
   mirror test pins the labels and descriptions against the six pages' identity strings.
3. **The marketing sections and pages**, a chapter at a time. `/help`, `/contact` and `/pricing` are
   the cheapest three lines with the largest effect, since two of them are the site's most generic
   sentences. The feature-page card sets are written in one length band with every number derived
   from the constants the product enforces, so a rewrite that ignores the band breaks its row.
4. **The help catalogue** (59 articles): the frontmatter `description` first, since it is the short
   answer and the meta description both, then the body. Anything inside `<UiLabel>` is a quotation
   and is not rewritten here at all.
5. **The app's inline copy**, which has no module and lives in the components: the dashboard, the
   event card's pills, the create wizard, the toasts, the errors, the notification bodies, the
   account page and every guest surface. Renaming a control is a two-file change by construction
   (do 8).
6. **The ten email templates** ([`templates.ts`](../../src/lib/email/templates.ts), subjects
   inline). Settle the subject question once for all ten: whether "Partyreel" stays in it for the
   inbox's sort, or the reader's own event leads.
7. **Legal last and lightest** (`legal-privacy.tsx`, `legal-terms.tsx`): its register is its own,
   and do 2 is the only rule here that reaches it.
