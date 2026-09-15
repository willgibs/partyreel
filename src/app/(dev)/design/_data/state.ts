/**
 * THE LAB'S URL STATE (the Library x Lab round, 2026-09-15): one small param
 * model, so a link is an exact view.
 *
 * A board's page-wide switches used to live only in React state, which meant
 * "look at candidate B on the phone canvas" was a sentence rather than a link,
 * and an interrupted review lost its place. Six params fix that, and six is
 * the whole vocabulary on purpose: a seventh belongs here or nowhere, never
 * in a page's own ad-hoc query.
 *
 *   key        the gate key (src/lib/design-gate)
 *   canvas     the stage a specimen is read at ("phone", "tablet", "1440")
 *   ground     the ground it is read on ("light", "dark")
 *   candidate  which candidate a board is showing ("a", "b", ...)
 *   s          the section or specimen in view ("palette-ramp")
 *   session    the desk's review position, "<board>.<ask>"
 *
 * STICKY vs LOCAL is the whole contract. `key`, `canvas` and `ground` say HOW
 * you are reading and ride every internal link, so flipping to the next board
 * keeps the phone canvas you set. `candidate`, `s` and `session` say WHERE you
 * are on ONE page: candidate "b" means nothing on the next board and a section
 * id is page-scoped, so they are dropped the moment a link leaves the page.
 * (Before this, `withDesignKey` carried the key and nothing else; it is still
 * the primitive underneath, and this module is the only caller the chrome
 * needs.)
 *
 * Pure and isomorphic: no React, no node, no `server-only`. The chrome reads
 * the live state through the shell context; a board reads it through the kit.
 */

export const LAB_PARAMS = [
  "key",
  "canvas",
  "ground",
  "candidate",
  "s",
  "session",
] as const;

export type LabParam = (typeof LAB_PARAMS)[number];
export type LabState = Partial<Record<LabParam, string>>;

/** How you are reading: carried onto every internal lab link. */
export const STICKY_PARAMS: readonly LabParam[] = ["key", "canvas", "ground"];

/** Where you are on ONE page: carried only when the link stays on that page. */
export const LOCAL_PARAMS: readonly LabParam[] = ["candidate", "s", "session"];

const IS_PARAM = new Set<string>(LAB_PARAMS);

function isParam(name: string): name is LabParam {
  return IS_PARAM.has(name);
}

/** The state a query string carries; unknown params and empty values are dropped. */
export function readLabState(
  search: URLSearchParams | string | null | undefined,
): LabState {
  if (!search) return {};
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const state: LabState = {};
  for (const name of LAB_PARAMS) {
    const value = params.get(name);
    if (value) state[name] = value;
  }
  return state;
}

/** `?canvas=phone&key=…`, in LAB_PARAMS order so two equal states read alike. */
export function labSearchString(state: LabState): string {
  const params = new URLSearchParams();
  for (const name of LAB_PARAMS) {
    const value = state[name];
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

type Split = { path: string; search: string; hash: string };

/** Splits an href into its three pieces; a relative href needs no base. */
function split(href: string): Split {
  const hashAt = href.indexOf("#");
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  const rest = hashAt === -1 ? href : href.slice(0, hashAt);
  const queryAt = rest.indexOf("?");
  return queryAt === -1
    ? { path: rest, search: "", hash }
    : { path: rest.slice(0, queryAt), search: rest.slice(queryAt), hash };
}

/** The pathname of an href, with no query and no fragment. */
export function pathOf(href: string): string {
  return split(href).path;
}

/**
 * Merges `state` into an href. The href's OWN params win (a link that already
 * says `candidate=c` means it), unknown params it carries are preserved, and
 * the query lands before the fragment, which is the whole reason this is not
 * string concatenation: `/design/lab/palette#ramp?key=x` 404s at the gate.
 */
export function applyLabState(href: string, state: LabState): string {
  // An absolute URL is someone else's; nothing of ours belongs on it.
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return href;
  const { path, search, hash } = split(href);
  const params = new URLSearchParams(search);
  for (const name of LAB_PARAMS) {
    const value = state[name];
    if (value && !params.has(name)) params.set(name, value);
  }
  // Rebuilt in LAB_PARAMS order, with anything the href brought kept after.
  const ordered = new URLSearchParams();
  for (const name of LAB_PARAMS) {
    const value = params.get(name);
    if (value) ordered.set(name, value);
  }
  for (const [name, value] of params)
    if (!isParam(name)) ordered.append(name, value);
  const query = ordered.toString();
  return `${path}${query ? `?${query}` : ""}${hash}`;
}

/**
 * What every link in the chrome does: carry the sticky params always, and the
 * local ones only when the destination is the page you are already on (a table
 * of contents link, a specimen's own anchor). `from` is the live state,
 * `fromPath` the live pathname.
 */
export function carryLabState(
  href: string,
  from: LabState,
  fromPath: string,
): string {
  const keep: LabState = {};
  for (const name of STICKY_PARAMS) if (from[name]) keep[name] = from[name];
  if (pathOf(href) === fromPath || pathOf(href) === "")
    for (const name of LOCAL_PARAMS) if (from[name]) keep[name] = from[name];
  return applyLabState(href, keep);
}

/** The same state with one param set, or removed when the value is null. */
export function withLabParam(
  state: LabState,
  name: LabParam,
  value: string | null,
): LabState {
  const next = { ...state };
  if (value) next[name] = value;
  else delete next[name];
  return next;
}

/** The absolute URL of the current view, for CopyLink and a pasted handoff. */
export function labUrl(
  origin: string,
  pathname: string,
  state: LabState,
  hash = "",
): string {
  return `${origin}${pathname}${labSearchString(state)}${hash}`;
}

// ── The keyboard contract ────────────────────────────────────────────────────

/**
 * ONE LISTENER, ONE VOCABULARY (the Library x Lab round). The shell binds the
 * window once and dispatches; a page never adds its own window listener, or
 * two boards fight over `]`. The desk's review session owns what a digit MEANS
 * (it picks an option); it registers a handler and this decides WHEN a digit is
 * a command at all.
 *
 *   cmd/ctrl+K, or `/`   the command palette
 *   [ and ]              the previous and next page in the section
 *   1..9                 pick the nth option in a review session
 *   ?                    the shortcuts, shown in the palette's footer
 */
export type LabCommand =
  | { kind: "palette" }
  | { kind: "prev" }
  | { kind: "next" }
  | { kind: "digit"; n: number };

/** The shape `commandFor` needs, so it is testable without a DOM. */
export type LabKeyEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  /** An element, when there is one; `isTypingTarget` decides what it means. */
  target?: unknown;
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * True while the reader is typing, so a bare key is a character and never a
 * command. A contenteditable counts; so does an element that has opted out
 * with `data-lab-keys="off"` (a board's own canvas, a code editor).
 */
export function isTypingTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as {
    tagName?: unknown;
    isContentEditable?: unknown;
    closest?: (selector: string) => unknown;
  };
  if (typeof el.tagName === "string" && TYPING_TAGS.has(el.tagName))
    return true;
  if (el.isContentEditable === true) return true;
  return typeof el.closest === "function"
    ? el.closest('[data-lab-keys="off"]') !== null
    : false;
}

/** The command a key event means, or null when it means nothing to the lab. */
export function commandFor(e: LabKeyEvent): LabCommand | null {
  // The palette's chord works while typing: it is how you leave a field.
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k")
    return { kind: "palette" };
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (isTypingTarget(e.target)) return null;
  if (e.key === "/") return { kind: "palette" };
  if (e.key === "[") return { kind: "prev" };
  if (e.key === "]") return { kind: "next" };
  if (/^[1-9]$/.test(e.key)) return { kind: "digit", n: Number(e.key) };
  return null;
}

/** What the palette's footer and the shortcuts list read from. */
export const LAB_SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "⌘K", does: "Search everything" },
  { keys: "[", does: "Previous page" },
  { keys: "]", does: "Next page" },
  { keys: "1 to 9", does: "Pick an option in a review" },
];
