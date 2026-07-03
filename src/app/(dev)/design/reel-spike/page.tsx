import { requireDesignKey } from "../gate";
import { ReelSpike } from "./spike";

export const metadata = { title: "Reel engine spike" };

/**
 * R2 PLAN-A SPIKE (2026-07-03): prove client-rendered reels on real devices.
 * One draw function renders a representative reel scene (Ken-Burns + crossfade
 * + grade + a 46px-class blur wash + watermark) to a 1080x1920 canvas, twice:
 * live via rAF (the future player) and frame-stepped into a WebCodecs h264
 * encode muxed by mediabunny (the future export). The verdict gate: iPhone
 * Safari must draw at speed AND encode a valid mp4 at >= realtime-ish.
 * Temporary by design; deleted when the engine round lands (or Plan B wins).
 */
export default async function ReelSpikePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  return <ReelSpike />;
}
