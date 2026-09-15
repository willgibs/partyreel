import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { ReelCanvasStyles } from "./parity";

/**
 * THE REEL CANVAS STYLE BROWSER. Every reel style on the canvas engine, on shared props: play,
 * frame-lock + scrub for a still look, and export the mp4 via the on-device WebCodecs encoder. (Was
 * the DOM-vs-canvas parity harness; the Remotion side was torn down 2026-07-08, so it's canvas-only.)
 * The old route redirects here (legacy-routes.ts) so lab links stay valid.
 */
export default async function ReelCanvasStylesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Reel canvas styles"
        description="Every reel style on the canvas engine, side by side on shared props: play, frame-lock and scrub, export the mp4 on device."
      />
      <ReelCanvasStyles />
    </div>
  );
}
