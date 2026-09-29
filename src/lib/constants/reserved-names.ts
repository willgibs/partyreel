import { BRAND_STEM } from "@/lib/constants/reserved-slugs";

/**
 * Reserved DISPLAY NAMES a user may not take, to stop impersonation in public uploader
 * attribution and the "Hosted by" byline (a guest setting their name to "Partyreel Support" or
 * "Admin" and looking official). Two rules, both in `isReservedName` below, the one home every door
 * a name comes through asks (`displayNameSchema`):
 *
 *   1. A WHOLE reserved name, trimmed and lowercased: it blocks "admin" but never a legitimate
 *      name that merely contains a token ("Adminah", "Hosta").
 *   2. THE BRAND, in any of its disguises, alone or beside a staff word: "Partyreel Support",
 *      "The Party-Reel Team", "P4rtyr33l Adm1n". See `isReservedName`.
 *
 * Like reserved-slugs.ts this is POLICY, not a security boundary: enforced in the app layer
 * (displayNameSchema in lib/validation/profile.ts, which the account action, the guest join and
 * rename routes, the door's adopted name and the browser's own checks all read), not in SQL (the
 * identity migration's header says why: a name reaches the database only through a route or an
 * action that has already asked), and may grow. All entries MUST be lowercase.
 */
export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "partyreel",
  "party reel",
  "official",
  "support",
  "help",
  "host",
  "moderator",
  "mod",
  "staff",
  "team",
  "system",
  "owner",
  "billing",
  "security",
]);

/**
 * The letters a name can be spelled through, folded so a disguise and the word read the same:
 * a digit for the letter it looks like (the slug family's four, `BRAND_FOLD` in reserved-slugs.ts:
 * 4 a, 3 e, 1 l, 7 t; plus 0 o and 5 s, the two more a name wears), and `l` and `i` as one letter,
 * because a `1` stands for either (`Partyree1`, `Off1cial`). Applied to the name and to the words
 * it is compared with, so the two sides can only ever agree or disagree together.
 */
const LOOK_ALIKE: Readonly<Record<string, string>> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  l: "i",
};

/**
 * Lowercase, drop accents and full-width forms (`Pärtÿreel`, `ＰＡＲＴＹ`), then read each look-alike as
 * its letter. Other scripts' homoglyphs (a Cyrillic `а` for an `a`) are NOT folded: this is policy, a
 * best-effort list that grows as cases are reported, like the profanity matcher beside it.
 */
function fold(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[013457l]/g, (c) => LOOK_ALIKE[c]);
}

/** Letters and digits of any script; everything else (space, hyphen, dot, emoji) only separates. */
const SEPARATORS = /[^\p{L}\p{N}]+/u;

const BRAND = fold(BRAND_STEM);

/**
 * The staff words: every reserved name that is not the brand itself, folded and joined, so "help" is
 * `heip` on both sides of the comparison. Growing `RESERVED_NAMES` grows these.
 */
const STAFF: readonly string[] = [...RESERVED_NAMES]
  .map((word) => fold(word).split(SEPARATORS).join(""))
  .filter((word) => !word.includes(BRAND));

/**
 * True when `fragment` is nothing but staff words, each whole and each optionally plural (`support`,
 * `admins`, `supportteam`): a word a fan or a surname merely CONTAINS is not one (`supporter`,
 * `hostess`, `teamwork`, `ownership`). Reachability over the fragment's prefixes, so no input can
 * make it slow.
 */
function isStaffRun(fragment: string): boolean {
  if (fragment.length === 0) return false;
  const reach = new Array<boolean>(fragment.length + 1).fill(false);
  reach[0] = true;
  for (let at = 0; at < fragment.length; at++) {
    if (!reach[at]) continue;
    for (const word of STAFF) {
      if (!fragment.startsWith(word, at)) continue;
      const end = at + word.length;
      reach[end] = true;
      if (fragment[end] === "s") reach[end + 1] = true;
    }
  }
  return reach[fragment.length];
}

/**
 * What is left of each word once the brand is taken out of the name: the fragments beside it, in
 * order, none of them empty. `words` are the name's folded words and `joined` is them run together,
 * which is where the brand is looked for, so it is found whole across a separator (`party` `reel`)
 * or inside a word (`partyreelsupport`), and an empty result means the name is the brand and
 * nothing else.
 */
function besideTheBrand(words: readonly string[], joined: string): string[] {
  const taken = new Array<boolean>(joined.length).fill(false);
  for (
    let at = joined.indexOf(BRAND);
    at !== -1;
    at = joined.indexOf(BRAND, at + BRAND.length)
  ) {
    taken.fill(true, at, at + BRAND.length);
  }
  const beside: string[] = [];
  let offset = 0;
  for (const word of words) {
    let run = "";
    for (let i = 0; i < word.length; i++) {
      if (taken[offset + i]) {
        if (run) beside.push(run);
        run = "";
      } else {
        run += word[i];
      }
    }
    if (run) beside.push(run);
    offset += word.length;
  }
  return beside;
}

/**
 * True for a display name nobody may take. Two rules, in order:
 *
 *  - It is a reserved name WHOLE (`RESERVED_NAMES`, trimmed and lowercased): "Support", never
 *    "Supporter".
 *  - ★ It holds THE BRAND, ALONE OR WITH A STAFF WORD (crumbs-20). The slug refuses the brand
 *    anywhere in a link (`isBrandSlug`); a name is refused only when it would read as us speaking:
 *    the brand by itself, or beside a reserved staff word ("Partyreel Support", "Official
 *    Partyreel", "The Party Reel Team"). Read by WORDS, never by substring, so a name that merely
 *    contains a staff word stays legal ("Adminah", "Hosta") and so does the brand beside a name
 *    ("Sam Partyreel", "Partyreel Fan"): that is a fan, not the staff.
 *
 * The brand is read through the disguises a name can wear: any case, accents, full-width letters,
 * ANY separator between its letters ("Party Reel", "party-reel", "P.a.r.t.y.R.e.e.l"), and a digit
 * for the letter it looks like ("P4rtyr33l"); the staff word is read through the same digits
 * ("Supp0rt"). Deliberately NOT read: a dropped or doubled letter (`Partyrel`, `Partyreeel`),
 * which would refuse ordinary words ("Party Relay Team"), as the slug's fold leaves it too.
 */
export function isReservedName(name: string): boolean {
  if (RESERVED_NAMES.has(name.trim().toLowerCase())) return true;
  const words = fold(name).split(SEPARATORS).filter(Boolean);
  const joined = words.join("");
  if (!joined.includes(BRAND)) return false;
  const beside = besideTheBrand(words, joined);
  return beside.length === 0 || beside.some(isStaffRun);
}
