import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { FamilyGallery } from "@/app/(dev)/design/gallery/family-gallery";
import { Column } from "@/app/(dev)/design/reference/reference-ui";

// THE LIVE COMPONENTS GALLERY. Every specimen is the REAL primitive imported
// from production source (gallery-demos.tsx): edit a component, this updates.
// The page is a renderer over that declaration rather than a document of
// hand-written blocks, so a component's variants, its config panel, its
// specimen source and its permalink all come from the same entry.
export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  return (
    <Column>
      <FamilyGallery
        family="components"
        title="Components"
        blurb="The real UI primitives, imported from production source and rendered here with their declared variants. What you tune in the component file shows up on this page and across the app at once."
        link={(href) => withDesignKey(href, key)}
      />
    </Column>
  );
}
