import { describe, expect, it } from "vitest";

import { isLikelyBot } from "@/lib/analytics/bots";

// Real browser UAs (desktop + mobile) must NOT be flagged — these are the human
// visits we want to count.
const REAL_BROWSERS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// Crawlers + the chat/social unfurlers that hit share links — must be skipped.
const BOTS = [
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Discordbot/2.0 (+https://discordapp.com)",
  "Twitterbot/1.0",
  "WhatsApp/2.23.20.0",
  "curl/8.1.2",
];

describe("isLikelyBot", () => {
  it("does NOT flag real desktop/mobile browsers", () => {
    for (const ua of REAL_BROWSERS) {
      expect(isLikelyBot(ua), ua).toBe(false);
    }
  });

  it("flags crawlers and link-unfurlers", () => {
    for (const ua of BOTS) {
      expect(isLikelyBot(ua), ua).toBe(true);
    }
  });

  it("treats a missing/empty user-agent as a bot", () => {
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot(undefined)).toBe(true);
    expect(isLikelyBot("")).toBe(true);
  });
});
