/**
 * Crawler / link-unfurl detection for link analytics (Phase 6 cut #3).
 *
 * `link_stats` counters can't be cleaned retroactively, so we skip recording
 * non-human traffic AT INGEST. This targets the high-volume offenders: search
 * crawlers + the chat/social unfurlers that fetch `/e/[token]` (and its OG image)
 * whenever a share link is pasted. It's a pragmatic filter to keep counts
 * meaningful — NOT a security boundary, and not exhaustive.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|twitterbot|linkedinbot|pinterest|embedly|redditbot|googlebot|google-inspectiontool|applebot|petalbot|yandex|baiduspider|duckduckbot|semrush|ahrefs|headless|lighthouse|preview|monitor|curl|wget|python-requests|axios|go-http-client/i;

/**
 * True when the user-agent looks like a crawler/unfurler (skip analytics). A
 * missing/empty UA is treated as a bot — real browsers always send one, so an
 * absent UA is almost always automated.
 */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_UA.test(userAgent);
}
