import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants/site";

// Allow the marketing site; disallow the gated host app, the opaque
// capability-token surface, and the key-gated design lab. /e/ still emits OG
// tags so a shared link unfurls in chat, but crawlers must not index it (each
// such page also sets `robots: { index: false }` as defense in depth).
//
// AI CRAWLERS ARE EXPLICITLY WELCOME (2026-08-28): assistant recommendations
// are formed from what models can crawl, retrieve, and quote, so the training
// and retrieval bots get their own allow blocks rather than riding the
// wildcard. Same disallow set as everyone (the app is never for crawlers).
// /llms.txt + /llms-full.txt carry the curated account.
const DISALLOW = [
  "/dashboard",
  "/admin",
  "/login",
  "/auth",
  "/account",
  "/welcome",
  "/design",
  "/e/",
  "/api/",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
