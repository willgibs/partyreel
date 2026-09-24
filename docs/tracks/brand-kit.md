---
track: brand-kit
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **q1 "the pricing section" = which page?** The brief names hero, live album demo and
  pricing as three homepage-narrative sections, but pricing also has its own dedicated
  `/pricing` route with fuller cards. Took: the `/pricing` page's fold (both plan cards,
  the monthly/yearly toggle, both CTA buttons), not the homepage's compact dark
  `pricing-teaser` section, because it's the literal richer surface for the outside ask
  ("match button shapes, corner radii, and spacing"). His to overrule: swap the capture to
  the homepage's `pricing-teaser` section instead if he wants all three shots from the same
  page/surface.
- **q2 does "the symbol" belong in the kit yet?** `src/components/shared/logo.tsx` calls
  the Aperture glyph behind its `markOnly` prop "a STAND-IN... nothing in production mounts
  it" (the real v1 icon hasn't landed). But the identical glyph independently IS live
  production today as the actual favicon, apple-touch-icon and PWA home-screen icon
  (`src/app/icon.svg`, `public/icons/`, `manifest.ts`: "the icons are the ink aperture
  mark"). Took: include it in `kit/logo/` (copied from the existing `public/press/`
  exports, never redrawn), described as the current favicon/app icon and explicitly NOT a
  lockup partner for the wordmark (the product never pairs them). His to overrule: pull the
  symbol from the kit and ship wordmark-only until the real v1 icon replaces the stand-in.

## System-doc edits (in place, owned facts only)

- none (no `docs/systems/` doc is in this track's `owns`)

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** when Will's real v1 icon lands (replacing the Aperture stand-in per
  `logo.tsx`), regenerate `kit/logo/`'s three symbol files from it and re-derive
  `kit/README.md`'s symbol row and usage note.

## Handoff (replaces the chat report)

- Work commit `d8dc21e4` (the 14 `kit/` files); sync commit `ad2c3a85` (merge
  `origin/launch-prep`, no conflicts — brought in `bible-ten`/`docs-sharpen`/`library-lean`;
  diffed the touched `reads` files first, comment/citation renumbering only, no token
  values changed); both pushed on `lp/brand-kit`. This manifest commit is on top; its head
  is in the chat line.
- Gates on the synced tree, each its own exit code, all 0: `pnpm design:rules` (no diff —
  `rules.generated.json`/`docs/design/library.md` regenerated identical to the merged
  state), `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` (no diff),
  `pnpm typecheck`, `pnpm lint` (0 errors, 8 pre-existing warnings, none in a file this
  track touched), `pnpm test` (434 test files, 4781 passed + 1 skipped), `pnpm build`,
  `pnpm lab:smoke --base http://localhost:3133` (488 checks, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 14 files under
  `kit/README.md` + `kit/logo/` + `kit/screens/` (this track's whole `owns`), plus this
  manifest file on the handoff commit. Nothing else.
- The items, one line each:
  - `kit/README.md`: what Partyreel is, the achromatic look, the logo files and when to
    use each, type (families/weights/Google Fonts links), color hex (light+dark), radius
    and spacing, the screenshots, and a "where this comes from" section for whoever
    updates the kit next.
  - `kit/logo/`: the real v1 wordmark baked into standalone ink + white SVG/PNG
    (`src/lib/brand/wordmark.ts`'s own path, 2464x512, never retyped), and the circular
    aperture symbol in ink/white/mono SVG/PNG (copied byte-for-byte from the existing
    `public/press/` exports — the same files the live favicon and PWA icons use).
  - `kit/screens/`: three JPEGs at 1440px wide off a local production build (hero,
    the live-demo section fully filled, the `/pricing` page's two plan cards), 49 to 87 KB
    each.
- Assets requested from Will: none. Everything is derived from what's already in the repo
  and already live in production; no new drawing or asset work was needed.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each: q1 (pricing page vs. homepage teaser); q2 (ship the
  Aperture symbol now, labeled as the current favicon, vs. wordmark-only until v1 lands).
- Look at first: `kit/README.md` end to end, then `kit/logo/partyreel-wordmark-dark.png`
  and `kit/logo/partyreel-mark-dark.png` (the two real marks), then
  `kit/screens/partyreel-pricing.jpg` (the richest of the three captures). There is no live
  page for this track (board: none) — the kit's files are the surface to review, not a URL.
