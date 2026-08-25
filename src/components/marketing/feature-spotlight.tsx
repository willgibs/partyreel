import type { CSSProperties, ReactNode } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import type { FeatureGroup } from "@/lib/constants/features";

/**
 * The /features group spotlight (B2 re-skin; survives per the T2.5 architecture
 * table): one FEATURE_GROUP as a media + copy split on the cinema system layer
 * (SectionShell rhythm, MediaSplit columns, the standard reveal register with
 * per-line stagger). The media visual is passed in so the page keeps a DISTINCT
 * product-real frame per group (feature-visuals.tsx); alternating `mediaSide`
 * gives the page its hand-built rhythm. Icon chips stay mono hairline (the
 * achromatic base); any accent lives inside a visual, never here.
 */
export function FeatureSpotlight({
  group,
  media,
  mediaSide = "left",
  className,
}: {
  group: FeatureGroup;
  media: ReactNode;
  mediaSide?: "left" | "right";
  className?: string;
}) {
  // Per-line stagger slots for the reveal grammar (marketing.css chapter 1).
  let line = 0;
  const mark = () => ({
    "data-mkt-reveal": "",
    style: { "--i": line++ } as CSSProperties,
  });

  return (
    <SectionShell className={className}>
      <MediaSplit
        media={media}
        mediaSide={mediaSide === "right" ? "end" : "start"}
      >
        <Reveal className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow {...mark()}>{group.eyebrow}</Eyebrow>
            <h2
              {...mark()}
              className="font-heading text-3xl text-balance sm:text-4xl"
            >
              {group.heading}
            </h2>
            <p {...mark()} className="text-pretty text-muted-foreground">
              {group.subhead}
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {group.features.map(({ icon: Icon, title, body }) => (
              <li key={title} {...mark()} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                  <Icon className="size-4.5" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-heading text-base font-medium">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
