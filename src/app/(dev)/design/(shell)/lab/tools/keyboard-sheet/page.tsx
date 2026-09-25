import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { KeyboardBench } from "./keyboard-bench";

/**
 * THE KEYBOARD SHEET (door-flow): the guest door's own shell over a fake album, for walking the
 * software keyboard on a phone or a simulator. Production's responsive Sheet stands on the keyboard
 * while a field is focused (`src/lib/use-keyboard-inset.ts`); this page is where that is seen and
 * measured without an event, a join or an email: the readout inside the sheet says what the
 * viewport and the sheet are doing on every frame.
 */
export default async function KeyboardSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Keyboard sheet"
        description="The door's sheet over a fake album, swapping steps under a software keyboard, with the viewport read out live."
      />
      <KeyboardBench />
    </div>
  );
}
