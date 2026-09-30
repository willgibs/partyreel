import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { isTextLikeInputType } from "@/lib/adopt-typed-value";

/**
 * A TEXT FIELD THAT REACT CONTROLS KEEPS WHAT WAS TYPED BEFORE REACT OWNED IT (crumbs-25: the ROADMAP's line
 * from `crumbs-23`, "about 32 files draw a bare `<input>`").
 *
 * A controlled field is server-rendered with its state's value and typeable from the browser's first paint,
 * and React is told nothing of what is typed until the page has hydrated: the first render after it writes
 * the state's `""` back over the person's words, the same node still focused (measured on `/login`'s email
 * field with the page's scripts held). `Input` and `Textarea` (`components/ui`) adopt that text through
 * `useAdoptTypedValue` (`lib/adopt-typed-value.ts`), so every field drawn with them is safe. This is the guard
 * on the ones drawn WITHOUT them: a raw `<input>` or `<textarea>` in the source.
 *
 * WHAT A RAW TEXT FIELD MUST DO, when it can be typed into and is controlled (it has a `value`, or a spread
 * that may carry one): put a `ref` on it that comes from `useAdoptTypedValue`, directly or through a ref
 * composed of it (a field that is also handed a ref of its own, as `Input`'s and the lab dock's are). What
 * needs nothing, because there is no typed text for React to overwrite or nobody types it:
 *   - a kind of input a person does not type into (`file`, `range`, `checkbox`, `radio`, `hidden`, buttons:
 *     `isTextLikeInputType`, the hook's own list, so the two never disagree);
 *   - an uncontrolled field (no `value`, no spread): React never writes over what it does not own.
 * Anything else is refused, and the sentence says what to reach for.
 *
 * AN EXCEPTION SAYS SO, in `ALLOWED`: the file, and why its field cannot have text typed into it before
 * React owns it (a field mounted by a press is written from its state as it enters the document, and a
 * honeypot is never typed into by a person). An entry whose file no longer offends FAILS, so the list cannot
 * outlive its reasons.
 *
 * The scan reads JSX, not text, so a `<input` in a comment or a string is never counted. It cannot follow a
 * ref through a function that returns it, nor a field a component draws through a name other than `input`;
 * `OTPInput` (the `input-otp` package) draws its own field, and every use of it mounts after a press.
 */

/**
 * File (repo-relative, forward slashes: `src/...`) -> how many of its controlled, bare text fields need no
 * adoption, and why. The count is exact, so a second bare field in a file that already has an exception is
 * refused rather than let through under it.
 */
const ALLOWED: Readonly<Record<string, { fields: number; why: string }>> = {
  "src/app/(marketing)/(cinema)/careers/[slug]/application-form.tsx": {
    fields: 1,
    why: "the honeypot: hidden from applicants, spread from react-hook-form's register (uncontrolled); a person never types in it",
  },
  "src/app/(marketing)/(cinema)/contact/contact-form.tsx": {
    fields: 1,
    why: "the honeypot: hidden from visitors, spread from react-hook-form's register (uncontrolled); a person never types in it",
  },
  "src/components/marketing/help/help-palette.tsx": {
    fields: 1,
    why: "the search palette mounts when it is opened by a press, so its field is written from its state as it enters the document",
  },
  "src/components/ui/command-palette.tsx": {
    fields: 1,
    why: "the palette mounts when it is opened by a press, so its field is written from its state as it enters the document",
  },
  "src/app/(dev)/design/(shell)/_shell/palette.tsx": {
    fields: 1,
    why: "the Library's palette mounts when it is opened by a press, so its field is written from its state as it enters the document",
  },
  "src/app/(dev)/design/(shell)/_shell/sidebar.tsx": {
    fields: 1,
    why: "the editor-root field (the filter above it adopts) mounts when its disclosure is pressed, written from its state as it enters the document",
  },
  "src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx": {
    fields: 1,
    why: "the board note lives in the session's summary, which lists only boards the client-only review store holds answers for, so it never exists on the server",
  },
};

const ROOT = process.cwd();
const SKIP = /\.test\.tsx?$|\.d\.ts$/;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx$/.test(rel) && !SKIP.test(rel))
    .sort();
}

type Bare = { line: number; tag: "input" | "textarea"; type: string | null };

/** A JSX attribute's string value when it is a plain literal (`type="email"`), else null. */
function literal(attribute: ts.JsxAttribute): string | null {
  const init = attribute.initializer;
  if (!init) return null;
  if (ts.isStringLiteral(init)) return init.text;
  if (
    ts.isJsxExpression(init) &&
    init.expression &&
    ts.isStringLiteralLike(init.expression)
  ) {
    return init.expression.text;
  }
  return null;
}

/** Every identifier an expression mentions. */
function identifiersIn(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n)) names.add(n.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

/**
 * The raw text fields of one source that are controlled (or may be) and whose `ref` does not come from
 * `useAdoptTypedValue`. `type` is the literal `type` attribute (null when it is not a literal).
 */
export function bareTextFields(text: string, name = "source.tsx"): Bare[] {
  const source = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  // The variables that hold the hook's ref, and (one level down) those composed of one.
  const initializers = new Map<string, ts.Node>();
  const visitDeclarations = (n: ts.Node) => {
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer
    ) {
      initializers.set(n.name.text, n.initializer);
    }
    ts.forEachChild(n, visitDeclarations);
  };
  visitDeclarations(source);
  const isHookCall = (n: ts.Node): boolean => {
    let found = false;
    const visit = (m: ts.Node) => {
      if (
        ts.isCallExpression(m) &&
        /(^|\.)useAdoptTypedValue$/.test(m.expression.getText(source))
      )
        found = true;
      ts.forEachChild(m, visit);
    };
    visit(n);
    return found;
  };
  const adoptNames = new Set(
    [...initializers].filter(([, init]) => isHookCall(init)).map(([k]) => k),
  );
  const adopting = (ref: ts.Expression): boolean => {
    for (const id of identifiersIn(ref)) {
      if (adoptNames.has(id)) return true;
      const init = initializers.get(id);
      if (init && [...identifiersIn(init)].some((x) => adoptNames.has(x)))
        return true;
    }
    return isHookCall(ref);
  };

  const found: Bare[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (tag === "input" || tag === "textarea") {
        let type: string | null | undefined;
        let controlled = false;
        let ref: ts.Expression | undefined;
        for (const attribute of node.attributes.properties) {
          if (ts.isJsxSpreadAttribute(attribute)) {
            // What a spread carries cannot be seen: it may be a `value`.
            controlled = true;
            continue;
          }
          const key = attribute.name.getText(source);
          if (key === "value") controlled = true;
          if (key === "type") type = literal(attribute);
          if (
            key === "ref" &&
            attribute.initializer &&
            ts.isJsxExpression(attribute.initializer) &&
            attribute.initializer.expression
          )
            ref = attribute.initializer.expression;
        }
        // Text-like: a textarea, an input with no type (text), an unknown type, or a kind that is typed into.
        const typed =
          tag === "textarea" ||
          type === undefined ||
          type === null ||
          isTextLikeInputType(type);
        if (typed && controlled && !(ref && adopting(ref))) {
          found.push({
            line:
              source.getLineAndCharacterOfPosition(node.getStart(source)).line +
              1,
            tag,
            type: type ?? null,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("the scan sees what it should", () => {
  const lines = (jsx: string) =>
    bareTextFields(jsx).map((f) => `${f.tag}:${f.type}`);

  it("refuses a controlled text field that does not adopt, however it is dressed", () => {
    expect(lines(`const A = () => <input value={v} onChange={c} />;`)).toEqual([
      "input:null",
    ]);
    expect(
      lines(`const A = () => <input type="email" value={v} onChange={c} />;`),
    ).toEqual(["input:email"]);
    expect(
      lines(`const A = () => <input type="search" value={v} onChange={c} />;`),
    ).toEqual(["input:search"]);
    expect(
      lines(`const A = () => <textarea value={v} onChange={c} />;`),
    ).toEqual(["textarea:null"]);
    // A kind the scan cannot read is text until proven otherwise.
    expect(
      lines(`const A = () => <input type={kind} value={v} onChange={c} />;`),
    ).toEqual(["input:null"]);
    // A spread may carry the value.
    expect(lines(`const A = () => <input {...props} />;`)).toEqual([
      "input:null",
    ]);
    expect(
      lines(`const A = () => <textarea {...form.register("x")} />;`),
    ).toEqual(["textarea:null"]);
    // A ref of its own is not the hook's.
    expect(
      lines(
        `const A = () => { const ref = useRef(null); return <input ref={ref} value={v} onChange={c} />; };`,
      ),
    ).toEqual(["input:null"]);
  });

  it("lets a field that adopts stand: the hook's ref, or one composed of it", () => {
    expect(
      lines(
        `const A = () => { const adoptRef = useAdoptTypedValue<HTMLInputElement>(v); return <input ref={adoptRef} value={v} onChange={c} />; };`,
      ),
    ).toEqual([]);
    expect(
      lines(
        `const A = () => { const adoptRef = useAdoptTypedValue(v); const composed = React.useCallback((el) => { adoptRef(el); if (ref) ref.current = el; }, [adoptRef, ref]); return <input ref={composed} {...props} />; };`,
      ),
    ).toEqual([]);
    expect(
      lines(
        `const A = () => { const r = adopt.useAdoptTypedValue(v); return <textarea ref={r} value={v} />; };`,
      ),
    ).toEqual([]);
  });

  it("lets a field stand that has no typed text to lose", () => {
    for (const jsx of [
      `<input type="file" onChange={c} />`,
      `<input type="range" value={v} onChange={c} />`,
      `<input type="checkbox" checked={on} onChange={c} />`,
      `<input type="radio" value={v} checked={on} onChange={c} />`,
      `<input type="hidden" value={v} />`,
      `<input type="submit" value="Go" />`,
      // uncontrolled: React never writes over what it does not own
      `<input defaultValue="a" />`,
      `<input type="text" name="q" />`,
      `<textarea defaultValue="a" />`,
    ]) {
      expect(lines(`const A = () => (${jsx});`), jsx).toEqual([]);
    }
  });

  it("counts a field and never a component, a comment or a string", () => {
    expect(lines(`const A = () => <Input value={v} onChange={c} />;`)).toEqual(
      [],
    );
    expect(lines(`const A = () => <Textarea value={v} />;`)).toEqual([]);
    expect(
      lines(`// <input value={v} />\nconst a = "<input value={v} />";`),
    ).toEqual([]);
    expect(
      bareTextFields(
        `const A = () => (\n  <div>\n    <input value={a} />\n    <input value={b} />\n  </div>\n);`,
      ).map((f) => f.line),
    ).toEqual([3, 4]);
  });

  it("reads the hook's own list of kinds a person types into", () => {
    for (const kind of [
      "text",
      "email",
      "search",
      "tel",
      "url",
      "password",
      "number",
      undefined,
    ]) {
      expect(isTextLikeInputType(kind), String(kind)).toBe(true);
    }
    for (const kind of ["file", "range", "checkbox", "radio", "hidden"]) {
      expect(isTextLikeInputType(kind), kind).toBe(false);
    }
  });
});

describe("no controlled text field loses what was typed before hydration", () => {
  const files = filesUnder("src");
  const offenders = new Map(
    files
      .map((rel) => [
        rel,
        bareTextFields(readFileSync(join(ROOT, rel), "utf8"), rel),
      ])
      .filter(([, found]) => (found as Bare[]).length > 0) as [
      string,
      Bare[],
    ][],
  );

  it("scanned the product's source, and the two primitives that adopt", () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files).toContain("src/components/ui/input.tsx");
    expect(files).toContain("src/components/ui/textarea.tsx");
    // The primitives ARE the adopters: a scan that flagged them would be reading the wrong thing.
    expect(offenders.has("src/components/ui/input.tsx")).toBe(false);
    expect(offenders.has("src/components/ui/textarea.tsx")).toBe(false);
  });

  it("every raw text field adopts through `useAdoptTypedValue`, or its file says why it need not", () => {
    const refused = [...offenders].flatMap(([rel, found]) =>
      // A file that draws more bare fields than it counts is refused whole, every line named: which of
      // them is the one that was counted is the reader's to say.
      found.length > (ALLOWED[rel]?.fields ?? 0)
        ? found.map((f) => `${rel}:${f.line}`)
        : [],
    );
    expect(
      refused,
      "a controlled `<input>` or `<textarea>` loses text typed before the page hydrated (React writes its state's value back over it at the first render). Draw it with `Input` / `Textarea` (components/ui), or put `ref={useAdoptTypedValue(...)}` on it (lib/adopt-typed-value.ts; a field that is handed a ref of its own composes both), or, if it can only ever mount on a press or nobody types in it, count it in ALLOWED with why",
    ).toEqual([]);
  });

  it("every exception is exactly as many fields as its file still draws", () => {
    const mismatched = Object.entries(ALLOWED).flatMap(([rel, allowed]) => {
      const drawn = offenders.get(rel)?.length ?? 0;
      return drawn === allowed.fields
        ? []
        : [`${rel}: allows ${allowed.fields}, draws ${drawn}`];
    });
    expect(
      mismatched,
      "an exception outlived its field (drop or lower it) or a file grew a second bare field (adopt it, or count it with its reason)",
    ).toEqual([]);
  });
});
