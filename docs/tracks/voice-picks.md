---
track: voice-picks
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7534d02f"         # the launch-prep SHA the branch was cut from
board: brand-voice      # the three answers the voice never decided; the board itself is retired separately
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/marketing-voice.ts
  - src/components/guest/
  - src/app/(guest)/
  - src/components/marketing/sections/home/decomposition.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/events/gallery-access.ts
  - docs/reviews/brand-voice.json
---

# lp/voice-picks

**Goal.** Will killed the `brand-voice` exploration unruled, but he answered three questions inside it
that a voice never decided, and under the wind-down rule a pick becomes a working version the day he
makes it. This lane ships exactly those three and nothing else. **Not in this round:** the board's
deletion (the Orchestrator does that separately, and you must not touch
`src/app/(dev)/design/sandbox/brand-voice/`), any voice, any new copy beyond what these three answers
require, and any of the 510 candidate lines, which he chose to keep none of.

**Binds.** The bible, the contracts of every component under a path you own, and the policies. His
three answers are in `docs/reviews/brand-voice.json` round 7 and his words are in
`docs/design/rulings.md` under the 2026-09-17 section that kills the board. ★ **No em-dashes in
user-facing copy** (`no-em-dash-policy.test.ts`), and the guest pages stay the host's event with
minimal Partyreel branding.

## The three picks

### 1. `noun=album`: one word for the thing, everywhere

The site, the app and the reel say album. The shipped guest pages say gallery. A guest who becomes a
host meets both words, which teaches a vocabulary badly. His pick was the option labelled "Album,
everywhere", whose own scope is **the guest-facing strings and one component name**.

★ **The CODE noun does not move.** `/api/guests/gallery`, `src/lib/events/gallery-access*`, the
`gallery-*` lib files, the RPCs and the DB columns keep their names. Renaming a live API route buys a
guest nothing and risks the guest path, which is the one flow with no account behind it. This is a
COPY change plus at most one component rename.

The user-facing strings found so far, which you should confirm and complete rather than trust:
`src/components/guest/entry-modal.tsx` (about six, including "A shared gallery for the whole event.",
"Create a free account to see the full gallery and add your own photos.", "Everyone's shots land in
one gallery, yours included.", "View the gallery" and two "Opening the gallery") and
`src/components/guest/password-gate.tsx` (two). Sweep for any you missed, including `aria-label`s,
empty states, toasts and error copy under your owned paths. Rename `live-gallery.tsx` if the component
name reads to a call site as the guest's word; leave it if renaming reaches outside your paths.

### 2. `unfurl=join`: a pasted link invites, it does not warn

The question was what a group chat shows when a host pastes the event link, and the preview card's
line is drawn from the page's own `description` meta tag. He overruled the recommendation. The board's
copy for his pick is "Photos and videos from the day. Add yours."

★ He chose this **with the cost in front of him**: the option's own text said "More taps, and a share
of them bounce at the email step", because an event that requires a verified email still gates the
guest after the tap. Do not re-litigate it and do not hedge the copy back toward a warning. Record the
tradeoff in a comment at the meta tag so the next reader knows it was chosen, not missed.

### 3. `counts=hero`: the bigger pair, on one line, with the closing line under it

`DECOMPOSITION_FACTS` in `src/lib/constants/marketing-voice.ts` currently ships three facts that
`decomposition.tsx` renders as a baseline row: "Built from 214 photos." / "Shot by 23 guests." /
"Created for you." He took the bigger pair, **312 photos and 48 guests**, and gave the layout himself:

> "I think it'd be nice to make that the first line, then stacked center under, 'Created for you.'"

So: the counts become the FIRST line, and "Created for you." sits centred beneath it. His pick carries
no honesty problem, and this is his own correction of the board's premise, recorded verbatim in the
rulings: the band is "paired with a demo video, not the demo event", so the numbers read as an example
reel from a conceptual event rather than a claim about the public demo, whose content is replaced
before launch anyway.

★ **What must survive the reshape**, because it is easy to break and hard to notice:
- The number-pop-in grammar (`data-mkt-digits` / `data-mkt-digit`, `--i`, the 5-slot lead-in and
  4-slot step at the top of `decomposition.tsx`). The digits blur-rise staggered; CSS owns the
  reduced-motion fallback.
- `splitFact()` parses the number out of each string, so whatever shape the first line takes must
  still parse, or add the parsing the new shape needs. Two numbers on one line is a new case.
- **The server HTML carries the TRUE numbers** (the StatBand content-first contract), so no-JS and
  reduced motion read them immediately instead of a zero that never ticks. Verify with JS disabled.
- `home-sections.test.ts` pins parseability. Keep it honest rather than loosening it.

**Verify on.** A real guest link at 375 and 1440 (the entry modal, the password gate, the empty
state): the word is album everywhere a guest reads, and nothing in the code path was renamed. A pasted
event link's preview card, checked by reading the rendered `description` meta tag on an event page
that requires an email and one that does not. The home page's decomposition band: the counts on one
line, "Created for you." centred under it, the digits still popping in, the true numbers present in
the server HTML with JS off, and the band correct with reduced motion on.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The unfurl line: this manifest names one line, the board showed him another.** This file said the
  board's copy for `join` is "Photos and videos from the day. Add yours." That string is `UNFURL.open` in
  `voices.ts`, and the board **never renders it** (only `UNFURL.title` is used). What the stage actually drew
  under the `join` option is `UNFURL_LINE.join` in `board.tsx:999` = **"Add your photos to the album."** So he
  chose a STANCE (invite, don't warn) while looking at a different sentence than the one I was told to ship.
  **Recommended, and what shipped: the manifest's line.** Against the real title, which is "Add photos to
  {event name}" and not the board's bare event name, "Add your photos to the album." repeats the title's verb
  in the same card; "Photos and videos from the day. Add yours." says what is inside and then invites, and it
  carries video, which half the promise is. It is one string in one file if he wants the line he saw.
- **The component name was left as `LiveGallery`, so the pick shipped 17 strings and 0 renames.** The board's
  option said "the five guest strings and one component name". Renaming `live-gallery.tsx` reaches OUTSIDE my
  paths and the manifest's own rule then says leave it: `src/components/marketing/mock-parity.test.ts:63`
  holds `"src/components/guest/live-gallery.tsx"` as a load-bearing `appFile` (the test READS that path, so a
  rename is a red suite), plus comments in `src/components/marketing/sections/features/album/album-fill-fixtures.ts:7`
  and `src/app/(dev)/design/sandbox/album-hero/album.tsx:47`. Renaming the SYMBOL alone stays in lane but
  leaves `live-gallery.tsx` exporting `LiveAlbum`, which reads worse to the next agent than the honest
  mismatch. **Recommended:** leave it, or do file + `LiveGallery` + `LiveGalleryHandle` + those three
  references in one follow-up; `GalleryPayload` stays either way (it names the `/api/guests/gallery` payload,
  which is the code noun). A guest never sees a component name, so nothing user-facing is waiting on this.
- **Three surfaces outside my lane still say "gallery" while QUOTING guest copy that no longer does.** The
  house rule in `mock-parity.test.ts` is that a marketing mock quotes the app verbatim and both move in one
  commit; these literals are not pinned, so nothing went red, which is exactly how they strand:
  `src/components/marketing/sections/features/qr/entry-flow.tsx:63,81` ("View the gallery", "Everyone's shots
  land in one gallery, yours included.") and `.../features/album/entry-phone.tsx:118` ("Everyone's shots land
  in one gallery. 18 are already inside."). A second pair describes the guest's view from the host side:
  `src/components/app/event-settings/uploads-section.tsx:225` and its marketing quote in
  `.../features/privacy/never-rides-along.tsx:107` ("see the full gallery and add photos").
  **Recommended:** sweep the first pair in the merge or a one-file follow-up (it is a fidelity bug the moment
  this lands) and add both literals to `mock-parity.test.ts` so it can never drift silently again; the host
  helper pair is a judgement call about the HOST's vocabulary, which `noun=album` did not rule on. The lab's
  `rounding` board (`screens.tsx:396`, `specimens.tsx:318`) and the help/blog PROSE are deliberately untouched;
  the blog's "gallery" is mostly a photographer's client gallery, where the contrast IS the point.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, "What it does": a new ★ paragraph fixing the noun split as deliberate (the
  guest reads album, the code says gallery, neither gets "fixed" into the other). Without it the next agent
  reads the mismatch as a bug and renames a live route.
- `docs/systems/guest-flow.md`, the `open` bullet: the OG-description fact replaced in place. It said the
  description keys on `allow_anonymous_uploads`; it is now one invitation for every open event, with his
  ruling and the cost he accepted, and a do-not-hedge line.
- `docs/systems/guest-flow.md`, the welcome bullet: the entry modal's primary is "View the album".

## Deferred (ROADMAP one-liners, bucket named)

- **Now** — With JS disabled the decomposition band is invisible, and so is every other `[data-mkt-reveal]`
  on the marketing site: `marketing.css:71` sets `opacity: 0` inside `@media (prefers-reduced-motion:
  no-preference)` and only `[data-inview="true"]` (set by JS) clears it, with no `@media (scripting: none)`
  fallback. Pre-existing and site-wide, NOT introduced here, and the band's own contract still holds (the
  server HTML carries 312 and 48, verified, so nothing renders a zero that never ticks). One CSS block fixes
  the whole site.
- **Now** — `src/components/marketing/sections/features/privacy/access-switch.tsx:42` says its 214-photo
  fixture matches "the ruled decomposition fact 'Built from 214 photos.'" That fact is gone. The fixture
  (Maya & Jay's Wedding, 214 photos) is a different fictional event and can stay; the cross-reference cannot.
- **Strike, don't defer** — `docs/ROADMAP.md:100` still lists "the open-event unfurl promises 'no account'
  when the event requires one" as an open gap, and the launch-truth item at `:253` and `:352` reads "the guest
  unfurl and 404 true for account-required events (the `product-truth` track)". The unfurl half is now
  SUPERSEDED by `unfurl=join`: it promises nothing about accounts and deliberately does not warn. The 404
  half stands. A `product-truth` agent reading those lines would undo his ruling.

## Handoff (replaces the chat report)

- Head `26a4cbd4` (the work) + this handoff commit, pushed; synced with `launch-prep` at `6f256381` (it had
  moved from the `7534d02f` I was cut at; the rebase was clean, its two files were docs I never touched).
- Gates on the synced tree, each step's own exit code: **typecheck ok**, **lint ok** (0 errors, the 9
  expected warnings), **test ok (2164 in 234 files)**, **build ok (64 routes, 256 static pages)**. No
  contract or `for` line was touched, so `design:rules` was not run.
- Lane check: 17 files = 13 owned (`marketing-voice.ts`, `decomposition.tsx`, all of `src/components/guest/`,
  `src/app/(guest)/e/[token]/page.tsx`) + 4 exceptions, each forced and each minimal:
  - `home-sections.test.ts` — named in my own brief ("keep it honest rather than loosening it").
  - `content/help/{turn-off-uploads-or-cap-file-size,how-guests-join-and-upload,show-the-album-live-on-a-screen}.mdx`
    — one word each, inside `<UiLabel>`. `help-ui-labels.test.ts` pins every UiLabel to a VERBATIM shipped
    app string and the first went RED on the uploads-closed line, so the gate could not be green without it.
    The other two ("View the gallery") were only still passing by matching the stale marketing mock in
    `features/qr/entry-flow.tsx`; fixing them now avoids arming that test for whoever sweeps the mocks.
  - `docs/systems/guest-flow.md` — the three in-place edits listed above.
- **`noun=album`** — 17 guest strings, not the board's five (I swept rather than trusted): entry-modal.tsx
  (9: the sr description ×3, the stalled-hold sentence + its button, the slow-hold line, the two "one album"
  count rows, the "View the album" primary), password-gate.tsx (4: the private-album sentence, "Open the
  album", the stalled sentence, "Opening the album"), enter-event-prompt.tsx ("To keep this album just for
  guests…"), guest-upload.tsx ("…before they appear in the album."), save-account-prompt.tsx ("…come back to
  the album…"), event-experience.tsx ("…still browse the album."), plus the three test files that assert on
  them. No `aria-label` used the word. Verified by curling all three live event pages: the only "galler" left
  in a guest payload is the `galleryPromise` PROP NAME.
- **`unfurl=join`** — the exact copy, now unconditional on `description`, `og:description` and
  `twitter:description`: **"Photos and videos from the day. Add yours."** Verified live on an event that
  requires an email (Test Wedding, `allow_anonymous_uploads=false`) and one that does not, and a `password`
  event still emits no description at all (that is the redaction rule, not this pick). The title is untouched.
  ★ See the first Question: this line is the one my brief named, not the one the board's stage drew.
- **`counts=hero`** — what `splitFact` had to learn: it took the FIRST integer and swallowed the rest as
  trailing text, which would have popped 312 in and left 48 sitting dead beside it. It now splits a fact on
  its digit runs into text parts and number parts, so every count animates and the parts re-join to the
  constant byte-for-byte. The stagger steps per NUMBER instead of per fact, which is what keeps the shipped
  cadence across the new line break: server HTML shows `--i` 5/6/7 on 312 and 9/10 on 48, exactly the slots
  the old two facts held. The reveal beats are pinned (0 for the counts line, 2 for "Created for you.", 4 for
  the closing sentence) so the band reads at the tempo it shipped with.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No DB writes: I read the events table to
  pick test links and changed nothing, including the Demo.
- Look at first: **the three Questions, in order.** The unfurl line is the only one where what shipped may not
  be what he pictured, and it is a one-string change. Then the two marketing mocks, which are stale copy the
  moment this merges.
- Verified: home band at 1440 and 375 (the counts hold ONE line at 375, 265px wide in a 375 viewport), the
  true numbers in the server HTML with the digit groups un-fired (`data-on="false"`), the reduced-motion path
  exercised by forcing `animation: none` and re-firing the band with Replay (digits stay opaque on 312 and
  48, nothing blanks), and the guest entry sheet + account step on two real test events at both sizes. NOT
  forced live: the password gate and the uploads-closed line (no password event exists in the test data and
  minting one means hand-writing a hash); both are one-word swaps covered by their own unit tests.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). Will killed the `brand-voice` exploration unruled but
answered three questions inside it, and under the wind-down rule each became a working version the day he
made it. The guest's phone stopped saying gallery: 17 strings across the entry modal, both gates, the upload
notice, the save prompt and the uploads-closed line now say album, while the API route, the RPCs and
`LiveGallery` deliberately kept their names, and `guest-flow.md` now fixes that split as intentional so
nobody "fixes" it into a route rename. A pasted event link stopped warning: the description meta tag no
longer forks on `allow_anonymous_uploads` and reads "Photos and videos from the day. Add yours." for every
open event, the trade he took with its cost quoted at the tag. And the decomposition band took his own
layout, 312 photos from 48 guests on the first line with "Created for you." centred under it, which meant
teaching `splitFact` that one line can hold two numbers and stepping the digit stagger per number so the
shipped cadence survived the break.
