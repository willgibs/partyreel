# The brand voice: retired unruled, and what shipped from it anyway

> **STATUS: RETIRED UNRULED** (Will, 2026-09-17, at round seven). Not a proposal any more, and it
> proposes nothing: the six voices and their 510 lines were deleted with the board at his instruction
> ("delete it all, start blank"). The voice is being rebuilt on the `voice` board, one real line in
> its real place at a time. His words are in [`docs/design/rulings.md`](../design/rulings.md), the
> copy that ships is `src/lib/constants/marketing-voice.ts`, and this file is kept only until the
> spec docs of retired boards are folded and deleted together (ROADMAP, "the lab").

## Why it was killed

It reached **round seven with no review ever recorded**. `docs/reviews/brand-voice.json` was never
once written, and in that time the board grew to six voices, 24 spots, 85 slot rows, 510 strings and
4,121 lines. Will's own diagnosis, verbatim:

> "feels like the agent worked too hard trying to generate multiple unique voices rather one that's
> perfect, then we kept running in through unreviewed rounds to dig deeper into each without shaping
> along the way. Now we have a massive amount of ideas, but it feels like the best version would've
> been a mesh of examples from multiple voices at different points (today's, keepsake, live, plain)
> rather than forcing each to have a very specific tone so it felt differentiated for the sake of the
> exploration."

★ **The mechanism, for anyone building a catalog.** The board's own contract made any two voices that
AGREED on a line owe a written excuse (`tally().unexplained === 0`). A rule that penalises agreement
is a rule that pays for difference, so its author separated them. That is the whole post-mortem, and
it is now two rules in `docs/PROGRAM.md`: a board past round 1 with no ledger fails
`registry.test.ts`, and **options are never forced apart**.

## What shipped from it

The three calls a voice never had to make, answered in the same paste that killed the board and
wired by `voice-picks` (`2735ad92`):

- **`noun=album`.** One word for the thing a guest is looking at, on every surface a guest reads: 17
  strings, not the five the board counted. ★ The CODE noun deliberately did not move with it
  (`/api/guests/gallery`, `gallery-access*`, `LiveGallery`, the RPCs and the columns). That split is
  recorded in [`docs/systems/guest-flow.md`](../systems/guest-flow.md); do not "fix" it either way.
- **`unfurl=join`.** A pasted event link shows one invitation for every open event rather than
  forking on `allow_anonymous_uploads` to announce the email step. He took the cost knowingly: "more
  taps, and a share of them bounce at the email step."
- **`counts=hero`.** The bigger pair, 312 and 48, as the first line with "Created for you." centred
  under it, which is his own layout. He corrected the board's premise while answering: the band below
  the hero is "paired with a demo video, not the demo event", so it claims nothing about the demo.

## What the next board inherits

Nothing of the copy, by his instruction. What it inherits is the FORM, which he specified himself
after raising and then withdrawing a two-draft idea of his own:

> "The better strategy would likely be to give me tighter comparisons of copy in real cases, one at a
> time, and use my winning selections to build the brand voice, rather than presenting two options."

and the constraint that survived from the idea he withdrew:

> "Starting with just a few spot example statements may make a voice sound good in a silo, but not
> perform well in actual usage. I'd rather shape it as we see the voice applied in real cases."

Bible 20 and 21 point at `voice` now. Round 1's first ask is the question that outlived this board:
whether bible 20's "say who we are, never who we are not" rules the NAMING or the SHAPE of a
sentence.
