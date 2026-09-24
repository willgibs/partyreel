import { BIBLE } from "@/app/(dev)/design/rules/bible";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

/**
 * THE LAB'S LINK GRAMMAR.
 *
 * The registries and the manifests point at things with plain strings: a
 * board's `lives[]` ("docs/systems/guest-flow.md", "src/components/ui/button.tsx"),
 * a manifest's "bible 8", the old "/design/c/<board>#<anchor>". This module
 * turns any of those strings into a typed ref, and a ref into the lab route
 * that renders it (or the file it lives in when nothing renders it). Every
 * page in the shell links through here so a route can move once, in `hrefFor`.
 *
 * Pure and isomorphic on purpose: no node imports, no React, no server-only,
 * so the client sidebar and the server pages share it. The two imports are
 * plain data (the bible and the board registry); the file-exists checks live
 * in links.test.ts, never here.
 *
 * `hrefFor` returns the UNKEYED route; the caller adds `?key=` with
 * `withDesignKey` (src/lib/design-gate/links.ts). NOTE for that caller: a ref
 * with an anchor yields a `#fragment`, and `withDesignKey` appends the query
 * after the whole string, so split the fragment off before keying (or teach
 * `withDesignKey` to insert before `#`); this module does not key links.
 */

export type LabRef =
  /** A bible principle's slug (rules/bible.ts BIBLE[].id). */
  | { kind: "rule"; id: string }
  /** A standing board (touchpoints.ts SandboxId). */
  | { kind: "board"; id: string; anchor?: string }
  /** docs/specs/<slug>.md */
  | { kind: "proposal"; slug: string; anchor?: string }
  /** docs/tracks/<name>.md */
  | { kind: "track"; name: string; anchor?: string }
  /** A repo path with no lab page. */
  | { kind: "source"; file: string; line?: number }
  /** An internal href, as is. */
  | { kind: "page"; href: string }
  | { kind: "external"; url: string };

export type LabRefKind = LabRef["kind"];

const BIBLE_FILE = "src/app/(dev)/design/rules/bible.ts";
const GITHUB_REPO = "https://github.com/willgibs/partyreel";
export const DEFAULT_BRANCH = "launch-prep";

const RULE_BY_N = new Map(BIBLE.map((r) => [r.n, r.id]));
const RULE_N_BY_ID = new Map(BIBLE.map((r) => [r.id, r.n]));
const SANDBOX_IDS = new Set<string>(SANDBOX.map((r) => r.id));

/**
 * The kinds whose anchor is any string. Deliberately NOT a generic helper:
 * called inside a `return`, a generic infers its parameter from the contextual
 * LabRef rather than the argument and fails its own constraint (tsc, not
 * vitest, is what catches that).
 */
type Anchorable = Extract<LabRef, { kind: "board" | "proposal" | "track" }>;

function anchored(ref: Anchorable, anchor: string | undefined): LabRef {
  return anchor ? { ...ref, anchor } : ref;
}

/** Splits "path#fragment" once; a path with no `#` has no fragment. */
function splitFragment(text: string): [string, string | undefined] {
  const at = text.indexOf("#");
  if (at === -1) return [text, undefined];
  const fragment = text.slice(at + 1);
  return [text.slice(0, at), fragment || undefined];
}

/**
 * The string forms the repo already uses, in the order they are tried:
 *   http(s)://…                          external
 *   bible 8 · bible-8 · bible:<id> · rule:<id>   rule (a number is the principle at that n)
 *   board:<id>[#anchor]                  board
 *   /design/c/<id> · /design/lab/<id>    board, when <id> is a standing board; else page
 *   /…                                   page, as is
 *   docs/specs/<slug>.md[#anchor]        proposal
 *   docs/tracks/<name>.md[#anchor]       track
 *   anything else                        source, the text as the file (a
 *                                        `:<line>` or `#L<line>` keeps the line)
 * Whitespace is trimmed and one trailing period stripped, so a path quoted at
 * the end of a sentence still resolves.
 */
export function parseRef(input: string): LabRef {
  const text = input.trim().replace(/\.$/, "");
  if (text === "") return { kind: "source", file: "" };

  if (/^https?:\/\//i.test(text)) return { kind: "external", url: text };

  const rule = text.match(/^(?:bible|rule)[\s:-]+([a-z0-9-]+)$/i);
  if (rule) {
    const token = rule[1].toLowerCase();
    // A number that is not a principle stays as typed ("bible 99" renders as
    // an unknown rule rather than silently becoming a file called "bible 99").
    if (/^\d+$/.test(token))
      return { kind: "rule", id: RULE_BY_N.get(Number(token)) ?? token };
    return { kind: "rule", id: token };
  }

  const board = text.match(/^board:([a-z0-9-]+)(?:#(\S+))?$/i);
  if (board)
    return anchored({ kind: "board", id: board[1].toLowerCase() }, board[2]);

  if (text.startsWith("/")) {
    // The old and the new board URL share one shape; only a standing board is
    // a board ref, so /design/lab/kit and /design/lab/tools/* stay pages.
    const lab = text.match(/^\/design\/(?:c|lab)\/([a-z0-9-]+)(?:#(\S+))?$/);
    if (lab && SANDBOX_IDS.has(lab[1]))
      return anchored({ kind: "board", id: lab[1] }, lab[2]);
    return { kind: "page", href: text };
  }

  const [path, fragment] = splitFragment(text);

  // The directories' READMEs describe the directory; they are not a proposal
  // or a track of their own.
  const spec = path.match(/^docs\/specs\/([^/]+)\.md$/);
  if (spec && spec[1] !== "README")
    return anchored({ kind: "proposal", slug: spec[1] }, fragment);

  const track = path.match(/^docs\/tracks\/([^/]+)\.md$/);
  if (track && track[1] !== "README")
    return anchored({ kind: "track", name: track[1] }, fragment);

  // A path: "path:12" or "path#L12" carries a line; any other fragment is
  // dropped, since a source ref has no anchor to hold it.
  const lineHash = fragment?.match(/^L(\d+)$/);
  const lineColon = path.match(/^(.+?):(\d+)$/);
  if (lineHash) return { kind: "source", file: path, line: Number(lineHash[1]) };
  if (lineColon)
    return { kind: "source", file: lineColon[1], line: Number(lineColon[2]) };
  return { kind: "source", file: path };
}

/** The unkeyed lab route that renders the ref; null when only a file does. */
export function hrefFor(ref: LabRef): string | null {
  const hash = (anchor: string | undefined) => (anchor ? `#${anchor}` : "");
  switch (ref.kind) {
    case "rule":
      return `/design/library/rules#${ref.id}`;
    case "board":
      return `/design/lab/${ref.id}${hash(ref.anchor)}`;
    case "proposal":
      return `/design/lab/proposals/${ref.slug}${hash(ref.anchor)}`;
    case "track":
      return `/design/lab/tracks/${ref.name}${hash(ref.anchor)}`;
    case "page":
      return ref.href;
    case "source":
    case "external":
      return null;
  }
}

/**
 * A short label from the ref's own identity (the page renders titles from its
 * data; this is the chip text and the fallback). A principle reads as it is
 * said aloud, "bible 8", when the id is in the bible.
 */
export function labelFor(ref: LabRef): string {
  const hash = (anchor: string | undefined) => (anchor ? `#${anchor}` : "");
  switch (ref.kind) {
    case "rule": {
      const n = RULE_N_BY_ID.get(ref.id);
      return n === undefined ? `rule ${ref.id}` : `bible ${n}`;
    }
    case "board":
      return `board ${ref.id}${hash(ref.anchor)}`;
    case "proposal":
      return `proposal ${ref.slug}${hash(ref.anchor)}`;
    case "track":
      return `lp/${ref.name}${hash(ref.anchor)}`;
    case "source":
      return ref.line === undefined ? ref.file : `${ref.file}:${ref.line}`;
    case "page":
      return ref.href;
    case "external":
      return ref.url.replace(/^https?:\/\//i, "");
  }
}

/** The repo-relative file a ref points at; null for a page or a URL. */
export function fileFor(ref: LabRef): string | null {
  switch (ref.kind) {
    case "rule":
      return BIBLE_FILE;
    case "board":
      // A standing board's page IS its file set (sandbox/<id>/), so the board
      // ref has no single file.
      return null;
    case "proposal":
      return `docs/specs/${ref.slug}.md`;
    case "track":
      return `docs/tracks/${ref.name}.md`;
    case "source":
      return ref.file || null;
    case "page":
    case "external":
      return null;
  }
}

/**
 * The kinds whose GitHub blob is worth offering: the ones whose lab page
 * renders a file a reader may want to edit or cite at a line. A principle has
 * a lab page that is the better destination.
 */
const GITHUB_KINDS = new Set<LabRefKind>(["source", "proposal", "track"]);

/** The blob URL on GitHub, `#L<line>` when the ref carries a line. */
export function githubFor(
  ref: LabRef,
  branch: string = DEFAULT_BRANCH,
): string | null {
  if (!GITHUB_KINDS.has(ref.kind)) return null;
  const file = fileFor(ref);
  if (!file) return null;
  const line = ref.kind === "source" ? ref.line : undefined;
  return `${GITHUB_REPO}/blob/${branch}/${file}${line ? `#L${line}` : ""}`;
}

/** The editor deep link, `vscode://file<root>/<file>:<line>`, for any ref with a file. */
export function editorFor(ref: LabRef, repoRoot: string): string | null {
  const file = fileFor(ref);
  if (!file) return null;
  const root = repoRoot.replace(/\/+$/, "");
  const line = ref.kind === "source" ? ref.line : undefined;
  return `vscode://file${root}/${file}${line ? `:${line}` : ""}`;
}
