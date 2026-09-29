/**
 * THE TEN MAILS THROUGH THE ONE SHELL (Will, `emails` r1): every template's HTML and its plain-text
 * twin, each foot, the operator tag, no postal address anywhere, and the wordmark file against the
 * size the shell declares. The recovery-copy guards (Phase 5) ride along unchanged below.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { Mail } from "@/lib/email/templates";

// templates.ts takes the canonical origin from site.ts, which validates the public env on import.
// Unset here, so SITE_URL takes its production fallback, which is what every deploy that sends builds.
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));

const T = await import("@/lib/email/templates");
const { BRAND_HEX } = await import("@/lib/constants/site");

const SITE = "https://partyreel.com";
const DASH = `${SITE}/dashboard`;
const RENEW = `${SITE}/account/renew`;
const PREFS = `${SITE}/account#event-pass-reminders`;

const HOST = {
  graceStart: T.overCapGraceStartEmail({
    capLabel: "100 GB",
    deadline: "November 3, 2026",
    dashboardUrl: DASH,
  }),
  reminder: T.overCapReminderEmail({
    deadline: "November 3, 2026",
    dashboardUrl: DASH,
  }),
  reduced: T.overCapReducedEmail({
    recoverableUntil: "December 3, 2026",
    dashboardUrl: DASH,
  }),
  renewal: T.renewalNudgeEmail({
    expiresOn: "October 3, 2026",
    renewUrl: RENEW,
    preferencesUrl: PREFS,
  }),
  inactivityWarning: T.inactivityWarningEmail({
    eventName: "Jordan's Housewarming",
    deadline: "December 20, 2026",
    dashboardUrl: DASH,
  }),
  inactivityRemoved: T.inactivityRemovedEmail({
    eventName: "Jordan's Housewarming",
    recoverableUntil: "October 19, 2026",
    dashboardUrl: DASH,
  }),
};

const OPERATOR = {
  contact: T.contactFormEmail({
    name: "Sam Okafor",
    email: "sam.okafor@example.com",
    subject: "A question before our launch piece",
    message: "Is there ten minutes this week?\nWe file on Friday.",
    topic: "Press & partnerships",
  }),
  careers: T.applicationReceivedEmail({
    role: "Founding Designer",
    name: "Riley Tran",
    email: "riley.tran@example.com",
    links: "riley-tran.design",
    message: "I've led design at two small consumer apps.",
  }),
  orphan: T.orphanBreakerEmail({
    reason: "candidates exceed 20% of total media",
    candidates: 812,
    mediaCount: 3940,
    objectsScanned: 4512,
  }),
  prune: T.pruneBreakerEmail({
    reason: "source media count dropped sharply since last run",
    candidates: 44,
    mediaCount: 3940,
    objectsScanned: 918,
    mode: "dry-run",
  }),
};

// admin-triage r2: the operator told at once of a child-abuse report, both ways it can arrive.
const URGENT = {
  urgentHidden: T.urgentReportEmail({
    eventName: "Priya & Sam's baby shower",
    hidden: true,
    reportsUrl: "https://admin.partyreel.com/admin/reports",
  }),
  urgentWaiting: T.urgentReportEmail({
    eventName: "Priya & Sam's baby shower",
    hidden: false,
    reportsUrl: "https://admin.partyreel.com/admin/reports",
  }),
};

// ...and the one mail an operator sends a reporter, behind its switch (Ask for proof).
const REPORTER = {
  proofAsk: T.reportProofAskEmail({
    eventName: "Priya & Sam's baby shower",
    question:
      "Which photo is it, and is there anything that shows she's yours?",
    answerUrl: `${SITE}/report/${"a".repeat(64)}`,
  }),
};

const ALL: Record<string, Mail> = {
  ...HOST,
  ...OPERATOR,
  ...URGENT,
  ...REPORTER,
};
const EVERY = Object.entries(ALL);

/** What a reader sees in the HTML: the card's words, tags gone, entities decoded, spaces collapsed. */
function visibleText(html: string): string {
  return (
    html
      .replace(/<head>[\s\S]*<\/head>/, "")
      .replace(/<div aria-hidden="true"[\s\S]*?<\/div>/, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      // A block's edge is a space to a reader; an inline tag (strong, code, a) is nothing.
      .replace(/<br>|<\/(p|h1|td|tr|table)>/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
  );
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** The hidden inbox preview, decoded. */
function previewOf(html: string): string {
  const div = /<div aria-hidden="true"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  expect(div, "no preview").not.toBeNull();
  return div![1]
    .replace(/(&#847;&zwnj;&nbsp;)+$/, "")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

describe("one shell for all ten (shell=unified, brand=wordmark, dark=light)", () => {
  it.each(EVERY)(
    "%s is a whole light-only document on the white card",
    (_, mail) => {
      const { html } = mail;
      expect(html.startsWith("<!doctype html>")).toBe(true);
      expect(html).toContain('<meta name="color-scheme" content="light only">');
      expect(html).toContain(
        '<meta name="supported-color-schemes" content="light only">',
      );
      expect(html).toContain(
        ":root{color-scheme:light only;supported-color-schemes:light only}",
      );
      // The explicit white card, on the mat.
      expect(html).toContain(
        `bgcolor="#ffffff" style="max-width:560px;background-color:#ffffff;`,
      );
      expect(html).toContain(
        '<body style="margin:0;padding:0;background-color:#f2f2f7;"',
      );
      // One wordmark, hosted, with its size and its name for a client that blocks images.
      const marks = html.match(/<img [^>]*>/g) ?? [];
      expect(marks).toHaveLength(1);
      expect(marks[0]).toContain(`src="${SITE}/email/wordmark-v1.png"`);
      expect(marks[0]).toContain('width="122" height="38" alt="Partyreel"');
      // The rose is gone for good; the only fills are the brand's.
      expect(html.toLowerCase()).not.toContain("#e11d48");
      // One divider, one foot.
      expect(html.match(/data-foot/g)).toHaveLength(1);
      expect(html).toContain('data-foot style="border-top:1px solid #dadadf;');
    },
  );

  it("host mail has one button, in the brand's ink; operator mail has none", () => {
    for (const mail of Object.values(HOST)) {
      expect(
        mail.html.match(
          /<a href="[^"]+" target="_blank" style="display:inline-block;/g,
        ),
      ).toHaveLength(1);
      expect(mail.html).toContain(
        `bgcolor="${BRAND_HEX}" style="border-radius:16px;background-color:${BRAND_HEX};"`,
      );
    }
    for (const mail of Object.values(OPERATOR)) {
      expect(mail.html).not.toContain("display:inline-block;padding:10px 20px");
    }
  });

  it("the wordmark file is the declared size at 2x", () => {
    // PNG: the IHDR chunk's width and height, big-endian, at bytes 16 and 20.
    const png = readFileSync(
      join(process.cwd(), "public", new URL(T.WORDMARK.src).pathname),
    );
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(T.WORDMARK.width * 2);
    expect(png.readUInt32BE(20)).toBe(T.WORDMARK.height * 2);
  });
});

describe("the plain-text twin, from the same parts", () => {
  it.each(EVERY)("%s says in text what its card says", (_, mail) => {
    const { html, text } = mail;
    expect(text.trim().length).toBeGreaterThan(0); // an empty text would let Resend write its own
    expect(text).not.toMatch(/<(p|strong|table|td|a|br|h1|div|code)[\s>]/);
    expect(text).not.toMatch(/&(amp|lt|gt|quot|#39|nbsp);/);
    const seen = visibleText(html);
    const [body = "", foot = ""] = text.split("\n---\n");
    for (const line of body.split("\n").filter((l) => l.trim())) {
      const button = /^(.+): (https:\/\/\S+)$/.exec(line);
      if (button) {
        expect(html).toContain(`href="${button[2]}"`);
        expect(seen).toContain(button[1]);
      } else {
        expect(seen).toContain(collapse(line));
      }
    }
    const [reason, ...rest] = foot.trim().split("\n");
    expect(seen).toContain(reason);
    for (const line of rest) {
      const link = /^(.+): (https:\/\/\S+)$/.exec(line);
      expect(link, `foot line "${line}"`).not.toBeNull();
      expect(html).toContain(`href="${link![2]}"`);
      expect(seen).toContain(link![1]);
    }
  });

  it("escapes what a person typed in the HTML and keeps it raw in the text", () => {
    const hostile = `<script>alert(1)</script> & "Mia's"`;
    const mail = T.inactivityWarningEmail({
      eventName: hostile,
      deadline: "December 20, 2026",
      dashboardUrl: DASH,
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain(
      "&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Mia&#39;s&quot;",
    );
    expect(mail.text).toContain(hostile);

    const contact = T.contactFormEmail({
      name: "<b>Sam</b>",
      email: "sam@example.com",
      message: "line one\r\nline two <i>",
    });
    expect(contact.html).toContain("line one<br>line two &lt;i&gt;");
    expect(contact.html).toContain("&lt;b&gt;Sam&lt;/b&gt;");
    expect(contact.text).toContain("Message:\nline one\nline two <i>");
  });
});

describe("the foot (foot=commercial, as his note refines it)", () => {
  it("every host mail says why it came, under the divider, true to that mail", () => {
    const reasons = Object.fromEntries(
      Object.entries(HOST).map(([id, m]) => [
        id,
        m.text.split("\n---\n\n")[1].split("\n")[0],
      ]),
    );
    expect(reasons).toEqual({
      graceStart:
        "You're receiving this because your Partyreel account is over its storage limit.",
      reminder:
        "You're receiving this because your Partyreel account is still over its storage limit.",
      reduced:
        "You're receiving this because we removed files from your Partyreel account.",
      renewal: "You're receiving this because you hold a Partyreel Event Pass.",
      inactivityWarning:
        "You're receiving this because you host Jordan's Housewarming on Partyreel's Free plan.",
      inactivityRemoved:
        "You're receiving this because Jordan's Housewarming was removed from your Partyreel account.",
    });
  });

  it("operator mail keeps its own line in the same foot", () => {
    expect(OPERATOR.contact.text).toContain(
      "---\n\nReply to this email to respond directly (Partyreel contact form).",
    );
    expect(OPERATOR.careers.text).toContain(
      "---\n\nReply to this email to respond directly (Partyreel careers).",
    );
    expect(OPERATOR.orphan.text).toContain(
      "---\n\nPartyreel operations alert (orphan-sweep safety",
    );
    expect(OPERATOR.prune.text).toContain(
      "---\n\nPartyreel operations alert (backup-prune safety",
    );
  });

  it("the renewal nudge alone carries an unsubscribe, to its switch", () => {
    const { html, text } = HOST.renewal;
    expect(html).toContain(
      `<a href="${PREFS}" target="_blank" style="color:#57575d;text-decoration:underline;">Unsubscribe from Event Pass reminders</a>`,
    );
    expect(text).toContain(`Unsubscribe from Event Pass reminders: ${PREFS}`);
    for (const [id, mail] of EVERY) {
      if (id === "renewal") continue;
      expect(`${mail.html}${mail.text}`, id).not.toMatch(/unsubscribe/i);
    }
  });

  it.each(EVERY)("%s carries no postal address", (_, mail) => {
    for (const part of [mail.html, mail.text]) {
      expect(part).not.toMatch(/\bP\.?\s?O\.?\s+Box\b|\bSuite\s+\d/i);
      expect(part).not.toMatch(
        /\b\d{1,5}\s+(\w+\s+){1,3}(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Drive)(,|\s|$)/,
      );
      expect(part).not.toMatch(/\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/); // a state and a ZIP
    }
  });
});

describe("the subjects and the first line", () => {
  it("every operator subject carries the tag (sender=tagged); host subjects never do", () => {
    for (const [id, mail] of Object.entries(OPERATOR)) {
      expect(mail.subject.startsWith(`${T.OPERATOR_TAG} `), id).toBe(true);
    }
    for (const [id, mail] of Object.entries(HOST)) {
      expect(mail.subject.startsWith("["), id).toBe(false);
    }
    expect(OPERATOR.contact.subject).toBe(
      "[Partyreel] Contact form [Press & partnerships]: A question before our launch piece",
    );
    expect(OPERATOR.careers.subject).toBe(
      "[Partyreel] Application: Founding Designer from Riley Tran",
    );
  });

  it("the inbox preview is each host mail's first line, and a form's own words", () => {
    expect(previewOf(HOST.graceStart.html)).toBe(
      "Your account is now using more than your plan's 100 GB. You have until November 3, 2026 to upgrade or remove some media. After that, we'll automatically reduce your storage (largest files first) to fit your plan. Removed items stay recoverable for 30 days.",
    );
    for (const [id, mail] of Object.entries(HOST)) {
      const firstParagraph = mail.text.split("\n\n")[1];
      expect(previewOf(mail.html), id).toBe(firstParagraph);
    }
    expect(previewOf(OPERATOR.contact.html)).toBe(
      "Is there ten minutes this week? We file on Friday.",
    );
  });

  it("the over-cap three lead with the account's state; the upgrade comes second", () => {
    for (const mail of [HOST.graceStart, HOST.reminder, HOST.reduced]) {
      expect(mail.subject).not.toMatch(/upgrade/i);
      const firstSentence = previewOf(mail.html).split(/(?<=\.) /)[0];
      expect(firstSentence).not.toMatch(/upgrade/i);
      expect(firstSentence).toMatch(/storage|limit|plan/);
    }
  });
});

// Recovery Phase 5 locked the system-removal email copy: a CONCRETE 30-day window (not the old
// vague "a short time / short window") and a pointer to the in-app self-serve Recently-deleted UI
// instead of "reply to this email" (the manual-recovery courtesy is gone). Guard against regressions.
describe("system-removal email copy (recovery Phase 5)", () => {
  it("overCapReducedEmail: concrete window date + self-serve, no reply-to-email or vague copy", () => {
    const { html } = T.overCapReducedEmail({
      recoverableUntil: "July 2, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("July 2, 2026");
    expect(html).toContain("Deleted");
    expect(html).not.toMatch(/reply to this email/i);
    expect(html).not.toContain("a short time");
  });

  it("overCapGraceStartEmail: concrete 30-day window, not 'a short window'", () => {
    const { html } = T.overCapGraceStartEmail({
      capLabel: "2 GB",
      deadline: "July 1, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("30 days");
    expect(html).not.toContain("a short window");
  });

  it("inactivityRemovedEmail: points to self-serve restore, no reply-to-email", () => {
    const { html } = T.inactivityRemovedEmail({
      eventName: "Summer Party",
      recoverableUntil: "July 2, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("July 2, 2026");
    expect(html).toContain("Deleted");
    expect(html).not.toMatch(/reply to this email/i);
  });
});

describe("the report mails (admin-triage r2)", () => {
  it("★ the urgent alert is tagged, has no button, names the album and the portal, and never the reporter", () => {
    for (const mail of Object.values(URGENT)) {
      expect(mail.subject.startsWith(`${T.OPERATOR_TAG} `)).toBe(true);
      expect(mail.html).not.toContain("display:inline-block;padding:10px 20px");
      expect(mail.text).toContain("Priya & Sam's baby shower");
      expect(mail.text).toContain("https://admin.partyreel.com/admin/reports");
      expect(mail.text).not.toMatch(/@example\.com/);
      expect(mail.text).toContain(
        "Sent at most once per album per ten minutes.",
      );
    }
    expect(URGENT.urgentHidden.text).toMatch(
      /hidden from every viewer at once/,
    );
    expect(URGENT.urgentWaiting.text).toMatch(/nothing was hidden/);
  });

  it("★ the ask carries one button to its answer page, the operator's question whole, and the host is never told who reported", () => {
    const { html, text, subject } = REPORTER.proofAsk;
    expect(subject.startsWith("[")).toBe(false);
    expect(
      html.match(
        /<a href="[^"]+" target="_blank" style="display:inline-block;/g,
      ),
    ).toHaveLength(1);
    expect(html).toContain(`href="${SITE}/report/${"a".repeat(64)}"`);
    expect(text).toContain(
      "Which photo is it, and is there anything that shows she's yours?",
    );
    expect(text.split("\n---\n\n")[1].split("\n")[0]).toBe(
      "You're receiving this because you confirmed this address with a report. It's deleted when the report closes, and the host is never told who reported.",
    );
  });
});
