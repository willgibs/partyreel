import { requireDesignKey } from "../gate";

// PERMANENT boundary probe (program Phase 2, slice 4). Behind the design-lab
// gate (prod 404s without ?key=), this page throws during server render on
// purpose so we can verify the error-boundary chain + Sentry render:* tagging
// against the REAL production build whenever boundaries change. There is no
// error.tsx in the (dev) group BY DESIGN: the crash escalates past the root
// layout into global-error.tsx, the hardest boundary to verify any other way
// (dev mode shows the overlay instead, so only prod exercises it).
export default async function BoundaryProbe({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  throw new Error(
    "design-lab boundary probe: intentional render crash (not a real failure)",
  );
}
