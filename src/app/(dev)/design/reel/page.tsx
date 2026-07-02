import { requireDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { ReelLab } from "./reel-lab";

/**
 * THE REEL MOTION-ENGINE LAB (overhaul Round 1). The reel composition is the single WYSIWYG source
 * (player == Lambda export), so tuning the themes / shuffle / transitions / Ken-Burns HERE — against the
 * real <Reel> in @remotion/player — is exactly what ships. Iterate, get Will's sign-off, then wire to
 * production + deploy-site.
 */
export default async function ReelLabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <ReelLab />
    </ModeShell>
  );
}
