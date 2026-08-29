import { MorphDelegate } from "@/components/marketing/system/morph-delegate";

/**
 * THE ROLE MORPH — the listing card's emblem grows into the role page's avatar,
 * so arriving there feels like following a thing rather than loading a page.
 *
 * Configuration only. The mechanism lives in
 * [MorphDelegate](../../system/morph-delegate.tsx), shared with the blog's cover
 * morph since the careers merge (2026-08-29). Cards opt in by rendering
 * `data-role-morph` on the link, and every emblem carries `data-role-emblem`;
 * the role page's own emblem carries `data-role-emblem="target"`.
 *
 * Mounted from the careers-scoped layout, which is the narrowest one covering
 * both ends of the hop, so no other route pays for the listener.
 */
export function RoleMorphDelegate() {
  return (
    <MorphDelegate
      name="role-emblem"
      linkAttr="data-role-morph"
      plateAttr="data-role-emblem"
    />
  );
}
