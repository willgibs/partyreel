---
track: voice-picks
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b3291f81"         # the launch-prep SHA the branch was cut from
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: typecheck ok, lint ok, test ok (N), build ok (M routes)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- One line per pick; every guest string changed; the exact meta tag copy; what `splitFact` had to learn
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
