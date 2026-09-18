/**
 * THE OLD LAB URLS (the Library x Lab round, 2026-09-15). Every route the lab
 * had before the two areas redirects to its new home, 307 so nothing caches it
 * and the request's `?key=` travels (Next forwards the query to a destination
 * that declares none). `next.config.ts` appends this list to its redirects;
 * `legacy-routes.test.ts` holds every destination against a live route.
 */
export const LAB_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/design/components", destination: "/design/library/components" },
  { source: "/design/patterns", destination: "/design/library/patterns" },
  {
    source: "/design/compositions",
    destination: "/design/library/compositions",
  },
  { source: "/design/marketing", destination: "/design/library/marketing" },
  { source: "/design/foundations", destination: "/design/library/foundations" },
  { source: "/design/rules", destination: "/design/library/rules" },
  { source: "/design/record", destination: "/design/library/rulings" },
  { source: "/design/c", destination: "/design/lab" },
  { source: "/design/c/:board", destination: "/design/lab/:board" },
  { source: "/design/motion", destination: "/design/lab/tools/motion" },
  {
    source: "/design/reel-parity",
    destination: "/design/lab/tools/reel-parity",
  },
  {
    source: "/design/stream-probe",
    destination: "/design/lab/tools/stream-probe",
  },
  { source: "/design/boom", destination: "/design/lab/tools/boom" },
];

/**
 * The repo files the shell reads at request time (the desk's manifests, the
 * proposals, the rulings, the record, the doctrine): outside the bundle unless
 * traced in. One key covers every shell route (Next matches the key against
 * each route path with picomatch `contains`).
 */
export const TRACED_DOC_GLOBS = [
  "./docs/tracks/*.md",
  "./docs/specs/*.md",
  "./docs/design/*.md",
  "./docs/reviews/*.json",
  "./docs/systems/design-system.md",
  "./docs/systems/marketing-content.md",
  "./docs/PROGRAM.md",
  "./CLAUDE.md",
  "./.agents/skills/emil-design-eng/SKILL.md",
];
