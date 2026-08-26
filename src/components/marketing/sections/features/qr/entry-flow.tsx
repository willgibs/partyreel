import { Camera, Images, ImageUp } from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /features/qr dark close, part 1: THE ENTRY FLOW. Three mini frames of what a
 * guest actually sees after the scan, quoting the shipped entry modal's exact
 * strings ("You're invited to" / "Add your photos and videos in seconds. No
 * app, no account." / the gallery line) and the uploader's "Add photos &
 * videos" control, stylized to marketing. Fixture family: Maya & Jay.
 */

export function EntryFlow() {
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell
      eyebrow="After the scan"
      heading="What a guest sees."
      subhead="Camera roll to album in under a minute, and nothing to install on the way."
    >
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {/* 01 · The welcome. */}
        <div {...cut(0)} className="flex flex-col gap-3">
          <StepLabel n="01" label="The welcome" />
          <div className="flex flex-1 flex-col rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              You&rsquo;re invited to
            </p>
            <p className="mt-1.5 font-heading text-xl leading-tight text-balance">
              Maya &amp; Jay&rsquo;s Wedding
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Hosted by{" "}
              <span className="font-medium text-foreground">Maya</span>
            </p>
          </div>
        </div>

        {/* 02 · The promise. */}
        <div {...cut(1)} className="flex flex-col gap-3">
          <StepLabel n="02" label="The promise" />
          <div className="flex flex-1 flex-col gap-3.5 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Camera className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Add your photos and videos in seconds. No app, no account.
            </p>
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Images className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Everyone&rsquo;s shots land in one gallery, yours included.
            </p>
          </div>
        </div>

        {/* 03 · The upload. */}
        <div {...cut(2)} className="flex flex-col gap-3">
          <StepLabel n="03" label="The upload" />
          <div className="flex flex-1 flex-col gap-3 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <span className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-dashed text-sm font-medium text-muted-foreground">
              <ImageUp className="size-4" />
              Add photos &amp; videos
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-[4px] bg-muted"
                >
                  {/* The in-flight shot: the thin progress strip the guest
                      uploader shows over an uploading tile. */}
                  {i === 2 && (
                    <span className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-white/20">
                      <span className="block h-full w-[70%] rounded-full bg-white/80" />
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
              Uploading 3 · full quality
            </p>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

function StepLabel({ n, label }: { n: string; label: string }) {
  return (
    <p className="font-mono text-xs tracking-wide text-muted-foreground">
      {n} · {label}
    </p>
  );
}
