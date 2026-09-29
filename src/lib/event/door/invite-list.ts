/**
 * THE INVITE LIST'S ONE FIELD (event-settings r1, `editor=both`): "Type one and press Enter, or paste
 * two hundred and they land as chips, the unreadable ones flagged."
 *
 * A host adds a latecomer one at a time and a whole list from a spreadsheet once, so one reader takes
 * both: whatever was typed or pasted is split into entries (a line, a comma, a semicolon, a tab), each
 * entry gives up every address inside it (a bare address, `Maya Jones <maya@example.com>`, a
 * `mailto:`, a spreadsheet row with a name beside it), and an entry that holds none is flagged rather
 * than dropped, so the host sees exactly what did not make it.
 *
 * ★ STRICTER THAN THE DATABASE, NEVER LOOSER. The table's CHECK and `add_event_invites` refuse only
 * what cannot be an address at all (no `@` past the first character, whitespace, the length); this
 * reader also wants a domain with a dot, so a typo like `maya@gmail` is flagged at the field instead of
 * sitting on the list forever unmatchable. Anything it passes, the database passes.
 *
 * Pure: the field, the Server Function and the tests all read it.
 */

/** Addresses one event's list can hold, mirrored by `add_event_invites` (`c_cap`, parity-tested). */
export const INVITE_LIST_CAP = 500;

/** Addresses one save may carry, mirrored by `add_event_invites` (`cardinality(p_emails) > 2000`). */
export const INVITE_BATCH_MAX = 2000;

/** What a paste or a typed entry gives up. */
export type ReadAddresses = {
  /** Readable addresses, normalised (lower-cased, trimmed), each once, in the order they came. */
  addresses: string[];
  /** The entries that held no readable address, trimmed, each once, in the order they came. */
  unreadable: string[];
};

// One whole address: a local part, an `@`, and a domain with at least one dot and a top-level label
// of two or more letters. Anchored, and asked of a whole token, so a character it does not know (an
// accented local part) flags the address rather than shortening it into somebody else's.
const ADDRESS = /^[a-z0-9._%+'-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

// What may wrap a token in a pasted list: quotes, brackets, and a sentence's trailing punctuation.
const WRAPPING = /^[<("'[]+|[>)"'\].,:!?]+$/g;

/** The shape the database will store: the CHECK's own rule, plus the field's domain-with-a-dot. */
export function isReadableAddress(value: string): boolean {
  const address = normalizeAddress(value);
  if (address.length < 3 || address.length > 254) return false;
  const at = address.indexOf("@");
  if (at < 1 || at > 64) return false;
  return ADDRESS.test(address);
}

/** The stored form: `add_event_invites` stores `lower(btrim(email))`. */
export function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

/** One entry's tokens: split on whitespace and angle brackets, each unwrapped and any `mailto:` shed. */
function tokensOf(entry: string): string[] {
  return entry
    .split(/[\s<>]+/)
    .map((token) => token.replace(WRAPPING, "").replace(/^mailto:/i, ""))
    .filter(Boolean);
}

/**
 * Everything a field was handed, read into addresses and the entries that held none. An empty or
 * whitespace-only input gives up nothing, and nothing is flagged.
 */
export function readAddresses(input: string): ReadAddresses {
  const addresses: string[] = [];
  const unreadable: string[] = [];
  const seen = new Set<string>();
  const seenBad = new Set<string>();

  for (const rawEntry of input.split(/[\n\r,;\t]+/)) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const readable = tokensOf(entry)
      .filter((token) => isReadableAddress(token))
      .map(normalizeAddress);
    if (readable.length === 0) {
      const key = entry.toLowerCase();
      if (!seenBad.has(key)) {
        seenBad.add(key);
        unreadable.push(entry);
      }
      continue;
    }
    for (const address of readable) {
      if (seen.has(address)) continue;
      seen.add(address);
      addresses.push(address);
    }
  }
  return { addresses, unreadable };
}
