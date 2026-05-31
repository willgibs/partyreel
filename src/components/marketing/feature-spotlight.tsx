import type { ReactNode } from "react";

import type { FeatureGroup } from "@/lib/constants/features";
import { cn } from "@/lib/utils";

import { Section } from "./section";

// A 2-col feature spotlight: a media frame on `mediaSide` + the group's heading and
// its features as an icon-chip list. The frame is passed in (`media`) so the page
// picks a DISTINCT frame per group. Alternating `mediaSide` + section background gives
// /features its varied, hand-built rhythm.
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
  return (
    <Section className={className}>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(mediaSide === "right" && "lg:order-2")}>{media}</div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-brand">
              {group.eyebrow}
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {group.heading}
            </h2>
            <p className="text-pretty text-muted-foreground">{group.subhead}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {group.features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="size-5" />
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
        </div>
      </div>
    </Section>
  );
}
