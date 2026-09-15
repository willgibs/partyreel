import "server-only";

import { DOCS, landminesOf, readDoc } from "@/app/(dev)/design/_data/docs";

import type { GalleryItem } from "./registry";

/**
 * THE LANDMINES OF A COMPONENT'S SURFACE (the Library x Lab round, 2026-09-15).
 *
 * A ★ in a system doc is a silent breakage if reverted, never a design
 * decision (Will's ruling, 2026-09-12). They are the one thing an agent most
 * needs before it touches a file and the one thing it is least likely to go
 * looking for, because they live in two long documents, so the component's own
 * page carries the ones that name it.
 *
 * Matching is deliberately NARROW, because a false landmine is worse than a
 * missing one: the block must name the component's FILE (its repo path as
 * written, or its basename) or one of its exported names in backticks or as a
 * JSX tag. A name mentioned in running prose is prose. When the rules track's
 * `bindsFor` lands this is what it replaces, and the page reads that instead.
 */
export type SurfaceLandmine = {
  /** The block's markdown, the ★ lifted off. */
  text: string;
  /** The nearest heading above it, and its anchor in the rendered doc. */
  under: string;
  /** A ref string the shell's `Ref` resolves (`docs/systems/x.md#anchor`). */
  ref: string;
  doc: string;
};

const DOC_IDS = ["design-system", "marketing-content"] as const;

/** `src/components/ui/button.tsx` -> `button.tsx`. */
function basename(file: string): string {
  return file.slice(file.lastIndexOf("/") + 1);
}

/**
 * The names worth matching on: an exported identifier that reads as a
 * component or a hook. Two characters or fewer is noise, and a name the docs
 * only ever write in prose is caught by the backtick requirement below.
 */
function names(item: GalleryItem): string[] {
  const declared = item.record?.names ?? [];
  return declared.filter((n) => n.length > 2);
}

function mentions(text: string, item: GalleryItem): boolean {
  const file = item.file;
  if (file) {
    // The docs link a file as `[`x.ts`](../../src/lib/x.ts)`, so the path is
    // matched as a suffix rather than from the start of the string.
    if (text.includes(file)) return true;
    if (text.includes(basename(file))) return true;
  }
  for (const name of names(item)) {
    if (text.includes(`\`${name}\``)) return true;
    if (new RegExp(`</?${name}[\\s/>]`).test(text)) return true;
  }
  return false;
}

/**
 * Every landmine in the two system docs that names this component. Read at
 * request time: both docs are traced into the shell's functions through
 * TRACED_DOC_GLOBS, so this works on the preview as well as on a dev server.
 */
export function landminesFor(item: GalleryItem): SurfaceLandmine[] {
  const out: SurfaceLandmine[] = [];
  for (const id of DOC_IDS) {
    const doc = DOCS[id];
    const { body } = readDoc(doc.path);
    for (const mine of landminesOf(body)) {
      if (!mentions(mine.text, item)) continue;
      out.push({
        text: mine.text,
        under: mine.under,
        ref: `${doc.path}#${mine.underId}`,
        doc: doc.title,
      });
    }
  }
  return out;
}
