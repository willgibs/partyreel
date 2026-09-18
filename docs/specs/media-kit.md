# The media kit: killed, and every frame is generated instead

> **STATUS: KILLED** (Will, 2026-09-17, at round seven). It proposes nothing. The board went whole:
> the 36-frame call sheet, the 13 catalogues and their contact sheets, the $56 plan and the 22 staged
> stock photographs, with nothing carried forward ("delete it all, start blank"). His words are in
> [`docs/design/rulings.md`](../design/rulings.md); the manifest the site reads is
> [`src/lib/constants/marketing-media.ts`](../../src/lib/constants/marketing-media.ts); the asks it
> held are withdrawn or parked in [`docs/ASSETS.md`](../ASSETS.md); and what replaces it is a line in
> [`docs/ROADMAP.md`](../ROADMAP.md) under the major overhauls. This file is kept only until the spec
> docs of retired boards are folded and deleted together (ROADMAP, "the lab").

## Why it was killed

Seven rounds went into where our photographs could come from, and they came back with a survey of
stock: thirteen catalogues ranked by whether they hold a release, their clauses quoted, a $56 bridge,
and a shoot to replace it. Looking at that stock is what showed Will the answer sat upstream of all
of it. Stock limits the site three ways, in his words: "it's hard to find many high-quality photos
packs recognizably from the same event and licensable, for any packs we could find we're limited to
what it contains and may not fit perfectly, and we're paying a lot of money to support our visual
needs."

His answer is to generate every frame: a moodboard for one look, then each photograph made for the
slot it fills, inside one month of Higgsfield once more of the site is shaped. The shoot is off: "No
idea where this originally came from."

★ **The machinery went with it, on purpose.** The board had grown a six-fact provenance rule, a
question about whether every face in a crowd needs signed permission, and a pinned `provenance.json`.
He ruled all of it out of the agents' work: "if we're using images, it inherently means we have the
licenses to do so. Our AI chat agents do not need to track photo subjects and whether or not we had
that permission." So no agent adds a credit line, a source, a release check or a rights question to
an image. The manifest's `credit` field is gone from the type as well as from the twelve stills, so it
cannot come back with the generated set.

## What was ruled

- **`rule=no`**: no attribution on a production image, and no per-entry provenance.
- **`spend=hold`**: no Unsplash+ month and no iStock frames; the $56 bridge (ASSETS row 13) is
  withdrawn.
- **`shoot=park`**: no photo shoot; the 36-master kit it was for (ASSETS row 7) is withdrawn.
- **Crowds**: deliberately not recorded, at his instruction.

The twelve stand-ins stay on the site until the generated set replaces them, before launch. The swap
itself (each replacement keeps the id of the still it replaces, then the two recorded reels re-render)
is written where it is enforced, in the manifest's header.
