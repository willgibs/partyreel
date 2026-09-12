import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { FamilyGallery } from "../gallery/family-gallery";

// THE LIVE COMPOSITIONS GALLERY. Every specimen is a REAL product component
// imported from production and rendered from sample props (gallery-demos.tsx):
// no DB, no R2, no seeded event. The page is now a renderer over that
// declaration rather than a document of hand-written <Spec> blocks, so each
// component's description, its variants and its permalink come from one entry.
// The entries carry their own file and title, because the design-rules
// collector does not index src/components/app.
export default async function CompositionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <FamilyGallery
        family="compositions"
        eyebrow="Reference · live"
        title="Compositions"
        blurb="The real product components, imported from production and rendered from sample props. This is the live app UI, the way it ships, browsable without seeding an event."
        link={(href) => withDesignKey(href, key)}
      />
    </main>
  );
}
