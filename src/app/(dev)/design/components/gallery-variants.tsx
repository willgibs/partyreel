import Image from "next/image";

import { EVENT_NAME, PHOTOS, PORTRAIT_PHOTO } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the gallery grid, the page's center of gravity. Same photos,
 * three fields. (Aspect handling differs: uniform crops vs natural ratios.)
 */
export function GalleryVariants() {
  const all = [...PHOTOS, PORTRAIT_PHOTO];
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Uniform grid"
        rationale="Square crops, even gaps: calm, scannable, photographic democracy. The camera-roll feel everyone already knows."
      >
        <Page>
          <div data-dir-stagger className="mt-3 grid grid-cols-3 gap-1.5">
            {all.slice(0, 12).map((src, i) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden"
                style={
                  { "--i": i, borderRadius: "calc(var(--radius) * 0.6)" } as React.CSSProperties
                }
              >
                <Image src={src} alt="" fill sizes="100px" className="object-cover" />
              </div>
            ))}
          </div>
        </Page>
      </Variant>

      <Variant
        n={2}
        name="Masonry columns"
        rationale="Natural aspect ratios in flowing columns: editorial, every photo keeps its own shape, verticals get their height."
      >
        <Page>
          <div data-dir-stagger className="mt-3 columns-2 gap-1.5">
            {[PORTRAIT_PHOTO, ...PHOTOS].slice(0, 9).map((src, i) => (
              <div
                key={src}
                className="relative mb-1.5 w-full overflow-hidden"
                style={
                  {
                    "--i": i,
                    borderRadius: "calc(var(--radius) * 0.6)",
                    aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/3",
                  } as React.CSSProperties
                }
              >
                <Image src={src} alt="" fill sizes="150px" className="object-cover" />
              </div>
            ))}
          </div>
        </Page>
      </Variant>

      <Variant
        n={3}
        name="Edge-to-edge"
        rationale="Hairline gaps, no radius, full bleed: the photos become one continuous surface. The most immersive, least chrome."
      >
        <div className="absolute inset-0">
          <div className="px-4 pt-12 pb-3">
            <p data-dir-display className="text-xl leading-snug">
              {EVENT_NAME}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              128 photos & videos
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border" data-dir-stagger>
            {all.slice(0, 12).map((src, i) => (
              <div key={src} style={{ "--i": i } as React.CSSProperties} className="relative aspect-square overflow-hidden">
                <Image src={src} alt="" fill sizes="110px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Variant>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 px-4 pt-12">
      <p data-dir-display className="text-xl leading-snug">
        {EVENT_NAME}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        128 photos & videos
      </p>
      {children}
    </div>
  );
}
