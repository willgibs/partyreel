import { requireDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { ReelParity } from "./parity";

/**
 * THE DOM-vs-CANVAS PARITY HARNESS (the client-rendered-reels port, slice 1). Every style ported from
 * the Remotion composition to the canvas engine gets graded HERE: both players on the same ReelProps,
 * frame-locked scrubbing for exact comparison, plus the WebCodecs mp4 export. Will signs off styling
 * parity per style before the composer swaps engines. Permanent while the port runs (13 styles left).
 */
export default async function ReelParityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <ReelParity />
    </ModeShell>
  );
}
