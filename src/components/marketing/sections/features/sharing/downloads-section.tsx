import { Download, ListChecks } from "lucide-react";
import type { CSSProperties } from "react";

import { MediaSplit } from "@/components/marketing/system/media-split";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { ZipModalDemo } from "./zip-modal-demo";

/** The two REAL entry points, with the surface each one lives on and the icon the product draws on it. */
const DOWNLOAD_TRIGGERS = [
  { label: "Download", where: "in your gallery", Icon: Download },
  { label: "Select", where: "in the guest album", Icon: ListChecks },
];

/**
 * Sharing page section 3 (paper): the full-quality truth + THE ZIP moment.
 * The copy states the ratified download facts (originals, no re-compression,
 * photos never watermarked on any tier); the trigger chips quote the two real
 * entry points (the host gallery's "Download" button, which opens Take it home,
 * and the guest album's "Select", whose Save takes a pick home). The
 * interactive modal is the page's signature.
 *
 * The figure beside it is the host's own Take it home (`zip-modal-demo.tsx`'s `TakeHomeFigure`, composed of
 * `take-home-panel.tsx`'s own cards: retired-mocks), so the copy and the picture both say what the product does today.
 */
export function DownloadsSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell
      eyebrow="Downloads"
      heading="Everything comes back out at full quality."
      subhead="The originals come back exactly as they went in: the same resolution, no re-compression, and no watermarks on photos, ever."
      /* THE PAPER CHAPTER'S OPENER (the attention arc): the heading a tier up,
         the hard cut, and real air, so the morning-after desk opens with
         weight; who-gets-what below stays at the body tier and closes quiet. */
      scale="lg"
      reveal="cinema"
      className="pt-28 sm:pt-36"
    >
      {/* R4 body choreography: ONE Reveal over the whole split (the modal used
          to appear statically while only the copy rose), with --i continuing
          after the header's eyebrow/heading/subhead slots (0-2). */}
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <MediaSplit
          media={
            <div {...rise(3)}>
              <ZipModalDemo />
            </div>
          }
          mediaSide="end"
        >
          <div className="flex flex-col gap-4">
            <p {...rise(4)} className="text-pretty text-muted-foreground">
              Save one favorite from the lightbox, or take the whole album home
              at once: Download, in your gallery, opens Take it home, with the
              untouched originals as a single zip beside a lighter phone-size
              set for posting tonight.
            </p>
            <p {...rise(5)} className="text-pretty text-muted-foreground">
              Guests take photos home too. They Select what they want, or All of
              it, then Save: to Photos at phone size, or to Files as a zip of
              the originals. Hosts can fold hidden items in, or select shots in
              the gallery and Download just those.
            </p>
            {/* The two real triggers, quoted. R4 / review B4: one used to be a
                bordered button and the other bare text, which read as a rank
                rather than two entry points, and the captions were bare
                fragments. Same chrome for both, and the captions say WHERE. */}
            <div
              {...rise(6)}
              aria-hidden
              className="mt-2 flex flex-wrap items-start gap-x-8 gap-y-4"
            >
              {DOWNLOAD_TRIGGERS.map((trigger) => (
                <div key={trigger.label} className="flex flex-col gap-1.5">
                  <span className="inline-flex h-7 w-fit items-center gap-1.5 rounded-lg border bg-background px-2.5 text-caption font-medium">
                    <trigger.Icon className="size-3.5" /> {trigger.label}
                  </span>
                  <Caption>{trigger.where}</Caption>
                </div>
              ))}
            </div>
          </div>
        </MediaSplit>
      </Reveal>
    </SectionShell>
  );
}
