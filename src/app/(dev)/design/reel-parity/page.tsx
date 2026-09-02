import { requireDesignKey } from "@/lib/design-gate/server";
import { ModeShell } from "../mode-shell";
import { ReelCanvasStyles } from "./parity";

/**
 * THE REEL CANVAS STYLE BROWSER. Every reel style on the canvas engine, on shared props: play,
 * frame-lock + scrub for a still look, and export the mp4 via the on-device WebCodecs encoder. (Was
 * the DOM-vs-canvas parity harness; the Remotion side was torn down 2026-07-08, so it's canvas-only.)
 * Route + file name kept so lab links stay valid.
 */
export default async function ReelCanvasStylesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <ReelCanvasStyles />
    </ModeShell>
  );
}
