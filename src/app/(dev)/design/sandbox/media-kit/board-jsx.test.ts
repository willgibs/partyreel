// @policy: engineering · A count can never glue itself to its noun
// @refuses: a multi-line JSX text run that opens with a space and holds an HTML entity, which Next 16's SWC renders as "24marketing".
//
// Lifted out of plan.test.ts (the Library x Lab round, 2026-09-15), where it
// sat at line 247 behind a `// @contract-for:` the collector could not see:
// a directive past the header window was silently dropped, so this guard
// never reached the library. It is a POLICY, not a contract: it holds a line
// against a compiler behaviour across the board's files, and says nothing
// about what a component is or how it looks. `engineering` scope for the
// same reason, so no bible rule is owed a citation of it.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Next 16's SWC drops the LEADING whitespace of a JSXText run that both spans
// more than one source line and contains an HTML entity, so `{n} noun` silently
// renders as "24marketing" in exactly that case and only that case. It is a
// compiler behaviour, not a JSX rule: the same shape is correct everywhere else
// on this board, and tsc does not reproduce it, which is why reading the
// transpiled output of the wrong compiler once "disproved" a real defect. The
// board is a wall of derived counts, so guard the shape at the source: prettier
// chooses the line wrapping here, and a future reflow could move a currently
// safe run onto two lines and glue two words together with nothing failing.
describe("the board's JSX cannot glue a count to its noun", () => {
  // Every file on this board that renders a derived count. The migration wave
  // split board.tsx into the composition plus parts.tsx and plates.tsx, and a
  // guard that still named two files would have covered less of the board than
  // it did before the split.
  const FILES = ["board.tsx", "parts.tsx", "plates.tsx", "sheet.tsx"];

  it("has no multi-line text run that starts with a space and holds an entity", () => {
    for (const file of FILES) {
      // Block comments first: a {/* ... */} note may legitimately contain both
      // a line break and an entity, and it renders nothing.
      const src = readFileSync(join(import.meta.dirname, file), "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );
      const offenders: string[] = [];
      // A run begins after an expression container or a tag that is followed by
      // a space on the same line, and ends at the next `{` or `<`.
      for (const m of src.matchAll(/[}>] (?=[^\s<{])/g)) {
        const rest = src.slice(m.index + m[0].length);
        const end = rest.search(/[<{]/);
        const run = end === -1 ? rest : rest.slice(0, end);
        if (run.includes("\n") && /&[a-zA-Z]+;/.test(run)) {
          offenders.push(
            `${file}:${src.slice(0, m.index).split("\n").length} ${JSON.stringify(run.slice(0, 60))}`,
          );
        }
      }
      expect(
        offenders,
        `Add an explicit {" "} after the expression, or keep the run on one line.`,
      ).toEqual([]);
    }
  });
});
