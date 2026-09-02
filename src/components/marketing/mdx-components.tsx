import { composeMdxComponents } from "./mdx/compose";
import { blogComponents } from "./mdx/spec-blog";
import { helpComponents } from "./mdx/spec-help";
import { sharedComponents } from "./mdx/spec-shared";

/**
 * THE ONE MDX MAP, composed from three files so parallel tracks stop meeting
 * in one (the operating model, 2026-09-02): mdx/spec-shared.tsx
 * (Orchestrator-owned, grows by promotion), mdx/spec-help.tsx (the help lane),
 * mdx/spec-blog.tsx (the blog lane). Every surface still renders the whole
 * vocabulary; the split is about who WRITES where. The composer throws on a
 * duplicate name.
 *
 * ★ BOUNDARY RULE (unchanged): spec-shared.tsx reaches node:fs through the help
 * loader, so nothing client-side may import from here.
 */
export * from "./mdx/spec-shared";

// Passed to <MDXRemote components={mdxComponents} />.
export const mdxComponents = composeMdxComponents(
  sharedComponents,
  helpComponents,
  blogComponents,
);
