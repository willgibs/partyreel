import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";

import { filesUnder, read } from "@/testing/source-tree";

import { getAllPosts } from "./blog";
import { getAllArticles } from "./help";

/**
 * The mock-fidelity rule, enforced (the help-catalog round, 2026-09-01):
 * every string an article quotes inside <UiLabel> must be said by a control
 * of the shipped app, so a reader who opens the product recognizes every
 * control the help center named. Whitespace is collapsed on both sides and
 * MDX entities are decoded, so a label that wraps in JSX still matches.
 *
 * ★ THE BLOG QUOTES THE SAME CONTROLS, SO IT IS HELD TO THE SAME PRODUCT (help-words): posts told a host to leave
 * "Require verified emails" on, a switch the product renamed "An email first", because the blog's labels were read by
 * nothing. A post's <UiLabel> is checked exactly as an article's is, and it has no baseline: no post quotes a label
 * the product does not say.
 *
 * ★ WHAT IS READ IS THE PRODUCT'S OWN COPY (crumbs-77): the string literals,
 * template pieces and JSX text of its source, never a comment, an identifier
 * or a class name. The scan used to match the label as a substring of the raw
 * source, so a control the product had dropped still passed on the comment
 * that remembered it (the retired export dialog kept "Download album" "for what
 * quotes it" after the menu left, and two articles walk a menu that is
 * gone) or on the marketing mock that draws it. What a control says to a
 * reader is read the way a reader gets it (`copyOf`): an element's own text
 * and its children's, across the wrappers it is drawn in and each branch of a
 * choice (`a ? <b>Show</b> : null`), and never glued across a value the source
 * cannot know (`Add {n} photos` says no "Add photos").
 *
 * Scope: every .ts/.tsx under src/ EXCEPT tests, the help pages (which would
 * match their own rendering), the MDX components (which quote nothing), the
 * lab (`src/app/(dev)/` and its kit, `src/components/lab/`), the
 * marketing site (`src/components/marketing/`, `src/app/(marketing)/`), and
 * the operator's portal (`src/app/admin/`, `src/components/admin/`,
 * `src/lib/admin/`, and `src/lib/jobs/`, whose switches the portal labels).
 * ★ THE LAB, THE MARKETING SITE AND THE PORTAL ARE NOT THE PRODUCT (crumbs-49,
 * crumbs-77, help-words): a board quotes the very strings it proposes to
 * retire, a marketing mock quotes the product's copy on purpose
 * (`mock-parity.test.ts` holds it to the product, not the other way round),
 * and the portal names controls in the operator's words ("Download all" is
 * still a card on /admin/exports and a spend-watch switch, a button no guest
 * has had since take-home r1), so a stale label that only a board, a mock or
 * the portal still carries would pass while no control a reader meets says
 * it (help-center's old stub hid "Tap to retry" in two articles that way, and
 * "Download all" stood in four articles and seven posts the same way).
 */
const SKIP =
  /\.test\.tsx?$|\/help\/|mdx-components\.tsx$|\/mdx\/spec-[a-z]+\.tsx$|\/app\/\(dev\)\/|\/components\/lab\/|\/components\/marketing\/|\/app\/\(marketing\)\/|\/app\/admin\/|\/components\/admin\/|\/lib\/admin\/|\/lib\/jobs\//;

/** The product's source: every .ts and .tsx under src/ that SKIP leaves in. */
const productSource = () =>
  filesUnder("src").filter((path) => /\.tsx?$/.test(path) && !SKIP.test(path));

function normalize(text: string): string {
  return (
    text
      // JSX's explicit space token and the typographic apostrophe both read as
      // their plain forms on screen, so both sides compare in plain form.
      .replace(/\{" "\}/g, " ")
      .replace(/’/g, "'")
      .replace(/&rsquo;|&#39;|&apos;/g, "'")
      .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&hellip;/g, "…")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * What stands where a value the source cannot know is drawn (`{count}`, a call): a character no label holds, so a
 * label never matches across it, and what separates every string of the corpus for the same reason.
 */
const HOLE = "\u0000";

/**
 * Everything the product's source SAYS, as a list of strings: each string literal, each piece of a template, each
 * run of JSX text, and each JSX element's whole text as a reader gets it. Comments are no node of the tree, so they
 * are never here (a JSX comment is an expression container with no expression), which is the point.
 */
function copyOf(source: string, name = "source.tsx"): string[] {
  const file = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  /** The text a node draws: its words, its children's, and a HOLE for what it cannot say. */
  const textOf = (node: ts.Node | undefined): string => {
    if (!node) return "";
    if (ts.isJsxText(node) || ts.isStringLiteralLike(node)) return node.text;
    if (ts.isJsxExpression(node)) return textOf(node.expression);
    // A tag is a break, never a word: `Reason <span>(optional)</span>` reads "Reason (optional)".
    if (ts.isJsxElement(node) || ts.isJsxFragment(node))
      return ` ${node.children.map(textOf).join("")} `;
    if (ts.isJsxSelfClosingElement(node)) return " ";
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node)
    )
      return textOf(node.expression);
    if (ts.isTemplateExpression(node))
      return (
        node.head.text +
        node.templateSpans.map((span) => HOLE + span.literal.text).join("")
      );
    // Each branch of a choice is a way it may read, so a label on either one is a label the product says.
    if (ts.isConditionalExpression(node))
      return textOf(node.whenTrue) + HOLE + textOf(node.whenFalse);
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken)
        return textOf(node.right);
      if (
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      )
        return textOf(node.left) + HOLE + textOf(node.right);
    }
    if (
      node.kind === ts.SyntaxKind.NullKeyword ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword
    )
      return "";
    return HOLE;
  };
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      found.push((node as { text: string }).text);
    }
    if (ts.isJsxElement(node) || ts.isJsxFragment(node))
      found.push(textOf(node));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/** The product's copy, one string, each piece normalised and kept apart from the next (`HOLE`) so none is matched across. */
const corpusOf = (sources: Iterable<{ source: string; name?: string }>) =>
  [...sources]
    .flatMap(({ source, name }) => copyOf(source, name))
    .map(normalize)
    .join(HOLE);

/**
 * Labels an article quotes that no control of the product says: the scan found each one only in a comment or a mock,
 * which is how they went unseen. A BASELINE THAT MAY ONLY SHRINK, the way the row-cap allow-lists are: an entry fails
 * once the product says its label again, or its article stops quoting it, so fixing the article is deleting the entry.
 * The articles are the help catalog's (`content/help/`), not this test's: each `why` says what the product says now.
 * Empty is the steady state: a label an article quotes is one a control says, and a new entry is a debt owed.
 */
const NOT_SHIPPED: { slug: string; label: string; why: string }[] = [];

/** A scan reads about 1,100 files through the TypeScript parser, a second or two alone; under a loaded run it needs a budget of its own. */
const SCAN_BUDGET_MS = 60_000;

describe("the scan reads the product's source and not the lab's", () => {
  // By path, so it holds whatever the repo contains today: a board's file, the lab kit's or a marketing
  // mock is out, a guest page, a shared component and a lib are in.
  it.each([
    "/r/src/app/(dev)/design/sandbox/locked-door/board.tsx",
    "/r/src/app/(dev)/design/(shell)/library/patterns/gallery-demos.tsx",
    "/r/src/components/lab/step.tsx",
    "/r/src/components/guest/door/doors.test.tsx",
    "/r/src/components/marketing/help/checklist.tsx",
    "/r/src/components/marketing/sections/features/sharing/zip-modal-demo.tsx",
    "/r/src/components/marketing/frames/phone-frame.tsx",
    "/r/src/app/(marketing)/(cinema)/features/sharing/page.tsx",
    "/r/src/app/admin/exports/page.tsx",
    "/r/src/components/admin/health-band.tsx",
    "/r/src/lib/admin/palette.ts",
    "/r/src/lib/jobs/spend-watch.ts",
  ])("skips %s", (path) => {
    expect(SKIP.test(path)).toBe(true);
  });

  it.each([
    "/r/src/components/guest/door/welcome.tsx",
    "/r/src/app/(guest)/e/[token]/page.tsx",
    "/r/src/components/shared/not-found-screen.tsx",
    "/r/src/components/social/relation-toggle.tsx",
    "/r/src/components/app/export/take-home-panel.tsx",
    "/r/src/lib/guest/entry-steps.ts",
  ])("reads %s", (path) => {
    expect(SKIP.test(path)).toBe(false);
  });
});

describe("the scan reads what a control says, and nothing a comment or a name does", () => {
  const corpus = (source: string, name?: string) =>
    corpusOf([{ source, name }]);

  it("never reads a comment: a line, a block, a doc comment or a JSX one", () => {
    const said = corpus(
      [
        `// "Download album" was here`,
        `/* Unfollow */`,
        `/** The old "Tap to retry" */`,
        `export const Row = () => <p>{/* Hidden · Show */}Following</p>;`,
      ].join("\n"),
    );
    expect(said).toContain("Following");
    for (const gone of ["Download album", "Unfollow", "Tap to retry", "Hidden"])
      expect(said).not.toContain(gone);
  });

  it("reads a string, an attribute, a template's pieces and a plain .ts module", () => {
    const said = corpus(
      [
        `const a = "Add photos";`,
        "const b = `Delete ${name}?`;",
        `export const c = <button aria-label="Close sheet" title='Hide it' />;`,
      ].join("\n"),
    );
    for (const heard of ["Add photos", "Delete", "?", "Close sheet", "Hide it"])
      expect(said).toContain(heard);
    expect(
      corpus(`export const FACE = { on: "Following" };`, "face.ts"),
    ).toContain("Following");
  });

  it("reads a label across the wrappers it is drawn in, and across each branch of a choice", () => {
    expect(
      corpus(`const a = <p>Reason <span>(optional)</span></p>;`),
    ).toContain("Reason (optional)");
    expect(
      corpus(
        `const a = <p><span>Hidden</span><span aria-hidden>·</span>{on ? <button>Show</button> : null}</p>;`,
      ),
    ).toContain("Hidden · Show");
    expect(corpus(`const a = <p>Hidden · {on && <b>Show</b>}</p>;`)).toContain(
      "Hidden · Show",
    );
  });

  it("never glues across a value it cannot know, nor across two strings", () => {
    const said = corpus(
      `const a = <p>Add {count} photos</p>; const b = ["Save", "Cancel"];`,
    );
    expect(said).not.toContain("Add photos");
    expect(said).not.toContain("Save Cancel");
    expect(said).not.toContain("SaveCancel");
  });

  it("reads an explicit space and an entity the way the screen does", () => {
    const said = corpus(
      `const a = <p>Save{" "}changes, don&rsquo;t &amp; go</p>;`,
    );
    expect(said).toContain("Save changes, don't & go");
  });
});

describe("every <UiLabel> quotes a shipped app string", () => {
  let corpus = "";
  beforeAll(() => {
    const files = productSource();
    // Pinned for non-emptiness (the policy-test lesson): an empty walk would
    // make every label "missing" or, worse, every label pass.
    expect(files.length).toBeGreaterThan(300);
    expect(
      files.filter((f) =>
        /\(dev\)|\/components\/lab\/|\/components\/marketing\/|\/app\/\(marketing\)\/|\/app\/admin\/|\/components\/admin\/|\/lib\/admin\/|\/lib\/jobs\//.test(
          f,
        ),
      ),
    ).toEqual([]);
    corpus = corpusOf(
      files.map((file) => ({ source: read(file), name: file })),
    );
    // And the walk read copy: a control's own words are in it, one a conditional hides in a branch too.
    expect(corpus.length).toBeGreaterThan(100_000);
    expect(corpus).toContain("Following");
    expect(corpus).toContain("Hidden · Show");
  }, SCAN_BUDGET_MS);

  const articles = getAllArticles();
  expect(articles.length).toBeGreaterThan(0);

  const labelsOf = (body: string) =>
    [...body.matchAll(/<UiLabel>([\s\S]*?)<\/UiLabel>/g)].map((m) =>
      normalize(m[1]),
    );
  const knownGone = (slug: string, label: string) =>
    NOT_SHIPPED.some((entry) => entry.slug === slug && entry.label === label);

  for (const article of articles) {
    const labels = labelsOf(article.body);
    if (labels.length === 0) continue;
    it(`${article.slug}: ${labels.length} labels`, () => {
      for (const label of labels) {
        expect(
          label.length,
          `empty UiLabel in ${article.slug}`,
        ).toBeGreaterThan(0);
        if (knownGone(article.slug, label)) continue;
        expect(
          corpus.includes(label),
          `"${label}" (in ${article.slug}) is not a shipped app string: no control says it (a comment or a marketing mock may, which does not count)`,
        ).toBe(true);
      }
    });
  }

  const posts = getAllPosts();
  expect(posts.length).toBeGreaterThan(0);

  for (const post of posts) {
    const labels = labelsOf(post.body);
    if (labels.length === 0) continue;
    it(`blog ${post.slug}: ${labels.length} labels`, () => {
      for (const label of labels) {
        expect(
          label.length,
          `empty UiLabel in blog ${post.slug}`,
        ).toBeGreaterThan(0);
        expect(
          corpus.includes(label),
          `"${label}" (in blog ${post.slug}) is not a shipped app string: no control says it (a comment or a marketing mock may, which does not count)`,
        ).toBe(true);
      }
    });
  }

  it("the baseline of labels no control says only shrinks", () => {
    for (const { slug, label, why } of NOT_SHIPPED) {
      const article = articles.find((a) => a.slug === slug);
      expect(
        article,
        `${slug} is no longer an article: drop its entry`,
      ).toBeDefined();
      expect(
        labelsOf(article!.body),
        `${slug} no longer quotes "${label}": drop its entry`,
      ).toContain(label);
      expect(
        corpus.includes(label),
        `the product says "${label}" again: drop its entry (${slug})`,
      ).toBe(false);
      expect(why.length).toBeGreaterThan(40);
    }
  });
});
