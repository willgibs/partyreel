import { MorphDelegate } from "@/components/marketing/system/morph-delegate";

/**
 * THE COVER MORPH — the index card's photograph grows into the article's plate.
 *
 * Configuration only. The mechanism, and every hard-won guard around it, lives
 * in [MorphDelegate](../system/morph-delegate.tsx): it was written here first,
 * the careers round rebuilt it line for line a week later, and the two collapsed
 * at that merge. Cards opt in by rendering `data-cover-morph` on the link and
 * `data-cover-plate` on the image wrapper; the article's own cover carries
 * `data-cover-plate="target"`.
 *
 * ★ NOT a client component itself. Only the delegate needs "use client", so a
 * server page importing this ships nothing but the three strings below.
 */
export function CoverMorphDelegate() {
  return (
    <MorphDelegate
      name="blog-cover"
      linkAttr="data-cover-morph"
      plateAttr="data-cover-plate"
    />
  );
}
