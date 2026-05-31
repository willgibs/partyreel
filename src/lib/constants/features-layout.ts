// Presentation map for the /features page — keeps `features.ts` pure content while the
// page composes a DISTINCT layout per group (the polish-arc "no two sections alike"
// bar). A Vitest guard asserts every FEATURE_GROUP id has an entry here, so a new group
// can never render unstyled. The reel marquee + the QR hero are page-level, not group
// treatments, so they're not in this map.

export type GroupPresentation =
  | {
      kind: "spotlight";
      frame: "phone" | "gallery" | "album";
      mediaSide: "left" | "right";
    }
  | { kind: "panel" } // privacy: a bespoke trust panel
  | { kind: "keepsake" }; // storage: a bespoke keepsake pair

export const FEATURE_PRESENTATION: Record<string, GroupPresentation> = {
  guests: { kind: "spotlight", frame: "phone", mediaSide: "left" },
  hosts: { kind: "spotlight", frame: "gallery", mediaSide: "right" },
  share: { kind: "spotlight", frame: "album", mediaSide: "right" },
  privacy: { kind: "panel" },
  storage: { kind: "keepsake" },
};
