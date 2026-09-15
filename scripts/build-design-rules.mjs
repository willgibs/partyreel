// Rebuilds the committed artifact the design library renders on /design/rules
// and the /design index (see scripts/design-rules/collect.mjs for what it
// holds and why it is a committed file). Run after editing a contract test's
// titles or directive, or adding a component file: `pnpm design:rules`.
// rules-registry.test.ts fails until the artifact matches what the collector
// sees.

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { collectRules } from "./design-rules/collect.mjs";
import { renderLibraryMd } from "./design-rules/library-md.mjs";

const root = process.cwd();
const out = join(root, "src/app/(dev)/design/rules/rules.generated.json");
const artifact = collectRules(root);
writeFileSync(out, JSON.stringify(artifact, null, 2) + "\n");

// The same rule set as one greppable file, for an agent in a worktree who has
// no dev server and no key (the Library x Lab round, 2026-09-15).
const libraryMd = join(root, "docs/design/library.md");
writeFileSync(libraryMd, renderLibraryMd(root, artifact));

const contracted = artifact.components.filter((c) => c.contracts.length > 0);
const contracts = contracted.reduce((n, c) => n + c.contracts.length, 0);
const files = new Set(
  contracted.flatMap((c) => c.contracts.map((k) => k.file)),
);
console.log(
  `design rules: ${artifact.components.length} components (${artifact.components.filter((c) => c.indexed).length} indexed), ${contracts} contracts on ${contracted.length} components from ${files.size} contract tests, ${artifact.policies.length} policies -> ${out}`,
);
console.log(`the library as one file -> ${libraryMd}`);
