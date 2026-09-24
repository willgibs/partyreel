---
track: brand-kit
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5691d3b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - kit/README.md
  - kit/logo/
  - kit/screens/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/theme.css
  - src/app/globals.css
---

# lp/brand-kit

**Goal.** A root kit/ folder any outside agent can use to match Partyreel: a short README pointing to partyreel.com, the logo files (SVG and PNG, light and dark), the type, the brand colors in hex, and three desktop screenshots, all true to production.

## The brief

**Will's ask (2026-09-24, verbatim):** "We should also create root level 'kit' folder that works as a hand off-able brand kit for outside agents. It would be managed/updated by you in our repo, but I'd be able to duplicate it and use a copy for outside agent work around Partyreel." An outside agent making a Partyreel intro video went off brand and asked for: "Logo files (wordmark and any symbol as SVG or transparent PNG, including a version that works on the dark background)"; "font files, or at least the family names and weights your site uses for headlines, body text, and buttons"; "Hex values for the background, text, accent, and button fill, so nothing is my guess"; "Desktop captures of the hero, the live album demo, and the pricing section would let me match button shapes, corner radii, and spacing". And: "Ideally, I'd simply point to partyreel.com for all required info, then offer this kit folder to match our identity in generated assets. If you'd like to maintain some sort of readme intro to make the info transfer more direct (while remaining broad enough for any Partyreel task) that may also be helpful." Marketing photos stay out: "we shouldn't push duplicate media to the repo".

**Build `kit/`:**
- **`kit/README.md`:** short and broad, written for an agent that has never seen our repo.
  - What Partyreel is, in a paragraph; partyreel.com as the living reference.
  - The look in a few lines: achromatic, one accent, the media is the color, premium and calm.
  - The logo files and when to use each.
  - The type: families, weights, and what each is for (headlines, body, buttons), with the Google Fonts links.
  - The colors, as hex values for background, text, accent and button fill, in light and dark.
  - Radius and spacing in a line or two.
  - The screenshots.
  - Where each fact comes from in the repo (tokens in `src/app/theme.css`, the logo component), so updating the kit is mechanical.
- **`kit/logo/`:** the wordmark, and the symbol if one exists, as SVG, plus transparent PNG exports at a useful size. Include a version for dark backgrounds. Derive them from the product's real logo source; never redraw them.
- **`kit/screens/`:** desktop captures of partyreel.com's hero, live album demo and pricing section at 1440 wide, compressed (JPEG or WebP, a few hundred KB each at most).

No marketing photographs and no font files (the families are free on Google Fonts). Everything must be true to production today.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
