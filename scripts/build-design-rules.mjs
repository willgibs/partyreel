// Rebuilds the committed rules artifact the design library renders at
// /design/rules (see scripts/design-rules/collect.mjs for what it holds and
// why it is a committed file). Run after editing a guard test's titles or a
// ★ rule in the design docs: `pnpm design:rules`. rules-registry.test.ts
// fails until the artifact matches what the collector sees.

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { collectRules } from "./design-rules/collect.mjs";

const root = process.cwd();
const out = join(root, "src/app/(dev)/design/rules/rules.generated.json");
const artifact = collectRules(root);
writeFileSync(out, JSON.stringify(artifact, null, 2) + "\n");

const tests = artifact.rules.filter((r) => r.source === "test").length;
const docs = artifact.rules.length - tests;
console.log(
  `design rules: ${artifact.rules.length} rules (${tests} from tests, ${docs} from docs), ${artifact.components.length} components -> ${out}`,
);
