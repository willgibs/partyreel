/**
 * THE ASSISTANT DEEP LINKS (the footer's machine-readable row).
 *
 * Partyreel's AI-discoverability layer (milestone-4: /llms.txt + /llms-full.txt
 * + robots welcoming 14 AI crawlers) is a real strategic bet that is otherwise
 * completely invisible on the site. This row is its one human-facing surface:
 * the footer hands a visitor the same question the llms.txt builders answer, in
 * whichever assistant they already trust.
 *
 * Lives HERE and not in marketing-nav.ts on purpose: marketing-nav.test.ts pins
 * every header AND footer href to `startsWith("/")` (the nav must never point
 * off-site), and these are external by nature. Keeping them out means that pin
 * stays strict instead of being loosened for one exception.
 *
 * NO vendor logos anywhere: this footer deliberately carries no social icons
 * (the company has no accounts), so three competitors' marks would be exactly
 * the noise that ruling avoided, and they drift as brands restyle. Plain text
 * links only.
 *
 * ★ EACH TARGET WAS DRIVEN IN A BROWSER, NOT ASSUMED (2026-08-28). These are
 * third-party URL contracts and they drift, so re-verify before adding one:
 *   • ChatGPT  `?q=` AUTO-SUBMITS and answers correctly for a logged-OUT
 *     visitor, citing our own pages. The best of the three.
 *   • Claude   `?q=` prefills the composer WITHOUT submitting (the visitor
 *     chooses to send), but renders a red "use caution before running this
 *     prompt" security banner over any URL-injected prompt. It works; whether
 *     that banner is an acceptable first impression is Will's call.
 *   • Perplexity was REMOVED, do not re-add without re-testing: its `?q=`
 *     answers logged-out visitors with "Sign up and repeat your request", so
 *     it dead-ends the majority of footer clickers behind a signup wall.
 * A prefill that stops working degrades to the assistant's home page, never a 404.
 */

/**
 * The question the row asks on the visitor's behalf. Neutral, and answerable
 * straight from /llms.txt (no marketing claim to defend).
 *
 * ★ THE DOMAIN IS LOAD-BEARING, do not "tidy" it out. Verified live 2026-08-28:
 * asking "What is Partyreel and how does it work?" bare, ChatGPT confidently
 * answers about a DIFFERENT company with a near-identical name (a birthday
 * video-message service) and cites it. Anchoring the query with partyreel.com
 * flips it to a correct, sourced answer off our own pages ("shared photo/video
 * collection platform for events", "one QR code", "no app and no guest
 * account"). A footer link that misinforms every visitor about our own product
 * is worse than no link, so re-verify this before changing the wording.
 */
export const ASK_AI_QUESTION =
  "What is Partyreel (partyreel.com) and how does it work?";

const q = encodeURIComponent(ASK_AI_QUESTION);

export type AskAiTarget = { label: string; href: string };

export const ASK_AI_TARGETS: AskAiTarget[] = [
  { label: "ChatGPT", href: `https://chatgpt.com/?q=${q}` },
  { label: "Claude", href: `https://claude.ai/new?q=${q}` },
];

/** The machine-readable source the row points at (llmstxt.org format). Internal,
 *  so it is a plain route, not an ASK_AI_TARGETS entry. */
export const LLMS_TXT_HREF = "/llms.txt";
