/**
 * THE PAGE AS MARKDOWN (the Library x Lab round, 2026-09-15).
 *
 * Copy page used to hand over `innerText`, which is the one format nobody can
 * use: the headings, the lists, the tables and the links all arrive as a wall
 * of lines, so pasting a rule page into a plan lost every reference in it.
 * This walks the rendered structure instead and writes real markdown, which
 * means a pasted page still links to its policies and still reads as a table.
 *
 * Structure, not styling: only the elements that CARRY meaning are translated
 * (headings, paragraphs, lists, tables, definition lists, code, links, rules,
 * quotes, images); a div is a passthrough and a class is never read. Controls
 * are dropped (a button is an action, not content), as is anything marked
 * `data-copy-skip` or `aria-hidden` (the shell marks its own chrome).
 *
 * Pure: it takes an Element and returns a string, so its test is a jsdom
 * fixture rather than a rendered page.
 */

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "SVG",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "IFRAME",
  "VIDEO",
  "AUDIO",
  "CANVAS",
]);

const HEADINGS: Record<string, string> = {
  H1: "#",
  H2: "##",
  H3: "###",
  H4: "####",
  H5: "#####",
  H6: "######",
};

export type MarkdownOptions = {
  /** Absolute origin, so a relative href survives the paste. */
  origin?: string;
};

function skipped(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("aria-hidden") === "true") return true;
  return el.hasAttribute("data-copy-skip");
}

/**
 * Inline markdown for a node's children: emphasis, code and links kept.
 *
 * TWO ELEMENT SIBLINGS WITH NO TEXT BETWEEN THEM GET A SPACE. The separation a
 * reader sees in a row like `<span>file.ts</span><a>gh</a>` is a flex `gap`,
 * not whitespace, so a faithful concatenation produced "file.tsgh". A space is
 * added only between adjacent ELEMENTS: prose keeps its own spacing exactly,
 * because text nodes are copied through untouched.
 */
function inline(node: Node, opt: MarkdownOptions): string {
  let out = "";
  let afterElement = false;
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      const text = (child.textContent ?? "").replace(/\s+/g, " ");
      if (text) afterElement = false;
      out += text;
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as Element;
    if (skipped(el)) return;
    const text = inline(el, opt);
    if (afterElement && text && out && !/\s$/.test(out) && !/^\s/.test(text))
      out += " ";
    if (text) afterElement = true;
    switch (el.tagName) {
      case "BR":
        out += "\n";
        break;
      case "CODE":
        out += text.trim() ? `\`${text.trim()}\`` : "";
        break;
      case "STRONG":
      case "B":
        out += text.trim() ? `**${text.trim()}**` : "";
        break;
      case "EM":
      case "I":
        out += text.trim() ? `*${text.trim()}*` : "";
        break;
      case "A": {
        const href = (el as HTMLAnchorElement).getAttribute("href") ?? "";
        const label = text.trim();
        if (!label) break;
        out += href ? `[${label}](${absolute(href, opt)})` : label;
        break;
      }
      case "IMG": {
        const alt = el.getAttribute("alt") ?? "";
        const src = el.getAttribute("src") ?? "";
        out += src ? `![${alt}](${absolute(src, opt)})` : "";
        break;
      }
      case "KBD":
        out += text.trim() ? `\`${text.trim()}\`` : "";
        break;
      default:
        out += text;
    }
  });
  return out;
}

function absolute(href: string, opt: MarkdownOptions): string {
  if (!opt.origin || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//"))
    return href;
  return href.startsWith("/") ? `${opt.origin}${href}` : href;
}

const tidy = (text: string) => text.replace(/[ \t]+/g, " ").trim();

/**
 * ONE CELL'S TEXT: a list item, a stat tile, a pill. These hold BLOCKS (a name
 * in one `<p>`, its file in the next, its citations in a third), and running
 * `inline()` over the lot ran the words together ("no-em-dash-policysrc/lib/…").
 * The blocks are read properly and then joined on one line, because a cell is
 * one line by definition.
 */
function cellText(el: Element, opt: MarkdownOptions, sep = " "): string {
  const inner: string[] = [];
  blocks(el, opt, inner);
  const text = inner.length ? inner.join(sep) : inline(el, opt);
  return tidy(text.replace(/\n+/g, " "));
}

/** One list, its items prefixed and its nested lists indented two spaces. */
function listBlock(el: Element, opt: MarkdownOptions, depth: number): string {
  const ordered = el.tagName === "OL";
  const lines: string[] = [];
  let n = 1;
  for (const li of Array.from(el.children)) {
    if (li.tagName !== "LI" || skipped(li)) continue;
    const nested = Array.from(li.children).filter(
      (c) => c.tagName === "UL" || c.tagName === "OL",
    );
    const clone = li.cloneNode(true) as Element;
    Array.from(clone.children)
      .filter((c) => c.tagName === "UL" || c.tagName === "OL")
      .forEach((c) => c.remove());
    const head = cellText(clone, opt, " · ");
    const marker = ordered ? `${n++}.` : "-";
    const pad = "  ".repeat(depth);
    if (head) lines.push(`${pad}${marker} ${head}`);
    for (const child of nested) lines.push(listBlock(child, opt, depth + 1));
  }
  return lines.filter(Boolean).join("\n");
}

function tableBlock(el: Element, opt: MarkdownOptions): string {
  const rows = Array.from(el.querySelectorAll("tr")).filter(
    (tr) => !skipped(tr),
  );
  if (rows.length === 0) return "";
  const cells = rows.map((tr) =>
    Array.from(tr.children)
      .filter((c) => c.tagName === "TD" || c.tagName === "TH")
      .map((c) => tidy(inline(c, opt)).replace(/\|/g, "\\|")),
  );
  const width = Math.max(...cells.map((r) => r.length));
  if (width === 0) return "";
  const pad = (row: string[]) =>
    `| ${[...row, ...Array(width - row.length).fill("")].join(" | ")} |`;
  const hasHead = rows[0].querySelector("th") !== null;
  const head = hasHead ? cells[0] : Array(width).fill("");
  const body = hasHead ? cells.slice(1) : cells;
  return [
    pad(head),
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...body.map(pad),
  ].join("\n");
}

function definitionBlock(el: Element, opt: MarkdownOptions): string {
  const lines: string[] = [];
  let term = "";
  // DESCENDANTS, not children: a `<dl>` laid out as a flex row wraps each pair
  // in its own div, which is legal HTML and the shape the page header uses; a
  // direct-children scan found no pair at all and printed nothing.
  for (const child of Array.from(el.querySelectorAll("dt, dd"))) {
    if (skipped(child)) continue;
    if (child.tagName === "DT") term = tidy(inline(child, opt));
    else if (child.tagName === "DD") {
      const value = tidy(inline(child, opt));
      if (term || value)
        lines.push(`- **${term}**${value ? `: ${value}` : ""}`);
      term = "";
    }
  }
  return lines.join("\n");
}

/** The blocks of one element, in document order. */
function blocks(el: Element, opt: MarkdownOptions, out: string[]): void {
  for (const child of Array.from(el.children)) {
    if (skipped(child)) continue;
    const tag = child.tagName;
    if (HEADINGS[tag]) {
      const text = tidy(inline(child, opt));
      if (text) out.push(`${HEADINGS[tag]} ${text}`);
      continue;
    }
    switch (tag) {
      case "P":
      case "FIGCAPTION": {
        const text = tidy(inline(child, opt));
        if (text) out.push(text);
        continue;
      }
      case "UL":
      case "OL": {
        const text = listBlock(child, opt, 0);
        if (text) out.push(text);
        continue;
      }
      case "DL": {
        const text = definitionBlock(child, opt);
        if (text) out.push(text);
        continue;
      }
      case "TABLE": {
        const text = tableBlock(child, opt);
        if (text) out.push(text);
        continue;
      }
      case "PRE": {
        const code = (child.textContent ?? "").replace(/\s+$/, "");
        if (code.trim())
          out.push(
            `\`\`\`${child.getAttribute("data-language") ?? ""}\n${code}\n\`\`\``,
          );
        continue;
      }
      case "BLOCKQUOTE": {
        const inner: string[] = [];
        blocks(child, opt, inner);
        const text = inner.length
          ? inner.join("\n\n")
          : tidy(inline(child, opt));
        if (text)
          out.push(
            text
              .split("\n")
              .map((line) => `> ${line}`.trimEnd())
              .join("\n"),
          );
        continue;
      }
      case "HR":
        out.push("---");
        continue;
      default: {
        // A ROW OF PILLS, marked by the page: one line, its cells joined, not
        // one paragraph per chip. Without it a header's badges came out as a
        // stack of one-word paragraphs.
        if (child.hasAttribute("data-copy-row")) {
          const cells = Array.from(child.children)
            .filter((c) => !skipped(c))
            .map((c) => cellText(c, opt))
            .filter(Boolean);
          if (cells.length) out.push(cells.join(" · "));
          continue;
        }
        // A layout element: recurse. A leaf that holds only text (a chip, a
        // meta line) becomes its own paragraph so nothing is lost.
        if (child.children.length === 0) {
          const text = tidy(inline(child, opt));
          if (text) out.push(text);
        } else {
          blocks(child, opt, out);
        }
      }
    }
  }
}

/** The element's content as markdown, blocks separated by a blank line. */
export function elementToMarkdown(
  root: Element | null,
  opt: MarkdownOptions = {},
): string {
  if (!root) return "";
  const out: string[] = [];
  blocks(root, opt, out);
  return out
    .map((block) => block.trimEnd())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type PageFacts = {
  title: string;
  /** Area > section > item, from the nav. */
  breadcrumbs?: string[];
  description?: string;
  badges?: string[];
  meta?: [string, string][];
  url?: string;
};

/**
 * The page's own data as the document's head: the title, the trail, the line
 * under it, the pills and the meta pairs the PageHeader was given. Everything
 * here is the page's DATA (props), never a reading of its pixels.
 */
export function factsToMarkdown(facts: PageFacts): string {
  const out: string[] = [`# ${facts.title}`];
  const trail = facts.breadcrumbs?.filter(Boolean) ?? [];
  const line = [
    trail.length > 1 ? trail.slice(0, -1).join(" > ") : "",
    facts.url ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (line) out.push(line);
  if (facts.description) out.push(facts.description);
  if (facts.badges?.length)
    out.push(facts.badges.map((b) => `\`${b}\``).join(" "));
  if (facts.meta?.length)
    out.push(facts.meta.map(([k, v]) => `- **${k}**: ${v}`).join("\n"));
  return out.filter(Boolean).join("\n\n");
}
