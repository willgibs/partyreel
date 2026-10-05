import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { requireDesignKey } from "@/lib/design-gate/server";

import { RootLayoutCrash } from "./root-layout-crash";

// PERMANENT boundary probe (program Phase 2, slice 4). Behind the design-lab
// gate (prod 404s without ?key=), this page crashes on purpose so we can verify
// the error-boundary chain + Sentry render:* tagging against the REAL production
// build whenever boundaries change. Dev mode shows Next's overlay instead, so
// only prod exercises either mode.
//
// TWO MODES, ONE PER LAST BOUNDARY:
//  - bare: throws during server render. There is no error.tsx in the (dev) group
//    BY DESIGN, so the crash escalates past the group into the ROOT boundary,
//    src/app/error.tsx (`render:root`; since errors-wiring, 2026-09-19).
//  - `?boundary=global`: crashes the ROOT LAYOUT's own subtree (root-layout-crash.tsx
//    says how, without a line in app/layout.tsx), the one failure that reaches
//    src/app/global-error.tsx (`render:global`). Try again crashes it again.
export default async function BoundaryProbe({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { boundary } = await searchParams;
  if (boundary === "global") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
        <PageHeader
          title="Boundary probe: the root layout"
          description="Crashes the root layout itself, so the last-resort screen draws. It needs a production build: in dev, Next shows its overlay instead."
        />
        <Callout kind="note" title="It crashes on purpose">
          A moment after this page loads it hands the layout&apos;s own toaster
          a toast that throws while it renders. The toaster sits beside the
          page, so the root error boundary cannot catch it and global-error
          replaces the whole document: the plain screen, in the system font,
          with no &ldquo;Still stuck?&rdquo; line. If that line is there, the
          crash was caught one boundary too low; the bare probe is the one for
          the root boundary. Try again crashes it again, and Back home leaves.
        </Callout>
        <RootLayoutCrash />
      </div>
    );
  }
  throw new Error(
    "design-lab boundary probe: intentional render crash (not a real failure)",
  );
}
