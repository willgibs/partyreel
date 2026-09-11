import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /reel section 3 — the WYSIWYG claim (QUIET: type + hairline, standard reveal). The
 * one-draw-function truth stated plainly: the preview and the export come from the same
 * draw, so they are the same pixels. No engine internals, no retired-pipeline mentions.
 */
export function WysiwygSection() {
  return (
    <SectionShell
      id="wysiwyg"
      width="narrow"
      eyebrow="No surprises"
      heading="What you see is what you get."
      subhead="The preview playing in your browser and the video you download come from one draw, pixel for pixel. Restyle it, reorder it, re-roll it: the reel you watch is exactly the reel you keep."
    >
      <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-4">
        <span className="rounded-lg border px-4 py-2">
          <Caption className="text-foreground/80">the preview</Caption>
        </span>
        <span aria-hidden className="font-mono text-lg text-muted-foreground">
          =
        </span>
        <span className="rounded-lg border px-4 py-2">
          <Caption className="text-foreground/80">your video</Caption>
        </span>
      </div>
    </SectionShell>
  );
}
