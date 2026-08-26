import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The dark payoff beat after the paper spine: the walkthrough's step six made
 * real. Lights down (the chapter cut back to cinema), one poster-first sample
 * render, one door to /reel. Poster-first means zero video bytes until the
 * visitor asks (the InlineReelPlayer contract).
 */
export function ReelPayoff() {
  return (
    <SectionShell
      eyebrow="The payoff"
      heading="And this is how it ends."
      subhead="A real render from the reel engine, built the same way your event's will be."
      reveal="cinema"
    >
      <Reveal className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4">
        <InlineReelPlayer
          reelId="hero-candidate-02"
          sizes="(min-width: 768px) 768px, 100vw"
        />
        <MonoCaption>Tap to play · rendered by the reel engine</MonoCaption>
        <LearnMoreLink href="/reel">Everything about the reel</LearnMoreLink>
      </Reveal>
    </SectionShell>
  );
}
