# The Partyreel voice

> ROLE: the voice guide. What Partyreel sounds like, in one paragraph and three registers, as
> sentence shapes with an example per surface, plus the procedure the infusion round rewrites by.
> BELONGS HERE: the voice, the registers, the shapes, the word list, the judging test, the sweep
> order. · NOT HERE: the lines themselves (the one home is
> [`marketing-voice.ts`](../../src/lib/constants/marketing-voice.ts)), the pages that carry them
> (→ [`../systems/marketing-content.md`](../systems/marketing-content.md)), the help authoring brief
> (→ [`../../content/help/AUTHORING.md`](../../content/help/AUTHORING.md)).
> GROWS BY: refine in place.

> **STATUS: a PROPOSAL (the `brand-voice` track, the review wave, 2026-09-14).** Bible 20 says the
> brand-voice exploration writes the do's that replace it, and bible 21 opened every line until the
> voice exists. This is that guide, written from the ground up (bible 22) and shown three ways on
> `/design/c/brand-voice`. Nothing here binds until Will rules; on his ruling the Orchestrator
> promotes it to `docs/systems/brand-voice.md` and the `voice-infusion` round carries it site-wide.
> The board holds the candidates and the four asks; this doc is the recommended answer.

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

## The three registers

One voice at three volumes (bible 2: marketing may be louder in everything but the tokens; bible 4:
a guest surface belongs to the host's event). The vocabulary never changes. What changes is how much
shaping a sentence is allowed.

### Marketing, loud

The full voice. A line may be built: two beats with a turn, a count, a verb in front. It asserts,
it addresses the host as you, and it may describe the room. This is the only register that sells.

> The album fills while the party is still going.

### The app, quiet

The same words with the shaping taken out. One clause, no turn, no metaphor, no count that is not a
real number on screen. The verb is the one written on the button the host just pressed. It says what
happened or what to do next, and then it stops. A marketing sentence inside the product is a bug
even when the sentence is better.

> Your album is ready to share.

### A guest surface, the host's

The event's name leads and ours stays out of the way. Second person to the guest, the host's
business stated plainly, and Partyreel named only where a guest genuinely needs to know whose
software this is. Never markets, never asks a guest to admire us, never treats the event page as a
door to our product. The growth loop works because the page feels like the host's.

> Add your photos and videos to Mia and Sam's wedding.

### What changes between them

| | Marketing | The app | A guest surface |
| --- | --- | --- | --- |
| Beats per line | one or two | one | one |
| Shaped sentence (a turn, a count, a verb in front) | yes | no | no |
| Who "you" is | the host | the host | the guest |
| A number | yes, if it is real | only one on screen | only one on screen |
| The name "Partyreel" | freely | rarely | almost never |
| May sell | yes | no | no |

## The sentence shapes

Five shapes. They are the do's: a line that is none of them is usually a line that has not decided
what it is about.

**1. The arrival.** A verb in the present and the album as what results. The product's one idea (a
code becoming an album) is a thing happening, so this is the default shape.

> The album fills while the party is still going.

**2. The two beats.** A noun phrase, a comma, and the turn that makes it matter. The house music:
seven of the eight ratified golden lines are built this way, and it is the shape a headline should
reach for first.

> The whole event, and it is yours to keep.

**3. The count.** A real number and what it adds up to. Only ever a number the product actually
produced, never a number about us.

> Two hundred photos you never had to ask for.

**4. The instruction.** The action in the reader's words, ending in what they get. Every step is one
the reader can picture doing.

> Scan the code, and you are in.

**5. The plain statement.** One clause, no music. The app's only shape, and the right shape anywhere
the reader wants an answer rather than a line.

> Your album is ready to share.

## Per surface

Each surface gets the rule, then the example. The shapes in brackets are the ones that belong there.

**Hero** (shapes 2, 1). The h1 is the whole product in one line and the subhead is the mechanism in
one sentence. The h1 never explains; the subhead never sells a second time.

> **The whole event, as everyone saw it.**
> One code in the room, and every phone fills the same album, live and at full size.

**Section header** (shapes 1, 2, 3). A section header is a claim the section then proves. It says
the thing the section is about, not the category it belongs to.

> The album fills while the party is still going.

**Feature card** (shape 2). A card is read in a row of cards, so it must be scannable and it must be
different from its neighbours in substance, not just in wording. One line, no verb in front (the
card's title already carries the name).

> Every phone in the room, feeding one album.

**Help article** (shapes 5, 4). The title is the reader's question in the reader's words, ideally in
the app's words. The description is the short answer, a statement written so someone could stop
reading after it. No voice-work in either: this surface is quiet even though it is marketing.

> **Can guests upload without an account?**
> Yes, when the account gate is off. With it on, a guest gives an email once and uploads from the
> same screen.

**App label** (no shape). A label is the noun or the verb the host would use for the thing, never a
sentence and never a promise. It is also a contract: the help catalogue quotes labels verbatim, so
the string here is the source of the string there.

> Waiting for review

**Email subject** (shape 5). Name what happened to the reader's own thing, in the reader's words,
front-loaded for a truncating inbox. Carry "Partyreel" only where the inbox needs it to sort.

> Your Partyreel event will be removed soon

**Error** (shape 5, then shape 4). Say what did not happen, in the app's own noun, then the one
thing to do next. Never apologise, never blame the reader, never explain the system. An error
reports a status, so the affirmative rule below does not reach it: "Couldn't" is the right first
word here and nowhere else.

> Couldn't upload that file. Try again, or pick a smaller one.

## What it never does

Folded from the two fences that are product truth
([`content-policy.test.ts`](../../src/lib/content-policy.test.ts)) and the bible's copy rules, each
stated as the do that replaces it.

**1. It never leads with an absence.** Lead with what the reader gets; an absence may be the second
beat, never the first, and never both beats. "Scan, upload, done. No app to install." is the shape:
the gain arrives, then the relief. "Nothing to install. Nothing to sign up for." is two absences and
no product. (This is bible 20 rewritten as a do, and it is a departure: see the findings below.)

**2. It never says who or what does the work.** Copy commits to outcomes, never to the hands behind
them: a reply, a review, host control, yes; a person answering, a human reviewing, an automatic
takedown, a "business day", no. Support and moderation tooling has to be able to change without
breaking published (especially legal) language. Two carve-outs are deliberate and stay: guest
attribution ("every upload has a real person behind it") and careers' "We read every application".

**3. It never borrows proof it does not have.** No "trusted by", no thousands of hosts, no
testimonials, no invented counts. A number in a line is a number the product produced. The ingress
backstop is never discussed at all, in any wording.

**4. It never uses an em-dash.** A comma, a colon, parentheses, or two sentences (bible 19, and an
AST guard over `app`, `components` and `lib` plus the MDX scan).

**5. It never calls the event a night.** "Night" is banned as identity language: a wedding, a
conference and a christening are all events, and only one of them is a night.

**6. It never sells inside the app.** A host who is already paying does not need the pitch again.

**7. It never abstracts.** The banned nouns are the ones that could belong to any product: memories,
moments (in the plural abstract), magic, journeys, experiences, seamless, effortless, unforgettable.
"Moment" survives where it names a real thing on screen, which is why the ratified "Every moment,
and you decide what stays." is legal: that moment is a photo.

**8. It never renames a control in prose.** If a line quotes an app control, the control is the
source. Changing the word means changing the app string, and the help catalogue in the same commit.

## The word list

Reach for: photo, video, phone, code, scan, album, event, guest, host, link, upload, download, full
size, full length, keep, hide, approve, share, the room.

Leave alone: memories, magic, journey, experience, seamless, effortless, unforgettable, capture,
leverage, unlock, night (as identity), curate as a verb in a sentence. "Curation" survives as the
feature's name, where it is a label rather than a claim.

## The rewrite procedure (for the `voice-infusion` round)

### How a line is judged

Four questions, in order. The first failure is the rewrite.

1. **Could a competitor ship it?** A line a shared folder, a camera roll or a group chat could also
   say is not ours yet. ("Your event stays yours." fails here: it is true of every product with a
   privacy setting.)
2. **Is it about an arrival?** If the sentence describes a finished state, check whether the live
   version is truer. The product's magic is the during, not the after.
3. **Does it lead with what arrives?** If the first beat is an absence, swap the halves.
4. **Read it aloud.** One breath, or cut it.

### What a rewrite keeps

- **The fact.** A rewrite changes the sentence, never the claim. A new claim is a product question
  before it is a copy question.
- **The control's name.** A quoted app string moves only by renaming the control.
- **The length band.** `navDescription` sits at roughly 45 characters and `directoryLine` in one
  band, because the mega-panel and the six hub doors wrap against them; the registry test holds it.
- **The anchor.** A heading that is a link target keeps its id, or every link to it changes in the
  same commit.
- **The register.** A better marketing sentence moved into the app is still a regression.

### The sweep, in order

1. **[`marketing-voice.ts`](../../src/lib/constants/marketing-voice.ts) first**: the thesis, the
   subhead, the seven home headers, the decomposition facts. Everything downstream is written
   against the register these set, so they move before anything quotes them.
2. **[`feature-pages.ts`](../../src/lib/constants/feature-pages.ts) and
   [`marketing-nav.ts`](../../src/lib/constants/marketing-nav.ts) together**, in one commit: the nav
   mirror test pins the 44 labels and 15 descriptions against the six pages' identity strings, so
   the pair cannot move separately.
3. **The marketing sections and pages**, chapter by chapter, a page at a time.
4. **The help catalogue** (59 articles, 2,959 lines): the frontmatter `description` first, since it
   is the short answer and the meta description both, then the body. Anything inside `<UiLabel>` is
   a quotation and is not rewritten here at all.
5. **The app's inline copy**, which has no module and lives in the components. Renaming a control is
   a two-file change by construction: `help-ui-labels.test.ts` requires every `<UiLabel>` string the
   help centre quotes to exist in the app source, so the app string and the quoting article move in
   the same commit or the gate fails.
6. **The ten email templates** ([`templates.ts`](../../src/lib/email/templates.ts), subjects inline).
7. **Legal last and lightest** (`legal-privacy.tsx`, `legal-terms.tsx`, 1,366 lines): its register is
   its own, and fence 2 above is the only rule from this guide that reaches it.
8. **Gate after each step.** `pnpm test` runs the em-dash AST guard and the content policy over
   every surface listed here; the 23 blog articles ride the same scan.

## The findings (ruled by Will)

**1. Bible 20, as written, blocks a ruled line.** "Say who we are, never who we are not" reads on
"Scan, upload, done. No app to install." (ruled, 2026-08-25) and on the whole no-app argument, which
is the product's sharpest differentiator. The rule's original target was a fenced use case, which is
a host told to leave; an absence that IS the feature is a different thing. This guide proposes the
sharper form as rule 20's replacement: **lead with what arrives; an absence may be the second beat,
never the first, and never both.** It keeps the ruled line and kills the doubled-absence one.

**2. Candidate C questions the ruled thesis.** `SITE_THESIS` is "The whole event, in one album."
(ruled 2026-08-25). An album is a container anyone can offer; the thing only Partyreel produces is
the same event from every camera in the room. C proposes **"The whole event, as everyone saw it."**,
keeping Will's cadence and swapping the container for the perspective. Flagged on the board's
BoardMeta, not folded into the guide.

**3. The "five copy-alternative picks" have lost their list.** The queue item predates the docs
consolidation and no list survives in the repo. The board reads it as the five provisional headers
that carry an appetite for a DIFFERENT line (`liveDemo`, `album`, `curation`, `privacy`, `reel`),
alongside `noApp` and `fullQuality`, which are Will's own lines pending a ruling. That is the seven
the board rewrites. If the referent was something else, the Orchestrator corrects it and the board
adds the missing picks.

## If Will picks a different candidate

The board shows three voices. This guide is written as **the room** (candidate B). What changes:

- **The house (A)** keeps shape 2 as the default instead of shape 1, drops "the room" from the word
  list, and reverts the paragraph's centre from the during to the after. The registers, the fences,
  the word list and the whole sweep procedure are unchanged.
- **The guest list (C)** makes the subject of a marketing line a person rather than a thing wherever
  the claim is multi-perspective, adds "everyone" and "angles" to the word list, and carries finding
  2 into `marketing-voice.ts` as a thesis change. The app and guest registers are unchanged: C is a
  marketing-register argument.

Under every candidate, the three registers, "What it never does", the word list and the rewrite
procedure stand as written. Only the marketing register's default shape moves.
