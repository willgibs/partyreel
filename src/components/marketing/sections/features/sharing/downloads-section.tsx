import { Download } from "lucide-react";
import type { CSSProperties } from "react";

import { MediaSplit } from "@/components/marketing/system/media-split";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { ZipModalDemo } from "./zip-modal-demo";

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
    >
      <div className="mx-auto mt-12 max-w-5xl">
        <MediaSplit media={<ZipModalDemo />} mediaSide="end">
          <Reveal className="flex flex-col gap-4">
            <p {...rise(0)} className="text-pretty text-muted-foreground">
              Save one favorite from the lightbox, or take the whole album home
              at once: Download all bundles everything into a single zip of the
              untouched originals.
            </p>
            <p {...rise(1)} className="text-pretty text-muted-foreground">
              It works for hosts and for guests with access to the album. Pick
              everything, photos only, or videos only. Hosts can fold hidden
              items into the zip, or select shots in the gallery and use
              Download selected for just those.
            </p>
            {/* The two real triggers, quoted. */}
            <div
              {...rise(2)}
              aria-hidden
              className="mt-2 flex flex-wrap items-start gap-x-8 gap-y-4"
            >
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex h-7 w-fit items-center gap-1 rounded-lg border bg-background px-2.5 text-[0.8rem] font-medium">
                  <Download className="size-3.5" /> Download
                </span>
                <MonoCaption>your gallery</MonoCaption>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex h-7 w-fit items-center gap-1.5 px-1 text-sm text-muted-foreground">
                  <Download className="size-4" /> Download all
                </span>
                <MonoCaption>the guest album</MonoCaption>
              </div>
            </div>
          </Reveal>
        </MediaSplit>
      </div>
    </SectionShell>
  );
}
