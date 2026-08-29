# Writing a Partyreel blog post

> The content agent's brief for `content/blog/*.mdx`. Its sibling is
> [`../help/AUTHORING.md`](../help/AUTHORING.md), which covers the help center; the two collections
> share one pipeline (ADR-0006) but not one voice. Help answers a question. The blog has a point of
> view.

## Frontmatter

Every field is validated at BUILD time by `blogFrontmatterSchema`
(`src/lib/content/blog.ts`). A bad value fails `pnpm build`, it does not degrade at runtime.

```yaml
---
title: How to set up a wedding photo QR your guests will actually use
description: A few small choices decide whether you get a full album or an empty one.
date: "2026-05-26"
author: partyreel-team
cover: reception-table
tags:
  - weddings
  - how-to
---
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | **45-75 characters, hard cap 80** (the build fails past it). This is a layout contract: the featured card sets the newest title at display size and reads best at about three full lines, and library cards read best at two. Both clamp, so a longer title ships visibly cut rather than breaking the grid. Front-load the specific words; the card gives you no subtitle. |
| `description` | yes | Max 160 characters. ★ It is not just metadata: it renders as the **visible standfirst** under the article's title, and as the card blurb on the index. Write it as the line that makes someone read the piece, in the same voice as the body. |
| `date` | yes | `YYYY-MM-DD`, quoted. Drives sort order, the byline, and RSS `pubDate`. Newest post becomes the staged hero on `/blog`. |
| `author` | no | Leave it out. `partyreel-team` is the universal byline for now (Will's ruling, 2026-08-28) and it is the only registered id, so the default is always correct. Named authors are a registry change in `src/lib/content/authors.ts`, not a frontmatter choice. |
| `cover` | **no, but prefer it** | A media id from `MARKETING_IMAGES` (`src/lib/constants/marketing-media.ts`). See below. |
| `tags` | no | Freeform, lowercase, hyphenated. They drive the index's filter rail. |
| `updated` | no | `YYYY-MM-DD`. Sets `dateModified` in the Article JSON-LD. |
| `draft` | no | `true` keeps the post out of the listing, the sitemap, and the feed. |

## Covers

`/blog` is media-forward: the cover IS the card, and the newest post's cover fills a letterbox hero.
So every post has one whether or not you pick it.

- **Omit `cover`** and one is derived from the slug (`coverFor`, `src/lib/content/blog-covers.ts`).
  It is stable forever: publishing new posts never changes an existing post's art.
- **Set `cover`** to art-direct. The value must be an id from the marketing media manifest, which is
  the only sanctioned way to reference anything under `public/marketing/`. Run
  `grep 'id:' src/lib/constants/marketing-media.ts` for the current list.

★ **Prefer setting it.** The fallback pool is ~11 images, so on a short blog two posts can draw the
same photograph. The crop is slug-derived and differs, but the hero is large and a repeat next to it
is visible. Pick a cover whose subject actually matches the post: the manifest records an honest
`subject` line for every image, and a confetti shot on a piece about group chats is a false caption.

A `cover` that is not a manifest id fails the build with a message naming the offending value.

## Writing rules

- **No em-dashes.** Enforced by a test over all of `content/`. Recast with a comma, a colon,
  parentheses, or two sentences.
- **Commit to outcomes, never to who or what delivers them** (the promise-neutralization doctrine,
  `docs/systems/marketing-content.md`). Say that a note gets a reply, that a report gets reviewed,
  that the host stays in control. Never name the actor behind any of it, and never promise a
  turnaround in desk hours, so the tooling can evolve without breaking published language. The
  standard reply line is single-sourced: copy it from an existing page rather than paraphrasing.
  A phrase-list fence (`src/lib/content-policy.test.ts`) scans this file too, so a violation fails
  the build and the failure message quotes the offending line back to you.
- **Numbers come from the product, not from memory.** The MDX components that read the real
  `limits.ts` / `tiers.ts` single sources are listed in `src/components/marketing/mdx-components.tsx`
  (`Callout`, `Steps`/`Step`, `Kbd`, `UiLabel`, and the inline spec components). Use those rather
  than typing a figure that can drift.
- **How-tos must track shipped reality.** Only marketing pages present the product as-if-complete.
  If a post describes a flow, the flow has to exist today.
- Headings are `##`/`###`. `#` is never used: the page renders the `title` as the h1.
