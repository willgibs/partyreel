import { requireDesignKey } from "@/lib/design-gate/server";
import { ModeShell } from "../mode-shell";
import { MotionPlayground } from "./motion-playground";

/**
 * THE MOTION TUNER (S4, relocated here from the prod host event page): the
 * `--tune-*` motion vars are hard to tune against REAL animations (you'd refresh +
 * re-enter the takeover to see each change). Here the tuner drives REPLAYABLE DUMMY
 * animations that use the exact same CSS hooks (globals.css), so you adjust a slider,
 * hit Replay, feel it, and Copy CSS to bake the value as the globals.css default.
 */
export default async function MotionTunerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <MotionPlayground />
    </ModeShell>
  );
}
