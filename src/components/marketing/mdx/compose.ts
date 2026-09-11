/**
 * Composes the MDX vocabulary from its lane files. A name registered twice is
 * a parallel duplicate (two tracks, one component name, two renderings), and
 * it must fail loudly at module init, which both `pnpm test`
 * (help-mdx-compile.test.ts imports the map) and the build will see. One
 * name, one home: docs/tracks/README.md.
 */
export function composeMdxComponents<
  A extends object,
  B extends object,
  C extends object,
>(shared: A, help: B, blog: C): A & B & C {
  const seen = new Set<string>();
  for (const source of [shared, help, blog]) {
    for (const key of Object.keys(source)) {
      if (seen.has(key)) {
        throw new Error(
          `mdx: <${key}> is registered twice; one name, one home (docs/tracks/README.md)`,
        );
      }
      seen.add(key);
    }
  }
  return { ...shared, ...help, ...blog };
}
