import { MarketingCinemaDirection } from "./marketing-cinema-direction";
import { MarketingEditorialDirection } from "./marketing-editorial-direction";
import { MarketingLiveDirection } from "./marketing-live-direction";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: MARKETING IDENTITY (the T1 direction pick, 2026-07-03). The
 * marketing site is content-complete but pre-V1 identity; the winning
 * direction here becomes the full marketing rebuild. All three run on the
 * LOCKED mono system (zero accent, media is the color, Urbanist 700): what
 * varies is COMPOSITION, TYPE SCALE, MOTION LANGUAGE, and MEDIA TREATMENT.
 *
 * Each direction is a desktop hero + one signature scroll section inside a
 * scrollable browser mock: SCROLL INSIDE EACH FRAME to feel its motion (the
 * reveals are one-way; reload to replay them, or hit Replay on direction 3's
 * stage). Copy is the live site's, tightened per direction's voice; guest
 * surfaces stay the host's event, so marketing is the ONE place the brand
 * speaks at this volume.
 */
export function MarketingIdentityVariants() {
  return (
    <div className="flex flex-col gap-14 py-4">
      <Variant
        n={1}
        name="Editorial gallery"
        rationale="Quiet-luxury magazine: a 12-column paper spread, oversized display type, photos as numbered plates, and a near-black section where media is the light. Motion is slow and confident (drawn hairlines, 1s clip-path unveilings); the brand whispers so the photography speaks."
        framed={false}
      >
        <MarketingEditorialDirection />
      </Variant>

      <Variant
        n={2}
        name="The reel is the hero"
        rationale="Cinema-first and always dark: a full-bleed autoplaying montage IS the hero, with story-style progress, a kinetic headline word that cuts WITH the shots, and a film-strip conveyor. The site borrows the reel's own motion grammar, selling the payoff before a word of copy."
        framed={false}
      >
        <MarketingCinemaDirection />
      </Variant>

      <Variant
        n={3}
        name="Live event energy"
        rationale="The product demos itself: QR pulse, scan beam, tiles flying into a live masonry, toasts and counters ticking, reel card landing (replayable). Playful stagger on a springy curve; the guest-flow story told as a moment you watch happen, not a diagram."
        framed={false}
      >
        <MarketingLiveDirection />
      </Variant>
    </div>
  );
}
