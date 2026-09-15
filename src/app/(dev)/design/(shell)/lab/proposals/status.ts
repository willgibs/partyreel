/**
 * A PROPOSAL'S STANDING, IN ONE LINE (the Library x Lab round, 2026-09-15).
 *
 * Every proposal opens with a blockquote that says what it is and how far it
 * binds ("STATUS: a PROPOSAL ...", "NOT LAW until Will rules; ..."). The lab's
 * listing picks the single SOURCE LINE carrying those words, which is where a
 * hard wrap happens to fall: the proposals page printed half-sentences like
 * "kept here so it outlives the track manifest. NOT LAW until". This de-wraps
 * the blockquote first and then takes the one clause, so the line a reader
 * sees is a whole thought.
 *
 * Pure, and deliberately not in `_data/docs.ts`: the listing there is a
 * different question (which files are proposals) and belongs to another lane.
 */

const MARKER = /\b(STATUS|NOT LAW)\b/;

/** The opening blockquote, markers stripped and hard wraps undone. */
function openingQuote(body: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^\s*>/.test(l));
  if (start < 0) return "";
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (!/^\s*>/.test(lines[i])) break;
    out.push(lines[i].replace(/^\s*>\s?/, "").trim());
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** Bold, italic, code and link syntax lifted off a line meant to be read. */
function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\W)\*([^*]+)\*/g, "$1$2")
    .replace(/^["“”']|["“”']$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The clause that states how far the document binds: from STATUS or NOT LAW to
 * the end of its own sentence or clause. Null when the file says neither, and
 * the caller falls back to its own words.
 */
export function proposalStatus(body: string): string | null {
  const quote = plain(openingQuote(body));
  const at = quote.search(MARKER);
  if (at < 0) return null;
  const rest = quote.slice(at);
  const end = rest.search(/[.;]\s|[.;]$/);
  const clause = (end < 0 ? rest : rest.slice(0, end)).trim();
  return clause || null;
}
