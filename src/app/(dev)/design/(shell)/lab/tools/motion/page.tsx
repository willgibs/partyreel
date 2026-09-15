import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
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
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Motion tuner"
        description="The live knobs behind every animated surface, driving replayable specimens on the same CSS hooks as production. Tune, replay, copy the CSS."
      />
      <MotionPlayground />
    </div>
  );
}
