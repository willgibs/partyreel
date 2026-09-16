import { headers } from "next/headers";

import { LabChrome } from "@/components/lab/lab-chrome";

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
 *
 * ★ NO SUSPENSE BOUNDARY AROUND THE PAGE. One around `{children}` let a
 * keyless production request stream this layout's props (the whole nav) under
 * a 200 before the page's own `notFound()` ran. The gate now runs in the proxy,
 * before any of this renders, and the key arrives as a request header rather
 * than from a client hook. Do not reintroduce either.
 */
export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nav = await buildNav();
  const index = buildSearchIndex(nav);
  // The gate key, forwarded by the proxy (a layout cannot read searchParams).
  // Empty in open dev; the links stay unkeyed then.
  const designKey = (await headers()).get("x-design-key") || null;
  return (
    <>
      <Shell nav={nav} index={index} designKey={designKey}>
        {children}
      </Shell>
      {/* The reading preferences (1:1 stages, the sidebar tucked away on a
          board page) applied to <html>; see dev/board/lab-prefs.ts. */}
      <LabChrome />
    </>
  );
}
