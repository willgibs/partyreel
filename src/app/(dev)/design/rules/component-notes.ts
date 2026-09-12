/**
 * Notes on the component index (the hand layer that survived the "less is
 * more" reset, 2026-09-12). A component file the library does not import
 * needs an `unspecimened` reason here, or component-index.test.ts fails; the
 * reasons are the exceptions, not the rule. `for` is the one line the /design
 * index shows beside the name.
 */

export type ComponentNote = {
  /** One line: what the component is for. */
  for?: string;
  /** Why the library does not render it (a specimen is the default). */
  unspecimened?: string;
};

export const COMPONENT_NOTES: Record<string, ComponentNote> = {
  "src/components/marketing/system/web-analytics.tsx": {
    for: "the analytics singleton and the data-track listener",
    unspecimened:
      "a document singleton mounted once in the marketing layout; a second mount doubles every event, so the page lists it as text",
  },
  "src/components/shared/glow-filter.tsx": {
    for: "the turbulence field every Glow warps through",
    unspecimened:
      "a document singleton mounted once in the root layout; the lab must never mount a second",
  },
  "src/components/ui/sonner.tsx": {
    for: "the themed Toaster",
    unspecimened:
      "mounted once in the root layout; the toast demo on /design/components fires it",
  },
  "src/components/shared/app-shell.tsx": {
    for: "the signed-in app frame",
    unspecimened: "provider-bound (auth, the nav state); no in-lab harness",
  },
  "src/components/shared/claim-uploads-on-auth.tsx": {
    for: "claims a guest's uploads onto the account that just signed in",
    unspecimened:
      "an effect with no render of its own; it talks to Supabase on mount",
  },
  "src/components/shared/media-lightbox.tsx": {
    for: "the media lightbox with its gesture physics",
    unspecimened:
      "data- and provider-heavy; its behaviour pins live in media-lightbox.test.tsx",
  },
  "src/components/shared/media-lightbox.lazy.tsx": {
    for: "the lazy wrapper around the lightbox",
    unspecimened: "the lightbox's loader; see media-lightbox.tsx",
  },
  "src/components/shared/route-error.tsx": {
    for: "the route error boundary",
    unspecimened:
      "fires Sentry on mount; /design/patterns renders a static mock of its screen",
  },
  "src/components/shared/upload-thumbnail.tsx": {
    for: "the per-file thumbnail in the upload queue",
    unspecimened:
      "takes a live File from the upload queue; a specimen would need a client-made blob to show a square of nothing",
  },
  "src/components/marketing/sections/features/shared/feature-hero-eyebrow.tsx":
    {
      for: "the feature hero's one eyebrow",
    },
};
