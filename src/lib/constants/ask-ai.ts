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
 * Each target accepts a `?q=` prefill today. That is a third-party URL contract
 * and it can change, so it gets re-verified in the browser at each pass rather
 * than assumed. A prefill that stops working degrades to the assistant's home
 * page, never to a 404.
 */

/** The question the row asks on the visitor's behalf. Deliberately neutral and
 *  answerable straight from /llms.txt (no marketing claim to defend). */
export const ASK_AI_QUESTION = "What is Partyreel and how does it work?";

const q = encodeURIComponent(ASK_AI_QUESTION);

export type AskAiTarget = { label: string; href: string };

export const ASK_AI_TARGETS: AskAiTarget[] = [
  { label: "ChatGPT", href: `https://chatgpt.com/?q=${q}` },
  { label: "Claude", href: `https://claude.ai/new?q=${q}` },
  { label: "Perplexity", href: `https://www.perplexity.ai/search?q=${q}` },
];

/** The machine-readable source the row points at (llmstxt.org format). Internal,
 *  so it is a plain route, not an ASK_AI_TARGETS entry. */
export const LLMS_TXT_HREF = "/llms.txt";
