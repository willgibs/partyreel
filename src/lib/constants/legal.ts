import type { ReactNode } from "react";

/**
 * THE LEGAL SINGLE-SOURCE (the legal round, 2026-09-01): version, date, status
 * and the launch placeholders for /privacy and /terms live HERE and nowhere
 * else, so the launch pass fills one constant and flips one flag.
 *
 * ★ ENV-FREE ON PURPOSE. This module (and the two content modules that import
 * it) is read by the node Vitest project, where `lib/env` throws. Never import
 * `constants/site.ts` here; the support address is not printed in the legal
 * text, `/contact` is linked instead, and the privacy inbox is its own constant.
 *
 * ★ THE PLACEHOLDERS ARE BRACKETED SO A TEST CAN FIND THEM. `LEGAL_PLACEHOLDER_RE`
 * scans every "In short" summary (never a placeholder there, they are the
 * plain-language register) and, once a document is flipped to `effective`, the
 * WHOLE text. Flipping the status without filling `LEGAL_PARTY` fails CI, which
 * is the launch switch the program keeps unspent until counsel signs.
 */
export type LegalDocId = "privacy" | "terms";
export type LegalStatus = "pending-review" | "effective";

export type LegalDocMeta = {
  id: LegalDocId;
  path: "/privacy" | "/terms";
  title: string;
  /** Matches the footer's FOOTER_LEGAL label (Vitest-pinned). */
  navLabel: string;
  /** Page metadata + the hero subhead. */
  description: string;
  /** The OG card's second line: keep it under ~90 characters (one 30px line). */
  ogKicker: string;
  /** "1.0" and up; bump on any material change, with a new lastUpdated. */
  version: string;
  /** ISO date (YYYY-MM-DD). Feeds the sitemap and the meta line. */
  lastUpdated: string;
  status: LegalStatus;
  /** ISO date once `status` is `effective`; null while pending. */
  effectiveDate: string | null;
};

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocMeta> = {
  privacy: {
    id: "privacy",
    path: "/privacy",
    title: "Privacy Policy",
    navLabel: "Privacy",
    description:
      "How Partyreel collects, uses, stores and deletes your information, what your guests can see, and the choices and rights you have.",
    ogKicker:
      "What we keep, where it lives, who can see it, and how deletion works.",
    // 1.1 (2026-09-02): account deletion became self-serve and immediate, so
    // the "write to support" choice and the newsletter removal both changed.
    version: "1.1",
    lastUpdated: "2026-09-02",
    status: "pending-review",
    effectiveDate: null,
  },
  terms: {
    id: "terms",
    path: "/terms",
    title: "Terms of Service",
    navLabel: "Terms",
    description:
      "The agreement for hosting events and contributing media on Partyreel: your content, plans and billing, retention, acceptable use, and how disputes are handled.",
    ogKicker:
      "Your content, plans and billing, retention, and the rules of the room.",
    // 1.1 (2026-09-02): Ending things is now self-serve, and a deletion
    // cancels an active plan at that moment rather than at period end.
    // 1.2 (2026-09-18): Disclaimers says we may use generative AI for some of
    // our own images and videos.
    version: "1.2",
    lastUpdated: "2026-09-18",
    status: "pending-review",
    effectiveDate: null,
  },
};

/**
 * The launch fill-ins. Bracketed UPPERCASE tokens, replaced in this one place
 * when the entity is formed and counsel has signed (ROADMAP launch checkpoint).
 * `privacyEmail` is a real address by ruling (Will, 2026-09-01); the alias is a
 * launch-checkpoint human task, so the text must not promise a reply from it
 * before then, only name it as the channel.
 */
export const LEGAL_PARTY = {
  entityName: "[ENTITY NAME]",
  state: "[STATE]",
  address: "[ADDRESS]",
  dmcaAgent: "[DMCA AGENT]",
  privacyEmail: "privacy@partyreel.com",
} as const;

export const LEGAL_PLACEHOLDER_RE = /\[[A-Z][A-Z ]+\]/;

/** Day-precision, timezone-proof (the ISO date is a calendar date, not an instant). */
export function formatLegalDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** The meta line under the title: version + status, one string, Inter (the mono ruling). */
export function legalStatusLine(meta: LegalDocMeta): string {
  if (meta.status === "effective" && meta.effectiveDate) {
    return `Version ${meta.version} · Effective ${formatLegalDate(meta.effectiveDate)}`;
  }
  return `Version ${meta.version} · Pending counsel review · Effective on launch`;
}

/** The "Read next" foot of each document: the sibling + the help articles that explain the same ground. */
export const LEGAL_RELATED: Record<
  LegalDocId,
  { label: string; href: string }[]
> = {
  privacy: [
    { label: "Terms of Service", href: "/terms" },
    {
      label: "Your data and deleting your account",
      href: "/help/your-data-and-deleting-your-account",
    },
    { label: "Who can see your event", href: "/help/who-can-see-your-event" },
    { label: "How long media is kept", href: "/help/how-long-media-is-kept" },
  ],
  terms: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Reporting and safety", href: "/help/reporting-and-safety" },
    {
      label: "Storage, plans and limits",
      href: "/help/storage-plans-and-limits",
    },
    { label: "Pricing", href: "/pricing" },
  ],
};

// ── The document model ───────────────────────────────────────────────────────
//
// A document is a list of sections; a section carries TWO registers (the R5
// shell contract, kept): `summary` is the plain-language "In short" line, a
// plain string so tests can scan it; `blocks` is the formal text. Blocks are a
// small typed union rather than free JSX so the renderer owns every class and
// the plain-text walk (reading time, placeholder scans) sees all of it.

export type LegalTableColumn = {
  header: string;
  /** Durations and amounts: rendered mono + tabular (mono holds data, never labels). */
  numeric?: boolean;
};

export type LegalBlock =
  | { kind: "p"; content: ReactNode }
  | { kind: "list"; ordered: boolean; items: ReactNode[] }
  | {
      kind: "table";
      columns: LegalTableColumn[];
      rows: ReactNode[][];
      caption?: string;
    }
  /** An h3 inside the section. Rendered id = `${section.id}-${id}`. */
  | { kind: "sub"; id: string; title: string }
  /** The conspicuous block (disclaimers, liability caps): bordered, ink text, never all-caps. */
  | { kind: "note"; content: ReactNode };

export type LegalSection = {
  /** Stable anchor id (kebab-case). The ToC and every deep link ride it. */
  id: string;
  title: string;
  /** A shorter rail label when the title would wrap the 12rem rail. */
  navLabel?: string;
  /** The plain-language "In short" line. Never a placeholder, never an em-dash. */
  summary: string;
  blocks: LegalBlock[];
};

export const p = (content: ReactNode): LegalBlock => ({ kind: "p", content });
export const ul = (...items: ReactNode[]): LegalBlock => ({
  kind: "list",
  ordered: false,
  items,
});
export const ol = (...items: ReactNode[]): LegalBlock => ({
  kind: "list",
  ordered: true,
  items,
});
export const table = (
  columns: LegalTableColumn[],
  rows: ReactNode[][],
  caption?: string,
): LegalBlock => ({ kind: "table", columns, rows, caption });
export const sub = (id: string, title: string): LegalBlock => ({
  kind: "sub",
  id,
  title,
});
export const note = (content: ReactNode): LegalBlock => ({
  kind: "note",
  content,
});

// Flatten a node to text the way mdx-components' toText does (walk
// props.children), so link text counts and placeholder scans see through
// elements.
function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return nodeText(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

/** Every word of a document as one string: reading time + the CI scans. */
export function legalPlainText(sections: LegalSection[]): string {
  const out: string[] = [];
  for (const section of sections) {
    out.push(section.title, section.summary);
    for (const block of section.blocks) {
      switch (block.kind) {
        case "p":
        case "note":
          out.push(nodeText(block.content));
          break;
        case "list":
          out.push(...block.items.map(nodeText));
          break;
        case "table":
          if (block.caption) out.push(block.caption);
          out.push(...block.columns.map((c) => c.header));
          for (const row of block.rows) out.push(...row.map(nodeText));
          break;
        case "sub":
          out.push(block.title);
          break;
      }
    }
  }
  return out.join(" ");
}

/** Every internal href a document links to (blocks + the related foot), for the link test. */
export function legalHrefs(
  doc: LegalDocId,
  sections: LegalSection[],
): string[] {
  const hrefs = new Set<string>(LEGAL_RELATED[doc].map((l) => l.href));
  const walk = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object" && "props" in node) {
      const props = (
        node as { props: { href?: unknown; children?: ReactNode } }
      ).props;
      if (typeof props.href === "string") hrefs.add(props.href);
      walk(props.children);
    }
  };
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.kind === "p" || block.kind === "note") walk(block.content);
      else if (block.kind === "list") walk(block.items);
      else if (block.kind === "table") block.rows.forEach((r) => walk(r));
    }
  }
  return [...hrefs];
}
