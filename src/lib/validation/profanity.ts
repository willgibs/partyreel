/**
 * Profanity guard for PUBLIC display names (the uploader-attribution identity layer).
 *
 * WHY this is tuned, not stock obscenity: a display name is shown publicly on every upload, but
 * it is also a SHORT, often non-Western, human name. Stock obscenity substring-matches short
 * roots, so it false-positives on real names ("Dickson" -> dick, "Anushka" -> anus, "Shitij" ->
 * shit, "Sexton" -> sex). Blocking a real person's name is worse than letting some evasion slip,
 * and skews against non-Western names. So we:
 *   1. Keep hard profanity + slurs UNBOUNDED (fuck, cunt, bitch, nigger, faggot, whore, pussy...)
 *      so compounds like "fuckface" still match; these almost never appear inside real names.
 *   2. Re-add the name-colliding SHORT roots as WORD-BOUNDARY-bounded patterns (|dick|), so they
 *      only match as standalone words, not buried inside "Dickson"/"Anushka".
 *   3. Re-block common profane COMPOUNDS of those bounded roots ("dickhead", "asshole",
 *      "bullshit") via a leet-normalized substring pass, since boundary-binding the root would
 *      otherwise let them through.
 *   4. Keep a tiny ALLOW_LIST escape hatch for residual false positives ("fukuda").
 *
 * This is POLICY, not a security boundary (like reserved-slugs.ts). It is best-effort: spaced-out
 * evasion in a name ("f.u.c.k") and a root buried mid-token ("DemonDick420") can slip; the lists
 * below are expected to GROW as cases are reported. Calibrated to FP 0 / FN 0 on a 40+/26 name vs
 * profanity sample (see profanity.test.ts). Authoritative use is server-side only
 * (updateDisplayNameAction); never import this from a client component (it pulls obscenity).
 */
import {
  DataSet,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
  RegExpMatcher,
} from "obscenity";

// Short profane roots that also appear inside legitimate names/surnames. Re-added boundary-bound.
const NAME_COLLIDING_ROOTS = [
  "anal", "anus", "ass", "boob", "cock", "cum", "dick", "fag", "homo", "negro",
  "penis", "piss", "prick", "scat", "sex", "shit", "tit", "turd", "wank", "hooker",
] as const;

const BOUNDED_PATTERNS: Record<(typeof NAME_COLLIDING_ROOTS)[number], ReturnType<typeof pattern>> =
  {
    anal: pattern`|anal|`, anus: pattern`|anus|`, ass: pattern`|ass|`, boob: pattern`|boob|`,
    cock: pattern`|cock|`, cum: pattern`|cum|`, dick: pattern`|dick|`, fag: pattern`|fag|`,
    homo: pattern`|homo|`, negro: pattern`|negro|`, penis: pattern`|penis|`, piss: pattern`|piss|`,
    prick: pattern`|prick|`, scat: pattern`|scat|`, sex: pattern`|sex|`, shit: pattern`|shit|`,
    tit: pattern`|tit|`, turd: pattern`|turd|`, wank: pattern`|wank|`, hooker: pattern`|hooker|`,
  };

const roots = new Set<string>(NAME_COLLIDING_ROOTS);
let tuned = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .removePhrasesIf((phrase) => roots.has(phrase.metadata?.originalWord ?? ""));
for (const word of NAME_COLLIDING_ROOTS) {
  tuned = tuned.addPhrase((phrase) =>
    phrase.setMetadata({ originalWord: word }).addPattern(BOUNDED_PATTERNS[word]),
  );
}

const matcher = new RegExpMatcher({
  ...tuned.build(),
  ...englishRecommendedTransformers,
});

// Common profane compounds of the bounded roots, caught via a leet-normalized substring pass.
const COMPOUNDS = [
  "dickhead", "dickwad", "dickface", "cockhead", "cocksucker", "cockface", "asshole", "asshat",
  "assface", "assclown", "dumbass", "jackass", "shithead", "shitface", "shithole", "dipshit",
  "bullshit", "horseshit", "batshit", "cumshot", "faggot", "faggy", "titties", "titty",
];

// Residual false positives the bounded matcher still flags (real names). Grows as reported.
const ALLOW_LIST = new Set(["fukuda"]);

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", $: "s", "@": "a", "!": "i", "|": "l",
};

// Lowercase, fold common leet glyphs, then strip to [a-z0-9] so "a$$hole"/"bullsh1t" collapse to
// the compound spelling. Used ONLY for the compound substring pass (obscenity handles the rest).
function normalizeForCompounds(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[0134578$@!|]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z0-9]+/g, "");
}

/** True when a display name contains disallowed profanity/slurs. Best-effort policy, server-side. */
export function containsProfanity(text: string): boolean {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return false;
  if (ALLOW_LIST.has(trimmed.toLowerCase())) return false;
  if (matcher.hasMatch(trimmed)) return true;
  const normalized = normalizeForCompounds(trimmed);
  return COMPOUNDS.some((compound) => normalized.includes(compound));
}
