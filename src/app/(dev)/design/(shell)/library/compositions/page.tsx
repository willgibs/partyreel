import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { FamilyGallery } from "@/app/(dev)/design/gallery/family-gallery";
import { Column } from "@/app/(dev)/design/reference/reference-ui";

// THE LIVE COMPOSITIONS GALLERY. Every specimen is a REAL product component
// imported from production and rendered from sample props (gallery-demos.tsx):
// no DB, no R2, no seeded event. The page is a renderer over that declaration
// rather than a document of hand-written blocks, so each component's
// description, its variants, its specimen source and its permalink come from
// one entry. The entries carry their own file and title, because the
// design-rules collector does not index src/components/app.
export default async function CompositionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  return (
    <Column>
      <FamilyGallery
        family="compositions"
        title="Compositions"
        blurb="The real product components, imported from production and rendered from sample props. This is the live app UI, the way it ships, browsable without seeding an event."
        link={(href) => withDesignKey(href, key)}
      />
    </Column>
  );
}
