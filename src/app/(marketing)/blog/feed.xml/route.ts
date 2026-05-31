import { buildBlogRssXml, getAllPosts } from "@/lib/content/blog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants/site";

// GET route handlers aren't cached by default in Next 16 — `force-static` prerenders
// the feed at build time (it reads only in-repo content, never the request). The pure
// XML builder lives in blog.ts (unit-tested); this just supplies the site constants +
// wraps the result in a Response.
export const dynamic = "force-static";

export function GET() {
  const xml = buildBlogRssXml(getAllPosts(), {
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
  });
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
