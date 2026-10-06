import { render } from "@testing-library/react";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import {
  EPHEMERAL_ROLES,
  layerIsUp,
  MODAL_ROLES,
} from "@/components/ui/layer-is-up";
import { Popup, PopupContent, PopupHeader } from "@/components/ui/popup";
import { read, sources } from "@/testing/source-tree";

/**
 * IS ANOTHER LAYER UP? A surface that owns the keyboard (the review room, the report queue) or the address
 * (the album's viewer) stands down while a layer sits over it, and it asks here so that "a layer" means one
 * thing. What it caught once, in three places at two of which it was missing: a confirm speaks as an
 * `alertdialog`, which is not a `dialog` to a selector, so the keys and the address behind a confirm went
 * on working (crumbs-20).
 */

/** The layers a test drew by hand: taken down after it, so RTL's own container is left to RTL's cleanup. */
const drawn: HTMLElement[] = [];
const layer = (role: string, attrs: Record<string, string> = {}) => {
  const el = document.createElement("div");
  el.setAttribute("role", role);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  document.body.append(el);
  drawn.push(el);
  return el;
};

afterEach(() => {
  for (const el of drawn.splice(0)) el.remove();
});

describe("layerIsUp", () => {
  it("is false with nothing up, and for the page's own markup", () => {
    expect(layerIsUp()).toBe(false);
    layer("region");
    layer("group");
    expect(layerIsUp()).toBe(false);
  });

  it.each(["dialog", "alertdialog", "menu", "listbox"])(
    "is true while a %s is up",
    (role) => {
      layer(role);
      expect(layerIsUp()).toBe(true);
    },
  );

  it("is a real confirm's own layer too: it is an alertdialog and never a dialog", () => {
    // The whole reason this exists. A selector for `[role="dialog"]` passes a test that has no confirm in it.
    render(
      <Popup defaultOpen>
        <PopupContent kind="confirm" aria-describedby={undefined}>
          <PopupHeader title="Remove this?" />
        </PopupContent>
      </Popup>,
    );
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(layerIsUp()).toBe(true);
    expect(layerIsUp({ dialogsOnly: true })).toBe(true);
  });

  describe("except", () => {
    it("never counts the caller's own layer as another", () => {
      layer("dialog", { "data-review-peek": "" });
      expect(layerIsUp({ except: "[data-review-peek]" })).toBe(false);
      expect(layerIsUp()).toBe(true);
    });

    it("still sees another layer beside the caller's own, of any role", () => {
      layer("dialog", { "data-review-peek": "" });
      const confirm = layer("alertdialog");
      expect(layerIsUp({ except: "[data-review-peek]" })).toBe(true);
      confirm.remove();
      layer("menu");
      expect(layerIsUp({ except: "[data-review-peek]" })).toBe(true);
    });
  });

  describe("dialogsOnly", () => {
    it("counts a dialog and a confirm, and not a menu or a listbox", () => {
      layer("menu");
      layer("listbox");
      expect(layerIsUp({ dialogsOnly: true })).toBe(false);
      layer("dialog");
      expect(layerIsUp({ dialogsOnly: true })).toBe(true);
    });

    it("sees a confirm the way a viewer waiting behind a place needs to", () => {
      layer("alertdialog");
      expect(layerIsUp({ except: "[data-lightbox-content]", dialogsOnly: true })).toBe(
        true,
      );
    });

    it("leaves the viewer's own dialog out", () => {
      layer("dialog", { "data-lightbox-content": "" });
      expect(layerIsUp({ except: "[data-lightbox-content]", dialogsOnly: true })).toBe(
        false,
      );
    });
  });

  it("names the roles once: a dialog and a confirm, a menu and a listbox", () => {
    expect([...MODAL_ROLES]).toEqual(["dialog", "alertdialog"]);
    expect([...EPHEMERAL_ROLES]).toEqual(["menu", "listbox"]);
  });
});

/**
 * NOBODY ELSE SPELLS A LAYER SELECTOR. What is refused, anywhere but the home: a string that is a selector
 * for a dialog (`[role="dialog"]`, `[role='alertdialog']`, `[role=dialog]`). A JSX `role="dialog"` on an
 * element is a layer being MADE, which is fine; it is the QUESTION "is one up" that must be asked in one place.
 */
describe("the layer roles have one home", () => {
  const HOME = "src/components/ui/layer-is-up.ts";
  const SELECTOR = /\[\s*role\s*=\s*["']?(?:alert)?dialog["']?\s*\]/;

  /** The line of every string that is a selector for a dialog, comments excluded (they are trivia, not nodes). */
  function selectorsIn(text: string, fileName: string): number[] {
    const source = ts.createSourceFile(
      fileName,
      text,
      ts.ScriptTarget.Latest,
      true,
      fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const lines: number[] = [];
    const visit = (node: ts.Node) => {
      const isString =
        ts.isStringLiteralLike(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node);
      if (isString && SELECTOR.test((node as { text: string }).text)) {
        lines.push(
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return lines;
  }

  it("finds no dialog selector outside the home", () => {
    // A selector for a dialog spells the word, so only a file that does is parsed; the home is one.
    const naming = sources().filter((rel) => read(rel).includes("dialog"));
    expect(naming).toContain(HOME);
    const offenders: string[] = [];
    for (const rel of naming) {
      if (rel === HOME) continue;
      for (const line of selectorsIn(read(rel), rel)) {
        offenders.push(`${rel}:${line}`);
      }
    }
    expect(
      offenders,
      `A selector for a dialog was written by hand again: ask \`layerIsUp()\` ("@/components/ui/layer-is-up"), ` +
        `which knows a confirm is an alertdialog:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("sees the shapes it exists for", () => {
    for (const [name, code] of [
      ["double quotes", `document.querySelector('[role="dialog"], [role="menu"]');`],
      ["single quotes", `document.querySelector("[role='alertdialog']");`],
      ["no quotes", "document.querySelector('[role=dialog]');"],
      ["a template", "document.querySelector(`[role=\"dialog\"]${x}`);"],
      ["a not()", `el.matches('[role="dialog"]:not([data-x])');`],
    ] as const) {
      expect(selectorsIn(code, "f.ts"), name).toHaveLength(1);
    }
  });

  it("leaves a role on an element, a prose mention and the other roles alone", () => {
    for (const [name, code] of [
      ["a JSX attribute", `const a = <div role="dialog" />;`],
      ["a props object", `const b = { role: "alertdialog" };`],
      ["a comment", `// [role="dialog"] is what a selector says\nconst c = 1;`],
      ["a menu", `el.closest('[role="menu"]');`],
    ] as const) {
      expect(selectorsIn(code, "f.tsx"), name).toHaveLength(0);
    }
  });
});
