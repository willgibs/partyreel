import { CtaBand } from "@/components/marketing/system/cta-band";
import { SectionLight } from "@/components/marketing/system/section-light";

/**
 * LOUD (the loud/quiet map): the home's last invitation, on the CtaBand credit
 * variant and the cinema-cut register. The credit is the production line alone
 * (CtaBand says why it carries no Logo: the footer opens on the wordmark a
 * screen below).
 *
 * ★ ITS OWN WORDS, NEVER THE REEL'S (`reel-story` r2 `close=starts`): the
 * close and the reel's door are "for different purposes" (his r1 note), so the
 * close says only what a last invitation says. The heading rides "starts", the
 * verb he picked for the empty states because it invites the first move (a
 * visitor who signs up meets it again on their first empty album), and the
 * line under it is the two facts a host weighs before starting: free, and one
 * scan.
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
        heading="Your next event starts here."
        subhead="Free to host, and every guest joins with one scan."
        demoLink
        credit
      />
    </SectionLight>
  );
}
