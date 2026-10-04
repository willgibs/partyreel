/**
 * EVERY MAIL IS CLASSIFIED BEFORE IT SHIPS (the spend watch's lifecycle-mail pause). A send site's `kind` decides
 * whether a pause holds it, so a kind on no list would be a mail nobody decided about: held by accident (an alert
 * silenced) or never held (a runaway the switch cannot stop). This walks `src/**` with the compiler and holds every
 * kind a send names to exactly one list, and every list entry to a send that still names it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  HELD_WHILE_PAUSED,
  LIFECYCLE_KINDS,
  OPERATOR_KINDS,
  STATE_NOTICES,
  heldWhilePaused,
} from "@/lib/email/send-kinds";

const ROOT = process.cwd();
const SEND_CALLS = new Set(["sendOnce", "sendOncePerWindow"]);

/** Every `kind` a send names, with where: a literal, or `null` where the code computes it. */
function sentKinds(): { kind: string | null; at: string }[] {
  const files = readdirSync(join(ROOT, "src"), { recursive: true })
    .map(String)
    .filter((rel) => /\.tsx?$/.test(rel) && !/\.test\.tsx?$|\.d\.ts$/.test(rel))
    // send.ts's own window helper forwards its caller's kind; the form helper forwards its spec's `notify` kind.
    .filter(
      (rel) =>
        rel !== join("lib", "email", "send.ts") &&
        rel !== join("lib", "security", "public-form-submit.ts"),
    );
  const out: { kind: string | null; at: string }[] = [];
  for (const rel of files) {
    const text = readFileSync(join(ROOT, "src", rel), "utf8");
    if (!/sendOnce|notify:/.test(text)) continue;
    const source = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true);
    const kindOf = (obj: ts.ObjectLiteralExpression, node: ts.Node) => {
      const line =
        source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const prop = obj.properties.find(
        (p) => p.name && ts.isIdentifier(p.name) && p.name.text === "kind",
      );
      if (!prop) return;
      const value =
        ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer)
          ? prop.initializer.text
          : null;
      out.push({ kind: value, at: `src/${rel}:${line}` });
    };
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        SEND_CALLS.has(node.expression.text) &&
        node.arguments[0] &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        kindOf(node.arguments[0], node);
      }
      // A public form's `notify: (data) => ({ kind, mail })`.
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "notify" &&
        ts.isArrowFunction(node.initializer)
      ) {
        let body: ts.Node = node.initializer.body;
        while (ts.isParenthesizedExpression(body)) body = body.expression;
        if (ts.isObjectLiteralExpression(body)) kindOf(body, node);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return out;
}

const LISTED = [
  ...HELD_WHILE_PAUSED,
  ...STATE_NOTICES,
  ...OPERATOR_KINDS,
] as string[];

describe("every mail's kind, classified", () => {
  const sent = sentKinds();

  it("finds the sends it is meant to hold (the walk is not blind)", () => {
    const kinds = new Set(sent.map((s) => s.kind));
    for (const kind of [
      "inactivity_warning",
      "orphan_breaker",
      "contact_form",
      "spend_watch",
    ]) {
      expect(kinds.has(kind), kind).toBe(true);
    }
  });

  it("★ names every send's kind as a literal on exactly one list", () => {
    for (const { kind, at } of sent) {
      expect(kind, `${at}: a send's kind must be a literal`).not.toBeNull();
      expect(
        LISTED.filter((k) => k === kind),
        `${at}: "${kind}" must sit on exactly one list in send-kinds.ts`,
      ).toHaveLength(1);
    }
  });

  it("keeps no list entry that no send names any more", () => {
    const kinds = new Set(sent.map((s) => s.kind));
    for (const listed of LISTED) {
      expect(kinds.has(listed), `"${listed}" is listed but sent nowhere`).toBe(
        true,
      );
    }
  });

  it("holds only the mail its sweep sends again, never a notice or an operator's", () => {
    for (const kind of HELD_WHILE_PAUSED)
      expect(heldWhilePaused(kind)).toBe(true);
    for (const kind of [...STATE_NOTICES, ...OPERATOR_KINDS]) {
      expect(heldWhilePaused(kind), kind).toBe(false);
    }
    expect(heldWhilePaused("a kind nobody wrote")).toBe(false);
  });

  it("counts the six lifecycle kinds as the watch's lifecycle mail", () => {
    expect([...LIFECYCLE_KINDS].sort()).toEqual(
      [...HELD_WHILE_PAUSED, ...STATE_NOTICES].sort(),
    );
  });
});
