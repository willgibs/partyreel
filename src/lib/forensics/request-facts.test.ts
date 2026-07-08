import { describe, expect, it } from "vitest";

import { extractForensicRequestFacts } from "@/lib/forensics/request-facts";

describe("extractForensicRequestFacts", () => {
  it("prefers x-real-ip over the forwarded chain", () => {
    const facts = extractForensicRequestFacts(
      new Headers({
        "x-real-ip": "203.0.113.7",
        "x-forwarded-for": "198.51.100.1, 10.0.0.1",
      }),
    );
    expect(facts.ip).toBe("203.0.113.7");
  });

  it("falls back to the FIRST x-forwarded-for hop (later hops are proxies)", () => {
    const facts = extractForensicRequestFacts(
      new Headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1, 10.0.0.2" }),
    );
    expect(facts.ip).toBe("198.51.100.1");
  });

  it("collects every sec-ch-* header verbatim, lowercased", () => {
    const facts = extractForensicRequestFacts(
      new Headers({
        "Sec-CH-UA": '"Chromium";v="130"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "user-agent": "Mozilla/5.0",
      }),
    );
    expect(facts.userAgent).toBe("Mozilla/5.0");
    expect(facts.clientHints).toEqual({
      "sec-ch-ua": '"Chromium";v="130"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    });
  });

  it("captures the Vercel geo headers and URI-decodes the city", () => {
    const facts = extractForensicRequestFacts(
      new Headers({
        "x-vercel-ip-country": "BR",
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
        "x-vercel-ip-latitude": "-23.55",
        "x-vercel-ip-longitude": "-46.63",
      }),
    );
    expect(facts.geo).toEqual({
      "x-vercel-ip-country": "BR",
      "x-vercel-ip-city": "São Paulo",
      "x-vercel-ip-latitude": "-23.55",
      "x-vercel-ip-longitude": "-46.63",
    });
  });

  it("keeps a malformed city raw rather than losing the capture", () => {
    const facts = extractForensicRequestFacts(
      new Headers({ "x-vercel-ip-city": "%E0%A4%A" }),
    );
    expect(facts.geo).toEqual({ "x-vercel-ip-city": "%E0%A4%A" });
  });

  it("returns nulls (not empty objects) when nothing is present", () => {
    const facts = extractForensicRequestFacts(new Headers());
    expect(facts).toEqual({
      ip: null,
      userAgent: null,
      clientHints: null,
      geo: null,
    });
  });
});
