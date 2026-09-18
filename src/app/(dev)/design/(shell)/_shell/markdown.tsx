import { posix } from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import remarkGfm from "remark-gfm";

import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

import { createHeadingIds, nodeText } from "@/app/(dev)/design/_data/docs";
import { githubFor, hrefFor, parseRef } from "@/app/(dev)/design/_data/links";

/**
 * THE SHELL'S MARKDOWN (the Library x Lab round, 2026-09-15): repo markdown
 * (a system doc, a proposal, a ruling, a manifest section) rendered as prose.
 *
 * FORMAT "md" IS LOAD-BEARING. The docs carry braces, angle brackets and the
 * ★ glyph in running text; MDX's own syntax would read `{…}` as an expression
 * and `<track>` as JSX and fail the render. In "md" the body is plain
 * CommonMark + GFM (tables, task lists, autolinks); raw HTML in a doc renders
 * nothing, which is the right amount of trust for a file an agent wrote.
 *
 * Heading ids run the same counter as `headingsOf` (docs.ts), so an anchor
 * from the touchpoints registry lands on the heading the sidebar lists.
 */
type Ctx = {
  nextId: (text: string) => string;
  /** The rendered file's repo path; relative links resolve against its folder. */
  from?: string;
  designKey: string | null;
};

/** `?key=` belongs before the fragment; withDesignKey alone would append after `#`. */
function keyed(href: string, designKey: string | null): string {
  const at = href.indexOf("#");
  if (at < 0) return withDesignKey(href, designKey);
  return withDesignKey(href.slice(0, at), designKey) + href.slice(at);
}

function withHash(href: string, hash: string | null): string {
  return hash && !href.includes("#") ? `${href}#${hash}` : href;
}

type Resolved =
  | { kind: "anchor"; href: string }
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string }
  | { kind: "plain" };

/**
 * Where a link in a doc goes. Absolute URLs pass through; `#x` stays in the
 * page; `/x` is a site route (the lab's own routes carry the key); anything
 * else is a repo path relative to the doc's folder (`../systems/x.md#y`,
 * `docs/specs/x.md`, `src/...`), handed to the lab's ref resolver: a lab page
 * when the lab renders that file, GitHub otherwise, plain text when neither.
 */
function resolve(href: string, ctx: Ctx): Resolved {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) {
    return { kind: "external", href };
  }
  if (href.startsWith("#")) return { kind: "anchor", href };
  if (href.startsWith("/")) {
    // The resolver maps an old board URL onto its new home; any other site
    // route passes through as written. Only the lab's own routes carry the key.
    const route = hrefFor(parseRef(href)) ?? href;
    return {
      kind: "internal",
      href: route.startsWith("/design") ? keyed(route, ctx.designKey) : route,
    };
  }
  const at = href.indexOf("#");
  const file = at < 0 ? href : href.slice(0, at);
  const hash = at < 0 ? null : href.slice(at + 1);
  const base = ctx.from ? posix.dirname(ctx.from) : ".";
  const repoPath = posix.normalize(posix.join(base, file)).replace(/^\.\//, "");
  if (repoPath === ".." || repoPath.startsWith("../")) return { kind: "plain" };
  const ref = parseRef(hash ? `${repoPath}#${hash}` : repoPath);
  const lab = hrefFor(ref);
  if (lab)
    return {
      kind: "internal",
      href: keyed(withHash(lab, hash), ctx.designKey),
    };
  const github = githubFor(ref);
  if (github) return { kind: "external", href: withHash(github, hash) };
  return { kind: "plain" };
}

/**
 * The components map, built per render: the heading counter is per document,
 * so a module-level map would number a second render's headings `-2`.
 */
export function docComponents(ctx: Ctx) {
  const heading = (Tag: "h1" | "h2" | "h3") =>
    function DocHeading({ children, ...props }: ComponentProps<typeof Tag>) {
      return (
        <Tag id={ctx.nextId(nodeText(children))} {...props}>
          {children}
        </Tag>
      );
    };

  function DocLink({ href = "", children, title }: ComponentProps<"a">) {
    const target = resolve(href, ctx);
    if (target.kind === "plain") return <span title={href}>{children}</span>;
    if (target.kind === "external") {
      return (
        <a href={target.href} title={title} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    if (target.kind === "anchor") {
      return (
        <a href={target.href} title={title}>
          {children}
        </a>
      );
    }
    return (
      <Link href={target.href} title={title}>
        {children}
      </Link>
    );
  }

  // Two faces: a bare <code> or <pre> falls to the preflight's mono stack
  // (the design-system landmine); the lab reads code in the sans face like
  // the help prose does (`prose-code:font-sans`).
  function DocCode({ className, ...props }: ComponentProps<"code">) {
    return <code className={cn("font-sans", className)} {...props} />;
  }
  function DocPre({ className, ...props }: ComponentProps<"pre">) {
    return <pre className={cn("font-sans", className)} {...props} />;
  }

  return {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    a: DocLink,
    code: DocCode,
    pre: DocPre,
  };
}

export async function Markdown({
  source,
  from,
  designKey = null,
  skipTitle = false,
}: {
  source: string;
  /** The source's repo path (e.g. `docs/systems/design-system.md`), for relative links. */
  from?: string;
  /** The preview key, threaded into the lab's own links (`key` is React's, hence the name). */
  designKey?: string | null;
  /** Drop the document's own `# title` (the page header already says it). */
  skipTitle?: boolean;
}): Promise<ReactNode> {
  const { content } = await compileMDX({
    source: skipTitle ? source.replace(/^\s*# [^\n]*\n/, "") : source,
    components: docComponents({ nextId: createHeadingIds(), from, designKey }),
    options: { mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } },
  });
  return (
    <div className="prose max-w-none prose-help [&_a]:break-words [&_code]:break-words [&_table]:block [&_table]:overflow-x-auto">
      {content}
    </div>
  );
}
