import artifact from "./specimens.generated.json";

/**
 * THE SPECIMEN SOURCE, read side (the Library x Lab round, 2026-09-15).
 *
 * Every specimen's JSX exactly as the family's `gallery-demos.tsx` declares
 * it, derived by collect-specimens.mjs so the Code tab can never disagree with
 * the Preview beside it. Nothing here touches the filesystem: the artifact is
 * an import, so it ships with the bundle.
 */
type SpecimenArtifact = {
  version: number;
  code: Record<string, string[]>;
  /** What the collector met and could not read; specimens.test.ts holds it at empty. */
  unread: string[];
};

const SPECIMENS = artifact as SpecimenArtifact;

/** The JSX of one specimen, by entry id and its index in `specimens`. */
export function specimenCode(id: string, index: number): string | undefined {
  const code = SPECIMENS.code[id]?.[index];
  return code ? code : undefined;
}

/** How many specimens the artifact holds, for the library's health strip. */
export function countSpecimenCode(): number {
  return Object.values(SPECIMENS.code).reduce(
    (n, list) => n + list.filter(Boolean).length,
    0,
  );
}
