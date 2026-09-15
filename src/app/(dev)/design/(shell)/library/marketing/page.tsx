import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { FamilyGallery } from "@/app/(dev)/design/gallery/family-gallery";

// THE MARKETING LIBRARY (the library round, 2026-09-02; declared in the gallery
// round, 2026-09-12): every component of the marketing system
// (@/components/marketing/system), every shared section atom, every frame and
// the feature family's furniture, imported from production and rendered on the
// real cinema skin. The specimens and the variants live in gallery-demos.tsx;
// this page is the skin and the renderer, and it declares no component of its
// own (marketing-library.test.ts pins both). The wrapper mirrors
// (cinema)/layout.tsx so the [data-mkt-*] grammar, the room ink and the paper
// chapter cut render as they ship.
export default async function MarketingLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <div
      className="dark overflow-x-clip bg-background text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      <main className="mx-auto w-full max-w-5xl px-6 pt-8 pb-20">
        <FamilyGallery
          family="marketing"
          eyebrow="Reference · live · cinema skin"
          title="Marketing"
          blurb="The marketing system and the shared section atoms, rendered from production source on the real cinema skin, each with its declared variants. Every specimen uses the props that exist today; the motion is marketing.css's own grammar, loaded by the lab layout."
          link={(href) => withDesignKey(href, key)}
        />
      </main>
    </div>
  );
}
