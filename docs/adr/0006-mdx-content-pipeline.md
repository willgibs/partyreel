# ADR-0006 — In-repo MDX content pipeline (help center, reused by blog)

- **Status:** Accepted (2026-05-31)
- **Phase:** Marketing build-out (Round 6 — Help center; reused by Round 7 — Blog)

## Context

The help center needs a dozen-plus long-form articles, and the blog will need posts —
first-party content that should read rich (callouts, embedded visuals, live limit
numbers), be queryable as a collection (list by category, search, render one), and carry
a contract strong enough that a malformed article can't ship silently. We did not want a
CMS for a small, curated, engineering-authored knowledge base.

## Decision

- **Store content in-repo as `content/**/*.mdx`.** Versioned with the code, reviewed in
  PRs, no external service. **MDX** (not plain markdown) so articles can embed first-party
  React components (`Callout`, `AlbumShowcase`, inline spec components) for home-level
  richness rather than a flat docs dump.
- **Two libraries, two jobs.** `gray-matter` parses + lists frontmatter **cheaply, with no
  MDX compile** — that feeds the index, search, sitemap, and related-articles.
  `next-mdx-remote/rsc` (`compileMDX`) renders one article's body inside a Server
  Component. Chosen over `@next/mdx` (file-as-route), which can't list/filter a collection
  by frontmatter.
- **Build-time validation.** The loader runs `helpFrontmatterSchema.parse()` (zod) on every
  file, so a bad/missing field **fails the build** — a loud data-integrity net, backed by a
  Vitest test (unique slugs, ≤160-char descriptions, every category populated).
- **Keep JS blocked (defense-in-depth).** next-mdx-remote v6 defaults `blockJS: true`,
  which strips raw `{expressions}` while **preserving JSX components**. Dynamic numbers
  (storage caps, file limits) come from spec components that read the `tiers.ts` /
  `limits.ts` single sources — never hard-coded, never via `{expressions}`. Articles are
  first-party and build-compiled, but we still keep raw JS out. (We would **not** MDX
  untrusted input.)
- **Self-consistent heading anchors.** One in-repo `slugify` powers both the MDX `h2`/`h3`
  `id`s and `extractHeadings` (the on-this-page TOC), so links and ids can't drift — no
  `rehype-slug` / external slugger.
- **Prose styling inherits the design system.** `@tailwindcss/typography` (enabled via the
  Tailwind v4 `@plugin` directive) + a `prose-help` utility whose colors point at design
  tokens (`--foreground` / `--brand` / `--border` …). Because those tokens flip under
  `.dark`, the prose adapts to dark mode automatically — no `prose-invert`.

## Consequences

- Publishing = add an `.mdx` file with frontmatter; the index, search, and sitemap pick it
  up with no other wiring. The trade-off is that publishing requires a deploy (no
  non-engineer CMS) — acceptable for a curated help center; revisit if that changes.
- The loader reads `node:fs`, so it is server/build-only **by construction**. The client
  search component receives plain metadata via props and uses `import type` for the shared
  types, keeping `fs` out of the client bundle.
- **Round 7 (Blog) reuses this pipeline** — a `content/blog` collection beside `content/help`
  plus an RSS feed — so the infrastructure cost is amortized across two rounds.
