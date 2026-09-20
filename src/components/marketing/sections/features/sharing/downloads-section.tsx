import { Download } from "lucide-react";
import type { CSSProperties } from "react";

import { MediaSplit } from "@/components/marketing/system/media-split";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { ZipModalDemo } from "./zip-modal-demo";

/** The two REAL entry points, with the surface each one lives on. */
const DOWNLOAD_TRIGGERS = [
  { label: "Download", where: "in your gallery" },
  { label: "Download all", where: "in the guest album" },
];

/**
 * Sharing page section 3 (paper): the full-quality truth + THE ZIP moment.
 * The copy states the ratified download facts (originals, no re-compression,
 * photos never watermarked on any tier); the trigger chips quote the two real
 * entry points (the host gallery's "Download" button, the guest album's
 * "Download all"). The interactive modal is the page's signature.
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
      subhead="Downloads are the original files: the same resolution they went in at, no re-compression, and no watermarks on photos, ever."
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
              at once: Download all bundles everything into a single zip of the
              untouched originals.
            </p>
            <p {...rise(5)} className="text-pretty text-muted-foreground">
              It works for hosts and for guests with access to the album. Pick
              everything, photos only, or videos only. Hosts can fold hidden
              items into the zip, or select shots in the gallery and use
              Download selected for just those.
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
                    <Download className="size-3.5" /> {trigger.label}
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
