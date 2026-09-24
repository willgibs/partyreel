/**
 * THE OLD LAB URLS. Every route the lab and the Library no longer serve
 * redirects to its nearest page, 307 so nothing caches it and the request's
 * `?key=` travels (Next forwards the query to a destination that declares
 * none). `next.config.ts` appends this list to its redirects;
 * `legacy-routes.test.ts` holds every destination against a live route, and
 * `lab:smoke` follows each one.
 *
 * The Library's retired pages land on the page that now carries what they
 * pointed at: the policies, the guidance and the doctrine on the Library's
 * home (its design recipe says the tests are the real rules and production is
 * the reference), a principle's own page on the ten, and the old rulings
 * record on the ten as well.
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
  { source: "/design/record", destination: "/design/library/rules" },
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
  { source: "/design/library/policies", destination: "/design/library" },
  { source: "/design/library/guidance", destination: "/design/library" },
  { source: "/design/library/doctrine/:doc", destination: "/design/library" },
  { source: "/design/library/rules/:id", destination: "/design/library/rules" },
];

/**
 * The repo files the shell reads at request time (the desk's manifests and
 * the review ledgers): outside the bundle unless traced in. One key covers
 * every shell route (Next matches the key against each route path with
 * picomatch `contains`). A glob must match a file (`legacy-routes.test.ts`),
 * so `docs/specs/` rejoins the list the day a board writes a proposal
 * document again.
 */
export const TRACED_DOC_GLOBS = ["./docs/tracks/*.md", "./docs/reviews/*.json"];
