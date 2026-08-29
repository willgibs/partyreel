import { statSync } from "node:fs";
import { join } from "node:path";

import {
  buildBlogRssXml,
  getAllPosts,
  type RssCoverSizes,
} from "@/lib/content/blog";
import { coverFor } from "@/lib/content/blog-covers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants/site";

// GET route handlers aren't cached by default in Next 16 — `force-static` prerenders
// the feed at build time (it reads only in-repo content, never the request). The pure
// XML builder lives in blog.ts (unit-tested); this just supplies the site constants +
// wraps the result in a Response.
export const dynamic = "force-static";

/**
 * Cover sizes for the enclosures. RSS requires a byte `length`, so the sizes are stat'd HERE, at
 * build, rather than inside the builder: the builder stays pure and testable on literals, and this
 * route is the only place that legitimately touches the filesystem. A file that cannot be stat'd
 * is skipped silently and its item ships without an enclosure, which is a valid item - never a
 * fabricated length, and never a build failure over an optional feed nicety.
 */
function coverSizes(): RssCoverSizes {
  const sizes = new Map<string, number>();
  for (const post of getAllPosts()) {
    const { src } = coverFor(post.slug, post.frontmatter.cover);
    if (sizes.has(src)) continue;
    try {
      sizes.set(src, statSync(join(process.cwd(), "public", src)).size);
    } catch {
      // Missing or unreadable: no enclosure for this item.
    }
  }
  return sizes;
}

export function GET() {
  const xml = buildBlogRssXml(
    getAllPosts(),
    { url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION },
    coverSizes(),
  );
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
