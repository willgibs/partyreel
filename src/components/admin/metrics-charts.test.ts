import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * EVERY METRICS AXIS IS SIZED FROM THE LABELS IT ACTUALLY DRAWS (crumbs-41; ROADMAP's four-digit ticks).
 *
 * The axis began at a fixed `width={28}`, which drew a four-digit tick as its last three digits ("1400" as "400").
 * Its first fix (2026-09-24) sized it from the widest compact label the DATA could draw, but recharts draws its own
 * rounded ticks, which outgrow the data's labels: a Free count of 3,000 ticks 0, 750, 1.5K, 2.3K and 3K in an axis
 * sized for "3K", and views near 99K tick 100K in one sized for "99K", each clipped at the chart's edge. So each
 * YAxis is `width="auto"`: recharts 3 measures the tick labels it rendered and sizes the axis to the widest
 * (`getCalculatedYAxisWidth`), whatever ticks the domain rounds to. Ticks stay compact (`formatCompactNumber`) and the
 * tooltip exact. The Library draws both charts past 1,000 (`admin-metrics-charts`), the eye on what this pins.
 *
 * It reads the source, not a render: jsdom lays nothing out, so no measured width exists to assert there.
 */
const FILE = join(process.cwd(), "src/components/admin/metrics-charts.tsx");

/** Each `<YAxis …>` in the file: its line and its attributes, as written. */
function yAxes(): { line: number; attrs: Map<string, string> }[] {
  const source = ts.createSourceFile(
    FILE,
    readFileSync(FILE, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: { line: number; attrs: Map<string, string> }[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(source) === "YAxis"
    ) {
      const attrs = new Map<string, string>();
      for (const p of node.attributes.properties) {
        if (!ts.isJsxAttribute(p)) continue;
        const init = p.initializer;
        attrs.set(
          p.name.getText(source),
          init === undefined
            ? "true"
            : ts.isStringLiteral(init)
              ? JSON.stringify(init.text)
              : ts.isJsxExpression(init)
                ? (init.expression?.getText(source) ?? "")
                : init.getText(source),
        );
      }
      found.push({
        line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        attrs,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("the metrics charts' axes", () => {
  it("finds both charts' axes", () => {
    expect(yAxes()).toHaveLength(2);
  });

  it('★ sizes every YAxis from the tick labels it drew (`width="auto"`), never from an estimate of the data\'s', () => {
    for (const { line, attrs } of yAxes()) {
      expect(attrs.get("width"), `YAxis at line ${line}`).toBe('"auto"');
    }
  });

  it("ticks compact on every axis, so a large count reads as 1.4K or 2.3M", () => {
    for (const { line, attrs } of yAxes()) {
      expect(attrs.get("tickFormatter"), `YAxis at line ${line}`).toBe(
        "formatCompactNumber",
      );
    }
  });
});
