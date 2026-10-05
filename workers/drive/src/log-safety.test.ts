/**
 * NO TOKEN IN A LOG (drive-export.md, "The tests that hold the line"): the Worker logs through one seam (`log.ts`),
 * whose fields are flat primitives, and nothing else here calls `console`; no log call takes a lease answer, a token,
 * a secret or a session whole, by name.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname);
const files = readdirSync(SRC, { recursive: true })
  .map(String)
  .filter((f: string) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.startsWith("testing"));

describe("the Worker's logs", () => {
  it("call console only through log.ts", () => {
    for (const file of files) {
      if (file === "log.ts") continue;
      expect(readFileSync(join(SRC, file), "utf8"), file).not.toMatch(/\bconsole\./);
    }
  });

  it("★ never pass a token, a secret, a lease answer or a session to a log", () => {
    for (const file of files) {
      const text = readFileSync(join(SRC, file), "utf8");
      for (const call of text.matchAll(/\blog\(\s*"[^"]+",\s*\{([^}]*)\}/g)) {
        const fields = call[1]!;
        expect(fields, `${file}: ${call[0]}`).not.toMatch(/\b(token|secret|access|refresh|sessionUri|session|answer|lease)\b\s*[:,}]/i);
        expect(fields, `${file}: ${call[0]}`).not.toMatch(/\.\.\./);
      }
    }
  });
});
