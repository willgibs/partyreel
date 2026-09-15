// THE LIBRARY AS ONE FILE (the Library x Lab round, 2026-09-15).
//
// `docs/design/library.md` is the whole working rule set as a document: the
// levels and what binds you, the bible with each rule's why and status, the
// policies by scope with what each refuses, the guidance pointers, the
// component index with its for-line and contract titles, and the standing
// boards with their open asks. Written beside the artifact by
// `pnpm design:rules` and held fresh by the same test.
//
// Why a file at all, when the Library renders every one of these as a page:
// an agent in a worktree reads files, not pages. The lab is gated behind a
// key and a dev server; a `.md` in the repo is what a fresh session greps, and
// what Will can read on GitHub from a phone. It is generated, never edited:
// every line here has exactly one upstream home.
//
// Node builtins plus the collector only, so `pnpm design:rules` stays a plain
// script with no bundler and no aliases.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The bible, read out of its TS module by regex: the script has no TS loader. */
function readBible(root) {
  const src = readFileSync(
    join(root, "src/app/(dev)/design/rules/bible.ts"),
    "utf8",
  );
  const body = src.slice(src.indexOf("export const BIBLE"));
  const rules = [];
  // One object literal per rule; the fields are written by hand in a fixed
  // order, but read by name so a reordering does not silently drop one.
  for (const block of body.split(/\n  \{\n/).slice(1)) {
    const field = (name) =>
      block.match(
        new RegExp(`\\n?\\s*${name}:\\s*(?:\\n\\s*)?"((?:[^"\\\\]|\\\\.)*)"`),
      )?.[1];
    const n = block.match(/\n\s*n:\s*(\d+)/)?.[1];
    if (!n) continue;
    rules.push({
      id: field("id"),
      n: Number(n),
      group: field("group"),
      statement: field("statement")?.replace(/\\"/g, '"'),
      why: field("why")?.replace(/\\"/g, '"'),
      status: field("status") ?? null,
      ruledOn: block.match(/\n\s*ruledOn:\s*(\w+|"[^"]*")/)?.[1] ?? null,
      enforcedBy: /enforcedBy:\s*"review"/.test(block)
        ? "review"
        : [...block.matchAll(/"(src\/[^"]+)"/g)].map((m) => m[1]),
    });
  }
  return rules.sort((a, b) => a.n - b.n);
}

/** The `for` line of each component, out of `component-notes.ts`. */
function readForLines(root) {
  const src = readFileSync(
    join(root, "src/app/(dev)/design/rules/component-notes.ts"),
    "utf8",
  );
  const out = new Map();
  // `"src/components/ui/button.tsx": { for: "…"` across one or more lines.
  for (const m of src.matchAll(
    /"(src\/[^"]+\.tsx?)":\s*\{[\s\S]*?\bfor:\s*"((?:[^"\\]|\\.)*)"/g,
  )) {
    out.set(m[1], m[2].replace(/\\"/g, '"'));
  }
  return out;
}

/** The standing boards and their open asks, out of `touchpoints.ts`. */
function readBoards(root) {
  const src = readFileSync(
    join(root, "src/app/(dev)/design/touchpoints.ts"),
    "utf8",
  );
  const boards = [];
  for (const block of src.split(/\n  \{\n/).slice(1)) {
    if (!/\n\s*board:\s*\{/.test(block)) continue;
    const field = (name) =>
      block.match(
        new RegExp(`\\n?\\s*${name}:\\s*(?:\\n\\s*)?"((?:[^"\\\\]|\\\\.)*)"`),
      )?.[1];
    const note = block.match(
      /\n\s*board:\s*\{[\s\S]*?note:\s*(?:\n\s*)?"((?:[^"\\]|\\.)*)"/,
    )?.[1];
    if (!field("id")) continue;
    boards.push({
      id: field("id"),
      title: field("title"),
      surface: field("surface"),
      why: field("why")?.replace(/\\"/g, '"'),
      note: note?.replace(/\\"/g, '"') ?? null,
    });
  }
  return boards;
}

/** The nine levels, out of the README's own table: the one home of the rule. */
function readLevels(root) {
  let src;
  try {
    src = readFileSync(join(root, "docs/design/README.md"), "utf8");
  } catch {
    return [];
  }
  return src
    .split("\n")
    .filter((l) =>
      /^\|\s*(law|contract|policy|program|guidance|precedent|proposal|ruling|landmine)\s*\|/.test(
        l,
      ),
    )
    .map((l) => l.split("|").map((c) => c.trim()))
    .map((cells) => ({
      id: cells[1],
      badge: cells[2],
      line: cells[3],
      binds: cells[4],
    }));
}

/** The `##` headings of a markdown file, for the guidance pointers. */
function readHeadings(root, rel) {
  let src;
  try {
    src = readFileSync(join(root, rel), "utf8");
  } catch {
    return [];
  }
  return src
    .split("\n")
    .filter((l) => /^## /.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim());
}

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** A table cell: pipes escaped, newlines flattened. */
const cell = (text) =>
  String(text ?? "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\|/g, "\\|")
    .trim();

const SCOPE_LABEL = {
  global: "Everywhere",
  marketing: "The marketing site",
  guest: "The guest surface",
  host: "The host app",
  shared: "Shared components",
  lab: "The lab",
  engineering: "Engineering (not design)",
};

const SCOPE_ORDER = [
  "global",
  "marketing",
  "guest",
  "host",
  "shared",
  "lab",
  "engineering",
];

/**
 * The whole rule set as markdown. `artifact` is the collector's output; the
 * rest is read from the repo, so the one home of every fact stays upstream.
 */
export function renderLibraryMd(root, artifact) {
  const bible = readBible(root);
  const forLines = readForLines(root);
  const boards = readBoards(root);
  const levels = readLevels(root);
  const guidance = readHeadings(root, "docs/design/guidance.md");
  const contracted = artifact.components.filter((c) => c.contracts.length > 0);
  const contracts = new Set(
    contracted.flatMap((c) => c.contracts.map((k) => `${k.file}:${k.line}`)),
  ).size;

  const out = [];
  const say = (...lines) => out.push(...lines);

  say(
    "# The library, as one file",
    "",
    "> **GENERATED by `pnpm design:rules`. Do not edit.** Every line has one home upstream: the",
    "> levels in [`README.md`](README.md), the law in `src/app/(dev)/design/rules/bible.ts`, the",
    "> policies and contracts in the test headers the collector reads, the guidance in",
    "> [`guidance.md`](guidance.md), the boards in `src/app/(dev)/design/touchpoints.ts`.",
    "> `rules-registry.test.ts` fails until this file matches them, so a stale copy cannot ship.",
    ">",
    "> **Why it exists:** the Library renders all of this at `/design/library`, behind a key and a dev",
    "> server. An agent in a worktree reads files. This is the same rule set, greppable.",
    "",
    `**${bible.length} laws · ${artifact.policies.length} policies · ${contracts} contracts on ${contracted.length} components · ${boards.length} standing boards.**`,
    "",
    "## What binds you",
    "",
    "In an exploration you obey three things and nothing else: **the bible**, **the contracts of",
    "every component under a path you own**, and **the policies**. Everything else is precedent,",
    "guidance, a proposal, a ruling or a landmine: it informs, and an agent that obeys all of it",
    "builds small. The nine levels, from [`README.md`](README.md#what-binds-you):",
    "",
    "| level | binds in an exploration? | what it is |",
    "| --- | --- | --- |",
    ...(levels.length
      ? levels.map(
          (l) =>
            `| **${l.badge}** ${l.id} | ${cell(l.binds)} | ${cell(l.line)} |`,
        )
      : ["| (the README defines no levels yet) | | |"]),
    "",
  );

  say("## The law", "");
  const groups = [...new Set(bible.map((r) => r.group))];
  for (const group of groups) {
    say(`### ${group}`, "");
    for (const rule of bible.filter((r) => r.group === group)) {
      const marks = [];
      if (rule.status && rule.status !== "ruled")
        marks.push(`**${rule.status}**`);
      marks.push(
        rule.enforcedBy === "review"
          ? "held at review"
          : `enforced by ${rule.enforcedBy.map((f) => `\`${f}\``).join(", ")}`,
      );
      say(
        `**${rule.n}. ${rule.statement}**`,
        "",
        rule.why,
        "",
        `<small>${marks.join(" · ")} · \`/design/library/rules/${rule.id}\`</small>`,
        "",
      );
    }
  }

  say(
    "## The policies",
    "",
    "A policy is an agent-written test that holds a line across the tree; the gate is red without",
    "it. Provisional by construction: a policy that blocks better work is a finding, not a wall.",
    "A design-scoped policy that no bible rule cites fails `rules-registry.test.ts`.",
    "",
  );
  for (const scope of SCOPE_ORDER) {
    const list = artifact.policies.filter((p) => p.scope === scope);
    if (list.length === 0) continue;
    say(`### ${SCOPE_LABEL[scope]}`, "");
    say("| policy | refuses | test |", "| --- | --- | --- |");
    for (const p of list) {
      say(
        `| ${cell(p.title)} | ${cell(p.summary)} | \`${p.file}:${p.line}\` |`,
      );
    }
    say("");
  }

  say(
    "## Guidance",
    "",
    "The default you leave on purpose, never a wall. The whole of it is",
    "[`guidance.md`](guidance.md); its chapters:",
    "",
    guidance.length
      ? guidance.map((h) => `- [${h}](guidance.md#${slug(h)})`).join("\n")
      : "- (guidance.md is not written yet)",
    "",
  );

  say(
    "## The components",
    "",
    "Every component the library indexes, what it is for, and the contracts that hold its",
    "function. A contract never freezes a look.",
    "",
    "| component | for | contracts |",
    "| --- | --- | --- |",
  );
  for (const c of artifact.components.filter((c) => c.indexed)) {
    const titles = c.contracts.map((k) => k.title);
    say(
      `| \`${c.file}\` | ${cell(forLines.get(c.file) ?? "")} | ${
        titles.length ? cell(titles.join("; ")) : "none"
      } |`,
    );
  }
  say("");

  const unindexed = contracted.filter((c) => !c.indexed);
  if (unindexed.length) {
    say(
      "Contracted but outside the library's directories:",
      "",
      ...unindexed.map((c) => `- \`${c.file}\` (${c.contracts.length} guards)`),
      "",
    );
  }

  say(
    "## The standing boards",
    "",
    "An open question and its candidates, in the lab. Nothing on a board binds anyone.",
    "",
    "| board | surface | the question |",
    "| --- | --- | --- |",
  );
  for (const b of boards) {
    say(`| \`${b.id}\` | ${b.surface} | ${cell(b.note ?? b.why)} |`);
  }
  say("");

  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
