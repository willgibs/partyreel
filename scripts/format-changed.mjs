#!/usr/bin/env node
// Format ONLY the code files you've changed (tracked-modified + new untracked), never
// the whole repo. Run before committing; pass --check for a non-writing verify.
//
// WHY this exists (a real incident, 2026-06-22): `prettier --write .` rewrote ~90 already-
// committed files (this repo is NOT kept repo-wide prettier-clean — the gate is
// typecheck+lint+test, and editors format per-file on save) AND `prettier-plugin-tailwindcss`
// MANGLED a dynamic className: `${cond ? " opacity-30" : ""}` lost its leading space, producing
// a broken `scale-[0.98]opacity-30`. A whole-repo `prettier --write .` is therefore a footgun.
// Scoping to your own diff keeps the blast radius to changes you review before committing.
//
// RESIDUAL CAVEAT: the tailwind plugin still SORTS class strings, and on a `${c ? " x" : ""}`
// pattern it can drop the separator space. Prefer cn() for conditional classes, and eyeball
// dynamic classNames in the diff after running this.
import { execSync } from "node:child_process";

const sh = (cmd) => execSync(cmd, { encoding: "utf8" });
const check = process.argv.includes("--check");

const changed = [
  ...sh("git diff --name-only --diff-filter=d HEAD").split("\n"),
  ...sh("git ls-files --others --exclude-standard").split("\n"),
]
  .map((f) => f.trim())
  .filter(
    (f, i, a) =>
      f && a.indexOf(f) === i && /\.(ts|tsx|js|jsx|mjs|cjs|css|json)$/.test(f),
  );

if (changed.length === 0) {
  console.log("format: no changed code files.");
  process.exit(0);
}

console.log(`format: ${changed.length} changed file(s)`);
try {
  execSync(
    `prettier ${check ? "--check" : "--write"} ${changed.map((f) => JSON.stringify(f)).join(" ")}`,
    { stdio: "inherit" },
  );
} catch {
  // prettier already printed the offending files (stdio inherited); exit non-zero
  // cleanly (no Node stack dump) so --check is CI-friendly.
  process.exit(1);
}
