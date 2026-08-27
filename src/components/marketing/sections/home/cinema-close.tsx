import { CtaBand } from "@/components/marketing/system/cta-band";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

/**
 * LOUD (the loud/quiet map): the Direction-B cinema close as the CtaBand
 * credit variant on the cinema-cut register. "Roll credits on the group
 * chat." is the ruled Direction-B closing line (T1/IA section 12); the golden
 * reelThesis lands in the subhead so the page ends where the arc began, on
 * the reel. The credit renders the Logo lockup + the Geist Mono production
 * line (the real-logo asset stays a ROADMAP line).
 */
export function CinemaClose() {
  return (
    <CtaBand
      className="border-t"
      reveal="cinema"
      heading="Roll credits on the group chat."
      subhead={`${GOLDEN_LINES.reelThesis}. Free to host, and guests join with one scan.`}
      demoLink
      credit
    />
  );
}
