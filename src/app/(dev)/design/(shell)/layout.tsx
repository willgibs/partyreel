import { Suspense } from "react";

import { LabChrome } from "@/components/dev/board/lab-chrome";

import { buildNav, buildSearchIndex } from "@/app/(dev)/design/_data/nav";
import { Shell } from "./_shell/shell";

/**
 * THE SHELL (the Library x Lab round, 2026-09-15): every page a person reads
 * renders inside this layout (the top bar with the two areas, the sidebar,
 * the content column, the table of contents); the iframe scene routes under
 * sandbox/ sit outside the group and get only the thin root layout, as an
 * iframe document must. The nav AND the search index are built here,
 * server-side, from the registries and the docs, and handed to the client
 * chrome as data: a layout renders once per full load and is kept across
 * client navigations, so the index is paid for once rather than per page.
 */
export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nav = await buildNav();
  const index = buildSearchIndex(nav);
  return (
    <>
      {/* useSearchParams (the key, and the rest of the URL state) needs a
          Suspense boundary; every lab route is already dynamic via
          requireDesignKey, so this never suspends long. */}
      <Suspense>
        <Shell nav={nav} index={index}>
          {children}
        </Shell>
      </Suspense>
      {/* The reading preferences (1:1 stages, the sidebar tucked away on a
          board page) applied to <html>; see dev/board/lab-prefs.ts. */}
      <LabChrome />
    </>
  );
}
