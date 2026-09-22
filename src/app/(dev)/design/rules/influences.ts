import "server-only";

import {
  DOCS,
  headingsOf,
  inlineText,
  landminesOf,
  listRulings,
  listSpecs,
  readDoc,
  sectionOf,
} from "@/app/(dev)/design/_data/docs";
import { POLICY_VIEWS } from "@/app/(dev)/design/_data/policies";
import {
  type Surface,
  RULINGS,
  SURFACE_LABEL,
} from "@/app/(dev)/design/touchpoints";

import { BIBLE, type BibleRule } from "./bible";
import {
  componentTitle,
  CONTRACTED,
  INDEXED,
  type ComponentRecord,
  type PolicyScope,
} from "./rules";

/**
 * EVERYTHING THAT INFLUENCES DESIGN WORK, IN ONE REGISTRY (the Library x Lab
 * round, 2026-09-15; Will's ruling the same day: "the goal is for the library
 * to represent our entire working rule set so that everything influencing new
 * agents' design work is visible to both me as a human, you as an
 * orchestrator, and new agents. This removes any hidden influences from my
 * sight").
 *
 * Before this file, an agent in a worktree met the law as a pile of unequal
 * things: twenty-two rules in a TS module, contracts hidden in test headers,
 * fourteen policy tests nobody listed, program principles in a rulebook,
 * precedent in two system docs, and Will's own rulings in memory files OUTSIDE
 * the repo, which a worktree cannot see at all. They all read the same: as
 * "the rules". Half of them do not bind, and an agent that obeys all of them
 * builds the "incredibly repetitive" designs of the 2026-09-12 ruling.
 *
 * So each influence carries its LEVEL, and the level says whether it binds.
 * The definition of each level is written in exactly ONE place,
 * `docs/design/README.md#what-binds-you`; `LEVELS` below carries the badge and
 * the one line, and `influences.test.ts` holds the two together, so the prose
 * a human reads and the badge an agent sees can never disagree.
 *
 * `server-only`: the markdown-backed halves (rulings, guidance, the program
 * principles, the doctrine chapters, the landmines) are read at request time
 * through `_data/docs.ts`. A client component that needs a level's badge
 * imports LEVELS' shape from a server page's props, never this module.
 */

// ── The levels ───────────────────────────────────────────────────────────────

export type Level =
  | "law"
  | "contract"
  | "policy"
  | "program"
  | "guidance"
  | "precedent"
  | "proposal"
  | "ruling"
  | "landmine";

/** Where an influence reaches. */
export type Scope = "global" | "surface" | "component" | "board" | "wave";

/** What kind of file the influence lives in. */
export type InfluenceSource = "ts" | "test" | "md" | "skill";

export type InfluenceAuthor = "Will" | "agent" | "third-party";

export type LevelDef = {
  id: Level;
  /** The mark a row wears. `★` for a landmine, the word otherwise. */
  badge: string;
  /** The level in one line, the same sentence as the README's table. */
  line: string;
  /** Does it bind in an exploration? The README's fourth column. */
  binds: string;
  /** Strong marks are the two that bind unconditionally. */
  weight: "binds" | "conditional" | "informs";
};

/**
 * The nine levels, in authority order. The `line` and `binds` text is the
 * README's table, verbatim in meaning; the test holds the ids and the order
 * against it so a new level cannot be invented here (a level is added only by
 * Will's ruling, which edits the README first).
 */
export const LEVELS: LevelDef[] = [
  {
    id: "law",
    badge: "LAW",
    line: "The bible: Will's rules, the whole of the design law.",
    binds:
      "Always. A rule under exploration on your board is yours to rewrite; a retiring rule is read, not obeyed.",
    weight: "binds",
  },
  {
    id: "contract",
    badge: "CONTRACT",
    line: "A component's functional guards (a test opening @contract-for), never its look.",
    binds: "For every component under a path you own.",
    weight: "binds",
  },
  {
    id: "policy",
    badge: "POLICY",
    line: "An agent-written test that holds a line across the tree (a test opening @policy).",
    binds:
      "Mechanically; provisional, so a policy that blocks better work is a finding.",
    weight: "conditional",
  },
  {
    id: "program",
    badge: "PROGRAM",
    line: "How a round works: lanes, light QA, unlimited resources, rising tides, nothing protected.",
    binds: "As process.",
    weight: "conditional",
  },
  {
    id: "guidance",
    badge: "GUIDANCE",
    line: "The craft stack and the skills: the default you depart from on purpose.",
    binds: "No; a departure is flagged on the board.",
    weight: "informs",
  },
  {
    id: "precedent",
    badge: "PRECEDENT",
    line: "What shipped and why it is shaped so (the system docs' chapters).",
    binds: "No; rebuild it in a better exploration and say what you broke.",
    weight: "informs",
  },
  {
    id: "proposal",
    badge: "PROPOSAL",
    line: "A board's argument (docs/specs/<board>.md); not law until Will rules.",
    binds: "No; read the other boards' before you contradict them.",
    weight: "informs",
  },
  {
    id: "ruling",
    badge: "RULING",
    line: "What Will said, verbatim and dated.",
    binds:
      "No; history. When a ruling and the bible disagree, the bible is wrong and that is a finding.",
    weight: "informs",
  },
  {
    id: "landmine",
    badge: "★",
    line: "A silent breakage if reverted; never a design decision.",
    binds: "Know it before you touch its surface.",
    weight: "conditional",
  },
];

export const LEVEL_BY_ID: Record<Level, LevelDef> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
) as Record<Level, LevelDef>;

export const LEVEL_ORDER: Level[] = LEVELS.map((l) => l.id);

// ── An influence ─────────────────────────────────────────────────────────────

export type Influence = {
  /** Unique across the registry: `<level>:<local id>`. */
  id: string;
  title: string;
  level: Level;
  scope: Scope;
  source: InfluenceSource;
  author: InfluenceAuthor;
  /** One or two sentences: what it says, not why it exists. */
  summary: string;
  /** The lab route (or `#anchor`) where a reader meets it. */
  visibleAt: string;
  /** ISO date, where the thing is dated. */
  ruledOn?: string;
  /** Repo-relative paths that hold the line, or the file it lives in. */
  enforces?: string[];
  /** The surface it reaches, when it reaches one. */
  surface?: Surface;
  /** The path prefixes it covers, for a contract. */
  paths?: string[];
};

/** The first sentence of a markdown block, inline syntax rendered out. */
function firstSentence(markdown: string, max = 240): string {
  const prose = markdown
    .split("\n")
    .filter((l) => !/^\s*(?:[#>|]|```|~~~)/.test(l))
    .join(" ")
    .trim();
  const flat = inlineText(prose).replace(/\s+/g, " ");
  const end = flat.search(/[.:;](?:\s|$)/);
  const one = end === -1 ? flat : flat.slice(0, end + 1);
  return one.length > max ? `${one.slice(0, max - 1).trimEnd()}…` : one;
}

// ── The eight builders ───────────────────────────────────────────────────────

/** LAW: the bible, hand-authored by Will, the only level that always binds. */
function lawInfluences(): Influence[] {
  return BIBLE.map((rule) => ({
    id: `law:${rule.id}`,
    title: `${rule.n}. ${rule.statement}`,
    level: "law" as const,
    scope: "global" as const,
    source: "ts" as const,
    author: "Will" as const,
    summary: rule.why,
    visibleAt: `/design/library/rules/${rule.id}`,
    ruledOn: rule.ruledOn,
    enforces: rule.enforcedBy === "review" ? [] : rule.enforcedBy,
  }));
}

/** CONTRACT: one per component, not one per it(); the titles live on the component. */
function contractInfluences(): Influence[] {
  return CONTRACTED.map((c: ComponentRecord) => ({
    id: `contract:${c.id}`,
    title: componentTitle(c),
    level: "contract" as const,
    scope: "component" as const,
    source: "test" as const,
    author: "agent" as const,
    summary: `${c.contracts.length} functional guard${
      c.contracts.length === 1 ? "" : "s"
    }: structure, accessibility, single sources, the engine. Never its look.`,
    visibleAt: `/design/library/${c.id}#contracts`,
    enforces: [...new Set(c.contracts.map((k) => k.file))].sort(),
    paths: [c.file],
  }));
}

/** A design policy reaches a surface; a global one reaches everything. */
const SCOPE_OF_POLICY: Record<PolicyScope, Scope> = {
  global: "global",
  marketing: "surface",
  guest: "surface",
  host: "surface",
  shared: "surface",
  lab: "surface",
  engineering: "global",
};

const SURFACE_OF_POLICY: Partial<Record<PolicyScope, Surface>> = {
  marketing: "marketing",
  guest: "guest",
  host: "host",
  shared: "shared",
};

/** POLICY: the `@policy:` tests, provisional because an agent wrote each one. */
function policyInfluences(): Influence[] {
  return POLICY_VIEWS.map((p) => ({
    id: `policy:${p.id}`,
    title: p.title,
    level: "policy" as const,
    scope: SCOPE_OF_POLICY[p.scope],
    source: "test" as const,
    author: "agent" as const,
    summary: `Refuses ${p.summary}`,
    visibleAt: `/design/library/policies#${p.id}`,
    enforces: [p.file],
    surface: SURFACE_OF_POLICY[p.scope],
  }));
}

const PROGRAM_PRINCIPLES = "Program principles";

/** PROGRAM: the `###` principles under PROGRAM.md's own heading, by anchor. */
function programInfluences(): Influence[] {
  const { body } = readDoc(DOCS.program.path);
  const headings = headingsOf(body, 3);
  const at = headings.findIndex(
    (h) => h.depth === 2 && h.text === PROGRAM_PRINCIPLES,
  );
  if (at === -1) return [];
  const chapter = headings[at];
  const principles = [];
  for (const h of headings.slice(at + 1)) {
    if (h.depth <= 2) break;
    principles.push(h);
  }
  // The chapter's own heading stands in while PROGRAM.md still writes the
  // principles as one prose block: the rule layer must not need the rulebook
  // to be shaped a particular way before it can index it.
  const rows = principles.length > 0 ? principles : [chapter];
  return rows.map((h) => ({
    id: `program:${h.id}`,
    title: h.text,
    level: "program" as const,
    scope: "global" as const,
    source: "md" as const,
    author: "Will" as const,
    summary: firstSentence(
      (sectionOf(body, h.id) ?? "").split("\n").slice(1).join("\n"),
    ),
    visibleAt: `/design/library/doctrine/program#${h.id}`,
  }));
}

const GUIDANCE_FILE = "docs/design/guidance.md";

/** GUIDANCE: the craft stack and the skills, by chapter. */
function guidanceInfluences(): Influence[] {
  let body: string;
  try {
    body = readDoc(GUIDANCE_FILE).body;
  } catch {
    return [];
  }
  return headingsOf(body, 2)
    .filter((h) => h.depth === 2)
    .map((h) => ({
      id: `guidance:${h.id}`,
      title: h.text,
      level: "guidance" as const,
      scope: "global" as const,
      source: "md" as const,
      author: "agent" as const,
      summary: firstSentence(
        (sectionOf(body, h.id) ?? "").split("\n").slice(1).join("\n"),
      ),
      visibleAt: `/design/library/guidance#${h.id}`,
    }));
}

const PRECEDENT_DOCS = [
  { doc: "design-system", surface: "shared" as Surface },
  { doc: "marketing-content", surface: "marketing" as Surface },
] as const;

/** PRECEDENT: the two system docs' chapters. What shipped, not what binds. */
function precedentInfluences(): Influence[] {
  const out: Influence[] = [];
  for (const { doc, surface } of PRECEDENT_DOCS) {
    const { body } = readDoc(DOCS[doc].path);
    for (const h of headingsOf(body, 2)) {
      if (h.depth !== 2) continue;
      out.push({
        id: `precedent:${doc}/${h.id}`,
        title: h.text,
        level: "precedent",
        scope: "surface",
        source: "md",
        author: "agent",
        summary: firstSentence(
          (sectionOf(body, h.id) ?? "").split("\n").slice(1).join("\n"),
        ),
        visibleAt: `/design/library/doctrine/${doc}#${h.id}`,
        surface,
      });
    }
  }
  return out;
}

/** PROPOSAL: a board's settled argument under docs/specs. */
function proposalInfluences(): Influence[] {
  return listSpecs().map((s) => ({
    id: `proposal:${s.slug}`,
    title: s.title,
    level: "proposal" as const,
    scope: "board" as const,
    source: "md" as const,
    author: "agent" as const,
    summary:
      s.status === null
        ? "A board's argument; not law until Will rules on it."
        : inlineText(s.status),
    visibleAt: `/design/lab/proposals/${s.slug}`,
  }));
}

/**
 * RULING: two halves combined. Will's dated words and the board record's
 * line per decided touchpoint.
 */
function rulingInfluences(): Influence[] {
  const spoken: Influence[] = listRulings().map((h) => {
    const [date] = h.text.split(" · ");
    return {
      id: `ruling:${h.id}`,
      title: h.text,
      level: "ruling",
      scope: "global",
      source: "md",
      author: "Will",
      summary: firstSentence(
        (sectionOf(readDoc("docs/design/rulings.md").body, h.id) ?? "")
          .split("\n")
          .slice(1)
          .join("\n"),
      ),
      visibleAt: `/design/library/rulings#${h.id}`,
      ruledOn: /^\d{4}-\d{2}(-\d{2})?$/.test(date.trim())
        ? date.trim()
        : undefined,
    };
  });
  const recorded: Influence[] = RULINGS.map((r) => ({
    id: `ruling:record/${r.id}`,
    title: r.title,
    level: "ruling",
    scope: r.board ? "board" : "surface",
    source: "ts",
    author: "Will",
    summary: r.why,
    visibleAt: r.board ? `/design/lab/${r.id}` : "/design/library/rulings",
    ruledOn: /^\d{4}-\d{2}-\d{2}$/.test(r.ruled) ? r.ruled : undefined,
    surface: r.surface,
    enforces: r.lives,
  }));
  return [...spoken, ...recorded];
}

/** LANDMINE: a ★ block in a system doc. A trap, never a decision. */
function landmineInfluences(): Influence[] {
  const out: Influence[] = [];
  for (const { doc, surface } of PRECEDENT_DOCS) {
    const { body } = readDoc(DOCS[doc].path);
    landminesOf(body).forEach((mine, i) => {
      out.push({
        id: `landmine:${doc}/${i + 1}`,
        title: firstSentence(mine.text, 120) || `★ under ${mine.under}`,
        level: "landmine",
        scope: "surface",
        source: "md",
        author: "agent",
        summary: firstSentence(mine.text, 400),
        visibleAt: `/design/library/policies#landmines`,
        surface,
      });
    });
  }
  return out;
}

// ── The registry ─────────────────────────────────────────────────────────────

/**
 * Every influence, in level order. Built per request (the markdown halves are
 * read from disk) and memoised nowhere on purpose: `readDoc` is already
 * request-cached, and the lab's pages are dynamic.
 */
export function influences(): Influence[] {
  const all = [
    ...lawInfluences(),
    ...contractInfluences(),
    ...policyInfluences(),
    ...programInfluences(),
    ...guidanceInfluences(),
    ...precedentInfluences(),
    ...proposalInfluences(),
    ...rulingInfluences(),
    ...landmineInfluences(),
  ];
  return all.sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
      a.id.localeCompare(b.id),
  );
}

export function influencesByLevel(): [LevelDef, Influence[]][] {
  const all = influences();
  return LEVELS.map(
    (level) =>
      [level, all.filter((i) => i.level === level.id)] as [
        LevelDef,
        Influence[],
      ],
  );
}

// ── What binds one piece of work ─────────────────────────────────────────────

export type BindsQuery = {
  /** The board id, when the work is an exploration. */
  board?: string | null;
  /** The surface the work touches. */
  surface?: Surface | null;
  /** The track's owned path prefixes, from its manifest. */
  ownedPaths?: string[];
};

export type LawBind = {
  rule: BibleRule;
  influence: Influence;
  /** The rule is `under exploration: <this board>`: yours to rewrite. */
  yours: boolean;
  /** The rule is `retiring:`: read it, do not obey it. */
  retiring: boolean;
};

export type Binds = {
  board: string | null;
  surface: Surface | null;
  ownedPaths: string[];
  law: LawBind[];
  contracts: Influence[];
  policies: Influence[];
  program: Influence[];
  landmines: Influence[];
  /** The strip's one line. */
  summary: string;
};

function statusTrack(rule: BibleRule, kind: string): string | null {
  const status = rule.status ?? "";
  return status.startsWith(`${kind}: `) ? status.slice(kind.length + 2) : null;
}

const covers = (prefix: string, path: string) =>
  path === prefix ||
  path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);

/**
 * THE BINDS STRIP: what this board, or this track, actually obeys. The answer
 * an agent needs in one place, and the reason this registry exists: the law
 * (with the rules this board is writing marked as its own to rewrite), the
 * contracts of the components it owns, the policies in its scope, the program
 * rules, and the landmines on its surface. Everything else in the registry is
 * deliberately absent: guidance, precedent, proposals and rulings inform, and
 * an agent that reads them as rules builds small.
 */
export function bindsFor(query: BindsQuery = {}): Binds {
  const board = query.board ?? null;
  const surface = query.surface ?? null;
  const ownedPaths = query.ownedPaths ?? [];
  const all = influences();
  const byId = new Map(all.map((i) => [i.id, i]));

  const law: LawBind[] = BIBLE.map((rule) => ({
    rule,
    influence: byId.get(`law:${rule.id}`)!,
    yours: board !== null && statusTrack(rule, "under exploration") === board,
    retiring: statusTrack(rule, "retiring") !== null,
  }));

  const contracts = all.filter(
    (i) =>
      i.level === "contract" &&
      (i.paths ?? []).some((p) => ownedPaths.some((own) => covers(own, p))),
  );

  const policies = all.filter(
    (i) =>
      i.level === "policy" &&
      (i.scope === "global" || surface === null || i.surface === surface),
  );

  const program = all.filter((i) => i.level === "program");
  const landmines = all.filter(
    (i) =>
      i.level === "landmine" && (surface === null || i.surface === surface),
  );

  const yours = law.filter((l) => l.yours).length;
  const parts = [
    `${law.length} laws${yours ? `, ${yours} yours to rewrite` : ""}`,
    `${contracts.length} contracts`,
    `${policies.length} policies`,
    `${program.length} program rules`,
    `${landmines.length} landmines${
      surface ? ` on ${SURFACE_LABEL[surface].toLowerCase()}` : ""
    }`,
  ];

  return {
    board,
    surface,
    ownedPaths,
    law,
    contracts,
    policies,
    program,
    landmines,
    summary: `${parts.join("; ")}.`,
  };
}

// ── The health strip ─────────────────────────────────────────────────────────

export type HealthFinding = {
  id: string;
  label: string;
  count: number;
  /** What the number means, and what to do when it is not zero. */
  note: string;
  items: string[];
  visibleAt: string;
};

/**
 * WHAT THE RULE SET IS MISSING, computed rather than remembered. Every entry
 * is a gap a person would otherwise have to notice: a component nobody wrote a
 * contract for, a rule only a human review holds, a policy no rule cites (an
 * agent's habit wearing a rule's badge), a spec whose board already landed.
 * Zero is the goal for none of them; the point is that the number is visible.
 */
export function health(): HealthFinding[] {
  const all = influences();
  const contracted = new Set(CONTRACTED.map((c) => c.id));
  const uncontracted = INDEXED.filter((c) => !contracted.has(c.id));
  const reviewOnly = BIBLE.filter((r) => r.enforcedBy === "review");
  const uncited = POLICY_VIEWS.filter(
    (p) => p.scope !== "engineering" && p.citedBy.length === 0,
  );
  const exploring = BIBLE.filter((r) =>
    r.status?.startsWith("under exploration"),
  );
  const retiring = BIBLE.filter((r) => r.status?.startsWith("retiring"));
  const proposals = all.filter((i) => i.level === "proposal");
  const openBoards = new Set<string>(
    RULINGS.filter((r) => r.board).map((r) => r.id),
  );
  const landed = proposals.filter(
    (p) => !openBoards.has(p.id.replace("proposal:", "")),
  );

  return [
    {
      id: "review-only",
      label: "rules held at review only",
      count: reviewOnly.length,
      note: "No test checks any of it. A human eye is the whole enforcement, so the rule drifts silently between reviews.",
      items: reviewOnly.map((r) => `bible ${r.n}: ${r.statement}`),
      visibleAt: "/design/library/rules",
    },
    {
      id: "uncited-policies",
      label: "design policies no rule cites",
      count: uncited.length,
      note: "A policy nothing points at is an agent's habit wearing a rule's badge. Cite it from a bible rule or delete it.",
      items: uncited.map((p) => `${p.title} (${p.file})`),
      visibleAt: "/design/library/policies",
    },
    {
      id: "under-exploration",
      label: "rules a board is still writing",
      count: exploring.length,
      note: "The statement is the interim law; the board it names writes what the rule inherits.",
      items: exploring.map((r) => `bible ${r.n}: ${r.status}`),
      visibleAt: "/design/library/rules",
    },
    {
      id: "retiring",
      label: "rules leaving the bible",
      count: retiring.length,
      note: "Read, not obeyed. The rule goes when its track lands.",
      items: retiring.map((r) => `bible ${r.n}: ${r.status}`),
      visibleAt: "/design/library/rules",
    },
    {
      id: "landed-proposals",
      label: "proposals whose board has landed",
      count: landed.length,
      note: "The board left the lab; the proposal is history, and a reader may still take it for an open argument.",
      items: landed.map((p) => p.title),
      visibleAt: "/design/lab/proposals",
    },
    {
      id: "uncontracted",
      label: "indexed components with no contract",
      count: uncontracted.length,
      note: "Nothing mechanical holds their function. Not every component needs one, but a component whose engine can break silently does.",
      items: uncontracted.map((c) => `${componentTitle(c)} (${c.file})`),
      visibleAt: "/design/library",
    },
  ];
}
