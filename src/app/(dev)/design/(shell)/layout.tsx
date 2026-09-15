import { Suspense } from "react";

import { LabChrome } from "@/components/dev/board/lab-chrome";

import { buildNav } from "@/app/(dev)/design/_data/nav";
import { Shell } from "./_shell/shell";

/**
 * THE SHELL (the Library x Lab round, 2026-09-15): every page a person reads
 * renders inside this layout (the top bar with the two areas, the sidebar,
 * the content column, the table of contents); the iframe scene routes under
 * sandbox/ sit outside the group and get only the thin root layout, as an
 * iframe document must. The nav is built here, server-side, from the
 * registries and the docs, and handed to the client chrome as data.
 */
export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nav = await buildNav();
  return (
    <>
      {/* useSearchParams (the key) needs a Suspense boundary; every lab route
          is already dynamic via requireDesignKey, so this never suspends long. */}
      <Suspense>
        <Shell nav={nav}>{children}</Shell>
      </Suspense>
      {/* The reading preferences (1:1 stages, the sidebar tucked away on a
          board page) applied to <html>; see dev/board/lab-prefs.ts. */}
      <LabChrome />
    </>
  );
}
