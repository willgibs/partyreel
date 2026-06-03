/**
 * Slug helpers — the single source shared by the media download-filename builder and the
 * custom event-link feature (ADR-0012). Do NOT re-add a local `slugify` elsewhere.
 *
 * Client-safe (only zod + the reserved list), so the host UI imports it directly.
 */
import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs";
import { eventSlugSchema } from "@/lib/validation/event";

/**
 * ASCII slug: lowercase `[a-z0-9-]`, runs collapsed to one hyphen, no leading/trailing
 * hyphen, apostrophes dropped (not hyphenated, so "sarah's" → "sarahs"), capped at `maxLen`.
 * Behavior is byte-for-byte identical to the old download-filename copy this replaced.
 */
export function slugify(input: string, maxLen = 60): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop combining diacritics (é → e)
    .toLowerCase()
    .replace(/['’]/g, "") // apostrophes vanish: "sarah's" → "sarahs"
    .replace(/[^a-z0-9]+/g, "-") // everything else (incl. emoji/spaces) → hyphen
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

// Mirrors eventSlugSchema's max length (validation/event.ts). Suggestions never exceed it.
const SLUG_MAX = 50;

/**
 * A custom-slug SUGGESTION derived from an event name, or null when there's no decent one
 * (too short after slugging, token-shaped, or reserved). The result is guaranteed to satisfy
 * eventSlugSchema's FORMAT — only availability is left to the live check.
 */
export function suggestSlug(name: string): string | null {
  // Slug to the schema's max, then trim a hyphen the slice may have left dangling.
  const s = slugify(name, SLUG_MAX).replace(/-+$/g, "");
  if (s.length < 3) return null;
  if (/^[0-9a-f]{32}$/.test(s)) return null; // token-shaped — never suggest
  if (RESERVED_SLUGS.has(s)) return null;
  return s;
}

/** The synchronous classification of a slug input, before the async availability check. */
export type SlugInputEval =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "current"; normalized: string }
  | { kind: "check"; normalized: string };

/**
 * Pure, synchronous evaluation of what the host typed — the half of the live-availability
 * state machine that needs no network. Empty → idle; a format/reserved/token-shape failure →
 * invalid (with the zod message); equal to the saved slug → current (a no-op, nothing to
 * save); otherwise → check (the caller debounces, then calls check_slug_available). The value
 * is normalized through eventSlugSchema, so `normalized` is what would actually be saved.
 */
export function evaluateSlugInput(
  value: string,
  currentSlug: string | null,
): SlugInputEval {
  if (value.trim() === "") return { kind: "idle" };
  const parsed = eventSlugSchema.safeParse({ slug: value });
  if (!parsed.success) {
    return {
      kind: "invalid",
      message: parsed.error.issues[0]?.message ?? "That custom link isn't valid.",
    };
  }
  const normalized = parsed.data.slug;
  if (currentSlug && normalized === currentSlug.toLowerCase()) {
    return { kind: "current", normalized };
  }
  return { kind: "check", normalized };
}
