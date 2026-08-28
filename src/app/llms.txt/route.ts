import { buildLlmsTxt } from "@/lib/content/llms";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";

// The llmstxt.org index for AI assistants and crawlers. Pure builder in
// lib/content/llms.ts (unit-tested, derived from the pricing/voice constants);
// force-static prerenders it at build time like the blog RSS feed.
export const dynamic = "force-static";

export function GET() {
  return new Response(
    buildLlmsTxt({
      url: SITE_URL,
      name: SITE_NAME,
      supportEmail: SUPPORT_EMAIL,
    }),
    {
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}
