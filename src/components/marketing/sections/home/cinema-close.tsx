import { CtaBand } from "@/components/marketing/system/cta-band";
import { SectionLight } from "@/components/marketing/system/section-light";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

/**
 * LOUD (the loud/quiet map): the Direction-B cinema close as the CtaBand
 * credit variant on the cinema-cut register. "Roll credits on the group
 * chat." is the ruled Direction-B closing line (T1/IA section 12); the golden
 * reelThesis lands in the subhead so the page ends where the arc began, on
 * the reel. The credit is the production line alone (CtaBand says why it
 * carries no Logo: the footer opens on the wordmark a screen below).
 *
 * ★ THE AURORA HERE IS A HORIZON (Will, 2026-09-17: the Aurora's placement is
 * "a mix of all of them... custom and bespoke", composed for the place). This
 * section ends on the footer, whose seam already throws the house light DOWN
 * from their shared line. So the closer takes the light at its BOTTOM edge
 * only, rising from that same line: the two lamps read as one horizon behind
 * the last words of the film, and the top stays dark so the FAQ above ends in
 * quiet. `both` would light the FAQ's border too and put a second bright line
 * on a page that is trying to end.
 */
export function CinemaClose() {
  return (
    <SectionLight placement="bottom" reach="58%">
      <CtaBand
        className="border-t"
        reveal="cinema"
        heading="Roll credits on the group chat."
        subhead={`${GOLDEN_LINES.reelThesis}. Free to host, and guests join with one scan.`}
        demoLink
        credit
      />
    </SectionLight>
  );
}
