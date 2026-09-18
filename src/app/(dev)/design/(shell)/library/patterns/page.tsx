import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { FamilyGallery } from "@/app/(dev)/design/gallery/family-gallery";
import { Column } from "@/app/(dev)/design/reference/reference-ui";

// THE LIVE PATTERNS GALLERY. The composed shared/* pieces, rendered from the
// real components (gallery-demos.tsx). The page is a renderer over that
// declaration rather than a document of hand-written blocks, so a pattern's
// variants, its config panel, its specimen source and its permalink all come
// from one entry. The two patterns that cannot mount live (RouteError reports
// to Sentry, SetNameStep submits to a server action) say so on their own block.
export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  return (
    <Column>
      <FamilyGallery
        family="patterns"
        title="Patterns"
        blurb="The composed shared pieces, rendered from the real components. The dead-end and form patterns that mount a side effect are shown as a static or inert preview, noted on each."
        link={(href) => withDesignKey(href, key)}
      />
    </Column>
  );
}
